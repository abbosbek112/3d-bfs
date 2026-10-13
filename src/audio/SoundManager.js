/**
 * Procedural Web Audio API Sound Generator for NEON PATHFINDER
 * Zero external audio assets required. Safe fallback if audio context unavailable.
 */
export class SoundManager {
  #ctx = null;
  #masterGain = null;
  #isMuted = false;
  #volume = 0.5;

  constructor() {
    this.#loadSettings();
  }

  #loadSettings() {
    try {
      const savedMute = localStorage.getItem('neon_muted');
      if (savedMute !== null) {
        this.#isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('neon_volume');
      if (savedVol !== null) {
        this.#volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
      }
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }
  }

  #saveSettings() {
    try {
      localStorage.setItem('neon_muted', String(this.#isMuted));
      localStorage.setItem('neon_volume', String(this.#volume));
    } catch {
      // Ignore
    }
  }

  #initContext() {
    if (this.#ctx) {
      if (this.#ctx.state === 'suspended') {
        this.#ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      this.#ctx = new AudioCtx();
      this.#masterGain = this.#ctx.createGain();
      this.#masterGain.gain.setValueAtTime(this.#isMuted ? 0 : this.#volume, this.#ctx.currentTime);
      this.#masterGain.connect(this.#ctx.destination);
      return true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
      return false;
    }
  }

  unlock() {
    this.#initContext();
  }

  setVolume(val) {
    this.#volume = Math.max(0, Math.min(1, val));
    if (this.#masterGain && this.#ctx) {
      this.#masterGain.gain.setValueAtTime(this.#isMuted ? 0 : this.#volume, this.#ctx.currentTime);
    }
    this.#saveSettings();
  }

  getVolume() {
    return this.#volume;
  }

  toggleMute() {
    this.#isMuted = !this.#isMuted;
    if (this.#masterGain && this.#ctx) {
      this.#masterGain.gain.setValueAtTime(this.#isMuted ? 0 : this.#volume, this.#ctx.currentTime);
    }
    this.#saveSettings();
    return this.#isMuted;
  }

  isMuted() {
    return this.#isMuted;
  }

  /**
   * Short futuristic click for buttons
   */
  playClick() {
    if (this.#isMuted || !this.#initContext()) return;
    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Robot movement servo sound
   */
  playStep() {
    if (this.#isMuted || !this.#initContext()) return;
    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Sonar ping when BFS visits a new cell.
   * Frequency increases slightly with step for spatial progression feedback.
   */
  playCellScan(step = 1) {
    if (this.#isMuted || !this.#initContext()) return;
    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    const baseFreq = 380 + (step % 20) * 25;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Target found futuristic chime
   */
  playTargetFound() {
    if (this.#isMuted || !this.#initContext()) return;
    const notes = [440, 554, 659, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const startTime = this.#ctx.currentTime + idx * 0.07;
      const osc = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.#masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  /**
   * Path reconstruction sound - resonant sweep
   */
  playPathPulse() {
    if (this.#isMuted || !this.#initContext()) return;
    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Victory fanfare on completing level / reaching goal
   */
  playVictory() {
    if (this.#isMuted || !this.#initContext()) return;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major high
    chord.forEach((freq) => {
      const now = this.#ctx.currentTime;
      const osc = this.#ctx.createOscillator();
      const gain = this.#ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.#masterGain);

      osc.start(now);
      osc.stop(now + 1.0);
    });
  }

  /**
   * Collision / invalid action buzz
   */
  playError() {
    if (this.#isMuted || !this.#initContext()) return;
    const now = this.#ctx.currentTime;
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.#masterGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }
}
