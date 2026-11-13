import time
import asyncio
import threading
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.telemetry.schema import (
    FullSystemState, CanonicalTelemetry, TelemetrySource, ConnectionStatus, ScenarioType
)
from backend.telemetry.validator import validator
from backend.telemetry.buffer_store import buffer_store
from backend.hardware.hal_manager import hal_manager
from backend.digital_twin.residual_engine import residual_engine
from backend.intelligence.feature_pipeline import feature_pipeline
from backend.intelligence.anomaly_detector import anomaly_detector
from backend.intelligence.fault_classifier import fault_classifier
from backend.intelligence.rul_predictor import rul_predictor
from backend.intelligence.health_index import health_calculator
from backend.intelligence.explainable_ai import xai_engine
from backend.safety.safety_guard import safety_guard
from backend.safety.control_modes import control_manager
from simulator.telemetry_generator import telemetry_generator
from backend.api.websocket_hub import websocket_hub

# API Routers
from backend.api.routes_telemetry import router as telemetry_router
from backend.api.routes_digital_twin import router as dt_router
from backend.api.routes_intelligence import router as intel_router
from backend.api.routes_mission import router as mission_router
from backend.api.routes_hardware import router as hardware_router
from backend.api.routes_safety import router as safety_router
from backend.api.routes_demo import router as demo_router
from backend.api.routes_auth import router as auth_router
from backend.api.routes_subscriptions import router as subscription_router
from backend.api.routes_payments import router as payment_router
from backend.api.routes_ai import router as ai_router
from backend.api.routes_reports import router as reports_router
from backend.api.routes_fleet import router as fleet_router
from backend.api.routes_org import router as org_router
from backend.api.routes_admin import router as admin_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("falconz_backend")

# Global event loop handle for background thread broadcast
_async_loop = None

from backend.telemetry.recorder import telemetry_recorder
from backend.telemetry.schema import PipelineStageStatus, PipelineState, FieldProvenance, SensorChannelBadge

from concurrent.futures import ThreadPoolExecutor

# Global state for high-frequency low-latency causal pipeline
_step_counter = 0
_last_comp_residual = 0.0
_ml_lock = threading.Lock()
_ml_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="falconz_ml_worker")
_ml_future = None

_cached_ml = {
    "is_anomaly": False,
    "anomaly_score": 0.0,
    "anomaly_sev": "NOMINAL",
    "hyst_count": 0,
    "predicted_fault": "NORMAL",
    "fault_conf": 98.0,
    "fault_sev": "NONE",
    "fault_probs": {},
    "health_idx": 98.5,
    "health_band": "HEALTHY",
    "rul_dict": {},
    "xai_res": {
        "xai_what": "Propulsion operating nominal within first-principles bounds.",
        "xai_why": "Expected electro-thermal parameters aligned with physical model.",
        "xai_severity": "Nominal",
        "xai_recommendation": "Maintain standard operating envelope.",
        "contributing_features": {},
        "maintenance_urgency": "NONE",
        "affected_subsystem": "Propulsion Unit",
        "maintenance_action": "Standard pre-flight inspection",
        "maintenance_risk_level": "Low"
    },
    "last_run_time": 0.0
}

def _execute_ml_inference(fvec, comp_res, is_real, effective_severity, telemetry, dt_expected, residuals, buffer_len):
    """Executes heavy ML multi-tree traversal without blocking the high-frequency telemetry loop."""
    try:
        is_anom, anom_score, anom_sev, hyst = anomaly_detector.predict(fvec, comp_res)
        pred_fault, fault_cf, fault_sv, fault_pb = fault_classifier.predict(fvec, comp_res)
        h_idx, h_band = health_calculator.compute_health(residuals, is_anom, anom_score, effective_severity)
        rul_d = rul_predictor.predict(
            fvec, h_idx, effective_severity,
            is_real_live=is_real, operating_samples=buffer_len
        )
        xai_r = xai_engine.generate_explanation_and_advisory(
            telemetry, dt_expected, residuals, h_idx, pred_fault, fault_sv, is_anom
        )
        with _ml_lock:
            _cached_ml["is_anomaly"] = is_anom
            _cached_ml["anomaly_score"] = anom_score
            _cached_ml["anomaly_sev"] = anom_sev
            _cached_ml["hyst_count"] = hyst
            _cached_ml["predicted_fault"] = pred_fault
            _cached_ml["fault_conf"] = fault_cf
            _cached_ml["fault_sev"] = fault_sv
            _cached_ml["fault_probs"] = fault_pb
            _cached_ml["health_idx"] = h_idx
            _cached_ml["health_band"] = h_band
            _cached_ml["rul_dict"] = rul_d
            _cached_ml["xai_res"] = xai_r
            _cached_ml["last_run_time"] = time.time()
    except Exception as err:
        logger.error(f"Background ML inference error: {err}", exc_info=True)

def run_causal_pipeline_step(sync_ml: bool = True) -> FullSystemState:
    """
    Executes one complete step of the core causal chain with zero-latency streaming:
    TELEMETRY -> VALIDATION -> DIGITAL TWIN -> RESIDUALS -> FEATURES ->
    ANOMALY DETECTION -> FAULT CLASSIFICATION -> RUL -> HEALTH INDEX ->
    XAI -> MAINTENANCE ADVISORY -> SAFETY GUARD -> BUFFER STORE -> RECORDER

    When sync_ml=False, heavy multi-tree ML inferences run asynchronously in a dedicated
    background worker thread so telemetry ingestion and WebSocket broadcast remain < 1.0 ms.
    When sync_ml=True (default for deterministic tests), ML runs synchronously.
    """
    global _step_counter, _last_comp_residual, _cached_ml, _ml_future
    t_start = time.time()
    _step_counter += 1
    
    # 1. Determine if a physical hardware telemetry source is active
    from backend.hardware.mavlink.mavlink_connection import mavlink_manager
    is_hardware_selected = (hal_manager.active_source != TelemetrySource.SIMULATION)
    hw_active = is_hardware_selected and (mavlink_manager.connection_status == ConnectionStatus.CONNECTED) and (time.time() - mavlink_manager.last_packet_time < 3.0)
    sim_packet = None if hw_active else telemetry_generator.generate_packet()
    
    # 2. HAL Telemetry Ingestion & Validation (instantaneous, <0.2ms)
    telemetry: CanonicalTelemetry = hal_manager.get_active_telemetry(sim_packet)
    is_real = (telemetry.source_type != TelemetrySource.SIMULATION)
    
    # 3. Physics-Informed Digital Twin & Residual Calculation (<0.1ms)
    dt_expected, residuals = residual_engine.compute_twin_and_residuals(telemetry)
    
    # 4. Feature Extraction (<0.3ms)
    feat_dict = feature_pipeline.extract_features(telemetry, dt_expected, residuals)
    fvec = feature_pipeline.to_feature_vector(feat_dict)
    
    # Decoupled Intelligence:
    now = time.time()
    res_jump = abs(residuals.composite_residual_score - _last_comp_residual) > 0.25
    time_elapsed = (now - _cached_ml["last_run_time"]) >= 0.25
    should_run_ml = (_step_counter % 5 == 0) or res_jump or time_elapsed or (_cached_ml["last_run_time"] == 0.0)
    effective_severity = 0.0 if is_real else (telemetry_generator.scenario_severity * 0.5)

    if should_run_ml:
        _last_comp_residual = residuals.composite_residual_score
        if sync_ml:
            _execute_ml_inference(
                fvec, residuals.composite_residual_score, is_real, effective_severity,
                telemetry, dt_expected, residuals, len(buffer_store.state_buffer)
            )
        else:
            # Asynchronous background ML dispatch: zero impact on telemetry streaming latency
            if _ml_future is None or _ml_future.done():
                _ml_future = _ml_executor.submit(
                    _execute_ml_inference,
                    fvec, residuals.composite_residual_score, is_real, effective_severity,
                    telemetry, dt_expected, residuals, len(buffer_store.state_buffer)
                )

    with _ml_lock:
        is_anomaly = _cached_ml["is_anomaly"]
        anomaly_score = _cached_ml["anomaly_score"]
        anomaly_sev = _cached_ml["anomaly_sev"]
        hyst_count = _cached_ml["hyst_count"]
        predicted_fault = _cached_ml["predicted_fault"]
        fault_conf = _cached_ml["fault_conf"]
        fault_sev = _cached_ml["fault_sev"]
        fault_probs = _cached_ml["fault_probs"]
        rul_dict = _cached_ml["rul_dict"]
        xai_res = _cached_ml["xai_res"]

    # Dynamic composite health index evaluated instantaneously (<0.02ms) with latest residuals
    health_idx, health_band = health_calculator.compute_health(
        residuals, is_anomaly, anomaly_score, effective_severity
    )

    # 10. Safety Guard & Control Modes (<0.1ms)
    safety_st, e_stop, violations = safety_guard.evaluate(telemetry)
    safe_throttle = control_manager.update_control(
        operator_throttle=telemetry.throttle_pct,
        health_index=health_idx,
        temperature_c=telemetry.temperature_c,
        anomaly_detected=is_anomaly
    )
    
    # 11. Technical Diagnostics for 11 Pipeline Stages
    from backend.hardware.mavlink.mavlink_connection import mavlink_manager
    apm_diag = mavlink_manager.get_detailed_diagnostics()
    apm_active = (apm_diag["apm_connection"] == "CONNECTED")
    apm_stale = (apm_diag["apm_connection"] == "STALE")
    
    pipeline_stages = [
        PipelineStageStatus(
            stage_id="stage_1",
            stage_name="APM Connection",
            status=PipelineState.RUNNING if apm_active else (PipelineState.STALE if apm_stale else PipelineState.WAITING),
            latency_ms=apm_diag["telemetry_age_ms"],
            message_rate_hz=apm_diag["message_rate_hz"],
            details=f"Type: {apm_diag['connection_type']} | Heartbeat: {apm_diag['heartbeat']}"
        ),
        PipelineStageStatus(
            stage_id="stage_2",
            stage_name="MAVLink Receiver",
            status=PipelineState.RUNNING if apm_active else PipelineState.WAITING,
            message_rate_hz=apm_diag["message_rate_hz"],
            details=f"Packets: {apm_diag['packets_received']} | Dropped: {apm_diag['packets_dropped']}"
        ),
        PipelineStageStatus(
            stage_id="stage_3",
            stage_name="Message Parser",
            status=PipelineState.RUNNING if apm_active or telemetry.is_valid else PipelineState.WAITING,
            details=f"Decoded: ESC, SYS_STATUS, IMU, VFR_HUD"
        ),
        PipelineStageStatus(
            stage_id="stage_4",
            stage_name="Telemetry Validator",
            status=PipelineState.RUNNING if telemetry.is_valid else PipelineState.ERROR,
            details="Range sanitization & rate-of-change filters active"
        ),
        PipelineStageStatus(
            stage_id="stage_5",
            stage_name="Canonical Telemetry",
            status=PipelineState.RUNNING,
            details=f"Source: {telemetry.source_type.value} | Channels: 12 BLDC"
        ),
        PipelineStageStatus(
            stage_id="stage_6",
            stage_name="Digital Twin",
            status=PipelineState.RUNNING,
            latency_ms=round((time.time() - t_start) * 1000, 2),
            details=f"Model: First-principles electro-thermal ODE"
        ),
        PipelineStageStatus(
            stage_id="stage_7",
            stage_name="Residual Engine",
            status=PipelineState.RUNNING,
            details=f"Composite Z-Score: {residuals.composite_residual_score:.2f}"
        ),
        PipelineStageStatus(
            stage_id="stage_8",
            stage_name="AI Engine",
            status=PipelineState.RUNNING,
            details=f"Anomaly: {anomaly_sev} | Fault: {predicted_fault} ({fault_conf:.1f}%)"
        ),
        PipelineStageStatus(
            stage_id="stage_9",
            stage_name="Health Engine",
            status=PipelineState.RUNNING,
            details=f"Health: {health_idx:.1f}% ({health_band})"
        ),
        PipelineStageStatus(
            stage_id="stage_10",
            stage_name="RUL Engine",
            status=PipelineState.RUNNING if rul_dict.get("rul_hours") is not None else PipelineState.WAITING,
            details=rul_dict.get("status", "INSUFFICIENT DATA")
        ),
        PipelineStageStatus(
            stage_id="stage_11",
            stage_name="GCS Broadcast Stream",
            status=PipelineState.RUNNING if len(websocket_hub.active_connections) > 0 else PipelineState.WAITING,
            details=f"Active WebSocket Clients: {len(websocket_hub.active_connections)}"
        )
    ]
    
    # Assemble Full System State
    from backend.telemetry.schema import HealthAndIntelligence
    intel_state = HealthAndIntelligence(
        timestamp=telemetry.timestamp,
        health_index=health_idx,
        health_band=health_band,
        confidence_pct=95.0,
        trend="STABLE" if residuals.composite_residual_score < 2.0 else "DEGRADING",
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        anomaly_severity=anomaly_sev,
        anomaly_hysteresis_count=hyst_count,
        predicted_fault=predicted_fault,
        fault_confidence_pct=fault_conf,
        fault_severity=fault_sev,
        rul_hours=rul_dict.get("rul_hours"),
        rul_status=rul_dict.get("status", "INSUFFICIENT DATA (PROTOTYPE - NON-FLIGHT-CERTIFIED)"),
        rul_uncertainty_lower_hours=rul_dict.get("confidence_interval_90", {}).get("lower_bound"),
        rul_uncertainty_upper_hours=rul_dict.get("confidence_interval_90", {}).get("upper_bound"),
        rul_degradation_rate_pct_per_hr=rul_dict.get("degradation_rate_pct_per_hr", 0.0),
        xai_what=xai_res["xai_what"],
        xai_why=xai_res["xai_why"],
        xai_severity=xai_res["xai_severity"],
        xai_recommendation=xai_res["xai_recommendation"],
        contributing_features=xai_res["contributing_features"],
        maintenance_urgency=xai_res["maintenance_urgency"],
        affected_subsystem=xai_res["affected_subsystem"],
        maintenance_action=xai_res["maintenance_action"],
        maintenance_risk_level=xai_res["maintenance_risk_level"]
    )
    
    system_state = FullSystemState(
        timestamp=telemetry.timestamp,
        telemetry=telemetry,
        digital_twin=dt_expected,
        residuals=residuals,
        intelligence=intel_state,
        scenario=ScenarioType.NORMAL if is_real else telemetry_generator.active_scenario,
        scenario_severity=0.0 if is_real else telemetry_generator.scenario_severity,
        control_mode=control_manager.active_mode,
        safety_state=safety_st,
        emergency_stop_active=e_stop,
        data_source=telemetry.source_type,
        connection_status=telemetry.connection_status,
        flight_phase="LIVE TESTBED MONITORING" if is_real else "DEVELOPMENT / CALIBRATION",
        pipeline_stages=pipeline_stages
    )
    
    # Ingest into Telemetry Flight Recorder if active
    if telemetry_recorder.is_recording:
        telemetry_recorder.ingest_frame(system_state.model_dump())
        
    # Store in history ring buffers
    buffer_store.add_state(system_state)
    return system_state


class TelemetryStreamingWorker:
    def __init__(self, interval_sec: float = 0.033):  # 30 Hz ultra-low-latency real-time broadcast (33ms)
        self.interval_sec = interval_sec
        self.running = False
        self.thread = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()
        logger.info("Telemetry Streaming Worker initialized at 30.0 Hz (zero-latency).")

    def stop(self):
        self.running = False

    def _loop(self):
        global _async_loop
        target_time = time.perf_counter()
        while self.running:
            try:
                state = run_causal_pipeline_step(sync_ml=False)
                if _async_loop is not None and not _async_loop.is_closed():
                    asyncio.run_coroutine_threadsafe(websocket_hub.broadcast_state(state), _async_loop)
            except Exception as e:
                logger.error(f"Error in telemetry causal pipeline loop: {e}", exc_info=True)
            
            target_time += self.interval_sec
            sleep_sec = target_time - time.perf_counter()
            if sleep_sec > 0:
                time.sleep(sleep_sec)
            else:
                target_time = time.perf_counter()
                time.sleep(0.001)

streaming_worker = TelemetryStreamingWorker()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _async_loop
    _async_loop = asyncio.get_running_loop()
    # Initialize & seed SQLite database
    from backend.database.session import init_db
    try:
        init_db()
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    # Reload models if created
    anomaly_detector.load_model()
    fault_classifier.load_model()
    rul_predictor.load_models()
    # Start background telemetry generator
    streaming_worker.start()
    yield
    streaming_worker.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Indigenous Propulsion Digital Twin + Predictive Health Monitoring Platform for MALE UAVs",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routers
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(dt_router, prefix=settings.API_V1_STR)
app.include_router(intel_router, prefix=settings.API_V1_STR)
app.include_router(mission_router, prefix=settings.API_V1_STR)
app.include_router(hardware_router, prefix=settings.API_V1_STR)
app.include_router(safety_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(subscription_router, prefix=settings.API_V1_STR)
app.include_router(payment_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(fleet_router, prefix=settings.API_V1_STR)
app.include_router(org_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "timestamp": time.time(),
        "endpoints": {
            "telemetry_ws": "/ws/telemetry",
            "api_v1": settings.API_V1_STR,
            "docs": "/docs"
        }
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket_hub.connect(websocket)
    try:
        while True:
            # Handle incoming client commands over WebSocket
            data = await websocket.receive_text()
            # Echo or process if needed
    except WebSocketDisconnect:
        websocket_hub.disconnect(websocket)
    except Exception:
        websocket_hub.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
