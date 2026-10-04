/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateFormants } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Radio, RefreshCw, Compass } from 'lucide-react';

interface FormantPoint {
  f1: number;
  f2: number;
  f3: number;
  vowel: string;
  time: number;
}

const ResonanceWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [f1, setF1] = useState<number>(500);
  const [f2, setF2] = useState<number>(1500);
  const [f3, setF3] = useState<number>(2500);
  const [dispersion, setDispersion] = useState<number>(1000);
  const [vowelEstimate, setVowelEstimate] = useState<string>('[ə]');
  const [history, setHistory] = useState<FormantPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!data) return;

    if (data.f1 > 200 && data.f2 > 500) {
      setF1(data.f1);
      setF2(data.f2);
      setF3(data.f3);
      setDispersion(data.dispersion);
      setVowelEstimate(data.vowelEstimate);

      setHistory((prev) => {
        const next = [
          ...prev,
          {
            f1: data.f1,
            f2: data.f2,
            f3: data.f3,
            vowel: data.vowelEstimate,
            time: Date.now(),
          },
        ];
        return next.slice(-40);
      });
    }
  }, [data]);

  // Standard sociophonetic Vowel Space plot (F2 on X reversed: 2500 -> 800 Hz; F1 on Y reversed: 200 -> 900 Hz)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Phonetic mapping:
    // Left side: high F2 (front vowels [i], [e]), Right side: low F2 (back vowels [u], [o])
    // Top side: low F1 (close/high vowels [i], [u]), Bottom side: high F1 (open/low vowels [a])
    const minF2 = 800;
    const maxF2 = 2500;
    const minF1 = 250;
    const maxF1 = 900;

    const mapX = (freq2: number) => {
      const clamped = Math.max(minF2, Math.min(maxF2, freq2));
      // Reversing X: 2500Hz -> left (padX), 800Hz -> right (width - padX)
      return width - 35 - ((clamped - minF2) / (maxF2 - minF2)) * (width - 75);
    };

    const mapY = (freq1: number) => {
      const clamped = Math.max(minF1, Math.min(maxF1, freq1));
      // Top is 250Hz, bottom is 900Hz
      return 25 + ((clamped - minF1) / (maxF1 - minF1)) * (height - 55);
    };

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // F2 ticks (front -> back)
    const f2Ticks = [2400, 2000, 1600, 1200, 900];
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    f2Ticks.forEach((tick) => {
      const x = mapX(tick);
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
      ctx.fillText(`${tick}`, x, height - 12);
    });

    // F1 ticks (high -> low)
    const f1Ticks = [300, 500, 700, 850];
    ctx.textAlign = 'right';
    f1Ticks.forEach((tick) => {
      const y = mapY(tick);
      ctx.beginPath();
      ctx.moveTo(38, y);
      ctx.lineTo(width - 25, y);
      ctx.stroke();
      ctx.fillText(`${tick}`, 34, y + 3);
    });

    // Draw Shaded Reference Target Zones from Hancock & Garabedian (2020)
    // 1. Transfeminine Resonance Target Space (High F2, elevated F1/F2 ratio)
    ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    ctx.setLineDash([4, 4]);

    const tfX1 = mapX(2350);
    const tfY1 = mapY(300);
    const tfX2 = mapX(1600);
    const tfY2 = mapY(650);

    ctx.beginPath();
    ctx.roundRect(tfX1, tfY1, tfX2 - tfX1, tfY2 - tfY1, 8);
    ctx.fill();
    ctx.stroke();

    // 2. Cisgender Masculine Acoustic Space (Lower F2, longer effective vocal tract)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    const cmX1 = mapX(1750);
    const cmY1 = mapY(450);
    const cmX2 = mapX(950);
    const cmY2 = mapY(820);

    ctx.beginPath();
    ctx.roundRect(cmX1, cmY1, cmX2 - cmX1, cmY2 - cmY1, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone labels
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('Transfeminine Target Zone (Hancock 2020)', tfX1 + 6, tfY1 + 14);

    ctx.fillStyle = 'rgba(96, 165, 250, 0.8)';
    ctx.fillText('Masculine Acoustic Baseline', cmX1 + 6, cmY1 + 14);

    // Cardinal Vowel Reference Labels
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('/i/', mapX(2250), mapY(320));
    ctx.fillText('/e/', mapX(1900), mapY(480));
    ctx.fillText('/a/', mapX(1350), mapY(820));
    ctx.fillText('/u/', mapX(950), mapY(340));

    // Draw historical points
    history.forEach((pt, i) => {
      const alpha = 0.15 + (i / history.length) * 0.7;
      const x = mapX(pt.f2);
      const y = mapY(pt.f1);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
      ctx.fill();
    });

    // Draw live formant centroid
    const curX = mapX(f2);
    const curY = mapY(f1);

    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Crosshair rings
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(curX, curY, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Axis titles
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('F2 Formant (Hz) ← Front [i] | Back [u] →', width / 2 + 10, height - 2);

    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('F1 Formant (Hz) ↓ Open [a]', 0, 0);
    ctx.restore();
  }, [f1, f2, f3, history]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginTransfemResonanceHancock}
          liveStatusBadge={
            <span className="text-[11px] font-mono text-pink-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
              {vowelEstimate}
            </span>
          }
        />

        {/* Telemetry Readouts */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              F1 (Pharynx)
            </div>
            <div className="text-lg font-mono font-semibold text-slate-100 flex items-baseline gap-1 mt-0.5">
              <span>{f1}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              F2 (Oral)
            </div>
            <div className="text-lg font-mono font-semibold text-pink-400 flex items-baseline gap-1 mt-0.5">
              <span>{f2}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              F3 (Singing/Sing)
            </div>
            <div className="text-lg font-mono font-semibold text-slate-200 flex items-baseline gap-1 mt-0.5">
              <span>{f3}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Dispersion
            </div>
            <div className="text-lg font-mono font-semibold text-cyan-400 flex items-baseline gap-1 mt-0.5">
              <span>{dispersion}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>
        </div>

        {/* 2D Vowel Space / Resonance Plot */}
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
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-pink-400" />
          <span>Vocal tract shortening manifests as elevated F1 &amp; F2</span>
        </div>
        <button
          onClick={() => setHistory([])}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800 text-[11px]"
          title="Reset points"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export const pluginTransfemResonanceHancock: IVoicePlugin = {
  id: 'plugin_transfem_resonance_hancock',
  name: 'Transfeminine Vocal Tract Resonance Modeler',
  description:
    'Tracks the dispersion of the first three formants (F1, F2, F3). It highlights how pitch-independent acoustic features (resonance/vocal tract length manipulation) are vital for the perception of voice femininity.',
  demographics: {
    genderScope: ['Transfeminine', 'Trans women'],
    intersectingFactors: ['Vocal Feminization Therapy', 'Adults (Mean age 36)'],
  },
  research: {
    id: 'hancock_2020_resonance',
    title: 'Acoustic Features of Transfeminine Voices and Perceptions of Voice Femininity',
    authors: ['Adrienne B. Hancock', 'L. Garabedian'],
    year: 2020,
    doi: '10.1044/2020_JSLHR-20-00091',
    journal: 'Journal of Speech, Language, and Hearing Research',
    abstractSnippet:
      'Examines acoustic correlates of perceived femininity in transfeminine speakers. Identifies that formant frequencies (particularly F1 and F2 dispersion representing shortened effective vocal tract length) explain significant variance in listener gender perception beyond fundamental frequency alone.',
    url: 'https://doi.org/10.1044/2020_JSLHR-20-00091',
  },
  acousticFeaturesAnalyzed: ['Vocal Tract Resonance', 'F1', 'F2', 'F3'],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    return estimateFormants(audioData, sampleRate);
  },
  WidgetComponent: ResonanceWidget,
};
