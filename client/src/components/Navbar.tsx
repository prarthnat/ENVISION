import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  onNewProject: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewProject }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-slate-800 text-white border border-slate-700'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-slate-100 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              E
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Envision<span className="text-indigo-400">Studio</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link to="/" className={linkClass('/')}>
              Dashboard
            </Link>
            <Link to="/projects" className={linkClass('/projects')}>
              Projects
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewProject}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Project</span>
          </button>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1" aria-label="Mobile navigation">
            <Link to="/" className={linkClass('/')} onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link to="/projects" className={linkClass('/projects')} onClick={() => setMobileOpen(false)}>
              Projects
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onNewProject();
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
            >
              New Project
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
