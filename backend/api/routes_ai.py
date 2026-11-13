from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, AIConversation, AIMessage
from backend.services.auth_service import get_current_user, get_user_organization
from backend.services.entitlement_service import entitlement_service
from backend.services.ai_copilot_service import ai_copilot_service

router = APIRouter(prefix="/ai", tags=["FALCONZ AI Intelligence Center"])

class ChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None
    drone_id: Optional[str] = None

class MissionAdvisorRequest(BaseModel):
    duration_minutes: float = 30.0
    profile: str = "EXTENDED_LOITER"
    ambient_temp_c: float = 30.0
    altitude_m: float = 120.0

@router.post("/copilot/chat")
def copilot_chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    
    # Check quota entitlement
    entitlement_service.check_and_increment_usage(org, "ai_query", db)

    # Find or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == req.conversation_id,
            AIConversation.org_id == org.id
        ).first()

    if not conv:
        conv = AIConversation(
            user_id=user.id,
            org_id=org.id,
            drone_id=req.drone_id,
            title=req.prompt[:50] + "..." if len(req.prompt) > 50 else req.prompt
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save User message
    user_msg = AIMessage(
        conversation_id=conv.id,
        sender="USER",
        content=req.prompt
    )
    db.add(user_msg)
    db.commit()

    # Load history
    history = [
        {"sender": m.sender, "content": m.content}
        for m in conv.messages[-6:]
    ]

    # Generate Copilot response using real telemetry
    result = ai_copilot_service.generate_copilot_response(req.prompt, history)

    # Save Copilot message
    ai_msg = AIMessage(
        conversation_id=conv.id,
        sender="COPILOT",
        content=result["response"],
        evidence=result.get("evidence", {}),
        root_cause=result.get("root_cause"),
        severity=result.get("severity"),
        confidence_pct=result.get("confidence_pct"),
        recommended_actions=result.get("recommended_actions", [])
    )
    db.add(ai_msg)
    db.commit()

    return {
        "conversation_id": conv.id,
        "message_id": ai_msg.id,
        "response": result["response"],
        "evidence": result.get("evidence", {}),
        "root_cause": result.get("root_cause"),
        "severity": result.get("severity"),
        "confidence_pct": result.get("confidence_pct"),
        "recommended_actions": result.get("recommended_actions", []),
        "created_at": ai_msg.created_at
    }

@router.get("/copilot/conversations")
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    convs = db.query(AIConversation).filter(
        AIConversation.org_id == org.id
    ).order_by(AIConversation.updated_at.desc()).all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": len(c.messages)
        }
        for c in convs
    ]

@router.get("/copilot/conversations/{conversation_id}")
def get_conversation_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.org_id == org.id
    ).first()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "content": m.content,
                "evidence": m.evidence,
                "root_cause": m.root_cause,
                "severity": m.severity,
                "confidence_pct": m.confidence_pct,
                "recommended_actions": m.recommended_actions,
                "created_at": m.created_at
            }
            for m in conv.messages
        ]
    }

@router.post("/copilot/conversations/new")
def new_conversation(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    conv = AIConversation(
        user_id=user.id,
        org_id=org.id,
        title="New Propulsion Diagnostic"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": conv.id, "title": conv.title, "created_at": conv.created_at}

@router.get("/fleet/intelligence")
def get_fleet_intelligence(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    return ai_copilot_service.analyze_fleet_health(org.id, db)

@router.post("/mission/advisor")
def get_mission_advice(
    req: MissionAdvisorRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ai_copilot_service.assess_mission_feasibility(
        duration_minutes=req.duration_minutes,
        profile=req.profile,
        ambient_temp_c=req.ambient_temp_c,
        altitude_m=req.altitude_m
    )

@router.get("/models/intelligence")
def get_models_intelligence(
    user: User = Depends(get_current_user)
):
    return ai_copilot_service.get_model_intelligence_stats()

@router.get("/usage")
def get_ai_usage_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from backend.database.models import UsageRecord, SubscriptionPlan
    from datetime import datetime
    org = get_user_organization(user, db)
    plan = entitlement_service.get_organization_plan(org, db)
    period = datetime.utcnow().strftime("%Y-%m")

    usage = db.query(UsageRecord).filter(
        UsageRecord.org_id == org.id,
        UsageRecord.period_month == period
    ).first()

    queries_used = usage.ai_queries_used if usage else 0
    reports_used = usage.reports_generated if usage else 0

    return {
        "period": period,
        "plan_name": plan.name,
        "plan_code": plan.code,
        "ai_queries": {
            "used": queries_used,
            "limit": plan.ai_queries_limit,
            "percentage": min(100.0, round((queries_used / max(1, plan.ai_queries_limit)) * 100.0, 1))
        },
        "reports": {
            "used": reports_used,
            "limit": plan.reports_limit,
            "percentage": min(100.0, round((reports_used / max(1, plan.reports_limit)) * 100.0, 1))
        },
        "telemetry_storage_mb": usage.telemetry_storage_mb if usage else 0.0
    }
