import React, { useState } from 'react';
import { Test, TestAttempt } from '../types';
import {
  FileCheck2,
  Clock,
  Award,
  Play,
  CheckCircle2,
  Search,
  BookOpen,
  Filter,
  Sparkles,
} from 'lucide-react';

interface DailyTestsListProps {
  tests: Test[];
  attempts: TestAttempt[];
  onSelectTest: (test: Test) => void;
}

export const DailyTestsList: React.FC<DailyTestsListProps> = ({
  tests,
  attempts,
  onSelectTest,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'pyq' | 'mock' | 'sprint'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map latest/best attempt per testId
  const attemptsMap: Record<string, TestAttempt> = {};
  attempts.forEach(a => {
    if (!attemptsMap[a.testId] || a.score > attemptsMap[a.testId].score) {
      attemptsMap[a.testId] = a;
    }
  });

  const filteredTests = tests.filter(test => {
    // Only published tests in student view
    if (test.status !== 'published') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = test.title.toLowerCase().includes(q);
      const matchDesc = test.description.toLowerCase().includes(q);
      const matchSub = test.subjects.some(s => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSub) return false;
    }

    if (filterMode === 'pyq') return test.isPYQ;
    if (filterMode === 'mock') return !test.isPYQ && test.durationMinutes >= 20;
    if (filterMode === 'sprint') return test.durationMinutes < 20;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-amber-400" />
            <span>Daily CBT Mock Tests & PYQs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real RRB Junior Engineer CBT conditions with timer and -1/3 negative marking penalties.
          </p>
        </div>

        {/* Filter buttons & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by topic, PYQ, shift..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Tests ({tests.filter(t => t.status === 'published').length})
            </button>
            <button
              onClick={() => setFilterMode('pyq')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                filterMode === 'pyq'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Verified PYQs
            </button>
            <button
              onClick={() => setFilterMode('mock')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                filterMode === 'mock'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Mocks
            </button>
            <button
              onClick={() => setFilterMode('sprint')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                filterMode === 'sprint'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Speed Sprints
            </button>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-16 bg-[#0B192C] border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Tests Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or switching filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => {
            const bestAttempt = attemptsMap[test.id];

            return (
              <div
                key={test.id}
                className="bg-[#0B192C] border border-slate-800 hover:border-slate-700/90 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition relative group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
                      {test.examType}
                    </span>

                    {test.isPYQ ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {test.sourceYear || 'Verified PYQ'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Model Mock
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition leading-snug">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  {/* Test Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-slate-800/80 text-center font-mono">
                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Questions
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {test.totalQuestions} Qs
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Time Limit
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {test.durationMinutes}m
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">
                        Max Marks
                      </span>
                      <span className="text-sm font-bold text-slate-200">
                        {test.totalMarks} M
                      </span>
                    </div>
                  </div>

                  {/* Subjects Covered */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {test.subjects.map(s => (
                      <span
                        key={s}
                        className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    {bestAttempt ? (
                      <div className="text-xs font-mono">
                        <span className="text-[10px] text-slate-500 block font-sans">
                          Best Attempt:
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {bestAttempt.score}/{bestAttempt.maxMarks}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">
                          ({bestAttempt.accuracy}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Not attempted yet</span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectTest(test)}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{bestAttempt ? 'Retake CBT' : 'Start CBT'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
