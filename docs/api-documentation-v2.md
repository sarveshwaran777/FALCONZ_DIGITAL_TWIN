# FALCONZ v2.0 REST & WebSocket API Specification

## 1. Overview
The **FALCONZ Digital Twin & SaaS Platform** exposes a high-frequency, low-latency API architecture:
- **Base URL**: `http://127.0.0.1:8000/api`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Live 20Hz Telemetry WebSocket**: `ws://127.0.0.1:8000/ws/telemetry`

---

## 2. Authentication & Profile (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user + creates organization | No |
| `POST` | `/api/auth/login` | Authenticate user; returns JWT token | No |
| `GET` | `/api/auth/me` | Fetch active profile and membership | Yes |
| `PUT` | `/api/auth/profile` | Update user name, email, or password | Yes |
| `POST` | `/api/auth/forgot-password` | Dispatches password reset token | No |

---

## 3. SaaS Subscriptions & Entitlements (`/api/subscriptions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subscriptions/plans` | List available subscription plans and entitlements |
| `GET` | `/api/subscriptions/current` | Active organization subscription, billing period & quotas |
| `POST` | `/api/subscriptions/cancel` | Cancel subscription auto-renewal |

---

## 4. Razorpay Payments & Billing (`/api/payments`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments/create-order` | Create Razorpay order for monthly/yearly plans |
| `POST` | `/api/payments/verify` | Verify cryptographic HMAC-SHA256 signature and activate plan |
| `POST` | `/api/payments/webhook` | Process server-side Razorpay webhook events idempotently |
| `GET` | `/api/payments/history` | List complete transaction history |
| `GET` | `/api/payments/invoices` | List GST tax invoices |

---

## 5. FALCONZ AI Intelligence Center (`/api/ai`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/copilot/chat` | Conversational query grounded in live 20Hz telemetry & physics |
| `GET` | `/api/ai/copilot/conversations` | List user conversation threads |
| `GET` | `/api/ai/copilot/conversations/{id}` | Retrieve messages and telemetry evidence for thread |
| `POST` | `/api/ai/copilot/conversations/new` | Initialize clean diagnostic chat session |
| `GET` | `/api/ai/fleet/intelligence` | Fleet health rankings, recurring failure modes & risk ratings |
| `POST` | `/api/ai/mission/advisor` | Physics-informed energy consumption and feasibility analysis |
| `GET` | `/api/ai/models/intelligence` | Validated ML accuracy and F1 metrics from `metrics.json` |
| `GET` | `/api/ai/usage` | Consumption metrics against monthly plan quota |

---

## 6. Automated PDF Reports (`/api/reports`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reports/generate` | Autonomous ReportLab PDF generation (7 certified report types) |
| `GET` | `/api/reports` | List generated organization reports |
| `GET` | `/api/reports/{id}/download` | Stream and download certified PDF document |

---

## 7. Fleet & Cloud Blackbox (`/api/fleet`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fleet/drones` | List registered fleet aircraft |
| `POST` | `/api/fleet/drones` | Register new aircraft (validated against plan limits) |
| `GET` | `/api/fleet/drones/{id}` | Detailed aircraft diagnostics and recent flight logs |
| `GET` | `/api/fleet/history` | Cloud flight session blackbox records |

---

## 8. Organization & RBAC (`/api/organizations`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/organizations/current` | Active organization metadata |
| `GET` | `/api/organizations/members` | Team roster and assigned roles |
| `POST` | `/api/organizations/invite` | Invite engineer/technician to organization |
| `DELETE` | `/api/organizations/members/{id}` | Revoke member access |

---

## 9. Super Admin Control (`/api/admin`)

| Method | Endpoint | Description | Permissions |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | MRR, ARR, active subscribers, and platform stats | `SUPER_ADMIN` |
| `GET` | `/api/admin/users` | List all registered platform users | `SUPER_ADMIN` |
| `PUT` | `/api/admin/users/{id}/role` | Override user role permissions | `SUPER_ADMIN` |
| `GET` | `/api/admin/plans` | Inspect plan parameters | `SUPER_ADMIN` |
| `PUT` | `/api/admin/plans/{id}` | Modify plan pricing and quotas | `SUPER_ADMIN` |
| `GET` | `/api/admin/audit-logs` | Comprehensive security audit log | `SUPER_ADMIN` |
