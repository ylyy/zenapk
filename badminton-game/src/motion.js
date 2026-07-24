export class MotionAnalyzer {
  constructor() {
    this.history = { p1: [], p2: [] };
    this.stats = {
      p1: { currentSpeed: 0, lastSwingSpeed: 0, power: 0, pos: { x: 0, y: 0 } },
      p2: { currentSpeed: 0, lastSwingSpeed: 0, power: 0, pos: { x: 0, y: 0 } }
    };
  }

  updatePlayer(playerKey, handCoords, now) {
    if (!handCoords) return;

    const playerStats = this.stats[playerKey];
    playerStats.pos = handCoords;

    const hist = this.history[playerKey];
    hist.push({ x: handCoords.x, y: handCoords.y, t: now });
    if (hist.length > 6) hist.shift();

    if (hist.length >= 2) {
      const pFirst = hist[0];
      const pLast = hist[hist.length - 1];
      const dt = (pLast.t - pFirst.t) / 1000;
      if (dt > 0) {
        const dist = Math.hypot(pLast.x - pFirst.x, pLast.y - pFirst.y);
        const speedPx = dist / dt; // px / sec
        // Scale to simulated m/s
        playerStats.currentSpeed = Math.min(25.0, (speedPx / 150)).toFixed(1);
      }
    }
  }

  registerSwingImpact(playerKey) {
    const hist = this.history[playerKey];
    if (hist.length < 2) return { swingKmH: 40, powerPct: 40 };

    let maxSpeed = 0;
    for (let i = 1; i < hist.length; i++) {
      const dt = (hist[i].t - hist[i - 1].t) / 1000;
      if (dt > 0) {
        const dist = Math.hypot(hist[i].x - hist[i - 1].x, hist[i].y - hist[i - 1].y);
        const speed = dist / dt;
        if (speed > maxSpeed) maxSpeed = speed;
      }
    }

    const swingKmH = Math.min(160, Math.round(maxSpeed / 8));
    const powerPct = Math.min(100, Math.round((swingKmH / 140) * 100));

    this.stats[playerKey].lastSwingSpeed = swingKmH;
    this.stats[playerKey].power = powerPct;

    return { swingKmH, powerPct };
  }
}
