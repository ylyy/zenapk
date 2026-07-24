export class RacketRenderer {
  drawRacket(ctx, pos, color, speed, label) {
    if (!pos) return;
    ctx.save();
    
    // Dynamic glow based on speed
    const speedVal = parseFloat(speed || 0);
    let glowColor = color;
    let radius = 45;
    if (speedVal > 8) {
      glowColor = '#ffea00';
      radius = 55;
    }
    if (speedVal > 15) {
      glowColor = '#ff1744';
      radius = 65;
    }

    // Outer Aura
    ctx.fillStyle = glowColor;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Racket Head Ring
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 35, 0, Math.PI * 2);
    ctx.stroke();

    // Handle string cross
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(pos.x - 25, pos.y); ctx.lineTo(pos.x + 25, pos.y);
    ctx.moveTo(pos.x, pos.y - 25); ctx.lineTo(pos.x, pos.y + 25);
    ctx.stroke();

    // Player Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, pos.x, pos.y + 55);

    ctx.restore();
  }
}
