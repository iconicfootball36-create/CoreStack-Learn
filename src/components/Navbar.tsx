import React, { useState, useEffect } from 'react';
import { ArrowRight, User, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/authContext';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenHowItWorks: () => void;
  onEnterDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenHowItWorks, onEnterDashboard }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm shadow-slate-900/5'
          : 'bg-white text-slate-900 border-b border-slate-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4.5rem] flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-200 group-hover:bg-blue-700 transition-colors">
              <span className="font-extrabold">C</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">CoreStack</span>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-blue-600 font-sans">Learn</span>
              </div>
            </div>
          </a>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
            How It Works
          </a>
          <a href="#pedagogical-loop" className="hover:text-blue-600 transition-colors">
            Cognitive Loop
          </a>
          <a href="#features" className="hover:text-blue-600 transition-colors">
            Features
          </a>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onEnterDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Student Workspace ({user.name.split(' ')[0]})</span>
              </button>

              <button
                onClick={onEnterDashboard}
                className="text-xs font-semibold px-4 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Enter Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="btn-nav-login"
                onClick={() => onOpenAuth('login')}
                className="text-xs sm:text-sm font-medium px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Log In
              </button>

              <button
                id="btn-nav-get-started"
                onClick={() => onOpenAuth('signup')}
                className="text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1 text-sm font-medium text-slate-700">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 hover:text-blue-600"
            >
              How It Works
            </a>
            <a
              href="#pedagogical-loop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 hover:text-blue-600"
            >
              Cognitive Loop
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 rounded-lg hover:bg-slate-50 hover:text-blue-600"
            >
              Features
            </a>

            <div className="pt-2 mt-2 border-t border-slate-100">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onEnterDashboard?.();
                  }}
                  className="w-full px-3 py-3 rounded-lg bg-blue-600 text-white font-bold text-left flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Open Student Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                    className="px-3 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('signup');
                    }}
                    className="px-3 py-3 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Start Learning
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
