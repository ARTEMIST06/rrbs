import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, Briefcase, X, Check, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RRB_ZONES = [
  'RRB Prayagraj (Allahabad)',
  'RRB Chandigarh',
  'RRB Mumbai',
  'RRB Kolkata',
  'RRB Chennai',
  'RRB Secunderabad',
  'RRB Ajmer',
  'RRB Bangalore',
  'RRB Bhopal',
  'RRB Bhubaneswar',
  'RRB Bilaspur',
  'RRB Gorakhpur',
  'RRB Guwahati',
  'RRB Jammu-Srinagar',
  'RRB Malda',
  'RRB Muzaffarpur',
  'RRB Patna',
  'RRB Ranchi',
  'RRB Siliguri',
  'RRB Thiruvananthapuram',
];

const ENGINEERING_BRANCHES = [
  'Mechanical & Allied Engineering',
  'Electrical & Allied Engineering',
  'Civil & Allied Engineering',
  'Electronics & Telecommunication Engineering',
  'Computer Science & Information Technology',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateBranchZone, isAdmin } = useAuth();

  const [branch, setBranch] = useState<string>(profile?.targetBranch || 'Mechanical & Allied Engineering');
  const [zone, setZone] = useState<string>(profile?.targetZone || 'RRB Prayagraj (Allahabad)');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateBranchZone(branch, zone);
      onClose();
    } catch (err) {
      alert('Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B192C] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Candidate Exam Profile</h3>
              <p className="text-[11px] text-slate-400">Personalize your RRB JE exam target</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 py-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Candidate Name</label>
            <input
              type="text"
              disabled
              value={user?.displayName || 'Registered Candidate'}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email ID</label>
            <input
              type="text"
              disabled
              value={user?.email || 'N/A'}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-400 cursor-not-allowed font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Engineering Discipline / Trade</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {ENGINEERING_BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target RRB Zone / Board</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {RRB_ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
              <span>You possess Administrator status on this portal.</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg shadow transition flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
