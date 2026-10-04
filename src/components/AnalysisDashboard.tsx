/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Filter, Layers, CheckSquare, Square, Info, Sparkles, BookOpen } from 'lucide-react';

export const AnalysisDashboard: React.FC = () => {
  const {
    registeredPlugins,
    activePluginIds,
    togglePluginActive,
    pluginData,
    isAudioRunning,
    startAudio,
  } = useAppStore();

  const [filterGender, setFilterGender] = useState<string>('all');
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Filtered plugins supporting both genderScope and intersectingFactors
  const displayedPlugins = registeredPlugins.filter((plugin) => {
    if (filterGender === 'all') return true;
    const target = filterGender.toLowerCase();
    const matchGender = plugin.demographics.genderScope.some((g) =>
      g.toLowerCase().includes(target)
    );
    const matchFactors = plugin.demographics.intersectingFactors.some((f) =>
      f.toLowerCase().includes(target)
    );
    return matchGender || matchFactors;
  });

  const getShortLabel = (id: string, fullName: string) => {
    switch (id) {
      case 'plugin_sibilance_f0_zimman': return 'Sibilance /s/ & F0';
      case 'plugin_creak_variationist_becker': return 'Creak & Jitter';
      case 'plugin_transfem_resonance_hancock': return 'Formant Resonance';
      case 'plugin_transmasc_instability_hodges': return 'Pitch Chaos & Breaks';
      case 'plugin_aave_baseline_aerodynamics_sapienza': return 'AAVE Aerodynamics';
      case 'plugin_japanese_dutch_pitch_vanbezooijen': return 'Japan vs Dutch Pitch';
      case 'plugin_mandarin_bilingual_voice': return 'Bilingual Tone';
      case 'plugin_spanish_tvq_mora': return 'Spanish TVQ Vowels';
      case 'plugin_autistic_pitch_vonkriegstein': return 'Autistic Pitch Affect';
      case 'plugin_creak_yuasa_japanese': return 'Japan vs US Creak';
      case 'plugin_cochlear_mandarin_mahshie': return 'Cochlear Implant Tones';
      case 'plugin_aave_reading_f0_hudson': return 'AAVE Reading F0';
      case 'plugin_arabic_f0_natour': return 'Jordanian Arabic F0';
      case 'plugin_singing_femininity_mandarin': return 'Mandarin Singing Vibrato';
      case 'plugin_transmasc_rater_identity': return 'Rater Identity & Race';
      case 'plugin_aging_trans_f0_nishio': return 'Aging Voice Shift';
      default: return fullName;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Context Banner */}
      {showGuide && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm w-full">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 max-w-6xl">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Intersectional Sociophonetic Methodology</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Acoustic Signal Processing Grounded in Gender-Expansive Research
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Traditional acoustic tools reduce vocal gender to a binary pitch threshold (e.g. 165Hz).
                <strong> presonance</strong> treats vocal presentation as a multidimensional,
                sociolinguistic construct. Every module is grounded in peer-reviewed scholarship
                analyzing transmasculine testosterone therapy trajectories, transfeminine vocal tract
                resonance modulation, and non-binary aperiodic phonation (creaky voice).
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-500 hover:text-slate-300 text-xs p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
              title="Dismiss banner"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Zimman (2017)</span>
                <span className="text-[11px] text-slate-400">Stylistic bricolage in /s/ center-of-gravity</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Becker et al. (2023)</span>
                <span className="text-[11px] text-slate-400">Non-binary creak &amp; aperiodic phonation</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-pink-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Hancock (2020)</span>
                <span className="text-[11px] text-slate-400">Transfeminine F1/F2 formant resonance tuning</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block">Hodges-Simeon (2021)</span>
                <span className="text-[11px] text-slate-400">First-year T-therapy voice breaks &amp; chaos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Selector & Cohort Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 w-full">
        {/* Module Pills Group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Modules:</span>
            <span className="text-[10px] font-mono text-cyan-300 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
              {activePluginIds.length}/{registeredPlugins.length}
            </span>
          </div>

          {registeredPlugins.map((plugin) => {
            const isActive = activePluginIds.includes(plugin.id);
            const shortLabel = getShortLabel(plugin.id, plugin.name);

            return (
              <button
                key={plugin.id}
                onClick={() => togglePluginActive(plugin.id)}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 font-medium shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/40 text-slate-500 border border-slate-900 hover:text-slate-300 hover:border-slate-800'
                }`}
                title={`Toggle ${plugin.name}`}
              >
                {isActive ? (
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                )}
                <span className="xl:hidden">{shortLabel}</span>
                <span className="hidden xl:inline">{plugin.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right side controls: Cohort Filter */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Cohort:</span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 sm:px-2.5 py-1 focus:outline-none focus:border-cyan-500 max-w-[200px] sm:max-w-none truncate"
            >
              <option value="all">All Intersections ({registeredPlugins.length})</option>
              <option value="transmasculine">Transmasculine / Trans Men</option>
              <option value="transfeminine">Transfeminine / Trans Women</option>
              <option value="non-binary">Non-Binary / Gender Expansive</option>
              <option value="african american">African American / Black Voices</option>
              <option value="cross-cultural">Cross-Cultural / Multilingual</option>
              <option value="autistic">Neurodivergent / Autistic</option>
              <option value="aging">Aging Population (60+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Active Voice Plugin Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {displayedPlugins.map((plugin) => {
          const isActive = activePluginIds.includes(plugin.id);
          if (!isActive) return null;

          const data = pluginData[plugin.id];
          const Widget = plugin.WidgetComponent;

          return (
            <div key={plugin.id} className="min-w-0">
              <Widget data={data} isLive={isAudioRunning} />
            </div>
          );
        })}
      </div>

      {/* Empty State if all filtered out */}
      {displayedPlugins.filter((p) => activePluginIds.includes(p.id)).length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Active Modules in Selected Scope</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Enable plugin modules above or switch the cohort scope to view active acoustic widgets.
          </p>
          <button
            onClick={() => {
              setFilterGender('all');
              registeredPlugins.forEach((p) => {
                if (!activePluginIds.includes(p.id)) togglePluginActive(p.id);
              });
            }}
            className="mt-4 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Reset Filters &amp; Enable All
          </button>
        </div>
      )}
    </div>
  );
};
