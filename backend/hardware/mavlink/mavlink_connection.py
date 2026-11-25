import time
import json
import threading
import logging
import collections
from typing import Optional, Dict, Any, List, Deque, Tuple
from backend.telemetry.schema import ConnectionStatus
from backend.hardware.mavlink.mavlink_parser import mavlink_parser
from backend.hardware.mavlink.telemetry_mapper import telemetry_mapper

logger = logging.getLogger(__name__)

class MAVLinkConnectionManager:
    """
    Real-Time Hardware-First MAVLink Ingress Manager for APM / ArduPilot Flight Controllers.
    Manages USB-Serial and UDP network streams with automatic port detection, reconnect loop,
    packet loss tracking, message rate computation, and rolling frame traces.
    """
    def __init__(self):
        self.connection = None
        self.connection_status: ConnectionStatus = ConnectionStatus.DISCONNECTED
        self.connection_type: str = "USB_SERIAL"  # "USB_SERIAL" or "UDP"
        self.connection_string: str = "COM3"
        self.baud_rate: int = 115200
        self.udp_ip: str = "0.0.0.0"
        self.udp_port: int = 14550
        self.auto_reconnect: bool = True
        
        self.running: bool = False
        self.thread: Optional[threading.Thread] = None
        self.reconnect_thread: Optional[threading.Thread] = None
        
        # Diagnostic & Liveness State
        self.last_packet_time: float = 0.0
        self.last_heartbeat_time: float = 0.0
        self.last_flight_telemetry_time: float = 0.0
        self.packets_received: int = 0
        self.packets_dropped: int = 0
        self.last_seq: Optional[int] = None
        self.last_seq_by_source: Dict[Tuple[int, int], int] = {}
        self.last_error: Optional[str] = None
        
        # APM Identity & Protocol
        self.system_id: Optional[int] = None
        self.component_id: Optional[int] = None
        self.mavlink_protocol: str = "MAVLink 2.0"
        self.autopilot_type: Optional[str] = "ArduPilot (APM)"
        
        # Sliding rate tracker (timestamps of last 100 packets)
        self._packet_timestamps: Deque[float] = collections.deque(maxlen=100)
        
        # Rolling message trace (last 50 decoded frames)
        self.recent_messages: Deque[Dict[str, Any]] = collections.deque(maxlen=50)
        
        # 3DR / SiK Telemetry Radio Status
        self.radio_rssi: Optional[float] = None
        self.radio_remrssi: Optional[float] = None
        self.radio_noise: Optional[float] = None
        self.radio_remnoise: Optional[float] = None
        self.radio_txbuf: Optional[float] = None
        self.last_radio_time: float = 0.0


    @staticmethod
    def list_available_ports() -> List[Dict[str, str]]:
        """
        Scans and returns all available serial telemetry ports on the host system.
        Prioritizes known USB-UART and flight controller devices (FTDI, CP210x, CH340, STM, etc.),
        while ensuring all serial endpoints (including Bluetooth telemetry bridges) remain selectable.
        """
        ports = []
        try:
            import serial.tools.list_ports
            detected = list(serial.tools.list_ports.comports())
            for p in detected:
                desc = p.description or ""
                hwid = p.hwid or ""
                desc_lower = desc.lower()
                hwid_lower = hwid.lower()
                
                # Check for preferred physical USB telemetry / FC hardware
                is_usb_telemetry = (
                    p.vid is not None or
                    any(k in hwid_lower or k in desc_lower for k in [
                        "usb", "ftdi", "cp210", "ch34", "prolific", "stm", 
                        "arduino", "ardupilot", "pixhawk", "cube", "uart", 
                        "telemetry", "radio", "3dr", "sik", "esp32", "ttyusb", "ttyacm"
                    ])
                )
                
                ports.append({
                    "port": p.device,
                    "description": desc,
                    "hwid": hwid,
                    "preferred": is_usb_telemetry
                })
            
            # Sort so preferred hardware ports appear first, followed by remaining ports
            ports.sort(key=lambda x: (not x.get("preferred", False), x["port"]))
        except Exception as e:
            logger.warning(f"Error scanning COM ports: {e}")
        
        # If no ports detected by scan, offer standard fallback ports so user can still connect
        if not ports:
            for fallback_port in ["COM3", "COM4", "COM5", "COM6", "COM7", "COM8"]:
                ports.append({
                    "port": fallback_port,
                    "description": f"Serial Port ({fallback_port})",
                    "hwid": "GENERIC_FALLBACK",
                    "preferred": False
                })
        return ports

    def configure_serial(self, port: str = "COM3", baud: int = 115200):
        self.connection_type = "USB_SERIAL"
        self.connection_string = port
        self.baud_rate = baud

    def configure_udp(self, ip: str = "0.0.0.0", port: int = 14550):
        self.connection_type = "UDP"
        self.udp_ip = ip
        self.udp_port = port
        self.connection_string = f"udpin:{ip}:{port}"

    def connect(self, connection_string: Optional[str] = None, baud: Optional[int] = None, conn_type: Optional[str] = None) -> bool:
        if connection_string:
            self.connection_string = connection_string
        if baud:
            self.baud_rate = baud
        if conn_type:
            self.connection_type = conn_type
            
        self.disconnect()
        self.connection_status = ConnectionStatus.CONNECTING
        self.connect_time = time.time()
        
        try:
            from pymavlink import mavutil
            logger.info(f"Connecting to APM on {self.connection_string} (baud: {self.baud_rate}, type: {self.connection_type})...")
            
            if self.connection_string.startswith("udp") or self.connection_string.startswith("tcp") or self.connection_type == "UDP":
                target = self.connection_string if self.connection_string.startswith("udp") else f"udpin:{self.udp_ip}:{self.udp_port}"
                self.connection = mavutil.mavlink_connection(target)
            else:
                self.connection = mavutil.mavlink_connection(self.connection_string, baud=self.baud_rate)
                
            self.running = True
            self.thread = threading.Thread(target=self._read_loop, daemon=True)
            self.thread.start()
            self.heartbeat_thread = threading.Thread(target=self._heartbeat_and_stream_loop, daemon=True)
            self.heartbeat_thread.start()
            self.connection_status = ConnectionStatus.CONNECTED
            self.last_error = None
            return True
        except Exception as e:
            err_str = str(e)
            if "PermissionError" in err_str or "Access is denied" in err_str or "13" in err_str:
                conflicts = []
                try:
                    import psutil
                    for p in psutil.process_iter(['name']):
                        n = (p.info.get('name') or '').lower()
                        if 'missionplanner' in n:
                            conflicts.append("Mission Planner")
                        elif 'qgroundcontrol' in n:
                            conflicts.append("QGroundControl")
                        elif 'arduino' in n:
                            conflicts.append("Arduino IDE")
                except Exception:
                    pass
                if conflicts:
                    self.last_error = f"Port {self.connection_string} is in use by {', '.join(set(conflicts))}. Please disconnect in that app or close it."
                else:
                    self.last_error = f"Port {self.connection_string} is in use by another application. Please close Mission Planner, QGC, or Arduino Serial Monitor."
            elif "FileNotFoundError" in err_str or "could not open port" in err_str:
                self.last_error = f"Port {self.connection_string} not found or device disconnected."
            else:
                self.last_error = f"Could not connect to {self.connection_string}: {err_str}"
            self.connection_status = ConnectionStatus.ERROR
            logger.warning(f"APM connection failed on {self.connection_string}: {self.last_error}")
            return False

    def disconnect(self):
        self.running = False
        if self.connection:
            try:
                self.connection.close()
            except Exception:
                pass
            self.connection = None
        self.connection_status = ConnectionStatus.DISCONNECTED

    def _heartbeat_and_stream_loop(self):
        """
        Sends periodic GCS Heartbeats (1 Hz) and requests MAVLink telemetry streams from the Flight Controller.
        Rates are optimized for 57600 baud telemetry radio bandwidth (2-4 Hz) to prevent air buffer saturation.
        """
        from pymavlink import mavutil
        last_req = 0.0
        while self.running and self.connection:
            try:
                now = time.time()
                # 1. GCS Heartbeat (required for APM to stream data back)
                self.connection.mav.heartbeat_send(
                    mavutil.mavlink.MAV_TYPE_GCS,
                    mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                    0, 0, 0
                )
                # 2. Request data streams every 5.0s
                if now - last_req >= 5.0:
                    fc_sys = self.system_id if (self.system_id and self.system_id != 51) else 1
                    target_comp = 0
                    
                    # High-speed telemetry stream rates (adaptive: 10-20 Hz for USB/high-baud, 4-10 Hz for radio)
                    is_high_speed = (self.baud_rate >= 115200 or self.connection_type in ("USB_SERIAL", "UDP"))
                    rate_fast = 20 if is_high_speed else 10
                    rate_med = 10 if is_high_speed else 5
                    rate_slow = 4 if is_high_speed else 2
                    
                    streams = [
                        (mavutil.mavlink.MAV_DATA_STREAM_EXTRA1, rate_fast),        # Attitude & dynamics
                        (mavutil.mavlink.MAV_DATA_STREAM_EXTRA2, rate_fast),        # VFR_HUD (throttle, airspeed, heading)
                        (mavutil.mavlink.MAV_DATA_STREAM_RAW_CONTROLLER, rate_fast),# SERVO_OUTPUT_RAW
                        (mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, rate_med),    # IMU, Scaled Pressure
                        (mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, rate_med),# SYS_STATUS, Battery
                        (mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS, rate_med),    # Pilot sticks
                        (mavutil.mavlink.MAV_DATA_STREAM_POSITION, rate_slow),      # GPS & Altitudes
                        (mavutil.mavlink.MAV_DATA_STREAM_EXTRA3, rate_slow),
                    ]
                    for stream_id, rate in streams:
                        try:
                            self.connection.mav.request_data_stream_send(
                                fc_sys, target_comp, stream_id, rate, 1
                            )
                        except Exception:
                            pass
                                
                    # MAVLink 2 message intervals (50,000 µs = 20 Hz, 100,000 µs = 10 Hz)
                    fast_interval_us = 50000 if is_high_speed else 100000
                    for msg_id in (30, 36, 74, 1, 147, 241):  # ATTITUDE, SERVO_OUTPUT_RAW, VFR_HUD, SYS_STATUS, BATTERY_STATUS, VIBRATION
                        try:
                            self.connection.mav.command_long_send(
                                fc_sys, 0,
                                mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL,
                                0,
                                msg_id,
                                fast_interval_us,
                                0, 0, 0, 0, 0
                            )
                        except Exception:
                            pass
                                
                    last_req = now
            except Exception as e:
                logger.debug(f"Stream request error: {e}")
            time.sleep(1.0)

    def _read_loop(self):
        """
        Ingests MAVLink packets directly from PyMAVLink without stealing or corrupting serial bytes.
        Maintains independent sequence numbering per transmitter source (sys, comp).
        Drains all available queued messages immediately for zero packet latency.
        """
        while self.running and self.connection:
            try:
                packets_processed = 0
                while True:
                    msg = self.connection.recv_match(blocking=False)
                    if not msg:
                        break
                    packets_processed += 1
                    now = time.time()
                    self.last_packet_time = now
                    self.packets_received += 1
                    self._packet_timestamps.append(now)
                    self.connection_status = ConnectionStatus.CONNECTED
                    
                    # Capture Protocol & System Identity
                    header = getattr(msg, "_header", None)
                    msg_src_sys = getattr(header, "srcSystem", None) if header else None
                    msg_src_comp = getattr(header, "srcComponent", None) if header else None
                    msg_seq = getattr(header, "seq", None) if header else None
                    
                    # Per-source sequence loss tracking (separates radio dongle seq from autopilot seq)
                    if msg_src_sys is not None and msg_seq is not None:
                        src_key = (msg_src_sys, msg_src_comp or 0)
                        if src_key in self.last_seq_by_source:
                            expected_seq = (self.last_seq_by_source[src_key] + 1) % 256
                            if msg_seq != expected_seq:
                                diff = (msg_seq - expected_seq) % 256
                                if diff < 50:
                                    self.packets_dropped += diff
                        self.last_seq_by_source[src_key] = msg_seq
                            
                    msg_type = msg.get_type()
                    if msg_type == "HEARTBEAT":
                        if msg_src_sys not in (0, 51):
                            self.last_heartbeat_time = now
                            self.last_flight_telemetry_time = now
                            if msg_src_sys is not None:
                                self.system_id = msg_src_sys
                            if msg_src_comp is not None:
                                self.component_id = msg_src_comp
                    elif msg_type in ("RADIO", "RADIO_STATUS"):
                        self.last_radio_time = now
                        self.radio_rssi = float(getattr(msg, "rssi", 0))
                        self.radio_remrssi = float(getattr(msg, "remrssi", 0))
                        self.radio_noise = float(getattr(msg, "noise", 0))
                        self.radio_remnoise = float(getattr(msg, "remnoise", 0))
                        self.radio_txbuf = float(getattr(msg, "txbuf", 100))
                    else:
                        # Flight controller message
                        if msg_src_sys not in (0, 51):
                            self.last_flight_telemetry_time = now
                            if msg_src_sys is not None:
                                self.system_id = msg_src_sys
                            if msg_src_comp is not None:
                                self.component_id = msg_src_comp
                    
                    parsed = mavlink_parser.parse_message(msg)
                    if parsed:
                        telemetry_mapper.ingest_mavlink_dict(parsed)
                        
                        # Store in diagnostic trace
                        fields = {k: v for k, v in parsed.items() if k != "msg_type"}
                        self.recent_messages.appendleft({
                            "timestamp": round(now, 3),
                            "msg_type": msg_type,
                            "sys_id": msg_src_sys or self.system_id or 1,
                            "comp_id": msg_src_comp or self.component_id or 1,
                            "fields": fields
                        })
                    if packets_processed > 50:
                        break

                if packets_processed == 0:
                    # Buffer is temporarily empty; yield briefly to avoid busy wait
                    time.sleep(0.001)
            except Exception as e:
                self.last_error = str(e)
                time.sleep(0.01)


    def compute_message_rate(self) -> float:
        """Calculates current telemetry message reception rate in Hz."""
        if len(self._packet_timestamps) < 2:
            return 0.0
        time_span = self._packet_timestamps[-1] - self._packet_timestamps[0]
        if time_span <= 0.001:
            return 0.0
        return round((len(self._packet_timestamps) - 1) / time_span, 1)

    def get_status(self) -> Dict[str, Any]:
        now = time.time()
        connect_age = (now - getattr(self, "connect_time", 0.0)) if getattr(self, "connect_time", 0.0) > 0 else 999.0
        if self.last_packet_time > 0:
            is_stale = (now - self.last_packet_time > 3.0)
        else:
            # When newly connected, give 10 seconds grace period to establish stream before declaring stale
            is_stale = (connect_age > 10.0)
        
        status = self.connection_status
        if self.connection_status == ConnectionStatus.CONNECTED and is_stale:
            status = ConnectionStatus.STALE
        elif not self.running:
            status = ConnectionStatus.DISCONNECTED

        return {
            "is_connected": (status == ConnectionStatus.CONNECTED),
            "status": status.value,
            "connection_type": self.connection_type,
            "connection_string": self.connection_string,
            "baud_rate": self.baud_rate,
            "packets_received": self.packets_received,
            "packets_dropped": self.packets_dropped,
            "message_rate_hz": self.compute_message_rate(),
            "last_packet_age_sec": round(now - self.last_packet_time, 2) if self.last_packet_time > 0 else None,
            "last_error": self.last_error
        }

    def get_detailed_diagnostics(self) -> Dict[str, Any]:
        """Provides full real-time APM telemetry validation telemetry & diagnostic metrics."""
        now = time.time()
        rate_hz = self.compute_message_rate()
        age_ms = round((now - self.last_packet_time) * 1000.0, 1) if self.last_packet_time > 0 else None
        heartbeat_age_sec = round(now - self.last_heartbeat_time, 2) if self.last_heartbeat_time > 0 else None
        heartbeat_received = (heartbeat_age_sec is not None and heartbeat_age_sec < 4.0)
        
        status = self.get_status()["status"]
        
        return {
            "apm_connection": status,
            "heartbeat": "RECEIVED" if heartbeat_received else "NOT RECEIVED",
            "system_id": self.system_id if self.system_id is not None else 1,
            "component_id": self.component_id if self.component_id is not None else 1,
            "mavlink_protocol": self.mavlink_protocol,
            "autopilot_type": self.autopilot_type,
            "connection_type": self.connection_type,
            "connection_string": self.connection_string,
            "baud_rate": self.baud_rate,
            "telemetry_age_ms": age_ms,
            "message_rate_hz": rate_hz,
            "packets_received": self.packets_received,
            "packets_dropped": self.packets_dropped,
            "last_message_timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(self.last_packet_time)) if self.last_packet_time > 0 else "N/A",
            "last_error": self.last_error,
            "radio_link": {
                "active": ((now - self.last_radio_time) < 4.0) if self.last_radio_time > 0 else False,
                "rssi": self.radio_rssi,
                "remrssi": self.radio_remrssi,
                "txbuf": self.radio_txbuf
            },
            "field_provenance": telemetry_mapper.get_field_provenance(),
            "message_discovery": telemetry_mapper.get_message_discovery_table(),
            "field_availability": telemetry_mapper.get_field_availability_matrix(),
            "recent_messages": list(self.recent_messages)[:25]
        }


mavlink_manager = MAVLinkConnectionManager()

