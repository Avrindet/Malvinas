/**
 * Controles táctiles para celular y tablet.
 * Joystick izquierdo: mover | Joystick derecho: apuntar y disparar
 */
export class TouchControls {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;
    this.enabled = TouchControls.shouldEnable();
    this.move = { x: 0, y: 0, active: false };
    this.aim = { x: 0, y: 0, active: false };
    this.moveId = null;
    this.aimId = null;
    this.moveOrigin = { x: 0, y: 0 };
    this.aimOrigin = { x: 0, y: 0 };
    this.root = null;

    if (!this.enabled) return;

    document.body.classList.add('touch-mode');
    this.buildUI();
    this.bindEvents();
  }

  static shouldEnable() {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const narrow = window.innerWidth <= 900;
    return (coarse && touch) || (touch && narrow);
  }

  buildUI() {
    this.root = document.createElement('div');
    this.root.id = 'touch-controls';
    this.root.innerHTML = `
      <div id="touch-move-zone" class="touch-zone touch-move">
        <div class="touch-stick-base"></div>
        <div class="touch-stick-knob" id="touch-move-knob"></div>
        <span class="touch-label">MOVER</span>
      </div>
      <div id="touch-aim-zone" class="touch-zone touch-aim">
        <div class="touch-stick-base"></div>
        <div class="touch-stick-knob" id="touch-aim-knob"></div>
        <span class="touch-label">APUNTAR</span>
      </div>
      <div id="touch-actions">
        <button type="button" class="touch-btn" data-key="KeyE" data-tap="1">E</button>
        <button type="button" class="touch-btn" data-key="KeyR" data-tap="1">R</button>
        <button type="button" class="touch-btn" data-key="KeyG" data-tap="1">G</button>
        <button type="button" class="touch-btn touch-btn-mortar" data-key="KeyM" data-tap="1">M</button>
        <button type="button" class="touch-btn" data-key="KeyF">F</button>
        <button type="button" class="touch-btn" data-key="Digit1" data-tap="1">1</button>
        <button type="button" class="touch-btn" data-key="Digit2" data-tap="1">2</button>
        <button type="button" class="touch-btn" data-key="Digit3" data-tap="1">3</button>
        <button type="button" class="touch-btn" data-key="Digit4" data-tap="1">4</button>
        <button type="button" class="touch-btn touch-btn-wide" data-key="KeyB" data-tap="1">B</button>
        <button type="button" class="touch-btn touch-btn-wide" data-key="Escape" data-tap="1">⏸</button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.root);

    this.moveZone = document.getElementById('touch-move-zone');
    this.aimZone = document.getElementById('touch-aim-zone');
    this.moveKnob = document.getElementById('touch-move-knob');
    this.aimKnob = document.getElementById('touch-aim-knob');
  }

  bindEvents() {
    const opts = { passive: false };

    this.moveZone.addEventListener('touchstart', (e) => this.onMoveStart(e), opts);
    this.moveZone.addEventListener('touchmove', (e) => this.onMoveMove(e), opts);
    this.moveZone.addEventListener('touchend', (e) => this.onMoveEnd(e), opts);
    this.moveZone.addEventListener('touchcancel', (e) => this.onMoveEnd(e), opts);

    this.aimZone.addEventListener('touchstart', (e) => this.onAimStart(e), opts);
    this.aimZone.addEventListener('touchmove', (e) => this.onAimMove(e), opts);
    this.aimZone.addEventListener('touchend', (e) => this.onAimEnd(e), opts);
    this.aimZone.addEventListener('touchcancel', (e) => this.onAimEnd(e), opts);

    for (const btn of this.root.querySelectorAll('.touch-btn')) {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.dataset.key;
        this.input.keys[key] = true;
        if (btn.dataset.tap) this.input.keysJustPressed[key] = true;
      }, opts);
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!btn.dataset.tap) this.input.keys[btn.dataset.key] = false;
        else this.input.keys[btn.dataset.key] = false;
      }, opts);
      btn.addEventListener('touchcancel', (e) => {
        this.input.keys[btn.dataset.key] = false;
      }, opts);
    }

    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('#touch-controls, #game-canvas')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  getTouchInZone(e, zone) {
    const rect = zone.getBoundingClientRect();
    for (const t of e.changedTouches) {
      if (t.clientX >= rect.left && t.clientX <= rect.right
        && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        return t;
      }
    }
    for (const t of e.touches) {
      if (t.clientX >= rect.left && t.clientX <= rect.right
        && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        return t;
      }
    }
    return null;
  }

  stickFromTouch(touch, origin, maxR = 42) {
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    return {
      x: dist > 4 ? (Math.cos(angle) * clamped) / maxR : 0,
      y: dist > 4 ? (Math.sin(angle) * clamped) / maxR : 0,
      knobX: Math.cos(angle) * clamped,
      knobY: Math.sin(angle) * clamped,
    };
  }

  onMoveStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t || this.moveId !== null) return;
    this.moveId = t.identifier;
    const rect = this.moveZone.getBoundingClientRect();
    this.moveOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.move.active = true;
    this.applyMoveStick(this.stickFromTouch(t, this.moveOrigin));
  }

  onMoveMove(e) {
    e.preventDefault();
    if (this.moveId === null) return;
    const t = [...e.touches].find((x) => x.identifier === this.moveId);
    if (!t) return;
    this.applyMoveStick(this.stickFromTouch(t, this.moveOrigin));
  }

  onMoveEnd(e) {
    const ended = [...e.changedTouches].some((t) => t.identifier === this.moveId);
    if (!ended && e.type !== 'touchcancel') return;
    this.moveId = null;
    this.move.active = false;
    this.move.x = 0;
    this.move.y = 0;
    this.setMoveKeys(0, 0);
    this.moveKnob.style.transform = 'translate(-50%, -50%)';
  }

  applyMoveStick(stick) {
    this.move.x = stick.x;
    this.move.y = stick.y;
    this.moveKnob.style.transform = `translate(calc(-50% + ${stick.knobX}px), calc(-50% + ${stick.knobY}px))`;
    this.setMoveKeys(stick.x, stick.y);
  }

  setMoveKeys(x, y) {
    const th = 0.28;
    this.input.keys.KeyW = y < -th;
    this.input.keys.KeyS = y > th;
    this.input.keys.KeyA = x < -th;
    this.input.keys.KeyD = x > th;
  }

  onAimStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (!t || this.aimId !== null) return;
    this.aimId = t.identifier;
    const rect = this.aimZone.getBoundingClientRect();
    this.aimOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.aim.active = true;
    this.applyAimStick(this.stickFromTouch(t, this.aimOrigin));
  }

  onAimMove(e) {
    e.preventDefault();
    if (this.aimId === null) return;
    const t = [...e.touches].find((x) => x.identifier === this.aimId);
    if (!t) return;
    this.applyAimStick(this.stickFromTouch(t, this.aimOrigin));
  }

  onAimEnd(e) {
    const ended = [...e.changedTouches].some((t) => t.identifier === this.aimId);
    if (!ended && e.type !== 'touchcancel') return;
    this.aimId = null;
    this.aim.active = false;
    this.aim.x = 0;
    this.aim.y = 0;
    this.input.mouse.down = false;
    this.aimKnob.style.transform = 'translate(-50%, -50%)';
  }

  applyAimStick(stick) {
    this.aim.x = stick.x;
    this.aim.y = stick.y;
    this.aimKnob.style.transform = `translate(calc(-50% + ${stick.knobX}px), calc(-50% + ${stick.knobY}px))`;
  }

  update(player, camera) {
    if (!this.enabled || !player) return;

    this.input.syncCanvasScale(this.canvas);

    if (this.aim.active) {
      const mag = Math.hypot(this.aim.x, this.aim.y);
      const screenPx = player.x - camera.x;
      const screenPy = player.y - camera.y;
      const aimDist = 90 + mag * 60;
      const angle = mag > 0.12 ? Math.atan2(this.aim.y, this.aim.x) : player.angle;
      this.input.mouse.x = screenPx + Math.cos(angle) * aimDist;
      this.input.mouse.y = screenPy + Math.sin(angle) * aimDist;
      this.input.mouse.down = mag > 0.22;
    }
  }
}
