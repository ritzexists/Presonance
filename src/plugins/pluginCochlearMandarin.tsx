/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { IVoicePlugin } from '../types';
import { estimateF0 } from '../services/dsp';
import { PluginHeader } from './PluginHeader';
import { Ear, Activity, Radio } from 'lucide-react';

interface PitchStep {
  continuousF0: number;
  quantizedBand: number; // Discretized CI electrode channel frequency
  channelIndex: number;
}

const CochlearMandarinWidget: React.FC<{ data: any; isLive: boolean }> = ({ data, isLive }) => {
  const [history, setHistory] = useState<PitchStep[]>([
    { continuousF0: 165, quantizedBand: 160, channelIndex: 3 },
    { continuousF0: 172, quantizedBand: 160, channelIndex: 3 },
    { continuousF0: 185, quantizedBand: 190, channelIndex: 4 },
    { continuousF0: 215, quantizedBand: 220, channelIndex: 5 },
    { continuousF0: 225, quantizedBand: 220, channelIndex: 5 },
    { continuousF0: 205, quantizedBand: 190, channelIndex: 4 },
    { continuousF0: 180, quantizedBand: 190, channelIndex: 4 },
    { continuousF0: 155, quantizedBand: 160, channelIndex: 3 },
    { continuousF0: 145, quantizedBand: 135, channelIndex: 2 },
    { continuousF0: 140, quantizedBand: 135, channelIndex: 2 },
  ]);

  const [currentChannel, setCurrentChannel] = useState<number>(4);

  // Cochlear Implant simulation: 8 discrete frequency channel bands (100Hz to 350Hz)
  const ciChannels = [110, 135, 160, 190, 220, 255, 295, 340];

  useEffect(() => {
    if (!data || data.continuousF0 <= 0) return;

    // Discretize continuous F0 to nearest CI channel
    let closestBand = ciChannels[0];
    let closestIndex = 0;
    let minDiff = 999;
    ciChannels.forEach((ch, idx) => {
      const diff = Math.abs(ch - data.continuousF0);
      if (diff < minDiff) {
        minDiff = diff;
        closestBand = ch;
        closestIndex = idx;
      }
    });

    setCurrentChannel(closestIndex + 1);

    setHistory((prev) => [
      ...prev.slice(-17),
      {
        continuousF0: Math.round(data.continuousF0),
        quantizedBand: closestBand,
        channelIndex: closestIndex + 1,
      },
    ]);
  }, [data]);

  // Generate staircase stepped SVG path and smooth continuous curve
  const width = 280;
  const height = 120;
  const minHz = 90;
  const maxHz = 360;

  const mapY = (hz: number) => height - ((hz - minHz) / (maxHz - minHz)) * (height - 20) - 10;

  // Step line
  const stepCount = history.length;
  const xStep = width / Math.max(1, stepCount - 1);

  let steppedD = '';
  let smoothD = '';

  history.forEach((pt, i) => {
    const x = i * xStep;
    const yContinuous = mapY(pt.continuousF0);
    const yQuantized = mapY(pt.quantizedBand);

    if (i === 0) {
      steppedD = `M 0 ${yQuantized}`;
      smoothD = `M 0 ${yContinuous}`;
    } else {
      const prevX = (i - 1) * xStep;
      // Step: horizontal from prev to current X, then vertical
      steppedD += ` H ${x} V ${yQuantized}`;
      smoothD += ` L ${x} ${yContinuous}`;
    }
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <PluginHeader
          plugin={pluginCochlearMandarinMahshie}
          liveStatusBadge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              <Ear className="w-3 h-3" />
              <span>CI Channel: Ch {currentChannel} / 8</span>
            </span>
          }
        />

        <div className="space-y-3 my-2">
          {/* Stepped Line-Chart (Staircase Chart) */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">
                Electrode Channel Quantization (Staircase) vs Continuous Voice
              </span>
              <span className="font-mono text-cyan-400 text-[10px]">
                {history[history.length - 1]?.continuousF0 || 0} Hz → Ch {currentChannel}
              </span>
            </div>

            <div className="h-32 w-full relative">
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {/* Horizontal Channel Grid Lines */}
                {ciChannels.map((ch, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={mapY(ch)}
                    x2={width}
                    y2={mapY(ch)}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* Continuous smooth voice trace */}
                <path d={smoothD} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

                {/* Stepped CI Electrode Quantization trace */}
                <path d={steppedD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="square" />
              </svg>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>Ch 1 (110 Hz)</span>
              <span>Ch 4 (190 Hz)</span>
              <span>Ch 8 (340 Hz)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
            <span className="font-semibold text-white block mb-1">
              Categorical Pitch Contours in Deaf/HoH Trans Speakers
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cochlear implants quantize pitch into macroscopic frequency bands. Transgender individuals with CIs navigate gendered intonation through discrete electrode steps rather than micro-continuous pitch trajectories.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-cyan-400" />
            <span>CI Quantized Channels</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-slate-500 border border-slate-400 border-dashed" />
            <span>Continuous Voice</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Gu, Yin, Mahshie (2016)</span>
      </div>
    </div>
  );
};

export const pluginCochlearMandarinMahshie: IVoicePlugin = {
  id: 'plugin_cochlear_mandarin_mahshie',
  name: 'Cochlear Implant Tonal Perception & Voice',
  description:
    'Models categorical production of pitch for transgender individuals utilizing cochlear implants, rooted in studies of Mandarin tonal production among CI users.',
  demographics: {
    genderScope: ['Transgender', 'Deaf / Hard of Hearing (HoH)'],
    intersectingFactors: ['Cochlear Implant Users', 'Tonal Language Speakers'],
  },
  research: {
    id: 'gu_2016_ci_tonal_perception',
    title:
      'Categorical Perception in Two Pairs of Mandarin Tones among Bimodal Cochlear Implanted Children',
    authors: ['W. Gu', 'J. Yin', 'J. Mahshie'],
    year: 2016,
    journal: 'Proceedings of the ISCSLP Conference',
    doi: '10.1109/ISCSLP.2016.7846011',
    abstractSnippet:
      'Investigates categorical pitch contour perception and vocal production through cochlear implant electrode channel arrays, illuminating discrete pitch quantization in D/deaf vocal production.',
  },
  acousticFeaturesAnalyzed: [
    'Categorical Pitch Contours',
    'Macroscopic F0 Jumps',
  ],
  processAudio: (audioData: Float32Array, sampleRate: number) => {
    const f0Res = estimateF0(audioData, sampleRate, 80, 400);
    return {
      continuousF0: f0Res.f0,
      confidence: f0Res.confidence,
    };
  },
  WidgetComponent: CochlearMandarinWidget,
};
