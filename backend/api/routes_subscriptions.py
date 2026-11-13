from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, SubscriptionPlan, Subscription, UsageRecord, AuditLog
from backend.services.auth_service import get_current_user, get_user_organization

router = APIRouter(prefix="/subscriptions", tags=["Subscription & Plans"])

@router.get("/plans")
def list_subscription_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    # Order: FREE, STARTER, PROFESSIONAL, ENTERPRISE
    order_map = {"FREE": 1, "STARTER": 2, "PROFESSIONAL": 3, "ENTERPRISE": 4}
    sorted_plans = sorted(plans, key=lambda x: order_map.get(x.code, 99))
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "price_monthly_inr": p.price_monthly_inr,
            "price_yearly_inr": p.price_yearly_inr,
            "description": p.description,
            "max_drones": p.max_drones,
            "ai_queries_limit": p.ai_queries_limit,
            "reports_limit": p.reports_limit,
            "history_retention_days": p.history_retention_days,
            "features": p.features or []
        }
        for p in sorted_plans
    ]

@router.get("/current")
def get_current_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    sub = db.query(Subscription).filter(Subscription.org_id == org.id).order_by(Subscription.created_at.desc()).first()
    plan_code = sub.plan_code if sub else (org.plan_code or "FREE")
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    
    # Fetch current month usage
    current_period = datetime.utcnow().strftime("%Y-%m")
    usage = db.query(UsageRecord).filter(
        UsageRecord.org_id == org.id,
        UsageRecord.period_month == current_period
    ).first()

    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "slug": org.slug
        },
        "plan": {
            "id": plan.id if plan else None,
            "name": plan.name if plan else "FalconZ Free",
            "code": plan.code if plan else "FREE",
            "price_monthly_inr": plan.price_monthly_inr if plan else 0.0,
            "price_yearly_inr": plan.price_yearly_inr if plan else 0.0,
            "max_drones": plan.max_drones if plan else 1,
            "ai_queries_limit": plan.ai_queries_limit if plan else 15,
            "reports_limit": plan.reports_limit if plan else 2,
            "history_retention_days": plan.history_retention_days if plan else 7,
            "features": plan.features if plan else []
        },
        "subscription": {
            "id": sub.id if sub else None,
            "status": sub.status if sub else "ACTIVE",
            "billing_cycle": sub.billing_cycle if sub else "MONTHLY",
            "start_date": sub.start_date if sub else datetime.utcnow(),
            "end_date": sub.end_date if sub else None,
            "auto_renew": sub.auto_renew if sub else False
        },
        "usage": {
            "period": current_period,
            "ai_queries_used": usage.ai_queries_used if usage else 0,
            "ai_queries_limit": plan.ai_queries_limit if plan else 15,
            "reports_generated": usage.reports_generated if usage else 0,
            "reports_limit": plan.reports_limit if plan else 2,
            "telemetry_storage_mb": usage.telemetry_storage_mb if usage else 0.0
        }
    }

@router.post("/cancel")
def cancel_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    sub = db.query(Subscription).filter(Subscription.org_id == org.id).first()
    if not sub or sub.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active paid subscription found.")

    sub.auto_renew = False
    sub.status = "CANCELLED"
    db.add(AuditLog(
        user_id=user.id,
        org_id=org.id,
        action="SUBSCRIPTION_CANCELLED",
        resource="subscription",
        details={"plan_code": sub.plan_code}
    ))
    db.commit()
    return {"status": "SUCCESS", "message": "Subscription cancelled. Access will remain active until the end of the billing period."}
