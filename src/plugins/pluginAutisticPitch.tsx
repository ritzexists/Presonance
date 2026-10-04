/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Activity, Flame, ShieldAlert, Cpu } from 'lucide-react';

interface PitchTimelineSegment {
  time: number;
  pitchSigma: number; // in semitones
  meanF0: number;
  affectCategory: 'monotone' | 'normative' | 'hyper-melodic';
}

const AutisticPitchWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [pitchSigma, setPitchSigma] = useState<number>(1.8);
  const [timeline, setTimeline] = useState<PitchTimelineSegment[]>([
    { time: 1, pitchSigma: 1.2, meanF0: 165, affectCategory: 'monotone' },
    { time: 2, pitchSigma: 1.4, meanF0: 170, affectCategory: 'monotone' },
    { time: 3, pitchSigma: 2.2, meanF0: 178, affectCategory: 'normative' },
    { time: 4, pitchSigma: 3.5, meanF0: 195, affectCategory: 'hyper-melodic' },
    { time: 5, pitchSigma: 3.8, meanF0: 205, affectCategory: 'hyper-melodic' },
    { time: 6, pitchSigma: 1.9, meanF0: 180, affectCategory: 'normative' },
    { time: 7, pitchSigma: 1.1, meanF0: 172, affectCategory: 'monotone' },
    { time: 8, pitchSigma: 1.3, meanF0: 168, affectCategory: 'monotone' },
    { time: 9, pitchSigma: 2.4, meanF0: 185, affectCategory: 'normative' },
    { time: 10, pitchSigma: 2.8, meanF0: 190, affectCategory: 'normative' },
  ]);

  const f0HistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!data || data.f0 <= 0) return;

    f0HistoryRef.current.push(data.f0);
    if (f0HistoryRef.current.length > 50) f0HistoryRef.current.shift();

    if (f0HistoryRef.current.length >= 10) {
      // Calculate Pitch Sigma (standard deviation in semitones)
      // semitones = 12 * log2(f0 / 100)
      const st = f0HistoryRef.current.map((hz) => 12 * Math.log2(hz / 100));
      const meanSt = st.reduce((a, b) => a + b, 0) / st.length;
      const variance = st.reduce((acc, val) => acc + Math.pow(val - meanSt, 2), 0) / st.length;
      const sigma = Math.sqrt(variance);
      const roundedSigma = Math.round(sigma * 10) / 10;
      setPitchSigma(roundedSigma);

      let cat: 'monotone' | 'normative' | 'hyper-melodic' = 'normative';
      if (roundedSigma < 1.6) cat = 'monotone';
      else if (roundedSigma > 3.2) cat = 'hyper-melodic';

      setTimeline((prev) => [
        ...prev.slice(-19),
        {
          time: Date.now(),
          pitchSigma: roundedSigma,
          meanF0: Math.round(data.f0),
          affectCategory: cat,
        },
      ]);
    }
  }, [data]);

  // Color mapping based on sigma
  // Cool (blue/purple) for monotone (<1.6 st) -> Neutral green (1.6 - 3.2 st) -> Warm (orange/red) (>3.2 st)
  const getSegmentColor = (sigma: number) => {
    if (sigma < 1.3) return 'bg-indigo-600 shadow-indigo-500/30';
    if (sigma < 1.8) return 'bg-cyan-500 shadow-cyan-500/30';
    if (sigma < 2.5) return 'bg-emerald-500 shadow-emerald-500/30';
    if (sigma < 3.2) return 'bg-amber-500 shadow-amber-500/30';
    return 'bg-rose-500 shadow-rose-500/30';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginAutisticPitchVonKriegstein}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Activity className="w-3 h-3" />
              <span>Pitch Sigma: {pitchSigma} st</span>
            </span>
          }
        />

        {/* Heat-Map Timeline of Prosodic Variance */}
        <div className="space-y-3 my-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Rolling 10-Second Melodic Heatmap</span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Monotone (&lt;1.6 st)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Modulated (1.6–3.2 st)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Hyper-Melodic (&gt;3.2 st)
              </span>
            </div>
          </div>

          {/* Timeline Bar blocks */}
          <div className="h-14 bg-slate-950 p-1.5 rounded-lg border border-slate-800 flex items-center gap-1 overflow-hidden">
            {timeline.map((seg, idx) => {
              const heightPct = Math.min(100, Math.max(25, (seg.pitchSigma / 5.0) * 100));
              return (
                <div
                  key={idx}
                  className="flex-1 h-full flex items-end justify-center group relative cursor-pointer"
                >
                  <div
                    className={`w-full rounded-xs transition-all duration-200 ${getSegmentColor(seg.pitchSigma)}`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
                    {seg.pitchSigma} st ({seg.meanF0} Hz)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-0.5">
                Autistic Unmasking / Flat Prosody
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Reduced pitch standard deviation (&lt;1.6 st) represents natural neurodivergent baseline, often misinterpreted in cis-heteronormative voice training as lack of affect.
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block mb-0.5">
                Hyper-Melodic Trans Feminine Style
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Elevated pitch sigma (&gt;3.2 st) indexes social compensation or expressive prosodic adaptation used to convey gender affirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Affect Variance in Semitone Standard Deviation</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Schelinski &amp; von Kriegstein (2019)</span>
      </div>
    </div>
  );
};

export const pluginAutisticPitchVonKriegstein: IVoicePlugin = {
  id: 'plugin_autistic_pitch_vonkriegstein',
  name: 'Neurodivergent Vocal Pitch & Affect Monitor',
  description:
    'Analyzes vocal pitch variance (often perceived as monotone or hyper-melodic) prevalent in autistic/neurodivergent speakers. Bridges the gap between autistic prosody and transgender voice training.',
  demographics: {
    genderScope: ['Transgender', 'Non-binary', 'Cisgender'],
    intersectingFactors: ['Autistic', 'Neurodivergent', 'Alexithymia'],
  },
  research: {
    id: 'schelinski_2019_autistic_pitch',
    title:
      'The relation between vocal pitch and vocal emotion recognition abilities in people with autism spectrum disorder and typical development',
    authors: ['S. Schelinski', 'K. von Kriegstein'],
    year: 2019,
    journal: 'Journal of Autism and Developmental Disorders',
    doi: '10.1007/s10803-018-3681-z',
    abstractSnippet:
      'Examines pitch variation and prosodic contour features in individuals with autism spectrum conditions, contextualizing autistic pitch variance within vocal affect expression and social perception.',
  },
  acousticFeaturesAnalyzed: [
    'Pitch Standard Deviation (Pitch Sigma)',
    'Prosodic Variance',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 75, 450);
    return {
      f0: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: AutisticPitchWidget,
};
