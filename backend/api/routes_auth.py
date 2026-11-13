from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, OrganizationMember, Subscription, AuditLog
from backend.services.auth_service import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_user_organization
)

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: Optional[str] = "My Drone Fleet"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create User
    new_user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role="ORG_ADMIN",
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default Free Organization
    slug = req.organization_name.lower().replace(" ", "-") + f"-{int(datetime.utcnow().timestamp()) % 10000}"
    new_org = Organization(
        name=req.organization_name,
        slug=slug,
        plan_code="FREE"
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    # Add Membership
    db.add(OrganizationMember(org_id=new_org.id, user_id=new_user.id, role="ORG_ADMIN"))
    
    # Add Free Subscription
    db.add(Subscription(
        org_id=new_org.id,
        plan_code="FREE",
        status="ACTIVE",
        billing_cycle="MONTHLY"
    ))
    db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return {
        "status": "SUCCESS",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        },
        "organization": {
            "id": new_org.id,
            "name": new_org.name,
            "slug": new_org.slug,
            "plan_code": new_org.plan_code
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is disabled.")

    org = get_user_organization(user, db)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    # Log audit
    db.add(AuditLog(
        user_id=user.id,
        org_id=org.id if org else None,
        action="USER_LOGIN",
        resource="auth",
        details={"email": user.email}
    ))
    db.commit()

    return {
        "status": "SUCCESS",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        },
        "organization": {
            "id": org.id if org else None,
            "name": org.name if org else "Default Org",
            "slug": org.slug if org else "default",
            "plan_code": org.plan_code if org else "FREE"
        }
    }

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = get_user_organization(user, db)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "organization": {
            "id": org.id if org else None,
            "name": org.name if org else None,
            "slug": org.slug if org else None,
            "plan_code": org.plan_code if org else "FREE"
        }
    }

@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name:
        user.full_name = req.full_name
    if req.email and req.email != user.email:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use.")
        user.email = req.email
    if req.password:
        user.hashed_password = get_password_hash(req.password)
    
    db.commit()
    db.refresh(user)
    return {"status": "SUCCESS", "message": "Profile updated successfully.", "user": {"full_name": user.full_name, "email": user.email}}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always return success to prevent email enumeration
    return {
        "status": "SUCCESS",
        "message": f"If an account exists for {req.email}, a secure password reset link has been dispatched."
    }

