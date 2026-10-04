/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0, detectVoiceBreak, PitchBreakEvent } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Zap, AlertTriangle, RotateCcw } from 'lucide-react';

interface PitchPoint {
  f0: number;
  time: number;
  isBreak: boolean;
  breakType?: string;
  deltaSemitones?: number;
}

const InstabilityWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [pitchHistory, setPitchHistory] = useState<PitchPoint[]>([]);
  const [voiceBreakCount, setVoiceBreakCount] = useState<number>(0);
  const [currentF0, setCurrentF0] = useState<number>(0);
  const [lastBreakEvent, setLastBreakEvent] = useState<PitchBreakEvent | null>(null);
  const [rippleActive, setRippleActive] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevF0Ref = useRef<number>(0);
  const prevTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!data) return;

    const now = Date.now();
    const timeDelta = now - prevTimeRef.current;
    const f0 = data.f0;

    if (f0 > 0) {
      setCurrentF0(f0);

      // Break detection
      const breakEvent = detectVoiceBreak(f0, prevF0Ref.current, timeDelta);
      let isBreak = false;
      let breakType: string | undefined = undefined;
      let deltaSemitones: number | undefined = undefined;

      if (breakEvent) {
        isBreak = true;
        breakType = breakEvent.type;
        deltaSemitones = breakEvent.deltaSemitones;
        setVoiceBreakCount((c) => c + 1);
        setLastBreakEvent(breakEvent);
        setRippleActive(true);
        setTimeout(() => setRippleActive(false), 900);
      }

      setPitchHistory((prev) => {
        const next = [
          ...prev,
          {
            f0,
            time: now,
            isBreak,
            breakType,
            deltaSemitones,
          },
        ];
        return next.slice(-140);
      });

      prevF0Ref.current = f0;
      prevTimeRef.current = now;
    }
  }, [data]);

  // Statistics
  const validF0s = pitchHistory.filter((p) => p.f0 > 50).map((p) => p.f0);
  const minF0 = validF0s.length ? Math.round(Math.min(...validF0s)) : 0;
  const maxF0 = validF0s.length ? Math.round(Math.max(...validF0s)) : 0;
  const meanF0 = validF0s.length
    ? Math.round(validF0s.reduce((a, b) => a + b, 0) / validF0s.length)
    : 0;

  // Render continuous F0 contour with voice break markers & ripple effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (pitchHistory.length < 2) {
      ctx.fillStyle = '#475569';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting continuous vocal contour...', width / 2, height / 2);
      return;
    }

    const maxPoints = 140;
    const step = width / (maxPoints - 1);
    const minScaleHz = 60;
    const maxScaleHz = 340;

    const mapY = (f: number) => {
      const clamped = Math.max(minScaleHz, Math.min(maxScaleHz, f));
      return height - 25 - ((clamped - minScaleHz) / (maxScaleHz - minScaleHz)) * (height - 45);
    };

    // Draw horizontal grid lines
    const ticks = [80, 120, 160, 220, 300];
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';

    ticks.forEach((tick) => {
      const y = mapY(tick);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.fillText(`${tick}Hz`, 30, y + 3);
    });

    // Reference Modal Zones
    // Typical post-T modal range: 100 - 145 Hz
    const postTY1 = mapY(145);
    const postTY2 = mapY(100);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fillRect(35, postTY1, width - 35, postTY2 - postTY1);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Stabilized Modal Target (100–145 Hz)', 42, postTY2 - 6);

    // Draw F0 Contour Line
    ctx.beginPath();
    pitchHistory.forEach((pt, i) => {
      const x = i * step + 35;
      const y = mapY(pt.f0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Draw Break Markers and Ripples
    pitchHistory.forEach((pt, i) => {
      if (pt.isBreak) {
        const x = i * step + 35;
        const y = mapY(pt.f0);

        // Visual break flash marker
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        // Radiating ripple ring
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Break delta tag
        if (pt.deltaSemitones) {
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f87171';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${pt.deltaSemitones > 0 ? '+' : ''}${pt.deltaSemitones}st`,
            x,
            y - 14
          );
        }
      }
    });

    // Active cursor point
    const lastPt = pitchHistory[pitchHistory.length - 1];
    if (lastPt) {
      const curX = (pitchHistory.length - 1) * step + 35;
      const curY = mapY(lastPt.f0);
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [pitchHistory]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginTransmascInstabilityHodges}
          liveStatusBadge={
            rippleActive ? (
              <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                PITCH BREAK DETECTED
              </span>
            ) : undefined
          }
        />

        {/* Instability Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className={`border rounded p-2 transition-all duration-300 ${
            rippleActive ? 'bg-rose-950/40 border-rose-500/60 ring-2 ring-rose-500/30' : 'bg-slate-950/70 border-slate-800/80'
          }`}>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Voice Breaks</span>
            </div>
            <div className="text-lg font-mono font-semibold text-rose-400 mt-0.5">
              {voiceBreakCount}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Live F0
            </div>
            <div className="text-lg font-mono font-semibold text-amber-400 flex items-baseline gap-1 mt-0.5">
              <span>{currentF0 > 0 ? currentF0.toFixed(0) : '--'}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Mean Pitch
            </div>
            <div className="text-lg font-mono font-semibold text-slate-100 flex items-baseline gap-1 mt-0.5">
              <span>{meanF0 > 0 ? meanF0 : '--'}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Vocal Range
            </div>
            <div className="text-sm font-mono font-semibold text-slate-300 mt-1 truncate">
              {minF0 > 0 ? `${minF0}–${maxF0} Hz` : '--'}
            </div>
          </div>
        </div>

        {/* Continuous F0 Line Graph */}
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
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
          <span>Red markers: sudden pitch breaks (&gt;4.8 semitones / 50ms)</span>
        </div>
        <button
          onClick={() => {
            setPitchHistory([]);
            setVoiceBreakCount(0);
          }}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800 text-[11px]"
          title="Reset breaks and history"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export const pluginTransmascInstabilityHodges: IVoicePlugin = {
  id: 'plugin_transmasc_instability_hodges',
  name: 'T-Therapy Voice Chaos & Instability Monitor',
  description:
    'Maps the abrupt pitch changes, voice breaks, and F0 contour drops that occur during the volatile first year of testosterone therapy. It visualizes the non-linear "chaos phase" of vocal transition.',
  demographics: {
    genderScope: ['Transmasculine', 'Trans men'],
    intersectingFactors: [
      'Early Medical Transition (Months 0-12 on T)',
      'College-aged/Young Adult',
    ],
  },
  research: {
    id: 'hodges_2021_instability',
    title:
      'Testosterone therapy masculinizes speech and gender presentation in transgender men',
    authors: ['Carolyn R. Hodges-Simeon', 'Graham Grail', 'et al.'],
    year: 2021,
    doi: '10.1038/s41598-021-82134-2',
    journal: 'Scientific Reports',
    abstractSnippet:
      'Longitudinal investigation of vocal tract tissue remodelling under exogenous testosterone. Documents non-linear acoustic instability, marked by pitch breaks, abrupt fundamental frequency drops, and temporary vocal range constriction before stabilizing in masculine modal registers.',
    url: 'https://doi.org/10.1038/s41598-021-82134-2',
  },
  acousticFeaturesAnalyzed: [
    'F0 Contour',
    'Pitch Jumps / Voice Breaks',
    'Vocal Range Restriction',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 60, 450);
    return {
      f0: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: InstabilityWidget,
};
