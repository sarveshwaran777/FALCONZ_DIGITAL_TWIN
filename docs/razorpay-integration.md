# Razorpay Payment Gateway Integration Guide

## 1. Overview
FALCONZ integrates **Razorpay** as the primary payment gateway for Indian commercial SaaS customers, supporting UPI, Debit/Credit Cards, and Net Banking.

---

## 2. Security Architecture

1. **Zero Secret Exposure**:
   - `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` reside strictly on the backend.
   - Frontend only receives the public `RAZORPAY_KEY_ID`.
2. **Server-Side Verification**:
   - Upgrades are never granted based solely on frontend callbacks.
   - The backend validates the cryptographic HMAC-SHA256 signature:
     $$\text{signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
3. **Idempotent Webhooks**:
   - All inbound events are logged in `payment_webhook_events`.
   - Repeated deliveries of the same `event_id` are rejected gracefully without double-crediting.

---

## 3. Configuration & Environment Variables

```bash
# In backend/.env or system environment
RAZORPAY_KEY_ID="rzp_test_falconz_2026"
RAZORPAY_KEY_SECRET="falconz_secret_mock_test_key_123"
RAZORPAY_WEBHOOK_SECRET="falconz_webhook_secret_key_456"
```

---

## 4. Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Operator / Engineer
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant RZP as Razorpay Gateway
    participant DB as SQLite / PostgreSQL

    User->>UI: Selects Plan & clicks "Upgrade"
    UI->>API: POST /api/payments/create-order {plan_code, billing_cycle}
    API->>DB: Record PaymentTransaction (Status: CREATED)
    API-->>UI: Returns {order_id, amount_paise, key_id, currency}
    UI->>RZP: Open Razorpay Checkout Modal
    User->>RZP: Completes Payment (UPI / Card / Netbanking)
    RZP-->>UI: Returns {razorpay_order_id, razorpay_payment_id, razorpay_signature}
    UI->>API: POST /api/payments/verify {order_id, payment_id, signature}
    API->>API: Compute expected HMAC-SHA256 signature
    alt Signature Valid
        API->>DB: Update PaymentTransaction (Status: SUCCESS)
        API->>DB: Update Organization.plan_code & Subscription (ACTIVE)
        API->>DB: Generate Tax Invoice (18% GST)
        API-->>UI: 200 OK {status: SUCCESS, message: "Upgraded!"}
        UI-->>User: Success Notification & Unlocks Features
    else Signature Invalid
        API-->>UI: 400 Bad Request {error: "Invalid cryptographic signature"}
    end
```

---

## 5. Webhook Handling
- **Endpoint**: `POST /api/payments/webhook`
- **Header**: `x-razorpay-signature`
- **Supported Events**:
  - `payment.captured` $\to$ Marks transaction as `SUCCESS`.
  - `payment.failed` $\to$ Logs error code and failure description.
  - `subscription.cancelled` $\to$ Marks active subscription as `CANCELLED`.

