/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Globe, ArrowRight, Gauge } from 'lucide-react';

const CrossCulturalPitchWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [currentSff, setCurrentSff] = useState<number>(0);
  const [rollingAverageSff, setRollingAverageSff] = useState<number>(210);
  const bufferRef = useRef<number[]>([]);

  useEffect(() => {
    if (!data || data.sff <= 0) return;
    setCurrentSff(data.sff);

    bufferRef.current.push(data.sff);
    if (bufferRef.current.length > 30) {
      bufferRef.current.shift(); // 5-second window at ~6 FPS updates
    }

    const avg = bufferRef.current.reduce((a, b) => a + b, 0) / bufferRef.current.length;
    setRollingAverageSff(Math.round(avg * 10) / 10);
  }, [data]);

  // Van Bezooijen (1995) normative values
  // Dutch women: Mean ~208 Hz (Range: 180 - 235 Hz)
  // Japanese women: Mean ~258 Hz (Range: 235 - 295 Hz)
  const minHz = 140;
  const maxHz = 320;
  const toPercent = (hz: number) => Math.min(100, Math.max(0, ((hz - minHz) / (maxHz - minHz)) * 100));

  const dutchStart = toPercent(180);
  const dutchWidth = toPercent(235) - dutchStart;

  const japaneseStart = toPercent(235);
  const japaneseWidth = toPercent(295) - japaneseStart;

  const trackerPos = toPercent(rollingAverageSff);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginJapaneseDutchPitchVanBezooijen}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Globe className="w-3 h-3" />
              <span>SFF: {rollingAverageSff} Hz</span>
            </span>
          }
        />

        <div className="space-y-4 my-2">
          {/* Main Horizontal Bullet / Gauge Chart */}
          <div className="relative pt-6 pb-4">
            {/* Background scale bar */}
            <div className="h-8 w-full bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800">
              {/* Dutch Normative Zone */}
              <div
                className="absolute top-0 bottom-0 bg-blue-500/25 border-r border-blue-400/40 flex items-center justify-center text-[10px] text-blue-200 font-semibold"
                style={{ left: `${dutchStart}%`, width: `${dutchWidth}%` }}
              >
                <span>Dutch Norm (180–235 Hz)</span>
              </div>

              {/* Japanese Normative Zone */}
              <div
                className="absolute top-0 bottom-0 bg-rose-500/25 border-l border-rose-400/40 flex items-center justify-center text-[10px] text-rose-200 font-semibold"
                style={{ left: `${japaneseStart}%`, width: `${japaneseWidth}%` }}
              >
                <span>Japanese Norm (235–295 Hz)</span>
              </div>

              {/* Live Speaker Indicator Bar */}
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_12px_#06b6d4] transition-all duration-150 z-10"
                style={{ left: `${trackerPos}%` }}
              />
            </div>

            {/* Indicator Marker Arrow */}
            <div
              className="absolute -top-1 transition-all duration-150 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${trackerPos}%` }}
            >
              <span className="text-[11px] font-mono font-bold text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-cyan-500 shadow-sm">
                {rollingAverageSff} Hz
              </span>
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-cyan-400 mt-0.5" />
            </div>

            {/* X-Axis Ticks */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-0.5">
              <span>140 Hz</span>
              <span>180 Hz</span>
              <span>210 Hz</span>
              <span>235 Hz</span>
              <span>260 Hz</span>
              <span>295 Hz</span>
              <span>320 Hz</span>
            </div>
          </div>

          {/* Sociophonetic Analysis Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider mb-1">
                Dutch Cultural Target
              </div>
              <div className="text-white font-semibold">180 – 235 Hz (Mean: ~208 Hz)</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Reflects lower baseline expectation of feminine gender presentation without social penalization.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider mb-1">
                Japanese Cultural Target
              </div>
              <div className="text-white font-semibold">235 – 295 Hz (Mean: ~258 Hz)</div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Decenters Anglosphere pitch targets, demonstrating how gendered acoustic expectations are localized.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Gauge className="w-3.5 h-3.5" />
          <span>Sliding 5s SFF Window Smoothing</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Van Bezooijen (1995)</span>
      </div>
    </div>
  );
};

export const pluginJapaneseDutchPitchVanBezooijen: IVoicePlugin = {
  id: 'plugin_japanese_dutch_pitch_vanbezooijen',
  name: 'Cross-Cultural Sociophonetic Pitch Targeter',
  description:
    'Measures sociophonetic pitch targets across cultures. Demonstrates that targets for "femininity" vary drastically globally, with Japanese women utilizing much higher baseline pitches than Dutch women, effectively decentering anglosphere standards.',
  demographics: {
    genderScope: ['Cisgender Women', 'Transfeminine (Target)'],
    intersectingFactors: ['Japanese speakers', 'Dutch speakers', 'Cross-cultural'],
  },
  research: {
    id: 'vanbezooijen_1995_cross_cultural_pitch',
    title: 'Sociocultural aspects of pitch differences between Japanese and Dutch women',
    authors: ['R. Van Bezooijen'],
    year: 1995,
    journal: 'Language and Speech',
    doi: '10.1177/002383099503800303',
    abstractSnippet:
      'Demonstrates substantial cross-cultural pitch differences in women speaking Japanese versus Dutch, demonstrating that gender vocal norms are culturally constructed and not universally bounded by physiology.',
  },
  acousticFeaturesAnalyzed: [
    'Speaking Fundamental Frequency (SFF)',
    'Cultural Pitch Range',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 100, 360);
    return {
      sff: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: CrossCulturalPitchWidget,
};
