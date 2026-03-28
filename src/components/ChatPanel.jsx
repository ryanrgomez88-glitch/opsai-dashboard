import { useState, useRef, useEffect } from 'react';
import { useData } from '../lib/DataContext';
import { sendChat } from '../lib/api';

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
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className={`chat-panel${open ? ' open' : ' collapsed'}`}>
      <div className="chat-header" onClick={() => setOpen(o => !o)}>
        <span>✦ OTTO AI</span>
        <span className="chat-toggle">{open ? '▼' : '▲'}</span>
      </div>
      {open && (
        <>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span className="chat-role">{m.role === 'assistant' ? 'OTTO' : 'YOU'}</span>
                <span className="chat-text">{m.content}</span>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg assistant">
                <span className="chat-role">OTTO</span>
                <span className="chat-text typing">Thinking…</span>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Otto anything…"
              disabled={chatLoading}
            />
            <button className="chat-send" type="submit" disabled={chatLoading || !input.trim()}>➤</button>
          </form>
        </>
      )}
    </div>
  );
}
