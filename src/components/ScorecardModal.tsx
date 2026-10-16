import React, { useEffect } from 'react';
import { TestAttempt } from '../types';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  BarChart,
  ArrowRight,
  RotateCcw,
  Info,
  Award,
} from 'lucide-react';

interface ScorecardModalProps {
  attempt: TestAttempt;
  onReviewAnswers: () => void;
  onRetakeTest: () => void;
  onGoToDashboard: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  attempt,
  onReviewAnswers,
  onRetakeTest,
  onGoToDashboard,
}) => {
  const percentage = Math.round((attempt.score / attempt.maxMarks) * 100);

  useEffect(() => {
    // Fire confetti if scored above 60%
    if (percentage >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // ignore
      }
    }
  }, [percentage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // RRB Historical CBT-1 Cutoff Benchmark (approx normalized marks out of 100 or scaled)
  const scaledScore100 = (attempt.score / attempt.maxMarks) * 100;

  const cutoffs = [
    { category: 'UR (General)', benchmark: 67.5, color: 'bg-blue-500' },
    { category: 'OBC (Non-Creamy)', benchmark: 63.0, color: 'bg-amber-500' },
    { category: 'SC (Scheduled Caste)', benchmark: 54.0, color: 'bg-emerald-500' },
    { category: 'ST (Scheduled Tribe)', benchmark: 49.5, color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#0B192C] border border-slate-700/80 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-8">
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-lg shadow-amber-900/40 border border-amber-400 mb-3">
            <Trophy className="w-8 h-8 text-slate-950 font-black" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            RRB JE CBT Scorecard
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-medium">{attempt.testTitle}</p>
          <div className="flex items-center justify-center space-x-3 mt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Time Taken: {formatTime(attempt.timeSpentSeconds)}</span>
            </span>
            <span>•</span>
            <span>Attempt ID: {attempt.id.substring(0, 16)}</span>
          </div>
        </div>

        {/* Score & Key KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 font-mono">
          {/* Net Score */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-sans uppercase tracking-wider">
              Net Marks
            </span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {attempt.score}
            </div>
            <span className="text-xs text-slate-500">out of {attempt.maxMarks}</span>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-sans uppercase tracking-wider">
              Accuracy
            </span>
            <div className={`text-3xl font-black mt-1 ${
              attempt.accuracy >= 75 ? 'text-emerald-400' : attempt.accuracy >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {attempt.accuracy}%
            </div>
            <span className="text-xs text-slate-500">
              {attempt.correctCount} / {attempt.attemptedCount} attempted
            </span>
          </div>

          {/* Correct / Incorrect breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-sans uppercase tracking-wider">
              Correct / Wrong
            </span>
            <div className="text-2xl font-black mt-1 text-slate-200">
              <span className="text-emerald-400">{attempt.correctCount}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-red-400">{attempt.incorrectCount}</span>
            </div>
            <span className="text-xs text-red-400/80">
              -{(attempt.incorrectCount * 0.33).toFixed(2)} penalty
            </span>
          </div>

          {/* Unanswered */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 block font-sans uppercase tracking-wider">
              Unanswered
            </span>
            <div className="text-3xl font-black text-slate-300 mt-1">
              {attempt.unansweredCount}
            </div>
            <span className="text-xs text-slate-500">
              {Math.round((attempt.unansweredCount / attempt.totalQuestions) * 100)}% skipped
            </span>
          </div>
        </div>

        {/* Cutoff Competitiveness Gauge (with mandatory uncertainty disclaimer) */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Historical RRB JE CBT-1 Cutoff Competitiveness Benchmark
              </h4>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Your Scaled Score: {scaledScore100.toFixed(1)}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {cutoffs.map(item => {
              const qualifies = scaledScore100 >= item.benchmark;
              return (
                <div key={item.category} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-300">{item.category}</span>
                    <span className="text-slate-500 block text-[10px] font-mono">
                      Bench: ~{item.benchmark} marks
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    qualifies
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-red-950 text-red-400 border border-red-800'
                  }`}>
                    {qualifies ? 'Competitive' : 'Below Bench'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-start space-x-1.5 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded border border-slate-800/60">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Cutoff Uncertainty Disclaimer:</strong> Official RRB JE qualifying cutoffs are subject to normalization, zone-specific vacancy ratios (e.g., RRB Allahabad, Kolkata vs Malda), and engineering disciplines (Mechanical, Electrical, Civil, Electronics). This benchmark represents historical average CBT-1 cutoffs and is provided solely for self-evaluation.
            </span>
          </div>
        </div>

        {/* Subject-wise Marks Table */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-2">
            <BarChart className="w-3.5 h-3.5 text-amber-400" />
            <span>Subject-wise Breakdown</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#1E3E62] text-slate-300 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center text-emerald-400">Correct</th>
                  <th className="py-2.5 px-3 text-center text-red-400">Wrong</th>
                  <th className="py-2.5 px-3 text-center text-amber-400 font-bold">Marks</th>
                  <th className="py-2.5 px-3 text-center">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                {Object.values(attempt.subjectBreakdown).map(sub => (
                  <tr key={sub.subject} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {sub.subject}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{sub.total}</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{sub.correct}</td>
                    <td className="py-2.5 px-3 text-center text-red-400">{sub.incorrect}</td>
                    <td className="py-2.5 px-3 text-center text-amber-400 font-bold">
                      {sub.marksObtained}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sub.accuracy >= 70 ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {sub.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onRetakeTest}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Test</span>
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-3">
            <button
              onClick={onGoToDashboard}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
            >
              Dashboard
            </button>
            <button
              onClick={onReviewAnswers}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/40 flex items-center justify-center space-x-2 transition"
            >
              <span>Review Answers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
