import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Award,
  Shield,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Check,
  FileCheck
} from 'lucide-react';
import { INVESTIGATION_QUESTIONS, ATTACK_CHAIN_STAGES } from '../data/forensicCaseData';
import { InvestigationQuestion } from '../types/forensics';
import { ActiveTab } from './Navbar';

interface CaseInvestigationModeProps {
  onNavigateToTab: (tab: ActiveTab) => void;
  onGenerateReport: () => void;
  userAnswers: Record<string, string>;
  setUserAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const CaseInvestigationMode: React.FC<CaseInvestigationModeProps> = ({
  onNavigateToTab,
  onGenerateReport,
  userAnswers,
  setUserAnswers
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const currentQuestion: InvestigationQuestion = INVESTIGATION_QUESTIONS[currentStepIndex];

  // Load selection if already answered
  useEffect(() => {
    if (userAnswers[currentQuestion.id]) {
      setSelectedOptionId(userAnswers[currentQuestion.id]);
      setShowExplanation(true);
    } else {
      setSelectedOptionId(null);
      setShowExplanation(false);
    }
  }, [currentStepIndex, userAnswers, currentQuestion.id]);

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    setShowExplanation(true);
    const updated = { ...userAnswers, [currentQuestion.id]: optionId };
    setUserAnswers(updated);
    try {
      localStorage.setItem('ghostforensics_answers', JSON.stringify(updated));
    } catch (e) {
      // LocalStorage fallback
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar tu progreso en el Modo Investigación?')) {
      setUserAnswers({});
      localStorage.removeItem('ghostforensics_answers');
      setCurrentStepIndex(0);
      setSelectedOptionId(null);
      setShowExplanation(false);
    }
  };

  // Calculate scores
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = INVESTIGATION_QUESTIONS.filter((q) => {
    const userSelected = userAnswers[q.id];
    const correctOpt = q.options.find((o) => o.isCorrect);
    return userSelected && userSelected === correctOpt?.id;
  }).length;

  const isCaseCompleted = answeredCount === INVESTIGATION_QUESTIONS.length;
  const scorePercent = Math.round((correctCount / INVESTIGATION_QUESTIONS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Module Header & Progress Bar */}
      <div className="p-5 rounded-xl bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#f0883e]" />
              <h1 className="text-lg font-bold">Modo Caso: Investigación Guiada con Corrección Automática</h1>
            </div>
            <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76] mt-0.5">
              Navega por las pestañas de evidencia, extrae los artefactos reales y responde a cada hipótesis pericial para reconstruir la cadena del ataque.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3] border border-[#30363d] transition-colors"
              title="Reiniciar respuestas guardadas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="space-y-2 pt-2 border-t border-[#30363d]/60">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b949e]">
              Progreso: <strong className="text-[#e6edf3]">{answeredCount} de {INVESTIGATION_QUESTIONS.length} preguntas</strong>
            </span>
            <span className="font-mono text-xs text-[#f0883e] font-semibold">
              Puntuación: {correctCount}/{INVESTIGATION_QUESTIONS.length} correctas ({scorePercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#0d1117] overflow-hidden border border-[#30363d]/50">
            <div
              className="h-full bg-gradient-to-r from-[#f0883e] to-[#3fb950] transition-all duration-300"
              style={{ width: `${(answeredCount / INVESTIGATION_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pt-2">
            {INVESTIGATION_QUESTIONS.map((q, idx) => {
              const ans = userAnswers[q.id];
              const isCorrect = ans && q.options.find((o) => o.id === ans)?.isCorrect;
              const isAnswered = !!ans;
              const isCurrent = idx === currentStepIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex-1 min-w-[36px] py-2 px-1 text-xs rounded-lg font-mono font-bold transition-all border ${
                    isCurrent
                      ? 'border-[#f0883e] bg-[#f0883e]/20 text-[#f0883e] shadow-sm'
                      : isAnswered
                      ? isCorrect
                        ? 'border-green-500/40 bg-green-500/10 text-green-400'
                        : 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Question Card */}
      <div className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#f0883e]/20 text-[#f0883e] border border-[#f0883e]/30">
              Paso {currentStepIndex + 1} / {INVESTIGATION_QUESTIONS.length}
            </span>
            <span className="text-xs font-semibold text-[#8b949e]">
              Categoría: {currentQuestion.category}
            </span>
          </div>

          {/* Direct jump to evidence tab button */}
          <button
            onClick={() => onNavigateToTab(currentQuestion.targetTab)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] transition-colors"
          >
            <span>Buscar evidencia en <strong>{currentQuestion.targetTabName}</strong></span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Question Text */}
        <div>
          <h2 className="text-base font-bold text-[#e6edf3] dark:text-[#e6edf3] light:text-[#1f2328] mb-2 leading-snug">
            {currentQuestion.question}
          </h2>
          <p className="text-xs text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">
            {currentQuestion.context}
          </p>
        </div>

        {/* Forensic Hint Box */}
        <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-[#f0883e] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#f0883e] block mb-0.5">Pista del Perito Instructor:</span>
            <span className="text-[#8b949e] dark:text-[#8b949e] light:text-[#656d76]">{currentQuestion.hint}</span>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const hasAnswered = !!userAnswers[currentQuestion.id];

            let buttonStyle = 'border-[#30363d] bg-[#0d1117] hover:border-[#f0883e]/60 text-[#e6edf3]';
            if (hasAnswered) {
              if (opt.isCorrect) {
                buttonStyle = 'border-green-500 bg-green-500/15 text-green-300 font-semibold';
              } else if (isSelected && !opt.isCorrect) {
                buttonStyle = 'border-red-500 bg-red-500/15 text-red-300 font-semibold';
              } else {
                buttonStyle = 'border-[#30363d]/40 bg-[#0d1117]/60 text-[#8b949e] opacity-75';
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full p-3.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-3 ${buttonStyle}`}
              >
                <span>{opt.label}</span>
                {hasAnswered && opt.isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                )}
                {hasAnswered && isSelected && !opt.isCorrect && (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Pedagogical Explanation & MITRE Feedback */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3 animate-fadeIn text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0883e] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#f0883e]" />
                Resolución Pedagógica (Ghost Academy DFIR):
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#21262d] text-[#d29922]">
                MITRE ATT&CK: {currentQuestion.mitreTechnique.id} ({currentQuestion.mitreTechnique.name})
              </span>
            </div>

            <p className="text-[#e6edf3] leading-relaxed">
              {currentQuestion.pedagogicalFeedback}
            </p>

            <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-[11px] font-mono text-[#8b949e]">
              <span className="text-[#3fb950] font-semibold block mb-0.5">Evidencia de anclaje:</span>
              {currentQuestion.evidenceAnchor}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="pt-2 flex justify-between items-center">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="px-3 py-1.5 rounded bg-[#21262d] hover:bg-[#30363d] disabled:opacity-30 text-xs text-[#e6edf3] transition-colors"
              >
                &larr; Pregunta Anterior
              </button>

              {currentStepIndex < INVESTIGATION_QUESTIONS.length - 1 ? (
                <button
                  onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                  className="px-4 py-1.5 rounded bg-[#f0883e] hover:bg-[#d2732e] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Siguiente Pregunta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const el = document.getElementById('attack-chain-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Ver Cadena de Ataque Completa</span>
                  <Award className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Attack Chain Reconstruction Section */}
      <div
        id="attack-chain-section"
        className="bg-[#161b22] dark:bg-[#161b22] light:bg-[#ffffff] border border-[#30363d] dark:border-[#30363d] light:border-[#d0d7de] rounded-xl p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#30363d] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#f0883e]" />
              <h2 className="text-base font-bold text-[#e6edf3]">
                Reconstrucción Pericial: Cadena de Ataque Completa (MITRE ATT&CK Matrix)
              </h2>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Mapeo de la secuencia táctica completa descubierta en las evidencias conforme al Módulo 18 y 20 del curso.
            </p>
          </div>

          <button
            onClick={onGenerateReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f0883e] hover:bg-[#d2732e] text-white font-semibold text-xs transition-colors self-start sm:self-auto"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generar Informe Pericial Completo</span>
          </button>
        </div>

        {/* Attack Chain Timeline Grid */}
        <div className="space-y-3">
          {ATTACK_CHAIN_STAGES.map((stage) => {
            return (
              <div
                key={stage.step}
                className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#f0883e]/20 text-[#f0883e] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {stage.step}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[#58a6ff] font-semibold text-[11px]">
                        {stage.timeUtc} UTC
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#21262d] text-[#d29922]">
                        {stage.techniqueId} &middot; {stage.techniqueName}
                      </span>
                    </div>
                    <div className="text-[#e6edf3] font-medium mb-1">
                      {stage.description}
                    </div>
                    <div className="text-[11px] text-[#8b949e]">
                      Artefacto: <span className="text-[#3fb950] font-mono">{stage.evidenceArtifact}</span> ({stage.toolUsed})
                    </div>
                  </div>
                </div>

                <a
                  href={stage.mitreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline shrink-0"
                >
                  <span>MITRE {stage.techniqueId}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
