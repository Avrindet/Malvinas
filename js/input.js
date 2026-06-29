export class Input {
  constructor(canvas) {
    this.keys = {};
    this.keysJustPressed = {};
    this.mouse = { x: 0, y: 0, down: false, justPressed: false };
    this.canvas = canvas;
    this.scaleX = 1;
    this.scaleY = 1;

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
      this.keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyE', 'KeyF', 'KeyG', 'KeyM',
           'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Escape', 'Space', 'Enter', 'KeyB'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.offsetX * this.scaleX;
      this.mouse.y = e.offsetY * this.scaleY;
    }, { passive: true });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.x = e.offsetX * this.scaleX;
        this.mouse.y = e.offsetY * this.scaleY;
        this.mouse.down = true;
        this.mouse.justPressed = true;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.down = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('touchstart', (e) => {
      if (e.target !== canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t = [...e.changedTouches].find((ct) =>
        ct.clientX >= rect.left && ct.clientX <= rect.right
        && ct.clientY >= rect.top && ct.clientY <= rect.bottom);
      if (!t) return;
      this.mouse.x = (t.clientX - rect.left) * this.scaleX;
      this.mouse.y = (t.clientY - rect.top) * this.scaleY;
      this.mouse.justPressed = true;
    }, { passive: true });
  }

  syncCanvasScale(canvas) {
    const rect = canvas.getBoundingClientRect();
    this.scaleX = canvas.width / rect.width;
    this.scaleY = canvas.height / rect.height;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.keysJustPressed[code];
  }

  clearFrame() {
    this.mouse.justPressed = false;
    this.keysJustPressed = {};
  }
}
