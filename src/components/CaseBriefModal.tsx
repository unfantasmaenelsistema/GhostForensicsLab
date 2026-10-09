import React from 'react';
import {
  X,
  Shield,
  HardDrive,
  FileCode,
  Radio,
  Cloud,
  CheckCircle,
  ExternalLink,
  Terminal,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { CASE_METADATA } from '../data/forensicCaseData';
import { GhostLogo } from './GhostLogo';

interface CaseBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const CaseBriefModal: React.FC<CaseBriefModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-between sticky top-0 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] z-10">
          <div className="flex items-center gap-3">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-lg bg-[#f0883e]/20 border border-[#f0883e]/40 flex items-center justify-center p-1 hover:scale-105 transition-transform"
              title="Un Fantasma en el Sistema"
            >
              <GhostLogo className="w-9 h-9" />
            </a>
            <div>
              <h2 className="text-lg font-bold">Resumen del Expediente Forense</h2>
              <div className="text-xs text-[#8b949e] font-mono flex items-center gap-2">
                <span>{CASE_METADATA.caseId}</span>
                <span>&middot;</span>
                <a
                  href="https://www.unfantasmaenelsistema.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f0883e] hover:underline inline-flex items-center gap-1"
                >
                  <span>unfantasmaenelsistema.com</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm">
          {/* Executive Overview */}
          <div className="p-4 rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2 text-[#f0883e]">
              <AlertTriangle className="w-4 h-4 text-[#f0883e]" />
              Declaración del Incidente
            </h3>
            <p className="text-xs leading-relaxed text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">
              A las 02:40 UTC del 14 de marzo de 2026, el Centro de Operaciones de Seguridad (SOC) detectó una anomalía severa en el equipo
              <strong className="text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]"> {CASE_METADATA.victimHostname} </strong>:
              tráfico anómalo saliente hacia infraestructura no autorizada, seguido del vaciado abrupto de los registros de auditoría de Windows.
              Se procedió a la contención física de la máquina y a la adquisición forense de la memoria RAM y el disco en crudo según la norma ISO/IEC 27037.
            </p>
          </div>

          {/* Key Incident Parameters */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8b949e] mb-3">
              Parámetros de Investigación (Límites Ficticios Controlados RFC 5737)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e] block text-[11px]">Equipo Comprometido:</span>
                <span className="text-[#58a6ff] font-semibold">{CASE_METADATA.victimHostname} ({CASE_METADATA.victimIp})</span>
              </div>
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e] block text-[11px]">Usuario Comprometido:</span>
                <span className="text-[#f85149] font-semibold">{CASE_METADATA.compromisedUser}</span>
              </div>
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e] block text-[11px]">Ventana Temporal Relevante:</span>
                <span className="text-[#3fb950] font-semibold">{CASE_METADATA.incidentTimeRange}</span>
              </div>
              <div className="p-3 rounded bg-[#0d1117] border border-[#30363d]">
                <span className="text-[#8b949e] block text-[11px]">Sistema Operativo:</span>
                <span className="text-[#e6edf3] font-semibold">{CASE_METADATA.osVersion}</span>
              </div>
            </div>
          </div>

          {/* Chain of Custody & Evidence Hashes */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8b949e] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3fb950]" />
              Cadena de Custodia & Hashes SHA-256 de las Evidencias
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="flex justify-between items-center text-[#e6edf3]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <HardDrive className="w-3.5 h-3.5 text-[#58a6ff]" />
                    {CASE_METADATA.evidenceHashes.diskImage.filename}
                  </span>
                  <span className="text-[10px] text-[#3fb950]">VERIFICADO OK</span>
                </div>
                <div className="text-[10px] text-[#8b949e] mt-1 break-all">
                  SHA-256: {CASE_METADATA.evidenceHashes.diskImage.sha256}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="flex justify-between items-center text-[#e6edf3]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Terminal className="w-3.5 h-3.5 text-[#bc8cff]" />
                    {CASE_METADATA.evidenceHashes.memoryDump.filename}
                  </span>
                  <span className="text-[10px] text-[#3fb950]">VERIFICADO OK</span>
                </div>
                <div className="text-[10px] text-[#8b949e] mt-1 break-all">
                  SHA-256: {CASE_METADATA.evidenceHashes.memoryDump.sha256}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="flex justify-between items-center text-[#e6edf3]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Radio className="w-3.5 h-3.5 text-[#f0883e]" />
                    {CASE_METADATA.evidenceHashes.pcapCapture.filename}
                  </span>
                  <span className="text-[10px] text-[#3fb950]">VERIFICADO OK</span>
                </div>
                <div className="text-[10px] text-[#8b949e] mt-1 break-all">
                  SHA-256: {CASE_METADATA.evidenceHashes.pcapCapture.sha256}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                <div className="flex justify-between items-center text-[#e6edf3]">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Cloud className="w-3.5 h-3.5 text-[#d29922]" />
                    {CASE_METADATA.evidenceHashes.cloudTrailLog.filename}
                  </span>
                  <span className="text-[10px] text-[#3fb950]">VERIFICADO OK</span>
                </div>
                <div className="text-[10px] text-[#8b949e] mt-1 break-all">
                  SHA-256: {CASE_METADATA.evidenceHashes.cloudTrailLog.sha256}
                </div>
              </div>
            </div>
          </div>

          {/* Tools Simulated */}
          <div className="p-4 rounded-lg bg-[#21262d]/50 border border-[#30363d]">
            <h4 className="font-semibold text-xs text-[#e6edf3] mb-2">
              Herramientas Gratuitas y FOSS que emula este simulador (Ghost Academy DFIR):
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">Volatility3 (RAM)</span>
              <span className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">Wireshark & Zeek (Red)</span>
              <span className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">Eric Zimmerman Tools (MFTECmd, RECmd, PECmd)</span>
              <span className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">EvtxECmd / Hayabusa (Event Logs)</span>
              <span className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">AWS CloudTrail JSON CLI</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-between bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff]">
          <span className="text-xs text-[#8b949e]">
            Comienza por el Timeline o pasa directamente al Modo Investigación.
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('investigation');
              }}
              className="px-4 py-2 rounded-lg bg-[#f0883e] hover:bg-[#d2732e] text-white font-medium text-xs transition-colors"
            >
              Comenzar Investigación Interactiva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
