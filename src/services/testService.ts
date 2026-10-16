import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Bookmark, Question, SubjectScoreBreakdown, Test, TestAttempt } from '../types';
import { SEED_TESTS } from '../data/seedData';

// Fetch published tests for students
export async function getPublishedTests(): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const q = query(testsRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return seed tests if database hasn't been seeded yet
      return SEED_TESTS.map(({ questions: _, ...testData }) => testData);
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
  } catch (error) {
    console.warn('Using seed tests fallback due to:', error);
    return SEED_TESTS.map(({ questions: _, ...testData }) => testData);
  }
}

// Fetch all tests for admin
export async function getAllTests(): Promise<Test[]> {
  try {
    const testsRef = collection(db, 'tests');
    const snapshot = await getDocs(testsRef);

    if (snapshot.empty) {
      return SEED_TESTS.map(({ questions: _, ...testData }) => testData);
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
  } catch (error) {
    console.warn('Fallback to seed tests for admin:', error);
    return SEED_TESTS.map(({ questions: _, ...testData }) => testData);
  }
}

// Fetch questions for a test
export async function getTestQuestions(testId: string): Promise<Question[]> {
  try {
    const questionsRef = collection(db, 'tests', testId, 'questions');
    const snapshot = await getDocs(questionsRef);

    if (snapshot.empty) {
      const matched = SEED_TESTS.find(t => t.id === testId);
      if (matched) return matched.questions;
      return [];
    }

    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
  } catch (error) {
    console.warn('Falling back to seed questions:', error);
    const matched = SEED_TESTS.find(t => t.id === testId);
    return matched ? matched.questions : [];
  }
}

// Save or update a test (Admin)
export async function saveTest(test: Test): Promise<void> {
  try {
    const testDocRef = doc(db, 'tests', test.id);
    await setDoc(testDocRef, {
      ...test,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tests/${test.id}`);
  }
}

// Save or update question (Admin)
export async function saveQuestion(testId: string, question: Question): Promise<void> {
  try {
    const qDocRef = doc(db, 'tests', testId, 'questions', question.id);
    await setDoc(qDocRef, question, { merge: true });

    // Update total questions on test
    const testDocRef = doc(db, 'tests', testId);
    const testSnap = await getDoc(testDocRef);
    if (testSnap.exists()) {
      const questionsSnap = await getDocs(collection(db, 'tests', testId, 'questions'));
      await setDoc(testDocRef, {
        totalQuestions: questionsSnap.size,
        totalMarks: questionsSnap.size * (testSnap.data().positiveMarkPerQuestion || 1.0),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `tests/${testId}/questions/${question.id}`);
  }
}

// Delete question (Admin)
export async function deleteQuestion(testId: string, questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tests', testId, 'questions', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tests/${testId}/questions/${questionId}`);
  }
}

// Delete test (Admin)
export async function deleteTest(testId: string): Promise<void> {
  try {
    // delete questions first
    const questionsSnap = await getDocs(collection(db, 'tests', testId, 'questions'));
    const batch = writeBatch(db);
    questionsSnap.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'tests', testId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tests/${testId}`);
  }
}

// Calculate score and submit attempt
export async function submitTestAttempt(params: {
  userId: string;
  userEmail?: string;
  test: Test;
  questions: Question[];
  answers: Record<number, {
    selectedOptionIndex: number | null;
    isMarkedForReview: boolean;
    timeSpentSec: number;
  }>;
  timeSpentSeconds: number;
}): Promise<TestAttempt> {
  const { userId, userEmail, test, questions, answers, timeSpentSeconds } = params;

  let attemptedCount = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const subjectScores: Record<string, SubjectScoreBreakdown> = {};

  // Initialize subject groups
  questions.forEach(q => {
    const s = q.subject || 'General';
    if (!subjectScores[s]) {
      subjectScores[s] = {
        subject: s,
        total: 0,
        attempted: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        marksObtained: 0,
        maxMarks: 0,
        accuracy: 0,
      };
    }
    subjectScores[s].total += 1;
    subjectScores[s].maxMarks += (q.marks || test.positiveMarkPerQuestion);
  });

  const detailedAnswers: Record<string, {
    selectedOptionIndex: number | null;
    isMarkedForReview: boolean;
    isCorrect: boolean;
    timeSpentSec: number;
  }> = {};

  questions.forEach((q, index) => {
    const userAns = answers[index];
    const selected = userAns?.selectedOptionIndex ?? null;
    const isMarked = userAns?.isMarkedForReview ?? false;
    const timeSpent = userAns?.timeSpentSec ?? 0;
    const subject = q.subject || 'General';

    if (selected === null || selected === undefined) {
      unansweredCount++;
      subjectScores[subject].unanswered++;
      detailedAnswers[q.id] = {
        selectedOptionIndex: null,
        isMarkedForReview: isMarked,
        isCorrect: false,
        timeSpentSec: timeSpent,
      };
    } else {
      attemptedCount++;
      subjectScores[subject].attempted++;
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) {
        correctCount++;
        subjectScores[subject].correct++;
        subjectScores[subject].marksObtained += (q.marks || test.positiveMarkPerQuestion);
      } else {
        incorrectCount++;
        subjectScores[subject].incorrect++;
        subjectScores[subject].marksObtained -= (q.negativeMarks || test.negativeMarkPerQuestion);
      }

      detailedAnswers[q.id] = {
        selectedOptionIndex: selected,
        isMarkedForReview: isMarked,
        isCorrect,
        timeSpentSec: timeSpent,
      };
    }
  });

  // Calculate subject accuracies and format marks
  Object.values(subjectScores).forEach(sub => {
    sub.marksObtained = Number(Math.max(0, sub.marksObtained).toFixed(2));
    sub.accuracy = sub.attempted > 0 ? Number(((sub.correct / sub.attempted) * 100).toFixed(1)) : 0;
  });

  const posScore = correctCount * test.positiveMarkPerQuestion;
  const negPenalty = incorrectCount * test.negativeMarkPerQuestion;
  const netScore = Number(Math.max(0, posScore - negPenalty).toFixed(2));
  const accuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(1)) : 0;

  const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const attempt: TestAttempt = {
    id: attemptId,
    userId,
    userEmail,
    testId: test.id,
    testTitle: test.title,
    examType: test.examType,
    status: 'submitted',
    timeSpentSeconds,
    totalQuestions: questions.length,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    score: netScore,
    maxMarks: test.totalMarks || (questions.length * test.positiveMarkPerQuestion),
    accuracy,
    subjectBreakdown: subjectScores,
    answers: detailedAnswers,
    startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
    submittedAt: now,
    createdAt: now,
  };

  try {
    const attemptDocRef = doc(db, 'testAttempts', attemptId);
    await setDoc(attemptDocRef, attempt);
  } catch (error) {
    console.error('Error saving attempt to Firestore, saving in local cache:', error);
    // Persist in localStorage as fallback
    const localAttempts = JSON.parse(localStorage.getItem(`attempts_${userId}`) || '[]');
    localAttempts.unshift(attempt);
    localStorage.setItem(`attempts_${userId}`, JSON.stringify(localAttempts));
  }

  return attempt;
}

// Fetch user attempts
export async function getUserAttempts(userId: string): Promise<TestAttempt[]> {
  try {
    const attemptsRef = collection(db, 'testAttempts');
    const q = query(attemptsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const firestoreAttempts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestAttempt));
    
    // Merge with any local storage fallback
    const localAttempts: TestAttempt[] = JSON.parse(localStorage.getItem(`attempts_${userId}`) || '[]');
    const map = new Map<string, TestAttempt>();
    firestoreAttempts.forEach(a => map.set(a.id, a));
    localAttempts.forEach(a => {
      if (!map.has(a.id)) map.set(a.id, a);
    });

    const all = Array.from(map.values());
    return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.warn('Failed to fetch attempts from Firestore, using local cache:', error);
    const localAttempts: TestAttempt[] = JSON.parse(localStorage.getItem(`attempts_${userId}`) || '[]');
    return localAttempts;
  }
}

// Bookmarks management
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
  try {
    const bookmarksRef = collection(db, 'bookmarks');
    const q = query(bookmarksRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const firestoreBookmarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
    const localBookmarks: Bookmark[] = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
    
    const map = new Map<string, Bookmark>();
    firestoreBookmarks.forEach(b => map.set(b.id, b));
    localBookmarks.forEach(b => {
      if (!map.has(b.id)) map.set(b.id, b);
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('Bookmark fetch fallback:', error);
    return JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
  }
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  try {
    const docRef = doc(db, 'bookmarks', bookmark.id);
    await setDoc(docRef, bookmark);
  } catch (error) {
    console.warn('Bookmark write error, storing locally:', error);
  }
  const local: Bookmark[] = JSON.parse(localStorage.getItem(`bookmarks_${bookmark.userId}`) || '[]');
  if (!local.some(b => b.id === bookmark.id)) {
    local.unshift(bookmark);
    localStorage.setItem(`bookmarks_${bookmark.userId}`, JSON.stringify(local));
  }
}

export async function removeBookmark(userId: string, bookmarkId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'bookmarks', bookmarkId));
  } catch (error) {
    console.warn('Error deleting bookmark from Firestore:', error);
  }
  const local: Bookmark[] = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
  const updated = local.filter(b => b.id !== bookmarkId);
  localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updated));
}

// Seed Initial Data to Firestore
export async function seedDatabaseWithOfficialTests(): Promise<{ testsCount: number; questionsCount: number }> {
  let questionsTotal = 0;
  for (const item of SEED_TESTS) {
    const { questions, ...testInfo } = item;
    const testDocRef = doc(db, 'tests', testInfo.id);
    await setDoc(testDocRef, testInfo, { merge: true });

    for (const q of questions) {
      const qDocRef = doc(db, 'tests', testInfo.id, 'questions', q.id);
      await setDoc(qDocRef, q, { merge: true });
      questionsTotal++;
    }
  }
  return { testsCount: SEED_TESTS.length, questionsCount: questionsTotal };
}
