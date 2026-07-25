let kameBeamProgress = 0;
let beamRays = [];

export function drawKamehameha(ctx, hands, stage) {
  let cx = ctx.canvas.width / 2;
  let cy = ctx.canvas.height / 2;

  if (hands && hands.length > 0) {
    const hand1 = hands[0];
    const hand2 = hands[1] || hands[0];
    // Convert to mirrored canvas X coordinates
    cx = (1 - (hand1[0].x + hand2[0].x) / 2) * ctx.canvas.width;
    cy = ((hand1[0].y + hand2[0].y) / 2) * ctx.canvas.height;
  }

  if (stage === 'STAGE2_STEP1_KAME_CHARGE') {
    kameBeamProgress = 0;
    // Charging Energy Sphere between hands
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Outer glow
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 80);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#00e5ff');
    grad.addColorStop(0.7, 'rgba(0, 176, 255, 0.6)');
    grad.addColorStop(1, 'rgba(0, 176, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 80 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();

    // Converging energy tendrils
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 50;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    ctx.restore();
  } else if (stage === 'STAGE2_STEP2_KAME_BLAST' || stage === 'VICTORY') {
    // 3D Perspective Beam Blast Firing FROM Hands TOWARDS Camera Screen
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    kameBeamProgress = Math.min(1, kameBeamProgress + 0.08);
    const maxRadius = Math.max(ctx.canvas.width, ctx.canvas.height) * 1.2;
    const currentRadius = maxRadius * kameBeamProgress;

    // 1. Expanding 3D Perspective Radial Beam Energy Core
    const beamGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(20, currentRadius));
    beamGrad.addColorStop(0, '#ffffff');
    beamGrad.addColorStop(0.2, '#e0f7fa');
    beamGrad.addColorStop(0.5, '#00e5ff');
    beamGrad.addColorStop(0.8, 'rgba(0, 149, 255, 0.8)');
    beamGrad.addColorStop(1, 'rgba(0, 119, 255, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(20, currentRadius), 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Velocity Radial Beam Rays Rushing towards screen edges
    if (beamRays.length < 30) {
      for (let i = 0; i < 30; i++) {
        beamRays.push({
          angle: (i / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.1,
          speed: 15 + Math.random() * 25,
          dist: 20,
          width: 3 + Math.random() * 6
        });
      }
    }

    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    for (let ray of beamRays) {
      ray.dist += ray.speed;
      if (ray.dist > maxRadius) ray.dist = 20;

      const x1 = cx + Math.cos(ray.angle) * 20;
      const y1 = cy + Math.sin(ray.angle) * 20;
      const x2 = cx + Math.cos(ray.angle) * ray.dist;
      const y2 = cy + Math.sin(ray.angle) * ray.dist;

      ctx.lineWidth = ray.width * (ray.dist / maxRadius + 0.5);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Perspective Concentric Shockwave Rings Expanding Outward
    for (let r = 50; r < currentRadius; r += 120) {
      ctx.strokeStyle = `rgba(0, 229, 255, ${1 - r / maxRadius})`;
      ctx.lineWidth = 15 * (r / maxRadius + 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. KAMEHAMEHA IMPACT Text in 3D perspective pop
    const textScale = Math.min(1.2, kameBeamProgress * 1.4);
    ctx.save();
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(textScale, textScale);
    ctx.font = '900 52px sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3d00';
    ctx.shadowBlur = 30;
    ctx.fillText('⚡ KAMEHAMEHA IMPACT! ⚡', 0, 0);
    ctx.restore();

    ctx.restore();
  } else {
    kameBeamProgress = 0;
    beamRays = [];
  }
}
