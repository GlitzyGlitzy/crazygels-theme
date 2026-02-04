'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Sparkles, User, RefreshCcw, Wind } from 'lucide-react';

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return '';
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export default function HairConsultPage() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/consult/chat',
      body: { consultType: 'hair' },
    }),
    initialMessages: [],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage({ text: message });
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF7F2]/95 backdrop-blur-xl border-b border-[#D4AF37]/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/consult" 
            className="flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B7355] to-[#C9A9A6] flex items-center justify-center">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[#2C2C2C] font-medium">Hair Analysis</h1>
              <p className="text-[#2C2C2C]/50 text-xs">with Glow AI</p>
            </div>
          </div>
          
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8B7355]/20 to-[#C9A9A6]/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#8B7355]" />
              </div>
              <h2 className="text-2xl font-medium text-[#2C2C2C] mb-3">
                Ready for Your Hair Analysis
              </h2>
              <p className="text-[#2C2C2C]/60 max-w-md mx-auto mb-8">
                Tell me about your hair! What&apos;s your biggest concern right now? 
                I&apos;ll ask a few questions to understand your hair better.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Dry & damaged', 'Frizzy hair', 'Thinning hair', 'Color-treated', 'Scalp issues', 'Curly care'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(`My main concern is ${suggestion.toLowerCase()}`);
                    }}
                    className="px-4 py-2 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-full text-sm text-[#2C2C2C]/80 hover:border-[#8B7355]/50 hover:text-[#2C2C2C] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                const text = getUIMessageText(message);
                const isUser = message.role === 'user';
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-[#D4AF37]' 
                        : 'bg-gradient-to-br from-[#8B7355] to-[#C9A9A6]'
                    }`}>
                      {isUser ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-2xl ${
                        isUser 
                          ? 'bg-[#D4AF37] text-white' 
                          : 'bg-[#FFFEF9] border border-[#D4AF37]/20 text-[#2C2C2C]/90'
                      }`}>
                        <p className="whitespace-pre-wrap">{text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#8B7355] to-[#C9A9A6] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#D4AF37]/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-full px-5 py-3 text-[#2C2C2C] placeholder:text-[#2C2C2C]/40 focus:outline-none focus:border-[#8B7355]/50 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-gradient-to-r from-[#8B7355] to-[#C9A9A6] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-center text-[#2C2C2C]/40 text-xs mt-3">
            Powered by AI. Recommendations are for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
