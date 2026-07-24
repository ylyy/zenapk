let ctx = null;

function getAudioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function playGatherEnergy() {
  try {
    const c = getAudioContext();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.4);

    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playTransformationBlast() {
  try {
    const c = getAudioContext();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 1.2);

    gain.gain.setValueAtTime(0.6, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + 1.2);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playKamehamehaCharge() {
  try {
    const c = getAudioContext();
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, c.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + 0.8);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

export function playKamehamehaBeam() {
  try {
    const c = getAudioContext();
    const bufferSize = Math.floor(c.sampleRate * 1.2);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, c.currentTime);
    filter.frequency.linearRampToValueAtTime(200, c.currentTime + 1.2);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.7, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    noise.start();
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}
