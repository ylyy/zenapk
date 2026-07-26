// Performance Optimized Particle Pool & Pre-rendered Glow Sprites
const MAX_PARTICLES = 30;
const MAX_SPARKS = 10;

// 1. Object Pool to prevent Garbage Collection (GC) thrashing
const particlePool = Array.from({ length: MAX_PARTICLES }, () => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  size: 0,
  alpha: 0,
  active: false,
  isGold: true
}));

const sparkPool = Array.from({ length: MAX_SPARKS }, () => ({
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  life: 0,
  active: false
}));

// 2. Offscreen Canvas Sprite Pre-rendering (eliminates expensive shadowBlur & radialGradient per frame)
let goldGlowSprite = null;
let blueGlowSprite = null;

function initGlowSprites() {
  if (goldGlowSprite) return;

  const size = 64;
  // Gold Sprite
  const canvasG = document.createElement('canvas');
  canvasG.width = size;
  canvasG.height = size;
  const ctxG = canvasG.getContext('2d');
  const gradG = ctxG.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradG.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradG.addColorStop(0.3, 'rgba(255, 235, 59, 0.8)');
  gradG.addColorStop(0.7, 'rgba(255, 152, 0, 0.4)');
  gradG.addColorStop(1, 'rgba(255, 152, 0, 0)');
  ctxG.fillStyle = gradG;
  ctxG.fillRect(0, 0, size, size);
  goldGlowSprite = canvasG;

  // Blue Spark Sprite
  const canvasB = document.createElement('canvas');
  canvasB.width = size;
  canvasB.height = size;
  const ctxB = canvasB.getContext('2d');
  const gradB = ctxB.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradB.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradB.addColorStop(0.4, 'rgba(0, 229, 255, 0.8)');
  gradB.addColorStop(1, 'rgba(0, 176, 255, 0)');
  ctxB.fillStyle = gradB;
  ctxB.fillRect(0, 0, size, size);
  blueGlowSprite = canvasB;
}

function spawnParticle(headX, headY, headSize, w) {
  const p = particlePool.find(item => !item.active);
  if (!p) return;

  const sideOffset = (Math.random() > 0.5 ? 1 : -1) * (w * 1.2 + Math.random() * w * 1.5);
  p.x = headX + sideOffset;
  p.y = headY + headSize * 1.4 + Math.random() * 60;
  p.vx = (Math.random() - 0.5) * 2;
  p.vy = -Math.random() * 8 - 4;
  p.size = Math.random() * 24 + 16;
  p.alpha = 1.0;
  p.isGold = Math.random() > 0.3;
  p.active = true;
}

function spawnSpark(headX, headY, w, h) {
  const s = sparkPool.find(item => !item.active);
  if (!s) return;

  s.x = headX + (Math.random() - 0.5) * (w * 3);
  s.y = headY - h * 0.3 + (Math.random() - 0.5) * (h * 1.5);
  s.dx = (Math.random() - 0.5) * 50;
  s.dy = (Math.random() - 0.5) * 50;
  s.life = 5;
  s.active = true;
}

export function drawSuperSaiyanAura(ctx, pose, isTransformed) {
  if (!isTransformed) return;
  initGlowSprites();

  // Mirrored coordinate calculation
  const headX = pose ? (1 - pose[0].x) * ctx.canvas.width : ctx.canvas.width / 2;
  const headY = pose ? pose[0].y * ctx.canvas.height : ctx.canvas.height / 3;

  let headSize = 80;
  if (pose && pose[1] && pose[2]) {
    const eyeDist = Math.hypot((pose[1].x - pose[2].x) * ctx.canvas.width, (pose[1].y - pose[2].y) * ctx.canvas.height);
    headSize = Math.max(50, eyeDist * 2.2);
  }

  // 1. Render Flame Hair Crown (Fast vector fill without heavy shadowBlur per frame)
  ctx.save();
  ctx.fillStyle = '#ffeb3b';

  const crownBaseY = headY - headSize * 1.1;
  const w = headSize * 0.95;
  const h = headSize * 1.8;

  ctx.beginPath();
  ctx.moveTo(headX - w, crownBaseY);
  ctx.lineTo(headX - w * 0.7, crownBaseY - h * 0.75);
  ctx.lineTo(headX - w * 0.25, crownBaseY - h * 0.45);
  ctx.lineTo(headX, crownBaseY - h);
  ctx.lineTo(headX + w * 0.25, crownBaseY - h * 0.45);
  ctx.lineTo(headX + w * 0.7, crownBaseY - h * 0.75);
  ctx.lineTo(headX + w, crownBaseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(headX - w * 0.6, crownBaseY);
  ctx.lineTo(headX - w * 0.4, crownBaseY - h * 0.5);
  ctx.lineTo(headX, crownBaseY - h * 0.85);
  ctx.lineTo(headX + w * 0.4, crownBaseY - h * 0.5);
  ctx.lineTo(headX + w * 0.6, crownBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Spawn particles from pool
  if (Math.random() < 0.8) {
    spawnParticle(headX, headY, headSize, w);
  }
  if (Math.random() < 0.3) {
    spawnSpark(headX, headY, w, h);
  }

  // 3. Batched Draw Body Aura Particles using GPU-accelerated drawImage
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let p of particlePool) {
    if (!p.active) continue;

    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.04;

    if (p.alpha <= 0) {
      p.active = false;
      continue;
    }

    ctx.globalAlpha = p.alpha;
    const sprite = p.isGold ? goldGlowSprite : blueGlowSprite;
    const drawSize = p.size * 2;
    ctx.drawImage(sprite, p.x - p.size, p.y - p.size, drawSize, drawSize);
  }

  // 4. Batched Draw Blue Sparks
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  for (let s of sparkPool) {
    if (!s.active) continue;

    s.life--;
    if (s.life <= 0) {
      s.active = false;
      continue;
    }

    ctx.globalAlpha = s.life / 5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.dx, s.y + s.dy);
    ctx.stroke();
  }
  ctx.restore();
}
