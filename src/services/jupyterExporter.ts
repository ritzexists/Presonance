/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IVoicePlugin } from '../types';
import { generateMetaGraphData } from './metaGraphGenerator';

export interface NotebookExportOptions {
  includeSessionData: boolean;
  includeMetaGraph: boolean;
  activeOnly: boolean;
  customTitle?: string;
  sessionMetrics?: {
    inputSource: string;
    elapsedSeconds: number;
    currentRms: number;
    activePreset?: string;
  };
}

export function generateJupyterNotebook(
  plugins: IVoicePlugin[],
  options: NotebookExportOptions
): string {
  const selectedPlugins = options.activeOnly ? plugins : plugins;
  const graphData = generateMetaGraphData(selectedPlugins);

  const cells: any[] = [];

  const addMarkdown = (content: string) => {
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: content.split('\n').map((line, idx, arr) => (idx < arr.length - 1 ? line + '\n' : line)),
    });
  };

  const addCode = (code: string) => {
    cells.push({
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: code.split('\n').map((line, idx, arr) => (idx < arr.length - 1 ? line + '\n' : line)),
    });
  };

  // 1. Header & Overview
  addMarkdown(`# presonance: intersectional vocal analysis
**Jupyter Notebook v7 Series · Reproducible Acoustic Signal Processing & Epistemic Network Graph**

Generated from the *presonance* Web Application on ${new Date().toISOString().split('T')[0]}.

This notebook provides complete, reproducible Python implementations for analyzing acoustic human voice features across expansive gender definitions (transgender, non-binary, cisgender) and intersecting sociodemographic factors. Every analysis module is explicitly linked to published academic citations.`);

  // 2. Dependencies Setup
  addMarkdown(`## 1. Environment Setup & Dependencies
Install required digital signal processing, visualization, and network analysis libraries.`);

  addCode(`!pip install -q numpy scipy librosa matplotlib seaborn networkx pandas

import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
import pandas as pd

# Configure publication-grade plot styles
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 140
print("Environment successfully initialized.")`);

  // 3. Epistemic Research Grounding
  let researchMarkdown = `## 2. Epistemic Research Citations & Demographic Scopes\n\n`;
  selectedPlugins.forEach((plugin, i) => {
    researchMarkdown += `### Plugin ${i + 1}: ${plugin.name}\n`;
    researchMarkdown += `- **Paper Title**: "${plugin.research.title}"\n`;
    researchMarkdown += `- **Authors**: ${plugin.research.authors.join(', ')} (${plugin.research.year})\n`;
    researchMarkdown += `- **Journal**: *${plugin.research.journal}*\n`;
    researchMarkdown += `- **DOI**: [${plugin.research.doi}](https://doi.org/${plugin.research.doi})\n`;
    researchMarkdown += `- **Gender Scope**: ${plugin.demographics.genderScope.join(', ')}\n`;
    researchMarkdown += `- **Intersecting Factors**: ${plugin.demographics.intersectingFactors.join(' · ')}\n`;
    researchMarkdown += `- **Acoustic Features**: ${plugin.acousticFeaturesAnalyzed.join(', ')}\n`;
    researchMarkdown += `> *${plugin.research.abstractSnippet}*\n\n`;
  });
  addMarkdown(researchMarkdown);

  // 4. Meta-Graph Visualization (NetworkX)
  if (options.includeMetaGraph) {
    addMarkdown(`## 3. Epistemic Meta-Graph Representation
Visualize the demographic and academic relationships between active plugins, target cohorts, acoustic features, and research citations using NetworkX.`);

    const graphCode = `# Build Epistemic Network Graph from Resonance ontology
G = nx.DiGraph()

# Nodes configuration
nodes_data = ${JSON.stringify(
      graphData.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        group: n.group,
        color: n.color || '#94a3b8',
      })),
      null,
      2
    )}

# Edges configuration
edges_data = ${JSON.stringify(
      graphData.links.map((l) => ({
        source: l.source,
        target: l.target,
        label: l.label,
      })),
      null,
      2
    )}

for node in nodes_data:
    G.add_node(node['id'], label=node['label'], group=node['group'], color=node['color'])

for edge in edges_data:
    G.add_edge(edge['source'], edge['target'], label=edge['label'])

plt.figure(figsize=(12, 8))
pos = nx.spring_layout(G, k=1.2, seed=42)

# Extract node colors
node_colors = [G.nodes[n]['color'] for n in G.nodes()]

nx.draw_networkx_nodes(G, pos, node_size=1200, node_color=node_colors, alpha=0.9, edgecolors='#1e293b')
nx.draw_networkx_edges(G, pos, arrowstyle='->', arrowsize=14, edge_color='#64748b', alpha=0.6, width=1.5)

# Labels
labels = {n: G.nodes[n]['label'] for n in G.nodes()}
nx.draw_networkx_labels(G, pos, labels=labels, font_size=8, font_weight='bold')

edge_labels = {(u, v): d['label'] for u, v, d in G.edges(data=True)}
nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=7, font_color='#475569')

plt.title("presonance Epistemic Meta-Graph: Research, Cohorts, Features & Widgets", fontsize=13, fontweight='bold', pad=15)
plt.axis('off')
plt.tight_layout()
plt.show()`;

    addCode(graphCode);
  }

  // 5. Digital Signal Processing Implementations
  addMarkdown(`## 4. Acoustic Signal Processing Algorithms
The following Python functions implement the exact signal processing routines from the Resonance modules.`);

  const dspCode = `def extract_f0_autocorr(signal_segment, sr, min_f0=70, max_f0=450):
    """
    Normalized autocorrelation for fundamental frequency (F0) estimation.
    """
    min_lag = int(sr / max_f0)
    max_lag = int(sr / min_f0)
    
    # Check RMS energy threshold
    rms = np.sqrt(np.mean(signal_segment**2))
    if rms < 0.015:
        return 0.0, 0.0
    
    autocorr = signal.correlate(signal_segment, signal_segment, mode='full')
    autocorr = autocorr[len(signal_segment)-1:]
    
    # Search within pitch period lag window
    search_window = autocorr[min_lag:max_lag]
    if len(search_window) == 0:
        return 0.0, 0.0
        
    best_lag = np.argmax(search_window) + min_lag
    confidence = autocorr[best_lag] / (autocorr[0] + 1e-12)
    
    if confidence > 0.45:
        return float(sr / best_lag), float(confidence)
    return 0.0, float(confidence)


def extract_sibilance_cog(signal_segment, sr, min_hz=4000, max_hz=8000):
    """
    Computes spectral center of gravity (COG) focused on sibilant energy (Zimman 2017).
    """
    n_fft = 1024
    freqs = np.fft.rfftfreq(n_fft, d=1.0/sr)
    fft_mag = np.abs(np.fft.rfft(signal_segment * np.hanning(len(signal_segment)), n=n_fft))
    
    band_mask = (freqs >= min_hz) & (freqs <= max_hz)
    band_energy = np.sum(fft_mag[band_mask])
    total_energy = np.sum(fft_mag)
    
    if band_energy > 0:
        cog = np.sum(freqs[band_mask] * fft_mag[band_mask]) / band_energy
    else:
        cog = 5500.0
        
    is_sibilant = (band_energy / (total_energy + 1e-12)) > 0.25
    return float(cog), bool(is_sibilant)


def extract_creak_and_jitter(signal_segment, sr):
    """
    Aperiodic phonation and cycle-to-cycle perturbation detector (Becker et al. 2023).
    """
    # 1. Zero crossing rate
    zcr = np.mean(np.diff(np.sign(signal_segment)) != 0)
    
    # 2. Peak-to-peak period variance (Jitter)
    peaks, _ = signal.find_peaks(signal_segment, height=0.04, distance=sr//500)
    jitter = 0.0
    if len(peaks) >= 4:
        periods = np.diff(peaks)
        if len(periods) > 1 and np.mean(periods) > 0:
            jitter = float(np.mean(np.abs(np.diff(periods))) / np.mean(periods)) * 100.0
            
    # 3. Low-frequency energy ratio (<100Hz)
    n_fft = 1024
    freqs = np.fft.rfftfreq(n_fft, d=1.0/sr)
    fft_mag = np.abs(np.fft.rfft(signal_segment, n=n_fft))
    low_energy = np.sum(fft_mag[freqs < 120])
    total_energy = np.sum(fft_mag) + 1e-12
    low_ratio = float(low_energy / total_energy)
    
    is_creaky = (jitter > 4.5 and low_ratio > 0.22)
    return is_creaky, jitter, low_ratio


def extract_formants_lpc(signal_segment, sr):
    """
    Formant estimation (F1, F2, F3) via spectral peak tracking (Hancock & Garabedian 2020).
    """
    n_fft = 1024
    freqs = np.fft.rfftfreq(n_fft, d=1.0/sr)
    fft_mag = np.abs(np.fft.rfft(signal_segment * np.hanning(len(signal_segment)), n=n_fft))
    
    # Formant search bands: F1 (250-950 Hz), F2 (950-2500 Hz), F3 (2300-3600 Hz)
    f1_mask = (freqs >= 250) & (freqs <= 950)
    f2_mask = (freqs > 950) & (freqs <= 2500)
    f3_mask = (freqs > 2300) & (freqs <= 3600)
    
    f1 = float(freqs[f1_mask][np.argmax(fft_mag[f1_mask])]) if np.any(f1_mask) else 500.0
    f2 = float(freqs[f2_mask][np.argmax(fft_mag[f2_mask])]) if np.any(f2_mask) else 1500.0
    f3 = float(freqs[f3_mask][np.argmax(fft_mag[f3_mask])]) if np.any(f3_mask) else 2500.0
    
    dispersion = ((f2 - f1) + (f3 - f2)) / 2.0
    return f1, f2, f3, dispersion


def detect_pitch_breaks(f0_series, threshold_semitones=4.8):
    """
    Detects abrupt non-linear pitch breaks / octave jumps (Hodges-Simeon et al. 2021).
    """
    breaks = []
    for i in range(1, len(f0_series)):
        f_prev = f0_series[i-1]
        f_curr = f0_series[i]
        if f_prev > 60 and f_curr > 60:
            semitones = 12.0 * np.log2(f_curr / f_prev)
            if abs(semitones) >= threshold_semitones:
                breaks.append({'index': i, 'delta_semitones': semitones, 'f0': f_curr})
    return breaks

print("DSP routines defined successfully.")`;
  addCode(dspCode);

  // 6. Synthetic Test Signal & Multi-Panel Analysis
  addMarkdown(`## 5. Sociophonetic Analysis & Publication-Ready Visualizations
Simulate a dynamic sociophonetic vocal signal and execute the 4 analysis pipelines.`);

  const simulationCode = `# Generate synthetic sociophonetic test audio (10 seconds @ 44.1 kHz)
sr = 44100
duration = 10.0
t = np.linspace(0, duration, int(sr * duration), endpoint=False)

# Synthesize signal combining modal phonation, high /s/ bricolage, creaky vocal fry, and pitch breaks
signal_audio = np.zeros_like(t)

for i in range(len(t)):
    ti = t[i]
    phase = ti % 2.5
    
    if phase < 1.4:
        # Modal vowel phonation
        f0 = 135 + 8 * np.sin(ti * 4)
        sample = 0.5 * np.sin(2 * np.pi * f0 * ti) + 0.3 * np.sin(4 * np.pi * f0 * ti)
        signal_audio[i] = sample * 0.4
    elif phase < 1.8:
        # Sharp /s/ sibilant fricative centered at 6.4 kHz (Zimman 2017)
        noise = (np.random.rand() * 2 - 1) * np.sin(2 * np.pi * 6400 * ti)
        signal_audio[i] = noise * 0.35
    else:
        # Creaky voice aperiodic pulse train (Becker et al. 2023)
        creak_f0 = 70 + 15 * np.sin(ti * 30)
        pulse = np.power(max(0, np.sin(2 * np.pi * creak_f0 * ti)), 8)
        signal_audio[i] = pulse * 0.45

# Add intentional octave jump pitch break at t=6.2s (Hodges-Simeon 2021)
break_indices = (t >= 6.0) & (t <= 6.5)
signal_audio[break_indices] *= np.sin(2 * np.pi * 280 * t[break_indices])

# Process in 50ms frames
frame_size = int(sr * 0.05)
hop_size = int(sr * 0.025)
frames = [signal_audio[i:i+frame_size] for i in range(0, len(signal_audio)-frame_size, hop_size)]
frame_times = [i * hop_size / sr for i in range(len(frames))]

f0_list = []
cog_list = []
is_sibilant_list = []
creak_list = []
f1_list, f2_list = [], []

for f in frames:
    f0, _ = extract_f0_autocorr(f, sr)
    cog, is_sib = extract_sibilance_cog(f, sr)
    is_creak, _, _ = extract_creak_and_jitter(f, sr)
    f1, f2, _, _ = extract_formants_lpc(f, sr)
    
    f0_list.append(f0)
    cog_list.append(cog)
    is_sibilant_list.append(is_sib)
    creak_list.append(is_creak)
    f1_list.append(f1)
    f2_list.append(f2)

# Generate 4-panel publication visualization
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 1. Zimman 2017: F0 vs /s/ COG
ax1 = axes[0, 0]
sib_f0 = [f0_list[i] for i in range(len(f0_list)) if is_sibilant_list[i] and f0_list[i] > 70]
sib_cog = [cog_list[i] for i in range(len(cog_list)) if is_sibilant_list[i] and f0_list[i] > 70]
ax1.scatter(sib_f0, sib_cog, c='#06b6d4', edgecolors='#0e7490', s=45, label='Measured Sibilant Tokens')
ax1.axvspan(110, 160, color='#06b6d4', alpha=0.15, label='Zimman Transmasc Bricolage')
ax1.axvspan(170, 220, color='#a855f7', alpha=0.1, label='Cisgender Baseline')
ax1.set_xlabel('Fundamental Frequency F0 (Hz)', fontweight='bold')
ax1.set_ylabel('/s/ Spectral COG (Hz)', fontweight='bold')
ax1.set_title('1. Stylistic Bricolage: F0 vs /s/ (Zimman 2017)', fontsize=11, fontweight='bold')
ax1.legend(loc='lower right', fontsize=8)

# 2. Becker 2023: Creaky Voice Timeline
ax2 = axes[0, 1]
ax2.plot(frame_times, [np.sqrt(np.mean(f**2)) for f in frames], color='#38bdf8', lw=1.5, label='Audio Envelope')
for i, is_cr in enumerate(creak_list):
    if is_cr:
        ax2.axvline(frame_times[i], color='#ef4444', alpha=0.25, lw=2)
ax2.set_xlabel('Time (seconds)', fontweight='bold')
ax2.set_ylabel('RMS Amplitude', fontweight='bold')
ax2.set_title('2. Aperiodic Phonation & Creak Tracking (Becker 2023)', fontsize=11, fontweight='bold')
ax2.legend(loc='upper right', fontsize=8)

# 3. Hancock 2020: Vowel Space F1 vs F2
ax3 = axes[1, 0]
ax3.scatter(f2_list, f1_list, c='#ec4899', alpha=0.4, s=30)
ax3.invert_xaxis()
ax3.invert_yaxis()
ax3.axvspan(2350, 1600, color='#ec4899', alpha=0.12, label='Transfeminine Resonance Target')
ax3.axvspan(1750, 950, color='#3b82f6', alpha=0.08, label='Masculine Baseline')
ax3.set_xlabel('F2 Formant (Hz) [Reversed: Front → Back]', fontweight='bold')
ax3.set_ylabel('F1 Formant (Hz) [Reversed: Close → Open]', fontweight='bold')
ax3.set_title('3. Formant Resonance & Vowel Space (Hancock 2020)', fontsize=11, fontweight='bold')
ax3.legend(loc='lower left', fontsize=8)

# 4. Hodges-Simeon 2021: Pitch Breaks
ax4 = axes[1, 1]
ax4.plot(frame_times, f0_list, color='#f59e0b', lw=1.8, label='F0 Contour')
breaks = detect_pitch_breaks(f0_list)
for b in breaks:
    t_brk = frame_times[b['index']]
    ax4.scatter(t_brk, b['f0'], color='#ef4444', s=90, zorder=5)
    ax4.text(t_brk, b['f0'] + 15, f"{b['delta_semitones']:+.1f} st", color='#dc2626', fontsize=8, fontweight='bold')
ax4.set_xlabel('Time (seconds)', fontweight='bold')
ax4.set_ylabel('F0 Frequency (Hz)', fontweight='bold')
ax4.set_title('4. T-Therapy Voice Chaos & Breaks (Hodges-Simeon 2021)', fontsize=11, fontweight='bold')
ax4.legend(loc='upper right', fontsize=8)

plt.tight_layout()
plt.show()`;
  addCode(simulationCode);

  // 7. DataFrame Summary
  addMarkdown(`## 6. Sociophonetic Statistical Summary
Tabulate acoustic measures into a Pandas DataFrame for downstream statistical tests or publication.`);

  const dfCode = `# Export computed frame features to Pandas DataFrame
df_acoustic = pd.DataFrame({
    'timestamp_sec': frame_times,
    'f0_hz': f0_list,
    'sibilance_cog_hz': cog_list,
    'is_sibilant': is_sibilant_list,
    'is_creaky': creak_list,
    'f1_hz': f1_list,
    'f2_hz': f2_list,
})

print("Dataset shape:", df_acoustic.shape)
print("\\nSummary Statistics:")
display(df_acoustic.describe().round(2))

# Save to CSV for statistical modeling (e.g. lme4 in R or statsmodels in Python)
df_acoustic.to_csv("presonance_acoustic_export.csv", index=False)
print("\\nSaved acoustic tokens to 'presonance_acoustic_export.csv'.")`;
  addCode(dfCode);

  // Return formatted JSON notebook adhering to Jupyter Notebook v7 series
  const notebook = {
    cells,
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3',
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3,
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.12.0',
      },
      jupyter: {
        notebook_version: '7.3.0',
        series: 'v7',
      },
      orig_nbformat: 4,
      presonance: {
        appVersion: '1.0.0',
        jupyterSeries: 'v7',
        generatedAt: new Date().toISOString(),
        pluginsCount: selectedPlugins.length,
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };

  return JSON.stringify(notebook, null, 2);
}
