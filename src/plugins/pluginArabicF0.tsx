/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0, computeMagnitudeSpectrum } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Gauge, Radio, ShieldCheck } from 'lucide-react';

const ArabicF0Widget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [sff, setSff] = useState<number>(145);
  const [isFricativeGated, setIsFricativeGated] = useState<boolean>(false);

  useEffect(() => {
    if (!data) return;
    setIsFricativeGated(data.isPharyngealGated);
    if (data.sff > 0 && !data.isPharyngealGated) {
      setSff(Math.round(data.sff));
    }
  }, [data]);

  // Natour & Wingate (2009) normative values:
  // Jordanian Arab Men: Mean ~130 Hz (Range: 105 - 160 Hz)
  // Jordanian Arab Women: Mean ~212 Hz (Range: 180 - 245 Hz)
  // Contrast with Western norms: Jordanian targets display lower SFF bounds
  const minGaugeHz = 80;
  const maxGaugeHz = 300;
  const clampedHz = Math.max(minGaugeHz, Math.min(maxGaugeHz, sff));

  // Speedometer needle angle: -120 deg (at min) to +120 deg (at max)
  const angle = -120 + ((clampedHz - minGaugeHz) / (maxGaugeHz - minGaugeHz)) * 240;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginArabicF0Natour}
          liveStatusBadge={
            <div className="flex items-center gap-1.5">
              {isFricativeGated && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/50">
                  <span>Pharyngeal Gated</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                <Gauge className="w-3 h-3" />
                <span>SFF: {sff} Hz</span>
              </span>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-1">
          {/* Classic Speedometer Gauge Chart */}
          <div className="flex flex-col items-center justify-center">
            <svg width="240" height="150" viewBox="0 0 240 150" className="overflow-visible">
              {/* Outer Dial Arc */}
              <path
                d="M 30 130 A 90 90 0 1 1 210 130"
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Jordanian Male Target Arc (105 - 160 Hz) */}
              <path
                d="M 52 90 A 90 90 0 0 1 105 45"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="16"
                opacity="0.8"
              />

              {/* Jordanian Female Target Arc (180 - 245 Hz) */}
              <path
                d="M 135 45 A 90 90 0 0 1 195 95"
                fill="none"
                stroke="#ec4899"
                strokeWidth="16"
                opacity="0.8"
              />

              {/* Dial Center Hub */}
              <circle cx="120" cy="130" r="14" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <circle cx="120" cy="130" r="5" fill="#22d3ee" />

              {/* Moving Gauge Needle */}
              <g transform={`rotate(${angle}, 120, 130)`}>
                <polygon points="117,130 120,38 123,130" fill="#22d3ee" />
                <circle cx="120" cy="38" r="3" fill="#67e8f9" />
              </g>

              {/* Gauge Hz Markings */}
              <text x="35" y="145" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                80Hz
              </text>
              <text x="80" y="32" fill="#60a5fa" fontSize="9" textAnchor="middle" fontWeight="bold">
                Arab Men (105-160)
              </text>
              <text x="165" y="32" fill="#f472b6" fontSize="9" textAnchor="middle" fontWeight="bold">
                Arab Women (180-245)
              </text>
              <text x="205" y="145" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                300Hz
              </text>
            </svg>

            <div className="text-center font-mono text-xs text-white font-bold mt-1">
              Active: <span className="text-cyan-400">{sff} Hz</span>
            </div>
          </div>

          {/* Descriptive Information Cards */}
          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white block mb-0.5">
                Arab Sociophonetics vs. Western Norms
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Jordanian Arabic male and female speakers exhibit lower baseline fundamental frequencies than English counterparts, demanding culture-specific pitch milestones in gender affirmation.
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-0.5">
                Pharyngeal / Uvular Fricative Gating
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatic DSP noise suppression prevents pitch artifacts induced by Arabic guttural consonants (/ʕ/, /ħ/, /χ/).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Gated F0 for Semitic Phonology</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Natour &amp; Wingate (2009)</span>
      </div>
    </div>
  );
};

export const pluginArabicF0Natour: IVoicePlugin = {
  id: 'plugin_arabic_f0_natour',
  name: 'Jordanian Arabic F0 & Gender Baseline',
  description:
    'Provides a baseline analysis of speaking fundamental frequency for Jordanian Arabic speakers, contrasting Arab sociophonetics with Western-centric voice targets.',
  demographics: {
    genderScope: ['Arab Men', 'Arab Women', 'Transgender (Target)'],
    intersectingFactors: ['Jordanian Arabic speakers', 'Middle Eastern', 'Adults'],
  },
  research: {
    id: 'natour_2009_jordanian_arabic_f0',
    title: 'Fundamental Frequency Characteristics of Jordanian Arabic Speakers',
    authors: ['Y. S. Natour', 'J. M. Wingate'],
    year: 2009,
    journal: 'Journal of Voice',
    doi: '10.1016/j.jvoice.2008.01.005',
    abstractSnippet:
      'Analyzes fundamental frequency characteristics of male and female native speakers of Jordanian Arabic, providing non-Western normative sociophonetic baselines for clinical voice evaluation.',
  },
  acousticFeaturesAnalyzed: [
    'Speaking Fundamental Frequency (SFF)',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    // Custom gating: detect if low-mid pharyngeal friction energy dominates without periodicity
    const spec = computeMagnitudeSpectrum(audioData, 512);
    let lowMidEnergy = 0;
    for (let i = 8; i < 35; i++) lowMidEnergy += spec[i]; // ~700-3000 Hz

    const f0Res = estimateF0(audioData, sampleRate, 75, 340);
    const isPharyngealGated = f0Res.confidence < 0.55 && lowMidEnergy > 1.2;

    return {
      sff: isPharyngealGated ? 0 : f0Res.f0,
      isPharyngealGated,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: ArabicF0Widget,
};
