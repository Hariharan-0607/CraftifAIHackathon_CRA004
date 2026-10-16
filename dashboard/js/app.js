/**
 * SafetySentinel AI - Persistent Sidebar & Event-Driven Alert Intercept Controller
 * Implements:
 * 1. Persistent Collapsible Left Sidebar (full labels to compact icons)
 * 2. Event-Driven Alert Intercept (Universal Top Banner with direct live-feed deep-link)
 * 3. Minimalist B&W Canvas Simulation & Telemetry Stream
 */

// Global State
const appState = {
  soundEnabled: true,
  webcamActive: false,
  showZones: true,
  showBBoxes: true,
  activeFilter: 'all',
  searchQuery: '',
  sidebarCollapsed: false,
  incidents: [],
  workers: [
    { id: 101, x: 220, y: 390, vx: 0.8, vy: 0.4, ppe: { helmet: true, vest: true } },
    { id: 102, x: 420, y: 320, vx: 1.1, vy: 0.6, ppe: { helmet: false, vest: true } },
    { id: 103, x: 1050, y: 440, vx: -0.7, vy: -0.3, ppe: { helmet: true, vest: false } },
    { id: 104, x: 720, y: 180, vx: 0.5, vy: 0.9, ppe: { helmet: true, vest: true } }
  ]
};

// Spatial Hazard Zones
const ZONES = [
  {
    id: "ZONE_ROBOTIC_CELL",
    name: "RESTRICTED ROBOTIC CELL",
    type: "RESTRICTED",
    polygon: [
      { x: 460, y: 260 },
      { x: 920, y: 260 },
      { x: 1020, y: 640 },
      { x: 360, y: 640 }
    ]
  },
  {
    id: "ZONE_FORKLIFT_LANE",
    name: "PPE MANDATORY CORRIDOR",
    type: "PPE_MANDATORY",
    polygon: [
      { x: 60, y: 200 },
      { x: 340, y: 200 },
      { x: 280, y: 660 },
      { x: 40, y: 660 }
    ]
  }
];

const VIEW_TITLES = {
  'page-live': 'Live Perception Feed',
  'page-matrix': 'Perception Node Matrix',
  'page-incidents': 'Incident Audit Trail',
  'page-benchmarks': 'TensorRT Performance Report',
  'page-pipeline': 'PipeGen 5-Stage Architecture Flow',
  'page-hardware': 'ESP32 Physical Actuator Node'
};

// Web Audio Tone Synthesizer
let audioCtx = null;
function playAlertTone(isCritical = true) {
  if (!appState.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 540, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isCritical ? 1760 : 660, audioCtx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.22);
  } catch (e) {
    console.warn("Audio Context waiting for interaction:", e);
  }
}

// Ray-casting point in polygon
function isPointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Canvas Monochrome Engine
const canvas = document.getElementById('sentinel-canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('webcam-video');

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (appState.webcamActive && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } else {
    drawMonochromeFactoryScene();
  }

  if (appState.showZones) {
    drawMonochromeHazardZones();
  }

  updateAndDrawWorkers();

  requestAnimationFrame(renderCanvas);
}

function drawMonochromeFactoryScene() {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Perspective floor grid
  ctx.strokeStyle = '#181818';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 160);
    ctx.lineTo(x * 1.3 - 200, canvas.height);
    ctx.stroke();
  }
  for (let y = 160; y < canvas.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Work cell pillar
  ctx.fillStyle = '#141414';
  ctx.fillRect(630, 360, 160, 110);
  ctx.strokeStyle = '#333333';
  ctx.strokeRect(630, 360, 160, 110);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(700, 340, 20, 20);

  ctx.fillStyle = '#666666';
  ctx.font = '10px JetBrains Mono';
  ctx.fillText('STATION 01 // ROBOTIC CELL', 635, 490);
}

function drawMonochromeHazardZones() {
  ZONES.forEach(zone => {
    ctx.beginPath();
    ctx.moveTo(zone.polygon[0].x, zone.polygon[0].y);
    for (let i = 1; i < zone.polygon.length; i++) {
      ctx.lineTo(zone.polygon[i].x, zone.polygon[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = zone.type === 'RESTRICTED' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = zone.type === 'RESTRICTED' ? 2 : 1;
    ctx.setLineDash(zone.type === 'RESTRICTED' ? [8, 5] : [3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const lx = zone.polygon[0].x + 10;
    const ly = zone.polygon[0].y + 20;
    ctx.fillStyle = '#000000';
    ctx.fillRect(lx - 2, ly - 12, ctx.measureText(zone.name).width + 12, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(lx - 2, ly - 12, ctx.measureText(zone.name).width + 12, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.fillText(zone.name, lx + 4, ly);
  });
}

function updateAndDrawWorkers() {
  let activeBreaches = 0;

  appState.workers.forEach(w => {
    w.x += w.vx;
    w.y += w.vy;

    if (w.x < 120 || w.x > 1160) w.vx *= -1;
    if (w.y < 220 || w.y > 660) w.vy *= -1;

    const footX = w.x;
    const footY = w.y + 65;

    let inZone = null;
    for (const zone of ZONES) {
      if (isPointInPolygon(footX, footY, zone.polygon)) {
        inZone = zone;
        break;
      }
    }

    let isViolating = false;
    let label = `ID #${w.id} [SAFE]`;

    if (inZone) {
      if (inZone.type === 'RESTRICTED') {
        isViolating = true;
        label = `ID #${w.id} [BREACH: CELL]`;
        activeBreaches++;
        triggerHazardBreach({
          workerId: `WORKER-${w.id}`,
          type: 'ZONE_INTRUSION',
          severity: 'CRITICAL',
          zone: inZone.name,
          action: 'EMERGENCY_MOTOR_CUTOFF',
          message: `Worker #${w.id} entered restricted robotic cell!`
        });
      } else if (inZone.type === 'PPE_MANDATORY' && !w.ppe.helmet) {
        isViolating = true;
        label = `ID #${w.id} [NO HELMET]`;
        activeBreaches++;
        triggerHazardBreach({
          workerId: `WORKER-${w.id}`,
          type: 'MISSING_PPE_HARDHAT',
          severity: 'HIGH',
          zone: inZone.name,
          action: 'WARNING_STROBE_CHIRP',
          message: `Worker #${w.id} missing safety helmet in transit corridor!`
        });
      }
    }

    if (appState.showBBoxes) {
      const boxW = 54;
      const boxH = 92;
      const boxX = w.x - boxW / 2;
      const boxY = w.y - 25;

      ctx.strokeStyle = isViolating ? '#ffffff' : '#666666';
      ctx.lineWidth = isViolating ? 2 : 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = isViolating ? '#ffffff' : '#222222';
      ctx.fillRect(boxX - 1, boxY - 18, ctx.measureText(label).width + 10, 17);
      ctx.fillStyle = isViolating ? '#000000' : '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.fillText(label, boxX + 4, boxY - 5);
    }
  });

  document.getElementById('metric-breaches').textContent = activeBreaches;
}

// ==============================================================================
// PATTERN 2: EVENT-DRIVEN ALERT INTERCEPT LOGIC
// ==============================================================================
let lastBreachTimestamp = 0;
function triggerHazardBreach(incident) {
  const now = Date.now();
  if (now - lastBreachTimestamp < 3500) return; // Prevent flooding
  lastBreachTimestamp = now;

  const eventRecord = {
    id: `EVT-${Math.floor(Math.random() * 90000 + 10000)}`,
    time: new Date().toISOString().substring(11, 19),
    ...incident
  };

  appState.incidents.unshift(eventRecord);
  if (appState.incidents.length > 50) appState.incidents.pop();

  document.getElementById('sidebar-incident-count').textContent = appState.incidents.length;
  renderRailFeed();
  renderIncidentsTable();

  // 1. Show Universal Top Alert Intercept Banner (Appears across ALL views)
  const interceptBanner = document.getElementById('universal-alert-intercept');
  const interceptText = document.getElementById('intercept-text');
  interceptText.textContent = `${incident.severity}: ${incident.message}`;
  interceptBanner.style.display = 'flex';

  // 2. Secondary Toast
  const toast = document.getElementById('mono-toast');
  document.getElementById('toast-title').textContent = `${eventRecord.severity}: ${eventRecord.type}`;
  document.getElementById('toast-desc').textContent = eventRecord.message;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.display = 'none'; }, 4500);

  playAlertTone(eventRecord.severity === 'CRITICAL');
}

/**
 * Deep-link Intercept Action:
 * Minimises time-to-response. Instantly bypasses menus and brings the operator
 * directly into the live node view, focusing the offending camera.
 */
function interceptAndFocusLiveView() {
  // 1. Force navigation to Live Feeds
  navigateToPage('page-live');

  // 2. Hide intercept banner after deep-linking
  document.getElementById('universal-alert-intercept').style.display = 'none';

  // 3. Highlight camera viewport with an emergency focus outline
  const wrapper = document.getElementById('video-canvas-wrapper');
  wrapper.classList.add('focused-intrusion');
  setTimeout(() => {
    wrapper.classList.remove('focused-intrusion');
  }, 3500);

  // 4. Scroll viewport into focus
  wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function navigateToPage(targetPageId) {
  // Update sidebar active buttons
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-nav-target') === targetPageId;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget);
  });

  // Switch visible panels
  document.querySelectorAll('.main-page-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === targetPageId);
  });

  // Update top breadcrumb title
  const titleElem = document.getElementById('view-current-title');
  if (titleElem && VIEW_TITLES[targetPageId]) {
    titleElem.textContent = VIEW_TITLES[targetPageId];
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderRailFeed() {
  const railContainer = document.getElementById('rail-incident-feed');
  const empty = document.getElementById('rail-empty');

  if (appState.incidents.length === 0) {
    empty.style.display = 'flex';
    railContainer.innerHTML = '';
    railContainer.appendChild(empty);
    return;
  }

  empty.style.display = 'none';
  const recent = appState.incidents.slice(0, 6);
  railContainer.innerHTML = recent.map(inc => `
    <div class="rail-event-item" onclick="interceptAndFocusLiveView()">
      <div class="event-meta-line">
        <span class="event-badge">${inc.type}</span>
        <span>${inc.time}</span>
      </div>
      <div class="event-text">${inc.message}</div>
    </div>
  `).join('');
}

function renderIncidentsTable() {
  const tbody = document.getElementById('incidents-table-body');
  const filter = appState.activeFilter;
  const query = appState.searchQuery.toLowerCase();

  const filtered = appState.incidents.filter(inc => {
    if (filter === 'CRITICAL' && inc.severity !== 'CRITICAL') return false;
    if (filter === 'PPE' && !inc.type.includes('PPE')) return false;

    if (query) {
      const match = inc.workerId.toLowerCase().includes(query) ||
                    inc.type.toLowerCase().includes(query) ||
                    inc.zone.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty-row">No matching incident logs found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inc => `
    <tr>
      <td><b>${inc.id}</b></td>
      <td>${inc.time}</td>
      <td>${inc.workerId}</td>
      <td><span class="mono-tag-pill">${inc.type}</span></td>
      <td style="font-weight: 700;">${inc.severity}</td>
      <td>${inc.zone}</td>
      <td><span class="mono-tag-pill">${inc.action}</span></td>
    </tr>
  `).join('');
}

// Setup Event Listeners
function setupEventListeners() {
  // 1. Persistent Sidebar Collapse Toggle
  const sidebar = document.getElementById('app-sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  btnToggleSidebar.addEventListener('click', () => {
    appState.sidebarCollapsed = !appState.sidebarCollapsed;
    sidebar.classList.toggle('sidebar-collapsed', appState.sidebarCollapsed);
  });

  // 2. Navigation items
  document.querySelectorAll('[data-nav-target]').forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-nav-target');
      navigateToPage(targetId);
    });
  });

  // 3. Universal Top Alert Intercept Actions
  document.getElementById('btn-intercept-deeplink').addEventListener('click', interceptAndFocusLiveView);
  document.getElementById('btn-toast-intercept').addEventListener('click', interceptAndFocusLiveView);

  document.getElementById('btn-intercept-mute').addEventListener('click', () => {
    document.getElementById('universal-alert-intercept').style.display = 'none';
  });

  document.getElementById('btn-dismiss-toast').addEventListener('click', () => {
    document.getElementById('mono-toast').style.display = 'none';
  });

  // 4. Manual Breach Simulation
  document.getElementById('btn-demo-breach').addEventListener('click', () => {
    appState.workers[1].x = 680;
    appState.workers[1].y = 420;
  });

  // 5. Sound Mute Toggle
  const btnSound = document.getElementById('btn-sound-toggle');
  btnSound.addEventListener('click', () => {
    appState.soundEnabled = !appState.soundEnabled;
    btnSound.classList.toggle('muted', !appState.soundEnabled);
  });

  // 6. Camera Source Toggles
  const btnSim = document.getElementById('switch-source-sim');
  const btnCam = document.getElementById('switch-source-cam');

  btnSim.addEventListener('click', () => {
    btnSim.classList.add('active');
    btnCam.classList.remove('active');
    if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    appState.webcamActive = false;
  });

  btnCam.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      video.srcObject = stream;
      video.play();
      appState.webcamActive = true;
      btnCam.classList.add('active');
      btnSim.classList.remove('active');
    } catch (e) {
      alert("Webcam permission denied or unavailable. Retaining simulated surveillance.");
      btnSim.classList.add('active');
      btnCam.classList.remove('active');
    }
  });

  // 7. Zones & Bounding Box Toggles
  const btnZones = document.getElementById('btn-toggle-zones');
  btnZones.addEventListener('click', () => {
    appState.showZones = !appState.showZones;
    btnZones.classList.toggle('active', appState.showZones);
    btnZones.textContent = `Zones: ${appState.showZones ? 'ON' : 'OFF'}`;
  });

  const btnBoxes = document.getElementById('btn-toggle-bboxes');
  btnBoxes.addEventListener('click', () => {
    appState.showBBoxes = !appState.showBBoxes;
    btnBoxes.classList.toggle('active', appState.showBBoxes);
    btnBoxes.textContent = `Boxes: ${appState.showBBoxes ? 'ON' : 'OFF'}`;
  });

  // 8. Filter Chips in Incident Logs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      appState.activeFilter = tab.getAttribute('data-filter');
      renderIncidentsTable();
    });
  });

  document.getElementById('incident-search-input').addEventListener('input', e => {
    appState.searchQuery = e.target.value;
    renderIncidentsTable();
  });

  document.getElementById('btn-clear-incidents').addEventListener('click', () => {
    appState.incidents = [];
    document.getElementById('sidebar-incident-count').textContent = '0';
    renderRailFeed();
    renderIncidentsTable();
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const jsonl = appState.incidents.map(i => JSON.stringify(i)).join('\n');
    const blob = new Blob([jsonl], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incidents.jsonl';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 9. Benchmark Copy
  document.getElementById('btn-copy-bench-json').addEventListener('click', function() {
    const data = {
      project: "SafetySentinel AI",
      model: "YOLOv8s-PPE",
      acceleration: "NVIDIA TensorRT Engine (FP16 & INT8)",
      benchmarks: {
        fp32_baseline: { latency_ms: 26.8, fps: 37.3, vram_mb: 1840 },
        tensorrt_fp16: { latency_ms: 11.4, fps: 87.7, vram_mb: 920, speedup: "2.35x" },
        tensorrt_int8: { latency_ms: 7.8, fps: 128.2, vram_mb: 540, speedup: "3.44x" }
      }
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      this.textContent = "COPIED TO CLIPBOARD";
      setTimeout(() => { this.textContent = "Copy Evidence JSON for Google Form"; }, 2000);
    });
  });

  // 10. Hardware Buttons
  document.getElementById('btn-hw-safe').addEventListener('click', () => {
    playAlertTone(false);
  });
  document.getElementById('btn-hw-warn').addEventListener('click', () => {
    triggerHazardBreach({
      workerId: 'WORKER-104',
      type: 'MISSING_PPE_HARDHAT',
      severity: 'HIGH',
      zone: 'Transit Corridor',
      action: 'WARNING_PULSE_CHIRP',
      message: 'Worker missing safety helmet warning triggered on ESP32'
    });
  });
  document.getElementById('btn-hw-danger').addEventListener('click', () => {
    triggerHazardBreach({
      workerId: 'WORKER-101',
      type: 'ZONE_INTRUSION',
      severity: 'CRITICAL',
      zone: 'Robotic Cell',
      action: 'EMERGENCY_SIREN_CUTOFF',
      message: 'Emergency siren and motor cutoff triggered on ESP32'
    });
  });
}

// Start
setupEventListeners();
renderCanvas();
