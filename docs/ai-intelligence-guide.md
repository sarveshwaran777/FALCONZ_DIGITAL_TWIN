# FALCONZ AI Intelligence Center & Copilot Guide

## 1. Overview
The **FALCONZ AI Intelligence Center** provides production-grade aerospace diagnostics, real-time grounded telemetry reasoning, fleet degradation analytics, and automated PDF engineering documentation.

---

## 2. Real Telemetry Context Injection (No Hallucinations)

The AI Copilot does not invent numbers. Every conversational query pulls directly from the 20 Hz live causal pipeline:

```
[ Sensor / MAVLink Stream ] ──► [ Validator ] ──► [ Digital Twin ODE ] ──► [ Residuals ]
                                                                                   │
                                                                                   ▼
                                                             [ Live Telemetry Snapshot Context ]
                                                                                   │
                                                                                   ▼
                                                             [ FALCONZ AI Engineering Copilot ]
```

### Parameters Injected into Reasoning:
- **Actual Measured Values**: RPM, Bus Voltage, Current Draw, Stator Temperature, Vibration RMS.
- **Physics Twin Expected**: First-principles nominal values calculated from $V_{\text{applied}} = V_{\text{batt}} \times \text{Throttle}\%$ and aerodynamic torque $\tau = C_{\text{prop}}\omega^2$.
- **Physics Residuals & Z-Scores**: $\Delta \text{RPM}, \Delta I, \Delta T, \Delta V$ normalized against standard deviations.
- **Machine Learning Classifications**:
  - Isolation Forest Anomaly Flag (with 3–5 step hysteresis).
  - Random Forest 4-class fault classification & confidence percentage.
  - Multi-quantile Gradient Boosting RUL ($P_{10}, P_{50}, P_{90}$).
- **XAI Root Cause & SOP Maintenance Recommendations**.

---

## 3. Flight-Critical Safety Decoupling

> [!IMPORTANT]
> **Generative AI is strictly advisory and read-only.**
> The AI Copilot has **zero write-access** to flight actuators, throttle clamps, or the Emergency Stop mechanism.
> Safety guards (`backend/safety/safety_guard.py`), hardware watchdogs, and hard cutoff limits operate independently on an unbypassable deterministic thread.

---

## 4. AI Automated Engineering PDF Reports

The platform uses `ReportLab 5.0` to compile publication-grade aerospace PDF reports on demand:

1. **Flight Performance & Electrical Efficiency**: Analyzes battery discharge curve, power factor, aerodynamic drag, and voltage sag.
2. **Propulsion Health & Degradation Audit**: Deep-dive into stator winding resistance, convective thermal slope, and dynamic balance.
3. **Motor Subsystem Failure Analysis**: Pinpoints harmonic bearing spalling, MOSFET gate drift, or propeller tracking anomalies.
4. **Predictive Maintenance Work Order**: Prescriptive line technician SOP checklists with urgency ratings.
5. **Quantile RUL Prognostic Certificate**: Certified median remaining hours with $90\%$ confidence intervals.
6. **Isolation Forest Anomaly Dossier**: Historical trigger timeline and feature attribution graphs.
7. **Complete Propulsion Engineering Diagnostic**: Comprehensive multi-subsystem engineering dossier.
