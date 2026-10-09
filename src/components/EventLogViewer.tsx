import React, { useState } from 'react';
import {
  FileText,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Copy,
  Check,
  Code,
  Shield,
  Monitor
} from 'lucide-react';
import { EVENT_LOGS } from '../data/forensicCaseData';
import { EventLogEntry } from '../types/forensics';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

const eventLogExportColumns: ExportColumn<EventLogEntry>[] = [
  { header: 'Record ID', accessor: (l) => l.recordId },
  { header: 'TimeCreated (UTC)', accessor: (l) => l.timeCreated },
  { header: 'Canal (Channel)', accessor: (l) => l.channel },
  { header: 'Event ID', accessor: (l) => l.eventId },
  { header: 'Nivel (Level)', accessor: (l) => l.level },
  { header: 'Categoría', accessor: (l) => l.taskCategory },
  { header: 'Usuario (Subject / Target)', accessor: (l) => l.user },
  { header: 'Equipo (Computer)', accessor: (l) => l.computer },
  { header: 'IP Origen', accessor: (l) => l.ipAddress || '' },
  { header: 'Puerto Origen', accessor: (l) => l.port || '' },
  { header: 'Logon Type', accessor: (l) => l.logonType || '' },
  { header: 'Nombre Logon Type', accessor: (l) => l.logonTypeName || '' },
  { header: 'Proceso', accessor: (l) => l.processName || '' },
  { header: 'PID', accessor: (l) => l.processId || '' },
  { header: 'Proceso Padre', accessor: (l) => l.parentProcessName || '' },
  { header: 'PPID', accessor: (l) => l.parentProcessId || '' },
  { header: 'Servicio', accessor: (l) => l.serviceName || '' },
  { header: 'Descripción', accessor: (l) => l.description },
  { header: 'Indicador Malicioso', accessor: (l) => l.isMalicious ? 'ALERTA / SOSPECHOSO' : 'NORMAL' },
  { header: 'MITRE ATT&CK', accessor: (l) => l.mitreTechnique ? `${l.mitreTechnique.id} - ${l.mitreTechnique.name}` : '' }
];

export const EventLogViewer: React.FC = () => {
  const [selectedEventIdFilter, setSelectedEventIdFilter] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<number>(EVENT_LOGS[2].recordId); // Default to 4624 Logon
  const [activeDetailTab, setActiveDetailTab] = useState<'general' | 'xml'>('general');
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  const filteredLogs = EVENT_LOGS.filter((log) => {
    if (selectedEventIdFilter !== 'all' && log.eventId.toString() !== selectedEventIdFilter) {
      return false;
    }
    if (selectedChannel !== 'all' && log.channel !== selectedChannel) {
      return false;
    }
    if (selectedLevel !== 'all' && log.level !== selectedLevel) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesUser = log.user.toLowerCase().includes(q);
      const matchesDesc = log.description.toLowerCase().includes(q);
      const matchesIp = log.ipAddress?.toLowerCase().includes(q) ?? false;
      const matchesProc = log.processName?.toLowerCase().includes(q) ?? false;
      const matchesXml = log.rawXml.toLowerCase().includes(q);
      return matchesUser || matchesDesc || matchesIp || matchesProc || matchesXml;
    }
    return true;
  });

  const selectedLog = EVENT_LOGS.find((l) => l.recordId === selectedRecordId) || filteredLogs[0] || null;

  const handleCopyXml = (xml: string) => {
    navigator.clipboard.writeText(xml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Audit Failure':
        return (
          <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Fallo de auditoría
          </span>
        );
      case 'Audit Success':
        return (
          <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Auditoría correcta
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-blue-400 font-medium">
            <Info className="w-3.5 h-3.5" />
            Información
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Visor de Registro de Eventos (Windows Event Viewer)</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Análisis forense de registros EVTX (Security.evtx y System.evtx). Inspecciona eventos clave de autenticación, privilegios y borrado anti-forense.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#8b949e]">Herramientas emuladas:</span>
            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] font-mono">
              Hayabusa &middot; EvtxECmd
            </span>
            <ExportViewButton
              data={filteredLogs}
              viewName="Registros de Eventos EVTX"
              filenamePrefix="event_logs_evtx"
              columns={eventLogExportColumns}
              customMetadata={{
                channelFilter: selectedChannel,
                eventIdFilter: selectedEventIdFilter,
                levelFilter: selectedLevel,
                searchQuery: searchQuery || undefined
              }}
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-[#30363d]/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por usuario, IP, proceso o texto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            />
          </div>

          {/* Event ID filter */}
          <div>
            <select
              value={selectedEventIdFilter}
              onChange={(e) => setSelectedEventIdFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Todos los Event IDs</option>
              <option value="4624">ID 4624 — Inicio de sesión exitoso (RDP)</option>
              <option value="4625">ID 4625 — Intento de inicio fallido (Fuerza Bruta)</option>
              <option value="4672">ID 4672 — Privilegios especiales asignados</option>
              <option value="4688">ID 4688 — Creación de proceso (svc_update.exe)</option>
              <option value="7045">ID 7045 — Servicio instalado (WinHostUpdater)</option>
              <option value="1102">ID 1102 — Vaciado de log de seguridad (Anti-Forense)</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Todos los Canales (Security & System)</option>
              <option value="Security">Security.evtx</option>
              <option value="System">System.evtx</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] focus:outline-none focus:border-[#f0883e]"
            >
              <option value="all">Todos los Niveles</option>
              <option value="Audit Failure">Solo Fallos de Auditoría</option>
              <option value="Audit Success">Solo Auditorías Correctas</option>
              <option value="Information">Información</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split View: Table on Top/Left, Windows Viewer details below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Event Logs Grid Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl overflow-hidden flex flex-col max-h-[660px]">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1117] sticky top-0 border-b border-[#30363d] text-[#8b949e] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora (UTC)</th>
                  <th className="py-2.5 px-2">ID Evento</th>
                  <th className="py-2.5 px-2">Canal</th>
                  <th className="py-2.5 px-2">Nivel</th>
                  <th className="py-2.5 px-2">Usuario</th>
                  <th className="py-2.5 px-3">Categoría / Resumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/40 font-mono text-[11px]">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.recordId === log.recordId;
                  return (
                    <tr
                      key={log.recordId}
                      onClick={() => setSelectedRecordId(log.recordId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#f0883e]/15 text-[#e6edf3]'
                          : 'hover:bg-[#21262d]/40 text-[#8b949e]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#58a6ff] whitespace-nowrap">{log.timeCreated}</td>
                      <td className="py-2.5 px-2 font-bold text-[#f0883e]">{log.eventId}</td>
                      <td className="py-2.5 px-2 text-[#8b949e]">{log.channel}</td>
                      <td className="py-2.5 px-2">{getLevelBadge(log.level)}</td>
                      <td className="py-2.5 px-2 text-[#e6edf3] font-semibold">{log.user}</td>
                      <td className="py-2.5 px-3 text-[#8b949e] max-w-[200px] truncate">{log.taskCategory}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-2 border-t border-[#30363d] text-[11px] text-[#8b949e] bg-[#0d1117] px-4 flex justify-between">
            <span>{filteredLogs.length} eventos mostrados</span>
            <span>Record ID: {selectedLog?.recordId}</span>
          </div>
        </div>

        {/* Windows Event Details Pane (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4 overflow-y-auto max-h-[660px] space-y-4">
          {selectedLog ? (
            <>
              {/* Event Header */}
              <div className="border-b border-[#30363d] pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#f0883e]">
                      Evento {selectedLog.eventId}
                    </span>
                    <span className="text-xs text-[#8b949e]">({selectedLog.taskCategory})</span>
                  </div>
                  {getLevelBadge(selectedLog.level)}
                </div>
                <div className="text-xs text-[#8b949e] font-mono">
                  {selectedLog.timeCreated} UTC &middot; Equipo: {selectedLog.computer}
                </div>
              </div>

              {/* View Selector Tabs: General vs XML */}
              <div className="flex gap-2 border-b border-[#30363d] pb-2">
                <button
                  onClick={() => setActiveDetailTab('general')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    activeDetailTab === 'general'
                      ? 'bg-[#f0883e] text-white'
                      : 'text-[#8b949e] hover:text-[#e6edf3] bg-[#0d1117]'
                  }`}
                >
                  Vista General
                </button>
                <button
                  onClick={() => setActiveDetailTab('xml')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                    activeDetailTab === 'xml'
                      ? 'bg-[#f0883e] text-white'
                      : 'text-[#8b949e] hover:text-[#e6edf3] bg-[#0d1117]'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Vista XML</span>
                </button>
              </div>

              {/* General Friendly View */}
              {activeDetailTab === 'general' ? (
                <div className="space-y-3 text-xs">
                  {/* Description / Summary */}
                  <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                    <span className="text-[10px] font-semibold text-[#8b949e] uppercase block mb-1">
                      Descripción del Evento:
                    </span>
                    <p className="text-[#e6edf3] leading-relaxed">{selectedLog.description}</p>
                  </div>

                  {/* Structured Forensic Fields */}
                  <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] space-y-2">
                    <div className="flex justify-between border-b border-[#21262d] pb-1">
                      <span className="text-[#8b949e]">Usuario sujeto / cuenta:</span>
                      <span className="text-[#e6edf3] font-bold">{selectedLog.user}</span>
                    </div>

                    {selectedLog.ipAddress && (
                      <div className="flex justify-between border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e]">Dirección de red de origen:</span>
                        <span className="text-[#f85149] font-bold">{selectedLog.ipAddress}</span>
                      </div>
                    )}

                    {selectedLog.port && (
                      <div className="flex justify-between border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e]">Puerto de origen:</span>
                        <span className="text-[#d29922]">{selectedLog.port}</span>
                      </div>
                    )}

                    {selectedLog.logonType !== undefined && (
                      <div className="flex justify-between border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e]">Tipo de inicio de sesión:</span>
                        <span className="text-[#58a6ff] font-bold">
                          {selectedLog.logonType} ({selectedLog.logonTypeName})
                        </span>
                      </div>
                    )}

                    {selectedLog.processName && (
                      <div className="border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e] block">Nombre del proceso:</span>
                        <span className="text-[#3fb950] break-all">{selectedLog.processName}</span>
                      </div>
                    )}

                    {selectedLog.processId && (
                      <div className="flex justify-between border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e]">PID del proceso:</span>
                        <span className="text-[#58a6ff] font-semibold">{selectedLog.processId}</span>
                      </div>
                    )}

                    {selectedLog.parentProcessName && (
                      <div className="border-b border-[#21262d] pb-1">
                        <span className="text-[#8b949e] block">Proceso Creador (Parent):</span>
                        <span className="text-[#bc8cff] break-all">{selectedLog.parentProcessName} (PID {selectedLog.parentProcessId})</span>
                      </div>
                    )}

                    {selectedLog.serviceName && (
                      <div className="flex justify-between">
                        <span className="text-[#8b949e]">Nombre del servicio:</span>
                        <span className="text-[#d29922] font-semibold">{selectedLog.serviceName}</span>
                      </div>
                    )}
                  </div>

                  {/* Significance note */}
                  <div className="p-3 rounded-lg bg-[#21262d]/60 border border-[#30363d]">
                    <div className="flex items-center gap-1.5 text-[#f0883e] font-semibold mb-1">
                      <Shield className="w-4 h-4" />
                      Significado Pericial en DFIR:
                    </div>
                    <p className="text-[11px] text-[#8b949e] leading-relaxed">
                      {selectedLog.eventId === 4624 && 'El LogonType 10 confirma acceso por Escritorio Remoto (RDP). Analizar siempre la IP de red y correlacionar con eventos 4625 previos.'}
                      {selectedLog.eventId === 4625 && 'Ráfagas de fallos 4625 son el patrón inequívoco de fuerza bruta o password spraying.'}
                      {selectedLog.eventId === 4672 && 'Registra la asignación de SeDebugPrivilege, requerido para inyectar en LSASS o dumpear credenciales.'}
                      {selectedLog.eventId === 4688 && 'Permite auditar la línea de comandos completa ejecutada por el adversario.'}
                      {selectedLog.eventId === 1102 && '¡Alerta máxima de evasión y anti-forense! Indica que el adversario ejecutó un borrado forzado de los registros.'}
                      {selectedLog.eventId === 7045 && 'Instalación de un servicio de Windows para persistencia o ejecución con privilegios SYSTEM.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* XML Raw View */
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#8b949e]">Estructura XML estándar de Windows Event Viewer</span>
                    <button
                      onClick={() => handleCopyXml(selectedLog.rawXml)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0d1117] hover:bg-[#21262d] text-xs text-[#58a6ff] border border-[#30363d] transition-colors"
                    >
                      {copiedXml ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedXml ? 'Copiado' : 'Copiar XML'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[10px] text-[#e6edf3] overflow-x-auto whitespace-pre leading-relaxed">
                    {selectedLog.rawXml}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-[#8b949e]">
              Selecciona una entrada del log para ver sus detalles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
