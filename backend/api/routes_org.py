from typing import Dict, Any, List, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, OrganizationMember, AuditLog
from backend.services.auth_service import get_current_user, get_user_organization, get_password_hash

router = APIRouter(prefix="/organizations", tags=["Organization & Team Management"])

class InviteMemberRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "ENGINEER"  # ORG_ADMIN, ENGINEER, TECHNICIAN, VIEWER

@router.get("/current")
def get_current_organization(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "plan_code": org.plan_code,
        "created_at": org.created_at
    }

@router.get("/members")
def list_organization_members(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    memberships = db.query(OrganizationMember).filter(OrganizationMember.org_id == org.id).all()

    return [
        {
            "id": m.id,
            "user_id": m.user_id,
            "email": m.user.email if m.user else "user@falconz.aero",
            "full_name": m.user.full_name if m.user else "Engineer",
            "role": m.role,
            "joined_at": m.created_at
        }
        for m in memberships
    ]

@router.post("/invite")
def invite_member(
    req: InviteMemberRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)

    # Find or create user
    existing_user = db.query(User).filter(User.email == req.email).first()
    if not existing_user:
        existing_user = User(
            email=req.email,
            full_name=req.full_name,
            hashed_password=get_password_hash("FalconzWelcome2026!"),
            role=req.role,
            is_active=True,
            is_verified=True
        )
        db.add(existing_user)
        db.commit()
        db.refresh(existing_user)

    # Check if already a member
    member = db.query(OrganizationMember).filter(
        OrganizationMember.org_id == org.id,
        OrganizationMember.user_id == existing_user.id
    ).first()

    if member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already an organization member.")

    new_member = OrganizationMember(
        org_id=org.id,
        user_id=existing_user.id,
        role=req.role
    )
    db.add(new_member)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Invitation dispatched to {req.email}.",
        "member_id": new_member.id
    }

@router.delete("/members/{member_id}")
def remove_member(
    member_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    member = db.query(OrganizationMember).filter(
        OrganizationMember.id == member_id,
        OrganizationMember.org_id == org.id
    ).first()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.user_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove self from organization")

    db.delete(member)
    db.commit()
    return {"status": "SUCCESS", "message": "Member removed."}

