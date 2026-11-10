/**
 * ============================================================
 * BATALLA NAVAL - FLEET COMMAND
 * 100% JavaScript Vanilla Puro (JS), HTML5 y CSS
 * Arquitectura modular por pantallas:
 * 1. Pantalla de Inicio (Título, Iniciar, Salir)
 * 2. Selección de Modo (IA con dificultad vs Multijugador)
 * 2B. Salas Multijugador (Crear sala, Código, Lista de espera)
 * 3. Despliegue de Flota (5 navíos, 17 casillas)
 * 4. Combate Naval 100vh Lado a Lado (Cero scrolling)
 * ============================================================
 */

const SHIPS_CONFIG = [
  { type: 'carrier', name: 'Portaaviones', size: 5, icon: '🚢' },
  { type: 'battleship', name: 'Acorazado', size: 4, icon: '⚔️' },
  { type: 'cruiser', name: 'Crucero', size: 3, icon: '⚓' },
  { type: 'submarine', name: 'Submarino', size: 3, icon: '🌊' },
  { type: 'destroyer', name: 'Destructor', size: 2, icon: '🚤' },
];

const GRID_SIZE = 10;
const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const TOTAL_FLEET_HITS = SHIPS_CONFIG.reduce((acc, s) => acc + s.size, 0); // 17

// Resolución de diseño del escenario; se escala para encajar centrado en la pantalla
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

function fitGameStage() {
  const stage = document.getElementById('game-stage');
  if (!stage) return;
  const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// ============================================================
// MOTOR DE AUDIO PROCEDURAL (WEB AUDIO API)
// ============================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('battleship_muted') === 'true';
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Audio fallback
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('battleship_muted', String(this.isMuted));
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.05);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  playSonar() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1240, t);
      osc.frequency.exponentialRampToValueAtTime(1020, t + 0.35);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.85);
    } catch {}
  }

  playLaunch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    } catch {}
  }

  playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(150, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      subGain.gain.setValueAtTime(0.6, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(t);
      sub.stop(t + 0.45);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + 0.5);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.5);
    } catch {}
  }

  playSplash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.35);
      filter.Q.value = 3;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.35);
    } catch {}
  }

  playSunk() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 640 : 440, t + offset);
        gain.gain.setValueAtTime(0.22, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.19);
      });
      setTimeout(() => this.playExplosion(), 300);
    } catch {}
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.14);
        gain.gain.setValueAtTime(0.001, t + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.22, t + idx * 0.14 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 1.0);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.14);
        osc.stop(t + idx * 0.14 + 1.05);
      });
    } catch {}
  }

  playDefeat() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [311.13, 293.66, 261.63, 207.65];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.18);
        gain.gain.setValueAtTime(0.18, t + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.18 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.18);
        osc.stop(t + idx * 0.18 + 0.65);
      });
    } catch {}
  }
}

// ============================================================
// MOTOR DE PARTÍCULAS Y MISILES EN CANVAS
// ============================================================
class CanvasEffects {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.missiles = [];
    this.particles = [];
    this.lastTime = performance.now();
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }
  }

  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  launchMissile(startX, startY, targetX, targetY, isHit, onImpact) {
    this.missiles.push({
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      isHit,
      onImpact,
    });
  }

  triggerExplosion(x, y) {
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: i % 3 === 0 ? '#ef4444' : i % 2 === 0 ? '#f97316' : '#fde047',
        alpha: 1,
        life: 1,
        decay: 1.9,
      });
    }
  }

  triggerSplash(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 1.3;
      const speed = Math.random() * 100 + 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: '#38bdf8',
        alpha: 0.9,
        life: 1,
        decay: 1.7,
      });
    }
  }

  animate(currentTime) {
    if (!this.ctx || !this.canvas) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.progress += dt * 3.4;

      if (m.progress < 1) {
        const t = m.progress;
        const midX = (m.startX + m.targetX) / 2;
        const midY = Math.min(m.startY, m.targetY) - 70;

        const curX = (1 - t) * (1 - t) * m.startX + 2 * (1 - t) * t * midX + t * t * m.targetX;
        const curY = (1 - t) * (1 - t) * m.startY + 2 * (1 - t) * t * midY + t * t * m.targetY;

        this.ctx.beginPath();
        this.ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fef08a';
        this.ctx.shadowColor = '#f97316';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (Math.random() < 0.6) {
          this.particles.push({
            x: curX,
            y: curY,
            vx: (Math.random() - 0.5) * 12,
            vy: Math.random() * 12 + 4,
            size: Math.random() * 2.5 + 1.5,
            color: Math.random() < 0.5 ? '#94a3b8' : '#fb923c',
            alpha: 0.7,
            life: 1,
            decay: 1.6,
          });
        }
      } else {
        m.onImpact();
        if (m.isHit) this.triggerExplosion(m.targetX, m.targetY);
        else this.triggerSplash(m.targetX, m.targetY);
        this.missiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha * p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(this.animate);
  }
}

// ============================================================
// LÓGICA DE TABLERO Y MATRICES
// ============================================================
function createEmptyBoard() {
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ x, y, state: 'empty' });
    }
    grid.push(row);
  }
  return grid;
}

function getShipCells(ship) {
  const cells = [];
  for (let i = 0; i < ship.size; i++) {
    if (ship.orientation === 'horizontal') {
      cells.push({ x: ship.x + i, y: ship.y });
    } else {
      cells.push({ x: ship.x, y: ship.y + i });
    }
  }
  return cells;
}

function canPlace(size, x, y, orientation, ships, ignoreId) {
  if (x < 0 || y < 0) return false;
  if (orientation === 'horizontal' && x + size > GRID_SIZE) return false;
  if (orientation === 'vertical' && y + size > GRID_SIZE) return false;

  const targetCoords = [];
  for (let i = 0; i < size; i++) {
    targetCoords.push(orientation === 'horizontal' ? { x: x + i, y } : { x, y: y + i });
  }

  for (const s of ships) {
    if (ignoreId && s.id === ignoreId) continue;
    const existing = getShipCells(s);
    for (const tc of targetCoords) {
      if (existing.some((ec) => ec.x === tc.x && ec.y === tc.y)) return false;
    }
  }
  return true;
}

function generateRandomFleet() {
  const ships = [];
  for (const def of SHIPS_CONFIG) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 900) {
      attempts++;
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxX = orientation === 'horizontal' ? GRID_SIZE - def.size : GRID_SIZE - 1;
      const maxY = orientation === 'vertical' ? GRID_SIZE - def.size : GRID_SIZE - 1;
      const x = Math.floor(Math.random() * (maxX + 1));
      const y = Math.floor(Math.random() * (maxY + 1));

      if (canPlace(def.size, x, y, orientation, ships)) {
        ships.push({
          id: `${def.type}_${Date.now()}_${Math.random()}`,
          type: def.type,
          name: def.name,
          size: def.size,
          icon: def.icon,
          x,
          y,
          orientation,
          hits: 0,
          sunk: false,
        });
        placed = true;
      }
    }
  }
  return ships;
}

function calculateEnemyMove(playerGrid, playerShips, difficulty) {
  const unattacked = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (playerGrid[y][x].state !== 'hit' && playerGrid[y][x].state !== 'miss') {
        unattacked.push({ x, y });
      }
    }
  }

  if (unattacked.length === 0) return { x: 0, y: 0 };

  if (difficulty === 'novice') {
    return unattacked[Math.floor(Math.random() * unattacked.length)];
  }

  const unsunkHits = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (playerGrid[y][x].state === 'hit') {
        const s = playerShips.find((ship) => ship.id === playerGrid[y][x].shipId);
        if (s && !s.sunk) {
          unsunkHits.push({ x, y, shipId: s.id });
        }
      }
    }
  }

  if (unsunkHits.length >= 2) {
    const isH = unsunkHits.every((h) => h.y === unsunkHits[0].y);
    const isV = unsunkHits.every((h) => h.x === unsunkHits[0].x);
    const lineCandidates = [];

    if (isH) {
      const y = unsunkHits[0].y;
      const xs = unsunkHits.map((h) => h.x).sort((a, b) => a - b);
      const minX = xs[0];
      const maxX = xs[xs.length - 1];
      if (minX > 0 && playerGrid[y][minX - 1].state !== 'hit' && playerGrid[y][minX - 1].state !== 'miss') {
        lineCandidates.push({ x: minX - 1, y });
      }
      if (maxX < GRID_SIZE - 1 && playerGrid[y][maxX + 1].state !== 'hit' && playerGrid[y][maxX + 1].state !== 'miss') {
        lineCandidates.push({ x: maxX + 1, y });
      }
    } else if (isV) {
      const x = unsunkHits[0].x;
      const ys = unsunkHits.map((h) => h.y).sort((a, b) => a - b);
      const minY = ys[0];
      const maxY = ys[ys.length - 1];
      if (minY > 0 && playerGrid[minY - 1][x].state !== 'hit' && playerGrid[minY - 1][x].state !== 'miss') {
        lineCandidates.push({ x, y: minY - 1 });
      }
      if (maxY < GRID_SIZE - 1 && playerGrid[maxY + 1][x].state !== 'hit' && playerGrid[maxY + 1][x].state !== 'miss') {
        lineCandidates.push({ x, y: maxY + 1 });
      }
    }

    if (lineCandidates.length > 0) {
      return lineCandidates[Math.floor(Math.random() * lineCandidates.length)];
    }
  }

  if (unsunkHits.length > 0) {
    const adjacents = [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const h of unsunkHits) {
      for (const d of dirs) {
        const nx = h.x + d.dx;
        const ny = h.y + d.dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (playerGrid[ny][nx].state !== 'hit' && playerGrid[ny][nx].state !== 'miss') {
            if (!adjacents.some((a) => a.x === nx && a.y === ny)) {
              adjacents.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    if (adjacents.length > 0) {
      return adjacents[Math.floor(Math.random() * adjacents.length)];
    }
  }

  if (difficulty === 'admiral') {
    const parity = unattacked.filter((c) => (c.x + c.y) % 2 === 0);
    if (parity.length > 0) {
      return parity[Math.floor(Math.random() * parity.length)];
    }
  }

  return unattacked[Math.floor(Math.random() * unattacked.length)];
}

// ============================================================
// CLASE PRINCIPAL DEL JUEGO
// ============================================================
class BattleshipGame {
  constructor() {
    this.sound = new SoundFX();
    const canvas = document.getElementById('combat-canvas');
    this.effects = new CanvasEffects(canvas);

    this.currentScreenId = 'screen-title';
    this.gameMode = 'AI';
    this.aiDifficulty = 'veteran';
    this.currentRoomCode = '';
    this.opponentName = 'IA Táctica';

    this.setupShips = [];
    this.selectedShipDef = SHIPS_CONFIG[0];
    this.setupOrientation = 'horizontal';

    this.playerShips = [];
    this.playerGrid = createEmptyBoard();
    this.enemyShips = [];
    this.enemyGrid = createEmptyBoard();

    this.currentTurn = 1;
    this.isPlayerTurn = true;
    this.isProcessingShot = false;
    this.stats = { shots: 0, hits: 0, misses: 0 };

    this.sampleLobbies = [
      { id: '1', commander: 'Capitán Miller', roomCode: '#NAVAL-4821', rank: 'Veterano', ping: '24ms' },
      { id: '2', commander: 'Almirante Vance', roomCode: '#NAVAL-9104', rank: 'Almirante', ping: '31ms' },
      { id: '3', commander: 'Comandante Torres', roomCode: '#NAVAL-3392', rank: 'Oficial', ping: '18ms' },
      { id: '4', commander: 'Capitana Hayes', roomCode: '#NAVAL-6710', rank: 'Veterana', ping: '42ms' },
    ];

    this.initDOM();
  }

  initDOM() {
    this.bindEvents();
    this.updateSoundButtons();
    this.renderActiveCommandersList();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (this.currentScreenId === 'setup-screen') {
          this.setupOrientation = this.setupOrientation === 'horizontal' ? 'vertical' : 'horizontal';
          this.sound.playClick();
          this.updateSetupOrientationUI();
          this.clearPlacementPreview();
        }
      }
      if (e.code === 'Enter') {
        if (this.currentScreenId === 'screen-title') {
          e.preventDefault();
          this.showScreen('screen-mode-select');
        }
      }
    });

    // Sonido
    document.getElementById('btn-toggle-sound-title')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-toggle-sound-battle')?.addEventListener('click', () => this.toggleSound());

    // 1. Pantalla Inicio
    document.getElementById('btn-main-start')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-mode-select');
    });

    document.getElementById('btn-main-exit')?.addEventListener('click', () => {
      this.sound.playClick();
      document.getElementById('exit-confirm-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-exit')?.addEventListener('click', () => {
      this.sound.playClick();
      document.getElementById('exit-confirm-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-confirm-exit')?.addEventListener('click', () => {
      this.sound.playClick();
      document.getElementById('exit-confirm-modal')?.classList.add('hidden');
      try {
        window.close();
      } catch {}
      this.showScreen('screen-decommissioned');
    });

    document.getElementById('btn-reconnect')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-title');
    });

    // 2. Selección de Modo
    document.getElementById('btn-mode-back')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-title');
    });

    document.getElementById('btn-choose-ai-mode')?.addEventListener('click', () => {
      this.sound.playClick();
      this.gameMode = 'AI';
      this.showScreen('screen-difficulty-select');
    });

    document.getElementById('btn-choose-multiplayer-mode')?.addEventListener('click', () => {
      this.sound.playClick();
      this.gameMode = 'MULTIPLAYER';
      this.renderActiveCommandersList();
      this.showScreen('screen-multiplayer-search');
    });

    // 3A. Dificultad de la IA
    document.getElementById('btn-diff-back')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-mode-select');
    });

    const diffCards = document.querySelectorAll('.btn-diff-card');
    diffCards.forEach((card) => {
      card.addEventListener('click', () => {
        this.sound.playClick();
        diffCards.forEach((c) => {
          c.className = 'btn-diff-card p-4 rounded-xl border text-center transition-all bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer';
        });
        card.className = 'btn-diff-card p-4 rounded-xl border text-center transition-all bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400 cursor-pointer shadow-lg shadow-cyan-950/40';
        this.aiDifficulty = card.getAttribute('data-diff') || 'veteran';
      });
    });

    document.getElementById('btn-proceed-to-setup')?.addEventListener('click', () => {
      this.sound.playSonar();
      const diffLabel = this.aiDifficulty === 'novice' ? 'Novato' : this.aiDifficulty === 'veteran' ? 'Veterano' : 'Almirante';
      this.opponentName = `IA (${diffLabel})`;
      this.goToSetup();
    });

    // 3B. Búsqueda Multijugador
    document.getElementById('btn-multiplayer-back')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-mode-select');
    });

    document.getElementById('btn-auto-match')?.addEventListener('click', () => {
      this.sound.playSonar();
      const radarStatus = document.getElementById('radar-search-status');
      if (radarStatus) {
        radarStatus.textContent = '🎯 ¡Contrincante localizado! Estableciendo enlace...';
        radarStatus.className = 'text-xs font-mono-combat text-emerald-400 font-bold mb-1 animate-pulse';
      }

      setTimeout(() => {
        if (this.currentScreenId === 'screen-multiplayer-search') {
          this.sound.playVictory();
          this.opponentName = 'Comandante Petrov (En Línea)';
          this.goToSetup();
        }
      }, 1600);
    });

    document.getElementById('btn-join-search-code')?.addEventListener('click', () => {
      const input = document.getElementById('input-search-room-code');
      const code = input?.value.trim().toUpperCase() || '';
      if (!code) return;
      this.sound.playSonar();
      this.opponentName = `Rival (${code})`;
      this.goToSetup();
    });

    // 4. Despliegue
    document.getElementById('btn-setup-back')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen(this.gameMode === 'AI' ? 'screen-difficulty-select' : 'screen-multiplayer-search');
    });

    document.getElementById('btn-orient-horizontal')?.addEventListener('click', () => {
      this.setupOrientation = 'horizontal';
      this.sound.playClick();
      this.updateSetupOrientationUI();
      this.clearPlacementPreview();
    });

    document.getElementById('btn-orient-vertical')?.addEventListener('click', () => {
      this.setupOrientation = 'vertical';
      this.sound.playClick();
      this.updateSetupOrientationUI();
      this.clearPlacementPreview();
    });

    document.getElementById('btn-randomize-fleet')?.addEventListener('click', () => {
      this.setupShips = generateRandomFleet();
      this.selectedShipDef = null;
      this.sound.playSonar();
      this.renderSetupGrid();
      this.renderShipInventory();
      this.checkSetupReady();
    });

    document.getElementById('btn-clear-fleet')?.addEventListener('click', () => {
      this.setupShips = [];
      this.selectedShipDef = SHIPS_CONFIG[0];
      this.sound.playClick();
      this.renderSetupGrid();
      this.renderShipInventory();
      this.checkSetupReady();
    });

    document.getElementById('btn-launch-battle')?.addEventListener('click', () => {
      if (this.setupShips.length !== SHIPS_CONFIG.length) return;
      this.sound.playLaunch();
      this.startCombatPhase();
    });

    // 5. Combate
    document.getElementById('btn-surrender')?.addEventListener('click', () => {
      this.sound.playClick();
      this.showScreen('screen-title');
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      document.getElementById('game-over-modal')?.classList.add('hidden');
      this.goToSetup();
    });

    document.getElementById('btn-return-menu')?.addEventListener('click', () => {
      document.getElementById('game-over-modal')?.classList.add('hidden');
      this.showScreen('screen-title');
    });
  }

  toggleSound() {
    const isMuted = this.sound.toggleMute();
    this.updateSoundButtons();
    if (!isMuted) this.sound.playClick();
  }

  updateSoundButtons() {
    const muted = this.sound.getMuted();
    const icon1 = document.getElementById('title-sound-icon');
    const text1 = document.getElementById('title-sound-text');
    const icon2 = document.getElementById('battle-sound-icon');

    if (icon1) icon1.textContent = muted ? '🔇' : '🔊';
    if (text1) text1.textContent = muted ? 'SONIDO: OFF' : 'SONIDO: ON';
    if (icon2) icon2.textContent = muted ? '🔇' : '🔊';
  }

  showScreen(screenId) {
    this.currentScreenId = screenId;
    const allScreens = [
      'screen-title',
      'screen-mode-select',
      'screen-difficulty-select',
      'screen-multiplayer-search',
      'setup-screen',
      'battle-screen',
      'screen-decommissioned',
    ];

    allScreens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
          el.classList.remove('screen-active');
          void el.offsetWidth;
          el.classList.add('screen-active');
        } else {
          el.classList.add('hidden');
          el.classList.remove('screen-active');
        }
      }
    });
  }

  renderActiveCommandersList() {
    const cont = document.getElementById('multiplayer-active-list');
    if (!cont) return;
    cont.innerHTML = '';

    const commanders = [
      { id: '1', name: 'Capitán Miller', roomCode: '#NAVAL-4821', rank: 'Veterano', ping: '24ms' },
      { id: '2', name: 'Almirante Vance', roomCode: '#NAVAL-9104', rank: 'Almirante', ping: '31ms' },
      { id: '3', name: 'Comandante Torres', roomCode: '#NAVAL-3392', rank: 'Oficial', ping: '18ms' },
    ];

    commanders.forEach((cmd) => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-combat hover:border-cyan-500/50 transition-colors';
      item.innerHTML = `
        <div>
          <div class="flex items-center gap-1.5 font-bold text-slate-100">
            <span>⚓</span>
            <span>${cmd.name}</span>
            <span class="text-[10px] text-cyan-400 font-normal">(${cmd.rank})</span>
          </div>
          <div class="text-[10px] text-slate-500">
            SALA: <span class="text-slate-400 font-semibold">${cmd.roomCode}</span> · PING: ${cmd.ping}
          </div>
        </div>
        <button type="button" class="btn-challenge-cmd py-1 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow-sm">
          Desafiar
        </button>
      `;

      item.querySelector('.btn-challenge-cmd')?.addEventListener('click', () => {
        this.sound.playSonar();
        this.opponentName = `${cmd.name} (${cmd.roomCode})`;
        this.goToSetup();
      });

      cont.appendChild(item);
    });
  }

  goToSetup() {
    this.setupShips = [];
    this.selectedShipDef = SHIPS_CONFIG[0];
    this.setupOrientation = 'horizontal';

    this.playerShips = [];
    this.playerGrid = createEmptyBoard();
    this.enemyShips = [];
    this.enemyGrid = createEmptyBoard();

    this.stats = { shots: 0, hits: 0, misses: 0 };
    this.currentTurn = 1;
    this.isPlayerTurn = true;
    this.isProcessingShot = false;

    const subTitle = document.getElementById('setup-sub-title');
    if (subTitle) {
      subTitle.textContent = this.gameMode === 'MULTIPLAYER'
        ? `PARTIDA EN LÍNEA VS ${this.opponentName.toUpperCase()}`
        : `COMBATE VS ${this.opponentName.toUpperCase()}`;
    }

    this.updateSetupOrientationUI();
    this.renderSetupGrid();
    this.renderShipInventory();
    this.checkSetupReady();
    this.showScreen('setup-screen');
  }

  updateSetupOrientationUI() {
    const hBtn = document.getElementById('btn-orient-horizontal');
    const vBtn = document.getElementById('btn-orient-vertical');
    if (this.setupOrientation === 'horizontal') {
      hBtn?.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200', 'ring-1', 'ring-cyan-400');
      hBtn?.classList.remove('bg-slate-950', 'border-slate-800', 'text-slate-400');
      vBtn?.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200', 'ring-1', 'ring-cyan-400');
      vBtn?.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-400');
    } else {
      vBtn?.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200', 'ring-1', 'ring-cyan-400');
      vBtn?.classList.remove('bg-slate-950', 'border-slate-800', 'text-slate-400');
      hBtn?.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-200', 'ring-1', 'ring-cyan-400');
      hBtn?.classList.add('bg-slate-950', 'border-slate-800', 'text-slate-400');
    }
  }

  renderSetupGrid() {
    const gridEl = document.getElementById('setup-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'grid-10x10-row mb-[2.5px] text-center font-mono-combat text-[11px] text-slate-400';
    headerRow.innerHTML = '<div class="flex items-center justify-center font-semibold text-slate-500">#</div>' +
      COL_NUMBERS.map((c) => `<div class="flex items-center justify-center font-semibold">${c}</div>`).join('');
    gridEl.appendChild(headerRow);

    const occupiedMap = new Map();
    for (const s of this.setupShips) {
      getShipCells(s).forEach((c, index) => {
        occupiedMap.set(`${c.x},${c.y}`, { ship: s, isBow: index === 0, isStern: index === s.size - 1 });
      });
    }

    ROW_LETTERS.forEach((rowLetter, y) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'grid-10x10-row';

      const label = document.createElement('div');
      label.className = 'flex items-center justify-center font-mono-combat text-[11px] font-semibold text-slate-400';
      label.textContent = rowLetter;
      rowEl.appendChild(label);

      for (let x = 0; x < GRID_SIZE; x++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-x', String(x));
        btn.setAttribute('data-y', String(y));
        btn.className = 'setup-cell naval-cell-base hover:border-cyan-400 cursor-pointer';

        const occ = occupiedMap.get(`${x},${y}`);
        if (occ) {
          btn.classList.add('cell-ship');
          btn.innerHTML = `<span class="text-[10px] font-bold text-cyan-200">${occ.isBow ? '▲' : occ.isStern ? '■' : '●'}</span>`;
        }

        btn.addEventListener('mouseenter', () => {
          const coordInd = document.getElementById('setup-coord-indicator');
          if (coordInd) coordInd.textContent = `SECTOR [${rowLetter}-${x + 1}]`;
          this.previewPlacement(x, y);
        });

        btn.addEventListener('mouseleave', () => {
          this.clearPlacementPreview();
        });

        btn.addEventListener('click', () => {
          this.handleSetupCellClick(x, y);
        });

        rowEl.appendChild(btn);
      }

      gridEl.appendChild(rowEl);
    });
  }

  clearPlacementPreview() {
    const cells = document.querySelectorAll('.setup-cell');
    cells.forEach((c) => {
      c.classList.remove('cell-preview-valid', 'cell-preview-invalid');
    });
  }

  previewPlacement(x, y) {
    this.clearPlacementPreview();
    if (!this.selectedShipDef) return;

    const size = this.selectedShipDef.size;
    const isValid = canPlace(size, x, y, this.setupOrientation, this.setupShips);

    for (let i = 0; i < size; i++) {
      const tx = this.setupOrientation === 'horizontal' ? x + i : x;
      const ty = this.setupOrientation === 'vertical' ? y + i : y;
      if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
        const cell = document.querySelector(`.setup-cell[data-x="${tx}"][data-y="${ty}"]`);
        if (cell) {
          if (isValid) {
            cell.classList.add('cell-preview-valid');
          } else {
            cell.classList.add('cell-preview-invalid');
          }
        }
      }
    }
  }

  handleSetupCellClick(x, y) {
    const existing = this.setupShips.find((s) => getShipCells(s).some((c) => c.x === x && c.y === y));
    if (existing) {
      this.setupShips = this.setupShips.filter((s) => s.id !== existing.id);
      const def = SHIPS_CONFIG.find((d) => d.type === existing.type);
      if (def) this.selectedShipDef = def;
      this.sound.playClick();
      this.renderSetupGrid();
      this.renderShipInventory();
      this.checkSetupReady();
      return;
    }

    if (!this.selectedShipDef) return;

    if (canPlace(this.selectedShipDef.size, x, y, this.setupOrientation, this.setupShips)) {
      this.setupShips.push({
        id: `${this.selectedShipDef.type}_${Date.now()}`,
        type: this.selectedShipDef.type,
        name: this.selectedShipDef.name,
        size: this.selectedShipDef.size,
        icon: this.selectedShipDef.icon,
        x,
        y,
        orientation: this.setupOrientation,
        hits: 0,
        sunk: false,
      });

      this.sound.playClick();
      const nextUnplaced = SHIPS_CONFIG.find((d) => !this.setupShips.some((s) => s.type === d.type));
      this.selectedShipDef = nextUnplaced || null;

      this.renderSetupGrid();
      this.renderShipInventory();
      this.checkSetupReady();
    } else {
      this.sound.playSplash();
    }
  }

  renderShipInventory() {
    const cont = document.getElementById('ship-inventory');
    if (!cont) return;
    cont.innerHTML = '';

    SHIPS_CONFIG.forEach((def) => {
      const isPlaced = this.setupShips.some((s) => s.type === def.type);
      const isSelected = this.selectedShipDef?.type === def.type;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
        isSelected
          ? 'bg-cyan-500/25 border-cyan-400 text-white ring-1 ring-cyan-400 shadow-sm shadow-cyan-500/30'
          : isPlaced
          ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-cyan-500/60'
      }`;

      btn.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-xs">${def.icon}</span>
          <div>
            <div class="text-[11px] font-bold text-slate-100">${def.name} (${def.size} casillas)</div>
            <div class="text-[10px] font-mono-combat ${isPlaced ? 'text-emerald-400 font-semibold' : isSelected ? 'text-cyan-300 font-bold' : 'text-slate-400'}">
              ${isPlaced ? '✓ Colocado (clic para mover)' : isSelected ? '👉 SELECCIONADO' : 'Clic para seleccionar'}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          ${Array.from({ length: def.size })
            .map(() => `<div class="w-3 h-3 rounded-[2px] ${isPlaced ? 'bg-emerald-500 border border-emerald-400' : isSelected ? 'bg-cyan-400 border border-white' : 'bg-slate-700 border border-slate-600'}"></div>`)
            .join('')}
        </div>
      `;

      btn.addEventListener('click', () => {
        if (isPlaced) {
          this.setupShips = this.setupShips.filter((s) => s.type !== def.type);
          this.selectedShipDef = def;
        } else {
          this.selectedShipDef = def;
        }
        this.sound.playClick();
        this.renderSetupGrid();
        this.renderShipInventory();
        this.checkSetupReady();
      });

      cont.appendChild(btn);
    });

    const countEl = document.getElementById('setup-ships-count');
    if (countEl) {
      countEl.textContent = `${this.setupShips.length}/5 NAVÍOS`;
      countEl.className = this.setupShips.length === 5 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold';
    }
  }

  checkSetupReady() {
    const launchBtn = document.getElementById('btn-launch-battle');
    if (!launchBtn) return;
    const isComplete = this.setupShips.length === SHIPS_CONFIG.length;
    launchBtn.disabled = !isComplete;
    if (isComplete) {
      launchBtn.className = 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-black text-xs tracking-wider uppercase transition-all duration-200 shadow-lg bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/30 cursor-pointer active:scale-95 animate-pulse';
      launchBtn.innerHTML = '<span>🚀 ¡ZAFARRANCHO DE COMBATE! (INICIAR BATALLA) →</span>';
    } else {
      launchBtn.className = 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-bold text-xs tracking-wider uppercase transition-all duration-200 bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50';
      launchBtn.innerHTML = `<span>Coloca los ${5 - this.setupShips.length} navíos restantes para jugar</span>`;
    }
  }

  // ==========================================
  // COMBATE NAVAL LADO A LADO (100VH)
  // ==========================================
  startCombatPhase() {
    this.currentTurn = 1;
    this.isPlayerTurn = true;
    this.isProcessingShot = false;

    this.playerShips = this.setupShips;
    this.playerGrid = createEmptyBoard();
    for (const s of this.playerShips) {
      for (const c of getShipCells(s)) {
        this.playerGrid[c.y][c.x].state = 'ship';
        this.playerGrid[c.y][c.x].shipId = s.id;
      }
    }

    this.enemyShips = generateRandomFleet();
    this.enemyGrid = createEmptyBoard();
    for (const s of this.enemyShips) {
      for (const c of getShipCells(s)) {
        this.enemyGrid[c.y][c.x].state = 'ship';
        this.enemyGrid[c.y][c.x].shipId = s.id;
      }
    }

    const modeInd = document.getElementById('battle-mode-indicator');
    if (modeInd) {
      modeInd.textContent = this.gameMode === 'MULTIPLAYER'
        ? `MULTIJUGADOR VS ${this.opponentName.toUpperCase()}`
        : `COMBATE VS IA (${this.aiDifficulty.toUpperCase()})`;
    }

    const enemyHeader = document.getElementById('enemy-board-header');
    if (enemyHeader) {
      enemyHeader.textContent = `🎯 Radar de Ataque (${this.opponentName})`;
    }

    this.updateLog('Flota en posición de combate. Haz clic en el Radar Enemigo para abrir fuego.');
    this.renderBattleGrids();
    this.updateBattleHUD();
    this.showScreen('battle-screen');
  }

  updateBattleHUD() {
    const turnBanner = document.getElementById('turn-banner');
    const bannerText = document.getElementById('turn-banner-text');
    const pulseDot = document.getElementById('turn-pulse-dot');
    const aiBanner = document.getElementById('ai-status-banner');
    const opponentStatus = document.getElementById('opponent-status-text');

    if (this.isPlayerTurn) {
      if (turnBanner) {
        turnBanner.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-combat border bg-cyan-500/20 border-cyan-400 text-cyan-200';
      }
      if (bannerText) bannerText.textContent = '🎯 TU TURNO DE DISPARAR (CLIC EN EL RADAR)';
      if (pulseDot) pulseDot.className = 'w-2 h-2 rounded-full bg-cyan-400 animate-pulse';
      if (aiBanner) aiBanner.classList.add('hidden');
    } else {
      if (turnBanner) {
        turnBanner.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-combat border bg-rose-500/20 border-rose-400 text-rose-200';
      }
      if (bannerText) bannerText.textContent = `⚔️ TURNO DE: ${this.opponentName.toUpperCase()}`;
      if (pulseDot) pulseDot.className = 'w-2 h-2 rounded-full bg-rose-400 animate-pulse';
      if (aiBanner) aiBanner.classList.remove('hidden');
      if (opponentStatus) {
        opponentStatus.textContent = this.gameMode === 'MULTIPLAYER'
          ? `${this.opponentName} está apuntando a tu cuadrícula...`
          : 'La computadora está calculando vector de tiro balístico...';
      }
    }

    const playerHits = this.playerShips.reduce((acc, s) => acc + s.hits, 0);
    const friendlyHitsEl = document.getElementById('friendly-hits-counter');
    if (friendlyHitsEl) {
      friendlyHitsEl.textContent = `${playerHits}/${TOTAL_FLEET_HITS} DAÑOS`;
      friendlyHitsEl.className = playerHits > 10 ? 'font-mono-combat text-[11px] text-rose-400 font-bold' : 'font-mono-combat text-[11px] text-slate-400';
    }

    const turnCounter = document.getElementById('combat-turn-counter');
    if (turnCounter) turnCounter.textContent = `TURNO ${this.currentTurn}`;

    this.renderFleetStatus('friendly-fleet-status', this.playerShips, false);
    this.renderFleetStatus('enemy-fleet-status', this.enemyShips, true);
  }

  renderBattleGrids() {
    this.renderGrid('friendly-grid', this.playerGrid, this.playerShips, false, false);
    this.renderGrid('enemy-grid', this.enemyGrid, this.enemyShips, true, this.isPlayerTurn && !this.isProcessingShot);
  }

  renderGrid(containerId, grid, ships, isEnemy, isInteractive) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'grid-10x10-row mb-[2.5px] text-center font-mono-combat text-[11px] text-slate-400';
    headerRow.innerHTML = '<div class="flex items-center justify-center font-semibold text-slate-500">#</div>' +
      COL_NUMBERS.map((c) => `<div class="flex items-center justify-center font-semibold">${c}</div>`).join('');
    cont.appendChild(headerRow);

    const shipCellsMap = new Map();
    if (!isEnemy) {
      for (const s of ships) {
        getShipCells(s).forEach((c, idx) => {
          shipCellsMap.set(`${c.x},${c.y}`, { ship: s, isBow: idx === 0 });
        });
      }
    }

    ROW_LETTERS.forEach((rowLetter, y) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'grid-10x10-row';

      const label = document.createElement('div');
      label.className = 'flex items-center justify-center font-mono-combat text-[11px] font-semibold text-slate-400';
      label.textContent = rowLetter;
      rowEl.appendChild(label);

      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y][x];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-x', String(x));
        btn.setAttribute('data-y', String(y));

        const isFired = cell.state === 'hit' || cell.state === 'miss';
        btn.disabled = !isInteractive || isFired;

        let extraClass = '';
        let content = '';

        if (cell.state === 'hit') {
          extraClass = 'cell-hit';
          content = '<span class="text-xs animate-pulse">🔥</span>';
        } else if (cell.state === 'miss') {
          extraClass = 'cell-miss';
          content = '<span class="text-[10px]">💧</span>';
        } else if (!isEnemy && shipCellsMap.has(`${x},${y}`)) {
          const seg = shipCellsMap.get(`${x},${y}`);
          if (seg.ship.sunk) {
            extraClass = 'cell-ship-sunk';
            content = '<span class="text-[10px] text-zinc-400">💀</span>';
          } else {
            extraClass = 'cell-ship';
            content = `<span class="text-[10px] font-bold text-cyan-200">${seg.isBow ? '▲' : '■'}</span>`;
          }
        }

        const interactiveClass = isInteractive && !isFired
          ? 'cursor-crosshair hover:border-rose-400 hover:scale-[1.08] hover:z-10'
          : 'cursor-default';

        btn.className = `naval-cell-base ${extraClass} ${interactiveClass}`;
        btn.innerHTML = content;

        if (isInteractive && !isFired) {
          btn.addEventListener('mouseenter', () => {
            const coordInd = document.getElementById('enemy-grid-coord');
            if (coordInd) coordInd.textContent = `OBJETIVO: [${rowLetter}-${x + 1}]`;
          });

          btn.addEventListener('click', (e) => {
            this.handlePlayerShot(x, y, e.currentTarget);
          });
        }

        rowEl.appendChild(btn);
      }

      cont.appendChild(rowEl);
    });
  }

  handlePlayerShot(x, y, cellBtn) {
    if (this.currentScreenId !== 'battle-screen' || !this.isPlayerTurn || this.isProcessingShot) return;

    if (this.enemyGrid[y][x].state === 'hit' || this.enemyGrid[y][x].state === 'miss') return;

    this.isProcessingShot = true;
    this.renderBattleGrids();

    const rect = cellBtn.getBoundingClientRect();
    const targetScreenX = rect.left + rect.width / 2;
    const targetScreenY = rect.top + rect.height / 2;

    this.sound.playLaunch();
    const startX = targetScreenX + (Math.random() - 0.5) * 40;
    const startY = window.innerHeight - 15;

    let hitShip = null;
    for (const s of this.enemyShips) {
      if (getShipCells(s).some((c) => c.x === x && c.y === y)) {
        hitShip = s;
        break;
      }
    }
    const isHit = !!hitShip;

    this.effects.launchMissile(startX, startY, targetScreenX, targetScreenY, isHit, () => {
      const coordLabel = `${ROW_LETTERS[y]}-${x + 1}`;
      this.stats.shots++;

      if (hitShip) {
        this.enemyGrid[y][x].state = 'hit';
        hitShip.hits++;
        this.stats.hits++;

        if (hitShip.hits >= hitShip.size) {
          hitShip.sunk = true;
          this.sound.playSunk();
          this.updateLog(`¡HUNDIDO! ¡El ${hitShip.name} hostil en [${coordLabel}] ha sido totalmente destruido!`);
        } else {
          this.sound.playExplosion();
          this.updateLog(`¡TOCADO! Impacto directo en buque hostil en [${coordLabel}].`);
        }
      } else {
        this.enemyGrid[y][x].state = 'miss';
        this.stats.misses++;
        this.sound.playSplash();
        this.updateLog(`AGUA en [${coordLabel}]. El proyectil cayó en mar abierto.`);
      }

      const enemySunk = this.enemyShips.every((s) => s.sunk);
      if (enemySunk) {
        this.sound.playVictory();
        this.renderBattleGrids();
        this.updateBattleHUD();
        setTimeout(() => this.showGameOver(true), 800);
        return;
      }

      this.isPlayerTurn = false;
      this.renderBattleGrids();
      this.updateBattleHUD();

      setTimeout(() => {
        this.executeOpponentTurn();
      }, 750);
    });
  }

  executeOpponentTurn() {
    if (this.currentScreenId !== 'battle-screen') return;

    const move = calculateEnemyMove(
      this.playerGrid,
      this.playerShips,
      this.gameMode === 'MULTIPLAYER' ? 'veteran' : this.aiDifficulty
    );
    const coordLabel = `${ROW_LETTERS[move.y]}-${move.x + 1}`;

    const friendlyGridEl = document.getElementById('friendly-grid');
    const targetCell = friendlyGridEl?.querySelector(`button[data-x="${move.x}"][data-y="${move.y}"]`);
    const rect = targetCell?.getBoundingClientRect();

    const targetX = rect ? rect.left + rect.width / 2 : window.innerWidth * 0.35;
    const targetY = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.5;

    this.sound.playLaunch();
    const startX = targetX;
    const startY = 30;

    let hitShip = null;
    for (const s of this.playerShips) {
      if (getShipCells(s).some((c) => c.x === move.x && c.y === move.y)) {
        hitShip = s;
        break;
      }
    }
    const isHit = !!hitShip;

    this.effects.launchMissile(startX, startY, targetX, targetY, isHit, () => {
      if (hitShip) {
        this.playerGrid[move.y][move.x].state = 'hit';
        hitShip.hits++;

        if (hitShip.hits >= hitShip.size) {
          hitShip.sunk = true;
          this.sound.playSunk();
          this.updateLog(`¡HUNDIDO! Nuestro ${hitShip.name} en [${coordLabel}] fue destruido por ${this.opponentName}.`);
        } else {
          this.sound.playExplosion();
          this.updateLog(`¡ALERTA DE IMPACTO! ${this.opponentName} impactó en tu navío en [${coordLabel}].`);
        }
      } else {
        this.playerGrid[move.y][move.x].state = 'miss';
        this.sound.playSplash();
        this.updateLog(`AGUA de ${this.opponentName}. El disparo en [${coordLabel}] cayó al mar.`);
      }

      const playerSunk = this.playerShips.every((s) => s.sunk);
      if (playerSunk) {
        this.sound.playDefeat();
        this.renderBattleGrids();
        this.updateBattleHUD();
        setTimeout(() => this.showGameOver(false), 800);
        return;
      }

      this.isPlayerTurn = true;
      this.isProcessingShot = false;
      this.currentTurn++;

      this.renderBattleGrids();
      this.updateBattleHUD();
    });
  }

  renderFleetStatus(containerId, ships, isEnemy) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    const alive = ships.filter((s) => !s.sunk).length;

    cont.innerHTML = `
      <div class="px-2.5 py-1.5 rounded-lg border backdrop-blur-md ${isEnemy ? 'bg-slate-950/70 border-rose-950/60' : 'bg-slate-950/70 border-cyan-950/60'}">
        <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] font-mono-combat">
          <span class="font-display font-bold uppercase tracking-wider ${isEnemy ? 'text-rose-400' : 'text-cyan-400'}">
            ${isEnemy ? `Flota: ${this.opponentName}` : 'Tu Flota'}
          </span>
          <span class="${alive > 0 ? 'text-emerald-400' : 'text-rose-400'}">
            ${alive}/${ships.length} ACTIVOS
          </span>
        </div>
        <div class="grid grid-cols-5 gap-1.5 text-center">
          ${SHIPS_CONFIG.map((def) => {
            const s = ships.find((ship) => ship.type === def.type);
            const isSunk = s?.sunk || false;
            const hits = s?.hits || 0;
            return `
              <div class="p-1 rounded ${isSunk ? 'bg-rose-950/40 text-rose-400 line-through' : 'bg-slate-900/60 text-slate-300'}">
                <div class="text-[9px] truncate font-medium">${def.name}</div>
                <div class="flex items-center justify-center gap-0.5 mt-0.5">
                  ${Array.from({ length: def.size })
                    .map((_, i) => `<div class="w-1.5 h-1.5 rounded-[1px] ${isSunk ? 'bg-rose-700' : i < hits ? 'bg-rose-500' : isEnemy ? 'bg-slate-700' : 'bg-cyan-500'}"></div>`)
                    .join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  updateLog(message) {
    const lastLogEl = document.getElementById('last-combat-log');
    if (lastLogEl) {
      lastLogEl.textContent = message;
    }
  }

  showGameOver(isVictory) {
    const modal = document.getElementById('game-over-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const titleEl = document.getElementById('game-over-title');
    const subEl = document.getElementById('game-over-subtitle');
    const iconEl = document.getElementById('game-over-icon');
    const boxEl = document.getElementById('game-over-box');

    if (isVictory) {
      if (titleEl) {
        titleEl.textContent = '¡VICTORIA NAVAL!';
        titleEl.className = 'font-display font-black text-2xl uppercase tracking-widest text-cyan-300 mb-1';
      }
      if (subEl) subEl.textContent = `¡Hundiste los 5 buques de ${this.opponentName}!`;
      if (iconEl) {
        iconEl.textContent = '🏆';
        iconEl.className = 'w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border text-2xl bg-cyan-950 border-cyan-400 text-cyan-300';
      }
      if (boxEl) boxEl.className = 'w-full max-w-md p-6 rounded-2xl border text-center bg-slate-950 border-cyan-500 naval-glow-cyan';
    } else {
      if (titleEl) {
        titleEl.textContent = '¡DERROTA NAVAL!';
        titleEl.className = 'font-display font-black text-2xl uppercase tracking-widest text-rose-400 mb-1';
      }
      if (subEl) subEl.textContent = `${this.opponentName} destruyó todos tus navíos.`;
      if (iconEl) {
        iconEl.textContent = '💀';
        iconEl.className = 'w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border text-2xl bg-rose-950 border-rose-500 text-rose-300';
      }
      if (boxEl) boxEl.className = 'w-full max-w-md p-6 rounded-2xl border text-center bg-slate-950 border-rose-500 naval-glow-red';
    }

    const shots = this.stats.shots;
    const hits = this.stats.hits;
    const acc = shots > 0 ? Math.round((hits / shots) * 100) : 0;

    const accEl = document.getElementById('stat-accuracy');
    const shotsEl = document.getElementById('stat-shots');
    const turnsEl = document.getElementById('stat-turns');

    if (accEl) accEl.textContent = `${acc}%`;
    if (shotsEl) shotsEl.textContent = `${shots}`;
    if (turnsEl) turnsEl.textContent = `${this.currentTurn}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  fitGameStage();
  window.addEventListener('resize', fitGameStage);
  new BattleshipGame();
});
