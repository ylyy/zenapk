let kameBeamProgress = 0;

export function drawKamehameha(ctx, hands, stage) {
  if (stage === 'STAGE2_STEP1_KAME_CHARGE') {
    let cx = ctx.canvas.width / 2;
    let cy = ctx.canvas.height / 2;

    if (hands && hands.length > 0) {
      const hand1 = hands[0];
      const hand2 = hands[1] || hands[0];
      cx = ((hand1[0].x + hand2[0].x) / 2) * ctx.canvas.width;
      cy = ((hand1[0].y + hand2[0].y) / 2) * ctx.canvas.height;
    }

    // Charging Energy Sphere
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 70);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00e5ff');
    grad.addColorStop(1, 'rgba(0, 176, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 70 + Math.random() * 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (stage === 'STAGE2_STEP2_KAME_BLAST' || stage === 'VICTORY') {
    let cy = ctx.canvas.height / 2;
    if (hands && hands.length > 0) {
      cy = hands[0][0].y * ctx.canvas.height;
    }

    // Firing Giant Beam Blast
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    kameBeamProgress = Math.min(1, kameBeamProgress + 0.1);
    const beamWidth = 220 * kameBeamProgress;

    const grad = ctx.createLinearGradient(0, cy - beamWidth / 2, 0, cy + beamWidth / 2);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
    grad.addColorStop(0.3, '#00e5ff');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.7, '#00e5ff');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0.2)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, cy - beamWidth / 2, ctx.canvas.width, beamWidth);

    // KAMEHAMEHA IMPACT Text
    ctx.font = '900 44px sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3d00';
    ctx.shadowBlur = 20;
    ctx.fillText('⚡ KAMEHAMEHA IMPACT! ⚡', ctx.canvas.width / 2, ctx.canvas.height / 2);

    ctx.restore();
  } else {
    kameBeamProgress = 0;
  }
}
