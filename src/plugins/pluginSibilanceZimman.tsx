/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0, computeSpectralCentroid } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Activity, RefreshCw } from 'lucide-react';

interface SibilanceDataPoint {
  f0: number; // Hz (X-axis)
  cog: number; // Hz (Y-axis)
  isSibilant: boolean;
  time: number;
}

const SibilanceWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [points, setPoints] = useState<SibilanceDataPoint[]>([]);
  const [currentF0, setCurrentF0] = useState<number>(0);
  const [currentCog, setCurrentCog] = useState<number>(0);
  const [isSibilantActive, setIsSibilantActive] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!data) return;

    if (data.f0 > 0) {
      setCurrentF0(data.f0);
    }
    if (data.cog > 0) {
      setCurrentCog(data.cog);
    }
    setIsSibilantActive(data.isSibilant);

    if (data.f0 > 0 && data.cog > 0 && data.isSibilant) {
      setPoints((prev) => {
        const next = [...prev, { f0: data.f0, cog: data.cog, isSibilant: true, time: Date.now() }];
        return next.slice(-60); // Keep last 60 sibilant tokens
      });
    }
  }, [data]);

  // Render scatter plot on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Coordinate mapping
    // X: F0 range 80Hz - 240Hz
    // Y: COG range 3500Hz - 8500Hz
    const minF0 = 80;
    const maxF0 = 240;
    const minCog = 3500;
    const maxCog = 8500;

    const mapX = (f0: number) => {
      const clamped = Math.max(minF0, Math.min(maxF0, f0));
      return 45 + ((clamped - minF0) / (maxF0 - minF0)) * (width - 65);
    };

    const mapY = (cog: number) => {
      const clamped = Math.max(minCog, Math.min(maxCog, cog));
      return height - 30 - ((clamped - minCog) / (maxCog - minCog)) * (height - 50);
    };

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // F0 vertical grid lines
    const f0Ticks = [100, 140, 180, 220];
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';

    f0Ticks.forEach((tick) => {
      const x = mapX(tick);
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
      ctx.fillText(`${tick}`, x, height - 16);
    });

    // COG horizontal grid lines
    const cogTicks = [4000, 5500, 7000, 8000];
    ctx.textAlign = 'right';
    cogTicks.forEach((tick) => {
      const y = mapY(tick);
      ctx.beginPath();
      ctx.moveTo(45, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
      ctx.fillText(`${(tick / 1000).toFixed(1)}k`, 40, y + 3);
    });

    // Draw reference regions from Zimman (2017)
    // 1. Transmasculine Stylistic Bricolage Region (F0: 110-160Hz, COG: 5800-7400Hz)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.setLineDash([4, 4]);
    const bricoX = mapX(110);
    const bricoY = mapY(7400);
    const bricoW = mapX(160) - bricoX;
    const bricoH = mapY(5800) - bricoY;
    ctx.fillRect(bricoX, bricoY, bricoW, bricoH);
    ctx.strokeRect(bricoX, bricoY, bricoW, bricoH);

    // 2. Cisgender Female Comparative Baseline (F0: 170-220Hz, COG: 6200-7800Hz)
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    const cfX = mapX(170);
    const cfY = mapY(7800);
    const cfW = mapX(220) - cfX;
    const cfH = mapY(6200) - cfY;
    ctx.fillRect(cfX, cfY, cfW, cfH);
    ctx.strokeRect(cfX, cfY, cfW, cfH);
    ctx.setLineDash([]);

    // Region labels
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('Zimman Transmasc Bricolage', bricoX + 6, bricoY + 14);

    ctx.fillStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.fillText('Cis Comparative Space', cfX + 6, cfY + 14);

    // Draw historical scatter tokens
    points.forEach((pt, index) => {
      const alpha = 0.2 + (index / points.length) * 0.8;
      const x = mapX(pt.f0);
      const y = mapY(pt.cog);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
      ctx.fill();
    });

    // Draw current active position crosshair
    if (currentF0 > 0 && currentCog > 0) {
      const curX = mapX(currentF0);
      const curY = mapY(currentCog);

      ctx.beginPath();
      ctx.arc(curX, curY, isSibilantActive ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSibilantActive ? '#22d3ee' : '#94a3b8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = isSibilantActive ? 12 : 2;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crosshairs
      ctx.strokeStyle = isSibilantActive ? 'rgba(34, 211, 238, 0.6)' : 'rgba(148, 163, 184, 0.2)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(45, curY);
      ctx.lineTo(width - 20, curY);
      ctx.moveTo(curX, 15);
      ctx.lineTo(curX, height - 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Axis titles
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Fundamental Frequency F0 (Hz)', width / 2 + 10, height - 4);

    ctx.save();
    ctx.translate(14, height / 2 - 10);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('/s/ Centroid COG (Hz)', 0, 0);
    ctx.restore();
  }, [points, currentF0, currentCog, isSibilantActive]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginSibilanceF0Zimman}
          liveStatusBadge={
            isSibilantActive ? (
              <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                /s/ SIBILANT ACTIVE
              </span>
            ) : undefined
          }
        />

        {/* Telemetry Readouts */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Fundamental F0
            </div>
            <div className="text-lg font-mono font-semibold text-slate-100 flex items-baseline gap-1 mt-0.5">
              <span>{currentF0 > 0 ? currentF0.toFixed(1) : '--'}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              /s/ Center of Gravity
            </div>
            <div className="text-lg font-mono font-semibold text-cyan-400 flex items-baseline gap-1 mt-0.5">
              <span>{currentCog > 0 ? currentCog : '--'}</span>
              <span className="text-xs font-normal text-slate-400">Hz</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded p-2">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Tokens Plotted
            </div>
            <div className="text-lg font-mono font-semibold text-slate-200 mt-0.5">
              {points.length}
            </div>
          </div>
        </div>

        {/* 2D Dual-Axis Scatter Plot */}
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
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Isolates 4kHz–8kHz energy independent of vocal pitch</span>
        </div>
        <button
          onClick={() => setPoints([])}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800 text-[11px]"
          title="Clear plotted points"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export const pluginSibilanceF0Zimman: IVoicePlugin = {
  id: 'plugin_sibilance_f0_zimman',
  name: 'Sibilance & Pitch Stylistic Bricolage',
  description:
    'Analyzes the relationship between baseline Fundamental Frequency (F0) and the Spectral Center of Gravity of /s/ fricatives, demonstrating how transmasculine speakers construct a gendered voice through phonetic style rather than just physiological testosterone changes.',
  demographics: {
    genderScope: ['Transmasculine', 'Trans men'],
    intersectingFactors: [
      'Testosterone Therapy (HRT)',
      'Sociolinguistic style variations',
      'White/Western US English speakers',
    ],
  },
  research: {
    id: 'zimman_2017_bricolage',
    title:
      'Gender as stylistic bricolage: Transmasculine voices and the relationship between fundamental frequency and /s/',
    authors: ['Lal Zimman'],
    year: 2017,
    doi: '10.1017/S004740451700021X',
    journal: 'Language in Society',
    abstractSnippet:
      'Investigates how transgender men navigate gendered vocal practices during testosterone therapy. Demonstrates that while F0 lowers physiologically with androgen therapy, the acoustic properties of /s/ (spectral center of gravity) vary independently as a social, stylistic resource for identity construction.',
    url: 'https://doi.org/10.1017/S004740451700021X',
  },
  acousticFeaturesAnalyzed: ['F0', 'Spectral Center of Gravity (/s/)'],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 70, 450);
    const cogRes = computeSpectralCentroid(audioData, sampleRate, 4000, 8000);
    return {
      f0: f0Res.f0,
      confidence: f0Res.confidence,
      cog: cogRes.centroid,
      isSibilant: cogRes.isSibilant,
      energy: cogRes.energy,
    };
  },
  WidgetComponent: SibilanceWidget,
};
