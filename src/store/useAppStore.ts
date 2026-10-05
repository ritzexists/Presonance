/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { IVoicePlugin, MetaNode, AudioInputSource } from '../types';
import { BASE_PLUGINS, globalPluginRegistry } from '../plugins';
import { globalAudioEngine } from '../services/audioEngine';

export type ThemeId =
  | 'slate'
  | 'baroque-maximalist'
  | 'y2k-maximalist'
  | 'duck-quack'
  | 'synthwave-84'
  | 'phosphor-amber'
  | 'alabaster-light'
  | 'silly-goose-light';

export const THEME_IDS: ThemeId[] = [
  'slate',
  'baroque-maximalist',
  'y2k-maximalist',
  'duck-quack',
  'synthwave-84',
  'phosphor-amber',
  'alabaster-light',
  'silly-goose-light',
];

interface AppState {
  currentView: 'dashboard' | 'meta';
  registeredPlugins: IVoicePlugin[];
  activePluginIds: string[];
  selectedMetaNode: MetaNode | null;

  // Visual Theme State
  currentThemeId: ThemeId;

  // Audio Engine State
  isAudioRunning: boolean;
  inputSource: AudioInputSource;
  activePresetId: string;
  uploadedFileName: string | null;
  masterGain: number;
  currentRms: number;
  timeElapsed: number;
  micPermissionError: string | null;

  // Real-time analysis output per plugin id
  pluginData: Record<string, any>;

  // Jupyter Notebook Modal state
  isJupyterModalOpen: boolean;

  // Actions
  setView: (view: 'dashboard' | 'meta') => void;
  setJupyterModalOpen: (open: boolean) => void;
  togglePluginActive: (pluginId: string) => void;
  selectMetaNode: (node: MetaNode | null) => void;
  cycleTheme: () => void;
  setTheme: (themeId: ThemeId) => void;
  startAudio: () => Promise<boolean>;
  stopAudio: () => void;
  toggleAudio: () => Promise<void>;
  setInputSource: (source: AudioInputSource) => Promise<void>;
  setActivePreset: (presetId: string) => void;
  uploadFile: (file: File) => Promise<void>;
  setMasterGain: (gain: number) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Subscribe to audio engine frames
  globalAudioEngine.subscribeFrame((buffer, sampleRate, rms) => {
    const { registeredPlugins, activePluginIds } = get();
    const newData: Record<string, any> = {};

    registeredPlugins.forEach((plugin) => {
      if (activePluginIds.includes(plugin.id)) {
        try {
          newData[plugin.id] = plugin.processAudio(buffer, sampleRate);
        } catch (e) {
          console.error(`Error processing plugin ${plugin.id}:`, e);
        }
      }
    });

    const status = globalAudioEngine.getStatus();
    set({
      currentRms: rms,
      timeElapsed: status.elapsed,
      pluginData: newData,
    });
  });

  return {
    currentView: 'dashboard',
    registeredPlugins: BASE_PLUGINS,
    activePluginIds: BASE_PLUGINS.map((p) => p.id),
    selectedMetaNode: null,

    // Initial theme: slate
    currentThemeId: 'slate',

    isAudioRunning: false,
    inputSource: 'sample',
    activePresetId: 'preset_zimman',
    uploadedFileName: null,
    masterGain: 1.0,
    currentRms: 0,
    timeElapsed: 0,
    micPermissionError: null,
    pluginData: {},
    isJupyterModalOpen: false,

    setView: (view) => set({ currentView: view }),
    setJupyterModalOpen: (open) => set({ isJupyterModalOpen: open }),

    cycleTheme: () => {
      const { currentThemeId } = get();
      const currentIndex = THEME_IDS.indexOf(currentThemeId);
      const nextIndex = (currentIndex + 1) % THEME_IDS.length;
      const nextThemeId = THEME_IDS[nextIndex];

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextThemeId);
      }

      set({ currentThemeId: nextThemeId });
    },

    setTheme: (themeId: ThemeId) => {
      const targetThemeId = THEME_IDS.includes(themeId) ? themeId : THEME_IDS[0];
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', targetThemeId);
      }
      set({ currentThemeId: targetThemeId });
    },

    togglePluginActive: (pluginId) => {
      const { activePluginIds } = get();
      if (activePluginIds.includes(pluginId)) {
        if (activePluginIds.length <= 1) return; // Keep at least one active
        set({ activePluginIds: activePluginIds.filter((id) => id !== pluginId) });
      } else {
        set({ activePluginIds: [...activePluginIds, pluginId] });
      }
    },

    selectMetaNode: (node) => set({ selectedMetaNode: node }),

    startAudio: async () => {
      set({ micPermissionError: null });
      const ok = await globalAudioEngine.start();
      if (ok) {
        set({ isAudioRunning: true });
        return true;
      } else {
        if (get().inputSource === 'mic') {
          set({
            micPermissionError:
              'Microphone access blocked or unavailable. You can also analyze our simulated sociophonetic presets or upload an audio file.',
          });
        }
        set({ isAudioRunning: false });
        return false;
      }
    },

    stopAudio: () => {
      globalAudioEngine.stop();
      set({ isAudioRunning: false });
    },

    toggleAudio: async () => {
      const { isAudioRunning, startAudio, stopAudio } = get();
      if (isAudioRunning) {
        stopAudio();
      } else {
        await startAudio();
      }
    },

    setInputSource: async (source) => {
      const wasRunning = get().isAudioRunning;
      await globalAudioEngine.setInputSource(source);
      set({ inputSource: source, micPermissionError: null });
      if (wasRunning) {
        await get().startAudio();
      }
    },

    setActivePreset: (presetId) => {
      globalAudioEngine.setActivePresetId(presetId);
      set({ activePresetId: presetId });
    },

    uploadFile: async (file) => {
      try {
        const fileName = await globalAudioEngine.loadUserFile(file);
        set({
          inputSource: 'file',
          uploadedFileName: fileName,
          micPermissionError: null,
        });
        await get().startAudio();
      } catch (err: any) {
        console.error('Failed to load file:', err);
      }
    },

    setMasterGain: (gain) => {
      globalAudioEngine.setMasterGain(gain);
      set({ masterGain: gain });
    },
  };
});
