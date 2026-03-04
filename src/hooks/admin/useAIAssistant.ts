import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAIAgent } from './useAIAgent';
import { adminAIService, AdminAIChatResponse, PendingAction } from '@/api/services/admin-ai.service';

// Message type with extended properties
interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
  data?: Record<string, unknown> | null;
  intent?: string;
  confidence?: number;
  queryResults?: Array<Record<string, unknown>>;
  queryMetadata?: Record<string, unknown>;
  pendingAction?: PendingAction;
  actionResult?: Record<string, unknown>;
  suggestions?: string[];
}

/**
 * Glimmora AI Assistant Hook
 * Manages AI conversation, panel state, and voice recording
 * Now powered by backend Admin AI with secure database access
 */
export function useAIAssistant() {
  // AI Agent (NLP + Command Router + Voice) - kept for voice features
  const aiAgent = useAIAgent();

  // Current page context for multi-agent auto-fill
  const location = useLocation();

  // State
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // New state for Admin AI
  const [sessionId, setSessionId] = useState<string>(() => adminAIService.generateSessionId());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [queryResults, setQueryResults] = useState<Array<Record<string, unknown>> | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [useBackendAI, setUseBackendAI] = useState(true); // Toggle between backend and local AI

  // Refs
  const conversationEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /**
   * Extract enriched session context from the current page URL.
   * The multi-agent Parameter Agent uses this for auto-fill.
   */
  const getSessionContext = useCallback(() => {
    const path = location.pathname;
    const context: Record<string, unknown> = {
      currentPage: path,
    };

    // Detect module from URL
    if (path.includes('/bookings')) context.currentModule = 'bookings';
    else if (path.includes('/rooms')) context.currentModule = 'rooms';
    else if (path.includes('/housekeeping')) context.currentModule = 'housekeeping';
    else if (path.includes('/maintenance')) context.currentModule = 'maintenance';
    else if (path.includes('/guests')) context.currentModule = 'guests';
    else if (path.includes('/staff')) context.currentModule = 'staff';
    else if (path.includes('/revenue') || path.includes('/analytics')) context.currentModule = 'revenue';
    else if (path.includes('/folio')) context.currentModule = 'folio';

    // Extract IDs from URL (e.g., /admin/rooms/305, /admin/bookings/42)
    const idMatch = path.match(/\/(bookings|rooms|guests|staff)\/(\d+)/);
    if (idMatch) {
      const [, entity, id] = idMatch;
      const numId = parseInt(id, 10);
      if (entity === 'bookings') context.selectedBookingId = numId;
      else if (entity === 'rooms') context.selectedRoomId = numId;
      else if (entity === 'guests') context.selectedGuestId = numId;
      else if (entity === 'staff') context.selectedStaffId = numId;
    }

    return context;
  }, [location.pathname]);

  // Add user message to conversation and call backend AI
  const addUserMessage = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    // Build the full conversation history BEFORE the async state update
    // This avoids all stale closure issues with messages state
    setMessages(prev => {
      const updatedMessages = [...prev, userMessage];

      // Fire off the AI response with the correct history
      if (useBackendAI) {
        const sessionContext = getSessionContext();
        const previousMessages = updatedMessages.slice(-5).map(m => ({
          role: m.type === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text
        }));

        console.log('[AI Chat] Sending previousMessages:', previousMessages);

        adminAIService.chat({
          message: text.trim(),
          session_id: sessionId,
          context: {
            ...sessionContext,
            previousMessages,
            pendingAction: pendingAction ? {
              action_id: pendingAction.action_id,
              action_type: pendingAction.action_type,
              description: pendingAction.description,
              params: pendingAction.params
            } : undefined
          }
        }).then(response => {
          const aiMessage: AIMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'ai',
            text: response.message,
            intent: response.intent,
            confidence: response.confidence,
            timestamp: new Date().toISOString(),
            queryResults: response.query_results || undefined,
            queryMetadata: response.query_metadata || undefined,
            pendingAction: response.pending_action || undefined,
            actionResult: response.action_result || undefined,
            suggestions: response.suggestions || undefined
          };

          setMessages(prev2 => [...prev2, aiMessage]);
          setIsTyping(false);

          if (response.intent !== 'error') {
            if (response.query_results) setQueryResults(response.query_results);
            if (response.pending_action) setPendingAction(response.pending_action);
            if (response.suggestions) setSuggestions(response.suggestions);
          }

          if (aiAgent.isVoiceResponseEnabled()) {
            aiAgent.speakResponse(response.message);
          }
        }).catch(error => {
          console.error('Error generating backend AI response:', error);
          const errorMessage: AIMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'ai',
            text: `I'm having trouble connecting to the AI service. Please check:\n\n1. Backend server is running on port 8000\n2. You are logged in as an admin user\n3. Your session hasn't expired\n\nTry refreshing the page or logging in again.`,
            intent: 'error',
            confidence: 0,
            timestamp: new Date().toISOString()
          };
          setMessages(prev2 => [...prev2, errorMessage]);
          setIsTyping(false);
        });
      } else {
        const timeout = setTimeout(async () => {
          try {
            const result = await aiAgent.processMessage(text.trim());
            const aiMessage: AIMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'ai',
              text: result.response,
              data: result.data || null,
              intent: result.intent,
              confidence: result.confidence,
              timestamp: new Date().toISOString()
            };
            setMessages(prev2 => [...prev2, aiMessage]);
            setIsTyping(false);
            if (aiAgent.isVoiceResponseEnabled()) {
              aiAgent.speakResponse(result.response);
            }
          } catch (error) {
            console.error('Error generating AI response:', error);
            setMessages(prev2 => [...prev2, {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'ai',
              text: "I encountered an error processing your request. Please try again.",
              timestamp: new Date().toISOString()
            }]);
            setIsTyping(false);
          }
        }, 800 + Math.random() * 400);
        typingTimeoutRef.current = timeout;
      }

      return updatedMessages;
    });

    // Clear pending action state
    setPendingAction(null);
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [useBackendAI, pendingAction, sessionId, getSessionContext, aiAgent]);

  // Confirm and execute a pending action
  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;

    setIsTyping(true);
    try {
      const response = await adminAIService.executeAction(pendingAction.action_id);

      const aiMessage: AIMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        text: response.message,
        timestamp: new Date().toISOString(),
        actionResult: response.action_result || undefined
      };

      setMessages(prev => [...prev, aiMessage]);
      setPendingAction(null);
    } catch (error) {
      console.error('Error executing action:', error);

      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        text: "Failed to execute the action. Please try again.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
    setIsTyping(false);
  }, [pendingAction]);

  // Cancel a pending action
  const cancelAction = useCallback(() => {
    setPendingAction(null);

    const aiMessage: AIMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      text: "Action cancelled. Is there anything else I can help you with?",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);
  }, []);

  // Add AI message directly (for system messages)
  const addAIMessage = useCallback((text, data = null) => {
    if (!text || text.trim().length === 0) return;

    const aiMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      text: text.trim(),
      data: data,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  }, []);

  // Toggle AI panel
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  // Open AI panel
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  // Close AI panel
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // Toggle voice listening (using AI Agent's voice engine)
  const toggleListening = useCallback(() => {
    if (isListening) {
      aiAgent.voice.stopListening();
      setIsListening(false);
      setVoiceModalOpen(false);
    } else {
      setIsListening(true);
      setVoiceModalOpen(true);
      setIsPanelOpen(true);

      aiAgent.voice.startListening((transcript) => {
        // When transcription is ready, add as user message
        addUserMessage(transcript);
        setIsListening(false);
        setVoiceModalOpen(false);
      });
    }
  }, [isListening, aiAgent, addUserMessage]);

  // Start listening
  const startListening = useCallback(() => {
    setIsListening(true);
    setVoiceModalOpen(true);
    setIsPanelOpen(true);

    aiAgent.voice.startListening((transcript) => {
      addUserMessage(transcript);
      setIsListening(false);
      setVoiceModalOpen(false);
    });
  }, [aiAgent, addUserMessage]);

  // Stop listening
  const stopListening = useCallback(() => {
    aiAgent.voice.stopListening();
    setIsListening(false);
    setVoiceModalOpen(false);
  }, [aiAgent]);

  // Handle voice input (simulated or real)
  const handleVoiceInput = useCallback((transcript) => {
    if (transcript && transcript.trim().length > 0) {
      addUserMessage(transcript);
      stopListening();
    }
  }, [addUserMessage, stopListening]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear AI agent memory
    aiAgent.clearMemory();
  }, [aiAgent]);

  // Send a quick action
  const sendQuickAction = useCallback((actionLabel) => {
    const actionPrompts = {
      'Generate Report': 'Generate a comprehensive daily operations report',
      'Draft Email': 'Help me draft an email to welcome new guests',
      'Analyze Data': 'Analyze today\'s revenue and occupancy data',
      'Get Insights': 'Show me key insights and recommendations for today',
      'Schedule Task': 'What tasks should I prioritize today?',
      'Set Goal': 'Help me set performance goals for this month'
    };

    const prompt = actionPrompts[actionLabel] || actionLabel;
    addUserMessage(prompt);
  }, [addUserMessage]);

  // Send a suggestion
  const sendSuggestion = useCallback((suggestionPrompt) => {
    addUserMessage(suggestionPrompt);
  }, [addUserMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setSessionId(adminAIService.generateSessionId());
    clearConversation();
  }, [clearConversation]);

  return {
    // State
    messages,
    isPanelOpen,
    isListening,
    isTyping,
    voiceModalOpen,
    conversationEndRef,

    // New Admin AI state
    sessionId,
    pendingAction,
    queryResults,
    suggestions,
    useBackendAI,

    // Message functions
    addUserMessage,
    addAIMessage,
    clearConversation,

    // Panel functions
    togglePanel,
    openPanel,
    closePanel,

    // Voice functions
    toggleListening,
    startListening,
    stopListening,
    handleVoiceInput,

    // Quick actions
    sendQuickAction,
    sendSuggestion,

    // Action confirmation
    confirmAction,
    cancelAction,

    // Session management
    resetSession,
    setUseBackendAI,

    // AI Agent access (for advanced features)
    aiAgent,

    // Computed
    hasMessages: messages.length > 0,
    hasPendingAction: pendingAction !== null,
    hasQueryResults: queryResults !== null && queryResults.length > 0,

    // Voice engine state
    voiceTranscript: aiAgent.voice.transcript,
    voiceSupported: aiAgent.voice.isSupported
  };
}
