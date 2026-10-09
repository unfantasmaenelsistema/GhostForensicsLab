import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Filter,
  Layers,
  Terminal,
  Database,
  Radio,
  FileText,
  Cloud,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { FORENSIC_GLOSSARY_TERMS, GlossaryTerm } from '../data/glossaryData';

interface ForensicGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

export const ForensicGlossaryModal: React.FC<ForensicGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialTermId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedTermId, setCopiedTermId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todos los Términos' },
    { id: 'Sistema de Archivos', label: 'Archivos & $MFT' },
    { id: 'Registro & Ejecución', label: 'Registro & Prefetch' },
    { id: 'Memoria RAM', label: 'Memoria RAM & VAD' },
    { id: 'Red & C2', label: 'Red & Beaconing' },
    { id: 'Auditoría & Logs', label: 'Event Logs (EVTX)' },
    { id: 'Cloud & Metodología', label: 'Cloud & MITRE' }
  ];

  const filteredTerms = useMemo(() => {
    return FORENSIC_GLOSSARY_TERMS.filter((term) => {
      // Category filter
      if (selectedCategory !== 'all' && term.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTerm = term.term.toLowerCase().includes(q);
        const matchesAcronym = term.acronym?.toLowerCase().includes(q) ?? false;
        const matchesSummary = term.summary.toLowerCase().includes(q);
        const matchesExpl = term.detailedExplanation.toLowerCase().includes(q);
        const matchesTool = term.fossTool.toLowerCase().includes(q);
        const matchesLoc = term.locationOrArtifact.toLowerCase().includes(q);
        return matchesTerm || matchesAcronym || matchesSummary || matchesExpl || matchesTool || matchesLoc;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleCopy = (term: GlossaryTerm) => {
    const text = `${term.term} (${term.acronym || ''})\n${term.summary}\n\nUbicación: ${term.locationOrArtifact}\nHerramienta FOSS: ${term.fossTool}`;
    navigator.clipboard.writeText(text);
    setCopiedTermId(term.id);
    setTimeout(() => setCopiedTermId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Sistema de Archivos':
        return <Layers className="w-3.5 h-3.5 text-[#3fb950]" />;
      case 'Registro & Ejecución':
        return <Database className="w-3.5 h-3.5 text-[#bc8cff]" />;
      case 'Memoria RAM':
        return <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />;
      case 'Red & C2':
        return <Radio className="w-3.5 h-3.5 text-[#f0883e]" />;
      case 'Auditoría & Logs':
        return <FileText className="w-3.5 h-3.5 text-[#d29922]" />;
      case 'Cloud & Metodología':
        return <Cloud className="w-3.5 h-3.5 text-[#f778ba]" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-[#8b949e]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-between bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0883e]/20 border border-[#f0883e]/30 flex items-center justify-center text-xl shrink-0">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Glosario Forense Digital (DFIR)</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#f0883e]/20 text-[#f0883e] border border-[#f0883e]/30">
                  Ghost Academy
                </span>
              </div>
              <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">
                Guía conceptual para estudiantes: MFT, EVTX, Amcache, Prefetch, Beaconing y artefactos clave.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
            title="Cerrar Glosario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar with Search and Category filters */}
        <div className="p-3 sm:p-4 border-b border-[#30363d] bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar término (ej: MFT, Prefetch, Beaconing, EVTX, Amcache, Volatility...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-[#f0883e] text-white shadow-sm font-semibold'
                    : 'bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-[#8b949e]">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron términos con el criterio de búsqueda "{searchQuery}".</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs text-[#f0883e] underline"
              >
                Ver todos los términos
              </button>
            </div>
          ) : (
            filteredTerms.map((term) => (
              <div
                key={term.id}
                id={`term-${term.id}`}
                className="p-4 sm:p-5 rounded-xl bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] space-y-3 hover:border-[#f0883e]/50 transition-colors"
              >
                {/* Term Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#21262d]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">
                      {term.term}
                    </span>
                    {term.acronym && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#f0883e]/15 text-[#f0883e] font-bold border border-[#f0883e]/30">
                        {term.acronym}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] flex items-center gap-1">
                      {getCategoryIcon(term.category)}
                      <span>{term.category}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(term)}
                      className="p-1 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
                      title="Copiar definición"
                    >
                      {copiedTermId === term.id ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Course Module Badge */}
                <div className="text-[11px] font-mono text-[#d29922] font-medium">
                  {term.courseModule}
                </div>

                {/* Summary Definition */}
                <div className="text-xs sm:text-sm font-medium text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] leading-relaxed bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] p-3 rounded-lg border border-[#30363d]/60">
                  {term.summary}
                </div>

                {/* Detailed Explanation */}
                <div className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] leading-relaxed whitespace-pre-line">
                  {term.detailedExplanation}
                </div>

                {/* Technical Metadata Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d]">
                    <span className="text-[#8b949e] block text-[10px] uppercase font-sans font-semibold">
                      Ubicación / Artefacto:
                    </span>
                    <span className="text-[#58a6ff] break-all">{term.locationOrArtifact}</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d]">
                    <span className="text-[#8b949e] block text-[10px] uppercase font-sans font-semibold">
                      Herramienta FOSS del Curso:
                    </span>
                    <span className="text-[#3fb950] break-all">{term.fossTool}</span>
                  </div>
                </div>

                {/* Example in this Case */}
                <div className="p-3 rounded-lg bg-[#f0883e]/10 border border-[#f0883e]/30 text-xs text-[#e6edf3]">
                  <div className="flex items-center gap-1.5 font-bold text-[#f0883e] mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#f0883e]" />
                    <span>Aplicación en el Caso GhostForensics Lab:</span>
                  </div>
                  <p className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] leading-relaxed">
                    {term.caseReference}
                  </p>
                </div>

                {/* Pro Tip */}
                <div className="p-2.5 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5" />
                  <span className="text-[#8b949e] text-[11px] leading-relaxed">
                    <strong className="text-[#d29922]">Consejo del Instructor: </strong>
                    {term.proTip}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff]">
          <span>{filteredTerms.length} términos mostrados</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#e6edf3] transition-colors"
          >
            Cerrar Glosario
          </button>
        </div>
      </div>
    </div>
  );
};
