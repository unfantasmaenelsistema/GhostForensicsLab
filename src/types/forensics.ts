export type ArtifactType = 'MFT' | 'Registro' | 'Prefetch' | 'EVTX' | 'Red' | 'Cloud';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  url?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO / UTC format '2026-03-14 02:01:44'
  artifactType: ArtifactType;
  sourceTool: string;
  sourceFile: string;
  severity: EventSeverity;
  summary: string;
  description: string;
  mitre?: MitreTechnique;
  technicalDetails: {
    user?: string;
    ipAddress?: string;
    port?: number;
    filePath?: string;
    fileHash?: string;
    processName?: string;
    pid?: number;
    parentPid?: number;
    registryKey?: string;
    registryValue?: string;
    eventId?: number;
    logonType?: number;
    rawRecord?: string;
    forensicHint?: string;
    standardInfoTime?: string;
    fileNameTime?: string;
  };
}

export interface RegistryValue {
  name: string;
  type: 'REG_SZ' | 'REG_EXPAND_SZ' | 'REG_DWORD' | 'REG_BINARY' | 'REG_MULTI_SZ';
  value: string;
  rawHex?: string;
  decoded?: string;
  lastWriteTime: string;
  note?: string;
  isMalicious?: boolean;
}

export interface RegistryKeyNode {
  name: string;
  path: string;
  lastWriteTime: string;
  values: RegistryValue[];
  children?: RegistryKeyNode[];
  isSuspicious?: boolean;
  forensicArtifact?: string; // e.g. "Run Key / Persistencia", "UserAssist / Ejecución", "USBSTOR"
}

export interface RegistryHive {
  name: string; // "SYSTEM", "SOFTWARE", "NTUSER.DAT", "Amcache"
  path: string;
  root: RegistryKeyNode;
}

export interface EventLogEntry {
  id: string;
  recordId: number;
  timeCreated: string;
  eventId: number;
  channel: 'Security' | 'System';
  level: 'Audit Success' | 'Audit Failure' | 'Information' | 'Warning' | 'Error';
  taskCategory: string;
  computer: string;
  user: string;
  ipAddress?: string;
  port?: number;
  logonType?: number;
  logonTypeName?: string;
  processName?: string;
  processId?: number;
  parentProcessName?: string;
  parentProcessId?: number;
  serviceName?: string;
  rawXml: string;
  description: string;
  isMalicious: boolean;
  mitreTechnique?: MitreTechnique;
}

export interface VadRegion {
  startAddress: string;
  endAddress: string;
  protection: string; // e.g., "PAGE_EXECUTE_READWRITE"
  state: string;
  type: string;
  tag: string;
  hexDump: string;
  disassembly: string;
  entropy: number;
  yaraMatch?: string;
  notes: string;
}

export interface ProcessNode {
  pid: number;
  ppid: number;
  name: string;
  path: string;
  user: string;
  createTime: string;
  exitTime?: string;
  threads: number;
  handles: number;
  sessionId: number;
  integrityLevel: 'System' | 'High' | 'Medium' | 'Low';
  commandLine: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  vadRegions?: VadRegion[];
}

export interface NetworkConnection {
  id: string;
  timestamp: string;
  protocol: 'TCP' | 'UDP';
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: 'ESTABLISHED' | 'SYN_SENT' | 'LISTENING' | 'TIME_WAIT' | 'CLOSE_WAIT';
  pid: number;
  processName: string;
  bytesSent: number;
  bytesReceived: number;
  isC2: boolean;
  beaconIntervalSeconds?: number;
  note?: string;
  tcpStreamId?: number;
}

export interface DnsQuery {
  id: string;
  timestamp: string;
  clientIp: string;
  queryDomain: string;
  recordType: 'A' | 'TXT' | 'AAAA' | 'CNAME';
  response: string;
  payloadSize: number;
  isTunneling: boolean;
  decodedData?: string;
  entropy: number;
}

export interface CloudTrailEvent {
  eventId: string;
  eventTime: string;
  eventSource: string;
  eventName: string;
  awsRegion: string;
  sourceIPAddress: string;
  userAgent: string;
  userIdentity: {
    type: string;
    principalId: string;
    arn: string;
    accountId: string;
    userName: string;
  };
  requestParameters: Record<string, any>;
  responseElements: Record<string, any>;
  isAnomaly: boolean;
  riskExplanation?: string;
  mitreTechnique?: MitreTechnique;
}

export interface InvestigationQuestion {
  id: string;
  stepNumber: number;
  category: 'Acceso Inicial' | 'Persistencia' | 'Ejecución' | 'Privilegios & Credenciales' | 'Comando & Control' | 'Exfiltración' | 'Nube' | 'Anti-Forense';
  question: string;
  context: string;
  hint: string;
  targetTab: 'timeline' | 'registry' | 'events' | 'memory' | 'network' | 'cloud';
  targetTabName: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  mitreTechnique: MitreTechnique;
  pedagogicalFeedback: string;
  evidenceAnchor: string;
}

export interface AttackChainStage {
  step: number;
  timeUtc: string;
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  evidenceArtifact: string;
  toolUsed: string;
  description: string;
  mitreUrl: string;
}

export interface CaseMetadata {
  caseId: string;
  caseTitle: string;
  investigator: string;
  organization: string;
  creationDate: string;
  victimHostname: string;
  victimIp: string;
  osVersion: string;
  compromisedUser: string;
  attackerIp: string;
  c2Port: number;
  maliciousProcess: string;
  maliciousPid: number;
  injectedProcess: string;
  injectedPid: number;
  incidentTimeRange: string;
  evidenceHashes: {
    diskImage: { filename: string; sha256: string };
    memoryDump: { filename: string; sha256: string };
    pcapCapture: { filename: string; sha256: string };
    cloudTrailLog: { filename: string; sha256: string };
  };
}
