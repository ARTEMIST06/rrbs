import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Train,
  LayoutDashboard,
  FileCheck2,
  History,
  BarChart3,
  BookmarkCheck,
  ShieldAlert,
  LogOut,
  LogIn,
  User,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openProfileModal }) => {
  const { user, profile, isAdmin, signInWithGoogle, logout, demoRole, setDemoRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white border-b border-slate-800 shadow-md">
      {/* Top Bar for RRB Notice & Environment */}
      <div className="bg-[#1E3E62] px-4 py-1.5 text-xs text-slate-200 flex justify-between items-center border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white tracking-wide uppercase">
            Govt. Syllabus Aligned
          </span>
          <span className="hidden sm:inline text-slate-300">
            Railway Recruitment Board (RRB) Junior Engineer CBT-1 & CBT-2 Preparation Portal
          </span>
          <span className="sm:hidden text-slate-300">RRB JE CBT Portal</span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Quick Role Toggle for Evaluator Preview */}
          <div className="flex items-center space-x-1.5 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
            <span className="text-[11px] text-slate-400">View as:</span>
            <button
              onClick={() => setDemoRole(null)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                demoRole === null
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Use actual authenticated user role"
            >
              Default {isAdmin ? '(Admin)' : '(Student)'}
            </button>
            <button
              onClick={() => setDemoRole('student')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                demoRole === 'student'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setDemoRole('admin')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition ${
                demoRole === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {profile?.targetZone && (
            <div className="hidden md:flex items-center space-x-1 text-slate-300">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{profile.targetZone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 border border-amber-400/40">
              <Train className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  RAILWAY <span className="text-amber-400">JE</span> PREP
                </span>
                <span className="text-[10px] bg-red-900/80 text-red-200 border border-red-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                  CBT-1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-wide">
                RRB Junior Engineer Exam Simulation
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'dashboard'
                  ? 'bg-[#1E3E62] text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('tests')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'tests'
                  ? 'bg-[#1E3E62] text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Daily CBT Tests</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'history'
                  ? 'bg-[#1E3E62] text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Test History</span>
            </button>

            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'analytics'
                  ? 'bg-[#1E3E62] text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setCurrentTab('revision')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'revision'
                  ? 'bg-[#1E3E62] text-amber-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Revision Vault</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-semibold transition ${
                  currentTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* User Auth & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={openProfileModal}
                  className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  title="Configure Branch & RRB Zone"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-amber-400"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center font-bold text-xs text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left text-xs">
                    <p className="font-semibold text-slate-100 max-w-[120px] truncate">
                      {user.displayName || 'Candidate'}
                    </p>
                    <p className="text-[10px] text-amber-300 flex items-center space-x-1">
                      <Briefcase className="w-2.5 h-2.5 inline mr-0.5" />
                      <span className="max-w-[100px] truncate">
                        {profile?.targetBranch || 'Mechanical'}
                      </span>
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Student Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Subnav */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 text-xs no-scrollbar">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'dashboard' ? 'bg-[#1E3E62] text-amber-400 font-bold' : 'text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('tests')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'tests' ? 'bg-[#1E3E62] text-amber-400 font-bold' : 'text-slate-300'
            }`}
          >
            Daily CBT Tests
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'history' ? 'bg-[#1E3E62] text-amber-400 font-bold' : 'text-slate-300'
            }`}
          >
            Test History
          </button>
          <button
            onClick={() => setCurrentTab('analytics')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'analytics' ? 'bg-[#1E3E62] text-amber-400 font-bold' : 'text-slate-300'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setCurrentTab('revision')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              currentTab === 'revision' ? 'bg-[#1E3E62] text-amber-400 font-bold' : 'text-slate-300'
            }`}
          >
            Revision Vault
          </button>
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-2.5 py-1 rounded whitespace-nowrap font-bold text-amber-400 ${
                currentTab === 'admin' ? 'bg-amber-900/60' : 'bg-slate-900'
              }`}
            >
              Admin Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
