import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Check,
  ChevronDown,
  Copy,
  Table,
  CheckCircle2
} from 'lucide-react';
import {
  convertToCsv,
  convertToJson,
  triggerFileDownload,
  ExportMetadata
} from '../utils/exportUtils';

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => any;
}

export interface ExportViewButtonProps<T = any> {
  data: T[];
  viewName: string;
  filenamePrefix: string;
  columns?: ExportColumn<T>[];
  rawJsonData?: any;
  customMetadata?: Record<string, any>;
  buttonText?: string;
  className?: string;
  align?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'toolbar';
}

export const ExportViewButton = <T extends any>({
  data,
  viewName,
  filenamePrefix,
  columns,
  rawJsonData,
  customMetadata,
  buttonText = 'Exportar vista',
  className = '',
  align = 'right',
  variant = 'toolbar'
}: ExportViewButtonProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState<'csv' | 'json' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<'csv' | 'json' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const handleExportCsv = () => {
    if (!data || data.length === 0) return;
    const csv = convertToCsv(data, columns);
    const filename = `ghostforensics_${filenamePrefix}_${timestampStr}.csv`;
    triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
    setDownloadSuccess('csv');
    setTimeout(() => {
      setDownloadSuccess(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleExportJson = () => {
    const payload = rawJsonData !== undefined ? rawJsonData : data;
    const metadata: Partial<ExportMetadata> = {
      viewName,
      exportedAt: new Date().toISOString(),
      totalRecords: Array.isArray(payload) ? payload.length : 1,
      ...customMetadata
    };
    const json = convertToJson(payload, metadata);
    const filename = `ghostforensics_${filenamePrefix}_${timestampStr}.json`;
    triggerFileDownload(json, filename, 'application/json;charset=utf-8;');
    setDownloadSuccess('json');
    setTimeout(() => {
      setDownloadSuccess(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleCopyJson = () => {
    const payload = rawJsonData !== undefined ? rawJsonData : data;
    const metadata: Partial<ExportMetadata> = {
      viewName,
      exportedAt: new Date().toISOString(),
      totalRecords: Array.isArray(payload) ? payload.length : 1,
      ...customMetadata
    };
    const json = convertToJson(payload, metadata);
    navigator.clipboard.writeText(json);
    setCopiedSuccess('json');
    setTimeout(() => {
      setCopiedSuccess(null);
    }, 1500);
  };

  // Button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#f0883e] hover:bg-[#d97328] text-white border-transparent shadow-sm';
      case 'secondary':
        return 'bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] border-[#30363d]';
      case 'toolbar':
      default:
        return 'bg-[#0d1117] hover:bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3] border-[#30363d] hover:border-[#f0883e]';
    }
  };

  const count = data ? data.length : 0;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Exportar registros de esta vista a CSV o JSON para análisis offline"
        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-[#f0883e] ${getButtonStyles()} ${
          isOpen ? 'ring-1 ring-[#f0883e] border-[#f0883e] text-[#e6edf3]' : ''
        }`}
      >
        <Download className="w-3.5 h-3.5 text-[#f0883e] shrink-0" />
        <span className="font-semibold">{buttonText}</span>
        {count > 0 && (
          <span className="px-1.5 py-0.2 text-[10px] rounded font-mono bg-[#161b22] border border-[#30363d] text-[#58a6ff]">
            {count}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8b949e] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#f0883e]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 sm:w-80 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] shadow-2xl z-50 p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="px-2 py-1.5 border-b border-[#30363d]/60 dark:border-[#30363d]/60 light:border-[#e1e4e8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-[#f0883e]" />
                Exportar vista actual
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#0d1117] border border-[#30363d] text-[#7ee787]">
                {count} {count === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Descarga los datos visualizados para análisis offline o triaje forense.
            </p>
          </div>

          {/* CSV Option */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={count === 0}
            className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors group ${
              count === 0
                ? 'opacity-50 cursor-not-allowed bg-transparent'
                : 'hover:bg-[#0d1117] dark:hover:bg-[#0d1117] light:hover:bg-[#f6f8fa] border border-transparent hover:border-[#30363d]'
            }`}
          >
            <div className="p-1.5 rounded-md bg-[#238636]/15 text-[#3fb950] border border-[#238636]/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              {downloadSuccess === 'csv' ? (
                <Check className="w-4 h-4 text-[#3fb950]" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] group-hover:text-[#3fb950] transition-colors">
                  Descargar CSV (.csv)
                </span>
                {downloadSuccess === 'csv' && (
                  <span className="text-[10px] text-[#3fb950] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Descargado
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] line-clamp-1 mt-0.5">
                Compatible con Excel, LibreOffice Calc o Eric Zimmerman Tools.
              </p>
            </div>
          </button>

          {/* JSON Option */}
          <button
            type="button"
            onClick={handleExportJson}
            disabled={count === 0 && rawJsonData === undefined}
            className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors group ${
              count === 0 && rawJsonData === undefined
                ? 'opacity-50 cursor-not-allowed bg-transparent'
                : 'hover:bg-[#0d1117] dark:hover:bg-[#0d1117] light:hover:bg-[#f6f8fa] border border-transparent hover:border-[#30363d]'
            }`}
          >
            <div className="p-1.5 rounded-md bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              {downloadSuccess === 'json' ? (
                <Check className="w-4 h-4 text-[#58a6ff]" />
              ) : (
                <FileCode className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] group-hover:text-[#58a6ff] transition-colors">
                  Descargar JSON (.json)
                </span>
                {downloadSuccess === 'json' && (
                  <span className="text-[10px] text-[#58a6ff] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Descargado
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] line-clamp-1 mt-0.5">
                Estructura completa con metadatos del caso e indicadores DFIR.
              </p>
            </div>
          </button>

          {/* Quick Copy Action */}
          <div className="pt-1.5 border-t border-[#30363d]/60 dark:border-[#30363d]/60 light:border-[#e1e4e8] flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopyJson}
              disabled={count === 0 && rawJsonData === undefined}
              className="w-full text-center px-2 py-1 text-[11px] rounded bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa] text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] hover:text-[#e6edf3] dark:hover:text-[#e6edf3] light:hover:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] hover:border-[#f0883e] flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSuccess === 'json' ? (
                <>
                  <Check className="w-3 h-3 text-[#3fb950]" />
                  <span className="text-[#3fb950] font-medium">¡JSON copiado al portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar JSON al portapapeles</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
