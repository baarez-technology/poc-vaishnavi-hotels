import React from 'react';
import { BarChart3, Building2, Star, TrendingUp, Zap } from 'lucide-react';
import AIMessage from './AIMessage';

/**
 * AI Conversation Component
 * Glimmora Design System v5.0 - Clean, no gradients
 */
export default function AIConversation({ messages, isTyping, conversationEndRef, onSendMessage }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-[#F9F7F7]">
      {/* Welcome message when no messages */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-start h-full text-center px-4 pt-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-terra-500 flex items-center justify-center mb-5">
            <Zap className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-neutral-900 tracking-tight mb-2">
            Welcome to Glimmora AI
          </h3>
          <p className="text-[13px] text-neutral-500 max-w-sm mb-8">
            Your intelligent assistant for hotel management. Ask me anything about revenue, guests, operations, or analytics.
          </p>

          {/* Try Asking Section */}
          <div className="w-full max-w-md">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 text-left">
              Try asking
            </p>
            <div className="space-y-2">
              {/* Example 1: Revenue */}
              <button
                onClick={() => onSendMessage("Show me today's revenue breakdown")}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-neutral-50 transition-all border border-neutral-200 hover:border-neutral-300 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-50 transition-colors">
                  <BarChart3 className="w-4 h-4 text-neutral-600 group-hover:text-terra-600 transition-colors" />
                </div>
                <span className="text-[13px] font-medium text-neutral-700">"Show me today's revenue breakdown"</span>
              </button>

              {/* Example 2: Occupancy */}
              <button
                onClick={() => onSendMessage("What's our current occupancy?")}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-neutral-50 transition-all border border-neutral-200 hover:border-neutral-300 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-50 transition-colors">
                  <Building2 className="w-4 h-4 text-neutral-600 group-hover:text-terra-600 transition-colors" />
                </div>
                <span className="text-[13px] font-medium text-neutral-700">"What's our current occupancy?"</span>
              </button>

              {/* Example 3: Reviews */}
              <button
                onClick={() => onSendMessage("How are our guest reviews?")}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-neutral-50 transition-all border border-neutral-200 hover:border-neutral-300 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-50 transition-colors">
                  <Star className="w-4 h-4 text-neutral-600 group-hover:text-terra-600 transition-colors" />
                </div>
                <span className="text-[13px] font-medium text-neutral-700">"How are our guest reviews?"</span>
              </button>

              {/* Example 4: Performance */}
              <button
                onClick={() => onSendMessage("Generate a performance report")}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-neutral-50 transition-all border border-neutral-200 hover:border-neutral-300 text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-50 transition-colors">
                  <TrendingUp className="w-4 h-4 text-neutral-600 group-hover:text-terra-600 transition-colors" />
                </div>
                <span className="text-[13px] font-medium text-neutral-700">"Generate a performance report"</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <AIMessage key={message.id} message={message} />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-terra-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col max-w-[80%]">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-semibold text-terra-600">Glimmora AI</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white border border-neutral-200">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-terra-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-terra-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-terra-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invisible div for auto-scroll */}
      <div ref={conversationEndRef} />
    </div>
  );
}
