export class JuiceParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 6 + 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.3;
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

export class ScoreText {
  constructor(x, y, text, color = '#ffeb3b') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.vy = -3;
    this.alpha = 1.0;
  }

  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
