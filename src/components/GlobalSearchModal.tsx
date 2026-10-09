import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Clock,
  FileText,
  Database,
  Cpu,
  Radio,
  Cloud,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { searchAllForensicArtifacts, GlobalSearchResult } from '../utils/globalSearch';
import { ActiveTab } from './Navbar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: ActiveTab) => void;
  onOpenGlossary: (termId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenGlossary
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle hotkeys (Ctrl+K / Cmd+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allResults = searchAllForensicArtifacts(query);

  const filteredResults = allResults.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  if (!isOpen) return null;

  const quickSearches = [
    { label: '203.0.113.44', desc: 'IP Atacante' },
    { label: 'svc_update.exe', desc: 'Proceso malicioso' },
    { label: '9f8a3c2e1b4d', desc: 'Hash SHA-256' },
    { label: 'lsass.exe', desc: 'PID 612 / Inyección' },
    { label: '4444', desc: 'Puerto C2' },
    { label: '1102', desc: 'Log Clear Anti-Forense' },
    { label: 'MFT', desc: 'Sistema de archivos' },
    { label: 'Prefetch', desc: 'Evidencia ejecución' }
  ];

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Timeline', label: 'Timeline' },
    { id: 'Event Logs', label: 'Event Logs' },
    { id: 'Registro', label: 'Registro' },
    { id: 'Memoria', label: 'Memoria' },
    { id: 'Red', label: 'Red' },
    { id: 'Cloud', label: 'Cloud' },
    { id: 'Glosario', label: 'Glosario' }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Timeline':
        return <Clock className="w-3.5 h-3.5 text-[#58a6ff]" />;
      case 'Event Logs':
        return <FileText className="w-3.5 h-3.5 text-[#d29922]" />;
      case 'Registro':
        return <Database className="w-3.5 h-3.5 text-[#bc8cff]" />;
      case 'Memoria':
        return <Cpu className="w-3.5 h-3.5 text-[#f85149]" />;
      case 'Red':
        return <Radio className="w-3.5 h-3.5 text-[#f0883e]" />;
      case 'Cloud':
        return <Cloud className="w-3.5 h-3.5 text-[#f778ba]" />;
      case 'Glosario':
        return <BookOpen className="w-3.5 h-3.5 text-[#3fb950]" />;
      default:
        return <Search className="w-3.5 h-3.5 text-[#8b949e]" />;
    }
  };

  const handleSelectResult = (result: GlobalSearchResult) => {
    onClose();
    if (result.isGlossary) {
      onOpenGlossary(result.glossaryTermId);
    } else if (result.targetTab) {
      onNavigateToTab(result.targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Search Bar Input */}
        <div className="p-3 sm:p-4 border-b border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center gap-3 bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa]">
          <Search className="w-5 h-5 text-[#f0883e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por IP, hash SHA-256, PID, archivo, clave de registro, técnica..."
            className="flex-1 bg-transparent border-none text-sm text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] placeholder-[#8b949e] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#8b949e] hover:text-[#e6edf3]"
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
            ESC para salir
          </div>
        </div>

        {/* Categories Bar */}
        {allResults.length > 0 && (
          <div className="px-4 py-2 border-b border-[#30363d]/60 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#f0883e] text-white font-semibold'
                    : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Results Container */}
        <div className="overflow-y-auto flex-1 p-2 sm:p-3 divide-y divide-[#30363d]/40">
          {query.trim().length < 2 ? (
            /* Empty State: Quick search suggestions */
            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-xs text-[#8b949e] font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f0883e]" />
                <span>Búsquedas frecuentes en el expediente del caso:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickSearches.map((qs) => (
                  <button
                    key={qs.label}
                    onClick={() => setQuery(qs.label)}
                    className="p-2.5 rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] hover:border-[#f0883e] text-left transition-colors"
                  >
                    <span className="font-mono text-xs font-bold text-[#58a6ff] block truncate">
                      {qs.label}
                    </span>
                    <span className="text-[10px] text-[#8b949e] block mt-0.5 truncate">
                      {qs.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-[#21262d]/40 border border-[#30363d] text-xs text-[#8b949e] leading-relaxed">
                <strong className="text-[#e6edf3] block mb-1">Buscador Pericial Unificado:</strong>
                Escribe al menos 2 caracteres para explorar simultáneamente el Timeline, los Event Logs de Windows (EVTX), el Registro, la Memoria RAM de Volatility3, los sockets de red, consultas DNS, eventos de AWS CloudTrail y el Glosario DFIR.
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* No results */
            <div className="p-8 text-center text-[#8b949e]">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-[#8b949e] opacity-60" />
              <p className="text-sm font-medium">No se encontraron artefactos con "{query}"</p>
              <p className="text-xs text-[#8b949e] mt-1">
                Prueba buscando por IP (ej: <code>203.0.113.44</code>), PID (<code>4821</code>), Event ID (<code>4624</code>) o proceso (<code>svc_update.exe</code>).
              </p>
            </div>
          ) : (
            /* Result rows */
            filteredResults.map((res) => (
              <div
                key={res.id}
                onClick={() => handleSelectResult(res)}
                className="p-3 rounded-lg hover:bg-[#21262d]/60 cursor-pointer transition-colors group flex items-start gap-3 text-xs"
              >
                <div className="pt-0.5 shrink-0">{getCategoryIcon(res.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] group-hover:text-[#f0883e] transition-colors truncate">
                      {res.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {res.timestamp && (
                        <span className="font-mono text-[10px] text-[#8b949e] hidden sm:inline">
                          {res.timestamp}
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#0d1117] border border-[#30363d] text-[#58a6ff]">
                        {res.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] line-clamp-2">
                    {res.snippet}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8b949e] group-hover:text-[#f0883e] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa]">
          <span>
            {query.trim().length >= 2 ? `${filteredResults.length} resultados encontrados` : 'Buscador Global DFIR'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs text-[#e6edf3] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
