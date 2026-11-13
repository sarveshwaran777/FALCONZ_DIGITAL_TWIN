import time
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from backend.database.models import (
    User, Organization, OrganizationMember, SubscriptionPlan, Subscription,
    FeatureEntitlement, Drone, FlightSession, UsageRecord, MaintenanceRecord, Invoice
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_initial_data(db: Session):
    # 1. Seed Subscription Plans
    plans_data = [
        {
            "name": "FalconZ Free",
            "code": "FREE",
            "price_monthly_inr": 0.0,
            "price_yearly_inr": 0.0,
            "description": "Essential Digital Twin & live telemetry for hobbyists and individual engineers.",
            "max_drones": 1,
            "ai_queries_limit": 15,
            "reports_limit": 2,
            "history_retention_days": 7,
            "features": [
                "basic_digital_twin",
                "live_telemetry_10hz",
                "single_drone",
                "basic_flight_history",
                "basic_dashboard_analytics"
            ]
        },
        {
            "name": "FalconZ Starter",
            "code": "STARTER",
            "price_monthly_inr": 499.0,
            "price_yearly_inr": 4999.0,
            "description": "Ideal for small drone operators and commercial inspection pilots.",
            "max_drones": 3,
            "ai_queries_limit": 100,
            "reports_limit": 10,
            "history_retention_days": 30,
            "features": [
                "basic_digital_twin",
                "live_telemetry_10hz",
                "up_to_3_drones",
                "ai_copilot_basic",
                "basic_anomaly_detection",
                "basic_ai_flight_reports",
                "30_day_flight_history",
                "data_export_csv"
            ]
        },
        {
            "name": "FalconZ Professional",
            "code": "PROFESSIONAL",
            "price_monthly_inr": 1499.0,
            "price_yearly_inr": 14999.0,
            "description": "Advanced predictive health intelligence, RUL forecasting & engineering analytics for aerospace teams.",
            "max_drones": 10,
            "ai_queries_limit": 500,
            "reports_limit": 50,
            "history_retention_days": 365,
            "features": [
                "all_starter_features",
                "up_to_10_drones",
                "advanced_ai_copilot",
                "predictive_maintenance_advisory",
                "rul_forecasting_quantiles",
                "ai_automated_engineering_reports",
                "mission_simulator_feasibility",
                "rest_api_access",
                "one_year_flight_history",
                "hardware_mavlink_integration",
                "priority_queue"
            ]
        },
        {
            "name": "FalconZ Enterprise",
            "code": "ENTERPRISE",
            "price_monthly_inr": 4999.0,  # Base rate / custom quote
            "price_yearly_inr": 49999.0,
            "description": "Enterprise-grade fleet intelligence, custom physics/AI models & dedicated integrations for UAV manufacturers.",
            "max_drones": 100,
            "ai_queries_limit": 5000,
            "reports_limit": 500,
            "history_retention_days": 1825,  # 5 years
            "features": [
                "all_professional_features",
                "unlimited_fleet_capacity",
                "organization_team_rbac",
                "custom_ai_models_and_calibration",
                "advanced_fleet_intelligence",
                "custom_erp_hardware_integrations",
                "extended_data_retention_5yr",
                "dedicated_solutions_architect",
                "enterprise_sla"
            ]
        }
    ]

    for p in plans_data:
        existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == p["code"]).first()
        if not existing:
            plan = SubscriptionPlan(**p)
            db.add(plan)
    db.commit()

    # 2. Seed Default Super Admin & Default Organization
    admin_user = db.query(User).filter(User.email == "admin@falconz.aero").first()
    if not admin_user:
        admin_user = User(
            email="admin@falconz.aero",
            full_name="Aerospace Systems Administrator",
            hashed_password=hash_password("Admin@Falconz2026"),
            role="SUPER_ADMIN",
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # Demo Engineer user
    demo_user = db.query(User).filter(User.email == "engineer@falconz.aero").first()
    if not demo_user:
        demo_user = User(
            email="engineer@falconz.aero",
            full_name="Lead Propulsion Engineer",
            hashed_password=hash_password("Falconz@Engineer2026"),
            role="ORG_ADMIN",
            is_active=True,
            is_verified=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # 3. Seed Default Organization
    org = db.query(Organization).filter(Organization.slug == "aeropropulsion-labs").first()
    if not org:
        org = Organization(
            name="AeroPropulsion Labs",
            slug="aeropropulsion-labs",
            plan_code="PROFESSIONAL"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # Add memberships
        db.add(OrganizationMember(org_id=org.id, user_id=admin_user.id, role="ORG_ADMIN"))
        db.add(OrganizationMember(org_id=org.id, user_id=demo_user.id, role="ORG_ADMIN"))
        
        # Add active subscription
        sub = Subscription(
            org_id=org.id,
            plan_code="PROFESSIONAL",
            status="ACTIVE",
            billing_cycle="YEARLY",
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=365),
            razorpay_order_id="order_falconz_seed_001",
            razorpay_payment_id="pay_falconz_seed_001",
            auto_renew=True
        )
        db.add(sub)

        # Seed Usage Record
        current_period = datetime.utcnow().strftime("%Y-%m")
        db.add(UsageRecord(
            org_id=org.id,
            period_month=current_period,
            ai_queries_used=18,
            reports_generated=3,
            telemetry_storage_mb=45.2
        ))

        # 4. Seed Drones for the organization
        drones_data = [
            {
                "name": "Falcon-X1 (Primary Bench Twin)",
                "serial_number": "FLC-F450-SN-001",
                "frame_type": "Quadcopter F450",
                "status": "ONLINE",
                "health_index": 98.5,
                "total_flight_hours": 34.2,
                "battery_level_pct": 92.0,
                "last_latitude": 13.0827,
                "last_longitude": 80.2707,
                "last_altitude_m": 45.0
            },
            {
                "name": "Falcon-X2 (Endurance Scout)",
                "serial_number": "FLC-F450-SN-002",
                "frame_type": "Quadcopter F450",
                "status": "IN_FLIGHT",
                "health_index": 84.0,
                "total_flight_hours": 68.5,
                "battery_level_pct": 68.0,
                "last_latitude": 13.0845,
                "last_longitude": 80.2742,
                "last_altitude_m": 120.0
            },
            {
                "name": "Falcon-Heavy (Hexacopter DAQ)",
                "serial_number": "FLC-HEXA-SN-003",
                "frame_type": "Hexacopter F550",
                "status": "MAINTENANCE",
                "health_index": 62.4,
                "total_flight_hours": 112.0,
                "battery_level_pct": 45.0,
                "last_latitude": 13.0790,
                "last_longitude": 80.2680,
                "last_altitude_m": 0.0
            }
        ]

        created_drones = []
        for d in drones_data:
            drone_obj = Drone(org_id=org.id, **d)
            db.add(drone_obj)
            db.flush()
            created_drones.append(drone_obj)

        # 5. Seed Historical Flight Sessions
        if created_drones:
            now_ts = time.time()
            sessions_data = [
                {
                    "drone_id": created_drones[0].id,
                    "session_name": "SIH_Phase_Verification_Run_01",
                    "start_time": now_ts - 7200,
                    "end_time": now_ts - 5400,
                    "duration_sec": 1800.0,
                    "max_rpm": 6200.0,
                    "max_current_a": 24.5,
                    "max_temp_c": 58.2,
                    "max_vib_g": 0.42,
                    "min_health_idx": 94.0,
                    "detected_anomalies_count": 0,
                    "status": "COMPLETED"
                },
                {
                    "drone_id": created_drones[0].id,
                    "session_name": "Thermal_Stress_Benchmark_Flight",
                    "start_time": now_ts - 28800,
                    "end_time": now_ts - 25200,
                    "duration_sec": 3600.0,
                    "max_rpm": 7100.0,
                    "max_current_a": 34.0,
                    "max_temp_c": 79.4,
                    "max_vib_g": 0.88,
                    "min_health_idx": 74.5,
                    "detected_anomalies_count": 2,
                    "status": "COMPLETED"
                },
                {
                    "drone_id": created_drones[1].id,
                    "session_name": "High_Altitude_Loiter_Test",
                    "start_time": now_ts - 86400,
                    "end_time": now_ts - 82800,
                    "duration_sec": 3600.0,
                    "max_rpm": 6400.0,
                    "max_current_a": 26.2,
                    "max_temp_c": 64.0,
                    "max_vib_g": 0.35,
                    "min_health_idx": 88.0,
                    "detected_anomalies_count": 0,
                    "status": "COMPLETED"
                }
            ]
            for s in sessions_data:
                db.add(FlightSession(org_id=org.id, **s))

            # Seed Maintenance Record
            db.add(MaintenanceRecord(
                drone_id=created_drones[2].id,
                component="Motor 4 - Bearing Raceway",
                action_type="REPLACEMENT",
                description="Replaced 608RS high-speed ceramic bearing following 1X vibration harmonics exceedance.",
                urgency="IMMEDIATE",
                status="COMPLETED"
            ))

            # Seed Sample Invoice
            db.add(Invoice(
                invoice_number="INV-2026-00109",
                org_id=org.id,
                amount_inr=14999.0,
                tax_amount_inr=2699.82,  # 18% GST
                plan_name="FalconZ Professional (Annual)",
                billing_period_start=datetime.utcnow() - timedelta(days=30),
                billing_period_end=datetime.utcnow() + timedelta(days=335),
                status="PAID"
            ))

        db.commit()
