export const GESTURE_STAGES = {
  STAGE1_STEP1_CHEST_CROSS: 'STAGE1_STEP1_CHEST_CROSS',
  STAGE1_STEP2_HIPS_FISTS: 'STAGE1_STEP2_HIPS_FISTS',
  STAGE1_STEP3_POWER_RAISE: 'STAGE1_STEP3_POWER_RAISE',
  TRANSFORMED: 'TRANSFORMED',
  STAGE2_STEP1_KAME_CHARGE: 'STAGE2_STEP1_KAME_CHARGE',
  STAGE2_STEP2_KAME_BLAST: 'STAGE2_STEP2_KAME_BLAST',
  VICTORY: 'VICTORY'
};

export class GestureEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS;
    this.progress = 0; // 0 to 1 hold timer
    this.holdFrames = 0;
    this.requiredFrames = 8; // ~0.25s hold for fast interactive feel
  }

  update({ hands, pose }) {
    if (!hands || hands.length === 0) return this.getStatus();

    const hand1 = hands[0];
    const hand2 = hands[1] || null;

    switch (this.stage) {
      case GESTURE_STAGES.STAGE1_STEP1_CHEST_CROSS: {
        // Hands crossed near chest center (or 2 hands close together at chest height)
        if (hand1 && hand2) {
          const dist = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
          if (dist < 0.35 && hand1[0].y > 0.25 && hand1[0].y < 0.75) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS;
            });
          } else {
            this.decayHold();
          }
        } else if (hand1 && hand1[0].y > 0.3 && hand1[0].y < 0.7) {
          // Single hand chest fallback
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS;
          });
        }
        break;
      }
      case GESTURE_STAGES.STAGE1_STEP2_HIPS_FISTS: {
        // Hands down near hips/waist
        if (hand1 && hand1[0].y > 0.5) {
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE;
          });
        } else {
          this.decayHold();
        }
        break;
      }
      case GESTURE_STAGES.STAGE1_STEP3_POWER_RAISE: {
        // Hands raised above eye / head level
        if (hand1 && hand1[0].y < 0.35) {
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.TRANSFORMED;
          });
        } else {
          this.decayHold();
        }
        break;
      }
      case GESTURE_STAGES.TRANSFORMED: {
        // Transition to Kamehameha stage
        this.stage = GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE;
        this.holdFrames = 0;
        break;
      }
      case GESTURE_STAGES.STAGE2_STEP1_KAME_CHARGE: {
        // Two hands together at hip side
        if (hand1 && hand2) {
          const handDist = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
          if (handDist < 0.25) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST;
            });
          } else {
            this.decayHold();
          }
        } else if (hand1 && hand1[0].y > 0.4) {
          // Single hand charge fallback
          this.incrementHold(() => {
            this.stage = GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST;
          });
        }
        break;
      }
      case GESTURE_STAGES.STAGE2_STEP2_KAME_BLAST: {
        // Push palms forward towards camera or raise hands forward
        if (hand1) {
          const wrist = hand1[0];
          const index = hand1[8];
          const size = Math.hypot(wrist.x - index.x, wrist.y - index.y);
          if (size > 0.12) {
            this.incrementHold(() => {
              this.stage = GESTURE_STAGES.VICTORY;
            });
          }
        }
        break;
      }
    }

    return this.getStatus();
  }

  incrementHold(onComplete) {
    this.holdFrames++;
    this.progress = Math.min(1, this.holdFrames / this.requiredFrames);
    if (this.holdFrames >= this.requiredFrames) {
      this.holdFrames = 0;
      this.progress = 0;
      onComplete();
    }
  }

  decayHold() {
    if (this.holdFrames > 0) {
      this.holdFrames--;
      this.progress = Math.max(0, this.holdFrames / this.requiredFrames);
    }
  }

  getStatus() {
    return {
      stage: this.stage,
      progress: this.progress
    };
  }
}
