import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DailyTestsList } from './components/DailyTestsList';
import { CBTTestRunner } from './components/CBTTestRunner';
import { ScorecardModal } from './components/ScorecardModal';
import { TestReview } from './components/TestReview';
import { TestHistory } from './components/TestHistory';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { RevisionBookmarks } from './components/RevisionBookmarks';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileModal } from './components/ProfileModal';
import { Test, Question, TestAttempt, Bookmark } from './types';
import {
  getPublishedTests,
  getAllTests,
  getTestQuestions,
  getUserAttempts,
  getUserBookmarks,
  removeBookmark,
  seedDatabaseWithOfficialTests,
} from './services/testService';
import { Loader2, Train, AlertCircle, RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();

  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeTestQuestions, setActiveTestQuestions] = useState<Question[]>([]);
  const [isLoadingTest, setIsLoadingTest] = useState<boolean>(false);

  // Scorecard & Review states
  const [scorecardAttempt, setScorecardAttempt] = useState<TestAttempt | null>(null);
  const [reviewingAttempt, setReviewingAttempt] = useState<TestAttempt | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);

  // Profile modal
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Data states
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Fetch all app data
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Fetch tests: admins get all tests including drafts; students get published
      const loadedTests = isAdmin ? await getAllTests() : await getPublishedTests();
      setTests(loadedTests);

      const userId = user?.uid || 'guest_user';
      const [loadedAttempts, loadedBookmarks] = await Promise.all([
        getUserAttempts(userId),
        getUserBookmarks(userId),
      ]);
      setAttempts(loadedAttempts);
      setBookmarks(loadedBookmarks);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadData();
    }
  }, [isAuthLoading, loadData]);

  // Launch a test in CBT simulation runner
  const handleSelectTest = async (test: Test) => {
    setIsLoadingTest(true);
    try {
      const questions = await getTestQuestions(test.id);
      if (questions.length === 0) {
        alert('This test currently does not have any questions. Please select another test.');
        return;
      }
      setActiveTest(test);
      setActiveTestQuestions(questions);
    } catch (err) {
      console.error('Error loading questions:', err);
      alert('Could not load test questions. Please check network.');
    } finally {
      setIsLoadingTest(false);
    }
  };

  // When test is submitted
  const handleFinishTest = async (attempt: TestAttempt) => {
    setActiveTest(null);
    setScorecardAttempt(attempt);
    // Reload attempts
    const userId = user?.uid || 'guest_user';
    const updatedAttempts = await getUserAttempts(userId);
    setAttempts(updatedAttempts);
  };

  // Open review from scorecard
  const handleReviewFromScorecard = () => {
    if (!scorecardAttempt) return;
    setReviewingAttempt(scorecardAttempt);
    setReviewQuestions(activeTestQuestions);
    setScorecardAttempt(null);
  };

  // Open review from history
  const handleReviewFromHistory = async (attempt: TestAttempt) => {
    setIsLoadingTest(true);
    try {
      const questions = await getTestQuestions(attempt.testId);
      setReviewingAttempt(attempt);
      setReviewQuestions(questions);
    } catch (err) {
      console.error('Failed to fetch review questions:', err);
    } finally {
      setIsLoadingTest(false);
    }
  };

  // Remove bookmark
  const handleRemoveBookmark = async (bookmarkId: string) => {
    const userId = user?.uid || 'guest_user';
    await removeBookmark(userId, bookmarkId);
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/40 animate-pulse">
            <Train className="w-8 h-8 text-slate-950" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-amber-400 font-mono">
            RAILWAY JE PREP • INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  // Active CBT Full-Screen runner
  if (activeTest && activeTestQuestions.length > 0) {
    return (
      <CBTTestRunner
        test={activeTest}
        questions={activeTestQuestions}
        onFinishTest={handleFinishTest}
        onExitTest={() => setActiveTest(null)}
      />
    );
  }

  // Active Question-by-Question Review screen
  if (reviewingAttempt) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={tab => {
            setReviewingAttempt(null);
            setCurrentTab(tab);
          }}
          openProfileModal={() => setIsProfileOpen(true)}
        />
        <main className="flex-1">
          <TestReview
            attempt={reviewingAttempt}
            questions={reviewQuestions}
            onBackToHistory={() => setReviewingAttempt(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openProfileModal={() => setIsProfileOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {isLoadingTest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center text-amber-400">
            <div className="bg-[#0B192C] p-6 rounded-2xl border border-slate-700 flex items-center space-x-3 shadow-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-sm font-bold text-white">Loading CBT Mock Test...</span>
            </div>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            tests={tests}
            attempts={attempts}
            bookmarksCount={bookmarks.length}
            onSelectTest={handleSelectTest}
            onViewAttempt={handleReviewFromHistory}
            onNavigateTab={setCurrentTab}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}

        {currentTab === 'tests' && (
          <DailyTestsList
            tests={tests}
            attempts={attempts}
            onSelectTest={handleSelectTest}
          />
        )}

        {currentTab === 'history' && (
          <TestHistory
            attempts={attempts}
            tests={tests}
            onReviewAttempt={handleReviewFromHistory}
            onRetakeTest={handleSelectTest}
            onGoToTests={() => setCurrentTab('tests')}
          />
        )}

        {currentTab === 'analytics' && (
          <PerformanceAnalysis
            attempts={attempts}
            tests={tests}
            onGoToTests={() => setCurrentTab('tests')}
            onGoToRevision={() => setCurrentTab('revision')}
          />
        )}

        {currentTab === 'revision' && (
          <RevisionBookmarks
            bookmarks={bookmarks}
            onRemoveBookmark={handleRemoveBookmark}
            onGoToTests={() => setCurrentTab('tests')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            tests={tests}
            onRefreshTests={loadData}
            onPreviewTest={handleSelectTest}
          />
        )}
      </main>

      {/* Post-Test Scorecard Modal */}
      {scorecardAttempt && (
        <ScorecardModal
          attempt={scorecardAttempt}
          onReviewAnswers={handleReviewFromScorecard}
          onRetakeTest={() => {
            const t = tests.find(x => x.id === scorecardAttempt.testId);
            setScorecardAttempt(null);
            if (t) handleSelectTest(t);
          }}
          onGoToDashboard={() => {
            setScorecardAttempt(null);
            setCurrentTab('dashboard');
          }}
        />
      )}

      {/* Candidate Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-[#0B192C] border-t border-slate-800/80 py-8 text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Train className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">Railway JE Prep Portal</span>
            <span>—</span>
            <span>RRB Junior Engineer Computer-Based Test (CBT) Preparation System</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500">
            <span>Syllabus Aligned with Official Railway Recruitment Board Notification CEN 03/2018 & Recent Patterns.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
