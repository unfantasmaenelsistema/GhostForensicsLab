import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { TimelineExplorer } from './components/TimelineExplorer';
import { RegistryViewer } from './components/RegistryViewer';
import { EventLogViewer } from './components/EventLogViewer';
import { MemoryProcessesViewer } from './components/MemoryProcessesViewer';
import { NetworkViewer } from './components/NetworkViewer';
import { CloudViewer } from './components/CloudViewer';
import { CaseInvestigationMode } from './components/CaseInvestigationMode';
import { ReportGenerator } from './components/ReportGenerator';
import { CaseBriefModal } from './components/CaseBriefModal';
import { ProgressBackupModal } from './components/ProgressBackupModal';
import { ForensicGlossaryModal } from './components/ForensicGlossaryModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Footer } from './components/Footer';
import { INVESTIGATION_QUESTIONS } from './data/forensicCaseData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [isBriefOpen, setIsBriefOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Theme state: defaults to dark
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('ghostforensics_theme');
      return stored ? stored === 'dark' : true;
    } catch {
      return true;
    }
  });

  // User answers state for investigation mode
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('ghostforensics_answers');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Sync theme with html root element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('ghostforensics_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('ghostforensics_theme', 'light');
    }
  }, [isDarkMode]);

  // Global hotkey listener for Ctrl+K / Cmd+K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const solvedCount = Object.keys(userAnswers).length;
  const totalQuestions = INVESTIGATION_QUESTIONS.length;

  const handleResetInvestigation = () => {
    setUserAnswers({});
    localStorage.removeItem('ghostforensics_answers');
  };

  const handleImportAnswers = (importedAnswers: Record<string, string>, theme?: string) => {
    setUserAnswers(importedAnswers);
    try {
      localStorage.setItem('ghostforensics_answers', JSON.stringify(importedAnswers));
      if (theme === 'dark' || theme === 'light') {
        setIsDarkMode(theme === 'dark');
      }
    } catch (e) {
      // LocalStorage fallback
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-[#0d1117] text-[#e6edf3]' : 'light bg-[#f6f8fa] text-[#1f2328]'}`}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenBrief={() => setIsBriefOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        solvedCount={solvedCount}
        totalQuestions={totalQuestions}
        onResetInvestigation={handleResetInvestigation}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'timeline' && <TimelineExplorer />}
        {activeTab === 'registry' && <RegistryViewer />}
        {activeTab === 'events' && <EventLogViewer />}
        {activeTab === 'memory' && <MemoryProcessesViewer />}
        {activeTab === 'network' && <NetworkViewer />}
        {activeTab === 'cloud' && <CloudViewer />}
        {activeTab === 'investigation' && (
          <CaseInvestigationMode
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onGenerateReport={() => setActiveTab('report')}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
          />
        )}
        {activeTab === 'report' && <ReportGenerator userAnswers={userAnswers} />}
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsSearchOpen(false);
        }}
        onOpenGlossary={(termId) => {
          setIsSearchOpen(false);
          setIsGlossaryOpen(true);
        }}
      />

      {/* Case Brief Modal */}
      <CaseBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        onNavigateToTab={(tab) => {
          setIsBriefOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Forensic Glossary Modal */}
      <ForensicGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      {/* Progress Backup & Restore Modal */}
      <ProgressBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        userAnswers={userAnswers}
        onImportAnswers={handleImportAnswers}
        isDarkMode={isDarkMode}
      />

      {/* Footer */}
      <Footer
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />
    </div>
  );
}
