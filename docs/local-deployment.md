# FALCONZ Local Deployment & Run Instructions

## 1. Prerequisites
- **Python**: 3.10+ (Verified on Python 3.14)
- **Node.js**: 18+ (Verified on Node v24)
- **Package Managers**: `npm`, `pip`

---

## 2. Quick Start

### Step 1: Clone Repository
```powershell
git clone https://github.com/sarveshwaran777/FALCONZ_DIGITAL_TWIN.git
cd FALCONZ_DIGITAL_TWIN
```

### Step 2: Backend Setup & Execution
```powershell
# 1. Run database initialization & verify tests (All 30 tests pass)
python -m pytest -v tests/

# 2. Launch FastAPI backend streaming server (Port 8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- Interactive API Docs: `http://127.0.0.1:8000/docs`
- Root Healthcheck: `http://127.0.0.1:8000/`
- WebSocket Telemetry: `ws://127.0.0.1:8000/ws/telemetry`

### Step 3: Frontend Setup & Execution
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
- Access GCS Web Station: `http://localhost:5173`

---

## 3. Default Credentials

| User Type | Email | Password | Role |
|---|---|---|---|
| **Super Admin** | `admin@falconz.aero` | `Admin@Falconz2026` | `SUPER_ADMIN` |
| **Lead Engineer** | `engineer@falconz.aero` | `Falconz@Engineer2026` | `ORG_ADMIN` |

---

## 4. Razorpay Test Payments

1. Navigate to **Plans & Pricing** (`http://localhost:5173`) from the sidebar.
2. Select **Starter** or **Professional** and click **Upgrade Now**.
3. In test mode, Razorpay opens in sandbox mode:
   - For UPI: Enter test UPI ID `success@razorpay`.
   - For Cards: Enter test card `4111 1111 1111 1111`, any future date and OTP `123456`.
4. Upon signature verification, the backend automatically transitions your organization to the selected tier and issues a GST tax invoice!

