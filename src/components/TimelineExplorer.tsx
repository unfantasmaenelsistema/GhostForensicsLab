import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  AlertCircle,
  FileText,
  Database,
  Cpu,
  Radio,
  Cloud,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Calendar,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { TimelineEvent, ArtifactType, EventSeverity } from '../types/forensics';
import { TIMELINE_EVENTS } from '../data/forensicCaseData';
import { InteractiveTimelineAxis } from './InteractiveTimelineAxis';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

const timelineExportColumns: ExportColumn<TimelineEvent>[] = [
  { header: 'Timestamp (UTC)', accessor: (e) => e.timestamp },
  { header: 'Tipo Artefacto', accessor: (e) => e.artifactType },
  { header: 'Severidad', accessor: (e) => e.severity },
  { header: 'Título / Resumen', accessor: (e) => e.summary },
  { header: 'Descripción Detallada', accessor: (e) => e.description },
  { header: 'Herramienta Forense', accessor: (e) => e.sourceTool },
  { header: 'Archivo Evidencia', accessor: (e) => e.sourceFile },
  { header: 'Usuario', accessor: (e) => e.technicalDetails.user || '' },
  { header: 'IP Origen', accessor: (e) => e.technicalDetails.ipAddress || '' },
  { header: 'Puerto', accessor: (e) => e.technicalDetails.port || '' },
  { header: 'Proceso', accessor: (e) => e.technicalDetails.processName || '' },
  { header: 'PID', accessor: (e) => e.technicalDetails.pid || '' },
  { header: 'PPID', accessor: (e) => e.technicalDetails.parentPid || '' },
  { header: 'Ruta Archivo', accessor: (e) => e.technicalDetails.filePath || '' },
  { header: 'Hash SHA256', accessor: (e) => e.technicalDetails.fileHash || '' },
  { header: 'Event ID', accessor: (e) => e.technicalDetails.eventId || '' },
  { header: 'Clave Registro', accessor: (e) => e.technicalDetails.registryKey || '' },
  { header: 'Valor Registro', accessor: (e) => e.technicalDetails.registryValue || '' },
  { header: 'MITRE ATT&CK ID', accessor: (e) => e.mitre?.id || '' },
  { header: 'MITRE Técnica', accessor: (e) => e.mitre?.name || '' },
  { header: 'MITRE Táctica', accessor: (e) => e.mitre?.tactic || '' },
  { header: '$STANDARD_INFORMATION (0x10)', accessor: (e) => e.technicalDetails.standardInfoTime || '' },
  { header: '$FILE_NAME (0x30)', accessor: (e) => e.technicalDetails.fileNameTime || '' },
  { header: 'Pistas e Indicadores', accessor: (e) => e.technicalDetails.forensicHint || '' },
  { header: 'Registro Bruto (Raw)', accessor: (e) => e.technicalDetails.rawRecord || '' }
];

interface TimelineExplorerProps {
  onSelectTechnique?: (techniqueId: string) => void;
}

export const TimelineExplorer: React.FC<TimelineExplorerProps> = ({ onSelectTechnique }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(TIMELINE_EVENTS[1].id); // Default to RDP Logon event
  const [sortAscending, setSortAscending] = useState<boolean>(true);
  const [activeTimeWindow, setActiveTimeWindow] = useState<[Date, Date] | null>(null);
  const [isTableSynced, setIsTableSynced] = useState<boolean>(false);

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return TIMELINE_EVENTS.filter((evt) => {
      // Time window brush/zoom filter if table synchronization is active
      if (isTableSynced && activeTimeWindow) {
        const evtTime = new Date(evt.timestamp.replace(' ', 'T') + 'Z').getTime();
        if (evtTime < activeTimeWindow[0].getTime() || evtTime > activeTimeWindow[1].getTime()) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && evt.artifactType !== selectedType) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'all' && evt.severity !== selectedSeverity) {
        return false;
      }

      // Phase filter
      if (selectedPhase === 'p1' && (evt.timestamp < '2026-03-14 02:01:00' || evt.timestamp > '2026-03-14 02:05:00')) return false;
      if (selectedPhase === 'p2' && (evt.timestamp < '2026-03-14 02:08:00' || evt.timestamp > '2026-03-14 02:10:00')) return false;
      if (selectedPhase === 'p3' && (evt.timestamp < '2026-03-14 02:10:01' || evt.timestamp > '2026-03-14 02:15:00')) return false;
      if (selectedPhase === 'p4' && (evt.timestamp < '2026-03-14 02:18:00' || evt.timestamp > '2026-03-14 02:32:00')) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesSummary = evt.summary.toLowerCase().includes(q);
        const matchesDesc = evt.description.toLowerCase().includes(q);
        const matchesTool = evt.sourceTool.toLowerCase().includes(q);
        const matchesRaw = evt.technicalDetails.rawRecord?.toLowerCase().includes(q) ?? false;
        const matchesIp = evt.technicalDetails.ipAddress?.toLowerCase().includes(q) ?? false;
        const matchesUser = evt.technicalDetails.user?.toLowerCase().includes(q) ?? false;
        const matchesFile = evt.technicalDetails.filePath?.toLowerCase().includes(q) ?? false;
        const matchesMitre = evt.mitre?.id.toLowerCase().includes(q) || evt.mitre?.name.toLowerCase().includes(q);
        return matchesSummary || matchesDesc || matchesTool || matchesRaw || matchesIp || matchesUser || matchesFile || matchesMitre;
      }

      return true;
    }).sort((a, b) => {
      const cmp = a.timestamp.localeCompare(b.timestamp);
      return sortAscending ? cmp : -cmp;
    });
  }, [searchQuery, selectedType, selectedSeverity, selectedPhase, sortAscending, isTableSynced, activeTimeWindow]);

  const selectedEvent = useMemo(() => {
    return TIMELINE_EVENTS.find((e) => e.id === selectedEventId) || filteredEvents[0] || null;
  }, [selectedEventId, filteredEvents]);

  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case 'EVTX':
        return <FileText className="w-4 h-4 text-[#58a6ff]" />;
      case 'Registro':
        return <Database className="w-4 h-4 text-[#bc8cff]" />;
      case 'MFT':
        return <Layers className="w-4 h-4 text-[#3fb950]" />;
      case 'Prefetch':
        return <Cpu className="w-4 h-4 text-[#d29922]" />;
      case 'Red':
        return <Radio className="w-4 h-4 text-[#f0883e]" />;
      case 'Cloud':
        return <Cloud className="w-4 h-4 text-[#f778ba]" />;
      default:
        return <Clock className="w-4 h-4 text-[#8b949e]" />;
    }
  };

  const getSeverityBadge = (severity: EventSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            Crítico
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Alto
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
            Medio
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Overview Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Explorador de Timeline Forense (Super-Timeline)</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Correlación cronológica multi-fuente generada a partir de $MFT (MFTECmd), Registro (RECmd), Prefetch (PECmd), Event Logs (EvtxECmd), PCAP y CloudTrail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#8b949e]">Total eventos:</span>
              <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-[#f0883e] font-bold">
                {filteredEvents.length} / {TIMELINE_EVENTS.length}
              </span>
            </div>
            <ExportViewButton
              data={filteredEvents}
              viewName="Super-Timeline Forense"
              filenamePrefix="super_timeline"
              columns={timelineExportColumns}
              customMetadata={{
                filterType: selectedType,
                filterPhase: selectedPhase,
                filterSeverity: selectedSeverity,
                searchQuery: searchQuery || undefined,
                timeWindow: isTableSynced && activeTimeWindow ? `${activeTimeWindow[0].toISOString()} - ${activeTimeWindow[1].toISOString()}` : undefined
              }}
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-3 border-t border-[#30363d]/60 dark:border-[#30363d]/60 light:border-[#d0d7de] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar IP, proceso, hash, MITRE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            />
          </div>

          {/* Artifact Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Todos los artefactos ({TIMELINE_EVENTS.length})</option>
              <option value="EVTX">EVTX / Event Logs (5)</option>
              <option value="Registro">Registro de Windows (3)</option>
              <option value="Prefetch">Prefetch / Ejecución (2)</option>
              <option value="MFT">$MFT / Sistema de archivos (1)</option>
              <option value="Red">Red & Beaconing (3)</option>
              <option value="Cloud">AWS CloudTrail (3)</option>
            </select>
          </div>

          {/* Incident Phase Filter */}
          <div>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Todas las fases del incidente</option>
              <option value="p1">Fase 1: Fuerza Bruta & Acceso RDP (02:01 - 02:04)</option>
              <option value="p2">Fase 2: Persistencia & Inyección LSASS (02:08 - 02:09)</option>
              <option value="p3">Fase 3: Beaconing C2 & Túnel DNS (02:10 - 02:15)</option>
              <option value="p4">Fase 4: Exfiltración S3 & Anti-Forense (02:18 - 02:31)</option>
            </select>
          </div>

          {/* Severity & Order */}
          <div className="flex gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Cualquier severidad</option>
              <option value="critical">Solo Crítico</option>
              <option value="high">Alto y Crítico</option>
              <option value="medium">Medio</option>
            </select>
            <button
              onClick={() => setSortAscending(!sortAscending)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#f0883e] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              title="Invertir orden cronológico"
            >
              {sortAscending ? '▲ Asc' : '▼ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive D3.js Temporal Axis Visualization with Brushing & Zooming */}
      <InteractiveTimelineAxis
        events={TIMELINE_EVENTS}
        selectedEventId={selectedEventId}
        onSelectEvent={(id) => setSelectedEventId(id)}
        selectedType={selectedType}
        selectedSeverity={selectedSeverity}
        selectedPhase={selectedPhase}
        onSelectPhase={(phase) => setSelectedPhase(phase)}
        onTimeWindowChange={(window) => setActiveTimeWindow(window)}
        isTableSynced={isTableSynced}
        onToggleTableSync={(synced) => setIsTableSynced(synced)}
      />

      {/* Main Split View: Table on Left, Deep Forensic Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Events Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl overflow-hidden flex flex-col max-h-[680px]">
          <div className="overflow-y-auto flex-1 divide-y divide-[#30363d]/50 dark:divide-[#30363d]/50 light:divide-[#eaeef2]">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-[#8b949e]">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#8b949e]" />
                <p className="text-sm">No se encontraron eventos con los filtros seleccionados.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedSeverity('all');
                    setSelectedPhase('all');
                  }}
                  className="mt-3 text-xs text-[#f0883e] underline"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 text-xs ${
                      isSelected
                        ? 'bg-[#f0883e]/10 border-l-4 border-l-[#f0883e]'
                        : 'hover:bg-[#21262d]/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="pt-0.5">{getArtifactIcon(evt.artifactType)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[#58a6ff] font-semibold text-[11px]">
                          {evt.timestamp} UTC
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
                            {evt.artifactType}
                          </span>
                          {getSeverityBadge(evt.severity)}
                        </div>
                      </div>

                      <div className="font-medium text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] truncate mb-1">
                        {evt.summary}
                      </div>

                      <div className="text-[11px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] line-clamp-2">
                        {evt.description}
                      </div>

                      {evt.mitre && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#30363d]/60 text-[#d29922]">
                            {evt.mitre.id} &middot; {evt.mitre.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-[#30363d] text-[11px] text-[#8b949e] bg-[#0d1117] px-4 flex justify-between">
            <span>Haz clic en cualquier evento para examinar su evidencia técnica completa.</span>
            <span>{filteredEvents.length} eventos visibles</span>
          </div>
        </div>

        {/* Deep Forensic Detail Inspector (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4 overflow-y-auto max-h-[680px] space-y-4">
          {selectedEvent ? (
            <>
              {/* Header */}
              <div className="border-b border-[#30363d] pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-sm font-bold text-[#58a6ff]">
                    {selectedEvent.timestamp} UTC
                  </span>
                  {getSeverityBadge(selectedEvent.severity)}
                </div>
                <h2 className="text-base font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">
                  {selectedEvent.summary}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
                    Herramienta: <strong className="text-[#e6edf3]">{selectedEvent.sourceTool}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
                    Artefacto: <strong className="text-[#e6edf3]">{selectedEvent.artifactType}</strong>
                  </span>
                </div>
              </div>

              {/* Forensic Insight Box */}
              {selectedEvent.technicalDetails.forensicHint && (
                <div className="p-3 rounded-lg bg-[#f0883e]/10 border border-[#f0883e]/30 text-xs text-[#e6edf3]">
                  <div className="font-semibold text-[#f0883e] flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 text-[#f0883e]" />
                    Interpretación Forense (Ghost Academy DFIR):
                  </div>
                  <p className="leading-relaxed text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">
                    {selectedEvent.technicalDetails.forensicHint}
                  </p>
                </div>
              )}

              {/* Technical Attributes Grid */}
              <div className="space-y-2 text-xs">
                <h3 className="font-semibold text-[11px] uppercase tracking-wider text-[#8b949e]">
                  Detalles Técnicos Reconstruidos
                </h3>

                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2 font-mono text-[11px]">
                  {selectedEvent.technicalDetails.user && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">Usuario:</span>
                      <span className="text-[#e6edf3] font-semibold">{selectedEvent.technicalDetails.user}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.ipAddress && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">IP Origen / Remota:</span>
                      <span className="text-[#f85149] font-semibold">{selectedEvent.technicalDetails.ipAddress}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.port && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">Puerto:</span>
                      <span className="text-[#d29922]">{selectedEvent.technicalDetails.port}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.processName && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">Proceso:</span>
                      <span className="text-[#3fb950] font-semibold">{selectedEvent.technicalDetails.processName}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.pid && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">PID:</span>
                      <span className="text-[#58a6ff]">{selectedEvent.technicalDetails.pid}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.eventId && (
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">Windows Event ID:</span>
                      <span className="text-[#f0883e] font-bold">{selectedEvent.technicalDetails.eventId}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.filePath && (
                    <div className="border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e] block">Ruta del archivo:</span>
                      <span className="text-[#e6edf3] break-all">{selectedEvent.technicalDetails.filePath}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.fileHash && (
                    <div className="border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e] block">Hash SHA-256:</span>
                      <span className="text-[#d29922] break-all text-[10px]">{selectedEvent.technicalDetails.fileHash}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.registryKey && (
                    <div className="border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e] block">Clave de Registro:</span>
                      <span className="text-[#bc8cff] break-all">{selectedEvent.technicalDetails.registryKey}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.standardInfoTime && (
                    <div className="border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e] block">$STANDARD_INFORMATION (0x10):</span>
                      <span className="text-[#3fb950]">{selectedEvent.technicalDetails.standardInfoTime}</span>
                    </div>
                  )}

                  {selectedEvent.technicalDetails.fileNameTime && (
                    <div>
                      <span className="text-[#8b949e] block">$FILE_NAME (0x30):</span>
                      <span className="text-[#3fb950]">{selectedEvent.technicalDetails.fileNameTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MITRE ATT&CK Mapping */}
              {selectedEvent.mitre && (
                <div className="p-3 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#d29922] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      MITRE ATT&CK ({selectedEvent.mitre.id})
                    </span>
                    <span className="text-[10px] text-[#8b949e]">{selectedEvent.mitre.tactic}</span>
                  </div>
                  <div className="font-medium text-[#e6edf3]">{selectedEvent.mitre.name}</div>
                  {selectedEvent.mitre.url && (
                    <a
                      href={selectedEvent.mitre.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline"
                    >
                      <span>Ver técnica en attack.mitre.org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Raw Record Dump */}
              {selectedEvent.technicalDetails.rawRecord && (
                <div>
                  <h3 className="font-semibold text-[11px] uppercase tracking-wider text-[#8b949e] mb-1 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    Registro Bruto Parseado (Raw Record)
                  </h3>
                  <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[10px] text-[#e6edf3] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.technicalDetails.rawRecord}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-[#8b949e]">
              Selecciona un evento para ver su desglose pericial.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
