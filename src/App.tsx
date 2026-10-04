/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from './store/useAppStore';
import { GlobalHeader } from './components/GlobalHeader';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { MetaGraphView } from './components/MetaGraphView';
import { JupyterExportModal } from './components/JupyterExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const { currentView, isJupyterModalOpen, setJupyterModalOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
