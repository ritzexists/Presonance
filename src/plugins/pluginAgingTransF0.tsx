/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Calendar, User, TrendingDown } from 'lucide-react';

const AgingTransF0Widget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [speakerAge, setSpeakerAge] = useState<number>(55);
  const [currentF0, setCurrentF0] = useState<number>(185);

  useEffect(() => {
    if (!data || data.f0 <= 0) return;
    setCurrentF0(Math.round(data.f0));
  }, [data]);

  // Nishio & Niimi (2008) longitudinal regression curves:
  // Women: Begins ~225 Hz at age 20 -> drops to ~165 Hz at age 85 (natural vocal cord edema / hormone shift)
  // Men: Begins ~120 Hz at age 20 -> rises slightly to ~145 Hz at age 85 (vocal fold atrophy)
  const getFemaleRegressionHz = (age: number) => 235 - (age - 20) * 1.05;
  const getMaleRegressionHz = (age: number) => 115 + (age - 20) * 0.45;

  const targetFemaleAtAge = Math.round(getFemaleRegressionHz(speakerAge));
  const targetMaleAtAge = Math.round(getMaleRegressionHz(speakerAge));

  // Canvas coordinates
  const width = 280;
  const height = 150;
  const minAge = 20;
  const maxAge = 90;
  const minHz = 80;
  const maxHz = 260;

  const toX = (age: number) => 35 + ((age - minAge) / (maxAge - minAge)) * (width - 45);
  const toY = (hz: number) => height - 20 - ((hz - minHz) / (maxHz - minHz)) * (height - 35);

  // Female regression line path
  const femaleLine = `M ${toX(20)} ${toY(getFemaleRegressionHz(20))} L ${toX(90)} ${toY(getFemaleRegressionHz(90))}`;
  // Male regression line path
  const maleLine = `M ${toX(20)} ${toY(getMaleRegressionHz(20))} L ${toX(90)} ${toY(getMaleRegressionHz(90))}`;

  // Speaker coordinates
  const speakerX = toX(speakerAge);
  const speakerY = toY(currentF0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginAgingTransF0Nishio}
          liveStatusBadge={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                <Calendar className="w-3 h-3" />
                <span>Age: {speakerAge} yrs</span>
              </span>
            </div>
          }
        />

        <div className="space-y-3 my-1">
          {/* User Age Slider */}
          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Age Parameter Target Adjustment:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="90"
                step="1"
                value={speakerAge}
                onChange={(e) => setSpeakerAge(parseInt(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-cyan-400 font-bold w-12 text-right">{speakerAge} yrs</span>
            </div>
          </div>

          {/* Scatter Plot with Regression Lines */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-center">
            <svg width={width} height={height} className="overflow-visible">
              {/* Horizontal Reference Lines */}
              {[100, 150, 200, 250].map((hz) => (
                <g key={hz}>
                  <line x1="35" y1={toY(hz)} x2={width - 10} y2={toY(hz)} stroke="#1e293b" strokeDasharray="2 3" />
                  <text x="30" y={toY(hz) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {hz}
                  </text>
                </g>
              ))}

              {/* Female Aging Regression Line */}
              <path d={femaleLine} fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 3" />
              <text x={toX(85)} y={toY(getFemaleRegressionHz(85)) - 6} fill="#f472b6" fontSize="9" fontWeight="bold">
                Cis Female Decay
              </text>

              {/* Male Aging Regression Line */}
              <path d={maleLine} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3" />
              <text x={toX(85)} y={toY(getMaleRegressionHz(85)) + 12} fill="#60a5fa" fontSize="9" fontWeight="bold">
                Cis Male Shift
              </text>

              {/* Speaker Data Point (Pulsating Dot) */}
              <circle cx={speakerX} cy={speakerY} r="7" fill="#22d3ee" fillOpacity="0.4" className="animate-ping" />
              <circle cx={speakerX} cy={speakerY} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />

              {/* Current Age Vertical Line */}
              <line x1={speakerX} y1="15" x2={speakerX} y2={height - 20} stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

              {/* X Axis Age Ticks */}
              {[20, 40, 60, 80].map((age) => (
                <text key={age} x={toX(age)} y={height - 6} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {age}y
                </text>
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-0.5">
                Age-Adjusted Norms ({speakerAge} y/o)
              </span>
              <div className="text-white font-semibold">
                Feminine Target: <span className="text-pink-400">{targetFemaleAtAge} Hz</span>
              </div>
              <div className="text-white font-semibold">
                Masculine Target: <span className="text-blue-400">{targetMaleAtAge} Hz</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">
                Geriatric Sociophonetics
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Older transgender women need not achieve rigid 220Hz youth baselines; physiological deepening naturally bounds older voices to ~165–185 Hz without compromising gender legibility.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Longitudinal Aging Regression (Nishio &amp; Niimi 2008)</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Nishio &amp; Niimi (2008)</span>
      </div>
    </div>
  );
};

export const pluginAgingTransF0Nishio: IVoicePlugin = {
  id: 'plugin_aging_trans_f0_nishio',
  name: 'Aging Transgender F0 Longitudinal Shift',
  description:
    'Tracks age-related changes in fundamental frequency. This plugin recalculates gendered target zones based on age, compensating for the natural physiological deepening of the voice in post-menopausal (cis) or older (trans) adults.',
  demographics: {
    genderScope: ['Transgender', 'Older Adults', 'Cisgender (Comparative)'],
    intersectingFactors: ['Aging Population (60+ years)'],
  },
  research: {
    id: 'nishio_2008_aging_sff',
    title: 'Changes in the Speaking Fundamental Frequency Characteristics with Aging',
    authors: ['M. Nishio', 'S. Niimi'],
    year: 2008,
    journal: 'Folia Phoniatrica et Logopaedica',
    doi: '10.1159/000118510',
    abstractSnippet:
      'Longitudinal acoustic analysis of fundamental frequency trends across seven decades of life, demonstrating characteristic pitch lowering in older women and pitch elevation in older men.',
  },
  acousticFeaturesAnalyzed: [
    'Geriatric F0 shift',
    'Pitch Instability',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 70, 360);
    return {
      f0: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: AgingTransF0Widget,
};
