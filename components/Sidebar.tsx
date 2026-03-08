// components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Menu, Plus, MessageSquare, HelpCircle, History, Settings, Trash2, XCircle } from 'lucide-react';
import SettingsModal from './SettingsModal'; 
import HelpModal from './HelpModal'; 
import ActivityModal from './ActivityModal'; 

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface ChatHistory {
  chat_id: string;
  title: string;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false); 
  const [isActivityOpen, setIsActivityOpen] = useState(false); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (error) { 
      console.error("History fetch error:", error); 
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    
    window.dispatchEvent(new CustomEvent('loadChat', { 
      detail: { chatId: chatId } 
    }));
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); 
    if (!confirm("Is chat ko delete karein?")) return;
    
    try {
      const res = await fetch(`/api/history?chatId=${chatId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeChatId === chatId) {
          window.location.href = '/'; 
        } else {
          fetchHistory();
        }
      }
    } catch (error) { 
      console.error("Delete failed:", error); 
    }
  };

  const clearAllHistory = async () => {
    if (!confirm("Kya aap saari history clear karna chahte hain? Yeh wapas nahi aayegi.")) return;
    
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        window.location.reload(); 
      }
    } catch (error) { 
      console.error("Clear history failed:", error); 
    }
  };

  useEffect(() => {
    fetchHistory();
    window.addEventListener('refreshHistory', fetchHistory);
    return () => window.removeEventListener('refreshHistory', fetchHistory);
  }, []);

  return (
    <>
      <aside className={`${isSidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px] md:translate-x-0 md:w-[68px]'} fixed md:relative z-50 h-full bg-[#1e1f20] transition-all duration-300 ease-in-out flex flex-col shrink-0 overflow-hidden border-r border-white/5`}>
        
        <div className="p-4 flex items-center h-[64px]">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[#333538] rounded-full shrink-0 transition-colors">
            <Menu className="w-5 h-5 text-[#c4c7c5]" />
          </button>
          <span className={`ml-4 text-md font-medium text-white transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            Manee Ask
          </span>
        </div>
        
        <div className="px-3 mt-2">
          <button 
            onClick={() => window.location.href = '/'} 
            className={`flex items-center gap-3 bg-[#1a1a1c] hover:bg-[#333538] py-2.5 px-3 rounded-full text-sm font-medium transition-all w-full border border-white/5 ${isSidebarOpen ? 'justify-start' : 'md:justify-center md:px-0 md:w-11'}`}
          >
            <Plus className="w-5 h-5 shrink-0 text-[#c4c7c5]" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>New chat</span>
          </button>
        </div>

        <div className={`mt-6 flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-gray-800 ${isSidebarOpen ? 'block' : 'hidden md:hidden'}`}>
          <div className="flex justify-between items-center mb-3 px-2">
              <p className="text-xs text-[#c4c7c5] font-medium uppercase tracking-widest">Recent</p>
              {history.length > 0 && (
                  <button onClick={clearAllHistory} title="Clear all history" className="hover:text-red-400 text-[#c4c7c5] transition-colors p-1">
                      <XCircle className="w-4 h-4" />
                  </button>
              )}
          </div>
          
          <div className="space-y-1">
            {history.map((chat) => (
              <div 
                key={chat.chat_id} 
                onClick={() => handleSelectChat(chat.chat_id)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition-all group ${
                  activeChatId === chat.chat_id ? 'bg-[#333538] text-white shadow-sm' : 'text-[#e3e3e3] hover:bg-[#333538]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${activeChatId === chat.chat_id ? 'text-[#4285f4]' : 'text-[#c4c7c5] group-hover:text-[#4285f4]'}`} />
                    <span className="truncate max-w-[160px]">{chat.title || "Untitled Chat"}</span>
                </div>
                <button 
                  onClick={(e) => deleteChat(e, chat.chat_id)} 
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-all rounded-md"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 space-y-2 opacity-50">
               <History className="w-8 h-8 text-gray-600" />
               <p className="text-[11px] text-[#9aa0a6] italic">No recent chats</p>
            </div>
          )}
        </div>

        <div className={`p-3 mt-auto border-t border-white/5 space-y-1 ${isSidebarOpen ? 'block' : 'hidden md:flex flex-col items-center'}`}>
          <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-3 p-2.5 hover:bg-[#333538] rounded-xl w-full text-sm text-[#e3e3e3] transition-colors">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Help</span>
          </button>
          <button onClick={() => setIsActivityOpen(true)} className="flex items-center gap-3 p-2.5 hover:bg-[#333538] rounded-xl w-full text-sm text-[#e3e3e3] transition-colors">
            <History className="w-5 h-5 shrink-0" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Activity</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 p-2.5 hover:bg-[#333538] rounded-xl w-full text-sm text-[#e3e3e3] transition-colors group">
            <Settings className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ActivityModal isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} chatCount={history.length} />
    </>
  );
}