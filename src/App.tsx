/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { GlobalHeader } from './components/GlobalHeader';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { MetaGraphView } from './components/MetaGraphView';
import { JupyterExportModal } from './components/JupyterExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const {
    currentView,
    isJupyterModalOpen,
    setJupyterModalOpen,
    currentThemeId,
  } = useAppStore();

  // Sync data-theme attribute on <html> element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentThemeId);
    }
  }, [currentThemeId]);

  return (
    <div
      data-theme={currentThemeId}
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        currentThemeId === 'baroque-maximalist'
          ? 'bg-[#0f031e] text-slate-100'
          : currentThemeId === 'y2k-maximalist'
          ? 'bg-[#050614] text-slate-100'
          : currentThemeId === 'duck-quack'
          ? 'bg-[#06182a] text-slate-100'
          : currentThemeId === 'synthwave-84'
          ? 'bg-[#10001f] text-slate-100'
          : currentThemeId === 'phosphor-amber'
          ? 'bg-[#0a0601] text-slate-100'
          : currentThemeId === 'alabaster-light'
          ? 'bg-slate-100 text-slate-900'
          : currentThemeId === 'silly-goose-light'
          ? 'bg-[#fefce8] text-stone-900'
          : 'bg-slate-950 text-slate-100'
      }`}
    >
      <GlobalHeader />

      <main className="flex-1 w-full px-3 sm:px-5 py-3 sm:py-4">
        {currentView === 'dashboard' ? <AnalysisDashboard /> : <MetaGraphView />}
      </main>

      {/* Jupyter Notebook Emission Modal */}
      <JupyterExportModal
        isOpen={isJupyterModalOpen}
        onClose={() => setJupyterModalOpen(false)}
      />

      {/* PWA Offline Connection Indicator */}
      <OfflineIndicator />
    </div>
  );
}
