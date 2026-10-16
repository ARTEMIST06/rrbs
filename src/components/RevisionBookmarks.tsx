import React, { useState } from 'react';
import { Bookmark } from '../types';
import {
  BookmarkCheck,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  FileQuestion,
  Lightbulb,
} from 'lucide-react';

interface RevisionBookmarksProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (bookmarkId: string) => void;
  onGoToTests: () => void;
}

export const RevisionBookmarks: React.FC<RevisionBookmarksProps> = ({
  bookmarks,
  onRemoveBookmark,
  onGoToTests,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  const subjects = ['All', ...Array.from(new Set(bookmarks.map(b => b.subject).filter(Boolean)))];

  const filteredBookmarks = bookmarks.filter(b => {
    if (selectedSubject !== 'All' && b.subject !== selectedSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.questionText.toLowerCase().includes(q) ||
        b.topic.toLowerCase().includes(q) ||
        (b.sourceTag && b.sourceTag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleSolution = (id: string) => {
    setRevealedSolutions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <BookmarkCheck className="w-6 h-6 text-amber-400" />
            <span>Revision Vault & Bookmarks</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisit tricky questions, solve them again, and review step-by-step explanations.
          </p>
        </div>

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bookmarked questions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500 w-full sm:w-60"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto no-scrollbar">
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
                  selectedSubject === s
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-16 bg-[#0B192C] border border-slate-800 rounded-2xl p-8">
          <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Your Revision Vault is Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            While taking CBT mock tests or reviewing questions, tap "Bookmark Question" to store high-yield problems here for quick revision.
          </p>
          <button
            onClick={onGoToTests}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow transition"
          >
            Go to Mock Tests
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map((bm, idx) => {
            const isRevealed = revealedSolutions[bm.id];

            return (
              <div
                key={bm.id}
                className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 shadow-md transition"
              >
                {/* Question Info Bar */}
                <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-slate-800 font-mono font-bold text-amber-400 text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-0.5 rounded font-medium border border-slate-700">
                      {bm.subject}
                    </span>
                    <span className="bg-slate-800/70 text-slate-300 text-xs px-2 py-0.5 rounded">
                      {bm.topic}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSolution(bm.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isRevealed
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Solution' : 'Reveal Answer & Notes'}</span>
                    </button>

                    <button
                      onClick={() => onRemoveBookmark(bm.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-slate-100 text-base leading-relaxed font-medium mb-4 whitespace-pre-line">
                  {bm.questionText}
                  {bm.sourceTag && (
                    <div className="mt-2 text-xs text-amber-400 font-mono">
                      Source: {bm.sourceTag}
                    </div>
                  )}
                </div>

                {/* 4 Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {bm.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === bm.correctOptionIndex;

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between transition ${
                          isRevealed && isCorrect
                            ? 'bg-emerald-950/70 border-emerald-600 text-emerald-100 font-semibold ring-1 ring-emerald-500'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                              isRevealed && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Revealed Explanation */}
                {isRevealed && (
                  <div className="bg-[#1E3E62]/40 border border-slate-700/80 rounded-xl p-4 mt-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 text-amber-400 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">
                        Detailed Explanation:
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans pl-6">
                      {bm.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
