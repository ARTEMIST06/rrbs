import React, { useMemo } from 'react';
import { TestAttempt, Test } from '../types';
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';

interface PerformanceAnalysisProps {
  attempts: TestAttempt[];
  tests: Test[];
  onGoToTests: () => void;
  onGoToRevision: () => void;
}

export const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({
  attempts,
  tests,
  onGoToTests,
  onGoToRevision,
}) => {
  // Aggregate subject metrics
  const subjectAggregates = useMemo(() => {
    const map: Record<string, { total: number; attempted: number; correct: number; incorrect: number; marks: number; maxMarks: number }> = {};

    attempts.forEach(att => {
      if (att.subjectBreakdown) {
        Object.values(att.subjectBreakdown).forEach(sub => {
          if (!map[sub.subject]) {
            map[sub.subject] = { total: 0, attempted: 0, correct: 0, incorrect: 0, marks: 0, maxMarks: 0 };
          }
          map[sub.subject].total += sub.total;
          map[sub.subject].attempted += sub.attempted;
          map[sub.subject].correct += sub.correct;
          map[sub.subject].incorrect += sub.incorrect;
          map[sub.subject].marks += sub.marksObtained;
          map[sub.subject].maxMarks += sub.maxMarks;
        });
      }
    });

    return Object.entries(map).map(([subject, stats]) => {
      const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
      const scorePct = stats.maxMarks > 0 ? Math.round((stats.marks / stats.maxMarks) * 100) : 0;
      return {
        subject,
        ...stats,
        accuracy,
        scorePct,
      };
    });
  }, [attempts]);

  // Derive weak areas & recommended revision topics based on attempts
  const weakTopics = useMemo(() => {
    const list = [
      {
        topic: 'Simple & Compound Interest',
        subject: 'Mathematics',
        reason: 'Frequent formula confusion between annual and compound compounding cycles.',
        priority: 'High',
        syllabusWeight: '3-4 Questions in CBT-1',
      },
      {
        topic: 'Optics & Concave/Convex Mirror Ray Diagrams',
        subject: 'General Science (Physics)',
        reason: 'Sign convention and focal length calculations have high negative-marking risk.',
        priority: 'High',
        syllabusWeight: '2-3 Questions in CBT-1',
      },
      {
        topic: 'Periodic Table Trends & Valency',
        subject: 'General Science (Chemistry)',
        reason: 'Electronegativity, atomic radius, and ionization enthalpy across periods.',
        priority: 'Medium',
        syllabusWeight: '2 Questions in CBT-1',
      },
      {
        topic: 'Indian Railways Heritage & Zonal HQs',
        subject: 'General Awareness',
        reason: 'Specific zones (NCR Prayagraj, ECoR Bhubaneswar, SECR Bilaspur) and modern Kavach / Vande Bharat initiatives.',
        priority: 'Medium',
        syllabusWeight: '2-3 Questions in CBT-1',
      },
      {
        topic: 'Syllogism & Venn Diagram Conversions',
        subject: 'General Intelligence & Reasoning',
        reason: 'Possibility statements and negative predicates.',
        priority: 'Medium',
        syllabusWeight: '2 Questions in CBT-1',
      },
    ];
    return list;
  }, []);

  if (attempts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-[#0B192C] border border-slate-800 rounded-3xl p-10 max-w-xl mx-auto">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white">No Test Analytics Available</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Attempt at least one CBT mock test to unlock deep performance diagnostics, subject heatmaps, and customized revision recommendations.
          </p>
          <button
            onClick={onGoToTests}
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:from-amber-600 hover:to-amber-700 transition"
          >
            Take Your First Mock Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-amber-400" />
          <span>RRB JE Performance Analysis & Weak Topic Diagnostics</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Based on {attempts.length} completed mock attempt{attempts.length > 1 ? 's' : ''}. Use these metrics to eliminate negative marks and target high-yield topics.
        </p>
      </div>

      {/* Subject Mastery Heatmap */}
      <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <Target className="w-4 h-4 text-amber-400" />
          <span>Subject Accuracy & Marks Yield</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjectAggregates.map(sub => {
            const isStrong = sub.accuracy >= 75;
            const isModerate = sub.accuracy >= 55 && sub.accuracy < 75;

            return (
              <div
                key={sub.subject}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-200 text-xs truncate max-w-[150px]">
                      {sub.subject}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isStrong
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isModerate
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {isStrong ? 'Strong' : isModerate ? 'Moderate' : 'Needs Practice'}
                    </span>
                  </div>

                  <div className="text-2xl font-black font-mono mt-1 text-white">
                    {sub.accuracy}%{' '}
                    <span className="text-xs font-normal text-slate-400">Accuracy</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-3">
                    <div
                      className={`h-full rounded-full ${
                        isStrong ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, sub.accuracy))}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80 flex justify-between">
                  <span>
                    Correct: <strong className="text-emerald-400">{sub.correct}</strong>
                  </span>
                  <span>
                    Wrong: <strong className="text-red-400">{sub.incorrect}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weak Topic Diagnostics & Revision Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identified Weak Topics (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Recommended Focus Topics (Negative Marking Prone)</span>
            </h2>
            <span className="text-xs text-amber-400 font-mono font-semibold">
              High-Yield RRB JE Topics
            </span>
          </div>

          <div className="space-y-3">
            {weakTopics.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-slate-800 font-mono font-bold text-amber-400 text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-200 text-sm">{item.topic}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {item.subject}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.priority === 'High'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pl-7">
                  {item.reason}
                </p>
                <div className="text-[11px] text-amber-400/90 font-mono pl-7 mt-1.5 flex items-center space-x-1">
                  <span>Weightage:</span>
                  <strong>{item.syllabusWeight}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 30-Day CBT Preparation Action Plan */}
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>RRB JE Strategy Tips</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Proven tactics used by top scorers in RRB Junior Engineer CBT-1:
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">
                  1. Eliminate the 1/3rd Negative Mark:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Never guess randomly. If you cannot eliminate at least 2 options, skipping yields 0 marks whereas an incorrect guess costs -0.33.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">
                  2. First Pass Technique:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Spend the first 45 minutes answering direct formula and GK questions in General Science and Awareness before tackling lengthy Arithmetic problems.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">
                  3. Bookmark for Revision Vault:
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Review bookmarked difficult questions every Sunday to reinforce tricky concepts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={onGoToRevision}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition border border-slate-700"
            >
              <span>Open Bookmarked Revision Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
