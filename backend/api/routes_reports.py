import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.database.models import User, Organization, AIReport, Drone
from backend.services.auth_service import get_current_user, get_user_organization
from backend.services.entitlement_service import entitlement_service
from backend.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["AI Automated Engineering Reports"])

class GenerateReportRequest(BaseModel):
    report_type: str  # FLIGHT_PERFORMANCE, PROPULSION_HEALTH, MOTOR_FAILURE, PREDICTIVE_MAINTENANCE, RUL_FORECAST, ANOMALY_DETECTION, COMPLETE_DIAGNOSTIC
    title: Optional[str] = None
    drone_id: Optional[str] = None

@router.post("/generate")
def generate_report(
    req: GenerateReportRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    
    # Check quota entitlement
    entitlement_service.check_and_increment_usage(org, "report", db)

    drone = None
    if req.drone_id:
        drone = db.query(Drone).filter(Drone.id == req.drone_id, Drone.org_id == org.id).first()

    report_title = req.title or f"{req.report_type.replace('_', ' ').title()} Report"
    
    report_record = report_service.generate_pdf_report(
        report_type=req.report_type,
        title=report_title,
        org=org,
        user=user,
        drone=drone,
        db=db
    )

    return {
        "status": "SUCCESS",
        "report_id": report_record.id,
        "title": report_record.title,
        "report_type": report_record.report_type,
        "file_size_bytes": report_record.file_size_bytes,
        "download_url": f"/api/reports/{report_record.id}/download",
        "created_at": report_record.created_at
    }

@router.get("")
def list_reports(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = get_user_organization(user, db)
    reports = db.query(AIReport).filter(
        AIReport.org_id == org.id
    ).order_by(AIReport.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "status": r.status,
            "file_size_bytes": r.file_size_bytes,
            "summary": r.summary,
            "download_url": f"/api/reports/{r.id}/download",
            "created_at": r.created_at
        }
        for r in reports
    ]

@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = db.query(AIReport).filter(AIReport.id == report_id).first()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=f"FALCONZ_{report.report_type}_{report.id}.pdf"
    )
