export class Shuttlecock {
  constructor(canvasWidth, canvasHeight) {
    this.cw = canvasWidth;
    this.ch = canvasHeight;
    this.reset('p1');
  }

  reset(server = 'p1') {
    this.x = server === 'p1' ? this.cw * 0.25 : this.cw * 0.75;
    this.y = this.ch * 0.35;
    // Balanced arcade serve speed (12-14 px/frame)
    this.vx = server === 'p1' ? 13 : -13;
    this.vy = -10;
    this.gravity = 0.38;
    this.radius = 24;
    this.lastHitter = server;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    // Air drag
    this.vx *= 0.994;

    // Strict boundary clamping so the shuttlecock NEVER flies out of the visible screen
    this.x = Math.max(30, Math.min(this.cw - 30, this.x));
    this.y = Math.max(30, this.y);
  }

  draw(ctx) {
    ctx.save();
    
    // Glowing motion trail
    ctx.strokeStyle = this.vy > 10 ? '#ff1744' : '#ffeb3b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
    ctx.stroke();

    // High-visibility glowing halo around shuttlecock
    ctx.shadowColor = '#ffeb3b';
    ctx.shadowBlur = 20;

    // Shuttlecock emoji size
    ctx.font = '44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏸', this.x, this.y);

    ctx.restore();
  }

  hit(hitterKey, powerPct) {
    this.lastHitter = hitterKey;
    const powerNorm = Math.min(100, Math.max(20, powerPct));
    // Comfortable arcade hit speed (14px to 26px per frame)
    const baseSpeed = 14 + (powerNorm / 100) * 12;

    if (hitterKey === 'p1') {
      this.vx = baseSpeed;
      if (powerNorm > 70) {
        // Flame Smash: Spike downward fast
        this.vy = 12 + (powerNorm * 0.08);
      } else {
        // High Clear / Drive
        this.vy = -12 - (powerNorm * 0.06);
      }
    } else {
      this.vx = -baseSpeed;
      if (powerNorm > 70) {
        this.vy = 12 + (powerNorm * 0.08);
      } else {
        this.vy = -12 - (powerNorm * 0.06);
      }
    }
  }

  // Check if shuttlecock landed on floor or hit screen side bounds
  checkLanding() {
    if (this.y >= this.ch - 50) {
      return this.x < this.cw * 0.5 ? 'LANDED_P1' : 'LANDED_P2';
    }
    if (this.x <= 35) return 'LANDED_P1';
    if (this.x >= this.cw - 35) return 'LANDED_P2';
    return null;
  }
}
