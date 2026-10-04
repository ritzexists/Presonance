/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioInputSource, AudioSamplePreset } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private micStream: MediaStream | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;

  private isRunning = false;
  private currentSource: AudioInputSource = 'sample';
  private activePresetId = 'preset_zimman';
  private masterGainValue = 1.0;
  private uploadedAudioBuffer: AudioBuffer | null = null;

  private onFrameCallbacks: Set<(buffer: Float32Array, sampleRate: number, rms: number) => void> = new Set();
  private animFrameId: number | null = null;
  private timeOffset = 0;
  private playbackStartTime = 0;

  constructor() {
    // Lazy initialized on first user interaction to comply with Web Audio autoplay policies
  }

  public getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 44100 });
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.masterGainValue;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.6;
      this.gainNode.connect(this.analyser);
      // Analyser connects to destination if playing back file or sample; muted for mic to avoid feedback
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMasterGain(val: number) {
    this.masterGainValue = Math.max(0, Math.min(2, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.masterGainValue, this.ctx.currentTime);
    }
  }

  public getMasterGain(): number {
    return this.masterGainValue;
  }

  public subscribeFrame(cb: (buffer: Float32Array, sampleRate: number, rms: number) => void): () => void {
    this.onFrameCallbacks.add(cb);
    return () => {
      this.onFrameCallbacks.delete(cb);
    };
  }

  public async setInputSource(source: AudioInputSource) {
    if (this.isRunning) {
      this.stop();
    }
    this.currentSource = source;
  }

  public getInputSource(): AudioInputSource {
    return this.currentSource;
  }

  public getActivePresetId(): string {
    return this.activePresetId;
  }

  public setActivePresetId(id: string) {
    this.activePresetId = id;
    if (this.isRunning && this.currentSource === 'sample') {
      this.stop();
      this.start();
    }
  }

  public async loadUserFile(file: File): Promise<string> {
    const ctx = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    this.uploadedAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.currentSource = 'file';
    return file.name;
  }

  public async start(): Promise<boolean> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.cleanupCurrentSource();

    try {
      if (this.currentSource === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        this.micStream = stream;
        const micSource = ctx.createMediaStreamSource(stream);
        this.sourceNode = micSource;
        micSource.connect(this.gainNode!);
        // Do not connect mic to ctx.destination to prevent acoustic feedback loop
      } else if (this.currentSource === 'sample') {
        const preset = AUDIO_PRESETS.find((p) => p.id === this.activePresetId) || AUDIO_PRESETS[0];
        const buffer = preset.generateBuffer(ctx);
        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.loop = true;
        this.bufferSource = bufferSource;
        this.sourceNode = bufferSource;

        bufferSource.connect(this.gainNode!);
        this.gainNode!.connect(ctx.destination);
        bufferSource.start(0);
      } else if (this.currentSource === 'file') {
        if (!this.uploadedAudioBuffer) {
          throw new Error('No uploaded file buffer available');
        }
        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = this.uploadedAudioBuffer;
        bufferSource.loop = true;
        this.bufferSource = bufferSource;
        this.sourceNode = bufferSource;

        bufferSource.connect(this.gainNode!);
        this.gainNode!.connect(ctx.destination);
        bufferSource.start(0);
      }

      this.isRunning = true;
      this.playbackStartTime = ctx.currentTime;
      this.startProcessingLoop();
      return true;
    } catch (err) {
      console.error('Failed to start audio engine:', err);
      this.isRunning = false;
      return false;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.cleanupCurrentSource();
  }

  private cleanupCurrentSource() {
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch (e) {
        // ignore already stopped
      }
      this.bufferSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.sourceNode = null;
    }

    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.disconnect();
        this.gainNode.connect(this.analyser!);
      } catch (e) {
        // ignore
      }
    }
  }

  private startProcessingLoop() {
    const dataBuffer = new Float32Array(this.analyser ? this.analyser.fftSize : 2048);

    const tick = () => {
      if (!this.isRunning || !this.analyser || !this.ctx) return;

      this.analyser.getFloatTimeDomainData(dataBuffer);

      // Compute RMS volume
      let sumSq = 0;
      for (let i = 0; i < dataBuffer.length; i++) {
        sumSq += dataBuffer[i] * dataBuffer[i];
      }
      const rms = Math.sqrt(sumSq / dataBuffer.length);

      // Dispatch to all subscribers
      for (const cb of this.onFrameCallbacks) {
        cb(dataBuffer, this.ctx.sampleRate, rms);
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      source: this.currentSource,
      activePreset: this.activePresetId,
      sampleRate: this.ctx?.sampleRate || 44100,
      elapsed: this.isRunning && this.ctx ? Math.max(0, this.ctx.currentTime - this.playbackStartTime) : 0,
    };
  }
}

// Preset generator synthesizing authentic sociophonetic acoustic profiles
export const AUDIO_PRESETS: AudioSamplePreset[] = [
  {
    id: 'preset_zimman',
    name: 'Transmasculine Bricolage (Zimman 2017)',
    description: 'Alternating modal speech pitch (F0 ~140Hz) with stylistic high-energy sibilant fricatives (/s/ ~6.5kHz)',
    duration: 8,
    phenomenon: 'Sibilance COG & F0 decoupling',
    generateBuffer: (ctx: AudioContext) => {
      const sampleRate = ctx.sampleRate;
      const duration = 8;
      const numSamples = sampleRate * duration;
      const buffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const cycle = t % 2.0; // 2-second repeat cycle

        if (cycle < 1.3) {
          // Voiced vowel with modal pitch ~140Hz + harmonics
          const f0 = 138 + Math.sin(t * 3.5) * 6;
          let sample = 0.5 * Math.sin(2 * Math.PI * f0 * t);
          sample += 0.3 * Math.sin(2 * Math.PI * f0 * 2 * t);
          sample += 0.18 * Math.sin(2 * Math.PI * f0 * 3 * t);
          sample += 0.08 * Math.sin(2 * Math.PI * f0 * 4 * t);

          // Envelope
          const env = Math.min(1, Math.sin((cycle / 1.3) * Math.PI) * 1.5);
          data[i] = sample * env * 0.45;
        } else {
          // Sharp /s/ fricative: bandpassed high frequency noise centered at 6400Hz
          const whiteNoise = (Math.random() * 2 - 1) * 0.6;
          // Resonant high-pass / band emphasis around 6.2kHz
          const sibilanceMod = Math.sin(2 * Math.PI * 6200 * t);
          const env = Math.sin(((cycle - 1.3) / 0.7) * Math.PI);
          data[i] = whiteNoise * (0.6 + 0.4 * sibilanceMod) * env * 0.55;
        }
      }
      return buffer;
    },
  },
  {
    id: 'preset_creak',
    name: 'Non-Binary Phonation & Creak (Becker 2023)',
    description: 'Conversational rhythm with recurring aperiodic vocal fry pulse trains (<85Hz irregular glottal bursts)',
    duration: 8,
    phenomenon: 'Aperiodic Creaky Voice & Jitter',
    generateBuffer: (ctx: AudioContext) => {
      const sampleRate = ctx.sampleRate;
      const duration = 8;
      const numSamples = sampleRate * duration;
      const buffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const cycle = t % 2.4;

        if (cycle < 1.4) {
          // Standard modal speech F0 ~175Hz
          const f0 = 175 + Math.sin(t * 4) * 8;
          let sample = 0.45 * Math.sin(2 * Math.PI * f0 * t);
          sample += 0.25 * Math.sin(2 * Math.PI * f0 * 2 * t);
          sample += 0.12 * Math.sin(2 * Math.PI * f0 * 3 * t);
          const env = Math.sin((cycle / 1.4) * Math.PI);
          data[i] = sample * env * 0.4;
        } else {
          // Creaky Voice / Vocal Fry: Aperiodic low-frequency impulse train (60 - 85 Hz) with high jitter
          const jitterTime = t + (Math.sin(t * 120) * 0.003);
          const creakF0 = 68 + (Math.sin(t * 45) * 16);
          const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * creakF0 * jitterTime)), 8);
          // Glottal damping
          const noiseSub = (Math.random() * 2 - 1) * 0.08;
          const env = Math.sin(((cycle - 1.4) / 1.0) * Math.PI);
          data[i] = (pulse * 0.8 + noiseSub) * env * 0.5;
        }
      }
      return buffer;
    },
  },
  {
    id: 'preset_resonance',
    name: 'Transfeminine Resonant Sweep (Hancock 2020)',
    description: 'Vocal tract resonance tuning showing elevated F1 (600Hz) & F2 (1900-2400Hz) acoustic vowel space',
    duration: 8,
    phenomenon: 'F1/F2/F3 Formant Dispersion',
    generateBuffer: (ctx: AudioContext) => {
      const sampleRate = ctx.sampleRate;
      const duration = 8;
      const numSamples = sampleRate * duration;
      const buffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Pitch F0 ~ 210 Hz
        const f0 = 210 + Math.sin(t * 2) * 5;
        // Formant sweep representing vowels [i] -> [e] -> [a]
        const phase = (t % 3.0) / 3.0;
        const f1 = 350 + phase * 400; // 350 -> 750
        const f2 = 2200 - phase * 900; // 2200 -> 1300
        const f3 = 2800 + Math.sin(t * 3) * 150;

        // Glottal source filtered by resonant formants
        const source = Math.sin(2 * Math.PI * f0 * t) + 0.4 * Math.sin(4 * Math.PI * f0 * t);
        const form1 = Math.sin(2 * Math.PI * f1 * t) * 0.45;
        const form2 = Math.sin(2 * Math.PI * f2 * t) * 0.35;
        const form3 = Math.sin(2 * Math.PI * f3 * t) * 0.15;

        data[i] = (source * 0.3 + form1 + form2 + form3) * 0.35;
      }
      return buffer;
    },
  },
  {
    id: 'preset_breaks',
    name: 'T-Therapy Vocal Chaos & Breaks (Hodges 2021)',
    description: 'Pitch glide with abrupt pitch cracks, octave jumps, and vocal instability spikes during early transition',
    duration: 8,
    phenomenon: 'F0 Instability & Octave Jumps',
    generateBuffer: (ctx: AudioContext) => {
      const sampleRate = ctx.sampleRate;
      const duration = 8;
      const numSamples = sampleRate * duration;
      const buffer = ctx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const cycle = t % 4.0;
        let f0 = 150;

        // Introduce sudden pitch breaks / octave jump anomalies
        if (cycle < 1.4) {
          f0 = 145 - cycle * 12; // descending contour
        } else if (cycle < 1.7) {
          // Sharp voice break jump! (+10 semitones jump into falsetto)
          f0 = 275 + (cycle - 1.4) * 20;
        } else if (cycle < 2.8) {
          // Drop down abruptly
          f0 = 120 + Math.sin(t * 10) * 8;
        } else if (cycle < 3.0) {
          // Second sudden break / voice crack
          f0 = 230;
        } else {
          f0 = 115 + (cycle - 3.0) * 15;
        }

        let sample = 0.5 * Math.sin(2 * Math.PI * f0 * t);
        sample += 0.3 * Math.sin(2 * Math.PI * f0 * 2 * t);
        sample += 0.15 * Math.sin(2 * Math.PI * f0 * 3 * t);

        const env = Math.min(1, Math.sin((cycle / 4.0) * Math.PI) * 1.3);
        data[i] = sample * env * 0.45;
      }
      return buffer;
    },
  },
];

export const globalAudioEngine = new AudioEngine();
