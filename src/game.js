import { Fruit } from './fruit.js';
import { ScoreText } from './particle.js';

export class GameManager {
  constructor(canvas, cameraMgr, handTracker, soundEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraMgr = cameraMgr;
    this.handTracker = handTracker;
    this.sound = soundEngine;

    this.state = 'MENU'; // MENU, PLAYING, GAMEOVER
    this.mode = 'CLASSIC'; // CLASSIC (60s), ENDLESS

    this.score = 0;
    this.combo = 1;
    this.lastHitTime = 0;
    this.timeLeft = 60;
    this.lives = 3;

    this.fruits = [];
    this.particles = [];
    this.scores = [];

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

  startGame(mode = 'CLASSIC') {
    this.mode = mode;
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 1;
    this.timeLeft = 60;
    this.lives = 3;
    this.fruits = [];
    this.particles = [];
    this.scores = [];
    
    this.updateHUD();

    document.getElementById('menu-modal').classList.remove('active');
    document.getElementById('gameover-modal').classList.remove('active');

    this.sound.init();

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

    document.getElementById('final-score').innerText = this.score;
    document.getElementById('final-combo').innerText = `x${this.combo}`;
    document.getElementById('gameover-modal').classList.add('active');
  }

  updateHUD() {
    document.getElementById('score-val').innerText = this.score;
    document.getElementById('combo-val').innerText = `x${this.combo}`;
  }

  updateAndRender(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state !== 'PLAYING') return;

    // 1. Spawn Fruits
    this.spawnTimer++;
    if (this.spawnTimer > 45) { // Spawn every ~0.75s
      this.fruits.push(new Fruit(this.canvas.width, this.canvas.height));
      this.spawnTimer = 0;
    }

    // 2. Track Hands
    const landmarks = this.handTracker.detectHands(this.cameraMgr.video, timestamp);
    const handPoints = this.handTracker.getHandPoints(
      landmarks,
      this.cameraMgr.video,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    // Draw high-contrast glowing hand skeleton & palm aura
    this.handTracker.drawSkeleton(
      this.ctx,
      landmarks,
      this.cameraMgr.video,
      this.canvas.width,
      this.canvas.height,
      this.cameraMgr.isMirrored()
    );

    // 3. Process Collisions & Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.update();
      fruit.draw(this.ctx);

      if (!fruit.isSliced) {
        // Check collision against hand points
        for (const hp of handPoints) {
          const dist = Math.hypot(hp.x - fruit.x, hp.y - fruit.y);
          if (dist < fruit.radius + hp.radius) {
            // Hit!
            const newParticles = fruit.slice();
            this.particles.push(...newParticles);

            const now = performance.now();
            if (now - this.lastHitTime < 1200) {
              this.combo++;
            } else {
              this.combo = 1;
            }
            this.lastHitTime = now;

            if (fruit.config.isBomb) {
              this.sound.playBomb();
              this.score = Math.max(0, this.score + fruit.config.pts);
              this.combo = 1;
              this.scores.push(new ScoreText(fruit.x, fruit.y, `${fruit.config.pts}`, '#ff1744'));
              if (this.mode === 'ENDLESS') {
                this.lives--;
                if (this.lives <= 0) this.endGame();
              }
            } else {
              this.sound.playSlap();
              this.sound.playSplat();
              if (this.combo > 1) this.sound.playCombo(this.combo);

              const pointsEarned = fruit.config.pts * this.combo;
              this.score += pointsEarned;
              this.scores.push(
                new ScoreText(fruit.x, fruit.y, `+${pointsEarned} (x${this.combo})`)
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

    // 4. Update Particles & Score Texts
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
  }
}
