/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IVoicePlugin } from '../types';
import { PluginHeader } from './PluginHeader';
import { Wind, Activity, Layers } from 'lucide-react';

interface AerodynamicMetrics {
  mfdr: number; // Maximum Flow Declination Rate (L/s^2)
  openQuotient: number; // Open phase / cycle (0.4 - 0.8)
  acAirflow: number; // Alternating glottal airflow (mL/s)
  dcFlow: number; // Transglottal minimum flow
}

const AaveAerodynamicsWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [metrics, setMetrics] = useState<AerodynamicMetrics>({
    mfdr: 320,
    openQuotient: 0.58,
    acAirflow: 220,
    dcFlow: 110,
  });

  useEffect(() => {
    if (!data) return;
    if (data.openQuotient > 0) {
      setMetrics({
        mfdr: Math.round(data.mfdr),
        openQuotient: Math.round(data.openQuotient * 100) / 100,
        acAirflow: Math.round(data.acAirflow),
        dcFlow: Math.round(data.dcFlow),
      });
    }
  }, [data]);

  // Baseline normative data from Sapienza (1997)
  // African American Adult Voice Baseline vs Standard White Baseline
  const baselines = {
    blackAdult: { mfdr: 345, openQuotient: 0.61, acAirflow: 240 },
    whiteAdult: { mfdr: 280, openQuotient: 0.52, acAirflow: 195 },
  };

  // Radar/Polar Chart coordinates calculations
  // 3 Axes: [MFDR, Open Quotient, AC Glottal Airflow]
  const center = { x: 140, y: 110 };
  const radius = 80;

  // Normalized values (0 - 1)
  const normMfdr = (v: number) => Math.min(1, Math.max(0.1, (v - 150) / 300));
  const normOq = (v: number) => Math.min(1, Math.max(0.1, (v - 0.3) / 0.5));
  const normFlow = (v: number) => Math.min(1, Math.max(0.1, (v - 80) / 250));

  const getPoints = (mfdrVal: number, oqVal: number, flowVal: number) => {
    // 3 axes at -90deg, 30deg, 150deg
    const angle1 = -Math.PI / 2;
    const angle2 = Math.PI / 6;
    const angle3 = (5 * Math.PI) / 6;

    const r1 = radius * normMfdr(mfdrVal);
    const r2 = radius * normOq(oqVal);
    const r3 = radius * normFlow(flowVal);

    const p1 = `${center.x + r1 * Math.cos(angle1)},${center.y + r1 * Math.sin(angle1)}`;
    const p2 = `${center.x + r2 * Math.cos(angle2)},${center.y + r2 * Math.sin(angle2)}`;
    const p3 = `${center.x + r3 * Math.cos(angle3)},${center.y + r3 * Math.sin(angle3)}`;

    return `${p1} ${p2} ${p3}`;
  };

  const userPolygon = getPoints(metrics.mfdr, metrics.openQuotient, metrics.acAirflow);
  const blackPolygon = getPoints(baselines.blackAdult.mfdr, baselines.blackAdult.openQuotient, baselines.blackAdult.acAirflow);
  const whitePolygon = getPoints(baselines.whiteAdult.mfdr, baselines.whiteAdult.openQuotient, baselines.whiteAdult.acAirflow);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginAaveBaselineAerodynamicsSapienza}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Wind className="w-3 h-3" />
              <span>Oq: {metrics.openQuotient}</span>
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* SVG Radar / Polar Chart */}
          <div className="flex flex-col items-center justify-center">
            <svg width="280" height="220" viewBox="0 0 280 220" className="overflow-visible">
              {/* Concentric guide circles */}
              <circle cx={center.x} cy={center.y} r={radius * 0.33} fill="none" stroke="#1e293b" strokeDasharray="3 3" />
              <circle cx={center.x} cy={center.y} r={radius * 0.66} fill="none" stroke="#1e293b" strokeDasharray="3 3" />
              <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="#334155" strokeWidth="1.5" />

              {/* Axis Spoke Lines */}
              <line x1={center.x} y1={center.y} x2={center.x} y2={center.y - radius} stroke="#475569" strokeWidth="1" />
              <line x1={center.x} y1={center.y} x2={center.x + radius * Math.cos(Math.PI / 6)} y2={center.y + radius * Math.sin(Math.PI / 6)} stroke="#475569" strokeWidth="1" />
              <line x1={center.x} y1={center.y} x2={center.x + radius * Math.cos((5 * Math.PI) / 6)} y2={center.y + radius * Math.sin((5 * Math.PI) / 6)} stroke="#475569" strokeWidth="1" />

              {/* Axis Labels */}
              <text x={center.x} y={center.y - radius - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                MFDR (Flow Dec.)
              </text>
              <text x={center.x + radius * Math.cos(Math.PI / 6) + 6} y={center.y + radius * Math.sin(Math.PI / 6) + 12} fill="#94a3b8" fontSize="10" textAnchor="start" fontFamily="monospace">
                Open Quotient (Oq)
              </text>
              <text x={center.x + radius * Math.cos((5 * Math.PI) / 6) - 6} y={center.y + radius * Math.sin((5 * Math.PI) / 6) + 12} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="monospace">
                AC Airflow (mL/s)
              </text>

              {/* Baseline Polygons */}
              <polygon points={whitePolygon} fill="#64748b" fillOpacity="0.15" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
              <polygon points={blackPolygon} fill="#06b6d4" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="1.5" />

              {/* Live Speaker Polygon */}
              <polygon points={userPolygon} fill="#ec4899" fillOpacity="0.35" stroke="#f43f5e" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Aerodynamic Metrics Summary Cards */}
          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>MFDR (Max Declination Rate)</span>
                <span className="font-mono text-white font-semibold">{metrics.mfdr} L/s²</span>
              </div>
              <div className="text-[10px] text-slate-500">
                AAVE Baseline: ~345 L/s² · White Baseline: ~280 L/s²
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Open Quotient (Oq)</span>
                <span className="font-mono text-cyan-300 font-semibold">{metrics.openQuotient}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                AAVE Baseline: ~0.61 · White Baseline: ~0.52
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Glottal Airflow (AC)</span>
                <span className="font-mono text-pink-400 font-semibold">{metrics.acAirflow} mL/s</span>
              </div>
              <div className="text-[10px] text-slate-500">
                AAVE Baseline: ~240 mL/s · White Baseline: ~195 mL/s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span>Active Speaker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400" />
            <span>AAVE Normative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 border border-slate-400 border-dashed" />
            <span>White Normative</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Sapienza (1997)</span>
      </div>
    </div>
  );
};

export const pluginAaveBaselineAerodynamicsSapienza: IVoicePlugin = {
  id: 'plugin_aave_baseline_aerodynamics_sapienza',
  name: 'African American Adult Voice Aerodynamic Baseline',
  description:
    'Establishes a baseline for aerodynamic and acoustic characteristics in African American voices. Prevents default algorithmic centering of white, cisgender vocal tracts when evaluating transgender voices of color.',
  demographics: {
    genderScope: ['Cisgender Women', 'Cisgender Men', 'Transgender (Comparative)'],
    intersectingFactors: ['African American', 'Black', 'Adults'],
  },
  research: {
    id: 'sapienza_1997_aave_aerodynamics',
    title: 'Aerodynamic and acoustic characteristics of the adult African American voice',
    authors: ['C. M. Sapienza'],
    year: 1997,
    journal: 'Journal of Voice',
    doi: '10.1016/s0892-1997(97)80036-7',
    abstractSnippet:
      'Establishes normative aerodynamic and glottal airflow metrics (MFDR, AC airflow, open quotient) for adult African American speakers, providing an essential intersectional comparative baseline to prevent algorithmic bias.',
  },
  acousticFeaturesAnalyzed: [
    'Maximum Flow Declination Rate (MFDR)',
    'Alternating Glottal Airflow',
    'Open Quotient',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    // Inverse filtering approximation: estimate glottal flow derivative & open quotient
    let energy = 0;
    let peakDiff = 0;
    let positiveCycles = 0;
    const len = audioData.length;

    for (let i = 1; i < len; i++) {
      energy += audioData[i] * audioData[i];
      const diff = Math.abs(audioData[i] - audioData[i - 1]);
      if (diff > peakDiff) peakDiff = diff;
      if (audioData[i] > 0.05) positiveCycles++;
    }

    const rms = Math.sqrt(energy / len);
    if (rms < 0.01) {
      return { mfdr: 0, openQuotient: 0, acAirflow: 0, dcFlow: 0 };
    }

    // Estimate Open Quotient: duration of pulse opening over period
    const rawOq = 0.45 + (positiveCycles / len) * 0.35;
    const openQuotient = Math.min(0.85, Math.max(0.35, rawOq));
    const mfdr = Math.round(180 + peakDiff * 800);
    const acAirflow = Math.round(120 + rms * 600);
    const dcFlow = Math.round(80 + rms * 250);

    return { mfdr, openQuotient, acAirflow, dcFlow };
  },
  WidgetComponent: AaveAerodynamicsWidget,
};
