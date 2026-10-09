import {
  CaseMetadata,
  TimelineEvent,
  RegistryHive,
  EventLogEntry,
  ProcessNode,
  NetworkConnection,
  DnsQuery,
  CloudTrailEvent,
  InvestigationQuestion,
  AttackChainStage
} from '../types/forensics';

export const CASE_METADATA: CaseMetadata = {
  caseId: 'GH-2026-0314-INC',
  caseTitle: 'Incidente de Intrusión y Exfiltración Multi-Entorno (Caso GhostForensics Lab)',
  investigator: 'Ghost Forensics Analyst (Ghost Academy DFIR)',
  organization: 'Ghost Academy Cyber Labs / Ghostore Corp',
  creationDate: '2026-03-14',
  victimHostname: 'WORKSTATION-09',
  victimIp: '10.0.2.15',
  osVersion: 'Windows 11 Enterprise 23H2 (Build 22631.3296 x64)',
  compromisedUser: 'administrator',
  attackerIp: '203.0.113.44',
  c2Port: 4444,
  maliciousProcess: 'svc_update.exe',
  maliciousPid: 4821,
  injectedProcess: 'lsass.exe',
  injectedPid: 612,
  incidentTimeRange: '2026-03-14 02:01:44 UTC - 2026-03-14 02:31:05 UTC',
  evidenceHashes: {
    diskImage: {
      filename: 'WORKSTATION-09_E01.raw',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    memoryDump: {
      filename: 'WORKSTATION-09_memdump.raw',
      sha256: '9f8a3c2e1b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f'
    },
    pcapCapture: {
      filename: 'traffic_capture_eth0.pcapng',
      sha256: 'b4c7a1029e8d3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a'
    },
    cloudTrailLog: {
      filename: 'aws_cloudtrail_eu-west-1_20260314.json',
      sha256: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
    }
  }
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-01',
    timestamp: '2026-03-14 02:01:44',
    artifactType: 'EVTX',
    sourceTool: 'Hayabusa / EvtxECmd',
    sourceFile: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    severity: 'medium',
    summary: 'Ráfaga de intentos fallidos de autenticación (Fuerza Bruta / RDP)',
    description: 'Múltiples eventos 4625 registrados en menos de 2 minutos contra la cuenta local administrator con código de estado 0xC000006A (bad password).',
    mitre: {
      id: 'T1110',
      name: 'Brute Force: Password Guessing',
      tactic: 'Credential Access',
      url: 'https://attack.mitre.org/techniques/T1110/'
    },
    technicalDetails: {
      user: 'administrator',
      ipAddress: '203.0.113.44',
      port: 53120,
      eventId: 4625,
      logonType: 10,
      forensicHint: 'LogonType 10 corresponde a RemoteInteractive (RDP). El código 0xC000006A confirma contraseña incorrecta.',
      rawRecord: 'EventID: 4625 | TargetUserName: administrator | FailureReason: %%2313 | Status: 0xC000006D | SubStatus: 0xC000006A | IpAddress: 203.0.113.44 | IpPort: 53120 | WorkstationName: KALI-ATTACKER'
    }
  },
  {
    id: 'evt-02',
    timestamp: '2026-03-14 02:04:17',
    artifactType: 'EVTX',
    sourceTool: 'EvtxECmd / EventViewer',
    sourceFile: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    severity: 'critical',
    summary: 'Inicio de sesión exitoso por RDP (LogonType 10) desde IP atacante',
    description: 'La cuenta administrator logra autenticación exitosa remota procedente de la IP externa 203.0.113.44 a través del puerto RDP (3389).',
    mitre: {
      id: 'T1078',
      name: 'Valid Accounts: Local Accounts',
      tactic: 'Initial Access',
      url: 'https://attack.mitre.org/techniques/T1078/'
    },
    technicalDetails: {
      user: 'administrator',
      ipAddress: '203.0.113.44',
      port: 53184,
      eventId: 4624,
      logonType: 10,
      forensicHint: 'Punto de entrada de la intrusión. Inicio de sesión interactivo remoto RDP confirmado.',
      rawRecord: 'EventID: 4624 | TargetUserName: administrator | LogonType: 10 | AuthenticationPackageName: Negotiate | IpAddress: 203.0.113.44 | IpPort: 53184 | ProcessName: C:\\Windows\\System32\\winlogon.exe'
    }
  },
  {
    id: 'evt-03',
    timestamp: '2026-03-14 02:04:19',
    artifactType: 'EVTX',
    sourceTool: 'EvtxECmd',
    sourceFile: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    severity: 'high',
    summary: 'Asignación de privilegios especiales al nuevo inicio de sesión',
    description: 'Se conceden privilegios elevados a la sesión del usuario administrator, incluyendo SeDebugPrivilege y SeTcbPrivilege, permitiendo inspeccionar memoria de procesos del sistema.',
    mitre: {
      id: 'T1078.003',
      name: 'Valid Accounts: Local Accounts (Privilege Grant)',
      tactic: 'Privilege Escalation',
      url: 'https://attack.mitre.org/techniques/T1078/003/'
    },
    technicalDetails: {
      user: 'administrator',
      eventId: 4672,
      forensicHint: 'SeDebugPrivilege es indispensable para que herramientas posteriores como Mimikatz o inyectores puedan abrir handles a lsass.exe.',
      rawRecord: 'EventID: 4672 | SubjectUserName: administrator | PrivilegeList: SeSecurityPrivilege, SeBackupPrivilege, SeRestorePrivilege, SeTakeOwnershipPrivilege, SeDebugPrivilege, SeSystemEnvironmentPrivilege, SeImpersonatePrivilege'
    }
  },
  {
    id: 'evt-04',
    timestamp: '2026-03-14 02:08:55',
    artifactType: 'MFT',
    sourceTool: 'MFTECmd (Eric Zimmerman)',
    sourceFile: 'C:\\$MFT (Record 104281)',
    severity: 'critical',
    summary: 'Creación del artefacto malicioso svc_update.exe en disco ($MFT)',
    description: 'Registro de creación de fichero binario ejecutable en C:\\Windows\\System32\\svc_update.exe. Coincidencia temporal con la clave de persistencia.',
    mitre: {
      id: 'T1053',
      name: 'Scheduled Task/Job / Auto-start Execution',
      tactic: 'Persistence',
      url: 'https://attack.mitre.org/techniques/T1053/'
    },
    technicalDetails: {
      filePath: 'C:\\Windows\\System32\\svc_update.exe',
      fileHash: '9f8a3c2e1b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
      standardInfoTime: '2026-03-14 02:08:55.120',
      fileNameTime: '2026-03-14 02:08:55.120',
      forensicHint: 'Al coincidir los timestamps de $STANDARD_INFORMATION y $FILE_NAME, no hay indicios de timestomping inmediato en la creación.',
      rawRecord: 'EntryNumber: 104281 | SequenceNumber: 3 | FileName: svc_update.exe | ParentPath: C:\\Windows\\System32 | FileSize: 284160 bytes | AllocatedSize: 286720 bytes | IsInUse: True'
    }
  },
  {
    id: 'evt-05',
    timestamp: '2026-03-14 02:08:55',
    artifactType: 'Registro',
    sourceTool: 'RECmd (Eric Zimmerman)',
    sourceFile: 'C:\\Windows\\System32\\config\\SOFTWARE',
    severity: 'critical',
    summary: 'Establecimiento de Persistencia en clave Run de Windows',
    description: 'Se escribe un nuevo valor de arranque automático en HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run apuntando a svc_update.exe.',
    mitre: {
      id: 'T1547.001',
      name: 'Boot or Logon Autostart Execution: Registry Run Keys',
      tactic: 'Persistence',
      url: 'https://attack.mitre.org/techniques/T1547/001/'
    },
    technicalDetails: {
      registryKey: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
      registryValue: 'WindowsUpdateSvc = "C:\\Windows\\System32\\svc_update.exe"',
      forensicHint: 'La clave se hace pasar por un servicio legítimo de actualización de Windows (WindowsUpdateSvc) para evadir sospechas superficiales.',
      rawRecord: 'Key: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run | ValueName: WindowsUpdateSvc | ValueType: REG_SZ | ValueData: C:\\Windows\\System32\\svc_update.exe | LastWriteTime: 2026-03-14 02:08:55.431 UTC'
    }
  },
  {
    id: 'evt-06',
    timestamp: '2026-03-14 02:09:12',
    artifactType: 'Prefetch',
    sourceTool: 'PECmd (Eric Zimmerman)',
    sourceFile: 'C:\\Windows\\Prefetch\\SVC_UPDATE.EXE-A4B71D02.pf',
    severity: 'high',
    summary: 'Primera ejecución de svc_update.exe (Prefetch)',
    description: 'Evidencia irrefutable de ejecución de proceso en Windows mediante artefacto Prefetch. Run Count: 1. Archivos referenciados incluyen ntdll.dll y kernel32.dll.',
    mitre: {
      id: 'T1204.002',
      name: 'User Execution: Malicious File',
      tactic: 'Execution',
      url: 'https://attack.mitre.org/techniques/T1204/002/'
    },
    technicalDetails: {
      filePath: 'C:\\Windows\\Prefetch\\SVC_UPDATE.EXE-A4B71D02.pf',
      processName: 'svc_update.exe',
      forensicHint: 'El hash prefetch A4B71D02 confirma la ruta de ejecución en System32. Permite demostrar que el fichero no solo fue depositado, sino ejecutado.',
      rawRecord: 'SourceFile: SVC_UPDATE.EXE-A4B71D02.pf | Executable: svc_update.exe | RunCount: 2 | PreviousRun1: 2026-03-14 02:09:12 | PreviousRun2: 2026-03-14 02:09:41 | VolumeSerial: 84A2-9F11'
    }
  },
  {
    id: 'evt-07',
    timestamp: '2026-03-14 02:09:41',
    artifactType: 'Prefetch',
    sourceTool: 'PECmd / Volatility3',
    sourceFile: 'C:\\Windows\\Prefetch\\SVC_UPDATE.EXE-A4B71D02.pf',
    severity: 'high',
    summary: 'Segunda ejecución de svc_update.exe e inicialización de payload',
    description: 'Segunda ejecución registrada en Prefetch coincidente con el spawn del PID 4821.',
    mitre: {
      id: 'T1059',
      name: 'Command and Scripting Interpreter',
      tactic: 'Execution',
      url: 'https://attack.mitre.org/techniques/T1059/'
    },
    technicalDetails: {
      processName: 'svc_update.exe',
      pid: 4821,
      forensicHint: 'Esta segunda ejecución realiza la inyección de código hacia el subsistema de seguridad.',
      rawRecord: 'Prefetch Last Run: 2026-03-14 02:09:41.018 UTC | Total Run Count: 2'
    }
  },
  {
    id: 'evt-08',
    timestamp: '2026-03-14 02:09:41',
    artifactType: 'EVTX',
    sourceTool: 'Hayabusa / Sysmon / EvtxECmd',
    sourceFile: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    severity: 'critical',
    summary: 'Creación de proceso con parámetros de inyección (PID 4821)',
    description: 'Evento 4688 registra la creación del proceso svc_update.exe (PID 4821) con línea de comandos con indicadores de inyección hacia lsass.exe.',
    mitre: {
      id: 'T1055',
      name: 'Process Injection',
      tactic: 'Defense Evasion / Privilege Escalation',
      url: 'https://attack.mitre.org/techniques/T1055/'
    },
    technicalDetails: {
      processName: 'svc_update.exe',
      pid: 4821,
      parentPid: 612,
      user: 'NT AUTHORITY\\SYSTEM',
      forensicHint: 'La línea de comando del proceso revela directivas de inyección en memoria hacia el PID 612 (lsass.exe).',
      rawRecord: 'EventID: 4688 | NewProcessName: C:\\Windows\\System32\\svc_update.exe | ProcessId: 0x12D5 (4821) | ParentProcessName: C:\\Windows\\System32\\lsass.exe | CommandLine: svc_update.exe --inject-lsass --target-pid 612'
    }
  },
  {
    id: 'evt-09',
    timestamp: '2026-03-14 02:09:41',
    artifactType: 'Registro',
    sourceTool: 'Volatility3 (windows.malfind)',
    sourceFile: 'RAM Dump: WORKSTATION-09_memdump.raw',
    severity: 'critical',
    summary: 'Inyección de código en memoria de lsass.exe (Dumping de credenciales)',
    description: 'Análisis de Volatility3 detecta región de memoria VAD con protección PAGE_EXECUTE_READWRITE en el proceso lsass.exe (PID 612), conteniendo código shellcode de Mimikatz (sekurlsa::logonpasswords).',
    mitre: {
      id: 'T1003.001',
      name: 'OS Credential Dumping: LSASS Memory',
      tactic: 'Credential Access',
      url: 'https://attack.mitre.org/techniques/T1003/001/'
    },
    technicalDetails: {
      processName: 'lsass.exe',
      pid: 612,
      forensicHint: 'lsass.exe nunca debe albergar páginas VAD RWX asignadas dinámicamente. malfind revela MZ header y stubs de volcado de contraseñas en claro.',
      rawRecord: 'Process: lsass.exe | PID: 612 | Address: 0x0000021a8f940000 | CommitCharge: 12 | Protection: PAGE_EXECUTE_READWRITE | Tag: Vad | YaraMatch: mimikatz_sekurlsa_hook'
    }
  },
  {
    id: 'evt-10',
    timestamp: '2026-03-14 02:10:04',
    artifactType: 'Red',
    sourceTool: 'Wireshark / Volatility3 (windows.netscan)',
    sourceFile: 'PCAP / RAM Dump',
    severity: 'critical',
    summary: 'Inicio de Beaconing periódico C2 hacia 203.0.113.44:4444',
    description: 'Conexión TCP saliente iniciada por svc_update.exe (PID 4821) hacia la dirección 203.0.113.44 en puerto 4444 con periodicidad estricta de 60 segundos.',
    mitre: {
      id: 'T1071',
      name: 'Application Layer Protocol',
      tactic: 'Command and Control',
      url: 'https://attack.mitre.org/techniques/T1071/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      port: 4444,
      pid: 4821,
      processName: 'svc_update.exe',
      forensicHint: 'El análisis de dispersión temporal (jitter = 0%) demuestra un temporizador de beaconing programado exactamente a 60 segundos.',
      rawRecord: 'TCP 10.0.2.15:49182 -> 203.0.113.44:4444 [SYN, ACK] | Stream: 14 | Interval: 60.02s | OwningPID: 4821'
    }
  },
  {
    id: 'evt-11',
    timestamp: '2026-03-14 02:11:04',
    artifactType: 'Red',
    sourceTool: 'Wireshark',
    sourceFile: 'traffic_capture_eth0.pcapng',
    severity: 'high',
    summary: 'Segundo pulso de Beaconing C2 (Intervalo 60 segundos)',
    description: 'Transmisión de paquete keepalive de 128 bytes hacia 203.0.113.44:4444 confirmando el canal de comando y control activo.',
    mitre: {
      id: 'T1071',
      name: 'Application Layer Protocol: C2 Keepalive',
      tactic: 'Command and Control',
      url: 'https://attack.mitre.org/techniques/T1071/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      port: 4444,
      pid: 4821,
      rawRecord: 'Frame 1842: 128 bytes on wire, TCP payload: 47 48 4f 53 54 5f 41 43 4b [GHOST_ACK] delta: +60.00s'
    }
  },
  {
    id: 'evt-12',
    timestamp: '2026-03-14 02:12:04',
    artifactType: 'Red',
    sourceTool: 'Wireshark',
    sourceFile: 'traffic_capture_eth0.pcapng',
    severity: 'high',
    summary: 'Tercer pulso de Beaconing C2 (Intervalo 60 segundos)',
    description: 'Tercer paquete de latido hacia la IP del atacante 203.0.113.44:4444.',
    mitre: {
      id: 'T1071',
      name: 'Application Layer Protocol',
      tactic: 'Command and Control',
      url: 'https://attack.mitre.org/techniques/T1071/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      port: 4444,
      pid: 4821,
      rawRecord: 'Frame 2190: 128 bytes on wire, TCP payload: delta: +60.01s'
    }
  },
  {
    id: 'evt-13',
    timestamp: '2026-03-14 02:14:18',
    artifactType: 'Red',
    sourceTool: 'Wireshark / Zeek DNS log',
    sourceFile: 'traffic_capture_eth0.pcapng (DNS)',
    severity: 'critical',
    summary: 'Exfiltración de datos encubierta mediante Túnel DNS (DNS Tunneling)',
    description: 'Ráfaga de consultas DNS de tipo TXT y A hacia subdominios de apariencia aleatoria bajo c2-relay.test (ej. a7f9b1c4e2.data.exfil-corp.test).',
    mitre: {
      id: 'T1071.004',
      name: 'Application Layer Protocol: DNS',
      tactic: 'Exfiltration / Command and Control',
      url: 'https://attack.mitre.org/techniques/T1071/004/'
    },
    technicalDetails: {
      ipAddress: '10.0.2.3 (DNS Resolver)',
      forensicHint: 'Subdominios con longitud excesiva y alta entropía de Shannon (3.8+). El payload contiene fragmentos de datos codificados en base64/hex.',
      rawRecord: 'DNS Query TXT: a7f9b1c4e299da18.chunk01.c2-relay.test | Response: OK | Size: 180 bytes'
    }
  },
  {
    id: 'evt-14',
    timestamp: '2026-03-14 02:18:22',
    artifactType: 'Cloud',
    sourceTool: 'AWS CloudTrail',
    sourceFile: 'aws_cloudtrail_eu-west-1_20260314.json',
    severity: 'critical',
    summary: 'AWS CloudTrail: Acceso a Bucket S3 sensible (GetObject)',
    description: 'El atacante utiliza credenciales de AWS obtenidas durante el volcado de memoria para descargar el objeto de copia de seguridad ghost-corp-backup-prod/db_dump_2026.sql.',
    mitre: {
      id: 'T1530',
      name: 'Data from Cloud Storage Object',
      tactic: 'Collection / Exfiltration',
      url: 'https://attack.mitre.org/techniques/T1530/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      user: 'devops-admin',
      forensicHint: 'La IP de origen en CloudTrail coincide exactamente con la IP del atacante RDP (203.0.113.44), vinculando indiscutiblemente la intrusión endpoint con la nube.',
      rawRecord: 'eventName: GetObject | bucketName: ghost-corp-backup-prod | key: db_dump_2026.sql | sourceIPAddress: 203.0.113.44 | userAgent: aws-cli/2.15.15'
    }
  },
  {
    id: 'evt-15',
    timestamp: '2026-03-14 02:20:45',
    artifactType: 'Cloud',
    sourceTool: 'AWS CloudTrail',
    sourceFile: 'aws_cloudtrail_eu-west-1_20260314.json',
    severity: 'critical',
    summary: 'AWS CloudTrail: Modificación de política de bucket S3 (PutBucketPolicy)',
    description: 'El atacante modifica la política del bucket ghost-corp-backup-prod para permitir acceso anónimo de lectura desde cualquier IP externa.',
    mitre: {
      id: 'T1484',
      name: 'Domain or Cloud Policy Modification',
      tactic: 'Defense Evasion / Persistence',
      url: 'https://attack.mitre.org/techniques/T1484/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      user: 'devops-admin',
      forensicHint: 'Política permisiva añadida: Principal: "*", Action: "s3:GetObject".',
      rawRecord: 'eventName: PutBucketPolicy | bucketName: ghost-corp-backup-prod | sourceIPAddress: 203.0.113.44 | status: 200 OK'
    }
  },
  {
    id: 'evt-16',
    timestamp: '2026-03-14 02:22:11',
    artifactType: 'Cloud',
    sourceTool: 'AWS CloudTrail',
    sourceFile: 'aws_cloudtrail_eu-west-1_20260314.json',
    severity: 'critical',
    summary: 'AWS CloudTrail: Creación de Access Key persistente de IAM (CreateAccessKey)',
    description: 'Creación de clave de acceso estática de larga duración para el usuario IAM "backdoor-admin" (AccessKeyId: AKIAIOSFODNN7EXAMPLE).',
    mitre: {
      id: 'T1098',
      name: 'Account Manipulation: Additional Cloud Credentials',
      tactic: 'Persistence',
      url: 'https://attack.mitre.org/techniques/T1098/'
    },
    technicalDetails: {
      ipAddress: '203.0.113.44',
      user: 'devops-admin',
      forensicHint: 'Técnica clásica de persistencia en AWS IAM tras comprometer un rol o credencial administrativa.',
      rawRecord: 'eventName: CreateAccessKey | userName: backdoor-admin | accessKeyId: AKIAIOSFODNN7EXAMPLE | sourceIPAddress: 203.0.113.44'
    }
  },
  {
    id: 'evt-17',
    timestamp: '2026-03-14 02:31:05',
    artifactType: 'EVTX',
    sourceTool: 'EvtxECmd / EventViewer',
    sourceFile: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    severity: 'critical',
    summary: 'Borrado intencionado del registro de seguridad (Event ID 1102)',
    description: 'El usuario administrator ejecuta el vaciado del registro de eventos de Seguridad de Windows para borrar sus huellas (Anti-Forense).',
    mitre: {
      id: 'T1070.001',
      name: 'Indicator Removal: Clear Windows Event Logs',
      tactic: 'Defense Evasion',
      url: 'https://attack.mitre.org/techniques/T1070/001/'
    },
    technicalDetails: {
      user: 'administrator',
      eventId: 1102,
      forensicHint: 'El Event ID 1102 es auto-generado por el sistema precisamente para alertar de que el log de seguridad ha sido limpiado manualmente (wevtutil cl Security).',
      rawRecord: 'EventID: 1102 | Provider: Microsoft-Windows-Eventlog | SubjectUserName: administrator | SubjectDomainName: WORKSTATION-09 | SubjectLogonId: 0x3E7 | Message: The audit log was cleared.'
    }
  }
];

export const REGISTRY_HIVES: RegistryHive[] = [
  {
    name: 'SOFTWARE',
    path: 'C:\\Windows\\System32\\config\\SOFTWARE',
    root: {
      name: 'HKLM\\SOFTWARE',
      path: 'HKLM\\SOFTWARE',
      lastWriteTime: '2026-03-14 02:08:55',
      values: [],
      children: [
        {
          name: 'Microsoft',
          path: 'HKLM\\SOFTWARE\\Microsoft',
          lastWriteTime: '2026-03-14 02:08:55',
          values: [],
          children: [
            {
              name: 'Windows',
              path: 'HKLM\\SOFTWARE\\Microsoft\\Windows',
              lastWriteTime: '2026-03-14 02:08:55',
              values: [],
              children: [
                {
                  name: 'CurrentVersion',
                  path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
                  lastWriteTime: '2026-03-14 02:08:55',
                  values: [],
                  children: [
                    {
                      name: 'Run',
                      path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
                      lastWriteTime: '2026-03-14 02:08:55 UTC',
                      isSuspicious: true,
                      forensicArtifact: 'Persistencia / Autostart (T1547.001)',
                      values: [
                        {
                          name: 'SecurityHealth',
                          type: 'REG_EXPAND_SZ',
                          value: '%windir%\\system32\\SecurityHealthSystray.exe',
                          lastWriteTime: '2026-01-10 14:22:00',
                          note: 'Entrada estándar de Windows Defender.'
                        },
                        {
                          name: 'WindowsUpdateSvc',
                          type: 'REG_SZ',
                          value: 'C:\\Windows\\System32\\svc_update.exe',
                          lastWriteTime: '2026-03-14 02:08:55 UTC',
                          isMalicious: true,
                          note: '¡ANOMALÍA! Entrada falsa de actualización que apunta al binario malicioso depositado a las 02:08:55.'
                        }
                      ]
                    },
                    {
                      name: 'RunOnce',
                      path: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
                      lastWriteTime: '2026-02-01 10:15:30',
                      values: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: 'NTUSER.DAT (administrator)',
    path: 'C:\\Users\\administrator\\NTUSER.DAT',
    root: {
      name: 'HKU\\administrator',
      path: 'HKU\\administrator',
      lastWriteTime: '2026-03-14 02:10:00',
      values: [],
      children: [
        {
          name: 'Software',
          path: 'HKU\\administrator\\Software',
          lastWriteTime: '2026-03-14 02:10:00',
          values: [],
          children: [
            {
              name: 'Microsoft',
              path: 'HKU\\administrator\\Software\\Microsoft',
              lastWriteTime: '2026-03-14 02:10:00',
              values: [],
              children: [
                {
                  name: 'Windows',
                  path: 'HKU\\administrator\\Software\\Microsoft\\Windows',
                  lastWriteTime: '2026-03-14 02:10:00',
                  values: [],
                  children: [
                    {
                      name: 'CurrentVersion',
                      path: 'HKU\\administrator\\Software\\Microsoft\\Windows\\CurrentVersion',
                      lastWriteTime: '2026-03-14 02:10:00',
                      values: [],
                      children: [
                        {
                          name: 'Explorer',
                          path: 'HKU\\administrator\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer',
                          lastWriteTime: '2026-03-14 02:10:00',
                          values: [],
                          children: [
                            {
                              name: 'UserAssist',
                              path: 'HKU\\administrator\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist',
                              lastWriteTime: '2026-03-14 02:09:45 UTC',
                              isSuspicious: true,
                              forensicArtifact: 'Ejecución de Usuario (UserAssist - ROT13)',
                              values: [
                                {
                                  name: '{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}\\P:\\Jvaqbjf\\flfgrz32\\fiz_hcqngr.rkr',
                                  type: 'REG_BINARY',
                                  value: 'ROT13: C:\\Windows\\system32\\svc_update.exe',
                                  decoded: 'Programa: C:\\Windows\\system32\\svc_update.exe | Ejecuciones: 2 | Última ejecución: 2026-03-14 02:09:41 UTC',
                                  rawHex: '00 00 00 00 02 00 00 00 45 09 02 00 00 00 00 00 A0 3B 8F 2A B1 C4 DA 01',
                                  lastWriteTime: '2026-03-14 02:09:45 UTC',
                                  isMalicious: true,
                                  note: 'El valor cifrado con ROT13 confirma la ejecución interactiva por el usuario administrator a través de GUI/Explorer.'
                                },
                                {
                                  name: '{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}\\P:\\Jvaqbjf\\flfgrz32\\pzc.rkr',
                                  type: 'REG_BINARY',
                                  value: 'ROT13: C:\\Windows\\system32\\cmd.exe',
                                  decoded: 'Programa: C:\\Windows\\system32\\cmd.exe | Ejecuciones: 6 | Última ejecución: 2026-03-14 02:30:58 UTC',
                                  lastWriteTime: '2026-03-14 02:30:58 UTC',
                                  note: 'Apertura de consola CMD utilizada para comandos administrativos y anti-forenses.'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: 'SYSTEM',
    path: 'C:\\Windows\\System32\\config\\SYSTEM',
    root: {
      name: 'HKLM\\SYSTEM',
      path: 'HKLM\\SYSTEM',
      lastWriteTime: '2026-03-14 02:04:20',
      values: [],
      children: [
        {
          name: 'CurrentControlSet',
          path: 'HKLM\\SYSTEM\\CurrentControlSet',
          lastWriteTime: '2026-03-14 02:04:20',
          values: [],
          children: [
            {
              name: 'Enum',
              path: 'HKLM\\SYSTEM\\CurrentControlSet\\Enum',
              lastWriteTime: '2026-03-10 09:30:12',
              values: [],
              children: [
                {
                  name: 'USBSTOR',
                  path: 'HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR',
                  lastWriteTime: '2026-03-10 09:30:12 UTC',
                  forensicArtifact: 'Dispositivos de Almacenamiento USB',
                  values: [
                    {
                      name: 'Disk&Ven_SanDisk&Prod_Ultra&Rev_1.00',
                      type: 'REG_SZ',
                      value: 'Serial: 4C530001234567890123&0',
                      lastWriteTime: '2026-03-10 09:30:12 UTC',
                      note: 'Conexión previa de memoria USB legítima corporativa días antes del incidente.'
                    }
                  ]
                }
              ]
            },
            {
              name: 'Services',
              path: 'HKLM\\SYSTEM\\CurrentControlSet\\Services',
              lastWriteTime: '2026-03-14 02:04:18',
              values: [],
              children: [
                {
                  name: 'TermService',
                  path: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\TermService',
                  lastWriteTime: '2026-01-15 12:00:00',
                  values: [
                    {
                      name: 'Start',
                      type: 'REG_DWORD',
                      value: '0x00000002 (Automatic)',
                      lastWriteTime: '2026-01-15 12:00:00',
                      note: 'Servicio de Terminal Services (RDP) habilitado en el equipo.'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Amcache.hve',
    path: 'C:\\Windows\\appcompat\\Programs\\Amcache.hve',
    root: {
      name: 'Amcache',
      path: 'Amcache',
      lastWriteTime: '2026-03-14 02:09:45',
      values: [],
      children: [
        {
          name: 'Root',
          path: 'Amcache\\Root',
          lastWriteTime: '2026-03-14 02:09:45',
          values: [],
          children: [
            {
              name: 'File',
              path: 'Amcache\\Root\\File',
              lastWriteTime: '2026-03-14 02:09:45',
              values: [],
              children: [
                {
                  name: 'svc_update.exe Record',
                  path: 'Amcache\\Root\\File\\svc_update.exe',
                  lastWriteTime: '2026-03-14 02:08:55 UTC',
                  isSuspicious: true,
                  forensicArtifact: 'Evidencia de Aplicaciones (Amcache)',
                  values: [
                    {
                      name: 'FileExtension',
                      type: 'REG_SZ',
                      value: '.exe',
                      lastWriteTime: '2026-03-14 02:08:55'
                    },
                    {
                      name: 'SHA1',
                      type: 'REG_SZ',
                      value: '4d8f1e0c2a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
                      lastWriteTime: '2026-03-14 02:08:55'
                    },
                    {
                      name: 'SHA256',
                      type: 'REG_SZ',
                      value: '9f8a3c2e1b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
                      lastWriteTime: '2026-03-14 02:08:55',
                      isMalicious: true,
                      note: 'Hash criptográfico que identifica el binario svchost troyanizado / payload.'
                    },
                    {
                      name: 'LinkDate',
                      type: 'REG_SZ',
                      value: '2026-03-12 18:42:10 UTC (Compilado recientemente)',
                      lastWriteTime: '2026-03-14 02:08:55'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
];

export const EVENT_LOGS: EventLogEntry[] = [
  {
    id: 'evtx-4625-1',
    recordId: 98401,
    timeCreated: '2026-03-14 02:01:44',
    eventId: 4625,
    channel: 'Security',
    level: 'Audit Failure',
    taskCategory: 'Logon',
    computer: 'WORKSTATION-09',
    user: 'administrator',
    ipAddress: '203.0.113.44',
    port: 53120,
    logonType: 10,
    logonTypeName: 'RemoteInteractive (RDP)',
    description: 'Fallo al iniciar sesión. Nombre de cuenta: administrator. Código de fallo: 0xC000006A (Contraseña incorrecta).',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-A5BA-3E3B0328C30D}" />
    <EventID>4625</EventID>
    <TimeCreated SystemTime="2026-03-14T02:01:44.1082100Z" />
    <EventRecordID>98401</EventRecordID>
    <Channel>Security</Channel>
    <Computer>WORKSTATION-09</Computer>
  </System>
  <EventData>
    <Data Name="TargetUserName">administrator</Data>
    <Data Name="TargetDomainName">WORKSTATION-09</Data>
    <Data Name="Status">0xc000006d</Data>
    <Data Name="SubStatus">0xc000006a</Data>
    <Data Name="LogonType">10</Data>
    <Data Name="IpAddress">203.0.113.44</Data>
    <Data Name="IpPort">53120</Data>
    <Data Name="WorkstationName">KALI-ATTACKER</Data>
  </EventData>
</Event>`,
    mitreTechnique: {
      id: 'T1110',
      name: 'Brute Force: Password Guessing',
      tactic: 'Credential Access'
    }
  },
  {
    id: 'evtx-4625-2',
    recordId: 98402,
    timeCreated: '2026-03-14 02:02:11',
    eventId: 4625,
    channel: 'Security',
    level: 'Audit Failure',
    taskCategory: 'Logon',
    computer: 'WORKSTATION-09',
    user: 'administrator',
    ipAddress: '203.0.113.44',
    port: 53128,
    logonType: 10,
    logonTypeName: 'RemoteInteractive (RDP)',
    description: 'Fallo al iniciar sesión repetido contra administrator desde la misma dirección IP 203.0.113.44.',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <EventID>4625</EventID>
    <TimeCreated SystemTime="2026-03-14T02:02:11.4520190Z" />
    <EventRecordID>98402</EventRecordID>
    <Channel>Security</Channel>
  </System>
  <EventData>
    <Data Name="TargetUserName">administrator</Data>
    <Data Name="Status">0xc000006d</Data>
    <Data Name="SubStatus">0xc000006a</Data>
    <Data Name="LogonType">10</Data>
    <Data Name="IpAddress">203.0.113.44</Data>
  </EventData>
</Event>`
  },
  {
    id: 'evtx-4624-1',
    recordId: 98415,
    timeCreated: '2026-03-14 02:04:17',
    eventId: 4624,
    channel: 'Security',
    level: 'Audit Success',
    taskCategory: 'Logon',
    computer: 'WORKSTATION-09',
    user: 'administrator',
    ipAddress: '203.0.113.44',
    port: 53184,
    logonType: 10,
    logonTypeName: 'RemoteInteractive (RDP)',
    processName: 'C:\\Windows\\System32\\winlogon.exe',
    description: 'Inicio de sesión correcto en cuenta local administrator por RDP. Origen: 203.0.113.44.',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" />
    <EventID>4624</EventID>
    <TimeCreated SystemTime="2026-03-14T02:04:17.3918230Z" />
    <EventRecordID>98415</EventRecordID>
    <Channel>Security</Channel>
    <Computer>WORKSTATION-09</Computer>
  </System>
  <EventData>
    <Data Name="TargetUserSid">S-1-5-21-391847120-1928471928-1029384712-500</Data>
    <Data Name="TargetUserName">administrator</Data>
    <Data Name="TargetDomainName">WORKSTATION-09</Data>
    <Data Name="LogonType">10</Data>
    <Data Name="LogonProcessName">User32</Data>
    <Data Name="AuthenticationPackageName">Negotiate</Data>
    <Data Name="WorkstationName">KALI-ATTACKER</Data>
    <Data Name="IpAddress">203.0.113.44</Data>
    <Data Name="IpPort">53184</Data>
    <Data Name="ProcessName">C:\\Windows\\System32\\winlogon.exe</Data>
  </EventData>
</Event>`,
    mitreTechnique: {
      id: 'T1078',
      name: 'Valid Accounts',
      tactic: 'Initial Access'
    }
  },
  {
    id: 'evtx-4672-1',
    recordId: 98416,
    timeCreated: '2026-03-14 02:04:19',
    eventId: 4672,
    channel: 'Security',
    level: 'Audit Success',
    taskCategory: 'Special Logon',
    computer: 'WORKSTATION-09',
    user: 'administrator',
    description: 'Se han asignado privilegios especiales al nuevo inicio de sesión (SeDebugPrivilege, SeTcbPrivilege, SeImpersonatePrivilege).',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <EventID>4672</EventID>
    <TimeCreated SystemTime="2026-03-14T02:04:19.0021480Z" />
    <EventRecordID>98416</EventRecordID>
    <Channel>Security</Channel>
  </System>
  <EventData>
    <Data Name="SubjectUserName">administrator</Data>
    <Data Name="PrivilegeList">SeSecurityPrivilege, SeBackupPrivilege, SeRestorePrivilege, SeTakeOwnershipPrivilege, SeDebugPrivilege, SeSystemEnvironmentPrivilege, SeImpersonatePrivilege</Data>
  </EventData>
</Event>`
  },
  {
    id: 'evtx-4688-1',
    recordId: 98488,
    timeCreated: '2026-03-14 02:09:41',
    eventId: 4688,
    channel: 'Security',
    level: 'Audit Success',
    taskCategory: 'Process Creation',
    computer: 'WORKSTATION-09',
    user: 'NT AUTHORITY\\SYSTEM',
    processName: 'C:\\Windows\\System32\\svc_update.exe',
    processId: 4821,
    parentProcessName: 'C:\\Windows\\System32\\lsass.exe',
    parentProcessId: 612,
    description: 'Se ha creado un nuevo proceso: C:\\Windows\\System32\\svc_update.exe (PID 4821). Proceso creador: lsass.exe (PID 612).',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <EventID>4688</EventID>
    <TimeCreated SystemTime="2026-03-14T02:09:41.1190240Z" />
    <EventRecordID>98488</EventRecordID>
    <Channel>Security</Channel>
  </System>
  <EventData>
    <Data Name="SubjectUserName">SYSTEM</Data>
    <Data Name="NewProcessId">0x12d5</Data>
    <Data Name="NewProcessName">C:\\Windows\\System32\\svc_update.exe</Data>
    <Data Name="CommandLine">svc_update.exe --inject-lsass --target-pid 612</Data>
    <Data Name="ParentProcessName">C:\\Windows\\System32\\lsass.exe</Data>
  </EventData>
</Event>`,
    mitreTechnique: {
      id: 'T1055',
      name: 'Process Injection',
      tactic: 'Privilege Escalation'
    }
  },
  {
    id: 'evtx-7045-1',
    recordId: 41209,
    timeCreated: '2026-03-14 02:10:30',
    eventId: 7045,
    channel: 'System',
    level: 'Information',
    taskCategory: 'Service Control Manager',
    computer: 'WORKSTATION-09',
    user: 'SYSTEM',
    serviceName: 'WinHostUpdater',
    description: 'Se instaló un servicio en el sistema. Nombre del servicio: WinHostUpdater. Nombre del archivo del servicio: C:\\Windows\\System32\\svc_update.exe /srv.',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Service Control Manager" />
    <EventID>7045</EventID>
    <TimeCreated SystemTime="2026-03-14T02:10:30.5019280Z" />
    <EventRecordID>41209</EventRecordID>
    <Channel>System</Channel>
  </System>
  <EventData>
    <Data Name="ServiceName">WinHostUpdater</Data>
    <Data Name="ImagePath">C:\\Windows\\System32\\svc_update.exe /srv</Data>
    <Data Name="ServiceType">user mode service</Data>
    <Data Name="StartType">auto start</Data>
    <Data Name="AccountName">LocalSystem</Data>
  </EventData>
</Event>`
  },
  {
    id: 'evtx-1102-1',
    recordId: 98650,
    timeCreated: '2026-03-14 02:31:05',
    eventId: 1102,
    channel: 'Security',
    level: 'Audit Success',
    taskCategory: 'Log clear',
    computer: 'WORKSTATION-09',
    user: 'administrator',
    description: 'El registro de auditoría de seguridad se ha borrado (The audit log was cleared). Acción ejecutada por administrator.',
    isMalicious: true,
    rawXml: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Eventlog" Guid="{fc65ddd8-d51f-42e2-975b-8528e7b19b36}" />
    <EventID>1102</EventID>
    <TimeCreated SystemTime="2026-03-14T02:31:05.8192810Z" />
    <EventRecordID>98650</EventRecordID>
    <Channel>Security</Channel>
    <Computer>WORKSTATION-09</Computer>
  </System>
  <EventData>
    <Data Name="SubjectUserSid">S-1-5-21-391847120-1928471928-1029384712-500</Data>
    <Data Name="SubjectUserName">administrator</Data>
    <Data Name="SubjectDomainName">WORKSTATION-09</Data>
    <Data Name="SubjectLogonId">0x3E7</Data>
  </EventData>
</Event>`,
    mitreTechnique: {
      id: 'T1070.001',
      name: 'Indicator Removal: Clear Windows Event Logs',
      tactic: 'Defense Evasion'
    }
  }
];

export const PROCESS_TREE: ProcessNode[] = [
  {
    pid: 4,
    ppid: 0,
    name: 'System',
    path: 'C:\\Windows\\System32\\ntoskrnl.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:00',
    threads: 184,
    handles: 4210,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: '',
    isSuspicious: false
  },
  {
    pid: 532,
    ppid: 4,
    name: 'smss.exe',
    path: 'C:\\Windows\\System32\\smss.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:01',
    threads: 4,
    handles: 68,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: '\\SystemRoot\\System32\\smss.exe',
    isSuspicious: false
  },
  {
    pid: 596,
    ppid: 532,
    name: 'csrss.exe',
    path: 'C:\\Windows\\System32\\csrss.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:05',
    threads: 12,
    handles: 490,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: '%SystemRoot%\\System32\\csrss.exe ObjectDirectory=\\Windows SharedSection=1024,20480,768',
    isSuspicious: false
  },
  {
    pid: 604,
    ppid: 532,
    name: 'wininit.exe',
    path: 'C:\\Windows\\System32\\wininit.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:05',
    threads: 3,
    handles: 182,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: 'wininit.exe',
    isSuspicious: false
  },
  {
    pid: 612,
    ppid: 604,
    name: 'lsass.exe',
    path: 'C:\\Windows\\System32\\lsass.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:06',
    threads: 18,
    handles: 1240,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: 'C:\\Windows\\system32\\lsass.exe',
    isSuspicious: true,
    suspiciousReason: 'Inyección de memoria RWX detectada (malfind). Subproceso svc_update.exe anómalo asociado.',
    vadRegions: [
      {
        startAddress: '0x0000021a8f940000',
        endAddress: '0x0000021a8f94bfff',
        protection: 'PAGE_EXECUTE_READWRITE',
        state: 'MEM_COMMIT',
        type: 'MEM_PRIVATE',
        tag: 'Vad',
        entropy: 7.42,
        yaraMatch: 'mimikatz_sekurlsa_hook',
        notes: 'Cabecera MZ/PE y stub reflective loader en memoria. Muestra signos claros de shellcode inyectado para extraer hashes NTLM y credenciales LSA.',
        hexDump: `0x0000021a8f940000  4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00  |MZ..............|
0x0000021a8f940010  b8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00  |........@.......|
0x0000021a8f940020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
0x0000021a8f940030  00 00 00 00 00 00 00 00  00 00 00 00 f8 00 00 00  |................|
0x0000021a8f940040  0e 1f ba 0e 00 b4 09 cd  21 b8 01 4c cd 21 54 68  |........!..L.!Th|
0x0000021a8f940050  69 73 20 70 72 6f 67 72  61 6d 20 63 61 6e 6e 6f  |is program canno|
0x0000021a8f940060  74 20 62 65 20 72 75 6e  20 69 6e 20 44 4f 53 20  |t be run in DOS |
0x0000021a8f940070  6d 6f 64 65 2e 0d 0d 0a  24 00 00 00 00 00 00 00  |mode....$.......|`,
        disassembly: `0x0000021a8f941000: 48 83 ec 28          sub    rsp, 0x28
0x0000021a8f941004: 48 8d 0d f5 0f 00 00 lea    rcx, [rip + 0xff5] ; "sekurlsa::logonpasswords"
0x0000021a8f94100b: e8 40 12 00 00       call   0x21a8f942250
0x0000021a8f941010: 48 85 c0             test   rax, rax
0x0000021a8f941013: 74 15                je     0x21a8f94102a`
      }
    ]
  },
  {
    pid: 680,
    ppid: 604,
    name: 'services.exe',
    path: 'C:\\Windows\\System32\\services.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:06',
    threads: 14,
    handles: 680,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: 'C:\\Windows\\system32\\services.exe',
    isSuspicious: false
  },
  {
    pid: 780,
    ppid: 680,
    name: 'svchost.exe',
    path: 'C:\\Windows\\System32\\svchost.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:08',
    threads: 28,
    handles: 920,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: 'C:\\Windows\\system32\\svchost.exe -k DcomLaunch -p',
    isSuspicious: false
  },
  {
    pid: 4821,
    ppid: 612,
    name: 'svc_update.exe',
    path: 'C:\\Windows\\System32\\svc_update.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-14 02:09:41',
    threads: 6,
    handles: 184,
    sessionId: 0,
    integrityLevel: 'System',
    commandLine: 'svc_update.exe --inject-lsass --target-pid 612',
    isSuspicious: true,
    suspiciousReason: '¡ANOMALÍA GRAVE! Proceso hijo originado desde lsass.exe (PPID 612). Mantiene socket abierto hacia 203.0.113.44:4444.'
  },
  {
    pid: 1040,
    ppid: 532,
    name: 'winlogon.exe',
    path: 'C:\\Windows\\System32\\winlogon.exe',
    user: 'NT AUTHORITY\\SYSTEM',
    createTime: '2026-03-13 18:00:07',
    threads: 5,
    handles: 220,
    sessionId: 1,
    integrityLevel: 'System',
    commandLine: 'winlogon.exe',
    isSuspicious: false
  },
  {
    pid: 3120,
    ppid: 1040,
    name: 'userinit.exe',
    path: 'C:\\Windows\\System32\\userinit.exe',
    user: 'WORKSTATION-09\\administrator',
    createTime: '2026-03-14 02:04:18',
    exitTime: '2026-03-14 02:04:25',
    threads: 0,
    handles: 0,
    sessionId: 1,
    integrityLevel: 'High',
    commandLine: 'C:\\Windows\\system32\\userinit.exe',
    isSuspicious: false
  },
  {
    pid: 3200,
    ppid: 1040,
    name: 'explorer.exe',
    path: 'C:\\Windows\\explorer.exe',
    user: 'WORKSTATION-09\\administrator',
    createTime: '2026-03-14 02:04:20',
    threads: 48,
    handles: 1980,
    sessionId: 1,
    integrityLevel: 'High',
    commandLine: 'C:\\Windows\\Explorer.EXE',
    isSuspicious: false
  },
  {
    pid: 5120,
    ppid: 3200,
    name: 'cmd.exe',
    path: 'C:\\Windows\\System32\\cmd.exe',
    user: 'WORKSTATION-09\\administrator',
    createTime: '2026-03-14 02:30:50',
    threads: 2,
    handles: 48,
    sessionId: 1,
    integrityLevel: 'High',
    commandLine: '"C:\\Windows\\System32\\cmd.exe" /c wevtutil cl Security',
    isSuspicious: true,
    suspiciousReason: 'Ejecución del comando wevtutil para limpiar el log de seguridad (Anti-forense).'
  }
];

export const NETWORK_CONNECTIONS: NetworkConnection[] = [
  {
    id: 'net-01',
    timestamp: '2026-03-14 02:04:17',
    protocol: 'TCP',
    localAddress: '10.0.2.15',
    localPort: 3389,
    remoteAddress: '203.0.113.44',
    remotePort: 53184,
    state: 'ESTABLISHED',
    pid: 1040,
    processName: 'TermService (winlogon.exe)',
    bytesSent: 48210,
    bytesReceived: 12400,
    isC2: false,
    note: 'Sesión RDP interactiva entrante inicial desde la IP del atacante.',
    tcpStreamId: 3
  },
  {
    id: 'net-02',
    timestamp: '2026-03-14 02:10:04',
    protocol: 'TCP',
    localAddress: '10.0.2.15',
    localPort: 49182,
    remoteAddress: '203.0.113.44',
    remotePort: 4444,
    state: 'ESTABLISHED',
    pid: 4821,
    processName: 'svc_update.exe',
    bytesSent: 128,
    bytesReceived: 64,
    isC2: true,
    beaconIntervalSeconds: 60,
    note: 'Beaconing C2 Saliente #1. Conexión directa hacia 203.0.113.44:4444 iniciada por svc_update.exe.',
    tcpStreamId: 14
  },
  {
    id: 'net-03',
    timestamp: '2026-03-14 02:11:04',
    protocol: 'TCP',
    localAddress: '10.0.2.15',
    localPort: 49184,
    remoteAddress: '203.0.113.44',
    remotePort: 4444,
    state: 'ESTABLISHED',
    pid: 4821,
    processName: 'svc_update.exe',
    bytesSent: 128,
    bytesReceived: 64,
    isC2: true,
    beaconIntervalSeconds: 60,
    note: 'Beaconing C2 Saliente #2 (Exactamente +60 segundos después).',
    tcpStreamId: 15
  },
  {
    id: 'net-04',
    timestamp: '2026-03-14 02:12:04',
    protocol: 'TCP',
    localAddress: '10.0.2.15',
    localPort: 49186,
    remoteAddress: '203.0.113.44',
    remotePort: 4444,
    state: 'ESTABLISHED',
    pid: 4821,
    processName: 'svc_update.exe',
    bytesSent: 128,
    bytesReceived: 64,
    isC2: true,
    beaconIntervalSeconds: 60,
    note: 'Beaconing C2 Saliente #3 (Exactamente +60 segundos después).',
    tcpStreamId: 16
  },
  {
    id: 'net-05',
    timestamp: '2026-03-14 02:13:04',
    protocol: 'TCP',
    localAddress: '10.0.2.15',
    localPort: 49190,
    remoteAddress: '203.0.113.44',
    remotePort: 4444,
    state: 'ESTABLISHED',
    pid: 4821,
    processName: 'svc_update.exe',
    bytesSent: 128,
    bytesReceived: 64,
    isC2: true,
    beaconIntervalSeconds: 60,
    note: 'Beaconing C2 Saliente #4 (Periodo regular 60s persistente).',
    tcpStreamId: 17
  },
  {
    id: 'net-06',
    timestamp: '2026-03-14 02:14:15',
    protocol: 'UDP',
    localAddress: '10.0.2.15',
    localPort: 58210,
    remoteAddress: '10.0.2.3',
    remotePort: 53,
    state: 'TIME_WAIT',
    pid: 4821,
    processName: 'svc_update.exe',
    bytesSent: 3420,
    bytesReceived: 890,
    isC2: true,
    note: 'Ráfaga de paquetes UDP puerto 53 para exfiltración por DNS tunneling.'
  }
];

export const DNS_QUERIES: DnsQuery[] = [
  {
    id: 'dns-01',
    timestamp: '2026-03-14 02:14:18.102',
    clientIp: '10.0.2.15',
    queryDomain: 'e3b0c442.chunk01.exfil.c2-relay.test',
    recordType: 'TXT',
    response: 'OK 200',
    payloadSize: 184,
    isTunneling: true,
    decodedData: 'CHUNK#01: user=administrator|host=WORKSTATION-09|os=Win11',
    entropy: 3.92
  },
  {
    id: 'dns-02',
    timestamp: '2026-03-14 02:14:19.410',
    clientIp: '10.0.2.15',
    queryDomain: '9f8a3c2e.chunk02.exfil.c2-relay.test',
    recordType: 'TXT',
    response: 'OK 200',
    payloadSize: 196,
    isTunneling: true,
    decodedData: 'CHUNK#02: ntlm_hash=AAD3B435B51404EEAAD3B435B51404EE:8846F7EBEE462',
    entropy: 4.15
  },
  {
    id: 'dns-03',
    timestamp: '2026-03-14 02:14:20.890',
    clientIp: '10.0.2.15',
    queryDomain: 'b4c7a102.chunk03.exfil.c2-relay.test',
    recordType: 'TXT',
    response: 'OK 200',
    payloadSize: 210,
    isTunneling: true,
    decodedData: 'CHUNK#03: aws_env=AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCY',
    entropy: 4.22
  },
  {
    id: 'dns-04',
    timestamp: '2026-03-14 02:14:22.204',
    clientIp: '10.0.2.15',
    queryDomain: '7a8b9c0d.chunk04.exfil.c2-relay.test',
    recordType: 'TXT',
    response: 'OK 200',
    payloadSize: 140,
    isTunneling: true,
    decodedData: 'CHUNK#04: EOF_TRANSFER_SUCCESS_BYTES=784',
    entropy: 3.84
  },
  {
    id: 'dns-05',
    timestamp: '2026-03-14 02:18:01.010',
    clientIp: '10.0.2.15',
    queryDomain: 's3.eu-west-1.amazonaws.com',
    recordType: 'A',
    response: '52.218.40.11',
    payloadSize: 32,
    isTunneling: false,
    entropy: 2.1
  }
];

export const CLOUDTRAIL_EVENTS: CloudTrailEvent[] = [
  {
    eventId: 'ct-evt-01',
    eventTime: '2026-03-14T02:18:22Z',
    eventSource: 's3.amazonaws.com',
    eventName: 'GetObject',
    awsRegion: 'eu-west-1',
    sourceIPAddress: '203.0.113.44',
    userAgent: 'aws-cli/2.15.15 Python/3.11.6 Linux/6.6.9-amd64',
    userIdentity: {
      type: 'IAMUser',
      principalId: 'AIDASAMPLEUSERPRINCIPAL',
      arn: 'arn:aws:iam::123456789012:user/devops-admin',
      accountId: '123456789012',
      userName: 'devops-admin'
    },
    requestParameters: {
      bucketName: 'ghost-corp-backup-prod',
      key: 'db_dump_2026.sql'
    },
    responseElements: {
      x_amz_request_id: 'C3AA77F2EXAMPLE',
      status: '200 OK'
    },
    isAnomaly: true,
    riskExplanation: 'Descarga no autorizada de volcado de base de datos de producción desde la IP externa del atacante (203.0.113.44).',
    mitreTechnique: {
      id: 'T1530',
      name: 'Data from Cloud Storage Object',
      tactic: 'Collection'
    }
  },
  {
    eventId: 'ct-evt-02',
    eventTime: '2026-03-14T02:20:45Z',
    eventSource: 's3.amazonaws.com',
    eventName: 'PutBucketPolicy',
    awsRegion: 'eu-west-1',
    sourceIPAddress: '203.0.113.44',
    userAgent: 'aws-cli/2.15.15 Python/3.11.6 Linux/6.6.9-amd64',
    userIdentity: {
      type: 'IAMUser',
      principalId: 'AIDASAMPLEUSERPRINCIPAL',
      arn: 'arn:aws:iam::123456789012:user/devops-admin',
      accountId: '123456789012',
      userName: 'devops-admin'
    },
    requestParameters: {
      bucketName: 'ghost-corp-backup-prod',
      bucketPolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicExfilAccess',
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::ghost-corp-backup-prod/*'
          }
        ]
      }
    },
    responseElements: {
      status: '200 OK'
    },
    isAnomaly: true,
    riskExplanation: 'Modificación de permisos del bucket S3 para volverlo público a todo el mundo (Principal: *).',
    mitreTechnique: {
      id: 'T1484',
      name: 'Domain or Cloud Policy Modification',
      tactic: 'Defense Evasion'
    }
  },
  {
    eventId: 'ct-evt-03',
    eventTime: '2026-03-14T02:22:11Z',
    eventSource: 'iam.amazonaws.com',
    eventName: 'CreateAccessKey',
    awsRegion: 'us-east-1',
    sourceIPAddress: '203.0.113.44',
    userAgent: 'aws-cli/2.15.15 Python/3.11.6 Linux/6.6.9-amd64',
    userIdentity: {
      type: 'IAMUser',
      principalId: 'AIDASAMPLEUSERPRINCIPAL',
      arn: 'arn:aws:iam::123456789012:user/devops-admin',
      accountId: '123456789012',
      userName: 'devops-admin'
    },
    requestParameters: {
      userName: 'backdoor-admin'
    },
    responseElements: {
      accessKey: {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        status: 'Active',
        userName: 'backdoor-admin',
        createDate: '2026-03-14T02:22:11Z'
      }
    },
    isAnomaly: true,
    riskExplanation: 'Creación de clave de acceso estática secundaria para usuario durmiente (backdoor-admin) con fines de persistencia en la nube.',
    mitreTechnique: {
      id: 'T1098',
      name: 'Account Manipulation: Additional Cloud Credentials',
      tactic: 'Persistence'
    }
  }
];

export const INVESTIGATION_QUESTIONS: InvestigationQuestion[] = [
  {
    id: 'q1',
    stepNumber: 1,
    category: 'Acceso Inicial',
    question: '¿Cuál es la dirección IP de origen desde donde el atacante logró autenticarse por RDP y qué LogonType se utilizó?',
    context: 'En el módulo 8 y 9 del curso aprendemos a examinar el Visor de Eventos (Security.evtx) y correlacionar eventos 4625 y 4624.',
    hint: 'Consulta la pestaña "Event Logs" o "Timeline" filtrando por Event ID 4624 y revisa el LogonType y la dirección IP de red.',
    targetTab: 'events',
    targetTabName: 'Visor de Event Logs',
    options: [
      { id: 'opt-a', label: '10.0.2.15 con LogonType 2 (Interactive)', isCorrect: false },
      { id: 'opt-b', label: '203.0.113.44 con LogonType 10 (RemoteInteractive / RDP)', isCorrect: true },
      { id: 'opt-c', label: '192.168.1.100 con LogonType 3 (Network)', isCorrect: false },
      { id: 'opt-d', label: '203.0.113.44 con LogonType 7 (Unlock)', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1078',
      name: 'Valid Accounts',
      tactic: 'Initial Access'
    },
    evidenceAnchor: 'Event ID 4624 a las 02:04:17 UTC con IpAddress 203.0.113.44 y LogonType 10.',
    pedagogicalFeedback: '¡Correcto! El Event ID 4624 con LogonType 10 identifica un inicio de sesión interactivo remoto por RDP (Terminal Services). La IP 203.0.113.44 pertenece a un rango de documentación pública y corresponde al origen de la intrusión.'
  },
  {
    id: 'q2',
    stepNumber: 2,
    category: 'Persistencia',
    question: '¿En qué clave del Registro de Windows y con qué nombre de valor se aseguró la persistencia del binario svc_update.exe?',
    context: 'El módulo 9 y 10 enseña las claves de ejecución automática (Run keys) en el hive SOFTWARE y cómo inspeccionarlas con herramientas como RECmd.',
    hint: 'Revisa la pestaña "Visor de Registro" en el Hive SOFTWARE bajo Microsoft\\Windows\\CurrentVersion\\Run.',
    targetTab: 'registry',
    targetTabName: 'Visor de Registro',
    options: [
      { id: 'opt-a', label: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer con valor SvcHost', isCorrect: false },
      { id: 'opt-b', label: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run con valor WindowsUpdateSvc', isCorrect: true },
      { id: 'opt-c', label: 'HKCU\\Environment con valor Path', isCorrect: false },
      { id: 'opt-d', label: 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon con valor Shell', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1547.001',
      name: 'Boot or Logon Autostart Execution: Registry Run Keys',
      tactic: 'Persistence'
    },
    evidenceAnchor: 'Clave HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run con valor "WindowsUpdateSvc" apuntando a C:\\Windows\\System32\\svc_update.exe creada a las 02:08:55 UTC.',
    pedagogicalFeedback: '¡Excelente! Los atacantes frecuentemente eligen nombres que imitan servicios legítimos de Windows (como WindowsUpdateSvc) en la clave Run para confundir a administradores poco entrenados.'
  },
  {
    id: 'q3',
    stepNumber: 3,
    category: 'Ejecución',
    question: '¿Qué artefacto forense de ejecución en disco demuestra que svc_update.exe se ejecutó exactamente 2 veces a las 02:09:12 y 02:09:41 UTC?',
    context: 'En el módulo 10 estudiamos los ficheros Prefetch (.pf) en C:\\Windows\\Prefetch analizados con PECmd de Eric Zimmerman.',
    hint: 'Busca en el Explorador de Timeline por el tipo de artefacto "Prefetch".',
    targetTab: 'timeline',
    targetTabName: 'Explorador de Timeline',
    options: [
      { id: 'opt-a', label: 'El fichero de paginación pagefile.sys', isCorrect: false },
      { id: 'opt-b', label: 'El archivo Prefetch SVC_UPDATE.EXE-A4B71D02.pf (Run Count: 2)', isCorrect: true },
      { id: 'opt-c', label: 'El log de Windows Defender MpLog', isCorrect: false },
      { id: 'opt-d', label: 'El historial de PowerShell ConsoleHost_history.txt', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1204.002',
      name: 'User Execution: Malicious File',
      tactic: 'Execution'
    },
    evidenceAnchor: 'Prefetch SVC_UPDATE.EXE-A4B71D02.pf registra Run Count = 2 y marcas temporales 02:09:12 y 02:09:41 UTC.',
    pedagogicalFeedback: '¡Exacto! El hash Prefetch (A4B71D02) valida la ruta de ejecución y los 8 timestamps de ejecución en Windows 10/11 demuestran la repetición del payload.'
  },
  {
    id: 'q4',
    stepNumber: 4,
    category: 'Privilegios & Credenciales',
    question: '¿Qué técnica de inyección y proceso del sistema fue el objetivo de svc_update.exe (PID 4821) detectado en memoria RAM?',
    context: 'En los módulos 11 y 12 del curso analizamos volcados de memoria con Volatility3 mediante los plugins windows.pstree y windows.malfind.',
    hint: 'Dirígete a la pestaña "Memoria y Procesos" y revisa las alertas en lsass.exe (PID 612) y la sub-pestaña malfind.',
    targetTab: 'memory',
    targetTabName: 'Memoria y Procesos',
    options: [
      { id: 'opt-a', label: 'Process Hollowing sobre explorer.exe (PID 3200)', isCorrect: false },
      { id: 'opt-b', label: 'Inyección en lsass.exe (PID 612) con región PAGE_EXECUTE_READWRITE para robo de credenciales', isCorrect: true },
      { id: 'opt-c', label: 'DLL Sideloading sobre svchost.exe (PID 780)', isCorrect: false },
      { id: 'opt-d', label: 'Thread Execution Hijacking sobre smss.exe (PID 532)', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1055',
      name: 'Process Injection / LSASS Memory (T1003.001)',
      tactic: 'Credential Access'
    },
    evidenceAnchor: 'Volatility3 malfind detecta región 0x0000021a8f940000 en lsass.exe (PID 612) con protección PAGE_EXECUTE_READWRITE y match YARA mimikatz_sekurlsa_hook.',
    pedagogicalFeedback: '¡Brillante! El proceso lsass.exe nunca debe tener páginas de memoria asignadas dinámicamente con permisos RWX (PAGE_EXECUTE_READWRITE). Esto es la firma clásica de inyección de Mimikatz para volcar credenciales.'
  },
  {
    id: 'q5',
    stepNumber: 5,
    category: 'Comando & Control',
    question: '¿Qué patrón de temporización (intervalo en segundos) presenta el tráfico de Beaconing C2 hacia 203.0.113.44:4444?',
    context: 'En los módulos 13 y 14 analizamos tráfico de red con Wireshark y netscan para identificar balizas periódicas y temporizadores C2.',
    hint: 'Ve a la pestaña "Red" y revisa los intervalos de tiempo entre las conexiones registradas por svc_update.exe.',
    targetTab: 'network',
    targetTabName: 'Red y Comunicaciones',
    options: [
      { id: 'opt-a', label: 'Tráfico aleatorio con jitter del 50%', isCorrect: false },
      { id: 'opt-b', label: 'Beaconing estricto periódico cada 60 segundos (1 minuto exacto)', isCorrect: true },
      { id: 'opt-c', label: 'Conexión continua mantenida mediante túnel SSH persistente', isCorrect: false },
      { id: 'opt-d', label: 'Ráfagas espaciadas cada 15 minutos', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1071',
      name: 'Application Layer Protocol',
      tactic: 'Command and Control'
    },
    evidenceAnchor: 'Conexiones a las 02:10:04, 02:11:04, 02:12:04 y 02:13:04 UTC (delta exacto de 60.00 segundos).',
    pedagogicalFeedback: '¡Perfecto! Un delta de exactamente 60.0 segundos sin variación (jitter = 0) es un indicador inequívoco de un temporizador de beaconing automatizado de un implante C2.'
  },
  {
    id: 'q6',
    stepNumber: 6,
    category: 'Exfiltración',
    question: '¿Qué método encubierto utilizó el atacante para exfiltrar datos del sistema a las 02:14 UTC evadiendo firewalls?',
    context: 'En el módulo 14 analizamos túneles DNS (DNS Tunneling) y cómo detectar exfiltración inspeccionando consultas tipo TXT y entropía.',
    hint: 'Revisa en la pestaña "Red" el sub-apartado de "Consultas DNS y Túnel DNS".',
    targetTab: 'network',
    targetTabName: 'Red y Comunicaciones',
    options: [
      { id: 'opt-a', label: 'Subida por FTP anónimo en el puerto 21', isCorrect: false },
      { id: 'opt-b', label: 'DNS Tunneling mediante consultas TXT a subdominios aleatorios de c2-relay.test', isCorrect: true },
      { id: 'opt-c', label: 'Envío de correos por protocolo SMTP puerto 25', isCorrect: false },
      { id: 'opt-d', label: 'Compartición de archivos mediante SMB puerto 445', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1071.004',
      name: 'Application Layer Protocol: DNS',
      tactic: 'Exfiltration'
    },
    evidenceAnchor: 'Consultas DNS TXT con alta entropía (3.9+) enviando chunks codificados hacia c2-relay.test a las 02:14:18 UTC.',
    pedagogicalFeedback: '¡Correcto! El túnel DNS aprovecha que el puerto 53 UDP suele permitirse en redes corporativas hacia resolvers internos para encubrir la fuga de datos en nombres de host codificados.'
  },
  {
    id: 'q7',
    stepNumber: 7,
    category: 'Nube',
    question: '¿Qué acción de persistencia ejecutó el atacante en AWS tras robar credenciales de devops-admin a las 02:22:11 UTC?',
    context: 'En el módulo 16 de análisis forense en Cloud examinamos AWS CloudTrail, eventos de IAM y políticas de S3.',
    hint: 'Consulta la pestaña "Nube (CloudTrail)" y observa los eventos de mayor severidad.',
    targetTab: 'cloud',
    targetTabName: 'Nube (CloudTrail)',
    options: [
      { id: 'opt-a', label: 'Creación de una instancia EC2 minera de criptomonedas', isCorrect: false },
      { id: 'opt-b', label: 'Creación de una Access Key para el usuario backdoor-admin (CreateAccessKey)', isCorrect: true },
      { id: 'opt-c', label: 'Borrado de todos los snapshots de Elastic Block Store (EBS)', isCorrect: false },
      { id: 'opt-d', label: 'Desactivación de Amazon GuardDuty', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1098',
      name: 'Account Manipulation: Additional Cloud Credentials',
      tactic: 'Persistence'
    },
    evidenceAnchor: 'Evento CloudTrail CreateAccessKey a las 02:22:11 UTC para backdoor-admin desde 203.0.113.44.',
    pedagogicalFeedback: '¡Exacto! El evento CreateAccessKey genera un par AccessKeyId / SecretKey de larga duración para mantener acceso continuo aunque la sesión RDP original o las credenciales del equipo sean revocadas.'
  },
  {
    id: 'q8',
    stepNumber: 8,
    category: 'Anti-Forense',
    question: '¿Qué técnica anti-forense llevó a cabo el atacante a las 02:31:05 UTC antes de desconectarse y qué Event ID la delata?',
    context: 'En los módulos 19 y 20 aprendemos técnicas anti-forenses como borrado de logs (wevtutil) y timestomping.',
    hint: 'Revisa el último evento del incidente en la pestaña "Event Logs" o "Timeline".',
    targetTab: 'events',
    targetTabName: 'Visor de Event Logs',
    options: [
      { id: 'opt-a', label: 'Destrucción física del disco duro mediante comando diskpart clean', isCorrect: false },
      { id: 'opt-b', label: 'Vaciado manual del log de seguridad de Windows registrado por el Event ID 1102', isCorrect: true },
      { id: 'opt-c', label: 'Sobrescritura del MBR con bootloader de ransomware', isCorrect: false },
      { id: 'opt-d', label: 'Cifrado de la carpeta C:\\Windows con BitLocker', isCorrect: false }
    ],
    mitreTechnique: {
      id: 'T1070.001',
      name: 'Indicator Removal: Clear Windows Event Logs',
      tactic: 'Defense Evasion'
    },
    evidenceAnchor: 'Event ID 1102 ("The audit log was cleared") generado por administrator a las 02:31:05 UTC.',
    pedagogicalFeedback: '¡Perfecto! Aunque el atacante borre el log de Seguridad (Security.evtx), el subsistema de auditoría de Windows genera inmediatamente el evento 1102 para registrar que el archivo fue vaciado y quién lo ejecutó.'
  }
];

export const ATTACK_CHAIN_STAGES: AttackChainStage[] = [
  {
    step: 1,
    timeUtc: '2026-03-14 02:01:44',
    tactic: 'Credential Access',
    techniqueId: 'T1110',
    techniqueName: 'Brute Force',
    evidenceArtifact: 'Security.evtx (Event ID 4625 ráfaga de fallos)',
    toolUsed: 'Hayabusa / EvtxECmd',
    description: 'Ataque de fuerza bruta RDP contra el usuario local administrator desde 203.0.113.44.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1110/'
  },
  {
    step: 2,
    timeUtc: '2026-03-14 02:04:17',
    tactic: 'Initial Access',
    techniqueId: 'T1078',
    techniqueName: 'Valid Accounts',
    evidenceArtifact: 'Security.evtx (Event ID 4624 LogonType 10)',
    toolUsed: 'EvtxECmd',
    description: 'Acceso exitoso interactivo por RDP utilizando credenciales válidas comprometidas.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1078/'
  },
  {
    step: 3,
    timeUtc: '2026-03-14 02:08:55',
    tactic: 'Persistence',
    techniqueId: 'T1547.001',
    techniqueName: 'Registry Run Keys / Startup Folder',
    evidenceArtifact: 'SOFTWARE hive (HKLM\\...\\CurrentVersion\\Run) + $MFT (Record 104281)',
    toolUsed: 'RECmd / MFTECmd',
    description: 'Creación del valor WindowsUpdateSvc y depósito del binario C:\\Windows\\System32\\svc_update.exe.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1547/001/'
  },
  {
    step: 4,
    timeUtc: '2026-03-14 02:09:12',
    tactic: 'Execution',
    techniqueId: 'T1204.002',
    techniqueName: 'User Execution: Malicious File',
    evidenceArtifact: 'Prefetch SVC_UPDATE.EXE-A4B71D02.pf + UserAssist (ROT13)',
    toolUsed: 'PECmd / RECmd',
    description: 'Ejecución del binario svc_update.exe validada por dos ejecuciones en Prefetch.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1204/002/'
  },
  {
    step: 5,
    timeUtc: '2026-03-14 02:09:41',
    tactic: 'Privilege Escalation & Defense Evasion',
    techniqueId: 'T1055',
    techniqueName: 'Process Injection (LSASS Memory T1003.001)',
    evidenceArtifact: 'RAM Dump: Región VAD RWX 0x0000021a8f940000 en lsass.exe (PID 612)',
    toolUsed: 'Volatility3 (windows.malfind / windows.pstree)',
    description: 'Inyección de código en lsass.exe y volcado de credenciales de sesión en claro con Mimikatz.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1055/'
  },
  {
    step: 6,
    timeUtc: '2026-03-14 02:10:04',
    tactic: 'Command and Control',
    techniqueId: 'T1071',
    techniqueName: 'Application Layer Protocol (Periodic Beaconing)',
    evidenceArtifact: 'PCAP + RAM: Sockets TCP salientes hacia 203.0.113.44:4444 (intervalo 60s)',
    toolUsed: 'Wireshark / Volatility3 (windows.netscan)',
    description: 'Conexión C2 y baliza regular cada 60 segundos mantenida por el PID malicioso 4821.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1071/'
  },
  {
    step: 7,
    timeUtc: '2026-03-14 02:14:18',
    tactic: 'Exfiltration',
    techniqueId: 'T1071.004',
    techniqueName: 'Application Layer Protocol: DNS',
    evidenceArtifact: 'PCAP / Zeek: Peticiones DNS TXT con alta entropía a c2-relay.test',
    toolUsed: 'Wireshark / Zeek',
    description: 'Exfiltración de credenciales robadas mediante túnel DNS codificado.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1071/004/'
  },
  {
    step: 8,
    timeUtc: '2026-03-14 02:18 - 02:22',
    tactic: 'Cloud Lateral Movement & Persistence',
    techniqueId: 'T1098 / T1530',
    techniqueName: 'Account Manipulation & Cloud Storage Access',
    evidenceArtifact: 'AWS CloudTrail JSON (GetObject db_dump_2026.sql & CreateAccessKey)',
    toolUsed: 'AWS CloudTrail Analyzer',
    description: 'Uso de tokens AWS robados desde 203.0.113.44 para exfiltrar S3 y crear puerta trasera IAM.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1098/'
  },
  {
    step: 9,
    timeUtc: '2026-03-14 02:31:05',
    tactic: 'Defense Evasion',
    techniqueId: 'T1070.001',
    techniqueName: 'Indicator Removal: Clear Windows Event Logs',
    evidenceArtifact: 'Security.evtx (Event ID 1102)',
    toolUsed: 'EvtxECmd / EventViewer',
    description: 'Borrado del registro de seguridad de Windows mediante wevtutil cl Security.',
    mitreUrl: 'https://attack.mitre.org/techniques/T1070/001/'
  }
];
