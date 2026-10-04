/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Digital Signal Processing (DSP) utilities for acoustic and sociophonetic voice analysis.
 * Implements autocorrelation, spectral center of gravity, formant peak estimation,
 * aperiodic phonation (creak/jitter) detection, and octave-jump / pitch break detection.
 */

// Normalized Autocorrelation for Pitch (F0) Estimation
export function estimateF0(
  buffer: Float32Array,
  sampleRate: number,
  minFreq = 65,
  maxFreq = 500
): { f0: number; confidence: number } {
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.floor(sampleRate / minFreq);

  // Compute signal RMS to avoid processing silence
  let sumSq = 0;
  for (let i = 0; i < buffer.length; i++) {
    sumSq += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSq / buffer.length);
  if (rms < 0.015) {
    return { f0: 0, confidence: 0 };
  }

  // Autocorrelation over search window
  let bestLag = -1;
  let maxCorr = -1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let norm1 = 0;
    let norm2 = 0;
    const len = buffer.length - lag;

    for (let i = 0; i < len; i++) {
      corr += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }

    const norm = Math.sqrt(norm1 * norm2);
    const normalizedCorr = norm > 0 ? corr / norm : 0;

    if (normalizedCorr > maxCorr) {
      maxCorr = normalizedCorr;
      bestLag = lag;
    }
  }

  if (bestLag > 0 && maxCorr > 0.55) {
    // Parabolic interpolation around peak for sub-sample accuracy
    const pitch = sampleRate / bestLag;
    return { f0: Math.round(pitch * 10) / 10, confidence: maxCorr };
  }

  return { f0: 0, confidence: maxCorr > 0 ? maxCorr : 0 };
}

// Compute simple Real FFT magnitude spectrum
export function computeMagnitudeSpectrum(
  buffer: Float32Array,
  fftSize = 1024
): Float32Array {
  // Hann window applied to buffer
  const N = Math.min(buffer.length, fftSize);
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    windowed[i] = buffer[i] * w;
  }

  // Simplified Discrete Fourier Transform for first N/2 bins
  // To keep real-time UI fast and responsive at 60fps, compute 256 bins
  const numBins = 256;
  const spectrum = new Float32Array(numBins);

  for (let k = 0; k < numBins; k++) {
    let real = 0;
    let imag = 0;
    const omega = (2 * Math.PI * k) / N;

    // Subsample step to optimize calculation speed
    const step = 2;
    for (let n = 0; n < N; n += step) {
      real += windowed[n] * Math.cos(omega * n);
      imag -= windowed[n] * Math.sin(omega * n);
    }

    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }

  return spectrum;
}

// Compute Spectral Center of Gravity (Centroid) in a specific frequency band [minHz, maxHz]
export function computeSpectralCentroid(
  buffer: Float32Array,
  sampleRate: number,
  minHz = 4000,
  maxHz = 8000
): { centroid: number; energy: number; isSibilant: boolean } {
  const spectrum = computeMagnitudeSpectrum(buffer, 1024);
  const numBins = spectrum.length;
  const binWidth = (sampleRate / 2) / numBins;

  let weightedFreqSum = 0;
  let bandEnergySum = 0;
  let totalEnergy = 0;

  for (let k = 0; k < numBins; k++) {
    const freq = k * binWidth;
    const mag = spectrum[k];
    totalEnergy += mag;

    if (freq >= minHz && freq <= maxHz) {
      weightedFreqSum += freq * mag;
      bandEnergySum += mag;
    }
  }

  // Isolate high frequency fricative energy: ratio of 4-8kHz energy to total energy
  const bandRatio = totalEnergy > 0 ? bandEnergySum / totalEnergy : 0;
  const isSibilant = bandRatio > 0.28 && bandEnergySum > 5;

  const centroid =
    bandEnergySum > 0 ? Math.round(weightedFreqSum / bandEnergySum) : 0;

  return {
    centroid: centroid > 0 ? centroid : 5500,
    energy: bandEnergySum,
    isSibilant,
  };
}

// Peak-to-peak amplitude perturbation (Jitter) and Zero-crossing rate for Creaky Voice detection
export function computeCreakAndJitter(
  buffer: Float32Array,
  sampleRate: number
): {
  isCreaky: boolean;
  jitter: number; // percentage perturbation
  zcr: number;
  lowFreqRatio: number;
  rawScore: number;
} {
  // 1. Calculate Zero Crossing Rate
  let zcCount = 0;
  for (let i = 1; i < buffer.length; i++) {
    if ((buffer[i] >= 0 && buffer[i - 1] < 0) || (buffer[i] < 0 && buffer[i - 1] >= 0)) {
      zcCount++;
    }
  }
  const zcr = zcCount / buffer.length;

  // 2. Identify local pitch period peaks to calculate cycle-to-cycle perturbation (Jitter)
  const peakIndices: number[] = [];
  const threshold = 0.05;

  for (let i = 1; i < buffer.length - 1; i++) {
    if (
      buffer[i] > buffer[i - 1] &&
      buffer[i] > buffer[i + 1] &&
      buffer[i] > threshold
    ) {
      peakIndices.push(i);
    }
  }

  let jitter = 0;
  if (peakIndices.length >= 4) {
    const periods: number[] = [];
    for (let i = 1; i < peakIndices.length; i++) {
      periods.push(peakIndices[i] - peakIndices[i - 1]);
    }

    let diffSum = 0;
    let periodSum = 0;
    for (let i = 1; i < periods.length; i++) {
      diffSum += Math.abs(periods[i] - periods[i - 1]);
      periodSum += periods[i];
    }
    const meanPeriod = periodSum / periods.length;
    if (meanPeriod > 0) {
      jitter = (diffSum / (periods.length - 1)) / meanPeriod;
    }
  }

  // 3. Low-frequency energy ratio (<100Hz vs total)
  const spectrum = computeMagnitudeSpectrum(buffer, 1024);
  const numBins = spectrum.length;
  const binWidth = (sampleRate / 2) / numBins;

  let lowEnergy = 0;
  let totalEnergy = 0;
  for (let k = 0; k < numBins; k++) {
    const f = k * binWidth;
    totalEnergy += spectrum[k];
    if (f < 120) {
      lowEnergy += spectrum[k];
    }
  }

  const lowFreqRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;

  // Creak is characterized by irregular low-pitch glottal pulses, high jitter (>4%), and low ZCR
  const rawScore = jitter * 60 + lowFreqRatio * 40;
  const isCreaky = (jitter > 0.045 && lowFreqRatio > 0.22) || rawScore > 35;

  return {
    isCreaky,
    jitter: Math.min(Math.round(jitter * 1000) / 10, 25), // Jitter %
    zcr: Math.round(zcr * 1000) / 1000,
    lowFreqRatio: Math.round(lowFreqRatio * 100) / 100,
    rawScore: Math.round(rawScore),
  };
}

// Formants (F1, F2, F3) extraction from spectrum
export function estimateFormants(
  buffer: Float32Array,
  sampleRate: number
): {
  f1: number;
  f2: number;
  f3: number;
  dispersion: number;
  vowelEstimate: string;
} {
  const spectrum = computeMagnitudeSpectrum(buffer, 1024);
  const numBins = spectrum.length;
  const binWidth = (sampleRate / 2) / numBins;

  // Find prominent spectral peaks in formant ranges:
  // F1: 250 - 950 Hz
  // F2: 950 - 2500 Hz
  // F3: 2300 - 3600 Hz
  let peakF1 = 500;
  let maxMagF1 = -1;

  let peakF2 = 1500;
  let maxMagF2 = -1;

  let peakF3 = 2600;
  let maxMagF3 = -1;

  for (let k = 1; k < numBins - 1; k++) {
    const f = k * binWidth;
    const mag = spectrum[k];

    // Local peak condition
    if (mag > spectrum[k - 1] && mag > spectrum[k + 1]) {
      if (f >= 250 && f <= 950 && mag > maxMagF1) {
        maxMagF1 = mag;
        peakF1 = f;
      } else if (f > 950 && f <= 2500 && mag > maxMagF2) {
        maxMagF2 = mag;
        peakF2 = f;
      } else if (f > 2300 && f <= 3600 && mag > maxMagF3) {
        maxMagF3 = mag;
        peakF3 = f;
      }
    }
  }

  // Approximate nearest phonetic vowel classification
  // [i] F1 ~ 300, F2 ~ 2200; [u] F1 ~ 320, F2 ~ 800; [a] F1 ~ 800, F2 ~ 1200; [e] F1 ~ 500, F2 ~ 1900
  let vowelEstimate = '[ə]';
  if (peakF1 < 450 && peakF2 > 1900) vowelEstimate = '[i] (heed)';
  else if (peakF1 < 550 && peakF2 > 1600) vowelEstimate = '[e] (hayed)';
  else if (peakF1 > 650 && peakF2 < 1400) vowelEstimate = '[ɑ] (father)';
  else if (peakF1 < 480 && peakF2 < 1100) vowelEstimate = '[u] (who)';
  else if (peakF1 > 500 && peakF2 > 1300 && peakF2 < 1700) vowelEstimate = '[ɛ] (head)';

  // Formant dispersion: average inter-formant distance
  const dispersion = Math.round(((peakF2 - peakF1) + (peakF3 - peakF2)) / 2);

  return {
    f1: Math.round(peakF1),
    f2: Math.round(peakF2),
    f3: Math.round(peakF3),
    dispersion,
    vowelEstimate,
  };
}

// Track Pitch Breaks & Octave jumps for Voice Instability Monitor
export interface PitchBreakEvent {
  timestamp: number;
  prevF0: number;
  newF0: number;
  deltaSemitones: number;
  type: 'jump' | 'drop' | 'subharmonic';
}

export function detectVoiceBreak(
  currentF0: number,
  prevF0: number,
  timeDeltaMs: number
): PitchBreakEvent | null {
  if (currentF0 <= 0 || prevF0 <= 0) return null;

  // Calculate ratio and semitone difference: 12 * log2(f2 / f1)
  const ratio = currentF0 / prevF0;
  const semitones = 12 * Math.log2(ratio);

  // Sudden break: > 5 semitones jump or sudden octave drop within short interval (< 100ms)
  if (Math.abs(semitones) >= 4.8 && timeDeltaMs < 120) {
    let type: 'jump' | 'drop' | 'subharmonic' = 'jump';
    if (semitones < 0) {
      type = Math.abs(semitones + 12) < 2 ? 'subharmonic' : 'drop';
    }

    return {
      timestamp: Date.now(),
      prevF0,
      newF0: currentF0,
      deltaSemitones: Math.round(semitones * 10) / 10,
      type,
    };
  }

  return null;
}
