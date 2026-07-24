export class JuiceParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 8 + 4;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.4;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ShockwaveRing {
  constructor(x, y, color = '#ffeb3b') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = 10;
    this.maxRadius = 75;
    this.lineWidth = 8;
    this.alpha = 1.0;
  }

  update() {
    this.radius += 5;
    this.lineWidth *= 0.92;
    this.alpha -= 0.05;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class ScoreText {
  constructor(x, y, text, color = '#ffeb3b') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.vy = -4;
    this.alpha = 1.0;
    this.scale = 1.4;
  }

  update() {
    this.y += this.vy;
    this.scale = Math.max(1.0, this.scale * 0.95);
    this.alpha -= 0.025;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = `bold ${Math.round(28 * this.scale)}px sans-serif`;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
