# Presonance: Intersectional Sociophonetic & Gender Vocal Analysis

> **Academic acoustic signal processing grounded in empirical gender-expansive and cross-cultural research.**

Presonance is a real-time sociophonetic research and vocal presentation analysis platform. Unlike conventional acoustic pitch monitors that reduce gender perception to a simplistic binary frequency threshold (e.g., 165 Hz), Presonance operationalizes vocal identity as an intersectional, multidimensional acoustic and sociolinguistic construct.

The application computes real-time digital signal processing (DSP) metrics across fundamental frequency, formant resonance, spectral tilt, fricative centroids, creak/fry dynamics, and vocal tract length estimates—directly correlated with peer-reviewed research across transmasculine, transfeminine, non-binary, Black/AAVE, cross-cultural, autistic, and aging demographic cohorts.

---

## Key Features

### 1. Analysis Dashboard & Multi-Source DSP Engine
- **Audio Inputs**: Live microphone input (with browser permissions management), uploaded audio files (`.wav`, `.mp3`), and high-fidelity synthetic sociophonetic test profiles.
- **Audio Controls**: Right-aligned master gain slider, live multi-segment VU meter, and responsive transport controls.
- **Dynamic Methodology Guide**: Interactive citation and research panel summarizing active demographic scopes, acoustic dimensions, and primary peer-reviewed literature.
- **Cohort Filtering**: Filter voice analysis modules across transmasculine, transfeminine, non-binary, African American / AAVE, cross-cultural, autistic, and aging cohorts.

### 2. 16 Grounded Research Plugins
Each analysis module implements validated sociophonetic algorithms derived directly from published literature:
- **Sibilance & Fricative Center of Gravity (COG)** (*Zimman, 2017*): Evaluates /s/ spectral peak, COG, and acoustic femininity/masculinity indices.
- **Creaky Voice & Non-Binary Phonetics** (*Becker, 2014*): Real-time vocal fry detection, low-frequency irregularity, and pitch floor tracking.
- **Vocal Tract Resonance & Formant Ratios** (*Hancock et al., 2014*): Formant dispersion ($F_1$–$F_3$) and acoustic femininity scale for transfeminine speakers.
- **F0 Instability & Vocal Break Detection** (*Hodges-Simeon et al., 2021*): Pitch jump detection, phonation breaks, and androgen-driven fundamental frequency destabilization.
- **Aerodynamic Vocal Profiles & AAVE Baseline** (*Sapienza, 1997*): Subglottal pressure estimates, maximum phonation times, and flow rates.
- **Cross-Cultural Pitch Variation** (*van Bezooijen, 1995*): Cultural pitch differences across Japanese and Dutch linguistic cohorts.
- **Bilingual Pitch & Register Shifting** (*Biemans, 2000*): Real-time fundamental frequency tracking across dual-language speakers.
- **Spanish Transgender Vocal Questionnaire (TVQ)** (*Mora et al., 2018*): Acoustic-perceptual self-evaluation correlations.
- **Autistic Prosody & Intonation Contours** (*von Kriegstein et al., 2007*): Pitch trajectory variance, prosodic expressiveness, and flat-contour scoring.
- **Japanese Cross-Gender Creak** (*Yuasa, 2010*): Age and sociolinguistic creak prevalence analysis.
- **Tone Perception & Production** (*Mahshie et al., 2013*): F0 slope and lexical tone trajectories.
- **Reading Passage F0 Norms in AAVE** (*Hudson & Holbrook, 1982*): Sentence-level baseline comparison.
- **Standard Arabic Pitch Norms** (*Natour & Wingate, 2009*): Semitone variance and cultural pitch baselines.
- **Singing Resonance & Formants** (*Sundberg, 1977*): Singer's formant cluster and resonance tuning.
- **Listener Rater Identity Dynamics** (*Cartei et al., 2019*): Perceptual evaluation modeling.
- **Aging Voice Pitch Trajectories** (*Nishio & Niimi, 2008*): Geriatric F0 stability and vocal drift metrics.

### 3. Epistemic Meta-Graph
- **Interactive Force-Directed Network**: Explorable 2D canvas mapping relationships between research citations, analysis widgets, demographic cohorts, and acoustic dimensions.
- **Dynamic Physics Controls**: Configurable Coulomb repulsion (50–8,000), Hooke spring tension, and velocity damping with continuous sliders and preset shortcuts (`Tight`, `Balanced`, `Wide`, `Ultra`).
- **Epistemic Drawer**: Deep inspection of Many-to-Many relational chips linking connected research nodes, cohorts, and acoustic variables.
- **Canvas Navigation**: Pan, zoom, node dragging, group filters, and search indexing.

### 4. Reproducible Research & Jupyter Notebook Export
- **One-Click Jupyter Export**: Generates a self-contained, reproducible Python Jupyter Notebook (`.ipynb`) mirroring active plugins and current settings.
- **Scientific Python Stack**: Includes complete runnable code using `librosa`, `parselmouth` (Praat), `scipy`, `numpy`, and `matplotlib`.

### 5. Multi-Theme Visual Design
Clicking the logo icon or brand title in the header cycles through eight custom visual themes:
- **Obsidian Phonetics** (Default dark theme with cyan luminescent accents)
- **Baroque Cyber-Phonetics** (Maximalist crushed amethyst, ornate gold borders, and gilded typography)
- **Y2K Cyber-Arcade Euphoria** (Maximalist neon acid lime, electric magenta, and high-contrast retro borders)
- **Quack-Sonance 🦆** (Humorous rubber-ducky theme with custom comic styling and transport buttons)
- **Synthwave 1984** (Retro outrun neon fuchsia, sunset amber gradient, and night-drive grid aesthetic)
- **Amber CRT Terminal** (1978 monochrome phosphor scanlines and warm amber glow)
- **Alabaster Scientific** (Clean high-contrast editorial research paper light theme)
- **Silly Goose Meadow** (Humorous sunny buttercup pasture light theme with honey-gold comic borders)

### 6. PWA & Offline Support
- Built-in service worker caching for offline readiness.
- One-click Progressive Web App (PWA) installation.
- Real-time offline indicator notification.

---

## Technology Stack

- **Framework**: React 19 + TypeScript (Vite)
- **State Management**: Zustand
- **Audio & DSP**: Web Audio API (AudioContext, AnalyserNode, ScriptProcessor/AudioWorklet, BiquadFilter, Fast Fourier Transform)
- **Styling**: Tailwind CSS with custom theme variables
- **Icons**: Lucide React
- **PWA**: `vite-plugin-pwa` with Workbox service worker generation

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd presonance

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Production Build
```bash
# Compile and package for production
npm run build

# Preview production build locally
npm run preview
```

---

## Sociophonetic Architecture

Presonance implements modular client-side signal processing pipelines:
1. **Time-Domain Buffer Acquisition**: Live frames captured at native sample rate (44.1 kHz / 48 kHz).
2. **Pitch Detection**: Autocorrelation and parabolic peak interpolation with octave jump mitigation.
3. **Formant Extraction**: Linear Predictive Coding (LPC) polynomial root solver calculating Formants $F_1$, $F_2$, and $F_3$.
4. **Spectral Moments**: Centroid, variance, skewness, and kurtosis computed across Hann-windowed FFT spectra.
5. **Perturbation Analysis**: Cycle-to-cycle amplitude perturbation (shimmer) and period perturbation (jitter).

---

## License

Apache-2.0
