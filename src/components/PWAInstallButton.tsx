/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Laptop, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed PWA, completely vanish from the DOM
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg text-cyan-200 bg-cyan-950/50 border border-cyan-800/60 hover:bg-cyan-900/60 hover:border-cyan-500/60 hover:text-white transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${className}`}
        title="Install Resonance as a Progressive Web App (Offline, Native Window, Desktop & Mobile)"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* Cross-Platform Installation Guidance Dialog */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install Resonance PWA</h3>
                  <p className="text-[11px] text-slate-400">Standalone offline-capable vocal analysis tool</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Smartphone className="w-4 h-4" />
                  <span>iOS Safari Installation</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong className="text-white">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> at the bottom or top of Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-pink-400" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Launch <strong className="text-white">Resonance</strong> directly from your home screen with zero browser address bars!
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Chrome / Edge / Desktop / Android */
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Laptop className="w-4 h-4" />
                  <span>Desktop &amp; Android Installation</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Look for the <strong className="text-white">Install</strong> icon <Download className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> in your browser address bar (top right on Chrome/Edge).
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Click <strong className="text-white">Install App</strong> to add Resonance to your desktop applications or Android launcher.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-mono text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Enjoy instant launch, microphone hardware access, and offline caching.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
