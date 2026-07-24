export class Shuttlecock {
  constructor(canvasWidth, canvasHeight) {
    this.cw = canvasWidth;
    this.ch = canvasHeight;
    this.reset('p1');
  }

  reset(server = 'p1') {
    this.x = server === 'p1' ? this.cw * 0.2 : this.cw * 0.8;
    this.y = this.ch * 0.4;
    this.vx = server === 'p1' ? 6 : -6;
    this.vy = -8;
    this.gravity = 0.35;
    this.radius = 16;
    this.lastHitter = server;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    // Air drag
    this.vx *= 0.99;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏸', this.x, this.y);
    ctx.restore();
  }

  hit(hitterKey, powerPct) {
    this.lastHitter = hitterKey;
    const speedMult = 0.5 + (powerPct / 100) * 1.2;

    if (hitterKey === 'p1') {
      this.vx = (10 + powerPct * 0.1) * speedMult;
      this.vy = powerPct > 75 ? 12 : -12; // Spike vs High Clear
    } else {
      this.vx = -(10 + powerPct * 0.1) * speedMult;
      this.vy = powerPct > 75 ? 12 : -12;
    }
  }

  isOutOfBounds() {
    return this.y > this.ch - 30 || this.x < 0 || this.x > this.cw;
  }
}
