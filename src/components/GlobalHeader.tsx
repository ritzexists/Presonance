/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AUDIO_PRESETS } from '../services/audioEngine';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Mic,
  FileAudio,
  Play,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Upload,
  AlertCircle,
  Radio,
  FileCode,
} from 'lucide-react';

export const GlobalHeader: React.FC = () => {
  const {
    currentView,
    setView,
    isAudioRunning,
    toggleAudio,
    inputSource,
    setInputSource,
    activePresetId,
    setActivePreset,
    uploadFile,
    uploadedFileName,
    masterGain,
    setMasterGain,
    currentRms,
    timeElapsed,
    micPermissionError,
    activePluginIds,
    setJupyterModalOpen,
    currentThemeId,
    cycleTheme,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 w-full">
      {/* Primary Top Bar */}
      <div className="w-full px-2.5 sm:px-4 lg:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Primary Navigation Group: Analysis Dashboard, Meta Graph, Emit .ipynb, Volume, Install */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
          {/* Brand Logo & Title: Clicking icon or title cycles visual themes */}
          <button
            type="button"
            onClick={cycleTheme}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 mr-0.5 sm:mr-1 cursor-pointer group text-left transition-transform hover:opacity-90 active:scale-95 select-none"
            title={
              currentThemeId === 'duck-quack'
                ? 'Quack-Sonance 🦆 — 100% Peer-Quacked Acoustic Science! (Click to cycle themes)'
                : 'Presonance — Click icon or title to cycle visual themes'
            }
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border shadow-md flex items-center justify-center shrink-0 p-0.5 transition-all duration-200 group-hover:scale-105 ${
                currentThemeId === 'baroque-maximalist'
                  ? 'border-amber-400 bg-amber-950/80 shadow-amber-500/30'
                  : currentThemeId === 'y2k-maximalist'
                  ? 'border-pink-500 bg-purple-950/80 shadow-pink-500/40 ring-1 ring-lime-400/50'
                  : currentThemeId === 'duck-quack'
                  ? 'border-yellow-400 bg-yellow-950/80 shadow-yellow-500/40 ring-2 ring-yellow-400'
                  : currentThemeId === 'synthwave-84'
                  ? 'border-fuchsia-500 bg-purple-950/80 shadow-fuchsia-500/30'
                  : currentThemeId === 'phosphor-amber'
                  ? 'border-amber-500 bg-amber-950/80 shadow-amber-500/30'
                  : currentThemeId === 'alabaster-light'
                  ? 'border-sky-500 bg-white shadow-sky-500/20'
                  : currentThemeId === 'silly-goose-light'
                  ? 'border-amber-500 bg-amber-100 shadow-amber-400/50 ring-2 ring-orange-400'
                  : 'border-cyan-500/40 bg-slate-950 shadow-cyan-500/20'
              }`}
            >
              <img
                src="/vocal_neck_icon.jpg"
                alt="Presonance Vocal Tract and Neck Icon"
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                }}
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white block leading-none group-hover:text-cyan-300 transition-colors">
                {currentThemeId === 'duck-quack' ? 'Quack-Sonance 🦆' : 'Presonance'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5 hidden xs:block lowercase">
                {currentThemeId === 'duck-quack'
                  ? 'peer-quacked vocal acoustics 🦆'
                  : 'intersectional vocal analysis'}
              </span>
            </div>
          </button>

          {/* Navigation segmented switch */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setView('dashboard')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden md:inline">Analysis </span>Dashboard
            </button>
            <button
              onClick={() => setView('meta')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors ${
                currentView === 'meta'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Meta<span className="hidden md:inline"> Graph</span>
            </button>
          </div>

          {/* Emit Jupyter Notebook Action Button */}
          <button
            onClick={() => setJupyterModalOpen(true)}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg text-slate-200 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition-all flex items-center gap-1 sm:gap-1.5 shadow-sm shrink-0"
            title="Emit Python Jupyter Notebook (.ipynb) for reproducible sociophonetics research"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Emit .ipynb</span>
            <span className="sm:hidden">.ipynb</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>

        {/* Global Master Audio Input & Execution Controls (Only in Dashboard view) */}
        {currentView === 'dashboard' ? (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Source Toggle Selector */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setInputSource('sample')}
                className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                  inputSource === 'sample'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Use Sociophonetic Research Presets"
              >
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Presets</span>
              </button>

              <button
                onClick={() => setInputSource('mic')}
                className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                  inputSource === 'mic'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Use Live Microphone Input"
              >
                <Mic className="w-3 h-3" />
                <span className="hidden sm:inline">Mic</span>
              </button>

              <button
                onClick={() => {
                  setInputSource('file');
                  fileInputRef.current?.click();
                }}
                className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                  inputSource === 'file'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Upload Audio File (.wav, .mp3)"
              >
                <FileAudio className="w-3 h-3" />
                <span className="hidden sm:inline">{uploadedFileName ? 'File' : 'Upload'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Preset Selector Dropdown (when in sample mode) */}
            {inputSource === 'sample' && (
              <select
                value={activePresetId}
                onChange={(e) => setActivePreset(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 focus:outline-none focus:border-cyan-500 max-w-[130px] sm:max-w-[180px] lg:max-w-[210px] truncate"
                title="Select sociophonetic synthetic audio profile"
              >
                {AUDIO_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            )}

            {/* Gain / Volume Slider & VU Meter (Right-aligned, to the left of Play button) */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => setMasterGain(masterGain > 0 ? 0 : 1)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title={masterGain > 0 ? 'Mute' : 'Unmute'}
              >
                {masterGain === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={masterGain}
                onChange={(e) => setMasterGain(parseFloat(e.target.value))}
                className="w-12 sm:w-16 md:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                title={`Master Gain: ${(masterGain * 100).toFixed(0)}%`}
              />

              {/* Live VU Meter LED Bar */}
              <div className="flex items-end gap-0.5 h-3.5 sm:h-4 w-8 sm:w-10 md:w-12 bg-slate-900 p-0.5 rounded border border-slate-800/80">
                {[0.05, 0.15, 0.3, 0.5, 0.75].map((thresh, idx) => {
                  const active = isAudioRunning && currentRms >= thresh;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-xs transition-colors duration-75 ${
                        active
                          ? idx > 3
                            ? 'bg-rose-500'
                            : idx > 2
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${(idx + 1) * 20}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Master Play/Pause Toggle Button */}
            <button
              onClick={toggleAudio}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all shadow-md shrink-0 ${
                isAudioRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/20'
              }`}
            >
              {isAudioRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {currentThemeId === 'duck-quack'
                      ? 'HONK'
                      : inputSource === 'mic'
                      ? 'START MIC'
                      : 'PLAY'}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-pulse" />
            <span className="tracking-wider uppercase text-slate-300">
              {currentThemeId === 'duck-quack' ? 'Epistemic Quack-Graph 🦆' : 'Epistemic Meta-Graph'}
            </span>
          </div>
        )}
      </div>

      {/* Mic Permission Warning Banner if blocked (Only in Dashboard view) */}
      {currentView === 'dashboard' && micPermissionError && (
        <div className="bg-amber-950/80 border-t border-amber-800/60 px-3 sm:px-5 py-2 text-xs text-amber-200 flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{micPermissionError}</span>
          </div>
          <button
            onClick={() => setInputSource('sample')}
            className="underline font-semibold hover:text-white"
          >
            Switch to Presets
          </button>
        </div>
      )}

      {/* Secondary Status Ribbon (Only in Dashboard view) */}
      {currentView === 'dashboard' && (
        <div className="bg-slate-950/60 border-t border-slate-800/60 px-3 sm:px-5 py-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAudioRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
              <span className="uppercase text-slate-300">
                {currentThemeId === 'duck-quack'
                  ? isAudioRunning
                    ? 'QUACK STREAM ACTIVE 🦆'
                    : 'POND STANDBY 🦆'
                  : isAudioRunning
                  ? 'STREAM ACTIVE'
                  : 'IDLE / STANDBY'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <span>SOURCE:</span>
              <span className="text-slate-200 font-semibold uppercase">
                {inputSource === 'mic'
                  ? currentThemeId === 'duck-quack'
                    ? 'MALLARD MIC 🦆'
                    : 'MICROPHONE'
                  : inputSource === 'file'
                  ? `FILE (${uploadedFileName || 'CUSTOM'})`
                  : currentThemeId === 'duck-quack'
                  ? 'POND SYNTHETICS'
                  : 'SYNTHETIC PRESET'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <span>{currentThemeId === 'duck-quack' ? 'DUCKS IN A ROW:' : 'PLUGINS ACTIVE:'}</span>
              <span className="text-cyan-400 font-semibold">{activePluginIds.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>RMS:</span>
              <span className="text-slate-200">{currentRms.toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>TIME:</span>
              <span className="text-cyan-300 font-semibold">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
