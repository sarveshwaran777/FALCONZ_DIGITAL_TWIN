import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAppStore } from '../state/store';
import { wsService } from '../services/websocket';
import { FullSystemState } from '../types/telemetry';
import { Cpu, RotateCcw, Compass } from 'lucide-react';

export const Quadcopter3DViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const { systemState, theme } = useAppStore();
  const [activeDroneView, setActiveDroneView] = useState<'DRONE_1' | 'DRONE_2' | 'FORMATION'>('FORMATION');
  const activeDroneViewRef = useRef<'DRONE_1' | 'DRONE_2' | 'FORMATION'>('FORMATION');

  useEffect(() => {
    activeDroneViewRef.current = activeDroneView;
  }, [activeDroneView]);

  const telemetryRef = useRef({
    m1Rpm: 0, m2Rpm: 0, m3Rpm: 0, m4Rpm: 0,
    m1Status: 'GRAY', m2Status: 'GRAY', m3Status: 'GRAY', m4Status: 'GRAY',
    rollDeg: 0, pitchDeg: 0, yawDeg: 0,
    hasRealAttitude: false,
    flightMode: 'STABILIZE', isArmed: false, heartbeat: false, isConnected: false,
    vib: 0.05, temp: 25
  });

  const updateTelemetry = (state: FullSystemState) => {
    if (!state?.telemetry) return;
    const tel = state.telemetry;
    const motors = tel.motors || {};
    // Active telemetry streaming check: valid non-disconnected status, simulation, or active heartbeat
    const isConn = (tel.connection_status !== 'DISCONNECTED' && tel.connection_status !== undefined) || tel.source_type === 'SIMULATION' || !!tel.heartbeat_received;
    const hb = !!tel.heartbeat_received;

    const isMotorConn = (m: any) => {
      if (!m) return false;
      if (m.is_connected === false) return false;
      if (m.connection_status === 'DISCONNECTED' || m.connection_status === 'NOT CONNECTED') return false;
      return true;
    };

    const getStatus = (mId: 'motor_1' | 'motor_2' | 'motor_3' | 'motor_4') => {
      const m = motors[mId];
      if (m && !isMotorConn(m)) return 'DISCONNECTED';
      if (!isConn && tel.source_type === 'APM_MAVLINK' && !hb) return 'GRAY';

      // 1. Critical safety thresholds (overheating or severe vibration)
      const temp = m?.temperature_c ?? tel.temperature_c;
      const vib = m?.vibration_rms_g ?? tel.vibration_rms_g;
      if ((temp != null && temp > 75) || (vib != null && vib > 0.45)) return 'RED';

      // 2. Warning / degraded thresholds
      const mRpm = m?.live_rpm ?? m?.rpm ?? 0;
      const avgRpm = tel.avg_rpm ?? tel.rpm ?? 0;
      const isImbalanced = avgRpm > 400 && mRpm > 0 && Math.abs(mRpm - avgRpm) / avgRpm > 0.15;
      if ((temp != null && temp > 55) || (vib != null && vib > 0.25) || isImbalanced || (tel.rpm_imbalance_pct != null && tel.rpm_imbalance_pct > 15)) {
        return 'AMBER';
      }

      // 3. Healthy nominal link
      if (isConn || (m && isMotorConn(m))) return 'GREEN';
      return 'GRAY';
    };

    // Real attitude read from flight controller IMU / simulation
    const hasAttitude = (isConn || hb) && (tel.roll_deg !== undefined || tel.pitch_deg !== undefined);

    const getRpm = (mId: 'motor_1' | 'motor_2' | 'motor_3' | 'motor_4') => {
      const m = motors[mId];
      if (m && !isMotorConn(m)) return 0;
      const val = m?.live_rpm ?? m?.rpm;
      if (val != null && val > 0) return val;
      // If individual motor RPM not reported but drone is armed & global telemetry reports RPM
      if (isConn && tel.is_armed && tel.rpm && tel.rpm > 0) return tel.rpm;
      return 0;
    };

    telemetryRef.current = {
      m1Rpm: getRpm('motor_1'), m2Rpm: getRpm('motor_2'), m3Rpm: getRpm('motor_3'), m4Rpm: getRpm('motor_4'),
      m1Status: getStatus('motor_1'), m2Status: getStatus('motor_2'), m3Status: getStatus('motor_3'), m4Status: getStatus('motor_4'),
      rollDeg: tel.roll_deg ?? 0, pitchDeg: tel.pitch_deg ?? 0, yawDeg: (tel.yaw_deg !== undefined) ? tel.yaw_deg : (tel.heading_deg ?? 0),
      hasRealAttitude: !!hasAttitude, flightMode: tel.flight_mode || 'STABILIZE', isArmed: !!tel.is_armed,
      heartbeat: hb, isConnected: isConn, vib: tel.vibration_rms_g ?? 0.05, temp: tel.temperature_c ?? 25
    };
  };

  // Direct fast-path WebSocket listener (0ms render latency)
  useEffect(() => {
    const unsub = wsService.subscribe(updateTelemetry);
    return () => {
      unsub();
    };
  }, []);

  // React state synchronization fallback
  useEffect(() => {
    if (systemState) {
      updateTelemetry(systemState);
    }
  }, [systemState]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;
    const isDark = theme === 'dark';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 8, 18);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.1, 4.3);
    camera.lookAt(0, 0.18, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.05 : 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 1.8;
    controls.maxDistance = 9;
    controls.target.set(0, 0.18, 0);
    controlsRef.current = controls;

    // ——— Lights: realistic studio ———
    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.55 : 0.75);
    scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0xffffff, isDark ? 0x222222 : 0x444444, isDark ? 0.5 : 0.7);
    hemi.position.set(0, 8, 0);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.1 : 1.35);
    keyLight.position.set(5, 9, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -6; keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6; keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.4 : 0.5);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xffffff, 0.6, 12);
    rimLight.position.set(0, 2.5, 0);
    scene.add(rimLight);
    const topLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.75 : 0.95);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // Ground + shadow catcher
    const groundGeo = new THREE.PlaneGeometry(14, 14);
    const groundMat = new THREE.ShadowMaterial({ opacity: isDark ? 0.18 : 0.12 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.32;
    ground.receiveShadow = true;
    scene.add(ground);
    const gridHelper = new THREE.GridHelper(10, 20, isDark ? 0x333333 : 0xd4d4d4, isDark ? 0x1a1a1a : 0xeeeeee);
    gridHelper.position.y = -0.315;
    scene.add(gridHelper);

    const droneGroup = new THREE.Group();
    scene.add(droneGroup);

    // ——— Realistic PBR materials ———
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1e242e, roughness: 0.55, metalness: 0.15 });
    const centerPlateMat = new THREE.MeshStandardMaterial({ color: 0x0f1419, roughness: 0.35, metalness: 0.4 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1e242e, roughness: 0.5, metalness: 0.12 });
    const motorBellMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.28, metalness: 0.75 });
    const motorBaseMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.35, metalness: 0.85 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, metalness: 0.6, emissive: 0x7c2d12, emissiveIntensity: isDark ? 0.06 : 0 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.45, metalness: 0.05 });
    const propHubMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.6 });
    const escMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6, metalness: 0.1 });
    const escLabelMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 });
    const batteryMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.1 });
    const batteryLabelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    
    // High-fidelity APM materials
    const apmBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.25 });
    const apmDampingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6, metalness: 0.35 });
    const apmSiliconeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5, metalness: 0.05 });
    const apmPortMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.6 });
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.95 });
    const connectorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.1 });
    const usbShieldMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
    
    // Active APM LED materials
    const armLedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 });
    const gpsLedMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.8 });
    const aliveLedMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.7 });

    const legMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.6, metalness: 0.05 });
    const footMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const gpsMastMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.4, metalness: 0.6 });
    const gpsPuckMat = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.3, metalness: 0.05 });
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });

    // Fallback procedural frame group (hidden automatically when CAD GLB loads)
    const fallbackFrameGroup = new THREE.Group();
    droneGroup.add(fallbackFrameGroup);

    // ——— Try load detailed F450 GLB, fallback to procedural frame ———
    let glbLoaded = false;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/models/f450_frame.glb', (gltf) => {
      glbLoaded = true;
      fallbackFrameGroup.visible = false;
      const cad = gltf.scene;
      cad.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.castShadow = true; m.receiveShadow = true;
          // Enhance carbon look: darken and add slight metalness
          if (m.material && (m.material as any).color) {
            const mat = m.material as THREE.MeshStandardMaterial;
            if (mat.color.getHex() === 0xffffff || mat.color.getHex() === 0xfafafa) {
              mat.color.setHex(0x1e242e);
              mat.roughness = 0.55; mat.metalness = 0.12;
            }
          }
        }
      });
      // slight scale normalize and center
      const box = new THREE.Box3().setFromObject(cad);
      const center = box.getCenter(new THREE.Vector3());
      cad.position.sub(center);
      cad.position.y += 0.05;
      droneGroup.add(cad);
    }, undefined, () => {
      glbLoaded = false;
      fallbackFrameGroup.visible = true;
    });

    // ——— Procedural fallback frame (clean backup if GLB is unavailable) ———
    {
      const plateTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.62), centerPlateMat);
      plateTop.position.y = 0.252; plateTop.castShadow = true; plateTop.receiveShadow = true; fallbackFrameGroup.add(plateTop);
      const plateBottom = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.62), centerPlateMat);
      plateBottom.position.y = -0.06; plateBottom.castShadow = true; fallbackFrameGroup.add(plateBottom);
      // Arms — 4 rectangular + circular tube
      const armFallbackPositions = [
        { x: 1.269, z: -1.302 }, { x: -1.180, z: 1.363 }, { x: -1.315, z: -1.234 }, { x: 1.296, z: 1.266 }
      ];
      armFallbackPositions.forEach((p) => {
        const len = Math.sqrt(p.x*p.x + p.z*p.z);
        const ang = Math.atan2(p.z, p.x);
        const armGeo = new THREE.BoxGeometry(len, 0.03, 0.055);
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(p.x * 0.5, 0.10, p.z * 0.5);
        arm.rotation.y = -ang;
        arm.castShadow = true; arm.receiveShadow = true;
        fallbackFrameGroup.add(arm);
      });
    }

    // ——— Landing gear — realistic X skid ———
    const skidY = -0.28;
    const skidLegs = [
      { x: 0.22, z: 0.22 }, { x: -0.22, z: 0.22 },
      { x: 0.22, z: -0.22 }, { x: -0.22, z: -0.22 }
    ];
    skidLegs.forEach(p => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8), legMat);
      leg.position.set(p.x, -0.16, p.z);
      leg.castShadow = true; droneGroup.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 12), footMat);
      foot.position.set(p.x, skidY + 0.003, p.z); droneGroup.add(foot);
    });
    // Skids horizontal
    const skidBarGeo = new THREE.BoxGeometry(0.58, 0.012, 0.012);
    const skidBar1 = new THREE.Mesh(skidBarGeo, legMat); skidBar1.position.set(0, skidY, 0.22); droneGroup.add(skidBar1);
    const skidBar2 = new THREE.Mesh(skidBarGeo, legMat); skidBar2.position.set(0, skidY, -0.22); droneGroup.add(skidBar2);

    // ——— Battery (Mounted under the bottom plate) ———
    const batt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.80), batteryMat);
    batt.position.y = -0.14; batt.castShadow = true; droneGroup.add(batt);
    const battStrap1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.012, 0.04), new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }));
    battStrap1.position.set(0, -0.10, 0.18); droneGroup.add(battStrap1);
    const battStrap2 = battStrap1.clone(); battStrap2.position.set(0, -0.10, -0.18); droneGroup.add(battStrap2);
    const battLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.05), batteryLabelMat);
    battLabel.rotation.x = Math.PI/2; battLabel.position.set(0, -0.22, 0); // bottom
    droneGroup.add(battLabel);
    // XT60 connector + wires
    const xt60 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.018, 0.02), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }));
    xt60.position.set(0.23, -0.12, 0); droneGroup.add(xt60);
    const battWireCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.21, -0.12, 0), new THREE.Vector3(0.28, -0.09, 0), new THREE.Vector3(0.32, -0.04, 0)]);
    const battWire1 = new THREE.Mesh(new THREE.TubeGeometry(battWireCurve, 6, 0.005, 6, false), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    const battWire2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.21, -0.12, 0.012), new THREE.Vector3(0.28, -0.09, 0.012), new THREE.Vector3(0.32, -0.04, 0.012)]), 6, 0.005, 6, false), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    droneGroup.add(battWire1); droneGroup.add(battWire2);

    // ——— APM 2.8 FLIGHT CONTROLLER STACK (MOUNTED ABOVE THE CENTER PLATE) ———
    const apmStack = new THREE.Group();
    droneGroup.add(apmStack);

    // Vibration Damping Mount (Mounted securely on top center plate at y = 0.257)
    const dampLower = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.008, 0.38), apmDampingMat);
    dampLower.position.set(0, 0.261, 0);
    dampLower.castShadow = true; dampLower.receiveShadow = true;
    apmStack.add(dampLower);

    // 4 Brass Standoff Screws securing damping mount to top center plate
    [
      { x: 0.16, z: 0.16 }, { x: -0.16, z: 0.16 },
      { x: 0.16, z: -0.16 }, { x: -0.16, z: -0.16 }
    ].forEach(p => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.014, 8), screwMat);
      screw.position.set(p.x, 0.263, p.z);
      apmStack.add(screw);
    });

    // 4 Silicone Vibration Damping Balls
    const dampBallGeo = new THREE.SphereGeometry(0.016, 12, 12);
    [
      { x: 0.13, z: 0.13 }, { x: -0.13, z: 0.13 },
      { x: 0.13, z: -0.13 }, { x: -0.13, z: -0.13 }
    ].forEach(p => {
      const ball = new THREE.Mesh(dampBallGeo, apmSiliconeMat);
      ball.position.set(p.x, 0.274, p.z);
      ball.castShadow = true;
      apmStack.add(ball);
    });

    // Upper isolated carbon mounting plate
    const dampUpper = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.008, 0.36), apmDampingMat);
    dampUpper.position.set(0, 0.286, 0);
    dampUpper.castShadow = true; dampUpper.receiveShadow = true;
    apmStack.add(dampUpper);

    // APM 2.8 Main Enclosure Body (Signature dark translucent smoke casing)
    const apmBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.055, 0.32), apmBodyMat);
    apmBody.position.set(0, 0.318, 0);
    apmBody.castShadow = true; apmBody.receiveShadow = true;
    apmStack.add(apmBody);

    // APM 2.8 Raised Top Bevel / Face
    const apmTopBevel = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.012, 0.25), apmBodyMat);
    apmTopBevel.position.set(0, 0.348, 0);
    apmTopBevel.castShadow = true;
    apmStack.add(apmTopBevel);

    // Authentic APM 2.8 Canvas Texture with Forward Arrow and Autopilot Branding
    const createApmTexture = () => {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 512;
      const ctx = cv.getContext('2d');
      if (!ctx) return null;

      // Dark chassis background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Outer bezel accent
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, 480, 480);

      // Inner border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 32, 448, 448);

      // Top title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ARDUPILOT MEGA 2.8', 256, 88);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('FLIGHT CONTROLLER • APM v2.8', 256, 120);

      // Divider line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 142);
      ctx.lineTo(452, 142);
      ctx.stroke();

      // Bold directional arrow pointing forward (-Z direction in 3D scene)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(256, 170); // Tip pointing forward (-Z)
      ctx.lineTo(310, 248);
      ctx.lineTo(278, 248);
      ctx.lineTo(278, 320);
      ctx.lineTo(234, 320);
      ctx.lineTo(234, 248);
      ctx.lineTo(202, 248);
      ctx.closePath();
      ctx.fill();

      // Forward text
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('▲ FORWARD ▲', 256, 360);

      // Bottom ports & indicators
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('◄ INPUTS [CH 1-8]     OUTPUTS [CH 1-8] ►', 256, 410);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px monospace';
      ctx.fillText('TELEM 1 / I2C / GPS / USB / COMPASS', 256, 450);

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const apmDecalTex = createApmTexture();
    const apmDecalMat = new THREE.MeshStandardMaterial({
      map: apmDecalTex,
      roughness: 0.3,
      metalness: 0.1
    });
    const apmDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.23), apmDecalMat);
    apmDecal.rotation.x = -Math.PI / 2;
    apmDecal.position.set(0, 0.355, 0);
    apmStack.add(apmDecal);

    // Active Status LEDs on APM Face (Blink & Pulse with live telemetry)
    const armLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), armLedMat);
    armLed.position.set(0.09, 0.358, 0.07);
    apmStack.add(armLed);

    const gpsLed = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 10), gpsLedMat);
    gpsLed.position.set(0.09, 0.358, 0.02);
    apmStack.add(gpsLed);

    const aliveLed = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), aliveLedMat);
    aliveLed.position.set(0.09, 0.358, -0.03);
    apmStack.add(aliveLed);

    // Rear Servo Output Rail (Channels 1-8, +Z rear side)
    const servoRail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.024, 0.035), apmPortMat);
    servoRail.position.set(0, 0.318, 0.165);
    apmStack.add(servoRail);
    for (let p = -3.5; p <= 3.5; p += 1.0) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.016, 6), goldPinMat);
      pin.position.set(p * 0.026, 0.322, 0.174);
      apmStack.add(pin);
    }

    // Front Input RC Rail (-Z front side)
    const inputRail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.022, 0.03), apmPortMat);
    inputRail.position.set(0, 0.318, -0.165);
    apmStack.add(inputRail);

    // Right Side Mini-USB & DF13 Connectors (+X side)
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.014, 0.032), usbShieldMat);
    usb.position.set(0.168, 0.318, -0.05);
    apmStack.add(usb);

    const telemPort = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.015, 0.038), connectorMat);
    telemPort.position.set(0.168, 0.318, 0.04);
    apmStack.add(telemPort);

    const gpsPort = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.015, 0.038), connectorMat);
    gpsPort.position.set(0.168, 0.318, 0.09);
    apmStack.add(gpsPort);

    // Realistic Micro-Wiring from APM down to frame
    const apmWireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.315, 0.175),
      new THREE.Vector3(0.08, 0.280, 0.200),
      new THREE.Vector3(0.12, 0.255, 0.220)
    ]);
    const apmWire = new THREE.Mesh(new THREE.TubeGeometry(apmWireCurve, 6, 0.004, 6, false), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 }));
    apmStack.add(apmWire);

    // ——— GPS Mast & Pedestal (Mounted on top center plate at y = 0.257) ———
    const gpsBase = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.016, 12), new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 }));
    gpsBase.position.set(-0.16, 0.265, -0.16);
    gpsBase.castShadow = true;
    droneGroup.add(gpsBase);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 8), gpsMastMat);
    mast.position.set(-0.16, 0.385, -0.16);
    mast.castShadow = true;
    droneGroup.add(mast);

    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.014, 20), gpsPuckMat);
    puck.position.set(-0.16, 0.505, -0.16);
    puck.castShadow = true;
    droneGroup.add(puck);

    // GPS Status LED on puck top
    const gpsPuckLed = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), gpsLedMat);
    gpsPuckLed.position.set(-0.14, 0.513, -0.14);
    droneGroup.add(gpsPuckLed);

    // 915MHz Telemetry Duck Antenna (Mounted on center plate bracket)
    const antBase = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.018, 8), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 }));
    antBase.position.set(0.16, 0.266, 0.16);
    droneGroup.add(antBase);

    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.24, 6), antennaMat);
    ant.position.set(0.18, 0.380, 0.18);
    ant.rotation.z = 0.12; ant.rotation.x = -0.12;
    droneGroup.add(ant);

    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    antTip.position.set(0.20, 0.495, 0.20);
    droneGroup.add(antTip);

    // ——— MOTORS (MOUNTED DIRECTLY AT THE FOUR CORNERS OF THE FRAME) ———
    // Aligned precisely with CAD arm corner circular motor mount pads and hole centers
    const armPositions = [
      { id: 'm1', x: 1.269, z: -1.302, cw: true },  // Front Right (M1) - Corner of frame
      { id: 'm2', x: -1.180, z: 1.363, cw: true },  // Rear Left (M2) - Corner of frame
      { id: 'm3', x: -1.315, z: -1.234, cw: false }, // Front Left (M3) - Corner of frame
      { id: 'm4', x: 1.296, z: 1.266, cw: false }   // Rear Right (M4) - Corner of frame
    ];
    const motorStatusMeshes: Record<string, THREE.Mesh> = {};
    const propGroups: Record<string, THREE.Group> = {};
    const rotorRings: Record<string, THREE.Mesh> = {};
    const rotorDiscs: Record<string, THREE.Mesh> = {};

    // Precision aerospace carbon blade material (rich slate composite, crisp edge reflections)
    const propBladeMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x2e3846 : 0x1e293b,
      roughness: 0.28,
      metalness: 0.35
    });

    // High-contrast tip visibility stripe (crisp aeronautical white / silver)
    const propTipMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.15,
      emissive: 0xffffff,
      emissiveIntensity: 0.08
    });

    // Reusable aerodynamic airfoil blade 2D profile
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0.04, -0.016);
    bladeShape.bezierCurveTo(0.14, -0.038, 0.28, -0.048, 0.40, -0.042);
    bladeShape.bezierCurveTo(0.50, -0.036, 0.56, -0.024, 0.59, -0.006);
    bladeShape.bezierCurveTo(0.60, 0.002, 0.595, 0.010, 0.58, 0.018);
    bladeShape.bezierCurveTo(0.50, 0.034, 0.36, 0.040, 0.24, 0.032);
    bladeShape.bezierCurveTo(0.12, 0.024, 0.06, 0.016, 0.04, 0.016);
    bladeShape.closePath();

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002
    });

    // Outer 15% high-visibility tip stripe
    const tipShape = new THREE.Shape();
    tipShape.moveTo(0.48, -0.036);
    tipShape.bezierCurveTo(0.53, -0.028, 0.56, -0.020, 0.59, -0.006);
    tipShape.bezierCurveTo(0.60, 0.002, 0.595, 0.010, 0.58, 0.018);
    tipShape.bezierCurveTo(0.54, 0.028, 0.50, 0.032, 0.48, 0.034);
    tipShape.closePath();

    const tipGeo = new THREE.ExtrudeGeometry(tipShape, {
      depth: 0.0086,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.001,
      bevelThickness: 0.001
    });

    armPositions.forEach((arm) => {
      const base = new THREE.Group();
      // Mount sits flush on top of the arm corner circular motor pad at y = 0.144
      base.position.set(arm.x, 0.144, arm.z);
      droneGroup.add(base);

      // Motor mount base flange (sits flush on top of arm pad)
      const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.012, 16), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.3 }));
      mount.position.y = 0.006; mount.castShadow = true; base.add(mount);

      // 4 M3 stainless steel motor mount screws securing motor onto arm
      for (let s = 0; s < 4; s++) {
        const ang = (s * Math.PI) / 2 + Math.PI / 4;
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.018, 8), screwMat);
        screw.position.set(Math.cos(ang) * 0.085, 0.012, Math.sin(ang) * 0.085);
        base.add(screw);
      }

      // Halo status ring (active glowing status indicator around motor base)
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.009, 10, 28), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.0, transparent: true, opacity: 0.9 }));
      halo.rotation.x = Math.PI/2; halo.position.y = 0.014; base.add(halo);
      motorStatusMeshes[arm.id] = halo as any;

      // Stator base
      const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.085, 24), motorBaseMat);
      stator.position.y = 0.055; stator.castShadow = true; base.add(stator);

      // Windings copper ring
      const winding = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.018, 10, 20), copperMat);
      winding.rotation.x = Math.PI/2; winding.position.y = 0.060; base.add(winding);

      // Motor Bell (Rotor outer casing)
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.105, 0.075, 24), motorBellMat);
      bell.position.y = 0.125; bell.castShadow = true; base.add(bell);

      // Shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.15 }));
      shaft.position.y = 0.175; base.add(shaft);

      // Prop adapter
      const adapter = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.5 }));
      adapter.position.y = 0.185; base.add(adapter);

      // Prop group at shaft top (elevated cleanly above the motor assembly)
      const propGroup = new THREE.Group();
      propGroup.name = `propGroup_${arm.id}`;
      propGroup.position.y = 0.195;
      base.add(propGroup);
      propGroups[arm.id] = propGroup;

      // Aluminum CNC Hub Collar
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.016, 20),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 })
      );
      hub.position.y = 0.006;
      hub.castShadow = true;
      propGroup.add(hub);

      // Anodized Aerodynamic Bullet Spinner Nut (Polished Silver for CW, Electric Blue for CCW)
      const nutMat = new THREE.MeshStandardMaterial({
        color: arm.cw ? 0xe2e8f0 : 0x2563eb,
        metalness: 0.85,
        roughness: 0.2
      });
      const nut = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.038, 16), nutMat);
      nut.position.y = 0.026;
      nut.castShadow = true;
      propGroup.add(nut);

      // Two aerodynamic wings (opposing 180 degrees)
      [0, Math.PI].forEach((ang) => {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.y = ang;

        const bladeMesh = new THREE.Mesh(bladeGeo, propBladeMat);
        bladeMesh.rotation.x = -Math.PI / 2 + (arm.cw ? 0.12 : -0.12);
        bladeMesh.position.y = 0.006;
        bladeMesh.castShadow = true;
        bladeGroup.add(bladeMesh);

        const tipMesh = new THREE.Mesh(tipGeo, propTipMat);
        tipMesh.rotation.x = -Math.PI / 2 + (arm.cw ? 0.12 : -0.12);
        tipMesh.position.y = 0.0062;
        tipMesh.castShadow = true;
        bladeGroup.add(tipMesh);

        propGroup.add(bladeGroup);
      });

      // Clean, elegant aerodynamic rotor-plane perimeter ring & subtle disk
      const rotorRingGeo = new THREE.RingGeometry(0.585, 0.598, 48);
      const rotorRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const rotorRing = new THREE.Mesh(rotorRingGeo, rotorRingMat);
      rotorRing.rotation.x = Math.PI / 2;
      rotorRing.position.y = 0.006;
      propGroup.add(rotorRing);
      rotorRings[arm.id] = rotorRing;

      const rotorDiscGeo = new THREE.CircleGeometry(0.585, 48);
      const rotorDiscMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x94a3b8 : 0x64748b,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const rotorDisc = new THREE.Mesh(rotorDiscGeo, rotorDiscMat);
      rotorDisc.rotation.x = Math.PI / 2;
      rotorDisc.position.y = 0.005;
      propGroup.add(rotorDisc);
      rotorDiscs[arm.id] = rotorDisc;
    });

    // Secondary Aircraft (Drone 2) for Dual 3D Swarm Formation
    const droneGroup2 = droneGroup.clone(true);
    droneGroup2.position.set(1.8, 0, 0);
    scene.add(droneGroup2);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const now = clock.getElapsedTime();
      const t = telemetryRef.current;

      const colorMap: Record<string, { color: number, emissive: number, intensity: number }> = {
        GREEN: { color: 0x22c55e, emissive: 0x22c55e, intensity: 1.0 },
        AMBER: { color: 0xf59e0b, emissive: 0xf59e0b, intensity: 0.9 },
        RED: { color: 0xef4444, emissive: 0xef4444, intensity: 1.0 },
        GRAY: { color: 0x6b7280, emissive: 0x6b7280, intensity: 0.0 },
        DISCONNECTED: { color: 0x4b5563, emissive: 0x000000, intensity: 0.0 }
      };
      (['m1','m2','m3','m4'] as const).forEach(k => {
        const mesh = motorStatusMeshes[k];
        const status = (t as any)[`${k}Status`] as string;
        const cfg = colorMap[status] ?? colorMap.GRAY;
        if (mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(cfg.color);
          (mat as any).emissive.setHex(cfg.emissive);
          mat.emissiveIntensity = cfg.intensity * (0.7 + 0.3*Math.sin(now*3 + (k==='m1'?0: k==='m2'?1: k==='m3'?2:3)));
          mat.opacity = status==='DISCONNECTED' ? 0.25 : 0.95;
        }
      });

      // Props + Rotor aerodynamics
      const rpmMap: Record<string, number> = { m1: t.m1Rpm, m2: t.m2Rpm, m3: t.m3Rpm, m4: t.m4Rpm };
      (['m1', 'm2', 'm3', 'm4'] as const).forEach(k => {
        const rpm = rpmMap[k];
        const grp = propGroups[k];
        const ring = rotorRings[k];
        const disc = rotorDiscs[k];
        if (!grp) return;
        const isCCW = k === 'm3' || k === 'm4';
        const dir = isCCW ? -1 : 1;

        if (rpm > 0) {
          // Visually fluid spin rate that scales with RPM without 60Hz temporal aliasing or stroboscopic jitter
          const spinSpeed = Math.min(24.0, 3.5 + (rpm / 4500.0) * 16.5);
          grp.rotation.y += dir * spinSpeed * dt;
        }

        // Clean subtle rotor sweep plane highlight when spinning — wings remain 100% sharp and solid!
        if (ring && disc) {
          if (rpm > 200) {
            const ringAlpha = Math.min(0.28, 0.08 + (rpm / 6000.0) * 0.20);
            const discAlpha = Math.min(0.06, 0.01 + (rpm / 6000.0) * 0.05);
            (ring.material as THREE.MeshBasicMaterial).opacity = ringAlpha;
            (disc.material as THREE.MeshBasicMaterial).opacity = discAlpha;
          } else {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0;
            (disc.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }
      });

      // Active APM LEDs based on live telemetry & armed state
      if (t.isConnected) {
        if (t.isArmed) {
          // Armed: Solid Green on APM
          armLedMat.color.setHex(0x22c55e);
          (armLedMat as any).emissive.setHex(0x22c55e);
          armLedMat.emissiveIntensity = 1.0;
        } else {
          // Disarmed: Slow pulsing red warning
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(now * 3));
          armLedMat.color.setHex(0xef4444);
          (armLedMat as any).emissive.setHex(0xef4444);
          armLedMat.emissiveIntensity = pulse;
        }

        // GPS status: Solid Blue when heartbeat active, fast blink if acquiring
        const gpsBlink = Math.floor(now * 4) % 2 === 0;
        gpsLedMat.color.setHex(0x3b82f6);
        (gpsLedMat as any).emissive.setHex(0x3b82f6);
        gpsLedMat.emissiveIntensity = t.heartbeat ? 0.95 : (gpsBlink ? 0.9 : 0.1);

        // Power/Alive: Solid Emerald Green
        aliveLedMat.color.setHex(0x10b981);
        (aliveLedMat as any).emissive.setHex(0x10b981);
        aliveLedMat.emissiveIntensity = 0.8;
      } else {
        armLedMat.color.setHex(0x6b7280);
        (armLedMat as any).emissive.setHex(0x000000);
        armLedMat.emissiveIntensity = 0;

        gpsLedMat.color.setHex(0x4b5563);
        (gpsLedMat as any).emissive.setHex(0x000000);
        gpsLedMat.emissiveIntensity = 0;

        aliveLedMat.color.setHex(0x4b5563);
        (aliveLedMat as any).emissive.setHex(0x000000);
        aliveLedMat.emissiveIntensity = 0;
      }

      // Vibration & Swarm Formation Kinematics
      const vib = Math.min(0.025, t.vib * 0.04);
      const mode = activeDroneViewRef.current;

      if (mode === 'FORMATION') {
        droneGroup.visible = true;
        droneGroup2.visible = true;

        droneGroup.position.set(-1.8 + Math.sin(now*31)*vib*0.15, Math.sin(now*38)*vib*0.5 + Math.sin(now*72)*vib*0.25, Math.cos(now*29)*vib*0.12);
        droneGroup2.position.set(1.8 + Math.sin(now*27)*vib*0.15, Math.sin(now*1.8 + 0.8)*0.08 + Math.sin(now*34)*vib*0.35, Math.cos(now*23)*vib*0.12);
        droneGroup2.rotation.y = Math.sin(now * 0.28) * 0.06;
        droneGroup2.rotation.z = Math.sin(now * 0.6) * 0.02;

        droneGroup2.traverse((child) => {
          if (child.name && child.name.startsWith('propGroup_')) {
            child.rotation.y += 18.0 * dt;
          }
        });
      } else if (mode === 'DRONE_1') {
        droneGroup.visible = true;
        droneGroup2.visible = false;
        droneGroup.position.set(Math.sin(now*31)*vib*0.15, Math.sin(now*38)*vib*0.5 + Math.sin(now*72)*vib*0.25, Math.cos(now*29)*vib*0.12);
      } else {
        droneGroup.visible = false;
        droneGroup2.visible = true;
        droneGroup2.position.set(Math.sin(now*27)*vib*0.15, Math.sin(now*1.8)*0.06, Math.cos(now*23)*vib*0.12);
        droneGroup2.traverse((child) => {
          if (child.name && child.name.startsWith('propGroup_')) {
            child.rotation.y += 18.0 * dt;
          }
        });
      }

      // Attitude: zero-latency tracking on active target
      if (t.hasRealAttitude) {
        const tp = (t.pitchDeg * Math.PI)/180, tr = (t.rollDeg * Math.PI)/180, ty = (t.yawDeg * Math.PI)/180;
        droneGroup.rotation.x += (tp - droneGroup.rotation.x) * Math.min(1, dt * 25);
        droneGroup.rotation.z += (-tr - droneGroup.rotation.z) * Math.min(1, dt * 25);
        droneGroup.rotation.y += (-ty - droneGroup.rotation.y) * Math.min(1, dt * 20);
      } else if (t.isConnected) {
        droneGroup.rotation.x += (0 - droneGroup.rotation.x) * Math.min(1, dt * 15);
        droneGroup.rotation.z += (0 - droneGroup.rotation.z) * Math.min(1, dt * 15);
        droneGroup.rotation.y += (0 - droneGroup.rotation.y) * Math.min(1, dt * 10);
      } else {
        droneGroup.rotation.y = Math.sin(now*0.18)*0.14;
        droneGroup.rotation.z = Math.sin(now*0.32)*0.012;
        droneGroup.rotation.x = Math.cos(now*0.24)*0.008;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth, nh = container.clientHeight;
      camera.aspect = nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      scene.traverse((obj:any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m:any)=>m.dispose());
          else obj.material.dispose();
        }
      });
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [theme]);

  const handleResetView = () => {
    if (controlsRef.current) {
      if (activeDroneViewRef.current === 'FORMATION') {
        controlsRef.current.object.position.set(0, 3.8, 6.2);
        controlsRef.current.target.set(0, 0.18, 0);
      } else {
        controlsRef.current.object.position.set(0, 3.1, 4.3);
        controlsRef.current.target.set(0, 0.18, 0);
      }
      controlsRef.current.update();
    }
  };

  const tel = systemState?.telemetry;
  const isConn = (tel?.connection_status !== 'DISCONNECTED' && tel?.connection_status !== undefined) || tel?.source_type === 'SIMULATION' || !!tel?.heartbeat_received;
  const flightMode = tel?.flight_mode || 'STABILIZE';
  const isArmed = !!tel?.is_armed;
  const headingDeg = Math.round(tel?.yaw_deg ?? tel?.heading_deg ?? 0);
  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(((headingDeg % 360) + 360) % 360 / 45) % 8];

  const renderHud = (k: string, label: string) => {
    const m: any = tel?.motors?.[k];
    const conn = m ? (m.is_connected !== false && m.connection_status !== 'DISCONNECTED' && m.connection_status !== 'NOT CONNECTED') : isConn;
    const rpm = conn ? Math.round(m?.live_rpm ?? m?.rpm ?? (isArmed ? (tel?.rpm ?? 0) : 0)) : 0;
    const curr = conn && m?.current_a != null ? m.current_a.toFixed(2) : (tel?.current_a ? (tel.current_a / 4).toFixed(2) : '—');
    const thrust = conn ? Math.round(m?.thrust_g ?? (tel?.total_thrust_g ? tel.total_thrust_g / 4 : 0)) : 0;
    const temp = conn && m?.temperature_c != null ? Math.round(m.temperature_c) : (tel?.temperature_c != null ? Math.round(tel.temperature_c) : null);
    const vib = conn && m?.vibration_rms_g != null ? m.vibration_rms_g.toFixed(2) : (tel?.vibration_rms_g != null ? tel.vibration_rms_g.toFixed(2) : null);
    const isHot = temp !== null && temp > 60;
    const isWarning = isHot || (vib !== null && Number(vib) > 0.35);

    return (
      <div key={k} className="p-2.5 rounded-xl border backdrop-blur-md transition-colors bg-black/85" style={{ borderColor: isWarning ? '#ef4444' : '#27272a' }}>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="font-bold text-[11px] tracking-wide text-white">{label}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] border font-bold uppercase tracking-wider"
            style={{
              background: !conn ? '#18181b' : isHot ? '#dc2626' : rpm > 50 ? 'rgba(239, 68, 68, 0.2)' : '#18181b',
              color: !conn ? '#71717a' : isHot ? '#ffffff' : rpm > 50 ? '#ef4444' : '#ffffff',
              borderColor: isHot ? '#dc2626' : rpm > 50 ? '#ef4444' : '#27272a'
            }}
          >
            {!conn ? 'Offline' : isHot ? 'Hot' : rpm > 50 ? 'Spinning' : 'Ready'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-black tabular-nums tracking-tight text-white">
            {conn ? (rpm > 0 ? `${rpm.toLocaleString()} RPM` : '0 RPM') : '—'}
          </span>
          {conn && temp !== null && (
            <span className="text-[10px] tabular-nums font-bold" style={{ color: isHot ? '#ef4444' : '#d4d4d8' }}>
              {temp}°C
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] tabular-nums pt-1 border-t border-zinc-800 text-zinc-300 font-bold">
          <span>{curr}A</span>
          {thrust > 0 && <span>{thrust}g thrust</span>}
          {vib !== null && <span>{vib}g vib</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="aerospace-card p-5 relative overflow-hidden flex flex-col h-[540px] min-h-[480px] select-none bg-[#09090b] border-zinc-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-white text-black font-black"><Cpu className="w-3.5 h-3.5" /></div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-white uppercase tracking-wider">3D Digital Twin</span>
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full border border-zinc-800 font-bold text-zinc-300 bg-zinc-900">{flightMode}</span>
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1.5"
                style={{
                  background: isArmed ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: isArmed ? '#ef4444' : '#a1a1aa',
                  borderColor: isArmed ? '#ef4444' : '#27272a'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isArmed ? '#ef4444' : '#71717a' }} />
                {isArmed ? 'Armed' : 'Disarmed'}
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-800 text-[11px] font-mono font-bold text-white bg-black">
                <Compass className="w-3 h-3 text-red-500" />
                <span>{headingDeg}° {cardinal}</span>
              </div>
              {tel?.battery_voltage_v != null && (
                <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-zinc-800 text-[11px] font-mono font-bold text-zinc-300 bg-black">
                  <span>{tel.battery_voltage_v.toFixed(1)}V</span>
                  {tel?.battery_remaining_pct != null && <span>({Math.round(tel.battery_remaining_pct)}%)</span>}
                </div>
              )}
            </div>
            <div className="text-[11px] hidden sm:block mt-0.5 text-zinc-400 font-medium">
              {tel?.source_type === 'APM_MAVLINK' ? 'Live APM MAVLink' : 'Physics Simulation'} • Roll: {Math.round(tel?.roll_deg ?? 0)}° • Pitch: {Math.round(tel?.pitch_deg ?? 0)}° • Vib: {(tel?.vibration_rms_g ?? 0.05).toFixed(2)}g
            </div>
          </div>
        </div>

        {/* Multi-Drone Aircraft Switcher & 3D Formation Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-black border border-zinc-800 rounded-xl text-xs font-mono font-bold">
            <button
              onClick={() => {
                setActiveDroneView('DRONE_1');
                if (controlsRef.current) {
                  controlsRef.current.object.position.set(0, 3.1, 4.3);
                  controlsRef.current.target.set(0, 0.18, 0);
                  controlsRef.current.update();
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDroneView === 'DRONE_1' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>✈ #1 Falcon-X1</span>
              <span className="text-[9px] px-1 py-0.2 bg-black/40 rounded text-zinc-300">98.5%</span>
            </button>

            <button
              onClick={() => {
                setActiveDroneView('DRONE_2');
                if (controlsRef.current) {
                  controlsRef.current.object.position.set(0, 3.1, 4.3);
                  controlsRef.current.target.set(0, 0.18, 0);
                  controlsRef.current.update();
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDroneView === 'DRONE_2' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>✈ #2 Falcon-X2</span>
              <span className="text-[9px] px-1 py-0.2 bg-black/40 rounded text-zinc-300">84.0%</span>
            </button>

            <button
              onClick={() => {
                setActiveDroneView('FORMATION');
                if (controlsRef.current) {
                  controlsRef.current.object.position.set(0, 3.8, 6.2);
                  controlsRef.current.target.set(0, 0.18, 0);
                  controlsRef.current.update();
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDroneView === 'FORMATION' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⚔ Dual 3D Formation</span>
            </button>
          </div>

          <button onClick={handleResetView} className="text-xs px-3 py-1.5 rounded-xl border border-zinc-800 bg-black text-white font-bold transition-colors hover:border-red-500 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5 inline mr-1 text-red-500" />
            Reset View
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full flex-1 rounded-xl overflow-hidden border border-zinc-800 relative cursor-grab active:cursor-grabbing bg-black" />

      {/* Real-Time Dual Formation Aerial Overlay */}
      {activeDroneView === 'FORMATION' && (
        <div className="absolute top-24 left-6 right-6 z-10 flex items-center justify-between pointer-events-none text-xs font-mono font-bold animate-fadeIn">
          <div className="p-2 px-3 rounded-xl bg-black/85 border border-zinc-700 text-white flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>#1 FALCON-X1 (PRIMARY TWIN) • 98.5% NOMINAL</span>
          </div>

          <div className="p-2 px-3 rounded-xl bg-black/85 border border-red-500/50 text-white flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>#2 FALCON-X2 (ENDURANCE SCOUT) • 84.0% IN-FLIGHT</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 right-6 z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] select-none pointer-events-none">
        {renderHud('motor_1', 'M1 Front-R (CW)')}
        {renderHud('motor_2', 'M2 Rear-L (CW)')}
        {renderHud('motor_3', 'M3 Front-L (CCW)')}
        {renderHud('motor_4', 'M4 Rear-R (CCW)')}
      </div>
    </div>
  );
};
