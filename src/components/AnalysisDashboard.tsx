/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Filter, Layers, CheckSquare, Square, Info, Sparkles, BookOpen, X, ExternalLink } from 'lucide-react';
import { NodeType } from '../types';
import { generateMetaGraphData } from '../services/metaGraphGenerator';

export const AnalysisDashboard: React.FC = () => {
  const {
    registeredPlugins,
    activePluginIds,
    togglePluginActive,
    pluginData,
    isAudioRunning,
    startAudio,
    setView,
    selectMetaNode,
    currentThemeId,
  } = useAppStore();

  const [filterGender, setFilterGender] = useState<string>('all');
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Dynamic metrics derived directly from available and active plugins
  const dynamicGreetingData = useMemo(() => {
    const scopesSet = new Set<string>();
    const factorsSet = new Set<string>();
    const featuresSet = new Set<string>();
    const authorsSet = new Set<string>();

    registeredPlugins.forEach((p) => {
      p.demographics.genderScope.forEach((s) => scopesSet.add(s));
      p.demographics.intersectingFactors.forEach((f) => factorsSet.add(f));
      p.acousticFeaturesAnalyzed.forEach((feat) => featuresSet.add(feat));
      if (p.research.authors && p.research.authors.length > 0) {
        authorsSet.add(p.research.authors[0]);
      }
    });

    const scopesList = Array.from(scopesSet);
    const factorsList = Array.from(factorsSet);
    const featuresList = Array.from(featuresSet);

    return {
      totalPlugins: registeredPlugins.length,
      activeCount: activePluginIds.length,
      authorsCount: authorsSet.size,
      scopesList,
      factorsList,
      featuresList,
      allPlugins: registeredPlugins,
    };
  }, [registeredPlugins, activePluginIds]);

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

  // Color code research bubbles and dots based on primary demographic cohort
  const getCohortTheme = (plugin: any) => {
    const allText = [
      ...(plugin.demographics?.genderScope || []),
      ...(plugin.demographics?.intersectingFactors || []),
      ...(plugin.comparativeCohorts || []),
      plugin.id || '',
      plugin.name || '',
    ].join(' ').toLowerCase();

    if (allText.includes('transfem') || allText.includes('trans women') || allText.includes('feminine')) {
      return {
        name: 'Transfeminine',
        dotColor: 'bg-pink-400',
        badgeBg: 'bg-pink-950/60 text-pink-300 border-pink-700/50',
        bubbleBorderActive: 'border-pink-500/50 ring-1 ring-pink-500/25',
        bubbleBorderInactive: 'border-pink-900/40 hover:border-pink-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-pink-400',
      };
    }

    if (allText.includes('transmasc') || allText.includes('trans men') || allText.includes('testosterone') || allText.includes('hodges') || allText.includes('zimman')) {
      return {
        name: 'Transmasculine',
        dotColor: 'bg-cyan-400',
        badgeBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
        bubbleBorderActive: 'border-cyan-500/50 ring-1 ring-cyan-500/25',
        bubbleBorderInactive: 'border-cyan-900/40 hover:border-cyan-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-cyan-400',
      };
    }

    if (allText.includes('non-binary') || allText.includes('nonbinary') || allText.includes('expansive') || allText.includes('becker')) {
      return {
        name: 'Non-Binary',
        dotColor: 'bg-purple-400',
        badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-700/50',
        bubbleBorderActive: 'border-purple-500/50 ring-1 ring-purple-500/25',
        bubbleBorderInactive: 'border-purple-900/40 hover:border-purple-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-purple-400',
      };
    }

    if (allText.includes('aave') || allText.includes('african american') || allText.includes('black') || allText.includes('sapienza') || allText.includes('hudson')) {
      return {
        name: 'African American (AAVE)',
        dotColor: 'bg-amber-400',
        badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
        bubbleBorderActive: 'border-amber-500/50 ring-1 ring-amber-500/25',
        bubbleBorderInactive: 'border-amber-900/40 hover:border-amber-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-amber-400',
      };
    }

    if (allText.includes('autistic') || allText.includes('neurodivergent') || allText.includes('vonkriegstein')) {
      return {
        name: 'Neurodivergent',
        dotColor: 'bg-indigo-400',
        badgeBg: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50',
        bubbleBorderActive: 'border-indigo-500/50 ring-1 ring-indigo-500/25',
        bubbleBorderInactive: 'border-indigo-900/40 hover:border-indigo-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-indigo-400',
      };
    }

    if (allText.includes('aging') || allText.includes('elderly') || allText.includes('60+') || allText.includes('nishio')) {
      return {
        name: 'Aging Voices',
        dotColor: 'bg-sky-400',
        badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-700/50',
        bubbleBorderActive: 'border-sky-500/50 ring-1 ring-sky-500/25',
        bubbleBorderInactive: 'border-sky-900/40 hover:border-sky-700/60',
        bubbleBg: 'bg-slate-950/85',
        accentText: 'text-sky-400',
      };
    }

    return {
      name: 'Cross-Cultural',
      dotColor: 'bg-emerald-400',
      badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
      bubbleBorderActive: 'border-emerald-500/50 ring-1 ring-emerald-500/25',
      bubbleBorderInactive: 'border-emerald-900/40 hover:border-emerald-700/60',
      bubbleBg: 'bg-slate-950/85',
      accentText: 'text-emerald-400',
    };
  };

  return (
    <div className="space-y-6">
      {/* Intro Context Banner (Dynamic based on available plugins) */}
      {showGuide && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm w-full space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 max-w-6xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {currentThemeId === 'duck-quack'
                      ? '🦆 100% Peer-Quacked Sociophonetic Methodology'
                      : 'Intersectional Sociophonetic Methodology'}
                  </span>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-400 font-mono text-[11px] normal-case">
                  {currentThemeId === 'duck-quack'
                    ? `${dynamicGreetingData.totalPlugins} quack-modules (${dynamicGreetingData.activeCount} swimming)`
                    : `${dynamicGreetingData.totalPlugins} research modules available (${dynamicGreetingData.activeCount} active)`}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {currentThemeId === 'duck-quack'
                  ? 'Acoustic Signal Processing Grounded in Gender-Expansive Research (Duck-Reviewed 🦆)'
                  : 'Acoustic Signal Processing Grounded in Gender-Expansive Research'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Traditional acoustic tools reduce vocal gender to a binary pitch threshold (e.g. 165Hz).{' '}
                <strong className="text-white font-semibold">
                  {currentThemeId === 'duck-quack' ? 'Quack-Sonance' : 'Presonance'}
                </strong>{' '}
                treats vocal presentation as a multidimensional,
                sociolinguistic construct. Grounded across{' '}
                <span className="text-cyan-300 font-semibold">{dynamicGreetingData.totalPlugins} peer-reviewed research modules</span>{' '}
                investigating{' '}
                <span className="text-slate-200">
                  {dynamicGreetingData.scopesList.slice(0, 4).join(', ')}
                </span>{' '}
                and intersecting factors (
                <span className="text-slate-200">
                  {dynamicGreetingData.factorsList.slice(0, 3).join(', ')}
                </span>) across{' '}
                <span className="text-amber-300 font-semibold">
                  {dynamicGreetingData.featuresList.length} acoustic dimensions
                </span>.
              </p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-1 border border-slate-800"
              title="Dismiss banner"
            >
              <span>{currentThemeId === 'duck-quack' ? 'Shoo 🦆' : 'Dismiss'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Grid of Plugin Citations */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {dynamicGreetingData.allPlugins.map((plugin) => {
              const isActive = activePluginIds.includes(plugin.id);
              const cohortTheme = getCohortTheme(plugin);
              const primaryAuthor =
                plugin.research.authors && plugin.research.authors.length > 2
                  ? `${plugin.research.authors[0]} et al.`
                  : plugin.research.authors
                  ? plugin.research.authors.join(' & ')
                  : 'Research Group';

              const citationUrl =
                plugin.research.url ||
                (plugin.research.doi
                  ? (plugin.research.doi.startsWith('http')
                      ? plugin.research.doi
                      : `https://doi.org/${plugin.research.doi}`)
                  : `https://scholar.google.com/scholar?q=${encodeURIComponent(
                      `${primaryAuthor} ${plugin.research.year} ${plugin.research.title}`
                    )}`);

              const handleNavigateToResearchNode = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const allMetaNodes = generateMetaGraphData(registeredPlugins).nodes;
                const researchNode =
                  allMetaNodes.find(
                    (n) =>
                      n.id === `research_${plugin.research.id}` ||
                      (n.group === NodeType.RESEARCH && n.metadata?.pluginId === plugin.id)
                  ) ||
                  allMetaNodes.find((n) => n.group === NodeType.RESEARCH);

                if (researchNode) {
                  selectMetaNode(researchNode);
                }
                setView('meta');
              };

              const handleNavigateToCohortNode = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const allMetaNodes = generateMetaGraphData(registeredPlugins).nodes;
                const primaryScope = plugin.demographics.genderScope[0]?.toLowerCase() || '';
                const primaryFactor = plugin.demographics.intersectingFactors[0]?.toLowerCase() || '';

                const cohortNode =
                  allMetaNodes.find((n) => {
                    if (n.group !== NodeType.COHORT) return false;
                    const label = n.label.toLowerCase();
                    const themeName = cohortTheme.name.toLowerCase();
                    return (
                      label.includes(themeName) ||
                      themeName.includes(label) ||
                      (primaryScope && label.includes(primaryScope)) ||
                      (primaryFactor && label.includes(primaryFactor))
                    );
                  }) ||
                  allMetaNodes.find(
                    (n) =>
                      n.group === NodeType.COHORT &&
                      n.connectedNodes?.some(
                        (cn) =>
                          cn.id === `research_${plugin.research.id}` ||
                          cn.id === `widget_${plugin.id}`
                      )
                  ) ||
                  allMetaNodes.find((n) => n.group === NodeType.COHORT);

                if (cohortNode) {
                  selectMetaNode(cohortNode);
                }
                setView('meta');
              };

              return (
                <div
                  key={plugin.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${cohortTheme.bubbleBg} ${
                    isActive ? cohortTheme.bubbleBorderActive : cohortTheme.bubbleBorderInactive
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${cohortTheme.dotColor} ${
                            isActive ? 'shadow-xs animate-pulse ring-2 ring-white/10' : 'opacity-70'
                          }`}
                          title={`Primary Cohort: ${cohortTheme.name}`}
                        />
                        {/* Author text: plain text (not an external link) */}
                        <span className="font-semibold text-slate-100 truncate text-[11px] sm:text-xs">
                          {primaryAuthor} ({plugin.research.year})
                        </span>
                      </div>

                      {/* Active/Inactive Toggle Pill */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePluginActive(plugin.id);
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono shrink-0 transition-all flex items-center gap-1 cursor-pointer border ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30'
                            : 'bg-slate-800/90 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                        title={`Click to ${isActive ? 'deactivate' : 'activate'} ${plugin.name}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>

                    {/* Research Title: Internal Link to the Research Node on Meta Graph */}
                    <button
                      type="button"
                      onClick={handleNavigateToResearchNode}
                      className="text-left text-[11px] text-slate-300 hover:text-cyan-300 transition-colors line-clamp-2 leading-relaxed block mt-1 font-medium cursor-pointer group"
                      title={`View ${primaryAuthor} (${plugin.research.year}) node on Meta Graph`}
                    >
                      <span>{plugin.research.title}</span>
                      <span className="text-[10px] text-cyan-400/80 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        → meta
                      </span>
                    </button>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                    {/* Bottom Left Cohort Pill: Link to Respective Cohort Node on Meta Graph */}
                    <button
                      type="button"
                      onClick={handleNavigateToCohortNode}
                      className={`px-1.5 py-0.5 rounded text-[10px] border truncate max-w-[130px] font-mono transition-all cursor-pointer hover:brightness-125 hover:scale-105 active:scale-95 ${cohortTheme.badgeBg}`}
                      title={`View ${cohortTheme.name} cohort node on Meta Graph`}
                    >
                      {cohortTheme.name}
                    </button>

                    {/* Publication Name: THE ONLY external link on the card */}
                    <a
                      href={citationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-300 truncate max-w-[110px] font-sans text-[10px] transition-colors inline-flex items-center gap-1 group/pub"
                      title={`External publication: ${plugin.research.journal || 'Academic Paper'}`}
                    >
                      <span className="truncate">{plugin.research.journal || 'Peer-Reviewed'}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover/pub:text-cyan-300 shrink-0" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Selector & Cohort Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 w-full">
        {/* Module Pills Group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">
              {currentThemeId === 'duck-quack' ? 'Quackers:' : 'Modules:'}
            </span>
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

        {/* Right side controls: Cohort Filter and Guide Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60 shrink-0">
          {!showGuide && (
            <button
              onClick={() => setShowGuide(true)}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-colors"
              title="Show Research Methodology & Plugin Citations"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {currentThemeId === 'duck-quack' ? '🦆 Pond Guide' : 'Methodology Guide'}
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              {currentThemeId === 'duck-quack' ? 'Flock:' : 'Cohort:'}
            </span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 sm:px-2.5 py-1 focus:outline-none focus:border-cyan-500 max-w-[200px] sm:max-w-none truncate"
            >
              <option value="all">
                {currentThemeId === 'duck-quack'
                  ? `Full Flock (${registeredPlugins.length} ducks)`
                  : `All Intersections (${registeredPlugins.length})`}
              </option>
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
