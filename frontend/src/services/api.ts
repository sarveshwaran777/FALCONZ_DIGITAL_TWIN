import { ScenarioType, TelemetrySource, ControlMode, MotorBenchmarkData } from '../types/telemetry';

const customApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
export const API_BASE = customApiBase ? customApiBase.replace(/\/$/, '') : '/api';

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('falconz_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // ================= EXISTING FALCONZ 15-MODULE APIS (PRESERVED) =================
  async getMotorBenchmark(): Promise<MotorBenchmarkData> {
    const res = await fetch(`${API_BASE}/hardware/motor-benchmark`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getMotorConnections(): Promise<{ connections: Record<string, boolean> }> {
    const res = await fetch(`${API_BASE}/hardware/motor-connections`, { headers: getAuthHeaders() });
    return res.json();
  },

  async setMotorConnection(motor_id: string, is_connected: boolean) {
    const res = await fetch(`${API_BASE}/hardware/motor-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motor_id, is_connected })
    });
    return res.json();
  },

  async setAllMotorsConnection(is_connected: boolean) {
    const res = await fetch(`${API_BASE}/hardware/motor-connection-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_connected })
    });
    return res.json();
  },

  async getLatestTelemetry() {
    const res = await fetch(`${API_BASE}/telemetry/latest`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getMotorsTelemetry() {
    const res = await fetch(`${API_BASE}/telemetry/motors`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getTelemetryHistory(limit = 60) {
    const res = await fetch(`${API_BASE}/telemetry/history?limit=${limit}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getFullSystemState() {
    const res = await fetch(`${API_BASE}/telemetry/full-state`, { headers: getAuthHeaders() });
    return res.json();
  },

  async setThrottle(throttle_pct: number, load_pct?: number, ambient_temp_c?: number) {
    const res = await fetch(`${API_BASE}/telemetry/throttle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ throttle_pct, load_pct, ambient_temp_c })
    });
    return res.json();
  },

  async setScenario(scenario: ScenarioType, severity = 0.5) {
    const res = await fetch(`${API_BASE}/telemetry/scenario`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenario, severity })
    });
    return res.json();
  },

  async setTelemetrySource(source: TelemetrySource) {
    const res = await fetch(`${API_BASE}/telemetry/source`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ source })
    });
    return res.json();
  },

  async getHealthHistory(limit = 60) {
    const res = await fetch(`${API_BASE}/intelligence/health-history?limit=${limit}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getModelEvaluation() {
    const res = await fetch(`${API_BASE}/intelligence/model-evaluation`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getHardwareStatus() {
    const res = await fetch(`${API_BASE}/hardware/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getSerialPorts() {
    const res = await fetch(`${API_BASE}/hardware/serial/ports`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getMotorMapping() {
    const res = await fetch(`${API_BASE}/hardware/mapping`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateMotorMapping(mappings: any) {
    const res = await fetch(`${API_BASE}/hardware/mapping`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mappings })
    });
    return res.json();
  },

  async getMavlinkDiscovery() {
    const res = await fetch(`${API_BASE}/hardware/discovery`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getMotorCalibration() {
    const res = await fetch(`${API_BASE}/hardware/calibration`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateMotorCalibration(config: any) {
    const res = await fetch(`${API_BASE}/hardware/calibration`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async getAPMDiagnostics() {
    const res = await fetch(`${API_BASE}/hardware/apm/diagnostics`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getAPMMessageTrace() {
    const res = await fetch(`${API_BASE}/hardware/apm/message-trace`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getVerificationStatus() {
    const res = await fetch(`${API_BASE}/hardware/verification-status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async startRecording(session_name?: string) {
    const res = await fetch(`${API_BASE}/telemetry/record/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ session_name })
    });
    return res.json();
  },

  async stopRecording() {
    const res = await fetch(`${API_BASE}/telemetry/record/stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getRecordingStatus() {
    const res = await fetch(`${API_BASE}/telemetry/record/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async listRecordings() {
    const res = await fetch(`${API_BASE}/telemetry/record/list`, { headers: getAuthHeaders() });
    return res.json();
  },

  async connectMAVLink(connection_string: string, baud_rate = 115200, connection_type = 'USB_SERIAL') {
    const res = await fetch(`${API_BASE}/hardware/mavlink/connect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ connection_string, baud_rate, connection_type })
    });
    return res.json();
  },

  async disconnectMAVLink() {
    const res = await fetch(`${API_BASE}/hardware/mavlink/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async connectSerialDevice(port: string, baud_rate = 115200, device_type = 'ESP32') {
    const res = await fetch(`${API_BASE}/hardware/serial/connect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ port, baud_rate, device_type })
    });
    return res.json();
  },

  async connectSerial(port: string, baud_rate = 115200, device_type = 'ESP32') {
    return this.connectSerialDevice(port, baud_rate, device_type);
  },

  async disconnectSerialDevice(device_type = 'ESP32') {
    const res = await fetch(`${API_BASE}/hardware/serial/disconnect?device_type=${device_type}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async disconnectSerial(device_type = 'ESP32') {
    return this.disconnectSerialDevice(device_type);
  },

  async getSafetyStatus() {
    const res = await fetch(`${API_BASE}/safety/status`, { headers: getAuthHeaders() });
    return res.json();
  },

  async triggerEmergencyStop(reason = 'Operator Manual Stop') {
    const res = await fetch(`${API_BASE}/safety/emergency-stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  async resetEmergencyStop() {
    const res = await fetch(`${API_BASE}/safety/reset-emergency-stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async setControlMode(mode: ControlMode) {
    const res = await fetch(`${API_BASE}/safety/control-mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode })
    });
    return res.json();
  },

  async simulateMission(profile_key = 'HIGH_ALTITUDE', duration_hours = 12.0) {
    const res = await fetch(`${API_BASE}/mission/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ profile_key, duration_hours })
    });
    return res.json();
  },

  async getMissionProfiles() {
    const res = await fetch(`${API_BASE}/mission/profiles`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getAllReplayFrames() {
    const res = await fetch(`${API_BASE}/mission/replay/all-frames`, { headers: getAuthHeaders() });
    return res.json();
  },

  async controlReplay(action: string, frame_idx?: number, speed?: number) {
    const res = await fetch(`${API_BASE}/mission/replay/control`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, frame_idx, speed })
    });
    return res.json();
  },

  async getDemoState() {
    const res = await fetch(`${API_BASE}/demo/state`, { headers: getAuthHeaders() });
    return res.json();
  },

  async startDemo(auto_advance = true) {
    const res = await fetch(`${API_BASE}/demo/start?auto_advance=${auto_advance}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async stopDemo() {
    const res = await fetch(`${API_BASE}/demo/stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async jumpToDemoPhase(phase_idx: number) {
    const res = await fetch(`${API_BASE}/demo/phase/${phase_idx}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async nextDemoPhase() {
    const res = await fetch(`${API_BASE}/demo/next`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async prevDemoPhase() {
    const res = await fetch(`${API_BASE}/demo/prev`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getSystemEvents() {
    const res = await fetch(`${API_BASE}/telemetry/events?limit=40`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ================= NEW SAAS & AUTHENTICATION APIS =================
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(email: string, password: string, full_name: string, organization_name?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, organization_name })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateProfile(data: { full_name?: string; email?: string; password?: string }) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // ================= SUBSCRIPTION & BILLING APIS =================
  async getSubscriptionPlans() {
    const res = await fetch(`${API_BASE}/subscriptions/plans`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getCurrentSubscription() {
    const res = await fetch(`${API_BASE}/subscriptions/current`, { headers: getAuthHeaders() });
    return res.json();
  },

  async cancelSubscription() {
    const res = await fetch(`${API_BASE}/subscriptions/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ================= RAZORPAY PAYMENT APIS =================
  async createPaymentOrder(plan_code: string, billing_cycle: 'MONTHLY' | 'YEARLY') {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan_code, billing_cycle })
    });
    return res.json();
  },

  async verifyPayment(order_id: string, payment_id: string, signature: string, payment_method = 'upi') {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        razorpay_signature: signature,
        payment_method
      })
    });
    return res.json();
  },

  async getPaymentHistory() {
    const res = await fetch(`${API_BASE}/payments/history`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getInvoices() {
    const res = await fetch(`${API_BASE}/payments/invoices`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ================= FALCONZ AI INTELLIGENCE CENTER APIS =================
  async chatAICopilot(prompt: string, conversation_id?: string, drone_id?: string, role?: string) {
    const res = await fetch(`${API_BASE}/ai/copilot/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, conversation_id, drone_id, role: role || 'ENGINEERING' })
    });
    return res.json();
  },

  async getAIConversations() {
    const res = await fetch(`${API_BASE}/ai/copilot/conversations`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getConversationMessages(conversation_id: string) {
    const res = await fetch(`${API_BASE}/ai/copilot/conversations/${conversation_id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async newConversation() {
    const res = await fetch(`${API_BASE}/ai/copilot/conversations/new`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getFleetIntelligence() {
    const res = await fetch(`${API_BASE}/ai/fleet/intelligence`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getMissionAdvice(duration_minutes: number, profile: string, ambient_temp_c?: number, altitude_m?: number) {
    const res = await fetch(`${API_BASE}/ai/mission/advisor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ duration_minutes, profile, ambient_temp_c, altitude_m })
    });
    return res.json();
  },

  async getModelsIntelligence() {
    const res = await fetch(`${API_BASE}/ai/models/intelligence`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getAIUsage() {
    const res = await fetch(`${API_BASE}/ai/usage`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ================= AUTOMATED PDF ENGINEERING REPORTS APIS =================
  async generateReport(report_type: string, title?: string, drone_id?: string) {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ report_type, title, drone_id })
    });
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ================= FLEET & CLOUD FLIGHT HISTORY APIS =================
  async getDrones() {
    const res = await fetch(`${API_BASE}/fleet/drones`, { headers: getAuthHeaders() });
    return res.json();
  },

  async registerDrone(name: string, serial_number: string, frame_type?: string) {
    const res = await fetch(`${API_BASE}/fleet/drones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, serial_number, frame_type })
    });
    return res.json();
  },

  async getDroneDetail(drone_id: string) {
    const res = await fetch(`${API_BASE}/fleet/drones/${drone_id}`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getCloudFlightHistory() {
    const res = await fetch(`${API_BASE}/fleet/history`, { headers: getAuthHeaders() });
    return res.json();
  },

  // ================= ORGANIZATION & TEAM MANAGEMENT APIS =================
  async getCurrentOrg() {
    const res = await fetch(`${API_BASE}/organizations/current`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getOrgMembers() {
    const res = await fetch(`${API_BASE}/organizations/members`, { headers: getAuthHeaders() });
    return res.json();
  },

  async inviteOrgMember(email: string, full_name: string, role = 'ENGINEER') {
    const res = await fetch(`${API_BASE}/organizations/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, full_name, role })
    });
    return res.json();
  },

  async removeOrgMember(member_id: string) {
    const res = await fetch(`${API_BASE}/organizations/members/${member_id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // ================= SUPER ADMIN CONTROL APIS =================
  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/admin/metrics`, { headers: getAuthHeaders() });
    return res.json();
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateAdminUserRole(user_id: string, role: string) {
    const res = await fetch(`${API_BASE}/admin/users/${user_id}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async getAdminPlans() {
    const res = await fetch(`${API_BASE}/admin/plans`, { headers: getAuthHeaders() });
    return res.json();
  },

  async updateAdminPlan(plan_id: string, data: any) {
    const res = await fetch(`${API_BASE}/admin/plans/${plan_id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getAuthHeaders() });
    return res.json();
  }
};
