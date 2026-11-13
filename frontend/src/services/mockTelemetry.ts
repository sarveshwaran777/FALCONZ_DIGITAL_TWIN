import { FullSystemState, ScenarioType, ControlMode, PipelineStageStatus } from '../types/telemetry';

export function createMockSystemState(
  step: number = 0,
  scenario: ScenarioType = 'NORMAL',
  severity: number = 0.0,
  throttleInput: number = 55,
  emergencyStop: boolean = false
): FullSystemState {
  const t = step * 0.5; // step increment
  const now = Date.now() / 1000;

  // Base throttle and physics calculations
  const effectiveThrottle = emergencyStop ? 0 : Math.max(0, Math.min(100, throttleInput));
  const baseRpm = (effectiveThrottle / 100) * 9800;
  const rpmNoise = Math.sin(t * 1.5) * 45 + (Math.random() - 0.5) * 20;
  const liveRpm = Math.max(0, Math.round(baseRpm + rpmNoise));

  // Electrical physics
  const voltageNominal = 14.8;
  const currentDraw = emergencyStop ? 0.4 : (liveRpm / 9800) * 24.5 + Math.sin(t * 0.8) * 0.5;
  const liveVoltage = Math.max(11.1, +(voltageNominal - currentDraw * 0.035).toFixed(2));
  const liveCurrent = +Math.max(0, currentDraw).toFixed(2);
  const powerElec = +(liveVoltage * liveCurrent).toFixed(1);

  // Mechanical torque & power
  const torqueNm = +(liveRpm > 100 ? (powerElec * 0.78) / ((liveRpm * 2 * Math.PI) / 60) : 0).toFixed(3);
  const powerMech = +(liveRpm > 100 ? (torqueNm * (liveRpm * 2 * Math.PI)) / 60 : 0).toFixed(1);
  const efficiencyPct = powerElec > 0 ? Math.min(95, +((powerMech / powerElec) * 100).toFixed(1)) : 80;

  // Thermal & Vibration
  const ambientTemp = 25.0;
  const tempRise = (liveCurrent / 25) * 24;
  const liveTemp = +(ambientTemp + tempRise + Math.sin(t * 0.2) * 1.2).toFixed(1);
  const baseVib = 0.045 + (liveRpm / 10000) * 0.055;
  const liveVib = +(baseVib + (Math.random() - 0.5) * 0.008).toFixed(3);

  // 3D Quadcopter Dynamics (Subtle realistic hover oscillations)
  const rollDeg = +(Math.sin(t * 0.7) * 2.2).toFixed(2);
  const pitchDeg = +(Math.cos(t * 0.6) * 1.8).toFixed(2);
  const yawDeg = +((t * 3.5) % 360).toFixed(1);

  // 4 Motors
  const mRpmNoise = [20, -15, 30, -25];
  const motorsData: Record<string, any> = {};
  ['motor_1', 'motor_2', 'motor_3', 'motor_4'].forEach((key, idx) => {
    const mRpm = Math.max(0, liveRpm + mRpmNoise[idx] + Math.round((Math.random() - 0.5) * 15));
    const mCurr = +(liveCurrent / 4 + (Math.random() - 0.5) * 0.1).toFixed(2);
    const mThrust = +(mRpm > 100 ? (mRpm / 9800) * 450 + (Math.random() - 0.5) * 10 : 0).toFixed(0);
    motorsData[key] = {
      motor_id: key,
      label: `M${idx + 1}`,
      esc_instance: idx + 1,
      servo_channel: idx + 1,
      is_connected: true,
      connection_status: 'CONNECTED',
      motor_model: 'A2212 930KV Brushless DC',
      propeller: '10x4.5 Carbon Fiber',
      kv_rating: 930,
      live_rpm: mRpm,
      rpm: mRpm,
      rated_rpm: 9800,
      voltage_v: liveVoltage,
      current_a: mCurr,
      power_w: +(liveVoltage * mCurr).toFixed(1),
      thrust_g: Number(mThrust),
      g_per_watt: mCurr > 0 ? +(Number(mThrust) / (liveVoltage * mCurr)).toFixed(2) : 5.2,
      efficiency_pct: efficiencyPct,
      temperature_c: +(liveTemp + idx * 0.5).toFixed(1),
      vibration_rms_g: liveVib,
      throttle_pct: effectiveThrottle,
      torque_nm: +(torqueNm / 4).toFixed(3),
      in_cruise_efficiency_zone: effectiveThrottle >= 45 && effectiveThrottle <= 68,
      status: 'SIMULATION',
      source_message: 'CLIENT_SIMULATOR'
    };
  });

  const pipelineStages: PipelineStageStatus[] = [
    { stage_id: 'stage_1', name: 'APM Connection', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 12, info: 'Client Simulated Stream' },
    { stage_id: 'stage_2', name: 'MAVLink Receiver', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 8, info: 'Active 20 Hz Packets' },
    { stage_id: 'stage_3', name: 'Message Parser', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 4, info: 'ESC, SYS_STATUS, IMU, VFR_HUD' },
    { stage_id: 'stage_4', name: 'Sensor Ingestion', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 3, info: '4x BLDC Telemetry Stream' },
    { stage_id: 'stage_5', name: 'Validation Gate', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 2, info: 'Physical Bounds & Checksum OK' },
    { stage_id: 'stage_6', name: 'Digital Twin Model', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 1, info: 'First-Principles Aerothermal Physics' },
    { stage_id: 'stage_7', name: 'Residual Computation', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 1, info: 'Normalized Residuals < 0.08' },
    { stage_id: 'stage_8', name: 'Feature Extraction', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 3, info: '18-dim Feature Vector Formed' },
    { stage_id: 'stage_9', name: 'AI Anomaly & RUL', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 5, info: 'Ensemble ML Inference Active' },
    { stage_id: 'stage_10', name: 'Safety Guard Interlock', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 1, info: 'Envelopes Verified Safe' },
    { stage_id: 'stage_11', name: 'Dashboard Telemetry Sync', status: 'RUNNING', fps_hz: 20, last_activity_ms_ago: 1, info: 'Browser UI Sync Active' }
  ];

  return {
    timestamp: now,
    scenario,
    scenario_severity: severity,
    control_mode: 'ASSISTED',
    safety_state: emergencyStop ? 'EMERGENCY' : 'SAFE',
    emergency_stop_active: emergencyStop,
    data_source: 'SIMULATION',
    connection_status: 'SIMULATED',
    flight_phase: liveRpm > 100 ? 'CRUISE / LOITER' : 'STANDBY / GROUND',
    pipeline_stages: pipelineStages,

    telemetry: {
      timestamp: now,
      source_type: 'SIMULATION',
      connection_status: 'SIMULATED',
      is_valid: true,
      validation_flags: [],
      heartbeat_received: true,
      packet_rate_hz: 20.0,
      packet_loss_count: 0,
      telemetry_age_ms: 12,

      throttle_pct: effectiveThrottle,
      rpm: liveRpm,
      voltage_v: liveVoltage,
      current_a: liveCurrent,
      power_elec_w: powerElec,
      torque_nm: torqueNm,
      power_mech_w: powerMech,
      efficiency_pct: efficiencyPct,
      temperature_c: liveTemp,
      vibration_rms_g: liveVib,
      load_pct: Math.round(effectiveThrottle * 0.95),
      ambient_temperature_c: ambientTemp,
      altitude_m: 48.5 + Math.sin(t * 0.4) * 2.5,
      airspeed_mps: 12.8 + Math.cos(t * 0.3) * 0.8,
      total_thrust_g: Math.round((liveRpm / 9800) * 1800),
      is_armed: !emergencyStop && liveRpm > 100,

      // Motors
      motors: motorsData,
      total_current_a: liveCurrent,
      total_power_w: powerElec,
      avg_efficiency_pct: efficiencyPct,
      avg_rpm: liveRpm,
      connected_motors_count: 4,
      total_motors_count: 4,

      // Battery
      battery_voltage_v: liveVoltage,
      battery_current_a: liveCurrent,
      battery_remaining_pct: Math.max(15, Math.round(92 - (t / 120))),
      battery_consumed_mah: Math.round((t * liveCurrent * 1000) / 3600),
      battery_temp_c: +(ambientTemp + 7.2).toFixed(1),
      cell_voltages: [+(liveVoltage / 4).toFixed(2), +(liveVoltage / 4).toFixed(2), +(liveVoltage / 4).toFixed(2), +(liveVoltage / 4).toFixed(2)],

      // Attitude
      roll_deg: rollDeg,
      pitch_deg: pitchDeg,
      yaw_deg: yawDeg,
      rollspeed_deg_s: +(Math.cos(t * 0.7) * 1.5).toFixed(2),
      pitchspeed_deg_s: +(-Math.sin(t * 0.6) * 1.2).toFixed(2),
      yawspeed_deg_s: 3.5,

      // Navigation
      latitude: 13.0827,
      longitude: 80.2707,
      relative_altitude_m: 48.5,
      climb_rate_mps: 0.1,
      heading_deg: yawDeg,
      satellites_visible: 14,
      gps_fix_type: 3,
      flight_mode: 'LOITER'
    },

    digital_twin: {
      timestamp: now,
      expected_rpm: Math.round((effectiveThrottle / 100) * 9800),
      expected_voltage_v: 14.8,
      expected_current_a: +(liveCurrent * 0.98).toFixed(2),
      expected_power_elec_w: +(powerElec * 0.98).toFixed(1),
      expected_power_mech_w: +(powerMech * 0.98).toFixed(1),
      expected_efficiency_pct: 82.5,
      expected_temperature_c: +(ambientTemp + tempRise).toFixed(1),
      expected_vibration_rms_g: +(baseVib * 0.95).toFixed(3)
    },

    residuals: {
      timestamp: now,
      residual_rpm: liveRpm - Math.round((effectiveThrottle / 100) * 9800),
      residual_current_a: +(liveCurrent * 0.02).toFixed(2),
      residual_voltage_v: 0.04,
      residual_power_w: +(powerElec * 0.02).toFixed(1),
      residual_temperature_c: +(liveTemp - (ambientTemp + tempRise)).toFixed(1),
      residual_vibration_g: +(liveVib - baseVib * 0.95).toFixed(3),
      residual_efficiency_pct: 1.2,
      norm_residual_rpm: 0.035,
      norm_residual_current: 0.028,
      norm_residual_temp: 0.022,
      norm_residual_vibration: 0.031,
      norm_residual_efficiency: 0.015,
      composite_residual_score: 0.048
    },

    intelligence: {
      timestamp: now,
      health_index: 97.4,
      health_band: 'HEALTHY',
      trend: 'STABLE',
      confidence_pct: 98.6,
      anomaly_score: 0.042,
      is_anomaly: false,
      anomaly_severity: 'NOMINAL',
      anomaly_hysteresis_count: 0,
      predicted_fault: 'NORMAL',
      fault_confidence_pct: 98.6,
      fault_severity: 'NONE',
      rul_hours: 148.5,
      rul_uncertainty_lower_hours: 132.0,
      rul_uncertainty_upper_hours: 165.0,
      rul_degradation_rate_pct_per_hr: 0.018,
      rul_validation_badge: 'Physics-ML Hybrid Validated',
      xai_what: 'Propulsion operating nominal within first-principles bounds.',
      xai_why: 'Expected electro-thermal parameters aligned with physical model.',
      xai_severity: 'Nominal',
      xai_recommendation: 'Maintain standard operating envelope.',
      contributing_features: {
        'Vibration RMS': 0.12,
        'Stator Temp': 0.18,
        'Current Draw': 0.15,
        'RPM Residual': 0.08
      },
      maintenance_urgency: 'NONE',
      affected_subsystem: 'Propulsion Unit',
      maintenance_action: 'Standard pre-flight inspection',
      maintenance_risk_level: 'Low'
    }
  };
}
