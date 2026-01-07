import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles } from 'lucide-react';

/**
 * AI Prompt Bar Component
 * Bottom input bar for typing messages to AI
 */
interface AIPromptBarProps {
  onSendMessage: (message: string) => void;
  onVoiceClick: () => void;
  isListening: boolean;
  hasMessages?: boolean;
}

export default function AIPromptBar({ onSendMessage, onVoiceClick, isListening, hasMessages = false }: AIPromptBarProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Handle send
  const handleSend = () => {
    if (input.trim().length === 0) return;

    onSendMessage(input);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle key down
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Focus input when component mounts or when conversation starts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="flex-shrink-0 border-t border-[#A57865]/20 bg-gradient-to-br from-white via-[#FAF8F6] to-white p-5 rounded-b-3xl">
      <div className="flex items-end gap-3">
        {/* Voice button */}
        <button
          onClick={onVoiceClick}
          className={`group relative flex-shrink-0 p-3.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${
            isListening
              ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white scale-105 shadow-lg'
              : 'bg-white hover:bg-gradient-to-br hover:from-[#A57865]/10 hover:to-[#CDB261]/10 text-neutral-600 hover:text-[#A57865] border border-neutral-200 hover:border-[#A57865]/40'
          }`}
          title={isListening ? 'Stop recording' : 'Voice input'}
        >
          <Mic className={`w-5 h-5 transition-transform ${isListening ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`} />
          {isListening && (
            <div className="absolute inset-0 rounded-xl bg-rose-400 animate-ping opacity-25"></div>
          )}
        </button>

        {/* Input field wrapper */}
        <div className="flex-1 relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Glimmora anything about your hotel..."
              rows={1}
              className={`w-full px-5 py-4 pr-14 bg-gradient-to-r from-white to-[#FAF8F6] rounded-xl resize-none focus:outline-none text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-300 ${
                isFocused
                  ? 'ring-2 ring-[#A57865]/50 shadow-lg'
                  : 'ring-1 ring-neutral-200 hover:ring-[#A57865]/30 shadow-sm hover:shadow'
              }`}
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />

            {/* AI Icon indicator */}
            <div className={`absolute right-4 top-4 transition-all duration-300 ${
              isFocused ? 'scale-110 rotate-12' : ''
            }`}>
              <Sparkles className={`w-5 h-5 transition-colors ${
                isFocused ? 'text-[#A57865]' : 'text-[#A57865]/60'
              }`} />
            </div>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={input.trim().length === 0}
          className={`group relative flex-shrink-0 p-3.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg ${
            input.trim().length > 0
              ? 'bg-gradient-to-br from-[#A57865] via-[#8E6554] to-[#A57865] text-white hover:scale-105 hover:-translate-y-0.5 cursor-pointer'
              : 'bg-neutral-100 text-neutral-300 cursor-not-allowed border border-neutral-200'
          }`}
          title="Send message"
        >
          <Send className={`w-5 h-5 transition-transform ${
            input.trim().length > 0 ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''
          }`} />

          {/* Shine effect on hover */}
          {input.trim().length > 0 && (
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-700"></div>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Enhanced hint text */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-xs text-neutral-500 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded-md text-[10px] font-semibold text-neutral-600 shadow-sm">Enter</kbd>
            <span>to send</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white border border-neutral-200 rounded-md text-[10px] font-semibold text-neutral-600 shadow-sm">Shift + Enter</kbd>
            <span>for new line</span>
          </span>
        </p>

        {/* Character count when typing */}
        {input.length > 0 && (
          <span className={`text-xs font-medium transition-colors ${
            input.length > 500 ? 'text-orange-500' : 'text-neutral-400'
          }`}>
            {input.length}
          </span>
        )}
      </div>
    </div>
  );
}
