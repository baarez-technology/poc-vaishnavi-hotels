import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain,
  Users,
  MessageSquare,
  TrendingUp,
  Heart,
  Gift,
  Target,
  Sparkles,
  Mic,
  Send,
  X,
  Trash2,
  ChevronRight,
  UserCheck,
  Award,
  DollarSign,
  Mail,
  RefreshCw
} from 'lucide-react';
import { adminAIService, AdminAIChatResponse } from '../../../api/services/admin-ai.service';
import VoiceRecorderModal from '../../../components/admin-panel/ai/VoiceRecorderModal';

/**
 * Simple Markdown renderer for AI messages
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const processInlineMarkdown = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.substring(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={key++} className="font-bold text-neutral-900">{boldMatch[1]}</strong>);
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-1 my-2 ml-2">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={elements.length} className="list-decimal list-inside space-y-1 my-2 ml-2">
            {listItems}
          </ol>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (/^[-•]\s+/.test(trimmedLine)) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      const content = trimmedLine.replace(/^[-•]\s+/, '');
      listItems.push(
        <li key={listItems.length} className="text-neutral-700">
          {processInlineMarkdown(content)}
        </li>
      );
      return;
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      const content = trimmedLine.replace(/^\d+\.\s+/, '');
      listItems.push(
        <li key={listItems.length} className="text-neutral-700">
          {processInlineMarkdown(content)}
        </li>
      );
      return;
    }

    flushList();

    if (trimmedLine === '') {
      elements.push(<div key={elements.length} className="h-2" />);
      return;
    }

    elements.push(
      <p key={elements.length} className="text-neutral-700">
        {processInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  queryResults?: Array<Record<string, unknown>>;
  suggestions?: string[];
  pendingAction?: {
    action_id: string;
    action_type: string;
    description: string;
    params: Record<string, unknown>;
  };
}

// CRM-specific quick actions
const CRM_QUICK_ACTIONS = [
  { label: 'VIP Guests', action: 'Show me all VIP guests', icon: Award },
  { label: 'Loyalty Stats', action: 'What are our loyalty program statistics?', icon: Heart },
  { label: 'High LTV Guests', action: 'List guests with highest lifetime value', icon: DollarSign },
  { label: 'Repeat Visitors', action: 'How many repeat guests do we have?', icon: RefreshCw },
  { label: 'Guest Segments', action: 'Show guest segments breakdown', icon: Target },
  { label: 'Recent Feedback', action: 'Show recent guest feedback', icon: MessageSquare },
];

// Suggested prompts for CRM
const CRM_SUGGESTIONS = [
  "Which guests have the highest lifetime value?",
  "Show me guests who haven't visited in 6 months",
  "What's our guest retention rate?",
  "List all corporate guests",
  "Which loyalty tier has the most members?",
  "Show me guest birthday celebrations this month",
  "Analyze guest spending patterns",
  "Which guests should we send a re-engagement campaign?",
];

export default function CRMAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => adminAIService.generateSessionId());
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to AI
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await adminAIService.chat({
        message: text.trim(),
        session_id: sessionId,
        context: {
          currentPage: 'CRM AI',
          previousMessages: messages.slice(-5).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        }
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString(),
        intent: response.intent,
        confidence: response.confidence,
        queryResults: response.query_results,
        suggestions: response.suggestions,
        pendingAction: response.pending_action
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, messages]);

  // Handle action confirmation
  const handleConfirmAction = useCallback(async () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.pendingAction) return;

    setIsExecutingAction(true);

    try {
      const response = await adminAIService.executeAction(lastMessage.pendingAction.action_id);

      const resultMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString(),
        queryResults: response.query_results
      };

      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      console.error('Action execution error:', error);
    } finally {
      setIsExecutingAction(false);
    }
  }, [messages]);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setIsVoiceModalOpen(false);
    if (transcript) {
      sendMessage(transcript);
    }
  }, [sendMessage]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(adminAIService.generateSessionId());
  }, []);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="h-full flex flex-col max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 px-10 py-6 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ocean-500 via-sage-600 to-terra-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">CRM AI Assistant</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Intelligent guest relationship insights powered by AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="inline-flex items-center justify-center h-9 px-4 text-sm gap-2 rounded-lg font-semibold text-terra-600 bg-white border border-terra-200 hover:bg-terra-50 hover:border-terra-300 active:bg-terra-100 transition-all duration-150 ease-out active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Quick Actions & Stats */}
          <div className="w-72 flex-shrink-0 border-r border-neutral-200 bg-white/50 p-6 overflow-y-auto">
            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {CRM_QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(action.action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-terra-50 hover:border-terra-300 transition-all group active:scale-[0.98]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-terra-50 flex items-center justify-center group-hover:bg-terra-100 transition-colors">
                        <Icon className="w-4 h-4 text-terra-600" />
                      </div>
                      <span className="flex-1 text-left">{action.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CRM Stats Summary */}
            <div className="mb-6">
              <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                CRM Overview
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-[10px] border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-terra-600" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Total Guests</span>
                  </div>
                  <p className="text-xl font-bold text-neutral-900">2,847</p>
                </div>
                <div className="p-4 bg-white rounded-[10px] border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Loyalty Members</span>
                  </div>
                  <p className="text-xl font-bold text-neutral-900">1,234</p>
                </div>
                <div className="p-4 bg-white rounded-[10px] border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-gold-500" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">VIP Guests</span>
                  </div>
                  <p className="text-xl font-bold text-neutral-900">156</p>
                </div>
                <div className="p-4 bg-white rounded-[10px] border border-neutral-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-sage-600" />
                    <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Avg LTV</span>
                  </div>
                  <p className="text-xl font-bold text-sage-600">$4,250</p>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">
                AI Capabilities
              </h3>
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>Guest segmentation analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>Loyalty program insights</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>LTV predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>Churn risk detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>Campaign recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                  <span>Voice commands (Whisper)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                // Welcome state
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-ocean-500 via-sage-600 to-terra-600 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    CRM AI Assistant
                  </h2>
                  <p className="text-neutral-500 text-center max-w-md mb-8">
                    Ask me anything about your guests, loyalty program, or customer relationships. I can analyze data, find insights, and help you make better decisions.
                  </p>

                  {/* Suggested prompts */}
                  <div className="w-full max-w-2xl">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3 text-center">
                      Try asking...
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {CRM_SUGGESTIONS.slice(0, 6).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(suggestion)}
                          className="px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-terra-50 hover:border-terra-300 transition-all text-left active:scale-[0.98]"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Messages list
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-[16px] px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-terra-600 to-terra-700 text-white'
                            : 'bg-white border border-neutral-200 text-neutral-800'
                        }`}
                      >
                        <div className="text-sm">
                          {message.type === 'ai' ? renderMarkdown(message.text) : message.text}
                        </div>

                        {/* Query Results */}
                        {message.queryResults && message.queryResults.length > 0 && (
                          <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                              Results ({message.queryResults.length})
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {message.queryResults.slice(0, 5).map((result, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs bg-white p-2 rounded-lg border border-neutral-100"
                                >
                                  {Object.entries(result).slice(0, 4).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                      <span className="text-neutral-500">{key}:</span>
                                      <span className="text-neutral-700 font-medium">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Action */}
                        {message.pendingAction && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-2">
                              Confirm Action
                            </p>
                            <p className="text-xs text-amber-600 mb-3">
                              {message.pendingAction.description}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleConfirmAction}
                                disabled={isExecutingAction}
                                className="inline-flex items-center justify-center h-7 px-3 text-xs gap-1.5 rounded-lg font-semibold text-white bg-sage-600 hover:bg-sage-700 active:bg-sage-800 transition-all duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                              >
                                {isExecutingAction ? 'Executing...' : 'Confirm'}
                              </button>
                              <button
                                className="inline-flex items-center justify-center h-7 px-3 text-xs gap-1.5 rounded-lg font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-all duration-150 ease-out active:scale-[0.98]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => sendMessage(suggestion)}
                                className="inline-flex items-center justify-center h-7 px-3 text-xs gap-1.5 rounded-lg font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 transition-all duration-150 ease-out active:scale-[0.98]"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-white/70' : 'text-neutral-400'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-neutral-200 rounded-[16px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-terra-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-terra-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-terra-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-neutral-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-6 border-t border-neutral-200 bg-white">
              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about guests, loyalty, segments, or any CRM data..."
                    rows={1}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/40 focus:ring-offset-2 focus:border-terra-500 resize-none transition-all duration-150"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>

                {/* Voice button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 transition-all duration-150 ease-out active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/40 focus-visible:ring-offset-2"
                  title="Voice input (Whisper AI)"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-terra-600 to-terra-700 hover:from-terra-700 hover:to-terra-800 text-white transition-all duration-150 ease-out disabled:opacity-50 disabled:pointer-events-none active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500/40 focus-visible:ring-offset-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              <p className="text-[10px] text-neutral-400 text-center mt-3">
                Powered by Glimmora AI with Whisper voice transcription
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptReady={handleVoiceTranscript}
      />
    </div>
  );
}
