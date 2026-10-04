/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IVoicePlugin } from '../types';
import { pluginSibilanceF0Zimman } from './pluginSibilanceZimman';
import { pluginCreakVariationistBecker } from './pluginCreakBecker';
import { pluginTransfemResonanceHancock } from './pluginTransfemResonance';
import { pluginTransmascInstabilityHodges } from './pluginTransmascInstability';
import { pluginAaveBaselineAerodynamicsSapienza } from './pluginAaveAerodynamics';
import { pluginJapaneseDutchPitchVanBezooijen } from './pluginCrossCulturalPitch';
import { pluginMandarinBilingualVoice } from './pluginBilingualMandarin';
import { pluginSpanishTvqMora } from './pluginSpanishTvq';
import { pluginAutisticPitchVonKriegstein } from './pluginAutisticPitch';
import { pluginCreakYuasaJapanese } from './pluginCreakYuasa';
import { pluginCochlearMandarinMahshie } from './pluginCochlearMandarin';
import { pluginAaveReadingF0Hudson } from './pluginAaveReadingF0';
import { pluginArabicF0Natour } from './pluginArabicF0';
import { pluginSingingFemininityMandarin } from './pluginSingingFemininity';
import { pluginTransmascRaterIdentity } from './pluginTransmascRaterIdentity';
import { pluginAgingTransF0Nishio } from './pluginAgingTransF0';

// Comprehensive PluginRegistry with all 16 epistemic sociophonetic plugins
export const BASE_PLUGINS: IVoicePlugin[] = [
  pluginSibilanceF0Zimman,
  pluginCreakVariationistBecker,
  pluginTransfemResonanceHancock,
  pluginTransmascInstabilityHodges,
  pluginAaveBaselineAerodynamicsSapienza,
  pluginJapaneseDutchPitchVanBezooijen,
  pluginMandarinBilingualVoice,
  pluginSpanishTvqMora,
  pluginAutisticPitchVonKriegstein,
  pluginCreakYuasaJapanese,
  pluginCochlearMandarinMahshie,
  pluginAaveReadingF0Hudson,
  pluginArabicF0Natour,
  pluginSingingFemininityMandarin,
  pluginTransmascRaterIdentity,
  pluginAgingTransF0Nishio,
];

export class PluginRegistry {
  private plugins: Map<string, IVoicePlugin> = new Map();

  constructor(initialPlugins: IVoicePlugin[] = BASE_PLUGINS) {
    initialPlugins.forEach((p) => this.plugins.set(p.id, p));
  }

  public getAll(): IVoicePlugin[] {
    return Array.from(this.plugins.values());
  }

  public get(id: string): IVoicePlugin | undefined {
    return this.plugins.get(id);
  }

  public register(plugin: IVoicePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public unregister(id: string): boolean {
    return this.plugins.delete(id);
  }
}

export const globalPluginRegistry = new PluginRegistry();
