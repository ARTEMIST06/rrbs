import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Test, TestAttempt } from '../types';
import {
  Trophy,
  Target,
  Clock,
  Play,
  FileCheck2,
  BookmarkCheck,
  TrendingUp,
  AlertCircle,
  Briefcase,
  MapPin,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  tests: Test[];
  attempts: TestAttempt[];
  bookmarksCount: number;
  onSelectTest: (test: Test) => void;
  onViewAttempt: (attempt: TestAttempt) => void;
  onNavigateTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tests,
  attempts,
  bookmarksCount,
  onSelectTest,
  onViewAttempt,
  onNavigateTab,
  onOpenProfile,
}) => {
  const { user, profile } = useAuth();

  // Calculate high-level stats
  const totalAttempts = attempts.length;
  const avgAccuracy =
    totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / totalAttempts)
      : 0;

  const totalScoreObtained = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const totalMaxMarks = attempts.reduce((acc, a) => acc + (a.maxMarks || 0), 0);
  const overallPercentage =
    totalMaxMarks > 0 ? Math.round((totalScoreObtained / totalMaxMarks) * 100) : 0;

  const recommendedTest = tests[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Candidate Welcome Hero */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RRB Junior Engineer CBT-1 Aspirant Workspace</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.displayName || 'Railway Aspirant'}!
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Targeting RRB JE CBT-1 qualification with negative marking practice. Complete daily mock tests, review mistakes, and monitor subject accuracy.
            </p>

            {/* Candidate Configuration Tags */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Trade:</span>
                <strong className="text-white">{profile?.targetBranch || 'Mechanical Engineering'}</strong>
              </div>

              <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Zone:</span>
                <strong className="text-white">{profile?.targetZone || 'RRB Prayagraj (Allahabad)'}</strong>
              </div>

              <button
                onClick={onOpenProfile}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium ml-1"
              >
                Change Preferences
              </button>
            </div>
          </div>

          {/* Quick CTA Card */}
          {recommendedTest && (
            <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-5 md:max-w-xs w-full shadow-lg shrink-0">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Today's Recommended Mock
              </span>
              <h3 className="font-bold text-white text-sm mt-1 truncate">
                {recommendedTest.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 mb-4 font-mono">
                <span>{recommendedTest.totalQuestions} Questions</span>
                <span>•</span>
                <span>{recommendedTest.durationMinutes} Mins</span>
              </div>
              <button
                onClick={() => onSelectTest(recommendedTest)}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start CBT Test Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tests Attempted */}
        <div className="bg-[#0B192C] border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Tests Attempted</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {totalAttempts}
            </div>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-[#0B192C] border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Average Accuracy</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {avgAccuracy}%
            </div>
          </div>
        </div>

        {/* Scaled Score Benchmark */}
        <div className="bg-[#0B192C] border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Avg Score %</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {overallPercentage}%
            </div>
          </div>
        </div>

        {/* Revision Vault */}
        <div className="bg-[#0B192C] border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Revision Vault</span>
            <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">
              {bookmarksCount} <span className="text-xs font-normal text-slate-400">questions</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Recent Attempts vs Official Syllabus Schema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Attempts (2 cols) */}
        <div className="lg:col-span-2 bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent CBT Attempts</span>
            </h2>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              View Full History →
            </button>
          </div>

          {attempts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No Mock Tests Taken Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Take your first CBT simulation test to benchmark your speed, negative marking discipline, and accuracy.
              </p>
              <button
                onClick={() => onNavigateTab('tests')}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition"
              >
                Browse Mock Tests
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 4).map(attempt => (
                <div
                  key={attempt.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">{attempt.testTitle}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 font-mono">
                      <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{attempt.correctCount} Correct</span>
                      <span>•</span>
                      <span className="text-red-400">{attempt.incorrectCount} Wrong</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right font-mono">
                      <div className="text-base font-black text-amber-400">
                        {attempt.score} <span className="text-xs text-slate-500">/ {attempt.maxMarks}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {attempt.accuracy}% Accuracy
                      </span>
                    </div>

                    <button
                      onClick={() => onViewAttempt(attempt)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RRB JE CBT-1 Official Exam Structure Reference */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>RRB JE CBT-1 Exam Pattern</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Official Railway Recruitment Board Stage-1 computer-based test specifications:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">Mathematics</span>
                <span className="text-[11px] text-slate-400">Arithmetic, Algebra, Geometry, Trig</span>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                30 Qs (30 M)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">General Intelligence</span>
                <span className="text-[11px] text-slate-400">Reasoning, Syllogisms, Series</span>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                25 Qs (25 M)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">General Science</span>
                <span className="text-[11px] text-slate-400">Physics, Chemistry, Life Sciences</span>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                30 Qs (30 M)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-200 block">General Awareness</span>
                <span className="text-[11px] text-slate-400">Railways, Current Affairs, Polity</span>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                15 Qs (15 M)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="text-white font-bold">100 Questions</span>
            </div>
            <div className="flex justify-between">
              <span>Exam Duration:</span>
              <span className="text-white font-bold">90 Minutes (120 for PwBD)</span>
            </div>
            <div className="flex justify-between">
              <span>Negative Marking:</span>
              <span className="text-red-400 font-bold">1/3rd (0.33 Mark)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
