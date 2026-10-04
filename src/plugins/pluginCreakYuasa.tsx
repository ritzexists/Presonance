/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Activity, BarChart2, Shield } from 'lucide-react';

const CreakYuasaWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [speakerCreakPct, setSpeakerCreakPct] = useState<number>(14.2);
  const pulseFramesRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);

  useEffect(() => {
    if (!data) return;
    totalFramesRef.current++;
    if (data.isPulseRegister) {
      pulseFramesRef.current++;
    }

    if (totalFramesRef.current >= 20) {
      const pct = (pulseFramesRef.current / totalFramesRef.current) * 100;
      setSpeakerCreakPct(Math.round(pct * 10) / 10);
      // Decay window
      if (totalFramesRef.current > 120) {
        totalFramesRef.current = 60;
        pulseFramesRef.current = Math.round(pulseFramesRef.current * 0.5);
      }
    }
  }, [data]);

  // Yuasa (2010) baselines
  // US Young Adult Women: ~17.5% creaky voice phonation
  // Japanese Young Adult Women: ~1.8% creaky voice phonation
  const usAvg = 17.5;
  const jpAvg = 1.8;
  const maxDisplayPct = 30;

  const toBarHeight = (pct: number) => Math.min(100, Math.max(0, (pct / maxDisplayPct) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginCreakYuasaJapanese}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Activity className="w-3 h-3" />
              <span>Creak Rate: {speakerCreakPct}%</span>
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-2">
          {/* Two Side-by-Side Vertical Progress Bars with Glowing Speaker Indicator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative flex items-center justify-around h-48">
            {/* Glowing horizontal speaker indicator line */}
            <div
              className="absolute left-3 right-3 border-b-2 border-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-200 z-20 flex items-center justify-between"
              style={{ bottom: `${toBarHeight(speakerCreakPct)}%` }}
            >
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 px-1 py-0.5 rounded -mt-6 border border-cyan-500 shadow-md">
                Active Speaker: {speakerCreakPct}%
              </span>
            </div>

            {/* US Norm Column */}
            <div className="flex flex-col items-center h-full justify-end w-20 z-10">
              <div className="text-[11px] font-mono font-bold text-amber-300 mb-1">{usAvg}%</div>
              <div className="w-12 bg-slate-900 rounded-t-lg h-36 flex items-end p-1 border border-slate-800 relative">
                <div
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-300"
                  style={{ height: `${toBarHeight(usAvg)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-300 mt-2 text-center">
                US Women
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Yuasa 2010</span>
            </div>

            {/* Japanese Norm Column */}
            <div className="flex flex-col items-center h-full justify-end w-20 z-10">
              <div className="text-[11px] font-mono font-bold text-purple-300 mb-1">{jpAvg}%</div>
              <div className="w-12 bg-slate-900 rounded-t-lg h-36 flex items-end p-1 border border-slate-800 relative">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-300"
                  style={{ height: `${toBarHeight(jpAvg)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-300 mt-2 text-center">
                Japan Women
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Yuasa 2010</span>
            </div>
          </div>

          {/* Sociolinguistic Description */}
          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-white block mb-1">
                Creak as a Socio-Indexical Resource
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In US urban contexts, vocal fry / creak functions as an upwardly-mobile marker of casual authority among young women. In Japan, cultural norms of polite femininity enforce modal clarity and near-zero pulse register.
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Alignment Classification</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {speakerCreakPct > 10 ? 'US Urban Pattern' : 'Japanese Modal Clarity'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Low-frequency pulse register (&lt;70 Hz) tracked over continuous phonation intervals.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Pulse Register Duration vs. Phonation Time</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Yuasa (2010)</span>
      </div>
    </div>
  );
};

export const pluginCreakYuasaJapanese: IVoicePlugin = {
  id: 'plugin_creak_yuasa_japanese',
  name: 'Cross-Cultural Creaky Voice: Japanese vs. US',
  description:
    'Contrasts intragender differences in creaky voice usage. Analyzes how Japanese women produce significantly lower rates of creaky voice than American female counterparts, demonstrating that "feminine" voice traits are geographically localized.',
  demographics: {
    genderScope: ['Cisgender Women', 'Transfeminine'],
    intersectingFactors: ['Japanese', 'US English', 'Young Adults'],
  },
  research: {
    id: 'yuasa_2010_creak_japanese_us',
    title:
      'Creaky voice: A new feminine voice quality for young urban-oriented upwardly mobile American women?',
    authors: ['Ikuko Patricia Yuasa'],
    year: 2010,
    journal: 'American Speech',
    doi: '10.1215/00031283-2010-004',
    abstractSnippet:
      'Compares vocal fry / creak rates in American English versus Japanese female speech, revealing creak as a socio-indexical marker in young American women that is largely absent among Japanese women.',
  },
  acousticFeaturesAnalyzed: [
    'Aperiodic Phonation (Vocal Fry)',
    'Pulse Register',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 35, 120);
    // Creak / Pulse register: very low F0 (<70 Hz) with irregular period spacing
    const isPulseRegister = f0Res.f0 > 30 && f0Res.f0 < 72 && f0Res.confidence > 0.45;
    return {
      f0: f0Res.f0,
      isPulseRegister,
    };
  },
  WidgetComponent: CreakYuasaWidget,
};
