import React, { useState } from 'react';
import {
  Cloud,
  Server,
  AlertTriangle,
  Shield,
  FileCode,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Lock,
  Layers
} from 'lucide-react';
import { CLOUDTRAIL_EVENTS } from '../data/forensicCaseData';
import { CloudTrailEvent } from '../types/forensics';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

const cloudExportColumns: ExportColumn<CloudTrailEvent>[] = [
  { header: 'Event ID', accessor: (c) => c.eventId },
  { header: 'EventTime (UTC)', accessor: (c) => c.eventTime },
  { header: 'EventName (Acción)', accessor: (c) => c.eventName },
  { header: 'EventSource', accessor: (c) => c.eventSource },
  { header: 'Región AWS', accessor: (c) => c.awsRegion },
  { header: 'IP Origen', accessor: (c) => c.sourceIPAddress },
  { header: 'User Agent', accessor: (c) => c.userAgent },
  { header: 'Usuario IAM', accessor: (c) => c.userIdentity.userName },
  { header: 'ARN Principal', accessor: (c) => c.userIdentity.arn },
  { header: 'Anomalía Detectada', accessor: (c) => c.isAnomaly ? 'ALERTA / ANOMALÍA' : 'NORMAL' },
  { header: 'Explicación del Riesgo', accessor: (c) => c.riskExplanation || '' },
  { header: 'MITRE ATT&CK', accessor: (c) => c.mitreTechnique ? `${c.mitreTechnique.id} - ${c.mitreTechnique.name}` : '' },
  { header: 'Parámetros Solicitud', accessor: (c) => JSON.stringify(c.requestParameters) }
];

export const CloudViewer: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>(CLOUDTRAIL_EVENTS[0].eventId);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const selectedEvent = CLOUDTRAIL_EVENTS.find((e) => e.eventId === selectedEventId) || CLOUDTRAIL_EVENTS[0];

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Análisis Forense en la Nube (AWS CloudTrail)</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Inspección de registros de auditoría de infraestructura Cloud (AWS CloudTrail). Rastreo del uso de credenciales robadas en memoria RAM para acceder a buckets S3 y crear puertas traseras IAM.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#8b949e]">Módulo del curso:</span>
            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#d29922] font-mono">
              Módulo 16 (Cloud Forensics)
            </span>
            <ExportViewButton
              data={CLOUDTRAIL_EVENTS}
              viewName="AWS CloudTrail Audit Logs"
              filenamePrefix="cloudtrail_audit_logs"
              columns={cloudExportColumns}
              customMetadata={{
                region: 'eu-west-1',
                compromisedBucket: 'ghost-corp-backup-prod',
                attackerIp: '203.0.113.44'
              }}
            />
          </div>
        </div>
      </div>

      {/* Critical Correlation Alert Banner */}
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#f0883e] shrink-0 mt-0.5" />
        <div className="text-xs">
          <h2 className="font-bold text-[#f0883e] text-sm">
            Correlación Cruzada de Atribución (IP 203.0.113.44)
          </h2>
          <p className="text-[#e6edf3] mt-1 leading-relaxed">
            Observa que la dirección IP registrada en CloudTrail (<code>203.0.113.44</code>) coincide con la IP del atacante RDP (Event 4624) y con el servidor C2 del beaconing. Esto demuestra forensicamente que el mismo adversario utilizó las credenciales de AWS exfiltradas desde el endpoint para pivotar a la nube.
          </p>
        </div>
      </div>

      {/* Split View: Events Table Left, JSON & Forensic Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Events Cards (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          {CLOUDTRAIL_EVENTS.map((evt) => {
            const isSelected = selectedEvent.eventId === evt.eventId;
            return (
              <div
                key={evt.eventId}
                onClick={() => setSelectedEventId(evt.eventId)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#161b22] border-[#f0883e] shadow-md'
                    : 'bg-[#161b22]/60 hover:bg-[#161b22] border-[#30363d]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#58a6ff]">
                    {evt.eventTime}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                    ANOMALÍA
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-[#e6edf3]">
                    {evt.eventName}
                  </span>
                  <span className="text-xs text-[#8b949e]">({evt.eventSource})</span>
                </div>

                <p className="text-xs text-[#8b949e] line-clamp-2 mb-3">
                  {evt.riskExplanation}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#30363d]/60">
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">sourceIPAddress:</span>
                    <span className="text-[#f85149] font-bold">{evt.sourceIPAddress}</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">userName IAM:</span>
                    <span className="text-[#3fb950] font-semibold">{evt.userIdentity.userName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* JSON & Investigation Details (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#f0883e]" />
                <h3 className="font-bold text-sm text-[#e6edf3]">
                  Registro JSON de CloudTrail ({selectedEvent.eventName})
                </h3>
              </div>
              <button
                onClick={() => handleCopyJson(selectedEvent)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0d1117] hover:bg-[#21262d] text-xs text-[#58a6ff] border border-[#30363d] transition-colors"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copiado' : 'Copiar JSON'}</span>
              </button>
            </div>

            {/* Explanation box */}
            <div className="p-3 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs">
              <span className="font-semibold text-[#f0883e] block mb-1">Impacto Forense:</span>
              <p className="text-[#8b949e] leading-relaxed">
                {selectedEvent.riskExplanation}
              </p>
            </div>

            {/* Structured Raw JSON */}
            <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto max-h-[420px] leading-relaxed">
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
