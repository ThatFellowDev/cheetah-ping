'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageCircle, X, Send, Radar } from 'lucide-react';

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: chatTransport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput('');
  }

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground shadow-lg transition-all hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] hover:scale-105 sm:h-14 sm:w-14"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end sm:inset-auto sm:bottom-5 sm:right-5">
          {/* Backdrop on mobile */}
          <div
            className="absolute inset-0 bg-black/50 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative flex h-full w-full flex-col overflow-hidden border border-white/10 bg-background sm:h-[500px] sm:w-96 sm:rounded-2xl sm:shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-amber-400" />
                <span className="font-heading text-sm font-semibold">
                  Cheetah Ping Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Radar className="mb-3 h-8 w-8 text-amber-400/60" />
                  <p className="text-sm font-medium text-foreground">
                    How can I help?
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ask me about monitors, selectors, alerts, billing, or
                    anything else about Cheetah Ping.
                  </p>
                </div>
              )}

              {messages.map((message) => {
                const text = message.parts
                  .filter(
                    (p): p is { type: 'text'; text: string } =>
                      p.type === 'text'
                  )
                  .map((p) => p.text)
                  .join('');
                if (!text) return null;
                return (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground'
                          : 'bg-white/5 text-foreground'
                      }`}
                    >
                      {text}
                    </div>
                  </div>
                );
              })}

              {isLoading && messages.at(-1)?.role !== 'assistant' && (
                <div className="mb-3 flex justify-start">
                  <div className="rounded-2xl bg-white/5 px-3.5 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  Something went wrong. Please try again.
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground transition-all hover:shadow-[0_0_12px_oklch(0.78_0.16_75_/_30%)] disabled:opacity-40 disabled:hover:shadow-none"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
