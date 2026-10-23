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
    const saved = localStorage.getItem('ai-studio-keys');
    if (saved) setKeys(JSON.parse(saved));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKeys = () => {
    localStorage.setItem('ai-studio-keys', JSON.stringify(keys));
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
    { id: 'code' as Mode, icon: Code, label: 'Code', desc: 'Mistral / Groq' },
    { id: 'research' as Mode, icon: Search, label: 'Research', desc: 'Gemini Search' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="text-gold" size={28} />
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-wide">Free-Tier AI Studio</h1>
            <p className="text-xs text-gold/70">Orchestrated multi-provider inference · Zero marginal cost</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-white/10 transition"
        >
          <Settings size={20} className="text-gold" />
        </button>
      </header>

      {/* Mode selector */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition curve-border ${
              mode === m.id
                ? 'bg-gold text-deep font-medium'
                : 'glass text-cream hover:bg-white/10'
            }`}
          >
            <m.icon size={16} />
            <span>{m.label}</span>
            <span className="hidden sm:inline text-xs opacity-70">· {m.desc}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-20 opacity-60">
            <Sparkles className="mx-auto mb-4 text-gold" size={48} />
            <p className="font-serif text-xl">Select a mode and begin</p>
            <p className="text-sm mt-2">Chat routes to Groq · Script to Gemini · Code to specialized models · Research with search grounding</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-3xl mx-auto curve-border p-4 ${
              msg.role === 'user'
                ? 'bg-gold/10 border border-gold/30 ml-auto'
                : 'glass'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-gold/70 mb-1">
              {msg.role === 'user' ? 'You' : 'Studio'}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gold/20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={`Message in ${mode} mode...`}
            className="flex-1 bg-white/5 border border-gold/20 rounded-full px-5 py-3 focus:outline-none focus:border-gold placeholder:text-cream/40"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gold text-deep rounded-full p-3 hover:bg-gold/90 transition disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass curve-border p-6 max-w-md w-full">
            <h2 className="font-serif text-xl mb-4">API Keys (BYOK)</h2>
            <p className="text-sm text-cream/70 mb-4">Enter your free-tier keys. Stored locally in your browser. Shared community keys can be added via Vercel env later.</p>
            {(['groq', 'gemini', 'openrouter', 'mistral'] as const).map((k) => (
              <div key={k} className="mb-3">
                <label className="text-xs uppercase text-gold/70">{k}</label>
                <input
                  type="password"
                  value={keys[k]}
                  onChange={(e) => setKeys({ ...keys, [k]: e.target.value })}
                  className="w-full mt-1 bg-white/5 border border-gold/20 rounded px-3 py-2 text-sm"
                  placeholder={`${k} API key`}
                />
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={saveKeys} className="flex-1 bg-gold text-deep py-2 rounded-full text-sm font-medium">
                Save
              </button>
              <button onClick={() => setShowSettings(false)} className="flex-1 border border-gold/30 py-2 rounded-full text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
