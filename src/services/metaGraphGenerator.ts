/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IVoicePlugin,
  MetaGraphData,
  MetaNode,
  MetaEdge,
  NodeType,
  ConnectedNodeSummary,
} from '../types';

/**
 * Normalizes acoustic feature names into canonical epistemic feature entities.
 * This establishes true Many:Many links between different plugins, research papers, and cohorts.
 */
function getCanonicalFeature(featureName: string): { id: string; label: string; category: string } {
  const lower = featureName.toLowerCase();

  if (
    lower.includes('reading') &&
    (lower.includes('f0') || lower.includes('pitch') || lower.includes('fundamental'))
  ) {
    return {
      id: 'feature_f0_reading',
      label: 'Reading Modal F0 & Dispersion',
      category: 'Pitch & Dynamic Range',
    };
  }

  if (
    lower.includes('singing') &&
    (lower.includes('f0') || lower.includes('pitch') || lower.includes('femininity'))
  ) {
    return {
      id: 'feature_f0_singing',
      label: 'Singing F0 & Vibrato Modulation',
      category: 'Vocal Performance Acoustics',
    };
  }

  if (lower.includes('aging') || lower.includes('geriatric')) {
    return {
      id: 'feature_f0_aging',
      label: 'Longitudinal Aging F0 Shift',
      category: 'Lifespan Sociophonetics',
    };
  }

  if (
    lower.includes('f0') ||
    lower.includes('fundamental frequency') ||
    lower.includes('pitch') ||
    lower.includes('sff')
  ) {
    return {
      id: 'feature_f0',
      label: 'Speaking Fundamental Frequency (F0)',
      category: 'Pitch & Intonation',
    };
  }

  if (lower.includes('formant') || lower.includes('vowel')) {
    return {
      id: 'feature_formants',
      label: 'Formant Dispersion & Vowel Space (F1, F2)',
      category: 'Vocal Tract Resonance',
    };
  }

  if (
    lower.includes('sibilan') ||
    lower.includes('/s/') ||
    lower.includes('cog') ||
    lower.includes('center of gravity')
  ) {
    return {
      id: 'feature_sibilance_cog',
      label: 'Sibilance COG (/s/ Spectral Energy)',
      category: 'Articulatory & Stylistic Bricolage',
    };
  }

  if (
    lower.includes('creak') ||
    lower.includes('fry') ||
    lower.includes('aperiodic') ||
    lower.includes('pulse register') ||
    lower.includes('jitter')
  ) {
    return {
      id: 'feature_creak_fry',
      label: 'Aperiodic Phonation & Vocal Fry',
      category: 'Glottal Source Dynamics',
    };
  }

  if (
    lower.includes('break') ||
    lower.includes('instability') ||
    lower.includes('chaos') ||
    lower.includes('subharmonic')
  ) {
    return {
      id: 'feature_pitch_instability',
      label: 'Pitch Instability & Subharmonic Breaks',
      category: 'Laryngeal Biomechanics',
    };
  }

  if (
    lower.includes('flow') ||
    lower.includes('mfdr') ||
    lower.includes('open quotient') ||
    lower.includes('aerodynamic')
  ) {
    return {
      id: 'feature_glottal_aerodynamics',
      label: 'Glottal Aerodynamics (MFDR & Oq)',
      category: 'Glottal Airflow Dynamics',
    };
  }

  if (lower.includes('tilt') || lower.includes('spectral tilt') || lower.includes('vocal weight')) {
    return {
      id: 'feature_spectral_tilt',
      label: 'Spectral Tilt & Vocal Weight (H1–H2)',
      category: 'Spectral Envelope',
    };
  }

  if (lower.includes('tone') || lower.includes('lexical')) {
    return {
      id: 'feature_lexical_tones',
      label: 'Lexical Tone Pitch Contours',
      category: 'Tonal Phonology & Prosody',
    };
  }

  if (lower.includes('sigma') || lower.includes('prosod') || lower.includes('affect')) {
    return {
      id: 'feature_pitch_sigma',
      label: 'Pitch Sigma (Melodic Variance)',
      category: 'Affective Prosody & Neurodiversity',
    };
  }

  if (
    lower.includes('cochlear') ||
    lower.includes('implant') ||
    lower.includes('channel') ||
    lower.includes('categorical')
  ) {
    return {
      id: 'feature_ci_quantization',
      label: 'CI Electrode Quantization Bands',
      category: 'Bimodal Auditory Perception',
    };
  }

  if (lower.includes('vibrato')) {
    return {
      id: 'feature_vibrato',
      label: 'Vibrato Rate & Extent',
      category: 'Vocal Performance Acoustics',
    };
  }

  const id = `feature_${featureName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return { id, label: featureName, category: 'Acoustic Metric' };
}

/**
 * Normalizes demographic intersection factors into canonical socio-demographic cohort entities.
 * Enables multiple research papers, features, and widgets to link to the exact same cohorts.
 */
function getCanonicalCohort(name: string): { id: string; label: string; category: string } {
  const lower = name.toLowerCase();

  if (lower.includes('transmasc') || lower.includes('trans men') || lower.includes('trans man')) {
    return {
      id: 'cohort_transmasculine',
      label: 'Transmasculine / Trans Men',
      category: 'Gender Identity',
    };
  }
  if (lower.includes('transfem') || lower.includes('trans women') || lower.includes('trans woman')) {
    return {
      id: 'cohort_transfeminine',
      label: 'Transfeminine / Trans Women',
      category: 'Gender Identity',
    };
  }
  if (lower.includes('non-binary') || lower.includes('gender expansive')) {
    return {
      id: 'cohort_nonbinary',
      label: 'Non-Binary / Gender Expansive',
      category: 'Gender Identity',
    };
  }
  if (lower.includes('african american') || lower.includes('black') || lower.includes('aave')) {
    return {
      id: 'cohort_african_american',
      label: 'African American / Black Adults',
      category: 'Race, Ethnicity & Culture',
    };
  }
  if (lower.includes('japanese')) {
    return {
      id: 'cohort_japanese',
      label: 'Japanese Sociolinguistic Cohort',
      category: 'Linguistic & Geographic Culture',
    };
  }
  if (lower.includes('dutch')) {
    return {
      id: 'cohort_dutch',
      label: 'Dutch Sociolinguistic Cohort',
      category: 'Linguistic & Geographic Culture',
    };
  }
  if (lower.includes('mandarin') || lower.includes('bilingual')) {
    return {
      id: 'cohort_mandarin_bilingual',
      label: 'Mandarin/English Bilingual Speakers',
      category: 'Linguistic & Geographic Culture',
    };
  }
  if (lower.includes('spanish') || lower.includes('hispanophone')) {
    return {
      id: 'cohort_spanish',
      label: 'Spanish / Hispanophone Speakers',
      category: 'Linguistic & Geographic Culture',
    };
  }
  if (lower.includes('arabic') || lower.includes('jordanian')) {
    return {
      id: 'cohort_arabic',
      label: 'Jordanian Arabic Speakers',
      category: 'Linguistic & Geographic Culture',
    };
  }
  if (lower.includes('autistic') || lower.includes('neurodivergent') || lower.includes('alexithymia')) {
    return {
      id: 'cohort_neurodivergent',
      label: 'Autistic & Neurodivergent Individuals',
      category: 'Neurodivergence & Affect',
    };
  }
  if (
    lower.includes('cochlear') ||
    lower.includes('deaf') ||
    lower.includes('hard of hearing') ||
    lower.includes('hoh')
  ) {
    return {
      id: 'cohort_deaf_hoh',
      label: 'Deaf / HoH & Cochlear Implant Users',
      category: 'Sensory & Auditory Modality',
    };
  }
  if (
    lower.includes('aging') ||
    lower.includes('older') ||
    lower.includes('60+') ||
    lower.includes('geriatric')
  ) {
    return {
      id: 'cohort_aging',
      label: 'Aging Population (60+ Years)',
      category: 'Age & Longitudinal Lifespan',
    };
  }
  if (lower.includes('testosterone') || lower.includes('hrt')) {
    return {
      id: 'cohort_hrt',
      label: 'Testosterone HRT Trajectory',
      category: 'Endocrine & Medical Trajectory',
    };
  }
  if (lower.includes('singer') || lower.includes('singing')) {
    return {
      id: 'cohort_singers',
      label: 'Vocal Performers & Singers',
      category: 'Sociocultural Practice',
    };
  }
  if (lower.includes('multiracial') || lower.includes('rater') || lower.includes('listener')) {
    return {
      id: 'cohort_multiracial_raters',
      label: 'Cross-Racial Listeners & Raters',
      category: 'Perceiver Demographics',
    };
  }
  if (
    lower.includes('cisgender women') ||
    lower.includes('us english') ||
    lower.includes('white women') ||
    lower.includes('young adult')
  ) {
    return {
      id: 'cohort_cis_women_baseline',
      label: 'Cisgender Women Normative Baseline',
      category: 'Comparative Baseline',
    };
  }
  if (lower.includes('cisgender men') || lower.includes('arab men')) {
    return {
      id: 'cohort_cis_men_baseline',
      label: 'Cisgender Men Normative Baseline',
      category: 'Comparative Baseline',
    };
  }
  if (lower.includes('transgender')) {
    return {
      id: 'cohort_transgender_general',
      label: 'Transgender Community (General)',
      category: 'Gender Identity',
    };
  }

  const id = `cohort_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return { id, label: name, category: 'Demographic Cohort' };
}

/**
 * Dynamically computes an epistemic and sociodemographic Meta-Graph from active voice plugins,
 * supporting full Many:Many relationships between:
 * - ACOUSTIC FEATURES (n) <==> WIDGETS (m)
 * - ACOUSTIC FEATURES (n) <==> RESEARCH PAPERS (m)
 * - ACOUSTIC FEATURES (n) <==> DEMOGRAPHIC COHORTS (m)
 * - DEMOGRAPHIC COHORTS (n) <==> RESEARCH PAPERS (m)
 * - DEMOGRAPHIC COHORTS (n) <==> WIDGETS (m)
 * - RESEARCH PAPERS (n) <==> WIDGETS (m)
 * - RESEARCH PAPERS (n) <==> RESEARCH PAPERS (m) (Epistemic Cross-Citation Web)
 */
export function generateMetaGraphData(plugins: IVoicePlugin[]): MetaGraphData {
  const nodeMap = new Map<string, MetaNode>();
  const linkList: MetaEdge[] = [];

  const addNode = (node: MetaNode) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, { ...node, metadata: { ...node.metadata } });
    } else {
      // Merge metadata properties if node was already registered
      const existing = nodeMap.get(node.id)!;
      existing.metadata = {
        ...existing.metadata,
        ...node.metadata,
      };
    }
  };

  const addEdge = (source: string, target: string, label: string, relationshipType?: string) => {
    if (source === target) return;
    const exists = linkList.some(
      (l) => l.source === source && l.target === target && l.label === label
    );
    if (!exists) {
      linkList.push({ source, target, label, relationshipType });
    }
  };

  // Track associations per canonical node to calculate degrees & multi-links
  const featureToWidgets = new Map<string, Set<string>>();
  const featureToResearch = new Map<string, Set<string>>();
  const featureToCohorts = new Map<string, Set<string>>();
  const cohortToResearch = new Map<string, Set<string>>();
  const cohortToWidgets = new Map<string, Set<string>>();
  const researchToWidgets = new Map<string, Set<string>>();

  // 1. Process all active plugins into nodes & relationships
  plugins.forEach((plugin) => {
    // A. Widget Node
    const widgetNodeId = `widget_${plugin.id}`;
    addNode({
      id: widgetNodeId,
      label: `${plugin.name} Widget`,
      group: NodeType.WIDGET,
      color: '#10b981', // Emerald green
      metadata: {
        pluginId: plugin.id,
        name: plugin.name,
        description: plugin.description,
        features: plugin.acousticFeaturesAnalyzed,
        genderScope: plugin.demographics.genderScope,
        intersectingFactors: plugin.demographics.intersectingFactors,
      },
    });

    // B. Primary Research Node
    const primaryResearchId = `research_${plugin.research.id}`;
    addNode({
      id: primaryResearchId,
      label: `${plugin.research.authors[0].split(' ').pop()} (${plugin.research.year})`,
      group: NodeType.RESEARCH,
      color: '#a855f7', // Purple
      metadata: {
        pluginId: plugin.id,
        pluginName: plugin.name,
        ...plugin.research,
      },
    });

    // Widget -> implements -> Research (Many:Many)
    addEdge(widgetNodeId, primaryResearchId, 'implements', 'implements');
    if (!researchToWidgets.has(primaryResearchId)) researchToWidgets.set(primaryResearchId, new Set());
    researchToWidgets.get(primaryResearchId)!.add(widgetNodeId);

    // C. Additional Research Citations (if specified on plugin)
    if (plugin.additionalResearch && plugin.additionalResearch.length > 0) {
      plugin.additionalResearch.forEach((citation) => {
        const addlResearchId = `research_${citation.id}`;
        addNode({
          id: addlResearchId,
          label: `${citation.authors[0].split(' ').pop()} (${citation.year})`,
          group: NodeType.RESEARCH,
          color: '#c084fc', // Light purple
          metadata: {
            pluginId: plugin.id,
            pluginName: plugin.name,
            ...citation,
          },
        });
        addEdge(widgetNodeId, addlResearchId, 'informed by', 'implements');
        addEdge(primaryResearchId, addlResearchId, 'cross-references', 'cross_cites');
      });
    }

    // D. Extract & Canonicalize Acoustic Features (Many:Many)
    const canonicalFeatures = plugin.acousticFeaturesAnalyzed.map((feat) =>
      getCanonicalFeature(feat)
    );

    canonicalFeatures.forEach((feat) => {
      addNode({
        id: feat.id,
        label: feat.label,
        group: NodeType.ACOUSTIC_FEATURE,
        color: '#f59e0b', // Amber / Gold
        metadata: {
          featureCategory: feat.category,
        },
      });

      // Widget -> visualizes -> Feature
      addEdge(widgetNodeId, feat.id, 'visualizes', 'visualizes');
      if (!featureToWidgets.has(feat.id)) featureToWidgets.set(feat.id, new Set());
      featureToWidgets.get(feat.id)!.add(widgetNodeId);

      // Research -> defines / measures -> Feature
      addEdge(primaryResearchId, feat.id, 'defines', 'defines');
      if (!featureToResearch.has(feat.id)) featureToResearch.set(feat.id, new Set());
      featureToResearch.get(feat.id)!.add(primaryResearchId);
    });

    // E. Extract & Canonicalize Demographic Cohorts (Many:Many)
    const allCohortNames = [
      ...plugin.demographics.genderScope,
      ...plugin.demographics.intersectingFactors,
      ...(plugin.comparativeCohorts || []),
    ];

    const canonicalCohorts = allCohortNames.map((name) => getCanonicalCohort(name));

    canonicalCohorts.forEach((cohort) => {
      addNode({
        id: cohort.id,
        label: cohort.label,
        group: NodeType.COHORT,
        color: '#3b82f6', // Sapphire blue
        metadata: {
          cohortCategory: cohort.category,
        },
      });

      // Research -> studies -> Cohort (Many:Many)
      addEdge(primaryResearchId, cohort.id, 'studies', 'studies');
      if (!cohortToResearch.has(cohort.id)) cohortToResearch.set(cohort.id, new Set());
      cohortToResearch.get(cohort.id)!.add(primaryResearchId);

      // Widget -> benchmarks / targets -> Cohort (Many:Many)
      addEdge(widgetNodeId, cohort.id, 'benchmarks', 'benchmarks');
      if (!cohortToWidgets.has(cohort.id)) cohortToWidgets.set(cohort.id, new Set());
      cohortToWidgets.get(cohort.id)!.add(widgetNodeId);

      // Feature -> characterizes / norms -> Cohort (Many:Many)
      canonicalFeatures.forEach((feat) => {
        addEdge(feat.id, cohort.id, 'characterizes', 'characterizes');
        if (!featureToCohorts.has(feat.id)) featureToCohorts.set(feat.id, new Set());
        featureToCohorts.get(feat.id)!.add(cohort.id);
      });
    });
  });

  // 2. Epistemic Cross-Paper & Inter-Feature Relationship Web (Many:Many)
  // Connect research papers investigating shared theoretical frameworks
  const crossCitations: [string, string, string][] = [
    // Sapienza (1997) & Hudson (1981): Both establish African American normative acoustic baselines
    ['research_sapienza_1997_aave_aerodynamics', 'research_hudson_1981_aave_reading_f0', 'comparative AAVE baseline'],
    // Van Bezooijen (1995) & Yuasa (2010): Both study cross-cultural Japanese female vocal sociophonetics
    ['research_vanbezooijen_1995_cross_cultural_pitch', 'research_yuasa_2010_creak_japanese_us', 'cross-cultural sociophonetics'],
    // Zimman (2017) & Hodges-Simeon (2021): Both track transmasculine androgenic vocal shifts
    ['research_zimman_2017_bricolage', 'research_hodges_2021_pitch_instability', 'transmasculine HRT trajectory'],
    // Zimman (2017) & Hope & Lilley (2025): Sociophonetic style meets listener identity
    ['research_zimman_2017_bricolage', 'research_hope_2025_transmasc_rater_identity', 'stylistic bricolage & perception'],
    // Hancock (2020) & Mora (2017): Transfeminine vocal tract resonance & TVQ
    ['research_hancock_2020_formants', 'research_mora_2017_spanish_tvq', 'transfeminine acoustic targets'],
    // Becker (2023) & Yuasa (2010): Non-binary creak & gendered vocal fry
    ['research_becker_2023_creak', 'research_yuasa_2010_creak_japanese_us', 'creak indexicality'],
    // Li (2022) & Gu, Yin, Mahshie (2016): Mandarin tonal contours & perception
    ['research_li_2022_bilingual_mandarin_voice', 'research_gu_2016_ci_tonal_perception', 'tonal phonology & pitch jumps'],
    // Li (2022) & Interspeech (2023): Mandarin tone vs. Mandarin singing acoustics
    ['research_li_2022_bilingual_mandarin_voice', 'research_interspeech_2023_mandarin_singing_femininity', 'Mandarin speaking vs singing'],
    // Schelinski (2019) & Hodges-Simeon (2021): Prosodic variance and vocal stability
    ['research_schelinski_2019_autistic_pitch', 'research_hodges_2021_pitch_instability', 'pitch instability & variance'],
  ];

  crossCitations.forEach(([r1, r2, label]) => {
    if (nodeMap.has(r1) && nodeMap.has(r2)) {
      addEdge(r1, r2, label, 'cross_cites');
    }
  });

  // Cross-link acoustic features that co-vary in physiological production
  const featureCoVariations: [string, string, string][] = [
    ['feature_f0', 'feature_formants', 'vocal tract co-variation'],
    ['feature_f0', 'feature_sibilance_cog', 'independent stylistic bricolage'],
    ['feature_f0', 'feature_creak_fry', 'register transition (modal to pulse)'],
    ['feature_f0', 'feature_pitch_instability', 'subharmonic bifurcation'],
    ['feature_glottal_aerodynamics', 'feature_spectral_tilt', 'vocal fold adduction & tilt'],
    ['feature_f0', 'feature_vibrato', 'pitch modulation depth'],
    ['feature_lexical_tones', 'feature_ci_quantization', 'tonal contour discretization'],
    ['feature_pitch_sigma', 'feature_f0', 'pitch distribution variance'],
  ];

  featureCoVariations.forEach(([f1, f2, label]) => {
    if (nodeMap.has(f1) && nodeMap.has(f2)) {
      addEdge(f1, f2, label, 'co-varies with');
    }
  });

  // 3. Compile Many:Many relationship summaries onto every MetaNode
  nodeMap.forEach((node) => {
    const connectedSummaries: ConnectedNodeSummary[] = [];

    linkList.forEach((edge) => {
      let otherId: string | null = null;
      let relLabel = edge.label;

      if (edge.source === node.id) {
        otherId = edge.target;
      } else if (edge.target === node.id) {
        otherId = edge.source;
      }

      if (otherId && otherId !== node.id) {
        const otherNode = nodeMap.get(otherId);
        if (otherNode) {
          const alreadyAdded = connectedSummaries.some((s) => s.id === otherNode.id);
          if (!alreadyAdded) {
            connectedSummaries.push({
              id: otherNode.id,
              label: otherNode.label,
              group: otherNode.group,
              relationship: relLabel,
            });
          }
        }
      }
    });

    node.connectedNodes = connectedSummaries;

    // Categorized connected node counts
    const featureCount = connectedSummaries.filter((c) => c.group === NodeType.ACOUSTIC_FEATURE).length;
    const cohortCount = connectedSummaries.filter((c) => c.group === NodeType.COHORT).length;
    const researchCount = connectedSummaries.filter((c) => c.group === NodeType.RESEARCH).length;
    const widgetCount = connectedSummaries.filter((c) => c.group === NodeType.WIDGET).length;

    node.metadata = {
      ...node.metadata,
      connectedFeatures: connectedSummaries.filter((c) => c.group === NodeType.ACOUSTIC_FEATURE),
      connectedCohorts: connectedSummaries.filter((c) => c.group === NodeType.COHORT),
      connectedResearch: connectedSummaries.filter((c) => c.group === NodeType.RESEARCH),
      connectedWidgets: connectedSummaries.filter((c) => c.group === NodeType.WIDGET),
      degree: connectedSummaries.length,
      counts: {
        features: featureCount,
        cohorts: cohortCount,
        research: researchCount,
        widgets: widgetCount,
      },
    };
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: linkList,
  };
}
