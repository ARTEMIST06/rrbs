import React, { useState } from 'react';
import { TestAttempt, Question } from '../types';
import { addBookmark, removeBookmark } from '../services/testService';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Lightbulb,
  FileQuestion,
} from 'lucide-react';

interface TestReviewProps {
  attempt: TestAttempt;
  questions: Question[];
  onBackToHistory: () => void;
}

export const TestReview: React.FC<TestReviewProps> = ({
  attempt,
  questions,
  onBackToHistory,
}) => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  // Filter questions according to student's answers
  const filteredQuestions = questions.filter(q => {
    const ans = attempt.answers[q.id];
    const isAttempted = ans?.selectedOptionIndex !== null && ans?.selectedOptionIndex !== undefined;
    const isCorrect = ans?.isCorrect || false;

    if (filterType === 'correct') return isAttempted && isCorrect;
    if (filterType === 'incorrect') return isAttempted && !isCorrect;
    if (filterType === 'unattempted') return !isAttempted;
    return true; // 'all'
  });

  const currentQ = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];
  const userAns = currentQ ? attempt.answers[currentQ.id] : null;

  // Toggle bookmark
  const handleToggleBookmark = async (q: Question) => {
    if (!user) return;
    const isBm = bookmarkedMap[q.id];
    setBookmarkedMap(prev => ({ ...prev, [q.id]: !isBm }));

    if (isBm) {
      await removeBookmark(user.uid, `bm_${q.id}_${user.uid}`);
    } else {
      await addBookmark({
        id: `bm_${q.id}_${user.uid}`,
        userId: user.uid,
        testId: attempt.testId,
        questionId: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        isPYQ: q.isPYQ,
        sourceTag: q.sourceTag,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Banner & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToHistory}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Question Review & Explanations
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {attempt.testTitle} • Score: {attempt.score} / {attempt.maxMarks} ({attempt.accuracy}% Accuracy)
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setFilterType('all'); setActiveQuestionIndex(0); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            onClick={() => { setFilterType('correct'); setActiveQuestionIndex(0); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'correct'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
          >
            Correct ({attempt.correctCount})
          </button>
          <button
            onClick={() => { setFilterType('incorrect'); setActiveQuestionIndex(0); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'incorrect'
                ? 'bg-red-600 text-white shadow'
                : 'text-red-400 hover:bg-slate-800'
            }`}
          >
            Incorrect ({attempt.incorrectCount})
          </button>
          <button
            onClick={() => { setFilterType('unattempted'); setActiveQuestionIndex(0); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'unattempted'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Skipped ({attempt.unansweredCount})
          </button>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="my-16 text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No questions match this filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching to 'All' or another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Left: Quick question index list */}
          <div className="lg:col-span-1 bg-[#0B192C] border border-slate-800 p-4 rounded-2xl h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Question Index</span>
              <span className="text-amber-400 font-mono">{filteredQuestions.length} Items</span>
            </h3>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {filteredQuestions.map((q, idx) => {
                const ans = attempt.answers[q.id];
                const isCorrect = ans?.isCorrect;
                const isAttempted = ans?.selectedOptionIndex !== null && ans?.selectedOptionIndex !== undefined;
                const isCurrent = idx === activeQuestionIndex;

                let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isAttempted && isCorrect) {
                  badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-700';
                } else if (isAttempted && !isCorrect) {
                  badgeColor = 'bg-red-950/80 text-red-400 border-red-700';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold border transition ${badgeColor} ${
                      isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
                    }`}
                  >
                    Q{q.questionNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Question View with Explanation */}
          <div className="lg:col-span-3 bg-[#0B192C] border border-slate-800 rounded-2xl p-6 sm:p-8">
            {currentQ && (
              <div>
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-5 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-amber-400 font-mono">
                      Question {currentQ.questionNumber}
                    </span>
                    <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-0.5 rounded font-medium border border-slate-700">
                      {currentQ.subject}
                    </span>
                    <span className="bg-slate-800/60 text-slate-300 text-xs px-2 py-0.5 rounded">
                      {currentQ.topic}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleBookmark(currentQ)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                        bookmarkedMap[currentQ.id]
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <BookmarkIcon className="w-3.5 h-3.5" />
                      <span>{bookmarkedMap[currentQ.id] ? 'Bookmarked' : 'Bookmark Question'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 mb-6 text-slate-100 text-base leading-relaxed font-medium">
                  <p className="whitespace-pre-line">{currentQ.questionText}</p>
                  {currentQ.sourceTag && (
                    <div className="mt-3 text-xs text-amber-400/90 font-mono">
                      Official Source: {currentQ.sourceTag}
                    </div>
                  )}
                </div>

                {/* Status Callout Banner */}
                <div className="mb-6">
                  {userAns?.selectedOptionIndex === null || userAns?.selectedOptionIndex === undefined ? (
                    <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center space-x-3 text-xs text-slate-300">
                      <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white">Question Skipped / Not Attempted</span>
                        <p className="text-slate-400 text-[11px]">0 marks awarded or deducted.</p>
                      </div>
                    </div>
                  ) : userAns.isCorrect ? (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-xl flex items-center space-x-3 text-xs text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-200">Your Answer was Correct!</span>
                        <p className="text-emerald-400/80 text-[11px]">+{currentQ.marks || 1.0} mark awarded.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl flex items-center space-x-3 text-xs text-red-300">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <span className="font-bold text-red-200">Your Answer was Incorrect!</span>
                        <p className="text-red-400/80 text-[11px]">
                          -{currentQ.negativeMarks || 0.33} negative mark penalty deducted.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4 Options with Verification Styling */}
                <div className="space-y-3 mb-8">
                  {currentQ.options.map((optText, optIdx) => {
                    const isCorrectAnswer = optIdx === currentQ.correctOptionIndex;
                    const isUserChoice = userAns?.selectedOptionIndex === optIdx;

                    let optBg = 'bg-slate-900/40 border-slate-800 text-slate-300';
                    let badgeBg = 'bg-slate-800 text-slate-400';

                    if (isCorrectAnswer) {
                      optBg = 'bg-emerald-950/60 border-emerald-600 text-emerald-100 font-semibold ring-1 ring-emerald-500';
                      badgeBg = 'bg-emerald-600 text-white font-black';
                    } else if (isUserChoice && !isCorrectAnswer) {
                      optBg = 'bg-red-950/60 border-red-600 text-red-200 ring-1 ring-red-500';
                      badgeBg = 'bg-red-600 text-white font-black';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition ${optBg}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${badgeBg}`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm">{optText}</span>
                        </div>

                        <div className="text-xs font-semibold flex items-center space-x-1.5 shrink-0 pl-2">
                          {isCorrectAnswer && (
                            <span className="text-emerald-400 flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Correct Answer</span>
                            </span>
                          )}
                          {isUserChoice && !isCorrectAnswer && (
                            <span className="text-red-400 flex items-center space-x-1">
                              <XCircle className="w-4 h-4" />
                              <span>Your Choice (Wrong)</span>
                            </span>
                          )}
                          {isUserChoice && isCorrectAnswer && (
                            <span className="text-emerald-300 text-[11px]">
                              (Your Choice)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Step-by-Step Explanation */}
                <div className="bg-[#1E3E62]/40 border border-slate-700/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-amber-400 mb-3">
                    <Lightbulb className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-wide">
                      Comprehensive Explanation & Concept Notes
                    </h4>
                  </div>
                  <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans pl-7">
                    {currentQ.explanation}
                  </div>
                </div>

                {/* Bottom Pagination */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
                  <button
                    onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={activeQuestionIndex === 0}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs disabled:opacity-40 flex items-center space-x-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Question</span>
                  </button>

                  <span className="text-xs text-slate-400 font-mono">
                    {activeQuestionIndex + 1} of {filteredQuestions.length}
                  </span>

                  <button
                    onClick={() => setActiveQuestionIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                    disabled={activeQuestionIndex === filteredQuestions.length - 1}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs disabled:opacity-40 flex items-center space-x-1 transition"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
