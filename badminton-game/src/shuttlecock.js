export class Shuttlecock {
  constructor(canvasWidth, canvasHeight) {
    this.cw = canvasWidth;
    this.ch = canvasHeight;
    this.reset('p1');
  }

  reset(server = 'p1') {
    this.x = server === 'p1' ? this.cw * 0.25 : this.cw * 0.75;
    this.y = this.ch * 0.35;
    // High-speed serve (18-22 px/frame)
    this.vx = server === 'p1' ? 18 : -18;
    this.vy = -12;
    this.gravity = 0.45;
    this.radius = 20;
    this.lastHitter = server;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    // Slight air drag
    this.vx *= 0.992;
  }

  draw(ctx) {
    ctx.save();
    
    // Draw motion trail line behind shuttlecock
    ctx.strokeStyle = this.vy > 10 ? '#ff1744' : '#ffeb3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
    ctx.stroke();

    // Draw shuttlecock emoji
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏸', this.x, this.y);
    ctx.restore();
  }

  hit(hitterKey, powerPct) {
    this.lastHitter = hitterKey;
    const powerNorm = Math.min(100, Math.max(20, powerPct));
    // High-speed return (24px to 52px per frame)
    const baseSpeed = 24 + (powerNorm / 100) * 28;

    if (hitterKey === 'p1') {
      this.vx = baseSpeed;
      if (powerNorm > 70) {
        // Flame Smash: Spike downward fast
        this.vy = 16 + (powerNorm * 0.1);
      } else {
        // High Clear / Drive
        this.vy = -14 - (powerNorm * 0.08);
      }
    } else {
      this.vx = -baseSpeed;
      if (powerNorm > 70) {
        this.vy = 16 + (powerNorm * 0.1);
      } else {
        this.vy = -14 - (powerNorm * 0.08);
      }
    }
  }

  // Check if shuttlecock landed on floor or went out of screen
  checkLanding() {
    if (this.y >= this.ch - 50) {
      return this.x < this.cw * 0.5 ? 'LANDED_P1' : 'LANDED_P2';
    }
    if (this.x < 10) return 'LANDED_P1';
    if (this.x > this.cw - 10) return 'LANDED_P2';
    return null;
  }
}
