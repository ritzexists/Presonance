/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateJupyterNotebook, NotebookExportOptions } from '../services/jupyterExporter';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Network,
  Database,
  Code,
  FileText,
  Sliders,
  Loader2,
} from 'lucide-react';

interface JupyterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JupyterExportModal: React.FC<JupyterExportModalProps> = ({ isOpen, onClose }) => {
  const {
    registeredPlugins,
    activePluginIds,
    inputSource,
    timeElapsed,
    currentRms,
    activePresetId,
  } = useAppStore();

  const [includeMetaGraph, setIncludeMetaGraph] = useState<boolean>(true);
  const [includeSessionData, setIncludeSessionData] = useState<boolean>(true);
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  // Lazy compilation state: avoid serializing on mount so the modal opens instantly
  const [compiledJson, setCompiledJson] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Invalidate compiled notebook whenever export options change
  useEffect(() => {
    setCompiledJson(null);
  }, [includeMetaGraph, includeSessionData, activeOnly, activePluginIds]);

  // Reset tab and compiled cache on open/close
  useEffect(() => {
    if (isOpen) {
      setActiveTab('preview');
      setCompiledJson(null);
      setIsCompiling(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pluginsToExport = activeOnly
    ? registeredPlugins.filter((p) => activePluginIds.includes(p.id))
    : registeredPlugins;

  const exportOptions: NotebookExportOptions = {
    includeMetaGraph,
    includeSessionData,
    activeOnly,
    sessionMetrics: {
      inputSource,
      elapsedSeconds: Math.round(timeElapsed * 10) / 10,
      currentRms: Math.round(currentRms * 1000) / 1000,
      activePreset: activePresetId,
    },
  };

  // Helper to lazily compile or return existing cached JSON
  const getOrCompileJson = (): string => {
    if (compiledJson) return compiledJson;
    const json = generateJupyterNotebook(pluginsToExport, exportOptions);
    setCompiledJson(json);
    return json;
  };

  // Switch to Raw JSON tab with lazy compilation on click
  const handleSelectJsonTab = () => {
    setActiveTab('json');
    if (!compiledJson) {
      setIsCompiling(true);
      setTimeout(() => {
        const json = generateJupyterNotebook(pluginsToExport, exportOptions);
        setCompiledJson(json);
        setIsCompiling(false);
      }, 10);
    }
  };

  // Lazy compile on download click
  const handleDownload = () => {
    const json = getOrCompileJson();
    const blob = new Blob([json], { type: 'application/x-ipynb+json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `presonance_vocal_analysis_${dateStr}.ipynb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Lazy compile on copy click
  const handleCopy = () => {
    const json = getOrCompileJson();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-sm">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Emit Academic Jupyter Notebook</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  Jupyter Notebook v7 (.ipynb)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Export complete, executable Python DSP pipelines, citations, and NetworkX meta-graphs for Jupyter Notebook v7
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls & Options Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeMetaGraph}
                onChange={(e) => setIncludeMetaGraph(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
              <span className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-purple-400" />
                NetworkX Meta-Graph
              </span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSessionData}
                onChange={(e) => setIncludeSessionData(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Synthetic Test Signals &amp; Figures
              </span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-800"
              />
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Active Modules Only ({pluginsToExport.length})
              </span>
            </label>
          </div>

          {/* Segmented View Switch (Outline vs Raw JSON) */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Cell Outline</span>
            </button>
            <button
              onClick={handleSelectJsonTab}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'json'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Raw JSON</span>
            </button>
          </div>
        </div>

        {/* Modal Body Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 font-mono text-xs text-slate-300">
          {activeTab === 'preview' && (
            <div className="space-y-4 max-w-3xl mx-auto font-sans">
              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  Markdown Cell [1]
                </span>
                <h3 className="text-base font-bold text-white">
                  presonance: intersectional vocal analysis
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full methodological introduction, academic framing, and research citations.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block mb-1">
                  Code Cell [2] · Environment Setup
                </span>
                <pre className="text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto">
{`!pip install -q numpy scipy librosa matplotlib seaborn networkx pandas
import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import networkx as nx`}
                </pre>
              </div>

              {includeMetaGraph && (
                <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px]">
                  <span className="text-[10px] text-purple-400 uppercase tracking-wider block mb-1">
                    Code Cell [3] · NetworkX Epistemic Meta-Graph
                  </span>
                  <div className="text-slate-400 mb-2 font-sans text-xs">
                    Renders dynamic directed graph connecting {pluginsToExport.length} research studies, demographic cohorts, and acoustic widgets.
                  </div>
                  <pre className="text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto">
{`G = nx.DiGraph()
# Graph nodes: Research, Widgets, Acoustic Features, Cohorts
# Matplotlib 2D force-directed layout`}
                  </pre>
                </div>
              )}

              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1">
                  Code Cell [4] · Complete Signal Processing Routines
                </span>
                <div className="text-slate-400 mb-2 font-sans text-xs">
                  Python implementations of autocorrelation ($F_0$), high-frequency fricative center-of-gravity (Zimman 2017), aperiodicity &amp; jitter (Becker 2023), formant estimation (Hancock 2020), and pitch break detection (Hodges-Simeon 2021).
                </div>
                <pre className="text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto">
{`extract_f0_autocorr(signal_segment, sr)
extract_sibilance_cog(signal_segment, sr, min_hz=4000, max_hz=8000)
extract_creak_and_jitter(signal_segment, sr)
extract_formants_lpc(signal_segment, sr)
detect_pitch_breaks(f0_series, threshold_semitones=4.8)`}
                </pre>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px]">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block mb-1">
                  Code Cell [5] · Multi-Panel Publication Figures &amp; CSV Export
                </span>
                <div className="text-slate-400 mb-2 font-sans text-xs">
                  Generates a 2×2 publication figure reproducing the exact 4 Resonance dashboards, and exports frame tokens to <code className="text-cyan-300">resonance_acoustic_export.csv</code>.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              {isCompiling ? (
                <div className="flex flex-col items-center justify-center p-16 space-y-3 font-sans text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs">Compiling Jupyter Notebook JSON schema...</span>
                </div>
              ) : (
                <pre className="p-4 bg-slate-950 rounded-lg overflow-x-auto text-[11px] text-slate-300 leading-relaxed max-h-[460px]">
                  {compiledJson || getOrCompileJson()}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            <span>{pluginsToExport.length} active modules</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download .ipynb File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
