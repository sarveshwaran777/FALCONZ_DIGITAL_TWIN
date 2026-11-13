import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.session import SessionLocal
from backend.database.models import User, Organization, SubscriptionPlan, Subscription, PaymentTransaction
from backend.services.payment_service import payment_service

client = TestClient(app)

def test_saas_plans_endpoint():
    res = client.get("/api/subscriptions/plans")
    assert res.status_code == 200
    plans = res.json()
    assert len(plans) >= 4
    codes = [p["code"] for p in plans]
    assert "FREE" in codes
    assert "STARTER" in codes
    assert "PROFESSIONAL" in codes
    assert "ENTERPRISE" in codes

def test_auth_registration_and_login():
    import uuid
    email = f"test_pilot_{uuid.uuid4().hex[:8]}@falconz.aero"
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": "PilotPassword123!",
        "full_name": "Test Flight Commander",
        "organization_name": "Autonomous Flight Wing"
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert data["status"] == "SUCCESS"
    assert "access_token" in data
    assert data["organization"]["plan_code"] == "FREE"

    # Test login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": "PilotPassword123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    # Test /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

def test_ai_copilot_real_telemetry():
    res = client.post("/api/ai/copilot/chat", json={
        "prompt": "What is the expected vs actual RPM and is there any bearing degradation?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "evidence" in data
    assert "rpm_actual" in data["evidence"]
    assert "rpm_expected" in data["evidence"]
    assert "confidence_pct" in data

def test_razorpay_order_and_signature_verification():
    # Create Order
    order_res = client.post("/api/payments/create-order", json={
        "plan_code": "PROFESSIONAL",
        "billing_cycle": "YEARLY"
    })
    assert order_res.status_code == 200
    order_data = order_res.json()
    order_id = order_data["order_id"]
    assert order_data["amount_inr"] == 14999.0

    # Test Tampered Signature Rejection
    bad_verify = client.post("/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_fake_123",
        "razorpay_signature": "tampered_fake_signature"
    })
    assert bad_verify.status_code == 400

    # Test Valid Signature Success
    payment_id = "pay_valid_razorpay_999"
    valid_sig = payment_service.generate_test_signature(order_id, payment_id)

    good_verify = client.post("/api/payments/verify", json={
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": valid_sig,
        "payment_method": "upi"
    })
    assert good_verify.status_code == 200
    assert good_verify.json()["status"] == "SUCCESS"
    assert good_verify.json()["plan_code"] == "PROFESSIONAL"

def test_pdf_report_generation():
    res = client.post("/api/reports/generate", json={
        "report_type": "PROPULSION_HEALTH",
        "title": "Automated Stator Health Audit"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "report_id" in data
    assert data["download_url"].startswith("/api/reports/")

    # Test download endpoint
    dl_res = client.get(data["download_url"])
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"

def test_mission_advisor_feasibility():
    res = client.post("/api/ai/mission/advisor", json={
        "duration_minutes": 25.0,
        "profile": "EXTENDED_LOITER",
        "ambient_temp_c": 32.0,
        "altitude_m": 150.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "estimated_power_draw_w" in data
    assert "is_feasible" in data
    assert "recommended_throttle_envelope" in data
