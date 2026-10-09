import React, { useState } from 'react';
import {
  FileCheck,
  Copy,
  Check,
  Download,
  Printer,
  Shield,
  FileText,
  UserCheck,
  Calendar,
  Building,
  HardDrive,
  Cpu,
  Radio,
  Cloud
} from 'lucide-react';
import {
  CASE_METADATA,
  ATTACK_CHAIN_STAGES,
  TIMELINE_EVENTS,
  INVESTIGATION_QUESTIONS
} from '../data/forensicCaseData';
import { GhostLogo } from './GhostLogo';

interface ReportGeneratorProps {
  userAnswers: Record<string, string>;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ userAnswers }) => {
  const [examinerName, setExaminerName] = useState<string>('Analista Forense Digital (Ghost Academy)');
  const [courtEntity, setCourtEntity] = useState<string>('Comité de Ciberseguridad & Dirección Técnica / Juzgado de Instrucción');
  const [caseTitleCustom, setCaseTitleCustom] = useState<string>(CASE_METADATA.caseTitle);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  // Calculate solved findings
  const solvedCount = Object.keys(userAnswers).length;

  const generateMarkdownReport = () => {
    return `# INFORME PERICIAL FORENSE DIGITAL (DFIR)
**Ghost Academy Cyber Labs — Forensic Incident Response**
**Referencia de Caso:** ${CASE_METADATA.caseId}
**Fecha de Emisión:** ${CASE_METADATA.creationDate}
**Perito Responsable:** ${examinerName}
**Destinatario:** ${courtEntity}

---

## 1. INFORMACIÓN GENERAL Y CADENA DE CUSTODIA

El presente dictamen pericial ha sido elaborado a solicitud de la entidad requirente sobre las evidencias digitales intervenidas en el incidente de seguridad detectado el 14 de marzo de 2026 en el equipo identificado como **${CASE_METADATA.victimHostname}** (IP local: \`${CASE_METADATA.victimIp}\`).

### 1.1 Hashes Criptográficos de Integridad de las Evidencias (SHA-256)
- **Imagen Forense de Disco:** \`${CASE_METADATA.evidenceHashes.diskImage.filename}\`
  - SHA-256: \`${CASE_METADATA.evidenceHashes.diskImage.sha256}\`
- **Volcado de Memoria RAM:** \`${CASE_METADATA.evidenceHashes.memoryDump.filename}\`
  - SHA-256: \`${CASE_METADATA.evidenceHashes.memoryDump.sha256}\`
- **Captura de Tráfico de Red (PCAP):** \`${CASE_METADATA.evidenceHashes.pcapCapture.filename}\`
  - SHA-256: \`${CASE_METADATA.evidenceHashes.pcapCapture.sha256}\`
- **Auditoría CloudTrail:** \`${CASE_METADATA.evidenceHashes.cloudTrailLog.filename}\`
  - SHA-256: \`${CASE_METADATA.evidenceHashes.cloudTrailLog.sha256}\`

---

## 2. RESUMEN EJECUTIVO

Entre las 02:01:44 UTC y las 02:31:05 UTC del 14 de marzo de 2026, el equipo **${CASE_METADATA.victimHostname}** fue objeto de una intrusión dirigida procedente de la dirección IP pública **\`${CASE_METADATA.attackerIp}\`**.

El actor de amenazas ejecutó una secuencia de intrusión estructurada:
1. Acceso inicial interactivo por Escritorio Remoto (RDP) vulnerando la cuenta local **\`${CASE_METADATA.compromisedUser}\`**.
2. Establecimiento de persistencia en disco y registro mediante el ejecutable malicioso **\`${CASE_METADATA.maliciousProcess}\`** (PID \`${CASE_METADATA.maliciousPid}\`).
3. Inyección de código en memoria hacia el subsistema LSA (**\`${CASE_METADATA.injectedProcess}\`**, PID \`${CASE_METADATA.injectedPid}\`) y volcado de credenciales en memoria (Mimikatz).
4. Canal de comando y control (C2) con baliza regular cada 60 segundos hacia **\`${CASE_METADATA.attackerIp}:${CASE_METADATA.c2Port}\`**.
5. Exfiltración encubierta de credenciales robadas mediante un **Túnel DNS** (*DNS Tunneling*).
6. Movimiento lateral hacia el entorno Cloud (AWS) con descarga no autorizada de copias de seguridad de producción en S3 y creación de claves de acceso persistentes en IAM.
7. Vaciado intencionado del registro de eventos de Seguridad de Windows (Event ID 1102) como medida anti-forense antes de la desconexión.

---

## 3. METODOLOGÍA FORENSE UTILIZADA

La investigación se condujo bajo el marco metodológico **ISO/IEC 27037:2012** (Directrices para la identificación, recogida, adquisición y conservación de evidencias digitales) y las mejores prácticas de **NIST SP 800-86**.
Se utilizaron exclusivamente herramientas forenses de código abierto y contrastada validez judicial (FOSS):
- **Volatility3 (v2.7.0):** Análisis forense de memoria RAM (plugins \`pstree\`, \`malfind\`, \`cmdline\`, \`netscan\`).
- **Eric Zimmerman Tools:**
  - \`MFTECmd\`: Parseo de la Master File Table ($MFT).
  - \`RECmd\`: Extracción y análisis de colmenas de Registro (SOFTWARE, SYSTEM, NTUSER.DAT).
  - \`PECmd\`: Análisis de artefactos de ejecución Prefetch (.pf).
- **Wireshark & Zeek:** Análisis de tráfico de red, reconstrucción de streams TCP y telemetría DNS.
- **Hayabusa & EvtxECmd:** Triaje y correlación cronológica de logs de eventos EVTX.

---

## 4. CRONOLOGÍA DE LOS HECHOS RECONSTRUIDA

| Hora (UTC) | Artefacto / Fuente | Evento / Técnica | Detalle Pericial |
|---|---|---|---|
${ATTACK_CHAIN_STAGES.map(
  (s) => `| ${s.timeUtc} | ${s.evidenceArtifact} | ${s.techniqueId} (${s.techniqueName}) | ${s.description} |`
).join('\n')}

---

## 5. HALLAZGOS TÉCNICOS DETALLADOS POR VECTOR

### 5.1 Evidencias en Disco y Registro (Windows Forensics)
- **$MFT Registro 104281:** Creación del archivo \`C:\\Windows\\System32\\svc_update.exe\` a las 02:08:55 UTC (SHA-256: \`9f8a3c2e1b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f\`).
- **Clave Run de Registro:** \`HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\` contenía el valor \`WindowsUpdateSvc\` apuntando a dicho binario.
- **Prefetch:** \`SVC_UPDATE.EXE-A4B71D02.pf\` confirma dos ejecuciones sucesivas a las 02:09:12 y 02:09:41 UTC.

### 5.2 Evidencias en Memoria RAM (Volatility3)
- Región VAD con permisos **\`PAGE_EXECUTE_READWRITE\`** (RWX) en dirección \`0x0000021a8f940000\` dentro de \`lsass.exe\` (PID 612).
- Firma YARA \`mimikatz_sekurlsa_hook\` coincidente en el volcado de código ejecutable inyectado.

### 5.3 Evidencias de Red y Comunicaciones C2
- Conexiones periódicas recurrentes hacia \`${CASE_METADATA.attackerIp}:${CASE_METADATA.c2Port}\` con delta temporal estricto de **60.00 segundos** (jitter = 0%).
- Ráfaga de peticiones DNS TXT con entropía superior a 3.9 bits/byte hacia el dominio \`c2-relay.test\` conteniendo fragmentos de credenciales codificadas.

### 5.4 Evidencias en Entorno Nube (AWS CloudTrail)
- Petición \`GetObject\` para el recurso \`ghost-corp-backup-prod/db_dump_2026.sql\` desde la IP atacante \`${CASE_METADATA.attackerIp}\`.
- Creación de credenciales persistentes IAM (\`CreateAccessKey\`) para el usuario \`backdoor-admin\`.

### 5.5 Acciones Anti-Forense
- A las 02:31:05 UTC, se registró el Event ID 1102 confirmando la ejecución del comando \`wevtutil cl Security\` por el usuario \`${CASE_METADATA.compromisedUser}\`.

---

## 6. MAPEO DE TÉCNICAS MITRE ATT&CK
- **T1110:** Brute Force (Fuerza bruta contra RDP)
- **T1078:** Valid Accounts (Uso de cuenta comprometida administrator)
- **T1547.001:** Registry Run Keys / Startup Folder (Persistencia)
- **T1204.002:** User Execution: Malicious File
- **T1055:** Process Injection (Inyección en LSASS)
- **T1003.001:** OS Credential Dumping: LSASS Memory
- **T1071:** Application Layer Protocol (C2 Beaconing periódico)
- **T1071.004:** DNS Tunneling (Exfiltración por DNS)
- **T1098 / T1530:** Account Manipulation & Cloud Storage Exfiltration
- **T1070.001:** Indicator Removal: Clear Windows Event Logs

---

## 7. CONCLUSIONES Y MEDIDAS CORRECTIVAS

1. **Aislamiento y Reinstalación:** Desactivar la clave Run maliciosa, purgar el binario \`svc_update.exe\` y proceder al despliegue de imagen limpia del sistema operativo.
2. **Rotación Inmediata de Secretos:** Revocar todas las contraseñas de cuentas locales y de dominio, así como la clave de acceso de AWS IAM \`AKIAIOSFODNN7EXAMPLE\`.
3. **Bloqueo Perimetral:** Bloquear en firewalls de borde la IP atacante \`${CASE_METADATA.attackerIp}\` y el puerto \`${CASE_METADATA.c2Port}\`.
4. **Habilitación de LSA Protection:** Habilitar RunAsPPL en Windows (\`HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\RunAsPPL = 1\`) y Credential Guard para mitigar inyecciones futuras en memoria de LSASS.

Dictaminado en fecha ${CASE_METADATA.creationDate} por:
**${examinerName}**
*Ghost Academy DFIR Specialist & Digital Forensics Examiner*
`;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Pericial_DFIR_${CASE_METADATA.caseId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (Hidden in print) */}
      <div className="p-5 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Generador de Informe Pericial DFIR (Módulo 20)</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Genera automáticamente el dictamen pericial forense formal incorporando la cadena de custodia, cronología, evidencias técnicas y recomendaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] text-xs font-medium border border-[#30363d] transition-colors"
            >
              {copiedMarkdown ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMarkdown ? '¡Copiado!' : 'Copiar Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] text-xs font-medium border border-[#30363d] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar .md</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#f0883e] hover:bg-[#d2732e] text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>

        {/* Customization Inputs */}
        <div className="pt-3 border-t border-[#30363d]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[#8b949e] block mb-1">Nombre del Perito Forense:</label>
            <input
              type="text"
              value={examinerName}
              onChange={(e) => setExaminerName(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] focus:outline-none focus:border-[#f0883e]"
            />
          </div>

          <div>
            <label className="text-[#8b949e] block mb-1">Entidad Requirente / Juzgado:</label>
            <input
              type="text"
              value={courtEntity}
              onChange={(e) => setCourtEntity(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-[#0d1117] border border-[#30363d] text-[#e6edf3] focus:outline-none focus:border-[#f0883e]"
            />
          </div>
        </div>
      </div>

      {/* Official Rendered Document Preview (Matches Court Format) */}
      <div className="report-container bg-white text-gray-900 border border-gray-300 rounded-xl p-8 sm:p-12 shadow-md max-w-4xl mx-auto space-y-8 font-serif leading-relaxed text-sm">
        {/* Document Header */}
        <div className="border-b-2 border-gray-900 pb-6 flex justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-300 p-1 flex items-center justify-center shrink-0"
              title="Un Fantasma en el Sistema"
            >
              <GhostLogo className="w-12 h-12" />
            </a>
            <div>
              <div className="text-xl font-bold tracking-tight text-gray-900 uppercase font-sans">
                Dictamen Pericial Forense Digital
              </div>
              <div className="text-sm font-semibold text-[#bc4c00] mt-0.5 font-sans flex items-center gap-2">
                <span>Ghost Academy DFIR Incident Response Lab &middot; Módulo 20</span>
                <span>&middot;</span>
                <a
                  href="https://www.unfantasmaenelsistema.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-[#bc4c00] underline"
                >
                  unfantasmaenelsistema.com
                </a>
              </div>
              <div className="text-xs text-gray-600 mt-1 font-mono">
                Expediente: {CASE_METADATA.caseId} &middot; Fecha: {CASE_METADATA.creationDate}
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 font-sans shrink-0">
            <div>HOST: {CASE_METADATA.victimHostname}</div>
            <div>IP: {CASE_METADATA.victimIp}</div>
            <div className="font-mono text-[10px] text-gray-400 mt-1">ISO/IEC 27037:2012 COMPLIANT</div>
          </div>
        </div>

        {/* Parties and Custody Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans p-4 bg-gray-50 rounded border border-gray-200">
          <div>
            <span className="text-gray-500 block uppercase text-[10px] font-bold">Perito Encargado:</span>
            <span className="font-bold text-gray-800">{examinerName}</span>
          </div>
          <div>
            <span className="text-gray-500 block uppercase text-[10px] font-bold">Destinatario / Juzgado:</span>
            <span className="font-bold text-gray-800">{courtEntity}</span>
          </div>
        </div>

        {/* 1. Cadena de Custodia */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 font-sans uppercase">
            1. Evidencias Recibidas y Cadena de Custodia
          </h2>
          <p className="text-xs text-gray-700">
            Se recibieron las siguientes evidencias digitales en formato crudo, habiéndose verificado inmediatamente sus firmas digitales criptográficas SHA-256 para garantizar la integridad e inalterabilidad:
          </p>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-2 bg-gray-100 rounded border border-gray-200">
              <strong>Disco:</strong> {CASE_METADATA.evidenceHashes.diskImage.filename} <br />
              <span className="text-gray-600 text-[10px]">SHA-256: {CASE_METADATA.evidenceHashes.diskImage.sha256}</span>
            </div>
            <div className="p-2 bg-gray-100 rounded border border-gray-200">
              <strong>Memoria RAM:</strong> {CASE_METADATA.evidenceHashes.memoryDump.filename} <br />
              <span className="text-gray-600 text-[10px]">SHA-256: {CASE_METADATA.evidenceHashes.memoryDump.sha256}</span>
            </div>
            <div className="p-2 bg-gray-100 rounded border border-gray-200">
              <strong>Red:</strong> {CASE_METADATA.evidenceHashes.pcapCapture.filename} <br />
              <span className="text-gray-600 text-[10px]">SHA-256: {CASE_METADATA.evidenceHashes.pcapCapture.sha256}</span>
            </div>
          </div>
        </section>

        {/* 2. Resumen Ejecutivo */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 font-sans uppercase">
            2. Resumen Ejecutivo del Incidente
          </h2>
          <p className="text-xs text-gray-800 leading-relaxed">
            Se ha determinado de forma fehaciente que entre las 02:01:44 y 02:31:05 UTC del 14 de marzo de 2026, el sistema informático fue vulnerado desde la dirección IP externa <strong>{CASE_METADATA.attackerIp}</strong>. El adversario empleó técnicas de fuerza bruta para obtener acceso por Escritorio Remoto con la cuenta <strong>{CASE_METADATA.compromisedUser}</strong>, consolidó persistencia en el registro, inyectó código malicioso en el proceso <strong>lsass.exe</strong> para extraer credenciales, estableció un canal C2 con temporizador exacto de 60 segundos, exfiltró datos por túnel DNS y comprometió recursos de copia de seguridad en AWS S3 antes de vaciar los registros de seguridad locales.
          </p>
        </section>

        {/* 3. Cronología Reconstruida */}
        <section className="space-y-3 report-page-break">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 font-sans uppercase">
            3. Cronología de los Hechos Reconstruida
          </h2>
          <table className="w-full text-left text-xs border border-gray-200 divide-y divide-gray-200 font-sans">
            <thead className="bg-gray-100 text-[11px] font-bold text-gray-700">
              <tr>
                <th className="p-2">Hora (UTC)</th>
                <th className="p-2">Artefacto</th>
                <th className="p-2">Técnica MITRE</th>
                <th className="p-2">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[11px]">
              {ATTACK_CHAIN_STAGES.map((s) => (
                <tr key={s.step}>
                  <td className="p-2 font-mono whitespace-nowrap text-blue-800 font-bold">{s.timeUtc}</td>
                  <td className="p-2 text-gray-600">{s.evidenceArtifact}</td>
                  <td className="p-2 font-mono font-bold text-gray-800">{s.techniqueId}</td>
                  <td className="p-2 text-gray-800">{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 4. Conclusiones y Medidas */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 font-sans uppercase">
            4. Conclusiones y Recomendaciones Técnicas
          </h2>
          <ol className="list-decimal pl-5 text-xs text-gray-800 space-y-1.5 leading-relaxed">
            <li>
              <strong>Aislamiento de Infraestructura:</strong> Deshabilitar inmediatamente la clave de persistencia en <code>HKLM\Software\Microsoft\Windows\CurrentVersion\Run</code> y eliminar el binario <code>svc_update.exe</code>.
            </li>
            <li>
              <strong>Revocación de Credenciales de AWS:</strong> Invalidar la clave de acceso IAM <code>AKIAIOSFODNN7EXAMPLE</code> y restaurar la política restrictiva del bucket S3 <code>ghost-corp-backup-prod</code>.
            </li>
            <li>
              <strong>Bloqueo Perimetral:</strong> Configurar bloqueo en firewall perimetral para la IP <code>203.0.113.44</code> y el puerto C2 <code>4444</code>.
            </li>
            <li>
              <strong>Protección de LSASS:</strong> Implementar <em>LSA Protection (RunAsPPL)</em> en los puestos de trabajo para impedir que procesos secundarios abran handles de lectura/escritura sobre el proceso LSASS.
            </li>
          </ol>
        </section>

        {/* Signatures */}
        <div className="pt-8 border-t border-gray-300 flex justify-between items-end font-sans text-xs">
          <div>
            <div className="font-bold text-gray-900">Ghost Academy Cyber Labs</div>
            <div className="text-gray-500 text-[11px]">Certificación Oficial en Informática Forense (DFIR)</div>
          </div>
          <div className="text-right">
            <div className="border-t border-gray-400 w-48 mb-1"></div>
            <div className="font-bold text-gray-800">{examinerName}</div>
            <div className="text-gray-500 text-[11px]">Perito Forense Colegiado / Especialista DFIR</div>
          </div>
        </div>
      </div>
    </div>
  );
};
