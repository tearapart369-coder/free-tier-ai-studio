'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Settings, Code, FileText, Search, MessageSquare, Sparkles, Mic, Calendar, Globe } from 'lucide-react';

type Mode = 'chat' | 'script' | 'code' | 'research' | 'voice' | 'schedule';

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
  const [listening, setListening] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [keys, setKeys] = useState({
    groq: '',
    gemini: '',
    openrouter: '',
    mistral: '',
  });
  const [scheduled, setScheduled] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wahid-wasiq-keys');
    if (saved) setKeys(JSON.parse(saved));
    const sched = localStorage.getItem('wahid-wasiq-scheduled');
    if (sched) setScheduled(JSON.parse(sched));

    // Web Speech API setup for wake word and voice
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();

        if (transcript.includes('wasiq ai') || transcript.includes('wasiq ai')) {
          setWakeActive(true);
          setMode('voice');
          speak('Yes, Wasiq AI is listening.');
          setInput('');
        } else if (wakeActive && event.results[event.results.length - 1].isFinal) {
          const command = transcript.replace(/wasiq ai/gi, '').trim();
          if (command) {
            setInput(command);
            sendMessage(command);
          }
        }
      };

      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      setWakeActive(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const saveKeys = () => {
    localStorage.setItem('wahid-wasiq-keys', JSON.stringify(keys));
    setShowSettings(false);
  };

  const sendMessage = async (override?: string) => {
    const text = override || input;
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          mode: mode === 'voice' ? 'chat' : mode,
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

      if (mode === 'voice' || wakeActive) {
        speak(assistantContent);
      }
    } catch (err: any) {
      const errMsg = `Error: ${err.message}`;
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }]);
      if (mode === 'voice') speak(errMsg);
    } finally {
      setLoading(false);
      setWakeActive(false);
    }
  };

  const addSchedule = () => {
    const newItem = {
      id: Date.now(),
      platform: 'instagram',
      content: input || 'Scheduled post',
      time: new Date(Date.now() + 3600000).toISOString(),
      status: 'queued',
      preSignedUrl: 'https://example.com/presigned-upload'
    };
    const updated = [...scheduled, newItem];
    setScheduled(updated);
    localStorage.setItem('wahid-wasiq-scheduled', JSON.stringify(updated));
    setInput('');
  };

  const modes = [
    { id: 'chat' as Mode, icon: MessageSquare, label: 'Chat', desc: 'Groq LPU' },
    { id: 'script' as Mode, icon: FileText, label: 'Script', desc: 'Gemini' },
    { id: 'code' as Mode, icon: Code, label: 'Code', desc: 'Specialized' },
    { id: 'research' as Mode, icon: Search, label: 'Research', desc: 'Gemini' },
    { id: 'voice' as Mode, icon: Mic, label: 'Voice', desc: 'Wasiq Ai wake' },
    { id: 'schedule' as Mode, icon: Calendar, label: 'Schedule', desc: 'Social uploads' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A0A12] via-[#1A1A2E] to-[#0F172A]">
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
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListen}
            className={`p-2.5 rounded-full transition border ${listening ? 'bg-gold/20 border-gold' : 'border-gold/20 hover:bg-white/10'}`}
            title="Voice / Wake Word"
          >
            <Mic size={18} className={listening ? 'text-gold' : 'text-gold/70'} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-full hover:bg-white/10 transition border border-gold/20"
          >
            <Settings size={18} className="text-gold" />
          </button>
        </div>
      </header>

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

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {mode === 'schedule' ? (
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="font-serif text-xl text-cream">Social Scheduler</h2>
            <p className="text-sm text-gold/70">Queue posts for multi-platform upload. Pre-signed URLs can be attached for direct media upload.</p>
            {scheduled.map((item) => (
              <div key={item.id} className="glass p-4 curve-border">
                <div className="text-xs uppercase text-gold/70">{item.platform} · {new Date(item.time).toLocaleString()}</div>
                <div className="mt-1">{item.content}</div>
                <div className="text-xs text-cream/50 mt-1">Status: {item.status}</div>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Post content..."
                className="flex-1 bg-white/5 border border-gold/20 rounded-full px-5 py-3"
              />
              <button onClick={addSchedule} className="bg-gold text-deep rounded-full px-5 py-3">
                Queue
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center py-20 opacity-90">
                <img 
                  src="/logo.jpg" 
                  alt="Wahid & Wasiq" 
                  className="h-32 mx-auto mb-6 object-contain opacity-90"
                />
                <p className="font-serif text-2xl text-cream">Wahid & Wasiq AI Studio</p>
                <p className="text-sm mt-3 text-gold/70 max-w-md mx-auto leading-relaxed">
                  Say “Wasiq Ai” to wake · Voice · Chat · Schedule
                </p>
                {listening && <p className="text-gold text-sm mt-2">Listening for “Wasiq Ai”...</p>}
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
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {mode !== 'schedule' && (
        <div className="px-6 py-5 border-t border-gold/20 bg-deep/40 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={mode === 'voice' ? 'Or type... (or say Wasiq Ai)' : `Message in ${mode} mode...`}
              className="flex-1 bg-white/5 border border-gold/20 rounded-full px-6 py-3.5 focus:outline-none focus:border-gold"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-gold text-deep rounded-full p-3.5 hover:bg-gold/90 transition disabled:opacity-40"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

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
