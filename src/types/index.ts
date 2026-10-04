/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Enums for standardizing graph nodes (as specified in System Specification)
export enum NodeType {
  COHORT = 'cohort',
  WIDGET = 'widget',
  RESEARCH = 'research',
  ACOUSTIC_FEATURE = 'acoustic_feature',
}

// The core research citation model
export interface ResearchCitation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  doi: string; // Must be valid DOI format
  journal: string;
  abstractSnippet: string;
  url?: string;
}

// The demographic intersection model
export interface DemographicIntersection {
  genderScope: string[]; // e.g., ['Transmasculine', 'Non-binary']
  intersectingFactors: string[]; // e.g., ['Early HRT', 'Age 18-25', 'AAVE speaker']
}

// The Plugin Interface
export interface IVoicePlugin {
  id: string;
  name: string;
  description: string;
  research: ResearchCitation;
  additionalResearch?: ResearchCitation[];
  demographics: DemographicIntersection;
  comparativeCohorts?: string[];
  acousticFeaturesAnalyzed: string[]; // e.g., ['F0', 'Formant Dispersion', 'Vocal Fry']

  // Audio processing hook/function
  processAudio: (audioData: Float32Array, sampleRate: number) => any;

  // React Component for the main dashboard
  WidgetComponent: React.FC<{ data: any; isLive: boolean }>;
}

// Models for the Meta Graph Dashboard
export interface ConnectedNodeSummary {
  id: string;
  label: string;
  group: NodeType;
  relationship: string;
}

export interface MetaNode {
  id: string;
  label: string;
  group: NodeType;
  metadata?: any;
  connectedNodes?: ConnectedNodeSummary[];
  // Simulation coordinate properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
  color?: string;
}

export interface MetaEdge {
  source: string; // Node ID
  target: string; // Node ID
  label: string; // e.g., "visualizes", "studies", "belongs to", "characterizes"
  relationshipType?: string;
}

export interface MetaGraphData {
  nodes: MetaNode[];
  links: MetaEdge[];
}

export type AudioInputSource = 'mic' | 'sample' | 'file';

export interface AudioSamplePreset {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  phenomenon: string;
  generateBuffer: (audioCtx: AudioContext) => AudioBuffer;
}
