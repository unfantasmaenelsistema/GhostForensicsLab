import React, { useState } from 'react';
import {
  Radio,
  Wifi,
  Globe,
  Activity,
  AlertTriangle,
  Clock,
  Search,
  ExternalLink,
  Code2,
  FileSearch,
  Eye,
  X
} from 'lucide-react';
import { NETWORK_CONNECTIONS, DNS_QUERIES } from '../data/forensicCaseData';
import { NetworkConnection, DnsQuery } from '../types/forensics';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

const netscanExportColumns: ExportColumn<NetworkConnection>[] = [
  { header: 'Timestamp (UTC)', accessor: (c) => c.timestamp },
  { header: 'Protocolo', accessor: (c) => c.protocol },
  { header: 'Dirección Local', accessor: (c) => c.localAddress },
  { header: 'Puerto Local', accessor: (c) => c.localPort },
  { header: 'Dirección Remota', accessor: (c) => c.remoteAddress },
  { header: 'Puerto Remoto', accessor: (c) => c.remotePort },
  { header: 'Estado Socket', accessor: (c) => c.state },
  { header: 'PID Proceso', accessor: (c) => c.pid },
  { header: 'Nombre Proceso', accessor: (c) => c.processName },
  { header: 'Bytes Enviados', accessor: (c) => c.bytesSent },
  { header: 'Bytes Recibidos', accessor: (c) => c.bytesReceived },
  { header: 'Canal C2 Malicioso', accessor: (c) => c.isC2 ? 'SÍ (ALERTA C2)' : 'NO' },
  { header: 'Intervalo Beacon (s)', accessor: (c) => c.beaconIntervalSeconds || '' },
  { header: 'Notas Forenses', accessor: (c) => c.note || '' }
];

const beaconExportColumns: ExportColumn<NetworkConnection>[] = [
  { header: 'Timestamp (UTC)', accessor: (c) => c.timestamp },
  { header: 'IP Remota C2', accessor: (c) => c.remoteAddress },
  { header: 'Puerto C2', accessor: (c) => c.remotePort },
  { header: 'PID Origen', accessor: (c) => c.pid },
  { header: 'Proceso Malicioso', accessor: (c) => c.processName },
  { header: 'TCP Stream ID', accessor: (c) => c.tcpStreamId || '' },
  { header: 'Intervalo (segundos)', accessor: (c) => c.beaconIntervalSeconds || 60 },
  { header: 'Jitter Calculado', accessor: () => '0.0% (Periodicidad estricta)' },
  { header: 'Bytes Payload', accessor: (c) => c.bytesSent },
  { header: 'Firma / Identificador', accessor: () => 'GHOST_ACK (Handshake C2)' },
  { header: 'Notas de Detección', accessor: (c) => c.note || '' }
];

const dnsExportColumns: ExportColumn<DnsQuery>[] = [
  { header: 'Timestamp (UTC)', accessor: (d) => d.timestamp },
  { header: 'IP Cliente', accessor: (d) => d.clientIp },
  { header: 'Dominio de Consulta', accessor: (d) => d.queryDomain },
  { header: 'Tipo Registro', accessor: (d) => d.recordType },
  { header: 'Respuesta Servidor', accessor: (d) => d.response },
  { header: 'Tamaño Payload (Bytes)', accessor: (d) => d.payloadSize },
  { header: 'Entropía Shannon', accessor: (d) => d.entropy },
  { header: 'Exfiltración DNS Tunneling', accessor: (d) => d.isTunneling ? 'SÍ (EXFILTRACIÓN)' : 'NO' },
  { header: 'Carga Útil Decodificada', accessor: (d) => d.decodedData || '' }
];

export const NetworkViewer: React.FC = () => {
  const [activeNetworkTab, setActiveNetworkTab] = useState<'netscan' | 'beaconing' | 'dns'>('netscan');
  const [inspectStreamId, setInspectStreamId] = useState<number | null>(null);

  // C2 beacon connections
  const c2Connections = NETWORK_CONNECTIONS.filter((c) => c.isC2 && c.remotePort === 4444);

  // Active tab export configuration
  const currentExport = {
    netscan: {
      data: NETWORK_CONNECTIONS,
      viewName: 'Conexiones de Red (netscan)',
      prefix: 'network_netscan',
      columns: netscanExportColumns
    },
    beaconing: {
      data: c2Connections,
      viewName: 'Balizas C2 (Beaconing Periodicidad)',
      prefix: 'network_c2_beaconing',
      columns: beaconExportColumns
    },
    dns: {
      data: DNS_QUERIES,
      viewName: 'Consultas DNS y Túnel Encubierto',
      prefix: 'network_dns_tunneling',
      columns: dnsExportColumns
    }
  }[activeNetworkTab];

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Análisis Forense de Red & Tráfico C2</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Inspección de sockets activos (netscan), detección de periodicidad de balizas C2 (beaconing) y análisis de exfiltración encubierta por DNS Tunneling.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#8b949e]">Herramientas emuladas:</span>
            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#f0883e] font-mono">
              Wireshark &middot; Zeek &middot; Volatility
            </span>
            <ExportViewButton
              data={currentExport.data as any[]}
              viewName={currentExport.viewName}
              filenamePrefix={currentExport.prefix}
              columns={currentExport.columns as any}
              customMetadata={{
                activeTab: activeNetworkTab,
                c2Detected: true,
                attackerIp: '203.0.113.44'
              }}
            />
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="mt-4 pt-3 border-t border-[#30363d]/60 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveNetworkTab('netscan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeNetworkTab === 'netscan'
                ? 'bg-[#f0883e] text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Conexiones de Red (netscan)</span>
          </button>

          <button
            onClick={() => setActiveNetworkTab('beaconing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeNetworkTab === 'beaconing'
                ? 'bg-[#f0883e] text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Detector de Beaconing C2 (60s Delta)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-950 text-red-300 font-bold border border-red-800">
              C2 4444
            </span>
          </button>

          <button
            onClick={() => setActiveNetworkTab('dns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeNetworkTab === 'dns'
                ? 'bg-[#f0883e] text-white'
                : 'bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Túnel DNS & Exfiltración (DNS Tunneling)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-orange-950 text-orange-300 font-bold border border-orange-800">
              Alta Entropía
            </span>
          </button>
        </div>
      </div>

      {/* Netscan Table View */}
      {activeNetworkTab === 'netscan' && (
        <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl overflow-hidden">
          <div className="p-3 border-b border-[#30363d] flex items-center justify-between text-xs bg-[#0d1117]">
            <span className="font-mono text-[#8b949e]">vol -f memdump.raw windows.netscan</span>
            <span className="text-[#8b949e]">{NETWORK_CONNECTIONS.length} sockets registrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0d1117]/60 border-b border-[#30363d] text-[#8b949e] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Hora UTC</th>
                  <th className="py-2.5 px-2">Protocolo</th>
                  <th className="py-2.5 px-2">Dirección Local</th>
                  <th className="py-2.5 px-2">Dirección Remota</th>
                  <th className="py-2.5 px-2">Estado</th>
                  <th className="py-2.5 px-2">PID & Proceso</th>
                  <th className="py-2.5 px-2 text-right">Inspección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/40 text-[11px]">
                {NETWORK_CONNECTIONS.map((conn) => {
                  return (
                    <tr
                      key={conn.id}
                      className={`hover:bg-[#21262d]/40 transition-colors ${
                        conn.isC2 ? 'bg-red-500/10 text-red-200' : 'text-[#8b949e]'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-[#58a6ff] whitespace-nowrap">{conn.timestamp}</td>
                      <td className="py-2.5 px-2 text-[#e6edf3] font-bold">{conn.protocol}</td>
                      <td className="py-2.5 px-2 text-[#8b949e]">
                        {conn.localAddress}:{conn.localPort}
                      </td>
                      <td className="py-2.5 px-2 font-bold text-[#f85149]">
                        {conn.remoteAddress}:{conn.remotePort}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0d1117] border border-[#30363d] text-[#3fb950]">
                          {conn.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-[#e6edf3]">
                        <span className="font-bold text-[#58a6ff]">PID {conn.pid}</span> ({conn.processName})
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {conn.tcpStreamId ? (
                          <button
                            onClick={() => setInspectStreamId(conn.tcpStreamId!)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0d1117] hover:bg-[#21262d] text-[#58a6ff] border border-[#30363d] text-[10px] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Stream {conn.tcpStreamId}
                          </button>
                        ) : (
                          <span className="text-[#8b949e] text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beaconing Analysis View */}
      {activeNetworkTab === 'beaconing' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-bold text-[#e6edf3]">
                Análisis de Periodicidad C2 (Command & Control Beacon Interval)
              </h2>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              En el análisis de tráfico de red forense (Módulo 13 y 14), se calcula la diferencia de tiempo ($\Delta t$) entre conexiones consecutivas al mismo destino remoto. Un jitter cercano al 0% indica un temporizador fijo (sleep) en el código del implante.
            </p>

            {/* Visual Pulses */}
            <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-3">
              <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider block">
                Cronología de Balizas Detectadas hacia 203.0.113.44:4444 (Proceso svc_update.exe PID 4821):
              </span>

              <div className="space-y-2">
                {c2Connections.map((conn, idx) => {
                  return (
                    <div
                      key={conn.id}
                      className="p-3 rounded bg-[#161b22] border border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-[#e6edf3] font-semibold">{conn.timestamp} UTC</div>
                          <div className="text-[#8b949e] text-[11px]">
                            {conn.localAddress}:{conn.localPort} &rarr;{' '}
                            <span className="text-red-400 font-bold">
                              {conn.remoteAddress}:{conn.remotePort}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {idx > 0 ? (
                          <div className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-center">
                            <span className="text-[10px] text-[#8b949e] block">&Delta; Tiempo previo:</span>
                            <span className="text-[#3fb950] font-bold text-xs">+60.00 seg (1 min)</span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-[#8b949e]">
                            Primer contacto
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold">
                          ESTABLISHED
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Intervalo Promedio:</span>
                  <span className="text-[#3fb950] font-bold text-sm">60.01 segundos</span>
                </div>
                <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Jitter / Variación:</span>
                  <span className="text-[#58a6ff] font-bold text-sm">~0% (Estricto sin aleatoriedad)</span>
                </div>
                <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#8b949e] block text-[10px]">Diagnóstico Pericial:</span>
                  <span className="text-red-400 font-bold text-sm">Canal C2 Automatizado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DNS Tunneling View */}
      {activeNetworkTab === 'dns' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#f0883e]" />
              <h2 className="text-base font-bold text-[#e6edf3]">
                Análisis de Consultas DNS & Exfiltración Encubierta (DNS Tunneling)
              </h2>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              El atacante utilizó consultas DNS tipo TXT dirigidas al dominio <code>c2-relay.test</code>. Al inspeccionar la entropía y decodificar los fragmentos hexadecimales incrustados en los subdominios, se observa la filtración progresiva de credenciales y datos del equipo.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0d1117] border-b border-[#30363d] text-[#8b949e] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Hora UTC</th>
                    <th className="py-2.5 px-2">Tipo</th>
                    <th className="py-2.5 px-2">Subdominio Consultado</th>
                    <th className="py-2.5 px-2">Entropía</th>
                    <th className="py-2.5 px-2">Carga Útil Decodificada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/40 text-[11px]">
                  {DNS_QUERIES.map((dns) => {
                    return (
                      <tr
                        key={dns.id}
                        className={`hover:bg-[#21262d]/40 transition-colors ${
                          dns.isTunneling ? 'bg-orange-500/10 text-orange-200' : 'text-[#8b949e]'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-[#58a6ff] whitespace-nowrap">{dns.timestamp}</td>
                        <td className="py-2.5 px-2 font-bold text-[#e6edf3]">{dns.recordType}</td>
                        <td className="py-2.5 px-2 font-mono text-[#f0883e] max-w-[220px] truncate">
                          {dns.queryDomain}
                        </td>
                        <td className="py-2.5 px-2 font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              dns.entropy > 3.5
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-[#0d1117] text-[#3fb950]'
                            }`}
                          >
                            {dns.entropy.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-[#e6edf3] font-mono text-[10px]">
                          {dns.decodedData ? (
                            <span className="p-1 rounded bg-[#0d1117] border border-[#30363d] block truncate max-w-[320px]">
                              {dns.decodedData}
                            </span>
                          ) : (
                            <span className="text-[#8b949e]">Consulta legítima estándar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Wireshark Follow TCP Stream Modal */}
      {inspectStreamId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-[#f0883e]" />
                <h3 className="font-bold text-sm">
                  Wireshark: Follow TCP Stream (Stream {inspectStreamId})
                </h3>
              </div>
              <button
                onClick={() => setInspectStreamId(null)}
                className="p-1 rounded text-[#8b949e] hover:text-[#e6edf3]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="text-xs text-[#8b949e]">
                Conversación TCP entre <code>10.0.2.15:49182</code> y <code>203.0.113.44:4444</code>:
              </div>

              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="text-blue-400">
                  <span className="text-[10px] text-[#8b949e] block">[Cliente 10.0.2.15 &rarr; C2 203.0.113.44 (64 bytes)]</span>
                  GHOST_BEACON_V1|CLIENT_ID=WK9_ADMIN|PID=4821|KEY=A9F1
                </div>

                <div className="text-red-400">
                  <span className="text-[10px] text-[#8b949e] block">[C2 203.0.113.44 &rarr; Cliente 10.0.2.15 (32 bytes)]</span>
                  GHOST_ACK|SLEEP=60|CMD=NOP
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs font-sans">
                <span className="font-semibold text-[#f0883e] block mb-1">Hallazgo Pericial:</span>
                <p className="text-[#8b949e] text-xs leading-relaxed">
                  El payload del stream 14 confirma que la aplicación en el puerto 4444 responde con la directiva explícita <code>SLEEP=60</code>, ordenando al implante mantenerse inactivo durante 60 segundos antes de emitir la siguiente baliza.
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-[#30363d] flex justify-end">
              <button
                onClick={() => setInspectStreamId(null)}
                className="px-4 py-1.5 rounded bg-[#f0883e] text-white text-xs font-medium"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
