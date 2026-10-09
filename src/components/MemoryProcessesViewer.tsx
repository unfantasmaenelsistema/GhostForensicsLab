import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Terminal,
  AlertTriangle,
  ShieldAlert,
  Search,
  Code2,
  FileCode,
  Layers,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { PROCESS_TREE } from '../data/forensicCaseData';
import { ProcessNode, VadRegion } from '../types/forensics';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

const processExportColumns: ExportColumn<ProcessNode>[] = [
  { header: 'PID', accessor: (p) => p.pid },
  { header: 'PPID (Padre)', accessor: (p) => p.ppid },
  { header: 'Nombre Proceso', accessor: (p) => p.name },
  { header: 'Ruta Ejecutable', accessor: (p) => p.path },
  { header: 'Usuario / Cuenta', accessor: (p) => p.user },
  { header: 'Hora Creación (UTC)', accessor: (p) => p.createTime },
  { header: 'Nivel Integridad', accessor: (p) => p.integrityLevel },
  { header: 'Hilos (Threads)', accessor: (p) => p.threads },
  { header: 'Handles', accessor: (p) => p.handles },
  { header: 'Línea de Comandos (CommandLine)', accessor: (p) => p.commandLine },
  { header: 'Identificado Sospechoso', accessor: (p) => p.isSuspicious ? 'ALERTA / MALICIOSO' : 'NORMAL' },
  { header: 'Motivo / Indicador Malicioso', accessor: (p) => p.suspiciousReason || '' }
];

interface MalfindExportRow {
  pid: number;
  processName: string;
  startAddress: string;
  endAddress: string;
  protection: string;
  state: string;
  tag: string;
  entropy: number;
  yaraMatch: string;
  notes: string;
}

const malfindExportColumns: ExportColumn<MalfindExportRow>[] = [
  { header: 'PID', accessor: (m) => m.pid },
  { header: 'Nombre Proceso', accessor: (m) => m.processName },
  { header: 'Dirección Inicio VAD', accessor: (m) => m.startAddress },
  { header: 'Dirección Fin VAD', accessor: (m) => m.endAddress },
  { header: 'Protección de Memoria', accessor: (m) => m.protection },
  { header: 'Estado Región', accessor: (m) => m.state },
  { header: 'Tag VAD', accessor: (m) => m.tag },
  { header: 'Entropía Shannon', accessor: (m) => m.entropy },
  { header: 'Coincidencia Regla YARA', accessor: (m) => m.yaraMatch },
  { header: 'Diagnóstico Forense Volatility', accessor: (m) => m.notes }
];

export const MemoryProcessesViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pstree' | 'malfind' | 'cmdline'>('pstree');
  const [selectedPid, setSelectedPid] = useState<number>(4821); // Default to malicious svc_update.exe
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedProcess = PROCESS_TREE.find((p) => p.pid === selectedPid) || PROCESS_TREE[0];

  // Malfind suspicious processes
  const malfindProcesses = PROCESS_TREE.filter((p) => p.vadRegions && p.vadRegions.length > 0);

  const malfindRows: MalfindExportRow[] = useMemo(() => {
    const list: MalfindExportRow[] = [];
    malfindProcesses.forEach((p) => {
      p.vadRegions?.forEach((vad) => {
        list.push({
          pid: p.pid,
          processName: p.name,
          startAddress: vad.startAddress,
          endAddress: vad.endAddress,
          protection: vad.protection,
          state: vad.state,
          tag: vad.tag,
          entropy: vad.entropy,
          yaraMatch: vad.yaraMatch || '',
          notes: vad.notes
        });
      });
    });
    return list;
  }, [malfindProcesses]);

  const filteredProcesses = PROCESS_TREE.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.pid.toString().includes(q) ||
      p.ppid.toString().includes(q) ||
      p.commandLine.toLowerCase().includes(q) ||
      p.user.toLowerCase().includes(q)
    );
  });

  // Current subtab export configuration
  const currentExport = {
    pstree: {
      data: filteredProcesses,
      viewName: 'Árbol de Procesos Volatility (windows.pstree)',
      prefix: 'volatility_pstree',
      columns: processExportColumns
    },
    malfind: {
      data: malfindRows,
      viewName: 'Inyecciones en Memoria VAD (windows.malfind)',
      prefix: 'volatility_malfind',
      columns: malfindExportColumns
    },
    cmdline: {
      data: filteredProcesses,
      viewName: 'Líneas de Comandos (windows.cmdline)',
      prefix: 'volatility_cmdline',
      columns: processExportColumns
    }
  }[activeSubTab];

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Análisis Forense de Memoria RAM & Procesos</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Simulador del framework Volatility3 para análisis de volcado de memoria (RAM Dump: WORKSTATION-09_memdump.raw).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#8b949e]">Framework DFIR:</span>
            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#bc8cff] font-mono">
              Volatility3 (v2.7.0)
            </span>
            <ExportViewButton
              data={currentExport.data as any[]}
              viewName={currentExport.viewName}
              filenamePrefix={currentExport.prefix}
              columns={currentExport.columns as any}
              customMetadata={{
                subTab: activeSubTab,
                evidenceFile: 'WORKSTATION-09_memdump.raw',
                searchFilter: searchQuery || undefined
              }}
            />
          </div>
        </div>

        {/* Plugin Subtabs Selector */}
        <div className="mt-4 pt-3 border-t border-[#30363d]/60 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('pstree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'pstree'
                ? 'bg-[#f0883e] text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>windows.pstree & pslist</span>
          </button>

          <button
            onClick={() => setActiveSubTab('malfind')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'malfind'
                ? 'bg-red-500 text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>windows.malfind (Inyección de Código)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-950 text-red-300 font-bold border border-red-800">
              1 DETECCIÓN
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('cmdline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'cmdline'
                ? 'bg-[#f0883e] text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>windows.cmdline (Argumentos)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on SubTab */}
      {activeSubTab === 'pstree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Processes Tree Table (8 cols on lg) */}
          <div className="lg:col-span-8 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl overflow-hidden flex flex-col max-h-[640px]">
            <div className="p-3 border-b border-[#30363d] flex items-center justify-between text-xs bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#8b949e]" />
                <input
                  type="text"
                  placeholder="Filtrar por PID, nombre o usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-[#e6edf3] focus:outline-none placeholder-[#8b949e]"
                />
              </div>
              <span className="text-[11px] text-[#8b949e] font-mono">vol -f memdump.raw windows.pstree</span>
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0d1117]/80 border-b border-[#30363d] text-[#8b949e] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">PID</th>
                    <th className="py-2.5 px-2">PPID</th>
                    <th className="py-2.5 px-3">Nombre de Imagen</th>
                    <th className="py-2.5 px-2">Hilos</th>
                    <th className="py-2.5 px-2">Handles</th>
                    <th className="py-2.5 px-2">Hora de Inicio (UTC)</th>
                    <th className="py-2.5 px-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/40 text-[11px]">
                  {filteredProcesses.map((proc) => {
                    const isSelected = selectedProcess.pid === proc.pid;
                    const isMalicious = proc.isSuspicious;

                    return (
                      <tr
                        key={proc.pid}
                        onClick={() => setSelectedPid(proc.pid)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#f0883e]/15 text-[#e6edf3]'
                            : isMalicious
                            ? 'bg-red-500/10 text-red-200'
                            : 'hover:bg-[#21262d]/40 text-[#8b949e]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[#58a6ff]">{proc.pid}</td>
                        <td className="py-2.5 px-2 text-[#8b949e]">{proc.ppid}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#e6edf3]">
                          <div className="flex items-center gap-1.5">
                            {proc.ppid !== 0 && proc.ppid !== 4 && proc.ppid !== 532 && (
                              <span className="text-[#8b949e] text-[10px]">└──</span>
                            )}
                            <span className={isMalicious ? 'text-red-400 font-bold' : ''}>{proc.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2">{proc.threads}</td>
                        <td className="py-2.5 px-2">{proc.handles}</td>
                        <td className="py-2.5 px-2 text-[10px] whitespace-nowrap">{proc.createTime}</td>
                        <td className="py-2.5 px-2 text-right">
                          {isMalicious ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              ANOMALÍA
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#3fb950]">NORMAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Process Detail Inspector (4 cols on lg) */}
          <div className="lg:col-span-4 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4 space-y-4 max-h-[640px] overflow-y-auto">
            <div className="border-b border-[#30363d] pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-base font-bold text-[#58a6ff]">
                  {selectedProcess.name} (PID: {selectedProcess.pid})
                </span>
                {selectedProcess.isSuspicious && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    SOSPECHOSO
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e] font-mono break-all">{selectedProcess.path}</p>
            </div>

            {selectedProcess.suspiciousReason && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Alerta Forense del Proceso:
                </div>
                <p className="leading-relaxed">{selectedProcess.suspiciousReason}</p>
              </div>
            )}

            {/* Properties */}
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-[#21262d] pb-1">
                <span className="text-[#8b949e]">Proceso Padre (PPID):</span>
                <span className="text-[#e6edf3] font-bold">
                  {selectedProcess.ppid} (
                  {PROCESS_TREE.find((p) => p.pid === selectedProcess.ppid)?.name || 'N/A'})
                </span>
              </div>
              <div className="flex justify-between border-b border-[#21262d] pb-1">
                <span className="text-[#8b949e]">Cuenta de Usuario:</span>
                <span className="text-[#3fb950] font-semibold">{selectedProcess.user}</span>
              </div>
              <div className="flex justify-between border-b border-[#21262d] pb-1">
                <span className="text-[#8b949e]">Integridad:</span>
                <span className="text-[#58a6ff]">{selectedProcess.integrityLevel}</span>
              </div>
              <div className="flex justify-between border-b border-[#21262d] pb-1">
                <span className="text-[#8b949e]">ID de Sesión:</span>
                <span className="text-[#e6edf3]">{selectedProcess.sessionId}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block mb-1">Línea de Comandos:</span>
                <span className="text-[#d29922] break-all block text-[11px] bg-[#161b22] p-2 rounded border border-[#21262d]">
                  {selectedProcess.commandLine || '(Sin argumentos registrados)'}
                </span>
              </div>
            </div>

            {/* Forensic Note */}
            <div className="p-3 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs">
              <span className="font-semibold text-[#f0883e] block mb-1">Análisis Pedagógico (Módulo 11):</span>
              <p className="text-[#8b949e] text-[11px] leading-relaxed">
                {selectedProcess.pid === 4821 &&
                  'Un proceso svc_update.exe hijo de lsass.exe (PID 612) es una bandera roja crítica: lsass.exe nunca debe generar procesos secundarios arbitrarios en Windows. Representa una inyección o ejecución anómala.'}
                {selectedProcess.pid === 612 &&
                  'lsass.exe es el objetivo prioritario de atacantes para dumpear hashes NTLM de memoria o tickets Kerberos. Revisa la pestaña malfind para ver la inyección de código.'}
                {selectedProcess.pid !== 4821 && selectedProcess.pid !== 612 &&
                  'Estructura de procesos del sistema estándar de Windows NT. Observa los identificadores y jerarquía esperada (smss -> wininit -> services / lsass).'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* windows.malfind View */}
      {activeSubTab === 'malfind' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h3 className="font-bold text-red-400 text-sm">
                Alerta Crítica: Inyección de Memoria Detectada por Volatility3 (windows.malfind)
              </h3>
              <p className="text-[#e6edf3] mt-1 leading-relaxed">
                El plugin <code>windows.malfind</code> identifica descriptores de área virtual (VAD) en procesos que tienen asignada protección de memoria ejecutable y escribible al mismo tiempo (<code>PAGE_EXECUTE_READWRITE</code> o RWX), sin estar respaldados por ningún archivo binario DLL en disco.
              </p>
            </div>
          </div>

          {malfindProcesses.map((proc) => (
            <div
              key={proc.pid}
              className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363d] gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-red-400">
                    Proceso Víctima de Inyección: {proc.name} (PID: {proc.pid})
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                    VAD Anómalo Encontrado
                  </span>
                </div>
                <div className="text-xs font-mono text-[#8b949e]">
                  Usuario: <span className="text-[#3fb950]">{proc.user}</span>
                </div>
              </div>

              {proc.vadRegions?.map((vad, idx) => (
                <div key={idx} className="space-y-3">
                  {/* VAD Attributes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[10px]">Dirección Inicial VAD:</span>
                      <span className="text-[#58a6ff] font-bold">{vad.startAddress}</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[10px]">Protección de Memoria:</span>
                      <span className="text-red-400 font-bold">{vad.protection}</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[10px]">Entropía de la Región:</span>
                      <span className="text-[#d29922] font-bold">{vad.entropy} (Alta)</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d]">
                      <span className="text-[#8b949e] block text-[10px]">Firma YARA Coincidente:</span>
                      <span className="text-[#bc8cff] font-bold">{vad.yaraMatch}</span>
                    </div>
                  </div>

                  {/* Hex Dump */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Hex Dump de la Región Inyectada (Cabecera PE / MZ Stub):
                      </span>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto leading-relaxed">
                      {vad.hexDump}
                    </pre>
                  </div>

                  {/* Disassembly */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        Desensamblado del Shellcode Inyectado (x64 Assembly):
                      </span>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#3fb950] overflow-x-auto leading-relaxed">
                      {vad.disassembly}
                    </pre>
                  </div>

                  <div className="p-3 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs">
                    <span className="font-semibold text-[#f0883e] block mb-1">
                      Conclusión Pericial (Módulo 12 - Análisis de Malware en RAM):
                    </span>
                    <p className="text-[#8b949e] leading-relaxed">
                      {vad.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* windows.cmdline View */}
      {activeSubTab === 'cmdline' && (
        <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#30363d] text-xs">
            <span className="font-mono text-[#8b949e]">vol -f memdump.raw windows.cmdline</span>
            <span className="text-[#8b949e]">{PROCESS_TREE.length} procesos con línea de comando parseada</span>
          </div>

          <div className="mt-3 divide-y divide-[#30363d]/40 space-y-2">
            {PROCESS_TREE.map((proc) => (
              <div key={proc.pid} className="pt-2 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#58a6ff] font-bold">PID {proc.pid}</span>
                    <span className="text-[#e6edf3] font-semibold">{proc.name}</span>
                  </div>
                  {proc.isSuspicious && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400">
                      INDICADOR MALICIOSO
                    </span>
                  )}
                </div>
                <div className={`p-2 rounded text-[11px] break-all ${proc.isSuspicious ? 'bg-red-500/10 text-red-200 border border-red-500/30' : 'bg-[#0d1117] text-[#8b949e]'}`}>
                  {proc.commandLine || '(Sin argumentos en línea de comando)'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
