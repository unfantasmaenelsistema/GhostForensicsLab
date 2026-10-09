import React from 'react';
import { ExternalLink, Shield, Download, Upload, HardDriveDownload, BookOpen } from 'lucide-react';
import { GhostLogo } from './GhostLogo';

interface FooterProps {
  onOpenBackupModal?: () => void;
  onOpenGlossary?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBackupModal, onOpenGlossary }) => {
  return (
    <footer className="mt-12 border-t border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] py-8 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand info */}
        <div className="flex items-center gap-3 text-center md:text-left">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-center p-1 shrink-0 transition-transform hover:scale-105"
            title="Un Fantasma en el Sistema"
          >
            <GhostLogo className="w-10 h-10 object-contain" />
          </a>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] text-sm">
                Ghost<span className="text-[#f0883e]">Forensics</span> Lab
              </span>
              <span className="text-[10px] text-[#8b949e]">por</span>
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f0883e] font-semibold hover:underline"
              >
                Un Fantasma en el Sistema
              </a>
            </div>
            <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">
              Simulador interactivo de investigación forense digital (DFIR) &middot; Ghost Academy (21 módulos prácticos).
            </p>
          </div>
        </div>

        {/* Action Buttons & External Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium">
          {onOpenGlossary && (
            <button
              onClick={onOpenGlossary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] hover:bg-[#21262d] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
              title="Abrir Glosario Forense Digital (MFT, EVTX, Amcache, Prefetch, Beaconing...)"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#3fb950]" />
              <span>Glosario DFIR</span>
            </button>
          )}

          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] hover:bg-[#21262d] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
              title="Guardar o cargar progreso del caso en archivo JSON local"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-[#f0883e]" />
              <span>Exportar / Importar JSON</span>
            </button>
          )}

          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#e6edf3] hover:text-[#f0883e] font-semibold transition-colors"
          >
            <span>Un Fantasma en el Sistema</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#f0883e]" />
          </a>

          <a
            href="https://ghostacademy.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#f0883e] transition-colors"
          >
            <span>Ghost Academy</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://www.ghostore.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#f0883e] transition-colors"
          >
            <span>Ghostore</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Mandatory Educational Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-4 border-t border-[#21262d] dark:border-[#21262d] light:border-[#d0d7de]/60 text-center">
        <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] max-w-3xl mx-auto leading-relaxed">
          <strong>Aviso legal & pedagógico:</strong> GhostForensics Lab es un simulador educativo de Ghost Academy. No sustituye herramientas forenses reales ni constituye un peritaje.
        </p>
      </div>
    </footer>
  );
};
