import time
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from backend.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="ENGINEER")  # SUPER_ADMIN, ORG_ADMIN, ENGINEER, TECHNICIAN, VIEWER
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="user")
    reports = relationship("AIReport", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    plan_code = Column(String(50), default="FREE")  # FREE, STARTER, PROFESSIONAL, ENTERPRISE
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    drones = relationship("Drone", back_populates="organization", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="organization", cascade="all, delete-orphan")
    transactions = relationship("PaymentTransaction", back_populates="organization")
    reports = relationship("AIReport", back_populates="organization")
    invoices = relationship("Invoice", back_populates="organization")
    usage_records = relationship("UsageRecord", back_populates="organization")


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="ENGINEER")  # ORG_ADMIN, ENGINEER, TECHNICIAN, VIEWER
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="memberships")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)  # FREE, STARTER, PROFESSIONAL, ENTERPRISE
    price_monthly_inr = Column(Float, default=0.0)
    price_yearly_inr = Column(Float, default=0.0)
    description = Column(Text, default="")
    max_drones = Column(Integer, default=1)
    ai_queries_limit = Column(Integer, default=10)
    reports_limit = Column(Integer, default=2)
    history_retention_days = Column(Integer, default=7)
    features = Column(JSON, default=list)  # List of feature flag strings
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    plan_code = Column(String(50), nullable=False, default="FREE")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, PENDING, EXPIRED, CANCELLED
    billing_cycle = Column(String(20), default="MONTHLY")  # MONTHLY, YEARLY
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_subscription_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="subscriptions")


class FeatureEntitlement(Base):
    __tablename__ = "feature_entitlements"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_code = Column(String(50), nullable=False, index=True)
    feature_key = Column(String(100), nullable=False)
    is_enabled = Column(Boolean, default=True)
    limit_value = Column(Integer, nullable=True)
    description = Column(String(255), default="")


class UsageRecord(Base):
    __tablename__ = "usage_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    period_month = Column(String(7), nullable=False, index=True)  # YYYY-MM
    ai_queries_used = Column(Integer, default=0)
    reports_generated = Column(Integer, default=0)
    telemetry_storage_mb = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="usage_records")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    amount_inr = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    plan_code = Column(String(50), nullable=False)
    billing_cycle = Column(String(20), default="MONTHLY")
    status = Column(String(50), default="CREATED")  # CREATED, SUCCESS, FAILED, REFUNDED
    razorpay_order_id = Column(String(100), index=True, nullable=True)
    razorpay_payment_id = Column(String(100), index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    payment_method = Column(String(50), nullable=True)  # upi, card, netbanking
    error_code = Column(String(100), nullable=True)
    error_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="transactions")


class PaymentWebhookEvent(Base):
    __tablename__ = "payment_webhook_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(50), default="PROCESSED")  # PROCESSED, FAILED, IGNORED
    created_at = Column(DateTime, default=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(36), ForeignKey("payment_transactions.id"), nullable=True)
    amount_inr = Column(Float, nullable=False)
    tax_amount_inr = Column(Float, default=0.0)
    plan_name = Column(String(100), nullable=False)
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    status = Column(String(50), default="PAID")
    download_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="invoices")


class Drone(Base):
    __tablename__ = "drones"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    serial_number = Column(String(100), unique=True, index=True, nullable=False)
    frame_type = Column(String(50), default="Quadcopter F450")
    status = Column(String(50), default="ONLINE")  # ONLINE, IN_FLIGHT, MAINTENANCE, OFFLINE
    health_index = Column(Float, default=98.5)
    total_flight_hours = Column(Float, default=12.4)
    last_latitude = Column(Float, default=13.0827)
    last_longitude = Column(Float, default=80.2707)
    last_altitude_m = Column(Float, default=45.0)
    battery_level_pct = Column(Float, default=94.0)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="drones")
    flight_sessions = relationship("FlightSession", back_populates="drone")
    maintenance_records = relationship("MaintenanceRecord", back_populates="drone")


class FlightSession(Base):
    __tablename__ = "flight_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    drone_id = Column(String(36), ForeignKey("drones.id", ondelete="CASCADE"), nullable=False)
    session_name = Column(String(150), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=True)
    duration_sec = Column(Float, default=0.0)
    max_rpm = Column(Float, default=0.0)
    max_current_a = Column(Float, default=0.0)
    max_temp_c = Column(Float, default=0.0)
    max_vib_g = Column(Float, default=0.0)
    min_health_idx = Column(Float, default=100.0)
    detected_anomalies_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")
    file_path_json = Column(String(255), nullable=True)
    file_path_csv = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    drone = relationship("Drone", back_populates="flight_sessions")


class AIConversation(Base):
    __tablename__ = "ai_conversations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    drone_id = Column(String(36), ForeignKey("drones.id"), nullable=True)
    title = Column(String(255), default="Telemetry Health Analysis")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base):
    __tablename__ = "ai_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), default="USER")  # USER, COPILOT
    content = Column(Text, nullable=False)
    evidence = Column(JSON, default=dict)  # Telemetry references (RPM, temp, residuals, etc.)
    root_cause = Column(String(255), nullable=True)
    severity = Column(String(50), nullable=True)  # Nominal, Warning, Critical
    confidence_pct = Column(Float, nullable=True)
    recommended_actions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


class AIReport(Base):
    __tablename__ = "ai_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    drone_id = Column(String(36), ForeignKey("drones.id"), nullable=True)
    report_type = Column(String(100), nullable=False)  # FLIGHT_PERFORMANCE, PROPULSION_HEALTH, FAULT_ANALYSIS, etc.
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="COMPLETED")  # GENERATING, COMPLETED, FAILED
    file_path = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    metrics_snapshot = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="reports")
    user = relationship("User", back_populates="reports")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    drone_id = Column(String(36), ForeignKey("drones.id", ondelete="CASCADE"), nullable=False)
    component = Column(String(100), nullable=False)
    action_type = Column(String(100), nullable=False)  # INSPECTION, REPLACEMENT, CALIBRATION
    description = Column(Text, nullable=False)
    performed_by = Column(String(100), default="Flight Line Technician")
    urgency = Column(String(50), default="ROUTINE")  # ROUTINE, PRE_FLIGHT, IMMEDIATE
    status = Column(String(50), default="COMPLETED")
    performed_at = Column(DateTime, default=datetime.utcnow)

    drone = relationship("Drone", back_populates="maintenance_records")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    action = Column(String(100), nullable=False)  # USER_LOGIN, SUBSCRIPTION_UPGRADED, PLAN_UPDATED, etc.
    resource = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
