import React from 'react';
import {
  Clock,
  Database,
  FileText,
  Cpu,
  Radio,
  Cloud,
  CheckCircle2,
  FileCheck,
  Sun,
  Moon,
  Info,
  Shield,
  HelpCircle,
  RotateCcw,
  HardDriveDownload,
  ExternalLink,
  BookOpen,
  Search
} from 'lucide-react';
import { GhostLogo } from './GhostLogo';

export type ActiveTab =
  | 'timeline'
  | 'registry'
  | 'events'
  | 'memory'
  | 'network'
  | 'cloud'
  | 'investigation'
  | 'report';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenBrief: () => void;
  onOpenBackupModal: () => void;
  onOpenGlossary: () => void;
  onOpenSearch: () => void;
  solvedCount: number;
  totalQuestions: number;
  onResetInvestigation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onOpenBrief,
  onOpenBackupModal,
  onOpenGlossary,
  onOpenSearch,
  solvedCount,
  totalQuestions,
  onResetInvestigation
}) => {
  const tabs = [
    {
      id: 'timeline' as ActiveTab,
      label: 'Timeline',
      icon: Clock,
      badge: '17 evts'
    },
    {
      id: 'registry' as ActiveTab,
      label: 'Registro',
      icon: Database,
      badge: '4 hives'
    },
    {
      id: 'events' as ActiveTab,
      label: 'Event Logs',
      icon: FileText,
      badge: 'EVTX'
    },
    {
      id: 'memory' as ActiveTab,
      label: 'Memoria & Procesos',
      icon: Cpu,
      badge: 'Vol3'
    },
    {
      id: 'network' as ActiveTab,
      label: 'Red & C2',
      icon: Radio,
      badge: 'Wireshark'
    },
    {
      id: 'cloud' as ActiveTab,
      label: 'CloudTrail',
      icon: Cloud,
      badge: 'AWS'
    },
    {
      id: 'investigation' as ActiveTab,
      label: 'Modo Investigación',
      icon: CheckCircle2,
      badge: `${solvedCount}/${totalQuestions}`,
      highlight: true
    },
    {
      id: 'report' as ActiveTab,
      label: 'Informe Pericial',
      icon: FileCheck,
      badge: 'Mód 20'
    }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] bg-[#0d1117]/95 dark:bg-[#0d1117]/95 light:bg-[#ffffff]/95 backdrop-blur-md transition-colors">
      {/* Top Banner with Brand and Incident Details */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#21262d] dark:border-[#21262d] light:border-[#eaeef2]">
        <div className="flex items-center gap-3">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-center p-1 shadow-sm transition-all hover:scale-105 shrink-0"
            title="Ir a Un Fantasma en el Sistema (https://www.unfantasmaenelsistema.com/)"
          >
            <GhostLogo className="w-10 h-10 object-contain" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">
                Ghost<span className="text-[#f0883e]">Forensics</span> Lab
              </span>
              <a
                href="https://www.unfantasmaenelsistema.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#f0883e]/20 hover:bg-[#f0883e]/30 text-[#f0883e] border border-[#f0883e]/30 transition-colors inline-flex items-center gap-1"
                title="Visitar Un Fantasma en el Sistema"
              >
                <span>unfantasmaenelsistema.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] hidden sm:block">
              Simulador interactivo de laboratorio pericial &middot; Módulos 5–20 de Ghost Academy
            </p>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="order-3 sm:order-none w-full sm:w-60 md:w-72 lg:w-80 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] dark:bg-[#161b22] light:bg-[#f6f8fa] hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] dark:hover:text-[#e6edf3] light:hover:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] hover:border-[#f0883e]/50 transition-all text-xs group shadow-inner"
          title="Buscar en todos los artefactos, hashes, IPs, PIDs (Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#f0883e] group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">Buscar en todos los artefactos...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[10px] font-mono text-[#8b949e]">
            Ctrl K
          </kbd>
        </button>

        {/* Live Case Anchor Metadata */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161b22] dark:bg-[#161b22] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
            <Shield className="w-3.5 h-3.5 text-[#f0883e]" />
            <span className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">Caso:</span>
            <span className="font-mono font-medium text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">GH-2026-0314-INC</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#161b22] dark:bg-[#161b22] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
            <span className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">Host:</span>
            <span className="font-mono text-[#58a6ff]">WORKSTATION-09</span>
            <span className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">(10.0.2.15)</span>
          </div>

          {/* Case Briefing Button */}
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] dark:bg-[#21262d] light:bg-[#f6f8fa] hover:bg-[#30363d] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
            title="Ver resumen y evidencias del caso"
          >
            <Info className="w-3.5 h-3.5 text-[#f0883e]" />
            <span>Guía del Caso</span>
          </button>

          {/* Forensic Glossary Button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] dark:bg-[#21262d] light:bg-[#f6f8fa] hover:bg-[#30363d] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
            title="Abrir Glosario Forense Digital (MFT, EVTX, Amcache, Prefetch, Beaconing...)"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#3fb950]" />
            <span className="hidden sm:inline">Glosario DFIR</span>
            <span className="sm:hidden">Glosario</span>
          </button>

          {/* Progress JSON Backup Button */}
          <button
            onClick={onOpenBackupModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#21262d] dark:bg-[#21262d] light:bg-[#f6f8fa] hover:bg-[#30363d] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
            title="Exportar o importar progreso del caso a JSON local"
          >
            <HardDriveDownload className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="hidden sm:inline">Guardar / Cargar JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Cambiar tema de color"
            className="p-1.5 rounded text-[#8b949e] hover:text-[#e6edf3] dark:hover:text-[#e6edf3] light:hover:text-[#1f2328] bg-[#161b22] dark:bg-[#161b22] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] transition-colors"
            title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto flex items-center space-x-1 py-1.5 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-[#f0883e] text-white shadow-sm font-semibold'
                  : 'text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] hover:text-[#e6edf3] dark:hover:text-[#e6edf3] light:hover:text-[#1f2328] hover:bg-[#161b22] dark:hover:bg-[#161b22] light:hover:bg-[#eaeef2]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-[#f0883e]' : 'text-current'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-black/25 text-white'
                    : tab.highlight
                    ? 'bg-[#f0883e]/20 text-[#f0883e] font-semibold'
                    : 'bg-[#21262d] dark:bg-[#21262d] light:bg-[#d0d7de] text-[#8b949e] dark:text-[#8b949e] light:text-[#1f2328]'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
