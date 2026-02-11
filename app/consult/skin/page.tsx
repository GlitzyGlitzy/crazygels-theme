'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import Link from 'next/link';

import { ArrowLeft, Send, Loader2, Sparkles, User, RefreshCcw, Droplets, ShoppingBag, ExternalLink } from 'lucide-react';

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return '';
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

interface RecommendedProduct {
  handle: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  description: string;
  concerns: string[];
  collection?: string;
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

function ProductRecommendationCard({ product }: { product: RecommendedProduct }) {
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block bg-[#FAFAF8] border border-[#E8E4DC] rounded-2xl overflow-hidden hover:border-[#9E6B73]/40 transition-all duration-300 hover:shadow-lg"
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
          <div className="absolute top-2 left-2 bg-[#9E6B73] text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
            Sale
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#9E6B73] transition-colors line-clamp-2 mb-1">
          {product.title}
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-[#1A1A1A]">{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-[#666666] line-through">{product.compareAtPrice}</span>
          )}
        </div>
        <p className="text-xs text-[#666666] leading-relaxed line-clamp-2 mb-3">
          {product.reason}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#9E6B73] group-hover:underline">
          View Product <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function ProductRecommendations({ output }: { output: ToolOutput }) {
  return (
    <div className="bg-[#FAFAF8] border border-[#E8E4DC] rounded-2xl p-6 max-w-full">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#9E6B73]" />
        <h3 className="text-xs uppercase tracking-widest text-[#9E6B73] font-medium">
          Your Personalized Recommendations
        </h3>
      </div>
      
      {output.assessedType && (
        <p className="text-sm text-[#666666] mb-4">
          Skin type: <span className="font-medium text-[#1A1A1A]">{output.assessedType}</span>
          {output.concerns.length > 0 && (
            <> &middot; Concerns: <span className="font-medium text-[#1A1A1A]">{output.concerns.join(', ')}</span></>
          )}
        </p>
      )}
      
      {output.products && output.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {output.products.map((product) => (
            <ProductRecommendationCard key={product.handle} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#666666] mb-4">
          Based on your profile, we are preparing recommendations for you.
        </p>
      )}
      
      {output.routineSummary && (
        <div className="border-t border-[#E8E4DC] pt-4 mt-2">
          <h4 className="text-xs uppercase tracking-wider text-[#9E6B73] font-medium mb-2">Routine Summary</h4>
          <p className="text-sm text-[#666666] leading-relaxed">{output.routineSummary}</p>
        </div>
      )}
    </div>
  );
}

export default function SkinConsultPage() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/consult/chat',
      body: { consultType: 'skin' },
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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur-xl border-b border-[#E8E4DC]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/consult" 
            className="flex items-center gap-2 text-[#666666] hover:text-[#9E6B73] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Back</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#9E6B73] flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[#1A1A1A] font-medium text-sm">Skin Analysis</h1>
              <p className="text-[#9B9B9B] text-xs">Powered by AI</p>
            </div>
          </div>
          
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-[#666666] hover:text-[#9E6B73] transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Restart</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#9E6B73]/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#9E6B73]" />
              </div>
              <h2 className="text-2xl font-serif text-[#1A1A1A] mb-3">
                Ready for Your Skin Analysis
              </h2>
              <p className="text-[#666666] max-w-md mx-auto mb-8 leading-relaxed">
                Tell me about your skin. What is your biggest concern right now? 
                I will ask a few questions to understand your skin better, then recommend products from our collection.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Acne & breakouts', 'Aging concerns', 'Dry skin', 'Oily skin', 'Sensitive skin', 'Dark spots'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(`My main concern is ${suggestion.toLowerCase()}`);
                    }}
                    className="px-4 py-2 bg-white border border-[#E8E4DC] rounded-full text-sm text-[#666666] hover:border-[#9E6B73]/50 hover:text-[#1A1A1A] transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                
                return (
                  <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-[#1A1A1A]' 
                        : 'bg-[#9E6B73]'
                    }`}>
                      {isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end flex flex-col' : ''}`}>
                      {message.parts.map((part, index) => {
                        if (part.type === 'text' && part.text) {
                          return (
                            <div key={index} className={`inline-block p-4 rounded-2xl ${
                              isUser 
                                ? 'bg-[#1A1A1A] text-white' 
                                : 'bg-white border border-[#E8E4DC] text-[#1A1A1A]/90'
                            }`}>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{part.text}</p>
                            </div>
                          );
                        }
                        
                        if (part.type === 'tool-recommendProducts' && part.state === 'output-available') {
                          return (
                            <ProductRecommendations key={index} output={part.output as ToolOutput} />
                          );
                        }
                        
                        if (part.type === 'tool-recommendProducts' && (part.state === 'input-available' || part.state === 'input-streaming')) {
                          return (
                            <div key={index} className="bg-white border border-[#E8E4DC] rounded-2xl p-4">
                              <div className="flex items-center gap-2 text-[#9E6B73]">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Finding the best products for you...</span>
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && !messages[messages.length - 1]?.parts?.some(p => p.type === 'tool-recommendProducts') && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#9E6B73] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-[#9E6B73] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#9E6B73] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#9E6B73] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur-xl border-t border-[#E8E4DC]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your skin..."
              className="flex-1 bg-white border border-[#E8E4DC] rounded-full px-5 py-3 text-[#1A1A1A] text-sm placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#9E6B73]/50 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 bg-[#9E6B73] rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6B5B4F] transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-center gap-4 mt-3">
            <p className="text-[#9B9B9B] text-[11px]">
              AI-powered recommendations from your CrazyGels product catalog
            </p>
            <Link
              href="/recommendations"
              className="text-[11px] text-[#9E6B73] hover:underline whitespace-nowrap"
            >
              Browse All Matches
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
