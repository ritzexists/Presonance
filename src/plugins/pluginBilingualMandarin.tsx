/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Languages, GitCommit, Split } from 'lucide-react';

const BilingualMandarinWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [activeLanguage, setActiveLanguage] = useState<'english' | 'mandarin'>('english');
  const [englishContour, setEnglishContour] = useState<number[]>([180, 185, 182, 178, 175, 179, 182, 180]);
  const [mandarinContour, setMandarinContour] = useState<number[]>([160, 210, 170, 150, 220, 165, 230, 190]);
  const [toneType, setToneType] = useState<string>('Tone 1 / Tone 4 Shift');

  useEffect(() => {
    if (!data || data.f0 <= 0) return;

    if (activeLanguage === 'english') {
      setEnglishContour((prev) => [...prev.slice(-15), Math.round(data.f0)]);
    } else {
      setMandarinContour((prev) => [...prev.slice(-15), Math.round(data.f0)]);
      // Detect tonal excursion slope
      if (data.slope > 15) setToneType('Tone 2 (Rising 35)');
      else if (data.slope < -15) setToneType('Tone 4 (Falling 51)');
      else if (data.f0 > 220) setToneType('Tone 1 (High Level 55)');
      else setToneType('Tone 3 (Dipping 214)');
    }
  }, [data, activeLanguage]);

  // Generate SVG path for contour lines
  const renderPath = (contour: number[], width: number, height: number, minHz = 120, maxHz = 300) => {
    if (contour.length === 0) return '';
    const step = width / Math.max(1, contour.length - 1);
    return contour
      .map((val, idx) => {
        const x = idx * step;
        const clamped = Math.max(minHz, Math.min(maxHz, val));
        const y = height - ((clamped - minHz) / (maxHz - minHz)) * (height - 16) - 8;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const engPath = renderPath(englishContour, 180, 90);
  const manPath = renderPath(mandarinContour, 180, 90);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginMandarinBilingualVoice}
          liveStatusBadge={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveLanguage(activeLanguage === 'english' ? 'mandarin' : 'english')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/60 transition-colors"
                title="Toggle Active Recording Buffer"
              >
                <Languages className="w-3 h-3" />
                <span>Buffer: {activeLanguage.toUpperCase()}</span>
              </button>
            </div>
          }
        />

        {/* Split-Pane Line Chart: English vs Mandarin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
          {/* English Prosody Pane */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-semibold text-blue-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                English Non-Tonal Prosody
              </span>
              <span className="text-[10px] font-mono text-slate-500">Low F0 Slope</span>
            </div>

            <div className="h-24 w-full relative flex items-center">
              <svg width="100%" height="90" viewBox="0 0 180 90" preserveAspectRatio="none">
                <line x1="0" y1="45" x2="180" y2="45" stroke="#1e293b" strokeDasharray="3 3" />
                <path d={engPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Flat intonation baseline (~15–25 Hz variance per clause)
            </div>
          </div>

          {/* Mandarin Tonal Pitch Excursion Pane */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="font-semibold text-pink-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                Mandarin Lexical Tone Contour
              </span>
              <span className="text-[10px] font-mono text-pink-400 font-semibold">{toneType}</span>
            </div>

            <div className="h-24 w-full relative flex items-center">
              <svg width="100%" height="90" viewBox="0 0 180 90" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="180" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="65" x2="180" y2="65" stroke="#1e293b" strokeDasharray="3 3" />
                <path d={manPath} fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              High dynamic inflections (~60–90 Hz tonal excursion)
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Split className="w-3.5 h-3.5" />
          <span>Bilingual Lexical Tone &amp; Vocal Quality Separation</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Li et al. (2022)</span>
      </div>
    </div>
  );
};

export const pluginMandarinBilingualVoice: IVoicePlugin = {
  id: 'plugin_mandarin_bilingual_voice',
  name: 'Bilingual Tonal Voice Quality Tracker',
  description:
    'Tracks how vocal quality, pitch, and formants shift when a speaker switches between Mandarin Chinese (a tonal language) and English, highlighting the intersection of bilingualism and gender presentation.',
  demographics: {
    genderScope: ['Transfeminine', 'Transmasculine'],
    intersectingFactors: ['Bilingual', 'Mandarin Chinese speakers', 'English speakers'],
  },
  research: {
    id: 'li_2022_bilingual_mandarin_voice',
    title:
      'Effect of language on voice quality: an acoustic study of bilingual speakers of Mandarin Chinese and English',
    authors: ['Y. Li', 'et al.'],
    year: 2022,
    journal: 'Folia Phoniatrica et Logopaedica',
    doi: '10.1159/000525649',
    abstractSnippet:
      'Investigates how lexical tone requirements in Mandarin systematically alter vocal quality parameters, pitch excursion size, and formant frequency distributions compared to non-tonal English in bilingual individuals.',
  },
  acousticFeaturesAnalyzed: [
    'Lexical Tone Pitch Contours',
    'Vocal Quality',
    'F0 Range',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 90, 420);
    // Approximate slope based on start vs end of frame
    let slope = 0;
    if (f0Res.f0 > 0 && audioData.length >= 1024) {
      const half1 = audioData.subarray(0, 512);
      const half2 = audioData.subarray(512, 1024);
      const f1 = estimateF0(half1, sampleRate, 90, 420).f0;
      const f2 = estimateF0(half2, sampleRate, 90, 420).f0;
      if (f1 > 0 && f2 > 0) slope = f2 - f1;
    }

    return {
      f0: f0Res.f0,
      slope,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: BilingualMandarinWidget,
};
