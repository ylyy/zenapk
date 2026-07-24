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
    this.state = 'MENU'; // MENU, COUNTDOWN, PLAYING, GAMEOVER
    this.maxSwing = 0;
    this.maxSmash = 0;

    this.shakeTime = 0;
    this.shakeMagnitude = 0;
    this.hitTexts = [];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.shuttle.cw = window.innerWidth;
    this.shuttle.ch = window.innerHeight;
  }

  startCountdown() {
    this.state = 'COUNTDOWN';
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxSwing = 0;
    this.maxSmash = 0;
    this.hitTexts = [];

    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');

    const cdOverlay = document.getElementById('countdown-overlay');
    const cdNum = document.getElementById('countdown-num');
    cdOverlay.classList.add('active');

    this.sound.init();

    let count = 3;
    cdNum.innerText = count;
    this.sound.playCountdownBeep(false);

    const cdInterval = setInterval(() => {
      count--;
      if (count > 0) {
        cdNum.innerText = count;
        this.sound.playCountdownBeep(false);
      } else if (count === 0) {
        cdNum.innerText = 'MATCH PLAY!';
        this.sound.playCountdownBeep(true);
      } else {
        clearInterval(cdInterval);
        cdOverlay.classList.remove('active');
        this.startMatchLoop();
      }
    }, 900);
  }

  startMatchLoop() {
    this.state = 'PLAYING';
    this.sound.startBGM();
    this.updateHUD();
    this.shuttle.reset('p1');
  }

  triggerShake(magnitude = 14) {
    this.shakeTime = 10;
    this.shakeMagnitude = magnitude;
  }

  addHitText(x, y, text, color = '#ffeb3b') {
    this.hitTexts.push({ x, y, text, color, alpha: 1.0, scale: 1.3 });
  }

  updateHUD() {
    document.getElementById('p1-score').innerText = this.p1Score;
    document.getElementById('p2-score').innerText = this.p2Score;
  }

  updateAndRender() {
    this.ctx.save();

    // Apply Screen Shake if active
    if (this.shakeTime > 0) {
      this.shakeTime--;
      const dx = (Math.random() - 0.5) * this.shakeMagnitude;
      const dy = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw 2D Badminton Court, Net, and Floor
    this.drawCourt();

    if (this.state !== 'PLAYING') {
      this.ctx.restore();
      return;
    }

    const now = performance.now();
    const { p1Pos, p2Pos } = this.tracker.detect(this.cameraMgr.video, this.canvas.width, this.canvas.height);

    if (p1Pos) this.analyzer.updatePlayer('p1', p1Pos, now);
    if (p2Pos) this.analyzer.updatePlayer('p2', p2Pos, now);

    // Update Motion Analytics Cards
    document.getElementById('p1-speed').innerText = `${this.analyzer.stats.p1.currentSpeed} m/s`;
    document.getElementById('p1-swing').innerText = `${this.analyzer.stats.p1.lastSwingSpeed} km/h`;
    document.getElementById('p1-power-bar').style.width = `${this.analyzer.stats.p1.power}%`;

    document.getElementById('p2-speed').innerText = `${this.analyzer.stats.p2.currentSpeed} m/s`;
    document.getElementById('p2-swing').innerText = `${this.analyzer.stats.p2.lastSwingSpeed} km/h`;
    document.getElementById('p2-power-bar').style.width = `${this.analyzer.stats.p2.power}%`;

    // Render Virtual Rackets on hands
    this.racketRenderer.drawRacket(this.ctx, p1Pos, '#ff4081', this.analyzer.stats.p1.currentSpeed, 'P1 RACKET');
    this.racketRenderer.drawRacket(this.ctx, p2Pos, '#00e676', this.analyzer.stats.p2.currentSpeed, 'P2 RACKET');

    // Update Shuttlecock High-Speed Physics
    this.shuttle.update();
    this.shuttle.draw(this.ctx);

    // Auto Practice Wall
    if (!p2Pos && this.shuttle.x > this.canvas.width * 0.85 && this.shuttle.vx > 0) {
      this.shuttle.vx = -Math.abs(this.shuttle.vx);
      this.shuttle.vy = -10;
      this.sound.playSwish();
    }
    if (!p1Pos && this.shuttle.x < this.canvas.width * 0.15 && this.shuttle.vx < 0) {
      this.shuttle.vx = Math.abs(this.shuttle.vx);
      this.shuttle.vy = -10;
      this.sound.playSwish();
    }

    // Collision Check: Shuttlecock vs P1 Racket
    if (p1Pos && Math.hypot(p1Pos.x - this.shuttle.x, p1Pos.y - this.shuttle.y) < 70 && this.shuttle.lastHitter !== 'p1') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p1');
      this.shuttle.hit('p1', powerPct);
      const isSmash = powerPct > 70;
      this.sound.playHit(isSmash);

      if (isSmash) {
        this.triggerShake(16);
        this.addHitText(p1Pos.x, p1Pos.y - 30, `FLAME SMASH! 🔥 ${swingKmH}km/h`, '#ff1744');
      } else {
        this.addHitText(p1Pos.x, p1Pos.y - 30, `WHACK! ${swingKmH}km/h`, '#ffeb3b');
      }

      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    // Collision Check: Shuttlecock vs P2 Racket
    if (p2Pos && Math.hypot(p2Pos.x - this.shuttle.x, p2Pos.y - this.shuttle.y) < 70 && this.shuttle.lastHitter !== 'p2') {
      const { swingKmH, powerPct } = this.analyzer.registerSwingImpact('p2');
      this.shuttle.hit('p2', powerPct);
      const isSmash = powerPct > 70;
      this.sound.playHit(isSmash);

      if (isSmash) {
        this.triggerShake(16);
        this.addHitText(p2Pos.x, p2Pos.y - 30, `FLAME SMASH! 🔥 ${swingKmH}km/h`, '#ff1744');
      } else {
        this.addHitText(p2Pos.x, p2Pos.y - 30, `WHACK! ${swingKmH}km/h`, '#ffeb3b');
      }

      if (swingKmH > this.maxSwing) this.maxSwing = swingKmH;
      if (powerPct > this.maxSmash) this.maxSmash = powerPct;
    }

    // Render Floating Hit Texts
    for (let i = this.hitTexts.length - 1; i >= 0; i--) {
      const ht = this.hitTexts[i];
      ht.y -= 2;
      ht.alpha -= 0.025;
      if (ht.alpha <= 0) {
        this.hitTexts.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ht.alpha);
      this.ctx.font = 'bold 24px sans-serif';
      this.ctx.fillStyle = ht.color;
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(ht.text, ht.x, ht.y);
      this.ctx.fillText(ht.text, ht.x, ht.y);
      this.ctx.restore();
    }

    // Landing / Fault Scoring
    const landing = this.shuttle.checkLanding();
    if (landing) {
      if (landing === 'LANDED_P1') {
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

    this.ctx.restore();
  }

  drawCourt() {
    this.ctx.save();
    
    // Net posts & Line in middle
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([12, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();

    // Floor Line
    this.ctx.setLineDash([]);
    this.ctx.strokeStyle = '#00e676';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height - 40);
    this.ctx.lineTo(this.canvas.width, this.canvas.height - 40);
    this.ctx.stroke();

    // Net tag text
    this.ctx.fillStyle = '#ffeb3b';
    this.ctx.font = 'bold 18px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏸 球网 (NET)', this.canvas.width / 2, this.canvas.height - 55);
    this.ctx.restore();
  }

  endMatch(winner) {
    this.state = 'GAMEOVER';
    let badge = '⚡ 极速羽球战神 ⚡';
    if (this.maxSmash > 70) badge = '🔥 本场 MVP: 扣杀之王 🔥';

    document.getElementById('winner-title').innerText = `🏆 ${winner} 获胜！`;
    document.getElementById('mvp-badge').innerText = badge;
    document.getElementById('final-match-score').innerText = `${this.p1Score} : ${this.p2Score}`;
    document.getElementById('max-swing-speed').innerText = `${this.maxSwing} km/h`;
    document.getElementById('max-smash-power').innerText = `${this.maxSmash}%`;
    document.getElementById('gameover-modal').classList.add('active');
  }
}
