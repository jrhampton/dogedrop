/**
 * Procedural Web Audio SFX — no bundled audio files, no network.
 * Every cue is synthesized with oscillators + gain envelopes so the game
 * has real sound design without shipping (or licensing) any audio assets.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    this.ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.7;
  }

  _tone(freq, { type = 'sine', dur = 0.2, gain = 0.3, delay = 0, slideTo = null, filterFreq = null } = {}) {
    this.ensure();
    if (this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    let node = osc;
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  _noise({ dur = 0.15, gain = 0.25, delay = 0, filterFreq = 2000, type = 'lowpass' } = {}) {
    this.ensure();
    if (this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const bufSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  drop() {
    this._tone(520, { type: 'sine', dur: 0.09, gain: 0.12, slideTo: 340 });
  }

  land(tierIndex) {
    const freq = 90 + tierIndex * 6;
    this._tone(freq, { type: 'triangle', dur: 0.12, gain: 0.18, slideTo: freq * 0.6 });
    this._noise({ dur: 0.05, gain: 0.06, filterFreq: 500 });
  }

  /** Rising chime that pitches up with tier — the core "satisfying" cue. */
  merge(tierIndex) {
    const base = 261.6; // C4
    const ratios = [1, 1.125, 1.26, 1.335, 1.5, 1.68, 1.78, 2, 2.25, 2.52];
    const freq = base * ratios[Math.min(tierIndex, ratios.length - 1)];
    this._tone(freq, { type: 'sine', dur: 0.32, gain: 0.28, delay: 0 });
    this._tone(freq * 2, { type: 'sine', dur: 0.22, gain: 0.14, delay: 0.02 });
    this._tone(freq * 1.5, { type: 'triangle', dur: 0.28, gain: 0.12, delay: 0.04 });
    this._noise({ dur: 0.08, gain: 0.08, filterFreq: 4000, type: 'highpass', delay: 0 });
  }

  combo(step) {
    const freq = 660 * Math.pow(1.06, step);
    this._tone(freq, { type: 'square', dur: 0.1, gain: 0.1, filterFreq: 3000 });
  }

  gameOver() {
    [0, 0.12, 0.24].forEach((d, i) => {
      this._tone(220 - i * 40, { type: 'sawtooth', dur: 0.35, gain: 0.16, delay: d, filterFreq: 900 });
    });
  }

  newHighScore() {
    [523.3, 659.3, 784.0, 1046.5].forEach((f, i) => {
      this._tone(f, { type: 'sine', dur: 0.28, gain: 0.22, delay: i * 0.09 });
    });
  }

  uiClick() {
    this._tone(440, { type: 'square', dur: 0.05, gain: 0.06 });
  }
}

const audioEngine = new AudioEngine();
