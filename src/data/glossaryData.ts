export interface GlossaryTerm {
  id: string;
  term: string;
  acronym?: string;
  category: 'Sistema de Archivos' | 'Registro & Ejecución' | 'Memoria RAM' | 'Red & C2' | 'Auditoría & Logs' | 'Cloud & Metodología';
  courseModule: string;
  summary: string;
  detailedExplanation: string;
  locationOrArtifact: string;
  fossTool: string;
  caseReference: string;
  proTip: string;
}

export const FORENSIC_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'mft',
    term: 'Master File Table ($MFT)',
    acronym: 'MFT',
    category: 'Sistema de Archivos',
    courseModule: 'Módulo 6: Sistemas de Archivos NTFS',
    summary: 'La base de datos estructural del sistema de archivos NTFS donde cada archivo y carpeta tiene al menos un registro de 1024 bytes.',
    detailedExplanation: `En NTFS, absolutamente todo es un archivo, incluida la propia estructura del disco. El archivo oculto C:\\$MFT almacena metadatos críticos para cada elemento. Cada registro contiene atributos fundamentales:
- $STANDARD_INFORMATION (0x10): Contiene marcas temporales MACB utilizadas por el sistema operativo y accesibles por la API de Windows.
- $FILE_NAME (0x30): Contiene el nombre del archivo y marcas temporales actualizadas únicamente por el controlador NTFS del kernel.
La discrepancia entre los timestamps de $STANDARD_INFORMATION y $FILE_NAME es la prueba reina para detectar timestomping (falsificación deliberada de fechas).`,
    locationOrArtifact: 'C:\\$MFT (Atributos 0x10 y 0x30)',
    fossTool: 'MFTECmd (Eric Zimmerman) / analyzeMFT / Autopsy',
    caseReference: 'En este caso, el registro MFT número 104281 constata la creación de C:\\Windows\\System32\\svc_update.exe a las 02:08:55 UTC sin evidencia de timestomping.',
    proTip: 'Compara siempre los timestamps de $FILE_NAME con $STANDARD_INFORMATION. La mayoría de herramientas maliciosas de timestomping solo modifican 0x10.'
  },
  {
    id: 'evtx',
    term: 'Windows Event Logs (.evtx)',
    acronym: 'EVTX',
    category: 'Auditoría & Logs',
    courseModule: 'Módulo 8: Análisis de Event Logs de Windows',
    summary: 'Archivos binarios estructurados en formato XML comprimido donde Windows registra actividades de seguridad, sistema y aplicaciones.',
    detailedExplanation: `Los registros de eventos modernos de Windows usan la extensión .evtx en formato binario estructurado (con tablas de cadenas y fragmentos XML). Los canales clave en DFIR son:
- Security.evtx: Autenticaciones, escaladas de privilegios y borrado de logs (IDs: 4624 [Logon], 4625 [Fallo], 4672 [Privilegios especiales], 4688 [Creación de procesos], 1102 [Borrado de log]).
- System.evtx: Instalación de nuevos servicios (ID 7045), apagados y fallos de hardware.
En análisis forense, los identificadores LogonType en el evento 4624 revelan el método de acceso: LogonType 2 (Consola local interactiva), LogonType 3 (Red/SMB), LogonType 10 (Escritorio Remoto / RDP).`,
    locationOrArtifact: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx y System.evtx',
    fossTool: 'EvtxECmd (Eric Zimmerman) / Hayabusa / Chainsaw',
    caseReference: 'El ataque comenzó con ráfagas del evento 4625 (fuerza bruta RDP), seguido del evento 4624 (LogonType 10 exitoso desde 203.0.113.44) y culminó con el evento 1102 (borrado anti-forense).',
    proTip: 'El Event ID 1102 es auto-generado por el sistema de auditoría cuando un atacante intenta vaciar el registro de Seguridad con comandos como "wevtutil cl Security".'
  },
  {
    id: 'amcache',
    term: 'Amcache (Amcache.hve)',
    acronym: 'Amcache',
    category: 'Registro & Ejecución',
    courseModule: 'Módulo 10: Evidencias de Ejecución en Windows',
    summary: 'Colmena de registro creada por el Program Compatibility Assistant de Windows que guarda información sobre programas ejecutados, compilados o instalados.',
    detailedExplanation: `Amcache.hve es uno de los artefactos más valiosos en DFIR para responder a la pregunta: "¿Se ejecutó un malware en este equipo?".
A diferencia de otros artefactos, Amcache almacena:
- El hash criptográfico SHA-1 o SHA-256 del binario.
- La ruta completa original de ejecución.
- Marcas temporales de compilación (Linker Timestamp) y de primera ejecución.
- Información sobre archivos borrados que ya no se encuentran físicamente en el disco.`,
    locationOrArtifact: 'C:\\Windows\\appcompat\\Programs\\Amcache.hve',
    fossTool: 'AmcacheParser (Eric Zimmerman) / RegRipper',
    caseReference: 'En la colmena Amcache.hve de este caso encontramos la clave asociada a svc_update.exe, con su hash SHA-256 (9f8a3c2e...) y fecha de compilación reciente.',
    proTip: 'Amcache conserva registros incluso si el adversario borró el binario ejecutable original de System32 después de la intrusión.'
  },
  {
    id: 'prefetch',
    term: 'Prefetch (.pf)',
    acronym: 'Prefetch',
    category: 'Registro & Ejecución',
    courseModule: 'Módulo 10: Evidencias de Ejecución en Windows',
    summary: 'Archivos generados por el gestor de memoria de Windows para optimizar los tiempos de carga, que registran la ejecución efectiva de binarios.',
    detailedExplanation: `Diseñado para cargar en RAM fragmentos de código antes de que se requieran, Prefetch es un artefacto pericial directo de ejecución:
- Demuestra que el archivo fue ejecutado (no meramente descargado o depositado).
- Almacena el número total de ejecuciones (Run Count).
- En Windows 8/10/11 guarda las últimas 8 marcas temporales de ejecución.
- Lista todos los archivos DLL, carpetas y recursos cargados en los primeros 10 segundos de vida del proceso.
El nombre del archivo sigue el patrón: NOMBRE_EJECUTABLE-HASH.pf (donde el hash hexadecimal se calcula a partir de la ruta del archivo).`,
    locationOrArtifact: 'C:\\Windows\\Prefetch\\*.pf',
    fossTool: 'PECmd (Eric Zimmerman) / WinPrefetchView',
    caseReference: 'El archivo SVC_UPDATE.EXE-A4B71D02.pf registró Run Count = 2 y timestamps exactos a las 02:09:12 y 02:09:41 UTC.',
    proTip: 'Si el hash del archivo Prefetch no coincide con la ubicación habitual de un proceso de sistema (ej. svchost.exe fuera de System32), estamos ante una suplantación maliciosa.'
  },
  {
    id: 'beaconing',
    term: 'Beaconing C2 (Balizas de Comando y Control)',
    acronym: 'Beaconing',
    category: 'Red & C2',
    courseModule: 'Módulo 13 y 14: Análisis de Tráfico de Red y C2',
    summary: 'Comportamiento en el que un malware o implante contacta periódicamente a su servidor C2 para solicitar nuevas instrucciones o reportar estado.',
    detailedExplanation: `Una vez infectado un host, los implantes maliciosos modernos (Cobalt Strike, Sliver, Metasploit, Havoc) no mantienen conexiones TCP continuas para evitar ser detectados por firewalls de inspección de estado.
En su lugar, realizan "beaconing" (emisión de balizas periódicas):
- Intervalo (Sleep): Tiempo base entre conexiones (ej. 60 segundos).
- Jitter: Porcentaje de aleatoriedad aplicado para evitar patrones matemáticos evidentes (ej. 20% de jitter sobre 60s oscila entre 48s y 72s).
Un jitter del 0% produce conexiones a intervalos estrictamente idénticos (+60.00s), delatando inmediatamente la presencia de un bucle de temporización programado.`,
    locationOrArtifact: 'Capturas de red PCAP / Tablas de sockets de memoria (netscan)',
    fossTool: 'Wireshark / Zeek / RITA (Real Intelligence Threat Analysis) / NetworkMiner',
    caseReference: 'En este caso, svc_update.exe realizó conexiones TCP salientes hacia 203.0.113.44:4444 con un delta estricto de exactamente 60.00 segundos sin variación.',
    proTip: 'Calcula la desviación estándar del tiempo entre paquetes (delta). Si la varianza es cercana a 0, estás ante beaconing automatizado no interactivo.'
  },
  {
    id: 'userassist',
    term: 'UserAssist (Claves de Registro ROT13)',
    acronym: 'UserAssist',
    category: 'Registro & Ejecución',
    courseModule: 'Módulo 9 y 10: Registro de Windows y Artefactos de Usuario',
    summary: 'Claves en la colmena NTUSER.DAT que rastrean aplicaciones ejecutadas por un usuario mediante el explorador gráfico de Windows, codificadas con ROT13.',
    detailedExplanation: `Windows registra en la clave del perfil de cada usuario las aplicaciones lanzadas desde el menú inicio, accesos directos o doble clic en Explorer.
Por razones de compatibilidad histórica, los nombres de los ejecutables se almacenan ofuscados con el cifrado clásico ROT13 (ej. "cmd.exe" se convierte en "pzc.rkr").
El valor binario almacena un contador de ejecuciones de 32 bits y una marca temporal FILETIME con la última ejecución.`,
    locationOrArtifact: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist',
    fossTool: 'RECmd (Eric Zimmerman) / UserAssistView (NirSoft)',
    caseReference: 'La clave {CEBFF5CD...}\\P:\\Jvaqbjf\\flfgrz32\\fiz_hcqngr.rkr decodifica a C:\\Windows\\system32\\svc_update.exe con 2 ejecuciones interactivas registradas.',
    proTip: 'UserAssist solo registra ejecuciones lanzadas mediante GUI/Explorer. Las ejecuciones por línea de comandos pura o servicios no pueblan esta clave.'
  },
  {
    id: 'malfind',
    term: 'Inyección en Memoria VAD (Volatility3 malfind)',
    acronym: 'malfind',
    category: 'Memoria RAM',
    courseModule: 'Módulo 11 y 12: Análisis de Memoria RAM con Volatility',
    summary: 'Plugin de análisis de memoria que detecta regiones de memoria virtual inyectadas ocultas o sospechosas con permisos de ejecución y escritura simultáneos.',
    detailedExplanation: `El árbol Virtual Address Descriptor (VAD) gestiona las asignaciones de memoria de cada proceso. El plugin malfind busca páginas de memoria que cumplan dos anomalías graves:
1. Protección PAGE_EXECUTE_READWRITE (RWX): Permite al código tanto escribir como ejecutarse en la misma región (violando la política W^X / DEP).
2. Memoria privada no respaldada (MEM_PRIVATE / MEM_COMMIT): La región no está vinculada a ningún archivo ejecutable DLL legítimo cargado desde el disco.
Comúnmente revela stubs de Reflective DLL Injection, shellcodes de Cobalt Strike o inyecciones en procesos críticos como lsass.exe y explorer.exe.`,
    locationOrArtifact: 'Volcado de memoria RAM (Memory Dump)',
    fossTool: 'Volatility3 (windows.malfind / windows.vadinfo)',
    caseReference: 'malfind detectó en lsass.exe (PID 612) la dirección 0x0000021a8f940000 con permisos RWX, cabecera MZ y la firma YARA mimikatz_sekurlsa_hook.',
    proTip: 'Un proceso nativo como lsass.exe NUNCA debería tener páginas VAD con permisos PAGE_EXECUTE_READWRITE asignadas de forma dinámica.'
  },
  {
    id: 'dns_tunneling',
    term: 'Túnel DNS (DNS Tunneling)',
    acronym: 'DNS Tunnel',
    category: 'Red & C2',
    courseModule: 'Módulo 14: Detección de Canales Encubiertos y Exfiltración',
    summary: 'Técnica de exfiltración o C2 que encubre datos binarios dentro de consultas y respuestas del protocolo DNS para burlar cortafuegos perimetrales.',
    detailedExplanation: `El puerto 53 UDP (DNS) casi siempre está permitido hacia resolutores corporativos o de internet. Los atacantes configuran un servidor DNS autoritativo bajo su control.
El malware divide los datos robados en fragmentos, los codifica en base64 o hexadecimal y los envía como subdominios (ej. [datos_robados].c2-relay.test). El servidor del atacante recibe la consulta y reconstruye el archivo original.
Indicadores forenses clave:
- Consultas a dominios con longitud inusualmente larga (>60 caracteres).
- Alta entropía de Shannon (>3.8 bits/carácter), indicando datos cifrados o comprimidos.
- Elevado volumen de consultas de tipo TXT o NULL con resoluciones NXDOMAIN frecuentes.`,
    locationOrArtifact: 'Tráfico de red puerto 53 UDP / Logs de servidores DNS',
    fossTool: 'Wireshark / Zeek (dns.log) / scripts de cálculo de entropía',
    caseReference: 'A las 02:14 UTC se registraron consultas TXT hacia subdominios de c2-relay.test con entropía de 4.15 bits que contenían hashes NTLM y credenciales de AWS.',
    proTip: 'Calcula la entropía de los subdominios consultados; los nombres legibles legítimos rara vez superan una entropía de 2.5 a 3.0.'
  },
  {
    id: 'cloudtrail',
    term: 'AWS CloudTrail',
    acronym: 'CloudTrail',
    category: 'Cloud & Metodología',
    courseModule: 'Módulo 16: Forense en Entornos Cloud (AWS)',
    summary: 'Servicio de auditoría y gobernanza de Amazon Web Services que registra cada llamada a la API realizada en la cuenta en formato JSON.',
    detailedExplanation: `En investigaciones periciales modernas, los atacantes que comprometen servidores locales frecuentemente encuentran credenciales de nube (tokens de IAM en variables de entorno o archivos ~/.aws/credentials).
CloudTrail registra en archivos comprimidos .json.gz:
- Quién hizo la llamada (userIdentity: ARN, usuario IAM, rol asumido).
- Cuándo se realizó (eventTime en UTC).
- Desde qué dirección IP pública (sourceIPAddress).
- Qué acción se solicitó (eventName, ej. GetObject, CreateAccessKey, RunInstances).
- Parámetros solicitados y respuesta del servicio.`,
    locationOrArtifact: 'Buckets de auditoría S3 / AWS CloudTrail Lake',
    fossTool: 'AWS CLI / jq / Athena / CloudTrail Event History',
    caseReference: 'CloudTrail registró descargas del bucket ghost-corp-backup-prod y la creación de una clave de acceso IAM para backdoor-admin desde la IP 203.0.113.44.',
    proTip: 'Correlaciona siempre la IP de origen (sourceIPAddress) en CloudTrail con las IPs identificadas previamente en los logs de Windows y del tráfico de red.'
  },
  {
    id: 'mitre_attack',
    term: 'MITRE ATT&CK Framework',
    acronym: 'ATT&CK',
    category: 'Cloud & Metodología',
    courseModule: 'Módulo 18 y 20: Mapeo Táctico e Informe Pericial',
    summary: 'Base de conocimiento de tácticas, técnicas y procedimientos (TTPs) de adversarios basada en observaciones de ciberataques del mundo real.',
    detailedExplanation: `Estructura las acciones del adversario a lo largo de un ciclo de vida matricial:
1. Acceso Inicial (Initial Access - ej. T1078 Valid Accounts)
2. Ejecución (Execution - ej. T1204 User Execution)
3. Persistencia (Persistence - ej. T1547.001 Registry Run Keys)
4. Escalada de Privilegios (Privilege Escalation - ej. T1055 Process Injection)
5. Evasión de Defensas (Defense Evasion - ej. T1070.001 Clear Event Logs)
6. Acceso a Credenciales (Credential Access - ej. T1003.001 LSASS Memory)
7. Comando y Control (Command and Control - ej. T1071 Application Layer Protocol)
8. Exfiltración (Exfiltration - ej. T1071.004 DNS)
Permite a los peritos forenses comunicar el impacto técnico de forma estandarizada e inequívoca ante jueces, directivos y equipos de respuesta a incidentes.`,
    locationOrArtifact: 'Matriz global attack.mitre.org',
    fossTool: 'ATT&CK Navigator / Atomic Red Team',
    caseReference: 'El incidente fue clasificado en 9 etapas tácticas correlacionadas en la matriz ATT&CK dentro del informe pericial final.',
    proTip: 'En los informes judiciales, acompaña siempre cada técnica MITRE con el artefacto forense específico que la demuestra con certeza científica.'
  }
];
