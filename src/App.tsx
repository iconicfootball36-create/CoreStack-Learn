/**
 * CoreStack Learn — AI Personal Lecturer
 * Personal learning workspace
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PedagogicalDemo } from './components/PedagogicalDemo';
import { ProblemSolution } from './components/ProblemSolution';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { AuthPreviewModal } from './components/AuthPreviewModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { StudentDashboard } from './components/StudentDashboard';

function MainContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'auto' | 'landing' | 'workspace'>('auto');
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup',
  });
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleCloseAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenHowItWorks = () => {
    setHowItWorksModalOpen(true);
  };

  const handleCloseHowItWorks = () => {
    setHowItWorksModalOpen(false);
  };

  // Determine if student workspace should be shown
  const showWorkspace = (currentView === 'auto' && isAuthenticated) || currentView === 'workspace';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500 font-semibold">Initializing CoreStack Learn Session...</p>
        </div>
      </div>
    );
  }

  if (showWorkspace && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <StudentDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenHowItWorks={handleOpenHowItWorks}
        onEnterDashboard={() => setCurrentView('workspace')}
      />

      {/* Hero Section */}
      <Hero
        onStartLearning={() => handleOpenAuth('signup')}
        onSeeHowItWorks={handleOpenHowItWorks}
      />

      {/* Interactive Pedagogical Cognitive Simulator */}
      <PedagogicalDemo />

      {/* Problem vs Solution Section */}
      <ProblemSolution />

      {/* How It Works (6-Step Cognitive Pipeline) */}
      <HowItWorks />

      {/* Core Features Grid */}
      <Features />

      {/* Footer & Final Call to Action */}
      <Footer
        onStartLearning={() => handleOpenAuth('signup')}
        onOpenHowItWorks={handleOpenHowItWorks}
      />

      {/* Modals */}
      <AuthPreviewModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={handleCloseAuth}
        onSuccess={() => setCurrentView('workspace')}
      />

      <HowItWorksModal
        isOpen={howItWorksModalOpen}
        onClose={handleCloseHowItWorks}
        onStartLearning={() => {
          handleCloseHowItWorks();
          handleOpenAuth('signup');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
