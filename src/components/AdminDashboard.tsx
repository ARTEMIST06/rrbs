import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Test, Question } from '../types';
import {
  saveTest,
  deleteTest,
  saveQuestion,
  deleteQuestion,
  getTestQuestions,
  seedDatabaseWithOfficialTests,
} from '../services/testService';
import {
  ShieldAlert,
  Plus,
  Upload,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  Archive,
  Download,
  Database,
  Layers,
  Sparkles,
  AlertTriangle,
  FolderPlus,
  Edit3,
} from 'lucide-react';

import { PDFQuestionImporter } from './PDFQuestionImporter';

interface AdminDashboardProps {
  tests: Test[];
  existingQuestions?: Question[];
  onRefreshTests: () => Promise<void>;
  onPreviewTest: (test: Test) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tests,
  existingQuestions = [],
  onRefreshTests,
  onPreviewTest,
}) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'tests' | 'create_test' | 'upload_questions' | 'manage_questions' | 'pdf_importer'>('tests');
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // New Test Form State
  const [newTest, setNewTest] = useState<Partial<Test>>({
    title: '',
    description: '',
    examType: 'RRB JE CBT-1',
    isPYQ: false,
    sourceYear: '2024 Practice Set',
    durationMinutes: 30,
    totalMarks: 20,
    positiveMarkPerQuestion: 1.0,
    negativeMarkPerQuestion: 0.33,
    status: 'draft',
    subjects: ['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', 'General Science'],
  });

  // Single Question Form State
  const [newQuestion, setNewQuestion] = useState({
    subject: 'Mathematics',
    topic: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    questionText: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctIndex: 0,
    explanation: '',
    isPYQ: false,
    sourceTag: '',
  });

  // JSON / CSV Upload state
  const [jsonInput, setJsonInput] = useState<string>('');
  const [csvInput, setCsvInput] = useState<string>('');

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-8">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white">Access Denied: Admin Authorization Required</h2>
          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
            This administration portal is strictly restricted to verified RRB JE test coordinators. Ordinary student accounts cannot access test generation or question keys.
          </p>
          <div className="mt-4 text-[11px] text-slate-400 font-mono">
            Signed in as: {user?.email || 'Anonymous'}
          </div>
        </div>
      </div>
    );
  }

  // Handle Seeding Official Tests
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setStatusMessage('Seeding official RRB JE CBT-1 tests & questions into Firestore...');
    try {
      const res = await seedDatabaseWithOfficialTests();
      await onRefreshTests();
      setStatusMessage(`Successfully seeded ${res.testsCount} tests and ${res.questionsCount} verified questions to Cloud Firestore!`);
    } catch (err) {
      console.error(err);
      setStatusMessage('Seeding failed. Please check Firestore permissions.');
    } finally {
      setIsSeeding(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Handle Creating New Test
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTest.title?.trim()) {
      alert('Please provide a test title.');
      return;
    }

    const testId = `test_${Date.now()}`;
    const testToSave: Test = {
      id: testId,
      title: newTest.title.trim(),
      description: newTest.description || '',
      examType: newTest.examType || 'RRB JE CBT-1',
      isPYQ: Boolean(newTest.isPYQ),
      sourceYear: newTest.sourceYear || '',
      durationMinutes: Number(newTest.durationMinutes) || 30,
      totalMarks: Number(newTest.totalMarks) || 20,
      positiveMarkPerQuestion: Number(newTest.positiveMarkPerQuestion) || 1.0,
      negativeMarkPerQuestion: Number(newTest.negativeMarkPerQuestion) || 0.33,
      status: newTest.status || 'draft',
      totalQuestions: 0,
      subjects: newTest.subjects || ['Mathematics', 'General Science'],
      createdBy: user?.uid || 'admin',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTest(testToSave);
      await onRefreshTests();
      setStatusMessage(`Test "${testToSave.title}" created successfully!`);
      setActiveTab('tests');
    } catch (err) {
      console.error(err);
      alert('Failed to save test.');
    }
  };

  // Toggle Test Status (Publish / Draft / Archive)
  const handleToggleStatus = async (test: Test, nextStatus: 'draft' | 'published' | 'archived') => {
    try {
      await saveTest({ ...test, status: nextStatus });
      await onRefreshTests();
      setStatusMessage(`Test status updated to: ${nextStatus.toUpperCase()}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Delete Test
  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this test and its questions?')) return;
    try {
      await deleteTest(testId);
      await onRefreshTests();
      setStatusMessage('Test deleted.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      alert('Failed to delete test.');
    }
  };

  // Load questions for management
  const handleOpenManageQuestions = async (test: Test) => {
    setSelectedTestForQuestions(test);
    setIsLoadingQuestions(true);
    setActiveTab('manage_questions');
    try {
      const qs = await getTestQuestions(test.id);
      setTestQuestions(qs);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Add Single Question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForQuestions) {
      alert('Please select a target test first.');
      return;
    }
    if (!newQuestion.questionText || !newQuestion.optA || !newQuestion.optB || !newQuestion.optC || !newQuestion.optD) {
      alert('Please fill out question text and all 4 options.');
      return;
    }

    const qId = `q_${Date.now()}`;
    const questionObj: Question = {
      id: qId,
      testId: selectedTestForQuestions.id,
      questionNumber: testQuestions.length + 1,
      subject: newQuestion.subject,
      topic: newQuestion.topic || 'General',
      difficulty: newQuestion.difficulty,
      questionText: newQuestion.questionText.trim(),
      options: [newQuestion.optA.trim(), newQuestion.optB.trim(), newQuestion.optC.trim(), newQuestion.optD.trim()],
      correctOptionIndex: Number(newQuestion.correctIndex),
      explanation: newQuestion.explanation.trim() || 'Official solution provided.',
      marks: selectedTestForQuestions.positiveMarkPerQuestion || 1.0,
      negativeMarks: selectedTestForQuestions.negativeMarkPerQuestion || 0.33,
      isPYQ: newQuestion.isPYQ,
      sourceTag: newQuestion.sourceTag || (newQuestion.isPYQ ? 'RRB JE PYQ' : 'Practice Mock'),
    };

    try {
      await saveQuestion(selectedTestForQuestions.id, questionObj);
      const updated = await getTestQuestions(selectedTestForQuestions.id);
      setTestQuestions(updated);
      await onRefreshTests();
      setNewQuestion({
        subject: newQuestion.subject,
        topic: '',
        difficulty: 'Medium',
        questionText: '',
        optA: '',
        optB: '',
        optC: '',
        optD: '',
        correctIndex: 0,
        explanation: '',
        isPYQ: false,
        sourceTag: '',
      });
      setStatusMessage('Question added successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Error adding question.');
    }
  };

  // Bulk Upload via JSON
  const handleBulkUploadJSON = async () => {
    if (!selectedTestForQuestions) {
      alert('Select a test first.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        alert('JSON must be an array of question objects.');
        return;
      }

      let count = 0;
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        const qObj: Question = {
          id: `q_bulk_${Date.now()}_${i}`,
          testId: selectedTestForQuestions.id,
          questionNumber: testQuestions.length + i + 1,
          subject: item.subject || 'General Science',
          topic: item.topic || 'General',
          difficulty: item.difficulty || 'Medium',
          questionText: item.questionText || item.question || '',
          options: item.options || [item.optionA, item.optionB, item.optionC, item.optionD],
          correctOptionIndex: Number(item.correctOptionIndex ?? item.correctIndex ?? 0),
          explanation: item.explanation || '',
          marks: selectedTestForQuestions.positiveMarkPerQuestion || 1.0,
          negativeMarks: selectedTestForQuestions.negativeMarkPerQuestion || 0.33,
          isPYQ: Boolean(item.isPYQ),
          sourceTag: item.sourceTag || 'Bulk Upload',
        };
        await saveQuestion(selectedTestForQuestions.id, qObj);
        count++;
      }

      const updated = await getTestQuestions(selectedTestForQuestions.id);
      setTestQuestions(updated);
      await onRefreshTests();
      setJsonInput('');
      setStatusMessage(`Successfully uploaded ${count} questions via JSON!`);
    } catch (err) {
      alert(`Invalid JSON format: ${(err as Error).message}`);
    }
  };

  // Bulk Upload via CSV
  const handleBulkUploadCSV = async () => {
    if (!selectedTestForQuestions) {
      alert('Select a test first.');
      return;
    }
    try {
      const lines = csvInput.trim().split('\n');
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least 1 data row.');
        return;
      }

      // Expected CSV format: subject,topic,difficulty,questionText,optA,optB,optC,optD,correctOptionIndex,explanation,isPYQ,sourceTag
      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split('\t').length >= 8 ? line.split('\t') : line.split(',');
        if (cols.length < 9) continue;

        const qObj: Question = {
          id: `q_csv_${Date.now()}_${i}`,
          testId: selectedTestForQuestions.id,
          questionNumber: testQuestions.length + count + 1,
          subject: cols[0]?.trim() || 'Mathematics',
          topic: cols[1]?.trim() || 'General',
          difficulty: (cols[2]?.trim() as any) || 'Medium',
          questionText: cols[3]?.trim() || '',
          options: [cols[4]?.trim() || '', cols[5]?.trim() || '', cols[6]?.trim() || '', cols[7]?.trim() || ''],
          correctOptionIndex: parseInt(cols[8]?.trim() || '0', 10),
          explanation: cols[9]?.trim() || 'Official solution.',
          marks: selectedTestForQuestions.positiveMarkPerQuestion || 1.0,
          negativeMarks: selectedTestForQuestions.negativeMarkPerQuestion || 0.33,
          isPYQ: cols[10]?.trim()?.toLowerCase() === 'true',
          sourceTag: cols[11]?.trim() || 'RRB JE CSV',
        };

        await saveQuestion(selectedTestForQuestions.id, qObj);
        count++;
      }

      const updated = await getTestQuestions(selectedTestForQuestions.id);
      setTestQuestions(updated);
      await onRefreshTests();
      setCsvInput('');
      setStatusMessage(`Successfully imported ${count} questions from CSV!`);
    } catch (err) {
      alert(`CSV Parse Error: ${(err as Error).message}`);
    }
  };

  // Download Sample JSON Template
  const downloadSampleJSON = () => {
    const sample = [
      {
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'Medium',
        questionText: 'If a + b = 10 and ab = 21, what is the value of a³ + b³?',
        options: ['370', '420', '480', '520'],
        correctOptionIndex: 0,
        explanation: 'Formula: a³ + b³ = (a + b)³ - 3ab(a + b) = 10³ - 3(21)(10) = 1000 - 630 = 370.',
        isPYQ: true,
        sourceTag: 'RRB JE 2019 Shift 2',
      },
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rrb_je_questions_sample.json';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Authorized Administrator Control Panel</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            RRB JE Exam Management & Test Creator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author mock tests, upload question banks, manage publishing status, and verify syllabus integrity.
          </p>
        </div>

        {/* Global Seeding & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{isSeeding ? 'Seeding Firestore...' : 'Seed Official Syllabus Tests'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf_importer')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Import Questions from PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('create_test')}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Test</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'tests' ? 'bg-[#1E3E62] text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Tests ({tests.length})
        </button>
        <button
          onClick={() => setActiveTab('pdf_importer')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'pdf_importer' ? 'bg-[#1E3E62] text-amber-400' : 'text-purple-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PDF-to-Question-Bank (AI OCR & Verification)</span>
        </button>
        <button
          onClick={() => setActiveTab('create_test')}
          className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeTab === 'create_test' ? 'bg-[#1E3E62] text-amber-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Test
        </button>
        {selectedTestForQuestions && (
          <>
            <button
              onClick={() => setActiveTab('manage_questions')}
              className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'manage_questions' ? 'bg-[#1E3E62] text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Questions for: {selectedTestForQuestions.title.substring(0, 20)}...
            </button>
            <button
              onClick={() => setActiveTab('upload_questions')}
              className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === 'upload_questions' ? 'bg-[#1E3E62] text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulk Upload (JSON/CSV)
            </button>
          </>
        )}
      </div>

      {/* TAB 1: ALL TESTS TABLE */}
      {activeTab === 'tests' && (
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">Tests Repository</h2>

          <div className="overflow-x-auto rounded-xl border border-slate-800 text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#1E3E62] text-slate-300 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-3">Exam Type</th>
                  <th className="py-3 px-3 text-center">Duration</th>
                  <th className="py-3 px-3 text-center">Questions</th>
                  <th className="py-3 px-3 text-center">Marks</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                {tests.map(test => (
                  <tr key={test.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      <div>
                        <div className="font-bold text-white">{test.title}</div>
                        <span className="text-[11px] text-slate-400">
                          {test.isPYQ ? `Verified PYQ: ${test.sourceYear}` : 'Model Mock Exam'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">{test.examType}</td>
                    <td className="py-3 px-3 text-center text-amber-400">{test.durationMinutes}m</td>
                    <td className="py-3 px-3 text-center text-slate-200">{test.totalQuestions || 0}</td>
                    <td className="py-3 px-3 text-center text-emerald-400">
                      +{test.positiveMarkPerQuestion} / -{test.negativeMarkPerQuestion}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          test.status === 'published'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : test.status === 'draft'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {test.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Status toggles */}
                        {test.status !== 'published' ? (
                          <button
                            onClick={() => handleToggleStatus(test, 'published')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold"
                            title="Publish for students"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(test, 'draft')}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-[11px] font-bold"
                            title="Unpublish (set to draft)"
                          >
                            Draft
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenManageQuestions(test)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700"
                          title="Manage Questions"
                        >
                          Questions ({test.totalQuestions})
                        </button>

                        <button
                          onClick={() => onPreviewTest(test)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Preview Test as Student"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-1 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE TEST */}
      {activeTab === 'create_test' && (
        <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-base font-bold text-white mb-4">Create CBT Mock Test</h2>
          <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Test Title *</label>
              <input
                type="text"
                required
                placeholder="e.g., RRB JE CBT-1 Full Mock Test 02"
                value={newTest.title}
                onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Details about syllabus coverage, shifts, difficulty..."
                value={newTest.description}
                onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Exam Type</label>
                <select
                  value={newTest.examType}
                  onChange={e => setNewTest({ ...newTest, examType: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="RRB JE CBT-1">RRB JE CBT-1</option>
                  <option value="RRB JE CBT-2">RRB JE CBT-2</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={newTest.durationMinutes}
                  onChange={e => setNewTest({ ...newTest, durationMinutes: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Positive Mark / Q</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTest.positiveMarkPerQuestion}
                  onChange={e => setNewTest({ ...newTest, positiveMarkPerQuestion: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Negative Mark Penalty / Q</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTest.negativeMarkPerQuestion}
                  onChange={e => setNewTest({ ...newTest, negativeMarkPerQuestion: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6 py-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTest.isPYQ}
                  onChange={e => setNewTest({ ...newTest, isPYQ: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="text-slate-300 font-medium">Is Verified Official PYQ?</span>
              </label>

              {newTest.isPYQ && (
                <input
                  type="text"
                  placeholder="e.g. 2019 Shift 1"
                  value={newTest.sourceYear}
                  onChange={e => setNewTest({ ...newTest, sourceYear: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Publish Status</label>
              <select
                value={newTest.status}
                onChange={e => setNewTest({ ...newTest, status: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="draft">Draft (Hidden from students)</option>
                <option value="published">Published (Visible immediately)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow transition"
            >
              Create Test & Proceed to Add Questions
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE QUESTIONS FOR A TEST */}
      {activeTab === 'manage_questions' && selectedTestForQuestions && (
        <div className="space-y-6">
          {/* Active Test Card */}
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-amber-400 font-bold font-mono uppercase tracking-wider">
                Currently Managing Test:
              </span>
              <h2 className="text-xl font-bold text-white">{selectedTestForQuestions.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {testQuestions.length} Questions linked • +{selectedTestForQuestions.positiveMarkPerQuestion} / -{selectedTestForQuestions.negativeMarkPerQuestion} marking scheme
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('upload_questions')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload JSON / CSV</span>
              </button>
              <button
                onClick={() => onPreviewTest(selectedTestForQuestions)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 border border-slate-700 transition"
              >
                <Eye className="w-4 h-4" />
                <span>Preview CBT</span>
              </button>
            </div>
          </div>

          {/* Add Single Question Form */}
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Single Question Manually</span>
            </h3>

            <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                  <select
                    value={newQuestion.subject}
                    onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="General Intelligence & Reasoning">General Intelligence & Reasoning</option>
                    <option value="General Science">General Science</option>
                    <option value="General Awareness">General Awareness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Simple & Compound Interest"
                    value={newQuestion.topic}
                    onChange={e => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the complete question problem statement here..."
                  value={newQuestion.questionText}
                  onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.optA}
                    onChange={e => setNewQuestion({ ...newQuestion, optA: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.optB}
                    onChange={e => setNewQuestion({ ...newQuestion, optB: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.optC}
                    onChange={e => setNewQuestion({ ...newQuestion, optC: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={newQuestion.optD}
                    onChange={e => setNewQuestion({ ...newQuestion, optD: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correct Answer</label>
                  <select
                    value={newQuestion.correctIndex}
                    onChange={e => setNewQuestion({ ...newQuestion, correctIndex: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Source Tag / Official Exam Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. RRB JE 27-05-2019 Shift 1"
                    value={newQuestion.sourceTag}
                    onChange={e => setNewQuestion({ ...newQuestion, sourceTag: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Step-by-step Solution & Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Provide calculations, formulas, or conceptual notes to show students upon submission..."
                  value={newQuestion.explanation}
                  onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                Save Question to Test
              </button>
            </form>
          </div>

          {/* List of existing questions */}
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">
              Questions in Test ({testQuestions.length})
            </h3>

            {isLoadingQuestions ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading questions...</div>
            ) : testQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No questions added to this test yet. Use the form above or bulk upload.
              </div>
            ) : (
              <div className="space-y-3">
                {testQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-amber-400">Q{idx + 1}</span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                          {q.subject}
                        </span>
                        <span className="text-slate-400 text-[11px]">{q.topic}</span>
                      </div>
                      <p className="text-slate-200 font-medium line-clamp-2">{q.questionText}</p>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        Correct: Option {String.fromCharCode(65 + q.correctOptionIndex)} ({q.options[q.correctOptionIndex]})
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (window.confirm('Delete this question?')) {
                          await deleteQuestion(selectedTestForQuestions.id, q.id);
                          const qs = await getTestQuestions(selectedTestForQuestions.id);
                          setTestQuestions(qs);
                          await onRefreshTests();
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BULK UPLOAD (JSON / CSV) */}
      {activeTab === 'upload_questions' && selectedTestForQuestions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* JSON Upload */}
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Bulk Upload via JSON</span>
                </h3>
                <button
                  onClick={downloadSampleJSON}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample JSON</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Paste an array of question JSON objects. Each item should have questionText, options (array of 4 strings), correctOptionIndex (0-3), subject, topic, and explanation.
              </p>

              <textarea
                rows={12}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder={`[\n  {\n    "subject": "General Science",\n    "topic": "Physics",\n    "questionText": "What is the unit of power?",\n    "options": ["Watt", "Joule", "Newton", "Pascal"],\n    "correctOptionIndex": 0,\n    "explanation": "Watt (W) is the SI unit of power."\n  }\n]`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleBulkUploadJSON}
              disabled={!jsonInput.trim()}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow disabled:opacity-40 transition"
            >
              Parse & Upload JSON Questions
            </button>
          </div>

          {/* CSV Upload */}
          <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Bulk Upload via CSV / TSV</span>
                </h3>
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Header columns: subject, topic, difficulty, questionText, optA, optB, optC, optD, correctIndex (0-3), explanation, isPYQ, sourceTag.
              </p>

              <textarea
                rows={12}
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                placeholder={`subject,topic,difficulty,questionText,optA,optB,optC,optD,correctOptionIndex,explanation,isPYQ,sourceTag\nMathematics,Algebra,Easy,What is 2+2?,3,4,5,6,1,Basic addition,false,Practice Set`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleBulkUploadCSV}
              disabled={!csvInput.trim()}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow disabled:opacity-40 transition"
            >
              Parse & Import CSV Questions
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: PDF-TO-QUESTION-BANK IMPORTER */}
      {activeTab === 'pdf_importer' && (
        <PDFQuestionImporter
          tests={tests}
          existingQuestions={existingQuestions}
          onQuestionsImported={async () => {
            await onRefreshTests();
            setActiveTab('tests');
          }}
        />
      )}
    </div>
  );
};
