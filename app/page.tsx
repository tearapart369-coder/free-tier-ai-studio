'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Code, FileText, Search, MessageSquare, Sparkles } from 'lucide-react';

type Mode = 'chat' | 'script' | 'code' | 'research';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [keys, setKeys] = useState({
    groq: '',
    gemini: '',
    openrouter: '',
    mistral: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wahid-wasiq-keys');
    if (saved) setKeys(JSON.parse(saved));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKeys = () => {
    localStorage.setItem('wahid-wasiq-keys', JSON.stringify(keys));
    setShowSettings(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          mode,
          keys,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: 'chat' as Mode, icon: MessageSquare, label: 'Chat', desc: 'Ultra-fast Groq LPU' },
    { id: 'script' as Mode, icon: FileText, label: 'Script', desc: 'Gemini long-form' },
    { id: 'code' as Mode, icon: Code, label: 'Code', desc: 'Specialized models' },
    { id: 'research' as Mode, icon: Search, label: 'Research', desc: 'Gemini Search' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A0A12] via-[#1A1A2E] to-[#0F172A]">
      {/* Header with official logo */}
      <header className="glass border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/logo.jpg" 
            alt="Wahid & Wasiq AI Studio" 
            className="h-14 w-auto object-contain drop-shadow-lg"
          />
          <div className="hidden sm:block">
            <h1 className="font-serif text-xl font-semibold tracking-wide text-cream">Wahid & Wasiq</h1>
            <p className="text-xs text-gold/80 tracking-widest uppercase">AI Studio</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-full hover:bg-white/10 transition border border-gold/20"
        >
          <Settings size={18} className="text-gold" />
        </button>
      </header>

      {/* Mode selector */}
      <div className="px-6 py-5 flex gap-3 overflow-x-auto scrollbar-hide">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm transition-all duration-300 ${
              mode === m.id
                ? 'bg-gold text-deep font-medium shadow-lg shadow-gold/20'
                : 'glass text-cream hover:bg-white/10 border border-gold/10'
            }`}
          >
            <m.icon size={16} />
            <span>{m.label}</span>
            <span className="hidden sm:inline text-xs opacity-70">· {m.desc}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-20 opacity-90">
            <img 
              src="/logo.jpg" 
              alt="Wahid & Wasiq" 
              className="h-32 mx-auto mb-6 object-contain opacity-90"
            />
            <p className="font-serif text-2xl text-cream">Wahid & Wasiq AI Studio</p>
            <p className="text-sm mt-3 text-gold/70 max-w-md mx-auto leading-relaxed">
              Multi-provider free-tier intelligence · Chat · Script · Code · Research
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-3xl mx-auto curve-border p-5 ${
              msg.role === 'user'
                ? 'bg-gold/10 border border-gold/30 ml-auto'
                : 'glass'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-gold/70 mb-2 font-medium">
              {msg.role === 'user' ? 'You' : 'Studio'}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed text-cream/95">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-5 border-t border-gold/20 bg-deep/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Message in ${mode} mode...`}
            className="flex-1 bg-white/5 border border-gold/20 rounded-full px-6 py-3.5 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-cream/40 transition"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gold text-deep rounded-full p-3.5 hover:bg-gold/90 transition disabled:opacity-40 shadow-lg shadow-gold/10"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass curve-border p-7 max-w-md w-full border border-gold/20">
            <h2 className="font-serif text-xl mb-1 text-cream">API Keys</h2>
            <p className="text-xs text-gold/70 mb-5 uppercase tracking-wider">Bring Your Own Key · Stored locally</p>
            {(['groq', 'gemini', 'openrouter', 'mistral'] as const).map((k) => (
              <div key={k} className="mb-4">
                <label className="text-xs uppercase text-gold/80 tracking-wide">{k}</label>
                <input
                  type="password"
                  value={keys[k]}
                  onChange={(e) => setKeys({ ...keys, [k]: e.target.value })}
                  className="w-full mt-1.5 bg-white/5 border border-gold/20 rounded-lg px-3.5 py-2.5 text-sm focus:border-gold focus:outline-none"
                  placeholder={`${k} API key`}
                />
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={saveKeys} className="flex-1 bg-gold text-deep py-2.5 rounded-full text-sm font-medium hover:bg-gold/90 transition">
                Save Keys
              </button>
              <button onClick={() => setShowSettings(false)} className="flex-1 border border-gold/30 py-2.5 rounded-full text-sm hover:bg-white/5 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
