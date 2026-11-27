// Procedural Web Audio API synthesizer: autumn folk chase music and comic Thanksgiving SFX.

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
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
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
    const stepDuration = 0.165 - this.tension * 0.045;
    this.musicTimer += dt;
    if (this.musicTimer < stepDuration) return;
    this.musicTimer -= stepDuration;
    this._playFolkBeat(this.musicStep++);
  }

  _playFolkBeat(step) {
    const now = this.ctx.currentTime;
    // Playful bluegrass-inspired D minor / Dorian chase progression
    const banjoNotes = [293.66, 349.23, 440.0, 392.0, 349.23, 329.63, 293.66, 261.63,
                        293.66, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63, 220.0];
    const bassNotes = [146.83, 0, 110.0, 0, 130.81, 0, 110.0, 0,
                       146.83, 0, 174.61, 0, 164.81, 0, 110.0, 0];

    const idx = step % banjoNotes.length;
    const freq = banjoNotes[idx] * (this.tension > 0.7 ? 1.05946 : 1);

    // Plucky banjo-like triangle+sawtooth note
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Upright bass bounce on even steps
    const bass = bassNotes[idx];
    if (bass > 0) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(bass, now);
      bGain.gain.setValueAtTime(0.28, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      bOsc.connect(bGain);
      bGain.connect(this.musicGain);
      bOsc.start(now);
      bOsc.stop(now + 0.24);
    }

    // Light washboard percussion tick on offbeats
    if (step % 2 === 1) {
      this._noiseBurst(0.025, 2800, 0.08, this.musicGain);
    }
  }

  _noiseBurst(duration, highpassFreq, volume, dest = this.sfxGain) {
    if (!this.ctx || !dest || this.muted) return;
    const sampleCount = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpassFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start();
  }

  playJump() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.14);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playFlutter() {
    this._noiseBurst(0.06, 900, 0.14);
  }

  playDash() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    this._noiseBurst(0.14, 1400, 0.28);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.16);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playGobble() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(420, now);
    carrier.frequency.linearRampToValueAtTime(520, now + 0.08);
    carrier.frequency.linearRampToValueAtTime(340, now + 0.28);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(26, now);
    lfoGain.gain.setValueAtTime(85, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.value = 3.2;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    lfo.connect(lfoGain);
    lfoGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    carrier.start(now);
    lfo.start(now);
    carrier.stop(now + 0.32);
    lfo.stop(now + 0.32);
  }

  playPickup(combo = 1) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const base = 520 + Math.min(combo, 12) * 48;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.setValueAtTime(base * 1.25, now + 0.055);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playKnifeShing() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1950, now);
    osc.frequency.exponentialRampToValueAtTime(3400, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playOvenBlast() {
    if (!this.ctx || this.muted) return;
    this._noiseBurst(0.36, 260, 0.36);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.34);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.37);
  }

  playAlert() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.07);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playCloseShave() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [660, 880, 1174].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.22, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.15);
    });
  }

  playBonk() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
    this._noiseBurst(0.12, 600, 0.24);
  }

  playHide() {
    this._noiseBurst(0.11, 1500, 0.2);
  }

  playHit() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.28);
    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
    this.playGobble();
  }

  playStageClear() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [392, 493.88, 587.33, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.24, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.34);
    });
  }

  playVictory() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99, 659.25, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.095);
      gain.gain.setValueAtTime(0.26, now + i * 0.095);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.095 + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.095);
      osc.stop(now + i * 0.095 + 0.48);
    });
  }

  playCaught() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Comic dinner bell + descending trombone
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1180, now);
    bellGain.gain.setValueAtTime(0.28, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    bell.connect(bellGain);
    bellGain.connect(this.sfxGain);
    bell.start(now);
    bell.stop(now + 0.68);

    [330, 311, 293, 246].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + 0.12 + i * 0.14);
      gain.gain.setValueAtTime(0.16, now + 0.12 + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + i * 0.14 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + 0.12 + i * 0.14);
      osc.stop(now + 0.12 + i * 0.14 + 0.24);
    });
  }
}
