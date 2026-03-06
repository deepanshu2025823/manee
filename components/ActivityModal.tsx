// components/ActivityModal.tsx
import { X, Clock, Calendar, Database } from 'lucide-react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatCount: number;
}

export default function ActivityModal({ isOpen, onClose, chatCount }: ActivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f20] w-full max-w-[450px] rounded-[28px] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-medium text-[#e3e3e3]">Your Activity</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#333538] rounded-full transition-colors text-[#c4c7c5]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <Clock className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-white">{chatCount}</h3>
            <p className="text-[#9aa0a6]">Total Conversations Saved</p>
          </div>
          <div className="flex items-center gap-4 bg-[#131314] p-4 rounded-2xl text-left border border-white/5">
             <Database className="w-5 h-5 text-purple-400" />
             <div>
               <p className="text-sm font-medium text-[#e3e3e3]">Sync Status</p>
               <p className="text-xs text-[#9aa0a6]">All data synced with TiDB Cloud</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}