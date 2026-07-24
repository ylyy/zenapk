let particles = [];
let sparks = [];

export function drawSuperSaiyanAura(ctx, pose, isTransformed) {
  if (!isTransformed) return;

  const headX = pose ? pose[0].x * ctx.canvas.width : ctx.canvas.width / 2;
  const headY = pose ? pose[0].y * ctx.canvas.height : ctx.canvas.height / 3;

  // 1. Draw Golden Flame Hair Crown
  ctx.save();
  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ff9800';
  ctx.shadowBlur = 25;

  ctx.beginPath();
  ctx.moveTo(headX - 70, headY - 10);
  ctx.lineTo(headX - 50, headY - 120);
  ctx.lineTo(headX - 15, headY - 70);
  ctx.lineTo(headX, headY - 160); // High center spike
  ctx.lineTo(headX + 15, headY - 70);
  ctx.lineTo(headX + 50, headY - 120);
  ctx.lineTo(headX + 70, headY - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Body Aura Flame Particles
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: headX + (Math.random() - 0.5) * 260,
      y: headY + 120 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 9 - 4,
      size: Math.random() * 24 + 12,
      alpha: 1,
      color: Math.random() > 0.3 ? 'rgba(255, 235, 59, ' : 'rgba(255, 152, 0, '
    });
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = p.color + p.alpha + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Blue Lightning Sparks
  if (Math.random() < 0.45) {
    sparks.push({
      x: headX + (Math.random() - 0.5) * 280,
      y: headY + (Math.random() - 0.5) * 280,
      life: 6
    });
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life--;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00b0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + (Math.random() - 0.5) * 50, s.y + (Math.random() - 0.5) * 50);
    ctx.stroke();
    ctx.restore();
  }
}
