import React, { useState } from 'react';
import { TestAttempt, Test } from '../types';
import {
  History,
  Clock,
  Target,
  FileCheck2,
  ArrowRight,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
} from 'lucide-react';

interface TestHistoryProps {
  attempts: TestAttempt[];
  tests: Test[];
  onReviewAttempt: (attempt: TestAttempt) => void;
  onRetakeTest: (test: Test) => void;
  onGoToTests: () => void;
}

export const TestHistory: React.FC<TestHistoryProps> = ({
  attempts,
  tests,
  onReviewAttempt,
  onRetakeTest,
  onGoToTests,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAttempts = attempts.filter(att => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      att.testTitle.toLowerCase().includes(q) ||
      att.examType.toLowerCase().includes(q)
    );
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Attempt History & Scorecards</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your historical CBT mock test scores, time spent, and review questions you got wrong.
          </p>
        </div>

        {attempts.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search previous tests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>
        )}
      </div>

      {filteredAttempts.length === 0 ? (
        <div className="text-center py-16 bg-[#0B192C] border border-slate-800 rounded-2xl p-8">
          <FileCheck2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No Attempts Recorded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Take an RRB JE CBT mock test to view detailed scorecards, penalty deductions, and question reviews.
          </p>
          <button
            onClick={onGoToTests}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
          >
            Start a Practice Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttempts.map(attempt => {
            const matchedTest = tests.find(t => t.id === attempt.testId);

            return (
              <div
                key={attempt.id}
                className="bg-[#0B192C] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Test Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        {attempt.examType}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(attempt.submittedAt).toLocaleDateString()} at {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {attempt.testTitle}
                    </h3>

                    {/* KPIs Strip */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-300">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Time: {formatTime(attempt.timeSpentSeconds)}</span>
                      </span>

                      <span className="flex items-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{attempt.correctCount} Correct</span>
                      </span>

                      <span className="flex items-center space-x-1 text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{attempt.incorrectCount} Wrong</span>
                      </span>

                      <span className="flex items-center space-x-1 text-slate-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{attempt.unansweredCount} Skipped</span>
                      </span>
                    </div>

                    {/* Subject Tags */}
                    {attempt.subjectBreakdown && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {Object.values(attempt.subjectBreakdown).map(sub => (
                          <span
                            key={sub.subject}
                            className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-mono"
                          >
                            {sub.subject}: <strong className="text-amber-400">{sub.marksObtained}M</strong> ({sub.accuracy}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score & Actions */}
                  <div className="flex sm:items-center justify-between lg:justify-end space-x-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-left sm:text-right font-mono pr-2">
                      <div className="text-2xl font-black text-amber-400">
                        {attempt.score} <span className="text-xs text-slate-500 font-normal">/ {attempt.maxMarks}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        Accuracy: <strong className={attempt.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{attempt.accuracy}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {matchedTest && (
                        <button
                          onClick={() => onRetakeTest(matchedTest)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Retake this test"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onReviewAttempt(attempt)}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                      >
                        <span>Review Solutions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
