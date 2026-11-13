from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.database.models import Organization, SubscriptionPlan, Subscription, UsageRecord, User

PLAN_HIERARCHY = {
    "FREE": 1,
    "STARTER": 2,
    "PROFESSIONAL": 3,
    "ENTERPRISE": 4
}

FEATURE_MIN_PLANS = {
    "basic_telemetry": "FREE",
    "basic_digital_twin": "FREE",
    "ai_copilot": "FREE",  # Available on Free with quota limit
    "ai_reports": "FREE",  # Available on Free with quota limit
    "data_export_csv": "STARTER",
    "multi_drone_fleet": "STARTER",
    "rul_forecast": "PROFESSIONAL",
    "predictive_maintenance": "PROFESSIONAL",
    "mission_intelligence": "PROFESSIONAL",
    "rest_api_access": "PROFESSIONAL",
    "custom_ai_models": "ENTERPRISE",
    "team_management_advanced": "ENTERPRISE"
}

class EntitlementService:
    @staticmethod
    def get_organization_plan(org: Organization, db: Session) -> SubscriptionPlan:
        # Check active subscription
        sub = db.query(Subscription).filter(
            Subscription.org_id == org.id,
            Subscription.status == "ACTIVE"
        ).first()
        plan_code = sub.plan_code if sub else (org.plan_code or "FREE")
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
        if not plan:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "FREE").first()
        return plan

    @staticmethod
    def check_feature_access(org: Organization, feature_key: str, db: Session) -> bool:
        plan = EntitlementService.get_organization_plan(org, db)
        min_plan = FEATURE_MIN_PLANS.get(feature_key, "FREE")
        
        current_level = PLAN_HIERARCHY.get(plan.code, 1)
        required_level = PLAN_HIERARCHY.get(min_plan, 1)
        
        return current_level >= required_level

    @staticmethod
    def require_feature(feature_key: str):
        def dependency(user: User, db: Session):
            from backend.services.auth_service import get_user_organization
            if user.role == "SUPER_ADMIN":
                return True
            org = get_user_organization(user, db)
            has_access = EntitlementService.check_feature_access(org, feature_key, db)
            if not has_access:
                min_plan = FEATURE_MIN_PLANS.get(feature_key, "PROFESSIONAL")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "PLAN_RESTRICTION",
                        "feature": feature_key,
                        "required_plan": min_plan,
                        "current_plan": org.plan_code,
                        "message": f"Upgrade to FalconZ {min_plan.capitalize()} to access this premium feature."
                    }
                )
            return True
        return dependency

    @staticmethod
    def check_and_increment_usage(org: Organization, usage_type: str, db: Session) -> Dict[str, Any]:
        """
        Tracks monthly usage for AI queries and reports against plan quota.
        """
        plan = EntitlementService.get_organization_plan(org, db)
        period = datetime.utcnow().strftime("%Y-%m")
        
        record = db.query(UsageRecord).filter(
            UsageRecord.org_id == org.id,
            UsageRecord.period_month == period
        ).first()
        
        if not record:
            record = UsageRecord(org_id=org.id, period_month=period)
            db.add(record)
            db.commit()
            db.refresh(record)

        if usage_type == "ai_query":
            limit = plan.ai_queries_limit
            used = record.ai_queries_used
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "QUOTA_EXCEEDED",
                        "resource": "ai_queries",
                        "used": used,
                        "limit": limit,
                        "plan": plan.name,
                        "message": f"Monthly AI query limit of {limit} reached for {plan.name}. Upgrade your plan for higher limits."
                    }
                )
            record.ai_queries_used += 1
            db.commit()
            return {"used": record.ai_queries_used, "limit": limit, "remaining": limit - record.ai_queries_used}

        elif usage_type == "report":
            limit = plan.reports_limit
            used = record.reports_generated
            if used >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "QUOTA_EXCEEDED",
                        "resource": "reports",
                        "used": used,
                        "limit": limit,
                        "plan": plan.name,
                        "message": f"Monthly report limit of {limit} reached for {plan.name}. Upgrade your plan to generate more reports."
                    }
                )
            record.reports_generated += 1
            db.commit()
            return {"used": record.reports_generated, "limit": limit, "remaining": limit - record.reports_generated}

        return {}

entitlement_service = EntitlementService()

