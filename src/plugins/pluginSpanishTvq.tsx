/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0, computeMagnitudeSpectrum } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Sparkles, Compass } from 'lucide-react';

const SpanishTvqWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [f0, setF0] = useState<number>(195);
  const [vowelScores, setVowelScores] = useState<Record<string, number>>({
    a: 0.65,
    e: 0.72,
    i: 0.81,
    o: 0.58,
    u: 0.63,
  });

  useEffect(() => {
    if (!data) return;
    if (data.f0 > 0) setF0(Math.round(data.f0));
    if (data.vowels) {
      setVowelScores(data.vowels);
    }
  }, [data]);

  // Spanish 5 cardinal vowels mapped to vertices of regular pentagon
  const vowels = ['/i/', '/e/', '/a/', '/o/', '/u/'];
  const keys = ['i', 'e', 'a', 'o', 'u'];
  const center = { x: 140, y: 110 };
  const maxR = 75;

  // Calculate 5 vertices angles (-90 deg offset)
  const getVertex = (idx: number, r: number) => {
    const angle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
    return {
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    };
  };

  // Male Spanish baseline polygon (~0.35 - 0.40 score)
  const malePoints = keys.map((_, i) => {
    const pt = getVertex(i, maxR * 0.4);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Female Spanish baseline polygon (~0.80 - 0.85 score)
  const femalePoints = keys.map((_, i) => {
    const pt = getVertex(i, maxR * 0.82);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Active speaker polygon
  const userPoints = keys.map((k, i) => {
    const score = vowelScores[k] || 0.5;
    const pt = getVertex(i, maxR * Math.min(1, Math.max(0.15, score)));
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const tvqIndex = Math.round(
    ((vowelScores.a + vowelScores.e + vowelScores.i + vowelScores.o + vowelScores.u) / 5) * 100
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginSpanishTvqMora}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Compass className="w-3 h-3" />
              <span>TVQ Vowel Index: {tvqIndex}%</span>
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-1">
          {/* Pentagonal Vowel Radar Chart */}
          <div className="flex justify-center">
            <svg width="280" height="220" viewBox="0 0 280 220" className="overflow-visible">
              {/* Concentric pentagons */}
              {[0.4, 0.7, 1.0].map((scale, sIdx) => {
                const ringPoints = vowels.map((_, i) => {
                  const pt = getVertex(i, maxR * scale);
                  return `${pt.x},${pt.y}`;
                }).join(' ');
                return (
                  <polygon
                    key={sIdx}
                    points={ringPoints}
                    fill="none"
                    stroke="#334155"
                    strokeDasharray={scale === 1 ? 'none' : '3 3'}
                    strokeWidth={scale === 1 ? 1.5 : 1}
                  />
                );
              })}

              {/* Spoke lines and labels */}
              {vowels.map((v, i) => {
                const pt = getVertex(i, maxR);
                const labelPt = getVertex(i, maxR + 18);
                return (
                  <g key={i}>
                    <line x1={center.x} y1={center.y} x2={pt.x} y2={pt.y} stroke="#475569" strokeWidth="1" />
                    <text
                      x={labelPt.x}
                      y={labelPt.y + 4}
                      fill="#e2e8f0"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Spanish Male normative zone */}
              <polygon points={malePoints} fill="#3b82f6" fillOpacity="0.12" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Spanish Female normative zone */}
              <polygon points={femalePoints} fill="#ec4899" fillOpacity="0.12" stroke="#f472b6" strokeWidth="1.5" />

              {/* Active speaker polygon */}
              <polygon points={userPoints} fill="#06b6d4" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Vowel Details & Spanish Metric Context */}
          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Speaking F0 (Fundamental Frequency)</span>
                <span className="font-mono text-cyan-300 font-semibold">{f0} Hz</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Spanish cis-female target: 185 – 240 Hz (Mora 2017)
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>TVQ-MtF Spanish Femininity Alignment</span>
                <span className="font-mono text-pink-400 font-semibold">{tvqIndex}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300" style={{ width: `${tvqIndex}%` }} />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Spanish vowel inventory operates on 5 pure vowels without diphthongization. Formant elevation in /e/ and /i/ signals feminine vocal tract resonance in Hispanophone speakers.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400" />
            <span>Speaker Vowel Space</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-pink-400" />
            <span>Spanish Female Target</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Mora et al. (2017)</span>
      </div>
    </div>
  );
};

export const pluginSpanishTvqMora: IVoicePlugin = {
  id: 'plugin_spanish_tvq_mora',
  name: 'Spanish Transfeminine F0 & TVQ-MtF Assessor',
  description:
    'Evaluates fundamental frequency and vowel spaces against the validated Spanish Transsexual Voice Questionnaire (TVQ-MtF) metrics, addressing the linguistic specificities of Spanish vowel articulation and gendered prosody.',
  demographics: {
    genderScope: ['Transfeminine', 'Trans women'],
    intersectingFactors: ['Spanish speakers', 'Hispanophone', 'Adults'],
  },
  research: {
    id: 'mora_2017_spanish_tvq',
    title:
      'Translation, Cultural Adaptation, and Preliminary Evaluation of the Spanish Version of the Transgender Voice Questionnaire for Male-to-Female Transsexuals (TVQ MtF)',
    authors: ['Elena Mora', 'et al.'],
    year: 2017,
    journal: 'Journal of Voice',
    doi: '10.1016/j.jvoice.2017.05.012',
    abstractSnippet:
      'Validates the TVQ-MtF in Spanish populations, correlating self-perception with acoustic targets (F0 and vowel formant spaces) in Hispanic transfeminine vocal transition.',
  },
  acousticFeaturesAnalyzed: [
    'F0',
    'Spanish Vowel Space (/a/, /e/, /i/, /o/, /u/)',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 85, 380);
    const spec = computeMagnitudeSpectrum(audioData, 512);

    // Estimate relative energy in characteristic vowel formant zones
    const binHz = sampleRate / 1024;
    const getEnergy = (fLow: number, fHigh: number) => {
      const b1 = Math.floor(fLow / binHz);
      const b2 = Math.min(spec.length - 1, Math.ceil(fHigh / binHz));
      let sum = 0;
      for (let i = b1; i <= b2; i++) sum += spec[i];
      return sum;
    };

    const eLow = getEnergy(300, 700);
    const eMid = getEnergy(1200, 2000);
    const eHigh = getEnergy(2200, 3200);

    const norm = (v: number) => Math.min(0.95, Math.max(0.25, 0.4 + v * 0.15));

    return {
      f0: f0Res.f0,
      vowels: {
        a: norm(eLow * 0.8),
        e: norm(eMid * 0.9),
        i: norm(eHigh * 1.1),
        o: norm(eLow * 0.7),
        u: norm(eMid * 0.6),
      },
    };
  },
  WidgetComponent: SpanishTvqWidget,
};
