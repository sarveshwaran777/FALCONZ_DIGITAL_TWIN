from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import (
    User, Organization, SubscriptionPlan, Subscription, PaymentTransaction,
    Drone, AuditLog, UsageRecord
)
from backend.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Super Admin Control Center"])

class UpdatePlanRequest(BaseModel):
    price_monthly_inr: Optional[float] = None
    price_yearly_inr: Optional[float] = None
    max_drones: Optional[int] = None
    ai_queries_limit: Optional[int] = None
    reports_limit: Optional[int] = None
    history_retention_days: Optional[int] = None
    is_active: Optional[bool] = None

class UpdateUserRoleRequest(BaseModel):
    role: str  # SUPER_ADMIN, ORG_ADMIN, ENGINEER, TECHNICIAN, VIEWER

@router.get("/metrics")
def get_admin_metrics(
    user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "ACTIVE").all()
    free_users = sum(1 for s in active_subscriptions if s.plan_code == "FREE")
    paid_subscribers = len(active_subscriptions) - free_users

    # Calculate MRR & ARR from active paid subscriptions
    mrr = 0.0
    arr = 0.0
    plans = {p.code: p for p in db.query(SubscriptionPlan).all()}
    for s in active_subscriptions:
        p = plans.get(s.plan_code)
        if p and p.code != "FREE":
            if s.billing_cycle == "YEARLY":
                mrr += (p.price_yearly_inr / 12.0)
                arr += p.price_yearly_inr
            else:
                mrr += p.price_monthly_inr
                arr += (p.price_monthly_inr * 12.0)

    transactions = db.query(PaymentTransaction).all()
    successful_tx = sum(1 for t in transactions if t.status == "SUCCESS")
    failed_tx = sum(1 for t in transactions if t.status == "FAILED")

    total_drones = db.query(Drone).count()
    active_orgs = db.query(Organization).count()

    total_ai_queries = sum(u.ai_queries_used for u in db.query(UsageRecord).all())

    return {
        "total_users": total_users,
        "paid_subscribers": paid_subscribers,
        "free_users": free_users,
        "monthly_recurring_revenue_inr": round(mrr, 2),
        "annual_recurring_revenue_inr": round(arr, 2),
        "total_transactions": len(transactions),
        "successful_payments": successful_tx,
        "failed_payments": failed_tx,
        "total_registered_drones": total_drones,
        "active_organizations": active_orgs,
        "total_ai_queries_processed": total_ai_queries
    }

@router.get("/users")
def list_all_users(
    user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    req: UpdateUserRoleRequest,
    admin: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target_user.role = req.role
    db.commit()
    return {"status": "SUCCESS", "message": f"Updated role for {target_user.email} to {req.role}"}

@router.get("/plans")
def list_plans_admin(
    user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    plans = db.query(SubscriptionPlan).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "price_monthly_inr": p.price_monthly_inr,
            "price_yearly_inr": p.price_yearly_inr,
            "max_drones": p.max_drones,
            "ai_queries_limit": p.ai_queries_limit,
            "reports_limit": p.reports_limit,
            "history_retention_days": p.history_retention_days,
            "is_active": p.is_active,
            "features": p.features
        }
        for p in plans
    ]

@router.put("/plans/{plan_id}")
def update_plan_admin(
    plan_id: str,
    req: UpdatePlanRequest,
    admin: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    if req.price_monthly_inr is not None:
        plan.price_monthly_inr = req.price_monthly_inr
    if req.price_yearly_inr is not None:
        plan.price_yearly_inr = req.price_yearly_inr
    if req.max_drones is not None:
        plan.max_drones = req.max_drones
    if req.ai_queries_limit is not None:
        plan.ai_queries_limit = req.ai_queries_limit
    if req.reports_limit is not None:
        plan.reports_limit = req.reports_limit
    if req.history_retention_days is not None:
        plan.history_retention_days = req.history_retention_days
    if req.is_active is not None:
        plan.is_active = req.is_active

    db.add(AuditLog(
        user_id=admin.id,
        action="PLAN_UPDATED",
        resource="subscription_plan",
        details={"plan_code": plan.code, "monthly_price": plan.price_monthly_inr}
    ))
    db.commit()
    return {"status": "SUCCESS", "message": f"Plan {plan.name} updated successfully."}

@router.get("/audit-logs")
def get_audit_logs(
    user: User = Depends(require_role(["SUPER_ADMIN"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource": l.resource,
            "details": l.details,
            "created_at": l.created_at
        }
        for l in logs
    ]

