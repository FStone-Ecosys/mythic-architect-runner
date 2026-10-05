import * as THREE from 'three';

const LANES = [-2.4, 0, 2.4];
const SEGMENT_LEN = 28;
const SEGMENT_COUNT = 8;
const MAX_HEALTH = 5;
const BASE_SPEED = 18;
const MAX_SPEED = 42;
const JUMP_VELOCITY = 11.5;
const GRAVITY = 28;
const DASH_DURATION = 0.38;
const DASH_SPEED_MULT = 1.55;
const DOUBLE_TAP_MS = 280;

const ROMAN = ['NILL', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function toRomanScore(n) {
  const clamped = Math.max(0, Math.floor(n));
  if (clamped === 0) return 'NILL';
  // Compact Roman-ish display like concept art: groups of numerals
  const a = Math.floor(clamped / 100) % 10;
  const b = Math.floor(clamped / 10) % 10;
  const c = clamped % 10;
  const dig = (v) => {
    if (v === 0) return 'O';
    if (v <= 10) return ROMAN[v];
    return String(v);
  };
  // Style like "IO IV II"
  const left = a === 0 ? 'IO' : dig(a) + 'O';
  return `${left} ${dig(b)} ${dig(c)}`;
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

/* ---------- Materials ---------- */
function makeMats() {
  return {
    stone: new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.92,
      metalness: 0.08,
    }),
    obsidian: new THREE.MeshStandardMaterial({
      color: 0x0b0d12,
      roughness: 0.55,
      metalness: 0.35,
    }),
    marble: new THREE.MeshStandardMaterial({
      color: 0x8a8e96,
      roughness: 0.7,
      metalness: 0.05,
    }),
    neon: new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.2,
      roughness: 0.3,
      metalness: 0.6,
    }),
    neonMagenta: new THREE.MeshStandardMaterial({
      color: 0xff2d95,
      emissive: 0xff2d95,
      emissiveIntensity: 1.8,
      roughness: 0.35,
      metalness: 0.5,
    }),
    grate: new THREE.MeshStandardMaterial({
      color: 0x2a3038,
      roughness: 0.5,
      metalness: 0.7,
    }),
    barrier: new THREE.MeshStandardMaterial({
      color: 0x66f0ff,
      emissive: 0x00c8ff,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    }),
    glyph: new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 3.5,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    }),
    body: new THREE.MeshStandardMaterial({
      color: 0x12161c,
      roughness: 0.45,
      metalness: 0.4,
    }),
    skin: new THREE.MeshStandardMaterial({
      color: 0xc4a080,
      roughness: 0.7,
      metalness: 0.05,
    }),
    hair: new THREE.MeshStandardMaterial({
      color: 0xff4fa3,
      emissive: 0xff2d95,
      emissiveIntensity: 0.55,
      roughness: 0.55,
      metalness: 0.15,
    }),
    sole: new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.8,
      roughness: 0.3,
      metalness: 0.5,
    }),
    armor: new THREE.MeshStandardMaterial({
      color: 0x1c222a,
      roughness: 0.4,
      metalness: 0.75,
    }),
    eyeRed: new THREE.MeshStandardMaterial({
      color: 0xff1030,
      emissive: 0xff0020,
      emissiveIntensity: 4,
    }),
    track: new THREE.MeshStandardMaterial({
      color: 0x0e1218,
      roughness: 0.35,
      metalness: 0.25,
    }),
  };
}

/* ---------- Player ---------- */
function createPlayer(mats) {
  const root = new THREE.Group();
  root.name = 'player';

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.35), mats.body);
  torso.position.y = 1.15;
  root.add(torso);

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.3), mats.body);
  hips.position.y = 0.7;
  root.add(hips);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), mats.skin);
  head.position.y = 1.75;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.42), mats.hair);
  hair.position.set(0, 1.98, -0.02);
  root.add(hair);

  const hairSidecar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), mats.hair);
  hairSidecar.position.set(0.22, 1.7, -0.05);
  root.add(hairSidecar);

  // Arms
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), mats.body);
    arm.position.set(side * 0.4, 1.15, 0);
    arm.rotation.z = side * 0.15;
    root.add(arm);
  });

  // Legs + glowing soles
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.2), mats.body);
    leg.position.set(side * 0.16, 0.35, 0);
    root.add(leg);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.32), mats.sole);
    sole.position.set(side * 0.16, 0.05, 0.02);
    root.add(sole);
  });

  // Digital briefcase / device under arm
  const device = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.18), mats.armor);
  device.position.set(-0.55, 1.05, 0.05);
  root.add(device);
  const deviceGlow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.04), mats.neon);
  deviceGlow.position.set(-0.55, 1.15, 0.16);
  root.add(deviceGlow);

  // Soft light at feet
  const footLight = new THREE.PointLight(0x00e5ff, 1.2, 4, 2);
  footLight.position.set(0, 0.2, 0);
  root.add(footLight);

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return root;
}

/* ---------- Gladiator ---------- */
function createGladiator(mats) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 0.7), mats.armor);
  body.position.y = 1.1;
  g.add(body);

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), mats.obsidian);
  helm.position.y = 2.15;
  g.add(helm);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.9), mats.neonMagenta);
  crest.position.set(0, 2.55, 0);
  g.add(crest);

  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.06), mats.eyeRed);
    eye.position.set(x, 2.15, 0.42);
    g.add(eye);
  });

  // Shoulder plates
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.55), mats.armor);
    shoulder.position.set(side * 0.75, 1.7, 0);
    g.add(shoulder);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.35), mats.armor);
    arm.position.set(side * 0.85, 1.0, 0);
    g.add(arm);
  });

  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.55), mats.obsidian);
  legs.position.y = 0.35;
  g.add(legs);

  const glow = new THREE.PointLight(0xff1030, 1.4, 6, 2);
  glow.position.set(0, 2.1, 0.5);
  g.add(glow);

  g.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return g;
}

/* ---------- DATA glyph ---------- */
function createGlyph(mats) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 8, 32), mats.neon);
  group.add(ring);
  const inner = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.42, 24), mats.glyph);
  group.add(inner);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.05), mats.neon);
  group.add(core);

  // Simple "DATA" label via canvas texture
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = '#00f6ff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 8;
  ctx.fillText('DATA', 64, 32);
  const tex = new THREE.CanvasTexture(c);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.35),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  label.position.z = 0.04;
  group.add(label);

  const light = new THREE.PointLight(0x00e5ff, 1.6, 5, 2);
  group.add(light);
  return group;
}

/* ---------- Track segment ---------- */
function createSegment(mats, index) {
  const group = new THREE.Group();
  group.userData.segmentIndex = index;

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, SEGMENT_LEN), mats.track);
  floor.position.y = -0.175;
  floor.receiveShadow = true;
  group.add(floor);

  // Wet highlight strip
  const wet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, SEGMENT_LEN * 0.98),
    new THREE.MeshStandardMaterial({
      color: 0x142028,
      roughness: 0.15,
      metalness: 0.65,
      emissive: 0x003844,
      emissiveIntensity: 0.25,
    })
  );
  wet.rotation.x = -Math.PI / 2;
  wet.position.y = 0.01;
  group.add(wet);

  // Side arches + neon conduits
  for (let side of [-1, 1]) {
    const archCount = 3;
    for (let i = 0; i < archCount; i++) {
      const z = -SEGMENT_LEN / 2 + 4 + i * 8;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.2, 0.7), mats.obsidian);
      pillar.position.set(side * 5.2, 2.1, z);
      pillar.castShadow = true;
      group.add(pillar);

      const capital = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 1.1), mats.stone);
      capital.position.set(side * 5.2, 4.3, z);
      group.add(capital);

      // Neon conduit running up pillar
      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.6, 0.08), mats.neon);
      conduit.position.set(side * 4.8, 2.0, z);
      group.add(conduit);

      // Arch ring piece
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 6, 16, Math.PI), mats.stone);
      arch.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.set(side * 4.4, 3.2, z);
      group.add(arch);
    }

    // Continuous wall behind pillars
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.5, SEGMENT_LEN - 1), mats.stone);
    wall.position.set(side * 6.3, 2.5, 0);
    group.add(wall);

    // Horizontal neon rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, SEGMENT_LEN - 2), mats.neon);
    rail.position.set(side * 4.55, 0.4, 0);
    group.add(rail);
  }

  // Occasional overhead arch
  if (index % 2 === 0) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 0.5), mats.obsidian);
    beam.position.set(0, 4.6, 0);
    group.add(beam);
    const beamNeon = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.08), mats.neon);
    beamNeon.position.set(0, 4.35, 0);
    group.add(beamNeon);
  }

  // Ambient fill for segment
  const amb = new THREE.PointLight(0x00a8c8, 0.55, 18, 2);
  amb.position.set(0, 3.5, 0);
  group.add(amb);

  return group;
}

function createColumnDebris(mats) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 10), mats.marble);
  base.position.y = 0.45;
  base.rotation.z = rand(-0.3, 0.3);
  base.castShadow = true;
  g.add(base);
  const shard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.7), mats.marble);
  shard.position.set(0.4, 0.25, -0.2);
  shard.rotation.set(0.2, 0.5, 0.4);
  g.add(shard);
  return g;
}

function createFloorTrap(mats) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.6), mats.grate);
  plate.position.y = 0.04;
  g.add(plate);
  // Grate lines
  for (let i = -2; i <= 2; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.06), mats.obsidian);
    bar.position.set(0, 0.1, i * 0.28);
    g.add(bar);
  }
  const heat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({
      color: 0xff3355,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
  );
  heat.rotation.x = -Math.PI / 2;
  heat.position.y = 0.12;
  g.add(heat);
  const light = new THREE.PointLight(0xff3355, 0.9, 4, 2);
  light.position.y = 0.4;
  g.add(light);
  return g;
}

function createEnergyBarrier(mats) {
  const g = new THREE.Group();
  const posts = [-1.1, 1.1];
  posts.forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), mats.armor);
    post.position.set(x, 1.2, 0);
    g.add(post);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mats.neonMagenta);
    tip.position.set(x, 2.45, 0);
    g.add(tip);
  });
  const field = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), mats.barrier);
  field.position.y = 1.2;
  g.add(field);
  // Arc accents
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.03, 6, 20, Math.PI), mats.neonMagenta);
  arc.position.y = 1.6;
  arc.rotation.y = Math.PI / 2;
  g.add(arc);
  const light = new THREE.PointLight(0xaa66ff, 1.2, 5, 2);
  light.position.y = 1.5;
  g.add(light);
  return g;
}

/* ===================== GAME ===================== */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = 'boot'; // boot | menu | playing | paused | dead
    this.clock = new THREE.Clock(false);
    this.mats = makeMats();

    this.health = MAX_HEALTH;
    this.score = 0;
    this.glyphs = 0;
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.boostTimer = 0;
    this.stamina = 0.72;
    this.invuln = 0;
    this.hasJumpedOnce = false;

    this.lane = 1;
    this.targetLaneX = LANES[1];
    this.vy = 0;
    this.onGround = true;
    this.dashTimer = 0;
    this.playerZ = 0;

    this.entities = []; // {type, mesh, lane, z, radius, collected?}
    this.segments = [];
    this.nextSpawnZ = 40;
    this.spawnGap = 18;

    this._lastTap = 0;
    this._keys = new Set();
    this._swipeStart = null;

    this._bindUI();
  }

  boot() {
    this._initThree();
    this._buildWorld();
    this._buildPlayer();
    this._setupInput();
    this.onResize();
    this.state = 'menu';
    this.clock.start();
    this._loop();
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x020508, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05080e, 0.022);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    this.camera.position.set(0, 4.2, -8);

    // Lights
    const hemi = new THREE.HemisphereLight(0x1a3040, 0x05060a, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0x88c8e0, 0.55);
    key.position.set(-4, 12, -6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -20;
    key.shadow.camera.right = 20;
    key.shadow.camera.top = 20;
    key.shadow.camera.bottom = -20;
    this.scene.add(key);

    // Starfield / night sky
    const starsGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 600; i++) {
      starPos.push(rand(-80, 80), rand(8, 50), rand(-20, 220));
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xaad8ff, size: 0.08, sizeAttenuation: true })
    );
    this.scene.add(stars);
    this.stars = stars;
  }

  _buildWorld() {
    this.world = new THREE.Group();
    this.scene.add(this.world);

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const seg = createSegment(this.mats, i);
      seg.position.z = i * SEGMENT_LEN;
      this.world.add(seg);
      this.segments.push(seg);
    }

    // Distant colosseum curve suggestion
    const farWall = new THREE.Mesh(
      new THREE.CylinderGeometry(55, 55, 18, 48, 1, true, 0, Math.PI * 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x10151c,
        side: THREE.BackSide,
        roughness: 1,
        metalness: 0.05,
      })
    );
    farWall.position.set(0, 7, 90);
    farWall.rotation.y = Math.PI;
    this.scene.add(farWall);
  }

  _buildPlayer() {
    this.player = createPlayer(this.mats);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
  }

  _bindUI() {
    this.el = {
      hud: document.getElementById('hud'),
      hearts: document.getElementById('health-hearts'),
      score: document.getElementById('score-display'),
      tap: document.getElementById('tap-prompt'),
      stamina: document.getElementById('stamina-fill'),
      start: document.getElementById('start-screen'),
      pause: document.getElementById('pause-screen'),
      over: document.getElementById('gameover-screen'),
      finalScore: document.getElementById('final-score'),
      finalGlyphs: document.getElementById('final-glyphs'),
      statusIcons: [...document.querySelectorAll('#status-icons .status-icon')],
    };
    this._renderHearts();
  }

  _renderHearts() {
    const wrap = this.el.hearts;
    wrap.innerHTML = '';
    for (let i = 0; i < MAX_HEALTH; i++) {
      const h = document.createElement('div');
      h.className = 'heart' + (i < this.health ? ' full' : ' empty');
      wrap.appendChild(h);
    }
    this.el.statusIcons.forEach((icon, idx) => {
      icon.classList.toggle('lit', idx < Math.max(0, this.health - 2));
    });
  }

  _setupInput() {
    const onTap = (isDouble) => {
      if (this.state !== 'playing') return;
      if (isDouble) this.dash();
      else this.jump();
    };

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._keys.add(e.code);
      if (this.state === 'playing') {
        if (e.code === 'Space') {
          e.preventDefault();
          this.jump();
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          e.preventDefault();
          this.dash();
        }
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.changeLane(-1);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.changeLane(1);
        if (e.code === 'Escape' || e.code === 'KeyP') this.pause();
      } else if (this.state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        this.resume();
      } else if ((this.state === 'menu' || this.state === 'dead') && e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'menu') this.start();
        else this.restart();
      }
    });
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));

    const surface = this.canvas;
    const pointerDown = (clientX, clientY) => {
      this._swipeStart = { x: clientX, y: clientY, t: performance.now() };
    };
    const pointerUp = (clientX, clientY) => {
      if (this.state !== 'playing') return;
      if (!this._swipeStart) return;
      const dx = clientX - this._swipeStart.x;
      const dy = clientY - this._swipeStart.y;
      const dt = performance.now() - this._swipeStart.t;
      this._swipeStart = null;

      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        this.changeLane(dx > 0 ? 1 : -1);
        return;
      }
      // Tap / double-tap
      const now = performance.now();
      if (now - this._lastTap < DOUBLE_TAP_MS) {
        this._lastTap = 0;
        onTap(true);
      } else {
        this._lastTap = now;
        // Delay single tap slightly to allow double detection — but jump should feel instant
        // Instant jump on first tap; second tap within window triggers dash
        onTap(false);
      }
    };

    surface.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('button')) return;
      surface.setPointerCapture?.(e.pointerId);
      pointerDown(e.clientX, e.clientY);
    });
    surface.addEventListener('pointerup', (e) => {
      pointerUp(e.clientX, e.clientY);
    });

    // Also allow tapping anywhere on HUD area except buttons
    document.getElementById('hud').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      pointerDown(e.clientX, e.clientY);
    });
    document.getElementById('hud').addEventListener('pointerup', (e) => {
      if (e.target.closest('button')) return;
      pointerUp(e.clientX, e.clientY);
    });
  }

  start() {
    this.resetRun();
    this.state = 'playing';
    this.el.start.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
    this.el.tap.classList.remove('fade', 'hidden');
    this.clock.start();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.el.pause.classList.remove('hidden');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.el.pause.classList.add('hidden');
  }

  restart() {
    this.el.pause.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.start();
  }

  gameOver() {
    this.state = 'dead';
    this.el.finalScore.textContent = `Score: ${Math.floor(this.score)}`;
    this.el.finalGlyphs.textContent = `DATA glyphs: ${this.glyphs}`;
    this.el.over.classList.remove('hidden');
  }

  resetRun() {
    // Clear entities
    for (const ent of this.entities) {
      this.scene.remove(ent.mesh);
    }
    this.entities = [];

    this.health = MAX_HEALTH;
    this.score = 0;
    this.glyphs = 0;
    this.distance = 0;
    this.speed = BASE_SPEED;
    this.boostTimer = 0;
    this.stamina = 0.72;
    this.invuln = 0;
    this.hasJumpedOnce = false;
    this.lane = 1;
    this.targetLaneX = LANES[1];
    this.vy = 0;
    this.onGround = true;
    this.dashTimer = 0;
    this.playerZ = 0;
    this.nextSpawnZ = 35;
    this.spawnGap = 16;

    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    this.player.visible = true;

    // Reset segments
    this.segments.forEach((seg, i) => {
      seg.position.z = i * SEGMENT_LEN;
    });

    this._renderHearts();
    this.el.score.textContent = toRomanScore(0);
    this.el.stamina.style.width = `${this.stamina * 100}%`;
    this.el.tap.classList.remove('fade');
  }

  changeLane(dir) {
    if (this.state !== 'playing') return;
    const next = THREE.MathUtils.clamp(this.lane + dir, 0, 2);
    if (next === this.lane) return;
    this.lane = next;
    this.targetLaneX = LANES[this.lane];
  }

  jump() {
    if (this.state !== 'playing') return;
    if (!this.onGround && this.dashTimer <= 0) return;
    if (!this.onGround) return;
    this.vy = JUMP_VELOCITY;
    this.onGround = false;
    if (!this.hasJumpedOnce) {
      this.hasJumpedOnce = true;
      this.el.tap.classList.add('fade');
    }
  }

  dash() {
    if (this.state !== 'playing') return;
    if (this.stamina < 0.18) return;
    if (this.dashTimer > 0) return;
    this.dashTimer = DASH_DURATION;
    this.stamina = Math.max(0, this.stamina - 0.16);
    this.invuln = Math.max(this.invuln, DASH_DURATION + 0.05);
    // Small hop feel
    if (this.onGround) {
      this.vy = 4.5;
      this.onGround = false;
    }
  }

  _spawnAhead() {
    while (this.nextSpawnZ < this.playerZ + 120) {
      const z = this.nextSpawnZ;
      const pattern = Math.random();

      if (pattern < 0.28) {
        // Glyphs in a lane (sometimes a line)
        const lane = (Math.random() * 3) | 0;
        const count = Math.random() < 0.45 ? 3 : 1;
        for (let i = 0; i < count; i++) {
          this._addEntity('glyph', lane, z + i * 2.2);
        }
      } else if (pattern < 0.48) {
        // Column debris
        this._addEntity('column', (Math.random() * 3) | 0, z);
      } else if (pattern < 0.66) {
        // Floor trap
        this._addEntity('trap', (Math.random() * 3) | 0, z);
      } else if (pattern < 0.82) {
        // Energy barrier — dash or jump over
        this._addEntity('barrier', (Math.random() * 3) | 0, z);
      } else {
        // Gladiator
        this._addEntity('gladiator', (Math.random() * 3) | 0, z);
      }

      // Sometimes a safe glyph near hazard
      if (Math.random() < 0.35) {
        const freeLanes = [0, 1, 2];
        this._addEntity('glyph', pick(freeLanes), z + 4);
      }

      const difficulty = Math.min(1, this.distance / 2500);
      this.spawnGap = THREE.MathUtils.lerp(16, 9, difficulty);
      this.nextSpawnZ += this.spawnGap + rand(-2, 3);
    }
  }

  _addEntity(type, lane, z) {
    let mesh;
    let radius = 0.7;
    let height = 1.2;

    if (type === 'glyph') {
      mesh = createGlyph(this.mats);
      radius = 0.65;
      height = 1.4;
      mesh.position.y = 1.4;
    } else if (type === 'column') {
      mesh = createColumnDebris(this.mats);
      radius = 0.75;
      height = 0.9;
    } else if (type === 'trap') {
      mesh = createFloorTrap(this.mats);
      radius = 0.85;
      height = 0.3;
    } else if (type === 'barrier') {
      mesh = createEnergyBarrier(this.mats);
      radius = 0.9;
      height = 1.5;
    } else if (type === 'gladiator') {
      mesh = createGladiator(this.mats);
      radius = 0.95;
      height = 1.5;
    }

    mesh.position.x = LANES[lane];
    mesh.position.z = z;
    this.scene.add(mesh);
    this.entities.push({ type, mesh, lane, z, radius, height, alive: true });
  }

  _recycleSegments() {
    const first = this.segments[0];
    const last = this.segments[this.segments.length - 1];
    if (first.position.z + SEGMENT_LEN / 2 < this.playerZ - 20) {
      first.position.z = last.position.z + SEGMENT_LEN;
      this.segments.push(this.segments.shift());
    }
  }

  _hurt(amount = 1) {
    if (this.invuln > 0) return;
    this.health -= amount;
    this.invuln = 1.1;
    this.boostTimer = 0;
    this.stamina = Math.max(0.15, this.stamina - 0.12);
    this._renderHearts();
    // Flash fog red-ish
    this.scene.fog.color.set(0x2a0810);
    setTimeout(() => {
      if (this.scene?.fog) this.scene.fog.color.set(0x05080e);
    }, 120);
    if (this.health <= 0) {
      this.health = 0;
      this._renderHearts();
      this.gameOver();
    }
  }

  _updatePlayer(dt) {
    // Lateral lerp
    this.player.position.x = THREE.MathUtils.damp(
      this.player.position.x,
      this.targetLaneX,
      12,
      dt
    );

    // Jump physics
    this.vy -= GRAVITY * dt;
    this.player.position.y += this.vy * dt;
    if (this.player.position.y <= 0) {
      this.player.position.y = 0;
      this.vy = 0;
      this.onGround = true;
    }

    // Forward
    let spd = this.speed;
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      spd *= 1.22;
    }
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      spd *= DASH_SPEED_MULT;
      this.player.rotation.y = Math.sin(performance.now() * 0.04) * 0.08;
    } else {
      this.player.rotation.y = THREE.MathUtils.damp(this.player.rotation.y, 0, 10, dt);
    }

    this.playerZ += spd * dt;
    this.player.position.z = this.playerZ;
    this.distance += spd * dt;
    this.score += spd * dt * 0.35;

    // Run bob
    if (this.onGround) {
      const bob = Math.sin(this.playerZ * 0.55) * 0.04;
      this.player.children[0].position.y = 1.15 + bob;
    }

    // Stamina drain / regen
    if (this.boostTimer > 0) {
      this.stamina = Math.min(1, this.stamina + dt * 0.08);
    } else {
      this.stamina = Math.max(0.05, this.stamina - dt * 0.015);
      if (this.stamina < 0.2) {
        this.speed = Math.max(BASE_SPEED * 0.85, this.speed - dt * 2);
      }
    }

    // Natural speed ramp
    const target = THREE.MathUtils.lerp(BASE_SPEED, MAX_SPEED, Math.min(1, this.distance / 3000));
    if (this.boostTimer > 0 || this.stamina > 0.25) {
      this.speed = THREE.MathUtils.damp(this.speed, target, 0.4, dt);
    }

    if (this.invuln > 0) this.invuln -= dt;

    // Blink when invulnerable after hit
    this.player.visible = this.invuln <= 0 || Math.floor(this.invuln * 14) % 2 === 0;
  }

  _updateCamera(dt) {
    const target = new THREE.Vector3(
      this.player.position.x * 0.55,
      3.8 + this.player.position.y * 0.25,
      this.playerZ - 9.5
    );
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, target.x, 5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, target.y, 5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, target.z, 8, dt);
    this.camera.lookAt(
      this.player.position.x * 0.3,
      1.2 + this.player.position.y * 0.4,
      this.playerZ + 6
    );
  }

  _updateEntities(dt) {
    const pz = this.playerZ;
    const px = this.player.position.x;
    const py = this.player.position.y;

    for (const ent of this.entities) {
      if (!ent.alive) continue;

      // Animate
      if (ent.type === 'glyph') {
        ent.mesh.position.y = 1.35 + Math.sin(performance.now() * 0.005 + ent.z) * 0.15;
        ent.mesh.rotation.y += dt * 1.8;
      } else if (ent.type === 'barrier') {
        const field = ent.mesh.children.find((c) => c.geometry?.type === 'PlaneGeometry');
        if (field) field.material.opacity = 0.35 + Math.sin(performance.now() * 0.01) * 0.2;
      } else if (ent.type === 'gladiator') {
        ent.mesh.position.x = THREE.MathUtils.damp(
          ent.mesh.position.x,
          LANES[ent.lane],
          3,
          dt
        );
        // Slight chase lean toward player lane when close
        if (ent.z - pz < 30 && ent.z > pz) {
          if (Math.abs(ent.lane - this.lane) > 0 && Math.random() < 0.01) {
            ent.lane = this.lane;
          }
        }
        ent.mesh.rotation.y = Math.PI; // face camera / toward player coming from -Z... player runs +Z so gladiator faces -Z
      }

      // Cull behind
      if (ent.z < pz - 12) {
        ent.alive = false;
        this.scene.remove(ent.mesh);
        continue;
      }

      // Collision
      const dz = ent.z - pz;
      const dx = ent.mesh.position.x - px;
      if (Math.abs(dz) < ent.radius + 0.45 && Math.abs(dx) < ent.radius + 0.35) {
        if (ent.type === 'glyph') {
          ent.alive = false;
          this.scene.remove(ent.mesh);
          this.glyphs += 1;
          this.score += 25;
          this.boostTimer = Math.min(4.5, this.boostTimer + 1.6);
          this.stamina = Math.min(1, this.stamina + 0.22);
          continue;
        }

        // Jump clears low obstacles
        const playerClear = py > ent.height * 0.75;
        const dashing = this.dashTimer > 0;

        if (ent.type === 'barrier') {
          // Dash phases through; high jump clears
          if (dashing || py > 1.6) continue;
          ent.alive = false;
          this.scene.remove(ent.mesh);
          this._hurt(1);
        } else if (ent.type === 'trap') {
          if (playerClear || dashing) continue;
          // Trap stays, hurts once then cooldown via flag
          if (!ent._hit) {
            ent._hit = true;
            this._hurt(1);
          }
        } else if (ent.type === 'column') {
          if (playerClear || dashing) continue;
          ent.alive = false;
          this.scene.remove(ent.mesh);
          this._hurt(1);
        } else if (ent.type === 'gladiator') {
          if (dashing) {
            // Bash through
            ent.alive = false;
            this.scene.remove(ent.mesh);
            this.score += 40;
            continue;
          }
          if (playerClear && py > 1.8) continue;
          ent.alive = false;
          this.scene.remove(ent.mesh);
          this._hurt(1);
        }
      }
    }

    this.entities = this.entities.filter((e) => e.alive);
  }

  _updateHUD() {
    this.el.score.textContent = toRomanScore(this.score);
    this.el.stamina.style.width = `${Math.round(this.stamina * 100)}%`;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _loop = () => {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.state === 'playing') {
      this._spawnAhead();
      this._updatePlayer(dt);
      this._updateEntities(dt);
      this._recycleSegments();
      this._updateHUD();
    } else if (this.state === 'menu') {
      // Idle camera drift on title
      this.playerZ += dt * 2;
      this.player.position.z = this.playerZ;
      this._recycleSegments();
    }

    this._updateCamera(dt);
    if (this.stars) this.stars.position.z = this.playerZ * 0.3;

    this.renderer.render(this.scene, this.camera);
  };
}
