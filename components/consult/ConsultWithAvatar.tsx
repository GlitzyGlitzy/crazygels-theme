'use client';

import { useState, useEffect, useRef, useCallback, type ElementType } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import Link from 'next/link';
import {
  ArrowLeft, Send, Loader2, Sparkles, User, RefreshCcw,
  ShoppingBag, ExternalLink, Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';

import { SignupGate } from '@/components/consult/signup-gate';
import { DoctorAvatar, type AvatarState } from '@/components/avatar/DoctorAvatar';
import { useVoice } from '@/components/avatar/useVoice';

// ─── helpers ────────────────────────────────────────────────────────────────

function getMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return '';
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
}

// ─── product card ────────────────────────────────────────────────────────────

interface RecommendedProduct {
  handle: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  description: string;
  concerns: string[];
  reason: string;
}

interface ToolOutput {
  success: boolean;
  assessedType: string;
  concerns: string[];
  products: RecommendedProduct[];
  routineSummary: string;
  totalRecommended: number;
}

function ProductCard({ product, accent }: { product: RecommendedProduct; accent: string }) {
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block bg-[#FAFAF8] border border-[#E8E4DC] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
      style={{ ['--accent' as string]: accent }}
    >
      <div className="aspect-square relative bg-[#F5F3EF] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-[#1A1A1A]/20" />
          </div>
        )}
        {product.compareAtPrice && (
          <div className="absolute top-2 left-2 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: accent }}>
            Sale
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 mb-1 group-hover:opacity-70 transition-opacity">
          {product.title}
        </h4>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-[#1A1A1A]">{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-[#999] line-through">{product.compareAtPrice}</span>
          )}
        </div>
        <p className="text-xs text-[#666] leading-relaxed line-clamp-2 mb-3">{product.reason}</p>
        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
          View Product <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function ProductRecommendations({ output, accent }: { output: ToolOutput; accent: string }) {
  return (
    <div className="bg-[#FAFAF8] border border-[#E8E4DC] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" style={{ color: accent }} />
        <h3 className="text-xs uppercase tracking-widest font-medium" style={{ color: accent }}>
          Your Personalized Recommendations
        </h3>
      </div>
      {output.assessedType && (
        <p className="text-sm text-[#666] mb-4">
          Type: <span className="font-medium text-[#1A1A1A]">{output.assessedType}</span>
          {output.concerns.length > 0 && (
            <> · Concerns: <span className="font-medium text-[#1A1A1A]">{output.concerns.join(', ')}</span></>
          )}
        </p>
      )}
      {output.products?.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {output.products.map(p => <ProductCard key={p.handle} product={p} accent={accent} />)}
        </div>
      ) : (
        <p className="text-sm text-[#666] mb-4">Preparing your recommendations…</p>
      )}
      {output.routineSummary && (
        <div className="border-t border-[#E8E4DC] pt-4">
          <h4 className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: accent }}>Routine Summary</h4>
          <p className="text-sm text-[#666] leading-relaxed">{output.routineSummary}</p>
        </div>
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export interface ConsultWithAvatarProps {
  consultType: 'skin' | 'hair';
  accent: string;         // e.g. '#B76E79'
  Icon: ElementType;      // Lucide icon
  title: string;
  placeholder: string;
  suggestions: string[];
}

export function ConsultWithAvatar({
  consultType, accent, Icon, title, placeholder, suggestions,
}: ConsultWithAvatarProps) {
  const [input, setInput] = useState('');
  const [muted, setMuted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string>('idle');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/consult/chat',
      body: { consultType },
    }),
    messages: [],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // ── voice ──
  const handleTranscript = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    sendMessage({ text });
  }, [isLoading, sendMessage]);

  const { listening, speaking, mouthOpen, supported, startListening, stopListening, speak, stopSpeaking } = useVoice(handleTranscript);

  // Auto-speak when streaming finishes and a new assistant message arrived
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev === 'streaming' && status === 'ready') {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && !muted) {
        const text = getMessageText(last);
        if (text) speak(text);
      }
    }
  }, [status, messages, muted, speak]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── avatar state ──
  const avatarState: AvatarState =
    listening ? 'listening' :
    isLoading  ? 'thinking'  :
    speaking   ? 'speaking'  :
    'idle';

  // ── avatar status label ──
  const statusLabel =
    listening ? 'Listening…' :
    isLoading  ? 'Thinking…'  :
    speaking   ? 'Speaking…'  :
    messages.length === 0 ? 'Ready to help' : 'Here for you';

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage({ text });
  };

  const handleMicClick = () => {
    if (listening) stopListening();
    else           startListening();
  };

  const handleMuteClick = () => {
    if (speaking) stopSpeaking();
    setMuted(m => !m);
  };

  return (
    <SignupGate consultType={consultType}>
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur-xl border-b border-[#E8E4DC]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/consult" className="flex items-center gap-2 text-[#666] hover:text-[#1A1A1A] transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: accent }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[#1A1A1A] font-medium text-sm">{title}</p>
                <p className="text-[#9B9B9B] text-xs">with Dr. Maya</p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-[#666] hover:text-[#1A1A1A] transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Restart</span>
            </button>
          </div>
        </header>

        {/* ── Body: avatar + chat ── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Avatar panel */}
          <div className="flex-shrink-0 md:w-[300px] lg:w-[340px] flex flex-col items-center justify-between
                          bg-gradient-to-b from-[#F9F5F1] to-[#EDE6DD] border-b md:border-b-0 md:border-r border-[#E8E4DC]
                          py-6 px-4 gap-4">

            {/* Avatar */}
            <div className="w-full max-w-[220px] md:max-w-full aspect-[3/4]">
              <DoctorAvatar state={avatarState} mouthOpen={mouthOpen} className="w-full h-full drop-shadow-xl" />
            </div>

            {/* Status + controls */}
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Status badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                   style={{ background: `${accent}18`, color: accent }}>
                <span className={`w-2 h-2 rounded-full ${
                  avatarState === 'idle' ? 'bg-current opacity-40' : 'bg-current animate-pulse'
                }`} />
                {statusLabel}
              </div>

              {/* Mic + mute row */}
              <div className="flex items-center gap-3">
                {supported && (
                  <button
                    onClick={handleMicClick}
                    title={listening ? 'Stop listening' : 'Speak to Dr. Maya'}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={listening
                      ? { background: accent, color: 'white' }
                      : { background: `${accent}18`, color: accent }
                    }
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {listening ? 'Stop' : 'Speak'}
                  </button>
                )}

                <button
                  onClick={handleMuteClick}
                  title={muted ? 'Unmute voice' : 'Mute voice'}
                  className="p-2 rounded-full transition-all text-[#999] hover:text-[#1A1A1A]"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {!supported && (
                <p className="text-[10px] text-[#999] text-center leading-tight">
                  Voice not supported in this browser.<br />Use Chrome or Edge for voice input.
                </p>
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-6">

                {messages.length === 0 ? (
                  /* Empty state */
                  <div className="text-center py-10">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                         style={{ background: `${accent}18` }}>
                      <Sparkles className="w-8 h-8" style={{ color: accent }} />
                    </div>
                    <h2 className="text-xl font-serif text-[#1A1A1A] mb-2">Hi, I'm Dr. Maya</h2>
                    <p className="text-[#666] max-w-xs mx-auto mb-6 text-sm leading-relaxed">
                      {placeholder}. Tap a topic below or speak — I'll ask a few questions and then recommend the right products for you.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => sendMessage({ text: `My main concern is ${s.toLowerCase()}` })}
                          className="px-4 py-2 bg-white border border-[#E8E4DC] rounded-full text-sm text-[#666] hover:text-[#1A1A1A] transition-all"
                          style={{ borderColor: `${accent}30` }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="space-y-5">
                    {messages.map(message => {
                      const isUser = message.role === 'user';
                      return (
                        <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white`}
                               style={{ background: isUser ? '#1A1A1A' : accent }}>
                            {isUser
                              ? <User className="w-4 h-4" />
                              : <Sparkles className="w-4 h-4" />
                            }
                          </div>

                          <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end flex flex-col' : ''}`}>
                            {message.parts.map((part, i) => {
                              if (part.type === 'text' && part.text) {
                                return (
                                  <div key={i} className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
                                    isUser
                                      ? 'bg-[#1A1A1A] text-white'
                                      : 'bg-white border border-[#E8E4DC] text-[#1A1A1A]/90'
                                  }`}>
                                    <p className="whitespace-pre-wrap">{part.text}</p>
                                  </div>
                                );
                              }

                              if (part.type === 'tool-recommendProducts') {
                                if (part.state === 'output-available') {
                                  return <ProductRecommendations key={i} output={part.output as ToolOutput} accent={accent} />;
                                }
                                if (part.state === 'input-available' || part.state === 'input-streaming') {
                                  return (
                                    <div key={i} className="bg-white border border-[#E8E4DC] rounded-2xl p-4">
                                      <div className="flex items-center gap-2" style={{ color: accent }}>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Finding your perfect products…</span>
                                      </div>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Thinking dots */}
                    {isLoading && !messages[messages.length - 1]?.parts?.some(p => p.type === 'tool-recommendProducts') && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: accent }}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4">
                          <div className="flex gap-1.5">
                            {[0, 150, 300].map(d => (
                              <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: accent, animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
            </main>

            {/* Input bar */}
            <footer className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur-xl border-t border-[#E8E4DC]">
              <div className="max-w-2xl mx-auto px-4 py-3">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={listening ? 'Listening…' : `Ask Dr. Maya about your ${consultType}…`}
                    disabled={isLoading || listening}
                    className="flex-1 bg-white border border-[#E8E4DC] rounded-full px-5 py-3 text-[#1A1A1A] text-sm placeholder:text-[#9B9B9B] focus:outline-none transition-colors"
                    style={{ ['--tw-ring-color' as string]: accent }}
                  />

                  {/* Mic button (inline with input) */}
                  {supported && (
                    <button
                      type="button"
                      onClick={handleMicClick}
                      title={listening ? 'Stop' : 'Speak'}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all"
                      style={{ background: listening ? '#ef4444' : `${accent}40` }}
                    >
                      {listening
                        ? <MicOff className="w-4 h-4 text-white" />
                        : <Mic className="w-4 h-4" style={{ color: accent }} />
                      }
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ background: accent }}
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />
                    }
                  </button>
                </form>

                <div className="flex items-center justify-center gap-4 mt-2">
                  <p className="text-[#9B9B9B] text-[10px]">AI recommendations from your CrazyGels catalog</p>
                  <Link href="/recommendations" className="text-[10px] hover:underline" style={{ color: accent }}>
                    Browse All
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </SignupGate>
  );
}
