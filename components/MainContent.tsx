// components/MainContent.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  Menu, Image as ImageIcon, Mic, Send, User, 
  Mail, Map, FileText, Code, Loader2, Sparkles, Copy, Check, LogOut 
} from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react"; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MainContentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

export default function MainContent({ isSidebarOpen, setIsSidebarOpen, isMobile }: MainContentProps) {
  const { data: session, status } = useSession(); 
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null); 
  const [showProfileDropdown, setShowProfileDropdown] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchChatMessages = async (chatId: string) => {
    setIsTyping(true);
    setCurrentChatId(chatId);
    setMessages([]); 
    
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => ({ 
          role: m.role === 'assistant' || m.role === 'manee' ? 'manee' : 'user', 
          content: m.content 
        })));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      const timer = setTimeout(() => { signIn('google'); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleLoadChat = (e: any) => {
      if (e.detail && e.detail.chatId) {
        fetchChatMessages(e.detail.chatId);
      }
    };
    window.addEventListener('loadChat', handleLoadChat);
    return () => window.removeEventListener('loadChat', handleLoadChat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userPrompt = input;
    const tempChatId = currentChatId;
    
    setMessages((prev) => [...prev, { role: 'user', content: userPrompt }]);
    setIsTyping(true);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userPrompt, 
          chatId: tempChatId,
          userEmail: session?.user?.email || 'guest' 
        }),
      });

      const data = await response.json();

      if (data.text) {
        if (data.chatId) setCurrentChatId(data.chatId);
        setMessages((prev) => [...prev, { role: 'manee', content: data.text }]);
        window.dispatchEvent(new Event('refreshHistory'));
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error: any) {
      console.error("API Error:", error);
      setMessages((prev) => [...prev, { role: 'manee', content: "Mafi chahta hoon, database sync mein kuch error aa gaya hai. Kripya dobara koshish karein." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const suggestionCards = [
    { text: 'Draft an email', img: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=400&q=80', icon: <Mail className="w-4 h-4 text-[#c4c7c5]" /> },
    { text: 'Create an itinerary', img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80', icon: <Map className="w-4 h-4 text-[#c4c7c5]" /> },
    { text: 'Summarize a text', img: 'https://img.freepik.com/free-photo/business-woman-working_1303-5992.jpg?w=1480', icon: <FileText className="w-4 h-4 text-[#c4c7c5]" /> },
    { text: 'Write some code', img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80', icon: <Code className="w-4 h-4 text-[#c4c7c5]" /> }
  ];

  return (
    <main className="flex-1 flex flex-col relative w-full overflow-hidden transition-all duration-300 bg-[#131314]">
      <header className="flex justify-between items-center p-4 h-[64px] z-10">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-[#333538] rounded-full mr-2 transition-colors">
               <Menu className="w-5 h-5 text-[#c4c7c5]" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button className="bg-[#1e1f20] hover:bg-[#333538] text-sm px-4 py-2 rounded-lg font-medium hidden sm:block text-[#e3e3e3] border border-white/5">
            Try Manee Advanced
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 shadow-lg hover:border-blue-500/50 transition-all flex items-center justify-center bg-[#131314]"
            >
              {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : session?.user?.image ? (
                  <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                  <User className="w-5 h-5 text-[#c4c7c5]" />
              )}
            </button>

            {showProfileDropdown && session && (
              <div className="absolute right-0 mt-3 w-64 bg-[#1e1f20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[110]">
                <div className="p-4 border-b border-white/5 bg-[#131314]/50">
                  <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
                  <p className="text-[11px] text-[#9aa0a6] truncate">{session.user?.email}</p>
                </div>
                <div className="p-2">
                   <button 
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group"
                   >
                     <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                     <span className="font-medium">Logout</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full flex flex-col pb-32 scrollbar-thin scrollbar-thumb-gray-700">
        <div className="flex-1 flex flex-col max-w-[820px] w-full mx-auto px-4 mt-4 md:mt-8">
          {messages.length === 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-12">
                <h1 className="text-5xl md:text-6xl mb-2 bg-gradient-to-r from-[#4285f4] via-[#d96570] to-[#d96570] text-transparent bg-clip-text inline-block tracking-tight font-medium">
                  Hello, {session?.user?.name?.split(' ')[0] || 'Friend'}
                </h1>
                <p className="text-4xl md:text-5xl text-[#444746] mt-1 tracking-tight font-medium">How can I help you today?</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {suggestionCards.map((card, i) => (
                  <div key={i} onClick={() => setInput(card.text)} className="relative bg-[#1e1f20] hover:bg-[#333538] cursor-pointer rounded-2xl h-[160px] md:h-[200px] overflow-hidden group transition-all duration-300 border border-white/5 shadow-sm">
                    <div className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundImage: `url('${card.img}')` }} />
                    <div className="relative h-full p-4 md:p-5 flex flex-col justify-between z-10">
                      <p className="text-[#e3e3e3] text-[14px] md:text-[15px] font-medium leading-snug">{card.text}</p>
                      <div className="self-end bg-[#131314] p-2 md:p-2.5 rounded-full group-hover:bg-[#1e1f20] transition-colors shadow-lg border border-white/5">{card.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10 w-full pb-10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full animate-in fade-in duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'manee' && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4285f4] via-[#9b72cb] to-[#d96570] flex-shrink-0 mr-3 md:mr-4 mt-1 flex items-center justify-center shadow-lg border border-white/10">
                       <Sparkles className="w-5 h-5 text-white fill-white/20" />
                    </div>
                  )}
                  <div className={`leading-relaxed ${msg.role === 'user' ? 'bg-[#2a2b2f] text-[#e3e3e3] px-5 py-3 rounded-[24px] max-w-[85%] md:max-w-[75%] border border-white/5 shadow-md' : 'bg-transparent text-[#e3e3e3] w-full'}`}>
                    {msg.role === 'manee' ? (
                      <article className="prose prose-invert max-w-none prose-p:text-[16px] prose-p:leading-7 prose-p:text-[#e3e3e3] prose-pre:bg-transparent prose-pre:p-0">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]} 
                          components={{
                            code({node, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              return match ? (
                                <div className="relative group my-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                  <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-white/5">
                                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{match[1]}</span>
                                    <button onClick={() => copyToClipboard(codeString, idx)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all">
                                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      {copiedIndex === idx ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1.5rem', fontSize: '14px', background: '#1e1e1e' }}>
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-blue-500/10 text-[#4285f4] px-1.5 py-0.5 rounded-md font-mono text-sm border border-blue-500/20" {...props}>{children}</code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </article>
                    ) : (
                      <div className="whitespace-pre-wrap text-[16px]">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-4 text-[#c4c7c5] ml-[48px] md:ml-[52px]">
                   <div className="flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce delay-300"></div>
                   </div>
                   <span className="text-xs font-medium opacity-50 tracking-wide uppercase">Processing</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="w-full mx-auto pb-6 pt-2 px-4 absolute bottom-0 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
        <div className="max-w-[820px] mx-auto">
          <div className="bg-[#1e1f20] rounded-[28px] p-2 pr-3 flex items-end focus-within:bg-[#2a2b2f] transition-all border border-transparent focus-within:border-white/10 shadow-2xl">
            <button className="p-3 hover:bg-[#3c3d3f] rounded-full shrink-0 text-[#c4c7c5] transition-colors"><ImageIcon className="w-5 h-5" /></button>
            <textarea 
              rows={1} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} 
              placeholder="Ask Manee..." 
              className="flex-1 bg-transparent border-none outline-none text-[#e3e3e3] px-2 text-[16px] resize-none max-h-[200px] py-3 flex items-center" 
            />
            <div className="flex items-center gap-1 shrink-0 pb-1">
              {!input.trim() ? (
                <button className="p-3 hover:bg-[#3c3d3f] rounded-full text-[#c4c7c5] transition-colors"><Mic className="w-5 h-5" /></button>
              ) : (
                <button onClick={handleSendMessage} disabled={isTyping} className={`p-3 rounded-full transition-all ${isTyping ? 'bg-transparent text-gray-600' : 'bg-white text-black hover:bg-gray-200'}`}>
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-center text-[#9aa0a6] mt-3">Manee can make mistakes. Always check facts.</p>
        </div>
      </div>
    </main>
  );
}