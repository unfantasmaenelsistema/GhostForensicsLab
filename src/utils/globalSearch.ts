import {
  TIMELINE_EVENTS,
  REGISTRY_HIVES,
  EVENT_LOGS,
  PROCESS_TREE,
  NETWORK_CONNECTIONS,
  DNS_QUERIES,
  CLOUDTRAIL_EVENTS
} from '../data/forensicCaseData';
import { FORENSIC_GLOSSARY_TERMS } from '../data/glossaryData';
import { ActiveTab } from '../components/Navbar';

export interface GlobalSearchResult {
  id: string;
  title: string;
  snippet: string;
  category: 'Timeline' | 'Event Logs' | 'Registro' | 'Memoria' | 'Red' | 'Cloud' | 'Glosario';
  targetTab?: ActiveTab;
  isGlossary?: boolean;
  glossaryTermId?: string;
  badge?: string;
  timestamp?: string;
  matchField?: string;
}

export function searchAllForensicArtifacts(query: string): GlobalSearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const results: GlobalSearchResult[] = [];

  // 1. Search Timeline Events
  TIMELINE_EVENTS.forEach((evt) => {
    const raw = evt.technicalDetails.rawRecord?.toLowerCase() || '';
    const hash = evt.technicalDetails.fileHash?.toLowerCase() || '';
    const ip = evt.technicalDetails.ipAddress?.toLowerCase() || '';
    const file = evt.technicalDetails.filePath?.toLowerCase() || '';
    const user = evt.technicalDetails.user?.toLowerCase() || '';
    const proc = evt.technicalDetails.processName?.toLowerCase() || '';
    const mitre = evt.mitre ? `${evt.mitre.id} ${evt.mitre.name}`.toLowerCase() : '';
    const summary = evt.summary.toLowerCase();
    const desc = evt.description.toLowerCase();

    if (
      summary.includes(q) ||
      desc.includes(q) ||
      hash.includes(q) ||
      ip.includes(q) ||
      file.includes(q) ||
      user.includes(q) ||
      proc.includes(q) ||
      raw.includes(q) ||
      mitre.includes(q)
    ) {
      let matchedIn = 'Resumen';
      if (hash.includes(q)) matchedIn = 'Hash SHA-256';
      else if (ip.includes(q)) matchedIn = 'Dirección IP';
      else if (file.includes(q)) matchedIn = 'Ruta de archivo';
      else if (proc.includes(q)) matchedIn = 'Proceso';
      else if (raw.includes(q)) matchedIn = 'Registro sin procesar (Raw)';

      results.push({
        id: `tl-${evt.id}`,
        title: evt.summary,
        snippet: `${evt.description} [Coincidencia en: ${matchedIn}]`,
        category: 'Timeline',
        targetTab: 'timeline',
        badge: evt.artifactType,
        timestamp: evt.timestamp,
        matchField: matchedIn
      });
    }
  });

  // 2. Search Windows Event Logs (EVTX)
  EVENT_LOGS.forEach((log) => {
    const eventIdStr = log.eventId.toString();
    const xml = log.rawXml.toLowerCase();
    const desc = log.description.toLowerCase();
    const user = log.user.toLowerCase();
    const ip = log.ipAddress?.toLowerCase() || '';
    const proc = log.processName?.toLowerCase() || '';

    if (
      eventIdStr.includes(q) ||
      desc.includes(q) ||
      xml.includes(q) ||
      user.includes(q) ||
      ip.includes(q) ||
      proc.includes(q)
    ) {
      results.push({
        id: `evtx-${log.recordId}`,
        title: `Evento ${log.eventId}: ${log.taskCategory}`,
        snippet: log.description,
        category: 'Event Logs',
        targetTab: 'events',
        badge: `ID ${log.eventId} / ${log.channel}`,
        timestamp: log.timeCreated,
        matchField: ip.includes(q) ? 'IP de origen' : eventIdStr.includes(q) ? 'Event ID' : 'Texto de evento'
      });
    }
  });

  // 3. Search Windows Registry Hives
  REGISTRY_HIVES.forEach((hive) => {
    function searchKey(node: any) {
      if (!node) return;
      const keyPath = node.path?.toLowerCase() || '';
      if (keyPath.includes(q)) {
        results.push({
          id: `reg-key-${node.path}`,
          title: `Clave: ${node.name}`,
          snippet: `Ruta: ${node.path}`,
          category: 'Registro',
          targetTab: 'registry',
          badge: hive.name,
          timestamp: node.lastWriteTime
        });
      }

      if (node.values && Array.isArray(node.values)) {
        node.values.forEach((val: any) => {
          const valName = val.name?.toLowerCase() || '';
          const valData = val.value?.toLowerCase() || '';
          const valDecoded = val.decoded?.toLowerCase() || '';
          const valNote = val.note?.toLowerCase() || '';

          if (valName.includes(q) || valData.includes(q) || valDecoded.includes(q) || valNote.includes(q)) {
            results.push({
              id: `reg-val-${node.path}-${val.name}`,
              title: `Valor: ${val.name}`,
              snippet: `Dato: ${val.value} ${val.decoded ? `(Decodificado: ${val.decoded})` : ''}`,
              category: 'Registro',
              targetTab: 'registry',
              badge: `${hive.name} / ${val.type}`,
              timestamp: val.lastWriteTime
            });
          }
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(searchKey);
      }
    }

    searchKey(hive.root);
  });

  // 4. Search Memory & Process Tree (Volatility3)
  PROCESS_TREE.forEach((proc) => {
    const name = proc.name.toLowerCase();
    const pidStr = proc.pid.toString();
    const ppidStr = proc.ppid.toString();
    const cmd = proc.commandLine.toLowerCase();
    const reason = proc.suspiciousReason?.toLowerCase() || '';
    const user = proc.user.toLowerCase();

    // Check VAD / malfind
    const hasVadMatch = proc.vadRegions?.some((v) =>
      v.startAddress.toLowerCase().includes(q) ||
      v.disassembly.toLowerCase().includes(q) ||
      v.notes.toLowerCase().includes(q) ||
      (v.yaraMatch && v.yaraMatch.toLowerCase().includes(q))
    );

    if (name.includes(q) || pidStr === q || ppidStr === q || cmd.includes(q) || reason.includes(q) || user.includes(q) || hasVadMatch) {
      results.push({
        id: `proc-${proc.pid}`,
        title: `Proceso ${proc.name} (PID: ${proc.pid})`,
        snippet: proc.commandLine ? `Línea de comando: ${proc.commandLine}` : `Ruta: ${proc.path}`,
        category: 'Memoria',
        targetTab: 'memory',
        badge: proc.isSuspicious ? 'Anomalía Memoria' : 'Proceso Volatility',
        timestamp: proc.createTime
      });
    }
  });

  // 5. Search Network & DNS
  NETWORK_CONNECTIONS.forEach((conn) => {
    const remoteIp = conn.remoteAddress.toLowerCase();
    const localIp = conn.localAddress.toLowerCase();
    const proc = conn.processName.toLowerCase();
    const portStr = conn.remotePort.toString();
    const note = conn.note?.toLowerCase() || '';

    if (remoteIp.includes(q) || localIp.includes(q) || proc.includes(q) || portStr === q || note.includes(q)) {
      results.push({
        id: `net-${conn.id}`,
        title: `Conexión ${conn.protocol}: ${conn.localAddress}:${conn.localPort} -> ${conn.remoteAddress}:${conn.remotePort}`,
        snippet: `${conn.processName} (PID ${conn.pid}) - ${conn.note || conn.state}`,
        category: 'Red',
        targetTab: 'network',
        badge: conn.isC2 ? 'C2 Beaconing' : 'Socket Netscan',
        timestamp: conn.timestamp
      });
    }
  });

  DNS_QUERIES.forEach((dns) => {
    const domain = dns.queryDomain.toLowerCase();
    const decoded = dns.decodedData?.toLowerCase() || '';

    if (domain.includes(q) || decoded.includes(q)) {
      results.push({
        id: `dns-${dns.id}`,
        title: `Consulta DNS ${dns.recordType}: ${dns.queryDomain}`,
        snippet: dns.decodedData ? `Payload decodificado: ${dns.decodedData}` : `Entropía: ${dns.entropy.toFixed(2)}`,
        category: 'Red',
        targetTab: 'network',
        badge: dns.isTunneling ? 'Túnel DNS' : 'Consulta DNS',
        timestamp: dns.timestamp
      });
    }
  });

  // 6. Search CloudTrail Events
  CLOUDTRAIL_EVENTS.forEach((ct) => {
    const name = ct.eventName.toLowerCase();
    const srcIp = ct.sourceIPAddress.toLowerCase();
    const user = ct.userIdentity.userName?.toLowerCase() || '';
    const risk = ct.riskExplanation?.toLowerCase() || '';
    const jsonStr = JSON.stringify(ct).toLowerCase();

    if (name.includes(q) || srcIp.includes(q) || user.includes(q) || risk.includes(q) || jsonStr.includes(q)) {
      results.push({
        id: `ct-${ct.eventId}`,
        title: `AWS CloudTrail: ${ct.eventName}`,
        snippet: `${ct.riskExplanation} (IP: ${ct.sourceIPAddress}, Usuario: ${ct.userIdentity.userName})`,
        category: 'Cloud',
        targetTab: 'cloud',
        badge: ct.eventName,
        timestamp: ct.eventTime
      });
    }
  });

  // 7. Search Forensic Glossary Terms
  FORENSIC_GLOSSARY_TERMS.forEach((term) => {
    const title = term.term.toLowerCase();
    const acronym = term.acronym?.toLowerCase() || '';
    const summary = term.summary.toLowerCase();
    const tool = term.fossTool.toLowerCase();

    if (title.includes(q) || acronym.includes(q) || summary.includes(q) || tool.includes(q)) {
      results.push({
        id: `glossary-${term.id}`,
        title: `Glosario: ${term.term}`,
        snippet: term.summary,
        category: 'Glosario',
        isGlossary: true,
        glossaryTermId: term.id,
        badge: term.acronym || 'Concepto DFIR'
      });
    }
  });

  return results;
}
