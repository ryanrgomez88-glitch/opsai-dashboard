import { useState, useRef, useEffect } from 'react';
import { useData } from '../lib/DataContext';
import { sendChat } from '../lib/api';
import { MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function ChatPanel() {
  const { data } = useData();
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Otto. Ask me anything about Ryno Jet Solutions operations." }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setChatLoading(true);
    try {
      const context = {
        stats: data?.stats,
        recentTrips: data?.recentTrips?.slice(0, 5),
        expenses: data?.expenses?.slice(0, 10),
      };
      const json = await sendChat(next.filter(m => m !== messages[0]), context);
      setMessages(prev => [...prev, { role: 'assistant', content: json.reply || 'No response.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="chat-panel">
      <div className="w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-[#1E3A5F] text-white hover:bg-[#1a3356] transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">Otto AI</span>
          </div>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {open && (
          <>
            {/* Messages */}
            <div className="h-72 overflow-y-auto p-3 space-y-3 bg-slate-50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className={`text-[10px] font-semibold mb-1 ${m.role === 'user' ? 'text-slate-400' : 'text-[#2196F3]'}`}>
                    {m.role === 'assistant' ? 'OTTO' : 'YOU'}
                  </span>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#1E3A5F] text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-semibold mb-1 text-[#2196F3]">OTTO</span>
                  <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 bg-white"
              onSubmit={handleSend}
            >
              <input
                className="flex-1 text-sm text-slate-800 bg-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#2196F3] focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-50"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Otto anything…"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="p-2 rounded-lg bg-[#2196F3] text-white hover:bg-[#1e88e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
