import { JuiceParticle } from './particle.js';

export const FRUIT_TYPES = {
  APPLE: { emoji: '🍎', color: '#ff1744', radius: 40, pts: 10, isBomb: false },
  ORANGE: { emoji: '🍊', color: '#ff9100', radius: 38, pts: 10, isBomb: false },
  WATERMELON: { emoji: '🍉', color: '#00e676', radius: 55, pts: 20, isBomb: false },
  STRAWBERRY: { emoji: '🍓', color: '#f50057', radius: 32, pts: 15, isBomb: false },
  BANANA: { emoji: '🍌', color: '#ffea00', radius: 36, pts: 15, isBomb: false },
  BOMB: { emoji: '💣', color: '#333333', radius: 42, pts: -30, isBomb: true }
};

export class Fruit {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Choose random type (Bomb has 15% chance)
    const types = Object.values(FRUIT_TYPES);
    const rand = Math.random();
    if (rand < 0.15) {
      this.config = FRUIT_TYPES.BOMB;
    } else {
      const nonBombs = types.filter(t => !t.isBomb);
      this.config = nonBombs[Math.floor(Math.random() * nonBombs.length)];
    }

    this.radius = this.config.radius;
    this.x = Math.random() * (canvasWidth - 100) + 50;
    this.y = -60;
    
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = Math.random() * 3 + 2; // Initial downward speed
    this.gravity = 0.25;
    
    this.rotation = 0;
    this.vRot = (Math.random() - 0.5) * 0.1;
    this.isSliced = false;
    this.slicedHalves = null;
  }

  update() {
    if (this.isSliced) {
      if (this.slicedHalves) {
        this.slicedHalves.left.x += this.slicedHalves.left.vx;
        this.slicedHalves.left.y += this.slicedHalves.left.vy;
        this.slicedHalves.left.vy += 0.4;
        
        this.slicedHalves.right.x += this.slicedHalves.right.vx;
        this.slicedHalves.right.y += this.slicedHalves.right.vy;
        this.slicedHalves.right.vy += 0.4;
      }
      return;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.vRot;
  }

  draw(ctx) {
    ctx.save();
    if (this.isSliced && this.slicedHalves) {
      // Draw split halves
      ctx.font = `${this.radius * 1.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.translate(this.slicedHalves.left.x, this.slicedHalves.left.y);
      ctx.rotate(this.rotation - 0.3);
      ctx.fillText(this.config.emoji, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.translate(this.slicedHalves.right.x, this.slicedHalves.right.y);
      ctx.rotate(this.rotation + 0.3);
      ctx.fillText(this.config.emoji, 0, 0);
      ctx.restore();
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = `${this.radius * 1.8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.config.emoji, 0, 0);
    }
    ctx.restore();
  }

  slice() {
    if (this.isSliced) return [];
    this.isSliced = true;

    this.slicedHalves = {
      left: { x: this.x - 10, y: this.y, vx: -4, vy: -3 },
      right: { x: this.x + 10, y: this.y, vx: 4, vy: -3 }
    };

    // Create juice particles
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push(new JuiceParticle(this.x, this.y, this.config.color));
    }
    return particles;
  }

  isOutOfBounds() {
    return this.y > this.canvasHeight + 100;
  }
}
