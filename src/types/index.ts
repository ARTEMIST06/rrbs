export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  targetBranch?: string; // Mechanical, Electrical, Civil, Electronics, CS & IT
  targetZone?: string;   // RRB Allahabad, Chandigarh, Mumbai, Kolkata, Chennai, etc.
  createdAt?: string;
  updatedAt?: string;
}

export type SubjectName =
  | 'Mathematics'
  | 'General Intelligence & Reasoning'
  | 'General Awareness'
  | 'General Science'
  | 'Technical Abilities';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  testId: string;
  questionNumber: number;
  subject: SubjectName | string;
  topic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: [string, string, string, string] | string[];
  correctOptionIndex: number; // 0, 1, 2, or 3
  explanation: string;
  marks: number;
  negativeMarks: number;
  isPYQ?: boolean;
  sourceTag?: string; // e.g. "RRB JE 27-05-2019 Shift 1" or "Practice Set"
}

export type TestStatus = 'draft' | 'published' | 'archived';

export interface Test {
  id: string;
  title: string;
  description: string;
  examType: 'RRB JE CBT-1' | 'RRB JE CBT-2';
  isPYQ: boolean;
  sourceYear?: string;
  durationMinutes: number;
  totalMarks: number;
  positiveMarkPerQuestion: number;
  negativeMarkPerQuestion: number;
  status: TestStatus;
  isDemo?: boolean;
  totalQuestions: number;
  subjects: string[];
  cutoffEstimates?: {
    UR: number;
    OBC: number;
    SC: number;
    ST: number;
    disclaimer: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface QuestionState {
  selectedOptionIndex: number | null;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSec: number;
}

export interface SubjectScoreBreakdown {
  subject: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  marksObtained: number;
  maxMarks: number;
  accuracy: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  userEmail?: string;
  testId: string;
  testTitle: string;
  examType: string;
  status: 'in_progress' | 'submitted';
  timeSpentSeconds: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  maxMarks: number;
  accuracy: number;
  subjectBreakdown: Record<string, SubjectScoreBreakdown>;
  answers: Record<string, {
    selectedOptionIndex: number | null;
    isMarkedForReview: boolean;
    isCorrect: boolean;
    timeSpentSec: number;
  }>;
  startedAt: string;
  submittedAt: string;
  createdAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  testId: string;
  questionId: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  notes?: string;
  isPYQ?: boolean;
  sourceTag?: string;
  createdAt: string;
}
