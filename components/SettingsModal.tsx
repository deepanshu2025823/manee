// components/SettingsModal.tsx

import { X, Moon, Sun, Monitor, Info } from 'lucide-react';
import { useTheme } from 'next-themes'; 
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f20] dark:bg-[#1e1f20] light:bg-white w-full max-w-[550px] rounded-[28px] overflow-hidden shadow-2xl border border-white/10 dark:border-white/10 light:border-gray-200 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-medium dark:text-[#e3e3e3] light:text-gray-800">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#333538] rounded-full transition-colors text-[#c4c7c5]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4 dark:text-[#e3e3e3] light:text-gray-700">
              <Info className="w-5 h-5 text-[#9b72cb]" />
              <span className="font-medium">About Manee Ask</span>
            </div>
            <div className="bg-[#131314] rounded-2xl p-5 border border-white/5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#9aa0a6]">Version</span>
                <span className="dark:text-[#e3e3e3] light:text-gray-800">1.0.5 (Stable)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#9aa0a6]">AI Model</span>
                <span className="dark:text-[#e3e3e3] light:text-gray-800">Manee 2.5 Flash</span>
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 bg-[#131314] flex justify-end">
          <button 
            onClick={onClose}
            className="bg-white text-black px-8 py-2 rounded-full font-medium hover:bg-gray-200 transition-all text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}