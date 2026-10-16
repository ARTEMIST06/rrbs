import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Test, Question, QuestionState, TestAttempt } from '../types';
import { submitTestAttempt, addBookmark } from '../services/testService';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  XCircle,
  ShieldAlert,
  Send,
  Eye,
  Award,
} from 'lucide-react';

interface CBTTestRunnerProps {
  test: Test;
  questions: Question[];
  onFinishTest: (attempt: TestAttempt) => void;
  onExitTest: () => void;
}

export const CBTTestRunner: React.FC<CBTTestRunnerProps> = ({
  test,
  questions,
  onFinishTest,
  onExitTest,
}) => {
  const { user } = useAuth();

  // Test state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(test.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  // Question answers & state dictionary (keyed by question index 0..N-1)
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>(() => {
    const initial: Record<number, QuestionState> = {};
    questions.forEach((_, idx) => {
      initial[idx] = {
        selectedOptionIndex: null,
        isMarkedForReview: false,
        isVisited: idx === 0, // First question is visited immediately
        timeSpentSec: 0,
      };
    });
    return initial;
  });

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Active question
  const currentQuestion = questions[currentIndex];

  // Subjects in test
  const subjectList = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.subject) set.add(q.subject);
    });
    return ['All', ...Array.from(set)];
  }, [questions]);

  // Track time spent on current question before switching
  const recordQuestionTime = () => {
    const elapsed = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    setQuestionStates(prev => {
      const existing = prev[currentIndex] || {
        selectedOptionIndex: null,
        isMarkedForReview: false,
        isVisited: true,
        timeSpentSec: 0,
      };
      return {
        ...prev,
        [currentIndex]: {
          ...existing,
          timeSpentSec: existing.timeSpentSec + elapsed,
        },
      };
    });
    questionStartTimeRef.current = Date.now();
  };

  // Switch question
  const handleJumpToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    recordQuestionTime();
    setQuestionStates(prev => ({
      ...prev,
      [targetIndex]: {
        ...(prev[targetIndex] || {
          selectedOptionIndex: null,
          isMarkedForReview: false,
          isVisited: true,
          timeSpentSec: 0,
        }),
        isVisited: true,
      },
    }));
    setCurrentIndex(targetIndex);
  };

  // Option selection
  const handleSelectOption = (optionIndex: number) => {
    setQuestionStates(prev => {
      const curr = prev[currentIndex] || {
        selectedOptionIndex: null,
        isMarkedForReview: false,
        isVisited: true,
        timeSpentSec: 0,
      };
      return {
        ...prev,
        [currentIndex]: {
          ...curr,
          selectedOptionIndex: optionIndex,
          isVisited: true,
        },
      };
    });
  };

  // Clear current response
  const handleClearResponse = () => {
    setQuestionStates(prev => {
      const curr = prev[currentIndex];
      return {
        ...prev,
        [currentIndex]: {
          ...curr,
          selectedOptionIndex: null,
        },
      };
    });
  };

  // Toggle Mark for Review
  const handleToggleMarkForReview = () => {
    setQuestionStates(prev => {
      const curr = prev[currentIndex];
      return {
        ...prev,
        [currentIndex]: {
          ...curr,
          isMarkedForReview: !curr.isMarkedForReview,
        },
      };
    });
    // Move to next question automatically
    if (currentIndex < questions.length - 1) {
      handleJumpToQuestion(currentIndex + 1);
    }
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleJumpToQuestion(currentIndex + 1);
    }
  };

  // Quick Bookmark toggle
  const handleToggleBookmark = async () => {
    if (!currentQuestion) return;
    const isCurrentlyBookmarked = bookmarkedMap[currentQuestion.id];
    setBookmarkedMap(prev => ({
      ...prev,
      [currentQuestion.id]: !isCurrentlyBookmarked,
    }));

    if (!isCurrentlyBookmarked && user) {
      await addBookmark({
        id: `bm_${currentQuestion.id}_${user.uid}`,
        userId: user.uid,
        testId: test.id,
        questionId: currentQuestion.id,
        subject: currentQuestion.subject,
        topic: currentQuestion.topic,
        difficulty: currentQuestion.difficulty,
        questionText: currentQuestion.questionText,
        options: currentQuestion.options,
        correctOptionIndex: currentQuestion.correctOptionIndex,
        explanation: currentQuestion.explanation,
        isPYQ: currentQuestion.isPYQ,
        sourceTag: currentQuestion.sourceTag,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Countdown Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Format Timer HH:MM:SS
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Palette Status Classification (Official TCS iON RRB Pattern)
  const getQuestionPaletteStatus = (idx: number) => {
    const state = questionStates[idx];
    if (!state || !state.isVisited) return 'not_visited';
    if (state.selectedOptionIndex !== null && state.isMarkedForReview) return 'answered_and_marked';
    if (state.isMarkedForReview) return 'marked';
    if (state.selectedOptionIndex !== null) return 'answered';
    return 'not_answered';
  };

  // Palette counts summary
  const summaryCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    let answeredAndMarked = 0;

    questions.forEach((_, idx) => {
      const status = getQuestionPaletteStatus(idx);
      if (status === 'answered') answered++;
      else if (status === 'not_answered') notAnswered++;
      else if (status === 'not_visited') notVisited++;
      else if (status === 'marked') marked++;
      else if (status === 'answered_and_marked') answeredAndMarked++;
    });

    return {
      answered,
      notAnswered,
      notVisited,
      marked,
      answeredAndMarked,
      total: questions.length,
    };
  }, [questionStates, questions]);

  // Final Submit
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    recordQuestionTime();

    try {
      const totalTimeSpent = (test.durationMinutes * 60) - timeLeftSeconds;
      const attempt = await submitTestAttempt({
        userId: user?.uid || 'guest_user',
        userEmail: user?.email || undefined,
        test,
        questions,
        answers: questionStates,
        timeSpentSeconds: Math.max(1, totalTimeSpent),
      });

      onFinishTest(attempt);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit test properly. Please try again or check network.');
      setIsSubmitting(false);
    }
  };

  const isLowTime = timeLeftSeconds <= 300; // Under 5 minutes

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* RRB CBT Header Strip */}
      <div className="bg-[#0B192C] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-400 text-xs">
            CBT
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-md">
              {test.title}
            </h1>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">+{test.positiveMarkPerQuestion} mark</span>
              <span>•</span>
              <span className="text-red-400 font-medium">-{test.negativeMarkPerQuestion} negative mark</span>
              {test.isPYQ && (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold bg-amber-950/60 px-1 rounded border border-amber-800 text-[10px]">
                    Verified PYQ
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Timer Clock */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-base transition ${
              isLowTime
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time Left: {formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-1.5 rounded-md font-bold text-sm shadow transition"
          >
            <Send className="w-4 h-4" />
            <span>Submit Test</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Tab Strip */}
      <div className="bg-[#1E3E62] px-4 py-1.5 flex items-center space-x-2 border-b border-slate-700/80 shrink-0 overflow-x-auto text-xs no-scrollbar">
        <span className="text-slate-300 font-semibold uppercase text-[11px] tracking-wider pr-2">
          Section:
        </span>
        {subjectList.map(subj => {
          const count =
            subj === 'All'
              ? questions.length
              : questions.filter(q => q.subject === subj).length;
          return (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1 rounded font-medium whitespace-nowrap transition ${
                selectedSubject === subj
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {subj} ({count})
            </button>
          );
        })}
      </div>

      {/* Main CBT Workspace: Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left/Center: Question Paper Section */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto border-r border-slate-800">
          {currentQuestion ? (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between">
              <div>
                {/* Question Info Header */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-black text-amber-400 font-mono">
                      Question No. {currentIndex + 1}
                    </span>
                    <span className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700">
                      {currentQuestion.subject}
                    </span>
                    <span className="bg-slate-800/70 text-slate-300 text-xs px-2 py-0.5 rounded">
                      Topic: {currentQuestion.topic}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        currentQuestion.difficulty === 'Easy'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : currentQuestion.difficulty === 'Medium'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">
                      Marks: <span className="text-emerald-400 font-bold">+{currentQuestion.marks}</span> /{' '}
                      <span className="text-red-400 font-bold">-{currentQuestion.negativeMarks}</span>
                    </span>

                    <button
                      onClick={handleToggleBookmark}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition border ${
                        bookmarkedMap[currentQuestion.id]
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Bookmark this question for revision later"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{bookmarkedMap[currentQuestion.id] ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-slate-100 text-base sm:text-lg leading-relaxed font-medium mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <p className="whitespace-pre-line">{currentQuestion.questionText}</p>

                  {currentQuestion.sourceTag && (
                    <div className="mt-3 text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                      <span className="text-amber-500">Source:</span>
                      <span>{currentQuestion.sourceTag}</span>
                    </div>
                  )}
                </div>

                {/* 4 Radio Options */}
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((optionText, optIdx) => {
                    const isSelected =
                      questionStates[currentIndex]?.selectedOptionIndex === optIdx;
                    const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`flex items-center p-3.5 rounded-xl border cursor-pointer select-none transition ${
                          isSelected
                            ? 'bg-blue-900/30 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-3 transition ${
                            isSelected
                              ? 'bg-blue-600 text-white font-black'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <span className="text-sm sm:text-base text-slate-200 font-medium">
                          {optionText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleMarkForReview}
                    className="px-3.5 py-2 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700 font-medium text-xs sm:text-sm flex items-center space-x-1.5 transition"
                  >
                    <span>Mark for Review & Next</span>
                  </button>

                  <button
                    onClick={handleClearResponse}
                    disabled={questionStates[currentIndex]?.selectedOptionIndex === null}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm disabled:opacity-40 transition"
                  >
                    Clear Response
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleJumpToQuestion(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm disabled:opacity-40 flex items-center space-x-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleSaveAndNext}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-1 shadow transition"
                  >
                    <span>{currentIndex === questions.length - 1 ? 'Save & Review' : 'Save & Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">No question selected.</div>
          )}
        </div>

        {/* Right Sidebar: Candidate Info & Question Palette */}
        <div className="w-full lg:w-80 bg-[#0B192C] flex flex-col border-t lg:border-t-0 shrink-0">
          {/* Candidate Profile Bar */}
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-400 flex items-center justify-center font-bold text-amber-400 text-sm">
              {(user?.displayName || 'Candidate')[0].toUpperCase()}
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-100 truncate max-w-[180px]">
                {user?.displayName || 'Candidate'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Reg: RRB-JE-2024-{user?.uid ? user.uid.substring(0, 6) : '8921'}
              </p>
            </div>
          </div>

          {/* Palette Legend */}
          <div className="p-3 bg-slate-900/40 border-b border-slate-800 text-[11px] space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {summaryCounts.answered}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {summaryCounts.notAnswered}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                  {summaryCounts.notVisited}
                </span>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded bg-purple-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {summaryCounts.marked}
                </span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <span className="w-4 h-4 rounded-full bg-purple-600 border-2 border-emerald-400 text-[9px] flex items-center justify-center">
                  ✓
                </span>
                <span>Answered & Marked for Review</span>
              </div>
            </div>
          </div>

          {/* Question Number Palette Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Question Palette:
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">
                Total: {questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                // Filter if subject chosen
                const isFiltered =
                  selectedSubject !== 'All' && q.subject !== selectedSubject;
                const status = getQuestionPaletteStatus(idx);
                const isCurrent = idx === currentIndex;

                let btnBg = 'bg-slate-800 text-slate-300 hover:bg-slate-700';
                if (status === 'answered') {
                  btnBg = 'bg-emerald-600 text-white font-bold hover:bg-emerald-500';
                } else if (status === 'not_answered') {
                  btnBg = 'bg-red-600 text-white font-bold hover:bg-red-500';
                } else if (status === 'marked') {
                  btnBg = 'bg-purple-700 text-white font-bold hover:bg-purple-600';
                } else if (status === 'answered_and_marked') {
                  btnBg = 'bg-purple-700 text-white font-bold border-2 border-emerald-400';
                } else if (status === 'not_visited') {
                  btnBg = 'bg-slate-800 text-slate-400 hover:bg-slate-700';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-9 rounded-md font-mono text-xs flex items-center justify-center transition relative ${btnBg} ${
                      isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
                    } ${isFiltered ? 'opacity-30' : 'opacity-100'}`}
                    title={`Question ${idx + 1} (${q.subject}): ${status}`}
                  >
                    {idx + 1}
                    {status === 'answered_and_marked' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Submit Button on mobile/sidebar */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
            <button
              onClick={onExitTest}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Exit
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow transition"
            >
              <Send className="w-4 h-4" />
              <span>Submit Exam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Final Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-400 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <div>
                <h3 className="text-lg font-bold text-white">Confirm CBT Exam Submission</h3>
                <p className="text-xs text-slate-400">RRB Junior Engineer Computer Based Test</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Please review your attempt summary below. Once submitted, you cannot change your answers.
            </p>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-800/60">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-white">{summaryCounts.total}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-emerald-950/60 border border-emerald-900">
                <span className="text-emerald-300">Answered:</span>
                <span className="font-bold text-emerald-400">{summaryCounts.answered + summaryCounts.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-red-950/60 border border-red-900">
                <span className="text-red-300">Not Answered:</span>
                <span className="font-bold text-red-400">{summaryCounts.notAnswered}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-purple-950/60 border border-purple-900">
                <span className="text-purple-300">Marked for Review:</span>
                <span className="font-bold text-purple-400">{summaryCounts.marked + summaryCounts.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-800/60 col-span-2">
                <span className="text-slate-400">Not Visited:</span>
                <span className="font-bold text-slate-300">{summaryCounts.notVisited}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-300 mb-6 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Standard RRB JE CBT-1 negative marking (1/3 mark deducted for each incorrect answer) will be applied.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Return to Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold shadow-lg transition flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Evaluating Score...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Final Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
