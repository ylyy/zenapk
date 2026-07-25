let particles = [];
let sparks = [];

export function drawSuperSaiyanAura(ctx, pose, isTransformed) {
  if (!isTransformed) return;

  // MediaPipe landmarks are in raw video normalized space [0, 1].
  // Canvas video rendering is mirrored (scale -1, 1), so mirrored X is (1 - x) * width.
  const headX = pose ? (1 - pose[0].x) * ctx.canvas.width : ctx.canvas.width / 2;
  const headY = pose ? pose[0].y * ctx.canvas.height : ctx.canvas.height / 3;

  // Estimate head size for proportional hair scaling
  let headSize = 80;
  if (pose && pose[1] && pose[2]) {
    const eyeDist = Math.hypot((pose[1].x - pose[2].x) * ctx.canvas.width, (pose[1].y - pose[2].y) * ctx.canvas.height);
    headSize = Math.max(50, eyeDist * 2.2);
  }

  // 1. Draw Golden Flame Hair Crown (anchored directly above nose/forehead)
  ctx.save();
  ctx.fillStyle = '#ffeb3b';
  ctx.shadowColor = '#ff9800';
  ctx.shadowBlur = 30;

  const crownBaseY = headY - headSize * 0.4;
  const w = headSize * 0.9;
  const h = headSize * 1.8;

  ctx.beginPath();
  ctx.moveTo(headX - w, crownBaseY);
  ctx.lineTo(headX - w * 0.7, crownBaseY - h * 0.75);
  ctx.lineTo(headX - w * 0.25, crownBaseY - h * 0.45);
  ctx.lineTo(headX, crownBaseY - h); // Main central hair spike
  ctx.lineTo(headX + w * 0.25, crownBaseY - h * 0.45);
  ctx.lineTo(headX + w * 0.7, crownBaseY - h * 0.75);
  ctx.lineTo(headX + w, crownBaseY);
  ctx.closePath();
  ctx.fill();

  // Inner bright golden hair core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(headX - w * 0.6, crownBaseY);
  ctx.lineTo(headX - w * 0.4, crownBaseY - h * 0.5);
  ctx.lineTo(headX, crownBaseY - h * 0.8);
  ctx.lineTo(headX + w * 0.4, crownBaseY - h * 0.5);
  ctx.lineTo(headX + w * 0.6, crownBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Body Aura Flame Particles
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: headX + (Math.random() - 0.5) * (w * 3.5),
      y: headY + h * 0.8 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 2.5,
      vy: -Math.random() * 10 - 5,
      size: Math.random() * 25 + 12,
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

  // 3. Blue Lightning Sparks around head & body
  if (Math.random() < 0.5) {
    sparks.push({
      x: headX + (Math.random() - 0.5) * (w * 3),
      y: headY - h * 0.3 + (Math.random() - 0.5) * (h * 1.5),
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
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00b0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + (Math.random() - 0.5) * 60, s.y + (Math.random() - 0.5) * 60);
    ctx.stroke();
    ctx.restore();
  }
}
