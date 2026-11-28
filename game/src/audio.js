// Procedural Web Audio API synthesizer: autumn bluegrass chase music and comic Thanksgiving SFX.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.tension = 0;
    this.active = false;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.22;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.65;
      this.sfxGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.72, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  setMusicState(active, tension = 0) {
    this.active = active;
    this.tension = Math.max(0, Math.min(1, tension));
  }

  update(dt) {
    if (!this.active || !this.ctx || this.muted || this.ctx.state !== 'running') return;
    const stepDur = 0.165 - this.tension * 0.045;
    this.musicTimer += dt;
    if (this.musicTimer < stepDur) return;
    this.musicTimer -= stepDur;
    this._playFolkBeat(this.musicStep++);
  }

  _tone(type, f0, f1, dur, vol, delay = 0, dest = this.sfxGain) {
    if (!this.ctx || !dest || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _noiseBurst(dur, hpFreq, vol, dest = this.sfxGain) {
    if (!this.ctx || !dest || this.muted) return;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hpFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start();
  }

  _playFolkBeat(step) {
    const banjo = [293.7, 349.2, 440, 392, 349.2, 329.6, 293.7, 261.6, 293.7, 440, 523.3, 440, 392, 349.2, 329.6, 220];
    const bass = [146.8, 0, 110, 0, 130.8, 0, 110, 0, 146.8, 0, 174.6, 0, 164.8, 0, 110, 0];
    const idx = step % banjo.length;
    const f = banjo[idx] * (this.tension > 0.7 ? 1.0595 : 1);
    this._tone('triangle', f, f, 0.14, 0.22, 0, this.musicGain);
    if (bass[idx] > 0) this._tone('sine', bass[idx], bass[idx], 0.22, 0.28, 0, this.musicGain);
    if (step % 2 === 1) this._noiseBurst(0.025, 2800, 0.08, this.musicGain);
  }

  playJump() { this._tone('sine', 240, 560, 0.15, 0.24); }
  playFlutter() { this._noiseBurst(0.06, 900, 0.14); }
  playDash() { this._noiseBurst(0.14, 1400, 0.28); this._tone('sawtooth', 480, 170, 0.16, 0.16); }
  playHide() { this._noiseBurst(0.11, 1500, 0.2); }
  playPropKick() { this.playBonk(); }
  playFlourBurst() { this._noiseBurst(0.24, 520, 0.34); this.playBonk(); }
  playFarmerAlert() { this.playAlert(); }

  playGobble() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(420, now);
    carrier.frequency.linearRampToValueAtTime(520, now + 0.08);
    carrier.frequency.linearRampToValueAtTime(340, now + 0.28);
    lfo.frequency.setValueAtTime(26, now);
    lfoG.gain.setValueAtTime(85, now);
    f.type = 'bandpass';
    f.frequency.setValueAtTime(950, now);
    f.Q.value = 3.2;
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.32, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    lfo.connect(lfoG);
    lfoG.connect(carrier.frequency);
    carrier.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    carrier.start(now);
    lfo.start(now);
    carrier.stop(now + 0.32);
    lfo.stop(now + 0.32);
  }

  playPickup(combo = 1) {
    const base = 520 + Math.min(combo, 12) * 48;
    this._tone('triangle', base, base * 1.25, 0.15, 0.24);
  }

  playKnifeShing() {
    this._tone('sine', 1950, 3400, 0.07, 0.18);
    this._tone('sine', 3400, 1400, 0.16, 0.14, 0.07);
  }

  playOvenBlast() {
    this._noiseBurst(0.36, 260, 0.36);
    this._tone('sawtooth', 120, 52, 0.34, 0.22);
  }

  playAlert() {
    this._tone('square', 440, 440, 0.08, 0.16);
    this._tone('square', 660, 660, 0.12, 0.16, 0.07);
  }

  playCloseShave() {
    [660, 880, 1174].forEach((f, i) => this._tone('triangle', f, f, 0.14, 0.22, i * 0.045));
  }

  playBonk() {
    this._tone('sine', 320, 90, 0.16, 0.35);
    this._noiseBurst(0.12, 600, 0.24);
  }

  playHit() {
    this._tone('sawtooth', 220, 65, 0.28, 0.34);
    this.playGobble();
  }

  playStageClear() {
    [392, 493.9, 587.3, 784].forEach((f, i) => this._tone('triangle', f, f, 0.32, 0.24, i * 0.08));
  }

  playVictory() {
    [392, 523.3, 659.3, 784, 659.3, 1046.5].forEach((f, i) => this._tone('triangle', f, f, 0.45, 0.26, i * 0.095));
  }

  playCaught() {
    this._tone('sine', 1180, 1180, 0.65, 0.28);
    [330, 311, 293, 246].forEach((f, i) => this._tone('sawtooth', f, f, 0.22, 0.16, 0.12 + i * 0.14));
  }
}
