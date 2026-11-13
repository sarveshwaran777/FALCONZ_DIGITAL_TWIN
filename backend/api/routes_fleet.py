from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, Drone, FlightSession, SubscriptionPlan
from backend.services.auth_service import get_current_user, get_user_organization
from backend.services.entitlement_service import entitlement_service

router = APIRouter(prefix="/fleet", tags=["Fleet Management & Cloud Flight History"])

class RegisterDroneRequest(BaseModel):
    name: str
    serial_number: str
    frame_type: Optional[str] = "Quadcopter F450"

@router.get("/drones")
def list_drones(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    drones = db.query(Drone).filter(Drone.org_id == org.id).order_by(Drone.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "serial_number": d.serial_number,
            "frame_type": d.frame_type,
            "status": d.status,
            "health_index": d.health_index,
            "total_flight_hours": d.total_flight_hours,
            "battery_level_pct": d.battery_level_pct,
            "last_seen": d.last_seen,
            "created_at": d.created_at
        }
        for d in drones
    ]

@router.post("/drones")
def register_drone(
    req: RegisterDroneRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    plan = entitlement_service.get_organization_plan(org, db)

    # Check drone limit on current plan
    current_count = db.query(Drone).filter(Drone.org_id == org.id).count()
    if current_count >= plan.max_drones:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "PLAN_LIMIT_REACHED",
                "max_drones": plan.max_drones,
                "current_count": current_count,
                "plan_name": plan.name,
                "message": f"{plan.name} supports up to {plan.max_drones} drone(s). Upgrade your plan to expand fleet capacity."
            }
        )

    # Check serial uniqueness
    existing = db.query(Drone).filter(Drone.serial_number == req.serial_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Serial number already registered.")

    new_drone = Drone(
        org_id=org.id,
        name=req.name,
        serial_number=req.serial_number,
        frame_type=req.frame_type,
        status="ONLINE",
        health_index=98.5,
        total_flight_hours=0.0,
        battery_level_pct=100.0
    )
    db.add(new_drone)
    db.commit()
    db.refresh(new_drone)

    return {
        "status": "SUCCESS",
        "message": f"Drone '{new_drone.name}' registered to {org.name}.",
        "drone": {
            "id": new_drone.id,
            "name": new_drone.name,
            "serial_number": new_drone.serial_number,
            "frame_type": new_drone.frame_type,
            "status": new_drone.status,
            "health_index": new_drone.health_index
        }
    }

@router.get("/drones/{drone_id}")
def get_drone_detail(
    drone_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    drone = db.query(Drone).filter(Drone.id == drone_id, Drone.org_id == org.id).first()
    if not drone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

    sessions = db.query(FlightSession).filter(FlightSession.drone_id == drone.id).order_by(FlightSession.start_time.desc()).limit(10).all()

    return {
        "id": drone.id,
        "name": drone.name,
        "serial_number": drone.serial_number,
        "frame_type": drone.frame_type,
        "status": drone.status,
        "health_index": drone.health_index,
        "total_flight_hours": drone.total_flight_hours,
        "battery_level_pct": drone.battery_level_pct,
        "last_seen": drone.last_seen,
        "recent_sessions": [
            {
                "id": s.id,
                "session_name": s.session_name,
                "duration_min": round(s.duration_sec / 60.0, 1),
                "max_rpm": s.max_rpm,
                "max_temp_c": s.max_temp_c,
                "min_health_idx": s.min_health_idx,
                "status": s.status,
                "date": s.created_at
            }
            for s in sessions
        ]
    }

@router.get("/history")
def get_cloud_flight_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    sessions = db.query(FlightSession).filter(
        FlightSession.org_id == org.id
    ).order_by(FlightSession.start_time.desc()).all()

    return [
        {
            "id": s.id,
            "drone_id": s.drone_id,
            "drone_name": s.drone.name if s.drone else "Falcon-X1",
            "session_name": s.session_name,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_sec": s.duration_sec,
            "max_rpm": s.max_rpm,
            "max_current_a": s.max_current_a,
            "max_temp_c": s.max_temp_c,
            "max_vib_g": s.max_vib_g,
            "min_health_idx": s.min_health_idx,
            "anomalies_count": s.detected_anomalies_count,
            "status": s.status,
            "created_at": s.created_at
        }
        for s in sessions
    ]
