/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Zap, 
  Code, 
  Terminal, 
  Type as TypeIcon, 
  Layers,
  Check,
  ChevronRight,
  Trash2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface EnhancedPrompt {
  id: string;
  original: string;
  enhanced: string;
  timestamp: number;
  strategy: string;
}

// --- Constants ---

const STRATEGIES = [
  { id: 'descriptive', label: 'Descriptive', icon: <TypeIcon size={16} />, description: 'Adds rich detail and visual context.' },
  { id: 'technical', label: 'Technical', icon: <Code size={16} />, description: 'Focuses on stack, architecture, and logic.' },
  { id: 'concise', label: 'Concise', icon: <Zap size={16} />, description: 'Removes fluff while keeping core intent.' },
  { id: 'creative', label: 'Creative', icon: <Sparkles size={16} />, description: 'Adds unique twists and artistic flair.' },
];

// --- Components ---

interface User {
  email: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<EnhancedPrompt[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState('descriptive');
  const [currentOutput, setCurrentOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reprompter_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('reprompter_history', JSON.stringify(history));
  }, [history]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('reprompter_token', data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('reprompter_token');
    setUser(null);
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('reprompter_token');
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem('reprompter_token');
      })
      .catch(() => localStorage.removeItem('reprompter_token'));
    }
  }, []);

  const handleEnhance = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setError(null);
    setCurrentOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const strategy = STRATEGIES.find(s => s.id === selectedStrategy);
      
      const prompt = `
        You are an expert Prompt Engineer. Your task is to take a user's basic idea and transform it into a high-quality, professional AI prompt.
        The user wants to generate a "single file index.html" application (using Tailwind CSS, modern JS, and often Lucide icons or Framer Motion).
        
        User Input: "${input}"
        Strategy: ${strategy?.label} - ${strategy?.description}
        
        Requirements for the Enhanced Prompt:
        1. It must be highly specific about UI/UX (mentioning Tailwind classes, layout patterns like Bento grids or split screens).
        2. It must specify the technical stack (React, Lucide, Motion, Tailwind).
        3. It must emphasize "single file" architecture.
        4. It must include instructions for "juice" (animations, transitions, feedback).
        5. The output should be the ENHANCED PROMPT ONLY. No conversational filler.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const enhancedText = response.text || 'Failed to generate prompt.';
      setCurrentOutput(enhancedText);

      const newEntry: EnhancedPrompt = {
        id: Math.random().toString(36).substring(7),
        original: input,
        enhanced: enhancedText,
        timestamp: Date.now(),
        strategy: selectedStrategy,
      };

      setHistory(prev => [newEntry, ...prev].slice(0, 20));
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('reprompter_history');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-brutal-black flex items-center justify-center p-6 font-sans overflow-hidden relative">
        {/* JWST Themed Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-green/20 blur-[120px] rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white brutal-border brutal-shadow p-8 relative z-10"
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 bg-brutal-black flex items-center justify-center brutal-border mb-4 rotate-3">
              <Sparkles className="text-neon-green w-10 h-10" />
            </div>
            <h1 className="font-display text-4xl uppercase tracking-tighter leading-none">
              JWST <span className="text-neon-green [text-shadow:1px_1px_0px_#000]">Vision</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50 mt-2">Deep Space Prompt Engineering</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold">Observer Email</label>
              <input 
                type="email" 
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full p-3 brutal-border focus:ring-2 focus:ring-neon-green outline-none font-mono text-sm"
                placeholder="commander@nasa.gov"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold">Access Key</label>
              <input 
                type="password" 
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full p-3 brutal-border focus:ring-2 focus:ring-neon-green outline-none font-mono text-sm"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="p-2 bg-red-100 border border-red-600 text-red-600 text-[10px] font-mono uppercase">
                [AUTH_ERROR]: {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-brutal-black text-white font-display text-xl uppercase tracking-widest hover:bg-neon-green hover:text-brutal-black transition-all brutal-shadow brutal-shadow-hover active:translate-y-1 active:translate-x-1 active:shadow-none disabled:opacity-50"
            >
              {authLoading ? 'Authenticating...' : 'Initiate Sequence'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-brutal-black/10 text-center">
            <p className="text-[10px] font-mono opacity-50 uppercase">
              Secure JWT-based authentication active. <br />
              Any credentials accepted for this mission.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-neon-green selection:text-brutal-black">
      {/* Marquee Header */}
      <div className="bg-brutal-black text-white py-2 overflow-hidden border-b-2 border-brutal-black relative">
        <div className="marquee-track whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-4 font-display text-xl tracking-widest uppercase italic">
              Re-Prompter // AI Prompt Engineering // Single File Specialist // Re-Prompter //
            </span>
          ))}
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-brutal-black pl-4">
          <div className="text-[10px] font-mono uppercase hidden sm:block">
            <span className="opacity-50">User:</span> {user.email}
          </div>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-mono uppercase bg-white text-brutal-black px-2 py-0.5 brutal-border hover:bg-neon-green transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Input & Controls */}
        <section className="lg:col-span-5 border-r-2 border-brutal-black p-6 lg:p-10 flex flex-col gap-8 bg-[#f9f9f9]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-tighter opacity-50">
              <span className="w-2 h-2 bg-brutal-black rounded-full animate-pulse" />
              Input Terminal
            </div>
            <h1 className="font-display text-6xl lg:text-7xl leading-[0.85] uppercase -ml-1">
              Refine Your <br />
              <span className="text-neon-green [text-shadow:2px_2px_0px_#000]">Vision</span>
            </h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase font-bold flex items-center gap-2">
                <Terminal size={14} /> Basic Idea
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., a minimal pomodoro timer with a brutalist aesthetic..."
                className="w-full h-40 p-4 brutal-border bg-white focus:outline-none focus:ring-2 focus:ring-neon-green resize-none font-mono text-sm brutal-shadow"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-mono uppercase font-bold flex items-center gap-2">
                <Layers size={14} /> Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStrategy(s.id)}
                    className={`flex items-center gap-3 p-3 brutal-border transition-all text-left group ${
                      selectedStrategy === s.id 
                        ? 'bg-neon-green brutal-shadow' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 brutal-border bg-white ${selectedStrategy === s.id ? 'bg-white' : 'group-hover:bg-neon-green'}`}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase leading-none mb-1">{s.label}</div>
                      <div className="text-[10px] opacity-60 leading-tight">{s.description.split(' ')[0]}...</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleEnhance}
              disabled={isGenerating || !input.trim()}
              className={`w-full py-4 brutal-border font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${
                isGenerating || !input.trim()
                  ? 'bg-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-brutal-black text-white hover:bg-neon-green hover:text-brutal-black brutal-shadow brutal-shadow-hover active:translate-y-1 active:translate-x-1 active:shadow-none'
              }`}
            >
              {isGenerating ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <>
                  Enhance Prompt <ChevronRight />
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-red-600 text-red-600 text-xs font-mono">
                [ERROR]: {error}
              </div>
            )}
          </div>

          {/* History Preview */}
          <div className="mt-auto pt-10 border-t border-brutal-black/10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase font-bold flex items-center gap-2">
                <History size={14} /> Recent Lab Work
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] uppercase underline opacity-50 hover:opacity-100">
                  Wipe Data
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-xs italic opacity-40">No previous experiments found.</div>
              ) : (
                history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      setInput(entry.original);
                      setCurrentOutput(entry.enhanced);
                      setSelectedStrategy(entry.strategy);
                    }}
                    className="w-full text-left p-2 border border-brutal-black/10 hover:border-brutal-black hover:bg-white text-[11px] font-mono truncate transition-colors"
                  >
                    {entry.original}
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Output & Editor */}
        <section className="lg:col-span-7 p-6 lg:p-10 bg-white flex flex-col gap-6 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-tighter">
                <Sparkles size={14} className="text-neon-green" />
                Enhanced Output
              </div>
              {currentOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEnhance}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 brutal-border text-xs font-bold uppercase bg-white hover:bg-gray-50 transition-all"
                    title="Retry generation"
                  >
                    <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                    Retry
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentOutput)}
                    className={`flex items-center gap-2 px-3 py-1.5 brutal-border text-xs font-bold uppercase transition-all ${
                      copied ? 'bg-neon-green' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 brutal-border bg-white relative overflow-hidden flex flex-col brutal-shadow">
              <div className="bg-brutal-black text-white px-4 py-2 flex items-center justify-between border-b-2 border-brutal-black">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/20" />
                </div>
                <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">prompt_v1.0.txt</div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed bg-[#1a1a1a] text-white selection:bg-neon-green selection:text-brutal-black">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
                    <div className="text-xs uppercase tracking-widest animate-pulse">Synthesizing...</div>
                  </div>
                ) : currentOutput ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="whitespace-pre-wrap"
                  >
                    {currentOutput}
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4">
                    <Terminal size={48} />
                    <div className="max-w-xs uppercase text-xs tracking-widest font-bold">
                      Waiting for input to generate a high-performance prompt
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                  <Zap size={10} /> Pro Tip
                </div>
                <p className="text-[11px] leading-tight opacity-70">
                  Mention specific animations like "staggered entrance" for better results.
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                  <Code size={10} /> Stack
                </div>
                <p className="text-[11px] leading-tight opacity-70">
                  Our enhancer defaults to React + Tailwind + Lucide + Framer Motion.
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                  <Sparkles size={10} /> Single File
                </div>
                <p className="text-[11px] leading-tight opacity-70">
                  Prompts are optimized for "everything in index.html" workflows.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-brutal-black p-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest bg-white">
        <div>© 2026 RE-PROMPTER LABS // SYSTEM_STABLE</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-neon-green transition-colors">Documentation</a>
          <a href="#" className="hover:text-neon-green transition-colors">API Status</a>
          <a href="#" className="hover:text-neon-green transition-colors">Github</a>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
        }
      `}</style>
    </div>
  );
}
