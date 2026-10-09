import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Database,
  ArrowRight,
  Shield,
  FileText
} from 'lucide-react';
import { CASE_METADATA, INVESTIGATION_QUESTIONS } from '../data/forensicCaseData';

interface ProgressBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAnswers: Record<string, string>;
  onImportAnswers: (importedAnswers: Record<string, string>, theme?: string) => void;
  isDarkMode: boolean;
}

export const ProgressBackupModal: React.FC<ProgressBackupModalProps> = ({
  isOpen,
  onClose,
  userAnswers,
  onImportAnswers,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [pastedJson, setPastedJson] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = INVESTIGATION_QUESTIONS.filter((q) => {
    const userSelected = userAnswers[q.id];
    const correctOpt = q.options.find((o) => o.isCorrect);
    return userSelected && userSelected === correctOpt?.id;
  }).length;
  const scorePercent = Math.round((correctCount / INVESTIGATION_QUESTIONS.length) * 100);

  // Generate complete backup JSON payload
  const createBackupData = () => {
    return {
      app: 'GhostForensics Lab',
      version: '1.0.0',
      caseId: CASE_METADATA.caseId,
      caseTitle: CASE_METADATA.caseTitle,
      exportDate: new Date().toISOString(),
      themePreference: isDarkMode ? 'dark' : 'light',
      userAnswers: userAnswers,
      statistics: {
        answeredCount,
        totalQuestions: INVESTIGATION_QUESTIONS.length,
        correctCount,
        scorePercent
      },
      caseMetadata: {
        victimHostname: CASE_METADATA.victimHostname,
        victimIp: CASE_METADATA.victimIp,
        compromisedUser: CASE_METADATA.compromisedUser,
        attackerIp: CASE_METADATA.attackerIp,
        c2Port: CASE_METADATA.c2Port,
        incidentTimeRange: CASE_METADATA.incidentTimeRange
      }
    };
  };

  const jsonString = JSON.stringify(createBackupData(), null, 2);

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateFormatted = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `ghostforensics_progreso_${CASE_METADATA.caseId}_${dateFormatted}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: '¡Archivo JSON descargado correctamente! Guárdalo para cargarlo en otro navegador.'
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    setStatusMessage({
      type: 'success',
      text: '¡JSON copiado al portapapeles!'
    });
  };

  const processImportString = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('El archivo no contiene un objeto JSON válido.');
      }

      // Check for userAnswers or answers field
      const answers = parsed.userAnswers || parsed.answers;
      if (!answers || typeof answers !== 'object') {
        throw new Error('No se encontró el objeto de respuestas "userAnswers" en el archivo JSON.');
      }

      // Clean answers to only include known question IDs
      const validAnswers: Record<string, string> = {};
      const knownIds = new Set(INVESTIGATION_QUESTIONS.map((q) => q.id));

      Object.entries(answers).forEach(([qId, optId]) => {
        if (knownIds.has(qId) && typeof optId === 'string') {
          validAnswers[qId] = optId;
        }
      });

      const count = Object.keys(validAnswers).length;
      if (count === 0 && Object.keys(answers).length > 0) {
        throw new Error('Las claves del archivo no corresponden a las preguntas del caso actual.');
      }

      onImportAnswers(validAnswers, parsed.themePreference);
      setStatusMessage({
        type: 'success',
        text: `¡Progreso restaurado con éxito! Se cargaron ${count} respuestas.`
      });
      setPastedJson('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error al importar: ${err.message || 'JSON inválido'}`
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processImportString(content);
      }
    };
    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Error al leer el archivo seleccionado.'
      });
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] flex items-center justify-between sticky top-0 bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0883e]/20 border border-[#f0883e]/40 flex items-center justify-center text-lg">
              💾
            </div>
            <div>
              <h2 className="text-base font-bold">Gestión de Progreso & Respaldo JSON</h2>
              <p className="text-xs text-[#8b949e]">
                Guarda tu avance para continuar tu investigación en otro navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="p-4 border-b border-[#30363d] flex gap-2 bg-[#0d1117] dark:bg-[#0d1117] light:bg-[#f6f8fa]">
          <button
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'export'
                ? 'bg-[#f0883e] text-white shadow-sm'
                : 'bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar a JSON</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'import'
                ? 'bg-[#f0883e] text-white shadow-sm'
                : 'bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar desde JSON</span>
          </button>
        </div>

        {/* Notification Status Banner */}
        {statusMessage && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {activeTab === 'export' ? (
            <>
              {/* Export Status Overview */}
              <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8b949e]">Caso Actual:</span>
                  <span className="text-[#58a6ff] font-bold">{CASE_METADATA.caseId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8b949e]">Preguntas Respondidas:</span>
                  <span className="text-[#e6edf3] font-semibold">{answeredCount} de {INVESTIGATION_QUESTIONS.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8b949e]">Aciertos / Puntuación:</span>
                  <span className="text-[#3fb950] font-bold">{correctCount} correctas ({scorePercent}%)</span>
                </div>
              </div>

              <p className="text-[#8b949e] leading-relaxed">
                Descarga tu archivo JSON para respaldar tus respuestas o transferirlas a otro dispositivo/navegador. No requiere ningún servidor ni cuenta externa.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={handleDownloadJson}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#f0883e] hover:bg-[#d2732e] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo JSON</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="py-2.5 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] font-medium text-xs flex items-center justify-center gap-2 border border-[#30363d] transition-colors"
                >
                  {copiedJson ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedJson ? '¡Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              {/* JSON Payload Preview */}
              <div className="pt-2">
                <span className="text-[10px] text-[#8b949e] uppercase font-mono block mb-1">
                  Vista previa de los datos a exportar:
                </span>
                <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[10px] text-[#8b949e] max-h-36 overflow-y-auto">
                  {jsonString}
                </pre>
              </div>
            </>
          ) : (
            <>
              {/* Import Options */}
              <div className="space-y-4">
                {/* File picker */}
                <div>
                  <span className="font-semibold text-[#e6edf3] block mb-1.5">
                    Opción 1: Subir archivo .json guardado previamente
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-lg border-2 border-dashed border-[#30363d] hover:border-[#f0883e] bg-[#0d1117] cursor-pointer text-center transition-colors space-y-1.5"
                  >
                    <Upload className="w-6 h-6 text-[#f0883e] mx-auto" />
                    <div className="font-medium text-[#e6edf3]">
                      Haz clic aquí para seleccionar tu archivo JSON
                    </div>
                    <div className="text-[11px] text-[#8b949e]">
                      Formatos admitidos: .json (ej. ghostforensics_progreso_GH-2026-0314-INC.json)
                    </div>
                  </div>
                </div>

                {/* Paste JSON */}
                <div>
                  <span className="font-semibold text-[#e6edf3] block mb-1.5">
                    Opción 2: Pegar el contenido del JSON directamente
                  </span>
                  <textarea
                    rows={4}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder='Pega aquí el JSON exportado (ej: { "caseId": "GH-2026-0314-INC", "userAnswers": { ... } })'
                    className="w-full p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-[11px] text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:border-[#f0883e]"
                  />
                  <button
                    onClick={() => processImportString(pastedJson)}
                    disabled={!pastedJson.trim()}
                    className="mt-2 w-full py-2 px-3 rounded-lg bg-[#f0883e] hover:bg-[#d2732e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Cargar y Restaurar Progreso</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#30363d] flex justify-end bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#e6edf3] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
