import React, { useState, useMemo } from 'react';
import {
  Database,
  Folder,
  FolderOpen,
  FileCode,
  Search,
  AlertTriangle,
  Clock,
  Shield,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { REGISTRY_HIVES } from '../data/forensicCaseData';
import { RegistryHive, RegistryKeyNode, RegistryValue } from '../types/forensics';
import { ExportViewButton, ExportColumn } from './ExportViewButton';

interface FlattenedRegistryRow {
  hive: string;
  keyPath: string;
  keyLastWriteTime: string;
  valueName: string;
  valueType: string;
  valueData: string;
  decoded: string;
  lastWriteTime: string;
  isSuspicious: string;
  forensicArtifact: string;
  note: string;
}

const flattenRegistryNode = (node: RegistryKeyNode, hiveName: string): FlattenedRegistryRow[] => {
  let list: FlattenedRegistryRow[] = [];
  if (node.values && node.values.length > 0) {
    for (const val of node.values) {
      list.push({
        hive: hiveName,
        keyPath: node.path,
        keyLastWriteTime: node.lastWriteTime,
        valueName: val.name,
        valueType: val.type,
        valueData: val.value,
        decoded: val.decoded || '',
        lastWriteTime: val.lastWriteTime || node.lastWriteTime,
        isSuspicious: (val.isMalicious || node.isSuspicious) ? 'ALERTA' : 'Normal',
        forensicArtifact: node.forensicArtifact || '',
        note: val.note || ''
      });
    }
  } else {
    list.push({
      hive: hiveName,
      keyPath: node.path,
      keyLastWriteTime: node.lastWriteTime,
      valueName: '(Default)',
      valueType: 'KEY_ONLY',
      valueData: '',
      decoded: '',
      lastWriteTime: node.lastWriteTime,
      isSuspicious: node.isSuspicious ? 'ALERTA' : 'Normal',
      forensicArtifact: node.forensicArtifact || '',
      note: ''
    });
  }
  if (node.children) {
    for (const child of node.children) {
      list = list.concat(flattenRegistryNode(child, hiveName));
    }
  }
  return list;
};

const registryExportColumns: ExportColumn<FlattenedRegistryRow>[] = [
  { header: 'Colmena (Hive)', accessor: (r) => r.hive },
  { header: 'Ruta Clave (Registry Key)', accessor: (r) => r.keyPath },
  { header: 'Nombre del Valor', accessor: (r) => r.valueName },
  { header: 'Tipo de Datos', accessor: (r) => r.valueType },
  { header: 'Datos / Valor Asignado', accessor: (r) => r.valueData },
  { header: 'Valor Decodificado (ROT13 / Path)', accessor: (r) => r.decoded },
  { header: 'LastWriteTime (UTC)', accessor: (r) => r.lastWriteTime },
  { header: 'Estado Sospechoso', accessor: (r) => r.isSuspicious },
  { header: 'Artefacto Forense Notorio', accessor: (r) => r.forensicArtifact },
  { header: 'Notas de Triaje Pericial', accessor: (r) => r.note }
];

export const RegistryViewer: React.FC = () => {
  const [selectedHiveIndex, setSelectedHiveIndex] = useState<number>(0);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
    'HKLM\\SOFTWARE': true,
    'HKLM\\SOFTWARE\\Microsoft': true,
    'HKLM\\SOFTWARE\\Microsoft\\Windows': true,
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion': true,
    'HKU\\administrator': true,
    'HKU\\administrator\\Software': true,
    'HKU\\administrator\\Software\\Microsoft': true,
    'HKU\\administrator\\Software\\Microsoft\\Windows': true,
    'HKU\\administrator\\Software\\Microsoft\\Windows\\CurrentVersion': true,
    'HKU\\administrator\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer': true,
    'Amcache': true,
    'Amcache\\Root': true,
    'Amcache\\Root\\File': true,
    'HKLM\\SYSTEM': true,
    'HKLM\\SYSTEM\\CurrentControlSet': true,
    'HKLM\\SYSTEM\\CurrentControlSet\\Enum': true
  });

  // Default active key: Run key
  const [selectedKeyPath, setSelectedKeyPath] = useState<string>(
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
  );
  const [selectedValue, setSelectedValue] = useState<RegistryValue | null>(
    REGISTRY_HIVES[0].root.children?.[0]?.children?.[0]?.children?.[0]?.children?.[0]?.values?.[1] || null
  );
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const currentHive = REGISTRY_HIVES[selectedHiveIndex];

  // Flattened entries for offline export
  const currentHiveEntries = useMemo(() => {
    return flattenRegistryNode(currentHive.root, currentHive.name);
  }, [currentHive]);

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeys((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Find node by path
  const findNode = (node: RegistryKeyNode, path: string): RegistryKeyNode | null => {
    if (node.path === path) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, path);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNode(currentHive.root, selectedKeyPath) || currentHive.root;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const renderKeyTree = (node: RegistryKeyNode) => {
    const isExpanded = !!expandedKeys[node.path];
    const isSelected = selectedKeyPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path} className="text-xs">
        <div
          onClick={() => {
            setSelectedKeyPath(node.path);
            if (node.values && node.values.length > 0) {
              setSelectedValue(node.values[0]);
            } else {
              setSelectedValue(null);
            }
          }}
          className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#f0883e]/15 text-[#f0883e] font-semibold border-l-2 border-[#f0883e]'
              : 'hover:bg-[#21262d]/50 text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]'
          }`}
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.path, e)}
              className="p-0.5 hover:text-[#f0883e] text-[#8b949e]"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 text-[#d29922]" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-[#8b949e]" />
          )}

          <span className="truncate flex-1">{node.name}</span>

          {node.isSuspicious && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              ALERTA
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="pl-4 ml-1 border-l border-[#30363d]/40 space-y-0.5 mt-0.5">
            {node.children!.map((child) => renderKeyTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Module Header */}
      <div className="p-4 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Visor de Registro de Windows (Windows Registry)</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Inspección de artefactos en colmenas (hives) extraídas del sistema: Persistencia (Run Keys), Ejecución de usuario (UserAssist ROT13), Dispositivos USB (USBSTOR) y Amcache.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="hidden sm:inline text-[#8b949e]">Herramienta DFIR:</span>
            <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] font-mono">
              RECmd / Registry Explorer
            </span>
            <ExportViewButton
              data={currentHiveEntries}
              viewName={`Registro de Windows (${currentHive.name})`}
              filenamePrefix={`registry_${currentHive.name.toLowerCase()}`}
              columns={registryExportColumns}
              customMetadata={{
                hive: currentHive.name,
                hiveFilePath: currentHive.path,
                selectedKey: selectedKeyPath
              }}
            />
          </div>
        </div>

        {/* Hive Selector Tabs */}
        <div className="mt-4 pt-3 border-t border-[#30363d]/60 flex flex-wrap gap-2">
          {REGISTRY_HIVES.map((hive, idx) => (
            <button
              key={hive.name}
              onClick={() => {
                setSelectedHiveIndex(idx);
                setSelectedKeyPath(hive.root.path);
                setSelectedValue(hive.root.values[0] || null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedHiveIndex === idx
                  ? 'bg-[#f0883e] text-white shadow-sm'
                  : 'bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] border border-[#30363d]'
              }`}
            >
              <span className="font-mono">{hive.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Tree Left, Values Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Hive Key Tree (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-3 flex flex-col max-h-[640px]">
          <div className="pb-2 mb-2 border-b border-[#30363d] flex items-center justify-between text-xs">
            <span className="font-mono text-[#8b949e] text-[11px] truncate">{currentHive.path}</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-1 space-y-0.5 scrollbar-thin">
            {renderKeyTree(currentHive.root)}
          </div>
        </div>

        {/* Values Table and Inspector (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Values List in Selected Key */}
          <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]">
              <div>
                <span className="text-[10px] text-[#8b949e] uppercase font-mono block">Ruta actual de clave:</span>
                <span className="font-mono text-xs font-bold text-[#58a6ff] break-all">{selectedNode.path}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8b949e] block">LastWriteTime (UTC):</span>
                <span className="font-mono text-xs text-[#3fb950]">{selectedNode.lastWriteTime}</span>
              </div>
            </div>

            {selectedNode.forensicArtifact && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#f0883e]/10 border border-[#f0883e]/30 flex items-center gap-2 text-xs text-[#f0883e]">
                <Shield className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Artefacto Forense Notorio:</strong> {selectedNode.forensicArtifact}
                </span>
              </div>
            )}

            {/* Values Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#30363d] text-[#8b949e] text-[11px]">
                    <th className="py-2 px-2">Nombre del Valor</th>
                    <th className="py-2 px-2">Tipo</th>
                    <th className="py-2 px-2">Datos (Data)</th>
                    <th className="py-2 px-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/40 font-mono text-[11px]">
                  {selectedNode.values && selectedNode.values.length > 0 ? (
                    selectedNode.values.map((val) => {
                      const isValSelected = selectedValue?.name === val.name;
                      return (
                        <tr
                          key={val.name}
                          onClick={() => setSelectedValue(val)}
                          className={`cursor-pointer transition-colors ${
                            isValSelected
                              ? 'bg-[#f0883e]/15 text-[#e6edf3]'
                              : 'hover:bg-[#21262d]/40 text-[#8b949e]'
                          }`}
                        >
                          <td className="py-2.5 px-2 font-semibold text-[#e6edf3] max-w-[180px] truncate">
                            <div className="flex items-center gap-1.5">
                              <FileCode className="w-3.5 h-3.5 text-[#8b949e]" />
                              <span>{val.name}</span>
                              {val.isMalicious && (
                                <span className="px-1 py-0.2 rounded text-[8px] bg-red-500/20 text-red-400">
                                  SOSPECHOSO
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-[#58a6ff]">{val.type}</td>
                          <td className="py-2.5 px-2 text-[#e6edf3] max-w-[280px] truncate">{val.value}</td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(val.value);
                              }}
                              className="p-1 hover:text-[#f0883e] text-[#8b949e]"
                              title="Copiar datos al portapapeles"
                            >
                              {copiedText === val.value ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#8b949e] font-sans">
                        Esta clave no contiene valores directos (subclave vacía o de estructura).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Value Forensic Deep Inspection */}
          {selectedValue && (
            <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#f0883e]" />
                  <h3 className="font-bold text-sm text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328]">
                    Detalle del Valor: <span className="font-mono text-[#58a6ff]">{selectedValue.name}</span>
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8b949e]">{selectedValue.type}</span>
              </div>

              {/* Note / Pedagogical Insight */}
              {selectedValue.note && (
                <div className="p-3 rounded-lg bg-[#21262d]/60 border border-[#30363d] text-xs">
                  <span className="font-semibold text-[#f0883e] block mb-1">
                    Nota del Analista Forense:
                  </span>
                  <p className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] leading-relaxed">
                    {selectedValue.note}
                  </p>
                </div>
              )}

              {/* Decoded Value (e.g. ROT13 UserAssist) */}
              {selectedValue.decoded && (
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                  <span className="text-[11px] font-semibold text-[#3fb950] block mb-1 uppercase tracking-wider">
                    Decodificación Automática (ROT13 / UserAssist Header):
                  </span>
                  <pre className="font-mono text-xs text-[#3fb950] whitespace-pre-wrap">
                    {selectedValue.decoded}
                  </pre>
                </div>
              )}

              {/* Raw Hex Preview if available */}
              {selectedValue.rawHex && (
                <div>
                  <span className="text-[11px] font-semibold text-[#8b949e] block mb-1 uppercase tracking-wider">
                    Contenido Binario (Hex Dump):
                  </span>
                  <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#e6edf3] overflow-x-auto">
                    {selectedValue.rawHex}
                  </pre>
                </div>
              )}

              {/* RECmd Command Hint */}
              <div className="text-[11px] text-[#8b949e] font-mono flex items-center justify-between p-2 rounded bg-[#0d1117] border border-[#21262d]">
                <span>Comando RECmd equivalente:</span>
                <span className="text-[#58a6ff]">
                  RECmd.exe -f "{currentHive.path}" --bn "{selectedNode.path}"
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
