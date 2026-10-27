/**
 * Procedural Web Audio API sound generator for Saka Prompt.
 * Zero external audio files or dependencies.
 * Respects browser autoplay policy and user mute preferences.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('prompt_sound_muted');
      this.isMuted = saved === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  /**
   * Lazily initializes AudioContext on first user interaction.
   */
  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('prompt_sound_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private playTone(
    freqs: number[],
    type: OscillatorType = 'sine',
    duration = 0.15,
    interval = 0.05,
    maxGain = 0.1
  ) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const startTime = now + idx * interval;
      const endTime = startTime + duration;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack & decay to prevent audio clicks
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
    });
  }

  /**
   * Quick crisp dual-blip on copy
   */
  public playCopy() {
    this.playTone([880, 1174.66], 'sine', 0.12, 0.04, 0.12);
  }

  /**
   * Ascending cheerful triad for new prompt created
   */
  public playCreate() {
    this.playTone([523.25, 659.25, 783.99], 'triangle', 0.14, 0.05, 0.11);
  }

  /**
   * Subtle pleasant confirmation for update
   */
  public playUpdate() {
    this.playTone([587.33, 880], 'sine', 0.13, 0.045, 0.1);
  }

  /**
   * Soft low descending note for delete
   */
  public playDelete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Subtle tick/whoosh when sync starts
   */
  public playSyncStart() {
    this.playTone([440, 554.37], 'sine', 0.1, 0.035, 0.08);
  }

  /**
   * Harmonic chime when sync succeeds
   */
  public playSyncSuccess() {
    this.playTone([587.33, 739.99, 880], 'sine', 0.14, 0.05, 0.1);
  }

  /**
   * Gentle muted error tone when sync fails
   */
  public playSyncFailure() {
    this.playTone([261.63, 233.08], 'sawtooth', 0.16, 0.07, 0.07);
  }
}

export const soundManager = new SoundManager();
