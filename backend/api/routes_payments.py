from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, PaymentTransaction, Invoice, AuditLog
from backend.services.auth_service import get_current_user, get_user_organization
from backend.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Razorpay Payments & Invoices"])

class CreateOrderRequest(BaseModel):
    plan_code: str  # STARTER, PROFESSIONAL, ENTERPRISE
    billing_cycle: Optional[str] = "MONTHLY"  # MONTHLY or YEARLY

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: Optional[str] = "upi"

@router.post("/create-order")
def create_payment_order(
    req: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    order_data = payment_service.create_order(
        org=org,
        plan_code=req.plan_code.upper(),
        billing_cycle=req.billing_cycle.upper(),
        user=user,
        db=db
    )
    return order_data

@router.post("/verify")
def verify_payment(
    req: VerifyPaymentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    result = payment_service.process_successful_payment(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature,
        payment_method=req.payment_method,
        db=db
    )

    db.add(AuditLog(
        user_id=user.id,
        org_id=org.id,
        action="PAYMENT_VERIFIED",
        resource="payment",
        details={"order_id": req.razorpay_order_id, "payment_id": req.razorpay_payment_id}
    ))
    db.commit()

    return result

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not x_razorpay_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Razorpay signature header")
    
    raw_body = await request.body()
    result = payment_service.process_webhook(raw_body, x_razorpay_signature, db)
    return result

@router.get("/history")
def get_payment_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    transactions = db.query(PaymentTransaction).filter(
        PaymentTransaction.org_id == org.id
    ).order_by(PaymentTransaction.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "order_id": t.razorpay_order_id,
            "payment_id": t.razorpay_payment_id,
            "amount_inr": t.amount_inr,
            "currency": t.currency,
            "plan_code": t.plan_code,
            "billing_cycle": t.billing_cycle,
            "status": t.status,
            "payment_method": t.payment_method,
            "created_at": t.created_at
        }
        for t in transactions
    ]

@router.get("/invoices")
def get_invoices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    invoices = db.query(Invoice).filter(
        Invoice.org_id == org.id
    ).order_by(Invoice.created_at.desc()).all()

    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "amount_inr": inv.amount_inr,
            "tax_amount_inr": inv.tax_amount_inr,
            "plan_name": inv.plan_name,
            "billing_period_start": inv.billing_period_start,
            "billing_period_end": inv.billing_period_end,
            "status": inv.status,
            "created_at": inv.created_at
        }
        for inv in invoices
    ]
