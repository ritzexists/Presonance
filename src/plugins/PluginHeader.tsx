/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IVoicePlugin } from '../types';
import { Info, ExternalLink, BookOpen, Users, Sliders } from 'lucide-react';

interface PluginHeaderProps {
  plugin: IVoicePlugin;
  liveStatusBadge?: React.ReactNode;
}

export const PluginHeader: React.FC<PluginHeaderProps> = ({ plugin, liveStatusBadge }) => {
  const [showCitation, setShowCitation] = useState(false);

  return (
    <div className="relative border-b border-slate-800 pb-3 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
              {plugin.name}
            </h3>
            {liveStatusBadge}
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            {plugin.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowCitation(!showCitation)}
            className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
              showCitation
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Inspect Epistemic & Demographic Grounding"
            aria-label="Inspect Research & Demographics"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Research</span>
          </button>
        </div>
      </div>

      {/* Epistemic Metadata Popover Drawer */}
      {showCitation && (
        <div className="mt-3 p-3.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs shadow-xl animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic Grounding</span>
            </div>
            <a
              href={`https://doi.org/${plugin.research.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
            >
              DOI: {plugin.research.doi}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="font-medium text-slate-200 text-xs mb-1">
            "{plugin.research.title}"
          </p>
          <div className="text-[11px] text-slate-400 mb-2">
            <span>{plugin.research.authors.join(', ')}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{plugin.research.journal}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{plugin.research.year}</span>
          </div>

          <p className="text-[11px] text-slate-300/90 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800 mb-3 italic">
            "{plugin.research.abstractSnippet}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="font-semibold text-slate-300">Target Demographic Cohort</span>
              </div>
              <div className="text-slate-300 space-y-0.5">
                <div>Scope: {plugin.demographics.genderScope.join(', ')}</div>
                <div className="text-slate-400 text-[10px]">
                  Factors: {plugin.demographics.intersectingFactors.join(' · ')}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <Sliders className="w-3 h-3 text-amber-400" />
                <span className="font-semibold text-slate-300">Acoustic Indicators</span>
              </div>
              <div className="text-slate-300">
                {plugin.acousticFeaturesAnalyzed.join(' · ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
