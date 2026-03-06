// components/HelpModal.tsx
import { X, MessageCircle, Zap, Shield, Key } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const faqs = [
    { icon: <Zap className="w-4 h-4 text-yellow-400" />, q: "Manee Advanced kya hai?", a: "Ye ek premium model hai jo complex tasks aur coding mein zyada help karta hai." },
    { icon: <MessageCircle className="w-4 h-4 text-blue-400" />, q: "Kya meri chats private hain?", a: "Haan, aapki chats TiDB Cloud mein encrypted aur private taur par store hoti hain." },
    { icon: <Key className="w-4 h-4 text-green-400" />, q: "Voice mode kaise use karein?", a: "Input bar mein Mic icon par click karke aap bol kar sawal pooch sakte hain." }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1f20] w-full max-w-[500px] rounded-[28px] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-medium text-[#e3e3e3]">Help Center</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#333538] rounded-full transition-colors text-[#c4c7c5]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#131314] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-1 font-medium text-[#e3e3e3]">
                  {faq.icon} <span>{faq.q}</span>
                </div>
                <p className="text-sm text-[#9aa0a6] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-[#131314] flex justify-center border-t border-white/5">
          <p className="text-[11px] text-[#5f6368]">Manee Ask Help v1.0</p>
        </div>
      </div>
    </div>
  );
}