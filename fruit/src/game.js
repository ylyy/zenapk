import { Fruit } from './fruit.js';
import { ScoreText, ShockwaveRing } from './particle.js';

export class GameManager {
  constructor(canvas, cameraMgr, handTracker, soundEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraMgr = cameraMgr;
    this.handTracker = handTracker;
    this.sound = soundEngine;

    this.state = 'MENU'; // MENU, COUNTDOWN, PLAYING, GAMEOVER
    this.mode = 'CLASSIC';

    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.slicedCount = 0;
    this.lastHitTime = 0;
    this.timeLeft = 60;
    this.lives = 3;

    this.fruits = [];
    this.particles = [];
    this.scores = [];
    this.rings = [];

    this.shakeTime = 0;
    this.shakeMagnitude = 0;

    this.spawnTimer = 0;
    this.gameTimerInterval = null;

    this.highScore = parseInt(localStorage.getItem('fruit_slap_highscore') || '0');
    document.getElementById('high-score-val').innerText = this.highScore;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startCountdown(mode = 'CLASSIC') {
    this.mode = mode;
    this.state = 'COUNTDOWN';
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.slicedCount = 0;
    this.timeLeft = 60;
    this.lives = 3;
    this.fruits = [];
    this.particles = [];
    this.scores = [];
    this.rings = [];

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
        cdNum.innerText = 'GO!!';
        this.sound.playCountdownBeep(true);
      } else {
        clearInterval(cdInterval);
        cdOverlay.classList.remove('active');
        this.startGameLoop();
      }
    }, 900);
  }

  startGameLoop() {
    this.state = 'PLAYING';
    this.sound.startBGM();
    this.updateHUD();

    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);

    if (this.mode === 'CLASSIC') {
      this.gameTimerInterval = setInterval(() => {
        this.timeLeft--;
        document.getElementById('time-val').innerText = `${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      }, 1000);
    } else {
      document.getElementById('time-val').innerText = '∞';
    }
  }

  endGame() {
    this.state = 'GAMEOVER';
    if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('fruit_slap_highscore', this.highScore.toString());
      document.getElementById('high-score-val').innerText = this.highScore;
    }

    // Rating evaluation
    let stars = '⭐';
    let title = '初出茅庐拍击手';
    if (this.score >= 100) { stars = '⭐⭐'; title = '拍击高手！'; }
    if (this.score >= 250) { stars = '⭐⭐⭐'; title = '无敌拍击王！🔥'; }

    document.getElementById('star-rating').innerText = stars;
    document.getElementById('rating-title').innerText = title;
    document.getElementById('final-score').innerText = this.score;
    document.getElementById('final-combo').innerText = `x${this.maxCombo}`;
    document.getElementById('final-fruits').innerText = `${this.slicedCount} 个`;

    document.getElementById('gameover-modal').classList.add('active');
  }

  triggerShake(magnitude = 12) {
    this.shakeTime = 12;
    this.shakeMagnitude = magnitude;
  }

  updateHUD() {
    document.getElementById('score-val').innerText = this.score;
    document.getElementById('combo-val').innerText = `x${this.combo}`;
  }

  updateAndRender(timestamp) {
    this.ctx.save();

    // Apply Screen Shake if active
    if (this.shakeTime > 0) {
      this.shakeTime--;
      const dx = (Math.random() - 0.5) * this.shakeMagnitude;
      const dy = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state !== 'PLAYING') {
      this.ctx.restore();
      return;
    }

    // 1. Spawn Fruits
    this.spawnTimer++;
    if (this.spawnTimer > 40) {
      this.fruits.push(new Fruit(this.canvas.width, this.canvas.height));
      this.spawnTimer = 0;
    }

    // 2. Track Hands with correct camera video argument
    const landmarks = this.handTracker.detectHands(this.cameraMgr.video, timestamp);
    const handPoints = this.handTracker.getHandPoints(
      landmarks,
      this.cameraMgr.video,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    this.handTracker.drawCyberBlade(
      this.ctx,
      landmarks,
      this.cameraMgr.video,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    // 3. Process Collisions
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.update();
      fruit.draw(this.ctx);

      if (!fruit.isSliced) {
        for (const hp of handPoints) {
          const dist = Math.hypot(hp.x - fruit.x, hp.y - fruit.y);
          if (dist < fruit.radius + hp.radius) {
            // HIT!
            const newParticles = fruit.slice();
            this.particles.push(...newParticles);

            // Add Shockwave Ring
            this.rings.push(new ShockwaveRing(fruit.x, fruit.y, fruit.config.color));
            this.slicedCount++;

            const now = performance.now();
            if (now - this.lastHitTime < 1200) {
              this.combo++;
            } else {
              this.combo = 1;
            }
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            this.lastHitTime = now;

            if (fruit.config.isBomb) {
              this.sound.playBomb();
              this.triggerShake(20);
              this.score = Math.max(0, this.score + fruit.config.pts);
              this.combo = 1;
              this.scores.push(new ScoreText(fruit.x, fruit.y, `BOMB BOOM! ${fruit.config.pts}`, '#ff1744'));
              if (this.mode === 'ENDLESS') {
                this.lives--;
                if (this.lives <= 0) this.endGame();
              }
            } else {
              this.sound.playSlap();
              this.sound.playSplat();
              this.triggerShake(8);
              if (this.combo > 1) this.sound.playCombo(this.combo);

              const pointsEarned = fruit.config.pts * this.combo;
              this.score += pointsEarned;
              this.scores.push(
                new ScoreText(fruit.x, fruit.y, `+${pointsEarned} (${this.combo > 1 ? 'x' + this.combo : 'SLAP!'})`)
              );
            }

            this.updateHUD();
            break;
          }
        }
      }

      if (fruit.isOutOfBounds()) {
        this.fruits.splice(i, 1);
      }
    }

    // 4. Update Rings & Particles
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.update();
      ring.draw(this.ctx);
      if (ring.alpha <= 0) this.rings.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      p.draw(this.ctx);
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.scores.length - 1; i >= 0; i--) {
      const st = this.scores[i];
      st.update();
      st.draw(this.ctx);
      if (st.alpha <= 0) this.scores.splice(i, 1);
    }

    this.ctx.restore();
  }
}
