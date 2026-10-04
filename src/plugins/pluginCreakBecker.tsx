/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { computeCreakAndJitter } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Activity, Flame, RotateCcw } from 'lucide-react';

interface TimelineFrame {
  volume: number; // 0 to 1
  isCreaky: boolean;
  jitter: number;
  timestamp: number;
}

const CreakWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [history, setHistory] = useState<TimelineFrame[]>([]);
  const [currentJitter, setCurrentJitter] = useState<number>(0);
  const [currentCreaky, setCurrentCreaky] = useState<boolean>(false);
  const [lowFreqRatio, setLowFreqRatio] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!data) return;

    setCurrentJitter(data.jitter);
    setCurrentCreaky(data.isCreaky);
    setLowFreqRatio(data.lowFreqRatio);

    setHistory((prev) => {
      const next = [
        ...prev,
        {
          volume: data.volume || 0,
          isCreaky: data.isCreaky,
          jitter: data.jitter,
          timestamp: Date.now(),
        },
      ];
      // Keep ~140 rolling time frames
      return next.slice(-140);
    });
  }, [data]);

  // Compute stats over history
  const creakyFramesCount = history.filter((h) => h.isCreaky).length;
  const creakPercentage =
    history.length > 0 ? Math.round((creakyFramesCount / history.length) * 100) : 0;

  // Render dynamic timeline / area chart with red vertical hash marks for creak
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) {
      ctx.fillStyle = '#475569';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting live acoustic stream or sample playback...', width / 2, height / 2);
      return;
    }

    const maxPoints = 140;
    const step = width / (maxPoints - 1);
    const baselineY = height - 20;

    // 1. Draw Creak vertical hash bands / markers
    history.forEach((pt, i) => {
      if (pt.isCreaky) {
        const x = i * step;
        // Red hash mark overlay
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(x - step * 0.5, 10, step + 1, baselineY - 10);

        // Top tick indicator
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 1, 8, 2, 8);
      }
    });

    // 2. Draw speech volume envelope area
    const gradient = ctx.createLinearGradient(0, 20, 0, baselineY);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.02)');

    ctx.beginPath();
    ctx.moveTo(0, baselineY);

    history.forEach((pt, i) => {
      const x = i * step;
      // Map volume to height (clamp 0..1)
      const clampedVol = Math.min(1, pt.volume * 2.5);
      const y = baselineY - clampedVol * (baselineY - 24);
      ctx.lineTo(x, y);
    });

    ctx.lineTo((history.length - 1) * step, baselineY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Draw speech volume line
    ctx.beginPath();
    history.forEach((pt, i) => {
      const x = i * step;
      const clampedVol = Math.min(1, pt.volume * 2.5);
      const y = baselineY - clampedVol * (baselineY - 24);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4. Baseline and time ticks
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('-5.0s', 4, height - 6);
    ctx.textAlign = 'right';
    ctx.fillText('LIVE NOW', width - 4, height - 6);
  }, [history]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginCreakVariationistBecker}
          liveStatusBadge={
            currentCreaky ? (
              <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                CREAK DETECTED
              </span>
            ) : undefined
          }
        />

        {/* Readout Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Creak Duty Cycle
            </div>
            <div className="text-lg font-mono font-semibold text-rose-400 flex items-baseline gap-1 mt-0.5">
              <span>{creakPercentage}</span>
              <span className="text-xs font-normal text-slate-400">%</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Perturbation (Jitter)
            </div>
            <div className="text-lg font-mono font-semibold text-slate-100 flex items-baseline gap-1 mt-0.5">
              <span>{currentJitter.toFixed(1)}</span>
              <span className="text-xs font-normal text-slate-400">%</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Low-Freq Ratio (&lt;100Hz)
            </div>
            <div className="text-lg font-mono font-semibold text-cyan-400 mt-0.5">
              {(lowFreqRatio * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Rolling Area Chart with Red Hash Overlays */}
        <div className="relative bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={480}
            height={260}
            className="w-full h-auto block"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="inline-block w-2.5 h-2.5 bg-rose-500/80 rounded-sm" />
          <span>Red markers: Aperiodic pulse trains &lt;100Hz</span>
        </div>
        <button
          onClick={() => setHistory([])}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800 text-[11px]"
          title="Reset history"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export const pluginCreakVariationistBecker: IVoicePlugin = {
  id: 'plugin_creak_variationist_becker',
  name: 'Non-Binary Aperiodic Phonation (Creaky Voice) Tracker',
  description:
    'Measures vocal fry (creaky voice). This plugin challenges theories of sociolinguistic variation that assume "creak" is exclusively a feature of young, cisgender, white women, tracking its usage as a stylistic marker across non-binary and trans speakers.',
  demographics: {
    genderScope: ['Non-binary', 'Transgender', 'Cisgender (Comparative)'],
    intersectingFactors: ['Variationist Linguistics', 'Regional dialects', 'Age 18-35'],
  },
  research: {
    id: 'becker_2023_creak',
    title: 'Beyond binary gender: creaky voice, gender, and the variationist enterprise',
    authors: ['Kara Becker', 'Sameer ud Dowla Khan', 'Lal Zimman'],
    year: 2023,
    doi: '10.1017/S095439452200022X',
    journal: 'Language Variation and Change',
    abstractSnippet:
      'Demonstrates that creaky voice is not merely an index of cisgender female speech or regional youth affect. Instead, non-binary and trans speakers systematically utilize aperiodicity and creak as part of an expansive phonetic repertoire indexical of gender non-conformity and affective stance.',
    url: 'https://doi.org/10.1017/S095439452200022X',
  },
  acousticFeaturesAnalyzed: [
    'Aperiodic Phonation',
    'Jitter (Pitch Perturbation)',
    'Vocal Fry',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    // Calculate volume
    let sumSq = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSq += audioData[i] * audioData[i];
    }
    const volume = Math.sqrt(sumSq / audioData.length);

    const creakRes = computeCreakAndJitter(audioData, sampleRate);
    return {
      volume,
      isCreaky: creakRes.isCreaky && volume > 0.02,
      jitter: creakRes.jitter,
      lowFreqRatio: creakRes.lowFreqRatio,
      zcr: creakRes.zcr,
    };
  },
  WidgetComponent: CreakWidget,
};
