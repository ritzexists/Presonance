/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { BookOpen, BarChart, Layers } from 'lucide-react';

interface BoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mode: number;
}

const AaveReadingF0Widget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [speakerStats, setSpeakerStats] = useState<BoxStats>({
    min: 95,
    q1: 125,
    median: 148,
    q3: 178,
    max: 230,
    mode: 142,
  });

  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!data || data.f0 <= 0) return;

    // Collect F0 samples strictly during continuous speech (>0.6 confidence)
    if (data.confidence > 0.6) {
      samplesRef.current.push(Math.round(data.f0));
      if (samplesRef.current.length > 80) samplesRef.current.shift();

      if (samplesRef.current.length >= 15) {
        const sorted = [...samplesRef.current].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];

        // Calculate Mode
        const counts: Record<number, number> = {};
        let bestCount = 0;
        let mode = median;
        sorted.forEach((n) => {
          counts[n] = (counts[n] || 0) + 1;
          if (counts[n] > bestCount) {
            bestCount = counts[n];
            mode = n;
          }
        });

        setSpeakerStats({ min, q1, median, q3, max, mode });
      }
    }
  }, [data]);

  // Hudson & Holbrook (1981) Historical Cohort Normative Data
  // Young Black Adults (18-29): Mode ~110-120 Hz (M) / ~190-205 Hz (F), wider dispersion (85 Hz spread)
  // White Adult Norms: Mode ~125 Hz (M) / ~215 Hz (F), narrower dispersion (55 Hz spread)
  const blackCohort: BoxStats = { min: 80, q1: 115, median: 140, q3: 185, max: 250, mode: 128 };
  const whiteCohort: BoxStats = { min: 95, q1: 130, median: 155, q3: 180, max: 225, mode: 148 };

  const minScaleHz = 60;
  const maxScaleHz = 280;
  const toY = (hz: number) => {
    const clamped = Math.max(minScaleHz, Math.min(maxScaleHz, hz));
    return 160 - ((clamped - minScaleHz) / (maxScaleHz - minScaleHz)) * 140;
  };

  const renderBox = (stats: BoxStats, xCenter: number, color: string, fillOpacity = '0.3', isUser = false) => {
    const yMin = toY(stats.min);
    const yMax = toY(stats.max);
    const yQ1 = toY(stats.q1);
    const yQ3 = toY(stats.q3);
    const yMed = toY(stats.median);
    const yMode = toY(stats.mode);
    const boxWidth = isUser ? 36 : 28;

    return (
      <g key={xCenter}>
        {/* Whiskers */}
        <line x1={xCenter} y1={yMax} x2={xCenter} y2={yQ3} stroke={color} strokeWidth="1.5" />
        <line x1={xCenter} y1={yQ1} x2={xCenter} y2={yMin} stroke={color} strokeWidth="1.5" />
        <line x1={xCenter - 8} y1={yMax} x2={xCenter + 8} y2={yMax} stroke={color} strokeWidth="1.5" />
        <line x1={xCenter - 8} y1={yMin} x2={xCenter + 8} y2={yMin} stroke={color} strokeWidth="1.5" />

        {/* Interquartile Box */}
        <rect
          x={xCenter - boxWidth / 2}
          y={yQ3}
          width={boxWidth}
          height={Math.max(4, yQ1 - yQ3)}
          fill={color}
          fillOpacity={fillOpacity}
          stroke={color}
          strokeWidth="1.5"
          rx="2"
        />

        {/* Median Line */}
        <line
          x1={xCenter - boxWidth / 2}
          y1={yMed}
          x2={xCenter + boxWidth / 2}
          y2={yMed}
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Mode Dot */}
        <circle cx={xCenter} cy={yMode} r={isUser ? 3.5 : 2.5} fill="#f59e0b" stroke="#000" strokeWidth="1" />
      </g>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginAaveReadingF0Hudson}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <BookOpen className="w-3 h-3" />
              <span>Modal F0: {speakerStats.mode} Hz</span>
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-1">
          {/* Box and Whisker Plot */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-center">
            <svg width="240" height="180" viewBox="0 0 240 180">
              {/* Horizontal Reference Grid */}
              {[80, 120, 160, 200, 240].map((hz) => (
                <g key={hz}>
                  <line x1="35" y1={toY(hz)} x2="230" y2={toY(hz)} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="30" y={toY(hz) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {hz}
                  </text>
                </g>
              ))}

              {/* Three Box Plots: Black Baseline, White Baseline, Active Speaker */}
              {renderBox(blackCohort, 75, '#06b6d4', '0.2')}
              {renderBox(whiteCohort, 135, '#94a3b8', '0.2')}
              {renderBox(speakerStats, 195, '#ec4899', '0.4', true)}

              {/* X-axis Labels */}
              <text x="75" y="174" fill="#22d3ee" fontSize="9" textAnchor="middle" fontWeight="bold">
                Black Cohort
              </text>
              <text x="135" y="174" fill="#94a3b8" fontSize="9" textAnchor="middle">
                White Norm
              </text>
              <text x="195" y="174" fill="#f472b6" fontSize="9" textAnchor="middle" fontWeight="bold">
                Speaker
              </text>
            </svg>
          </div>

          {/* Statistical Breakdown Cards */}
          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Reading Task F0 Dispersion (IQR)</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {speakerStats.q3 - speakerStats.q1} Hz (Range: {speakerStats.max - speakerStats.min} Hz)
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Hudson &amp; Holbrook (1981) demonstrated significantly wider dynamic pitch dispersion in Black speakers.
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Modal Frequency vs Median</span>
                <span className="font-mono text-amber-400 font-semibold">
                  Mode: {speakerStats.mode} Hz · Med: {speakerStats.median} Hz
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Yellow dot indicates mode (most frequent sustained pitch during passage reading).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <BarChart className="w-3.5 h-3.5" />
          <span>Non-Interrupted Reading Task Aggregation</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Hudson &amp; Holbrook (1981)</span>
      </div>
    </div>
  );
};

export const pluginAaveReadingF0Hudson: IVoicePlugin = {
  id: 'plugin_aave_reading_f0_hudson',
  name: 'African American Adult Reading F0 Profile',
  description:
    'Tracks modal fundamental frequency and ranges during reading tasks, establishing structural baseline differences (greater frequency ranges and lower mean modes) in Black speakers compared to white demographics.',
  demographics: {
    genderScope: ['African American Women', 'African American Men'],
    intersectingFactors: ['Black', 'Young Adults (18-29)'],
  },
  research: {
    id: 'hudson_1981_aave_reading_f0',
    title: 'A study of the reading fundamental vocal frequency of young black adults',
    authors: ['A. I. Hudson', 'A. Holbrook'],
    year: 1981,
    journal: 'Journal of Speech and Hearing Research',
    doi: '10.1044/jshr.2402.197',
    abstractSnippet:
      'Investigates modal speaking fundamental frequency in young Black adult speakers, revealing significantly expanded dynamic pitch ranges and lower modal frequencies compared to standardized white normative data.',
  },
  acousticFeaturesAnalyzed: [
    'Modal Reading F0',
    'F0 Range Dispersion',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 70, 350);
    return {
      f0: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: AaveReadingF0Widget,
};
