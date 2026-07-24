import { MotionAnalyzer } from './motion.js';
import { RacketRenderer } from './racket.js';
import { Shuttlecock } from './shuttlecock.js';

export class GameManager {
  constructor(canvas, cameraMgr, tracker, sound) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraMgr = cameraMgr;
    this.tracker = tracker;
    this.sound = sound;

    this.analyzer = new MotionAnalyzer();
    this.racketRenderer = new RacketRenderer();
    this.shuttle = new Shuttlecock(canvas.width, canvas.height);

    this.p1Score = 0;
    this.p2Score = 0;
    this.state = 'MENU';
    this.maxSwing = 0;
    this.maxSmash = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.shuttle.cw = window.innerWidth;
    this.shuttle.ch = window.innerHeight;
  }

  startMatch() {
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxSwing = 0;
    this.maxSmash = 0;
    this.state = 'PLAYING';
    this.updateHUD();
    this.shuttle.reset('p1');
    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');
    this.sound.init();
  }

  updateHUD() {
    document.getElementById('p1-score').innerText = this.p1Score;
    document.getElementById('p2-score').innerText = this.p2Score;
  }

  updateAndRender() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw 2D Court Net & Center Line
    this.drawCourt();

    if (this.state !== 'PLAYING') return;

    const now = performance.now();
    const { p1Hand, p2Hand } = this.tracker.detect(this.cameraMgr.video);

    let p1Pos = null;
    let p2Pos = null;

    if (p1Hand) {
      const lm = p1Hand[9];
      p1Pos = this.tracker.transformCoords(lm, this.cameraMgr.video, this.canvas.width, this.canvas.height);
      this.analyzer.updatePlayer('p1', p1Pos, now);
    }
    if (p2Hand) {
      const lm = p2Hand[9];
      p2Pos = this.tracker.transformCoords(lm, this.cameraMgr.video, this.canvas.width, this.canvas.height);
      this.analyzer.updatePlayer('p2', p2Pos, now);
    }

    // Update Analytics UI Card
    document.getElementById('p1-speed').innerText = `${this.analyzer.stats.p1.currentSpeed} m/s`;
    document.getElementById('p1-swing').innerText = `${this.analyzer.stats.p1.lastSwingSpeed} km/h`;
    document.getElementById('p1-power-bar').style.width = `${this.analyzer.stats.p1.power}%`;

    document.getElementById('p2-speed').innerText = `${this.analyzer.stats.p2.currentSpeed} m/s`;
    document.getElementById('p2-swing').innerText = `${this.analyzer.stats.p2.lastSwingSpeed} km/h`;
    document.getElementById('p2-power-bar').style.width = `${this.analyzer.stats.p2.power}%`;

    // Render Virtual Rackets
    this.racketRenderer.drawRacket(this.ctx, p1Pos, '#ff4081', this.analyzer.stats.p1.currentSpeed, 'P1 RACKET');
    this.racketRenderer.drawRacket(this.ctx, p2Pos, '#00e676', this.analyzer.stats.p2.currentSpeed, 'P2 RACKET');

    // Update Shuttlecock Physics
    this.shuttle.update();
    this.shuttle.draw(this.ctx);

    // Collision Check: Shuttlecock vs P1/P2 Rackets
    if (p1Pos && Math.hypot(p1Pos.x - this.shuttle.x, p1Pos.y - this.shuttle.y) < 65 && this.shuttle.lastHitter !== 'p1') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p1');
      this.shuttle.hit('p1', powerPct);
      this.sound.playHit(powerPct > 75);
      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    if (p2Pos && Math.hypot(p2Pos.x - this.shuttle.x, p2Pos.y - this.shuttle.y) < 65 && this.shuttle.lastHitter !== 'p2') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p2');
      this.shuttle.hit('p2', powerPct);
      this.sound.playHit(powerPct > 75);
      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    // Out of bounds / Floor landing scoring
    if (this.shuttle.isOutOfBounds()) {
      if (this.shuttle.x < this.canvas.width * 0.5) {
        this.p2Score++;
        this.sound.playScore();
        this.shuttle.reset('p2');
      } else {
        this.p1Score++;
        this.sound.playScore();
        this.shuttle.reset('p1');
      }
      this.updateHUD();

      if (this.p1Score >= 11 || this.p2Score >= 11) {
        this.endMatch(this.p1Score >= 11 ? 'PLAYER 1' : 'PLAYER 2');
      }
    }
  }

  drawCourt() {
    this.ctx.save();
    // Center Net Line
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    // Net post icon in middle
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.font = '24px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏸 NET', this.canvas.width / 2, this.canvas.height - 40);
    this.ctx.restore();
  }

  endMatch(winner) {
    this.state = 'GAMEOVER';
    document.getElementById('winner-title').innerText = `🏆 ${winner} 获胜！`;
    document.getElementById('max-swing-speed').innerText = `${this.maxSwing} km/h`;
    document.getElementById('max-smash-power').innerText = `${this.maxSmash}%`;
    document.getElementById('gameover-modal').classList.add('active');
  }
}
