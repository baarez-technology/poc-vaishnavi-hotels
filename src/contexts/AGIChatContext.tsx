/**
 * AGI Chat Context
 * Advanced context for the AGI Guest Assistant with voice support
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  agiAssistantService,
  AGIChatResponse,
  QuickAction,
} from '@/api/services/agi-assistant.service';

// ============== Types ==============

export interface AGIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  quickActions?: QuickAction[];
  taskInfo?: {
    taskId: number;
    taskType: string;
    status?: string;
  };
  actionResult?: Record<string, unknown>;
  isVoice?: boolean;
  isError?: boolean;
  // V2 AGI fields
  requiresOtp?: boolean;
  otpEmail?: string;
  showLoginPrompt?: boolean;
  bookingCreated?: number;
}

export interface GuestContext {
  sessionId: string;
  guestName?: string;
  roomNumber?: string;
  confirmationCode?: string;
  isCheckedIn?: boolean;
  checkOutDate?: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  emotion?: string;
  guestStatus?: 'anonymous' | 'registered' | 'booked' | 'checked_in' | 'checked_out';
}

interface AGIChatContextType {
  messages: AGIMessage[];
  isOpen: boolean;
  isTyping: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  unreadCount: number;
  sessionId: string | null;
  guestContext: GuestContext | null;
  voiceEnabled: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearHistory: () => void;
  setGuestContext: (context: Partial<GuestContext>) => void;
  handleQuickAction: (action: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  playResponse: (text: string) => Promise<void>;
  stopAudio: () => void;
}

const AGIChatContext = createContext<AGIChatContextType | undefined>(undefined);

export const useAGIChat = () => {
  const context = useContext(AGIChatContext);
  if (!context) {
    throw new Error('useAGIChat must be used within an AGIChatProvider');
  }
  return context;
};

// ============== Constants ==============

const AGI_CHAT_STORAGE_KEY = 'glimmora_agi_chat_history';
const AGI_SESSION_ID_KEY = 'glimmora_agi_session_id';
const AGI_CONTEXT_KEY = 'glimmora_agi_context';
const VOICE_ENABLED_KEY = 'glimmora_agi_voice_enabled';
const CACHE_VERSION_KEY = 'glimmora_agi_cache_version';
const CURRENT_CACHE_VERSION = '2.1'; // Increment to clear corrupted cache

// Validate message content to detect corruption
const isValidMessage = (msg: AGIMessage): boolean => {
  if (!msg || typeof msg.content !== 'string') return false;
  // Check for known corruption patterns (e.g., speech recognition artifacts)
  if (msg.content.includes('it is improper')) return false;
  if (msg.content.length === 0 && msg.type === 'assistant') return false;
  return true;
};

// ============== Provider ==============

interface AGIChatProviderProps {
  children: ReactNode;
}

export const AGIChatProvider = ({ children }: AGIChatProviderProps) => {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<AGIMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [guestContext, setGuestContextState] = useState<GuestContext | null>(null);
  const [voiceEnabled, setVoiceEnabledState] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize session ID
  useEffect(() => {
    const savedSessionId = localStorage.getItem(AGI_SESSION_ID_KEY);
    if (savedSessionId) {
      sessionIdRef.current = savedSessionId;
    } else {
      const newSessionId = `agi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionIdRef.current = newSessionId;
      localStorage.setItem(AGI_SESSION_ID_KEY, newSessionId);
    }

    // Load voice preference
    const voicePref = localStorage.getItem(VOICE_ENABLED_KEY);
    if (voicePref) {
      setVoiceEnabledState(voicePref === 'true');
    }
  }, []);

  // Load saved state
  useEffect(() => {
    // Check cache version - clear if outdated to fix any corrupted messages
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (cachedVersion !== CURRENT_CACHE_VERSION) {
      console.log('Cache version mismatch, clearing old messages');
      localStorage.removeItem(AGI_CHAT_STORAGE_KEY);
      localStorage.removeItem(AGI_CONTEXT_KEY);
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
      showWelcomeMessage();
      return;
    }

    // Load guest context
    const savedContext = localStorage.getItem(AGI_CONTEXT_KEY);
    if (savedContext) {
      try {
        setGuestContextState(JSON.parse(savedContext));
      } catch (e) {
        console.error('Error parsing saved context:', e);
      }
    }

    // Load messages from localStorage
    const savedMessages = localStorage.getItem(AGI_CHAT_STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Filter out any corrupted messages
        const validMessages = parsed
          .map((msg: AGIMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
          .filter((msg: AGIMessage) => isValidMessage(msg));
        
        if (validMessages.length !== parsed.length) {
          console.warn('Filtered out corrupted messages:', parsed.length - validMessages.length);
        }
        
        if (validMessages.length > 0) {
          setMessages(validMessages);
        } else {
          showWelcomeMessage();
        }
      } catch (e) {
        console.error('Error parsing saved messages:', e);
        showWelcomeMessage();
      }
    } else {
      showWelcomeMessage();
    }
  }, [isAuthenticated]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(AGI_CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save guest context
  useEffect(() => {
    if (guestContext) {
      localStorage.setItem(AGI_CONTEXT_KEY, JSON.stringify(guestContext));
    }
  }, [guestContext]);

  // Unread count management
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'assistant') {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const showWelcomeMessage = () => {
    const guestName = user?.first_name || guestContext?.guestName || 'there';
    const isLoggedIn = isAuthenticated;
    const hasBooking = guestContext?.guestStatus === 'booked' || guestContext?.guestStatus === 'checked_in';

    let content = `Hello ${guestName}! I'm Aria, your AI concierge at Glimmora Hotel & Suites.\n\n`;
    content += `I can help you with:\n`;
    content += `• 📅 Make a reservation (with email verification)\n`;
    content += `• 🏨 View & manage your bookings\n`;
    content += `• ✈️ Pre-check-in & room selection\n`;
    content += `• 👤 Profile & loyalty rewards\n`;

    if (hasBooking) {
      content += `• 🛎️ Housekeeping & room service\n`;
      content += `• 🔧 Maintenance requests\n`;
      content += `• 📶 WiFi & amenity info\n`;
    }

    content += `• ❓ Hotel information & FAQs\n\n`;
    content += `You can type or use voice commands. How may I assist you today?`;

    // Build quick actions based on user status
    const quickActions: QuickAction[] = [];
    if (!isLoggedIn) {
      quickActions.push({ label: 'Book a Room', action: 'I want to book a room' });
    } else {
      quickActions.push({ label: 'My Bookings', action: 'Show my bookings' });
      quickActions.push({ label: 'Book a Room', action: 'I want to book a room' });
    }
    if (hasBooking) {
      quickActions.push({ label: 'Pre-Check-in', action: 'I want to do pre-check-in' });
    }
    quickActions.push({ label: 'Hotel Info', action: 'What amenities do you offer?' });

    const welcomeMessage: AGIMessage = {
      id: `welcome_${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
      quickActions,
    };
    setMessages([welcomeMessage]);
  };

  const addMessage = useCallback((message: Omit<AGIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AGIMessage = {
      ...message,
      id: `${message.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    addMessage({
      type: 'user',
      content: content.trim(),
    });

    setIsTyping(true);

    try {
      const response = await agiAssistantService.chat({
        message: content.trim(),
        session_id: sessionIdRef.current || undefined,
        room_number: guestContext?.roomNumber,
        booking_number: guestContext?.confirmationCode,
      });

      // Update session ID if returned
      if (response.session_id && response.session_id !== sessionIdRef.current) {
        sessionIdRef.current = response.session_id;
        localStorage.setItem(AGI_SESSION_ID_KEY, response.session_id);
      }

      // Update guest context if returned
      if (response.guest_context) {
        updateGuestContextFromResponse(response.guest_context);
      }

      // Build assistant message
      const assistantMessage: Omit<AGIMessage, 'id' | 'timestamp'> = {
        type: 'assistant',
        content: response.message,
        intent: response.intent,
        confidence: response.confidence,
        quickActions: response.quick_actions,
        taskInfo: response.task_id
          ? {
              taskId: response.task_id,
              taskType: response.task_type || 'service',
              status: 'created',
            }
          : undefined,
        actionResult: response.action_result,
        // V2 AGI fields
        requiresOtp: response.requires_otp,
        otpEmail: response.otp_email,
        showLoginPrompt: response.show_login_prompt,
        bookingCreated: response.booking_created,
      };

      // Update guest context with loyalty info
      if (response.loyalty_points !== undefined || response.loyalty_tier || response.guest_status) {
        setGuestContextState((prev) => ({
          sessionId: sessionIdRef.current || '',
          ...prev,
          loyaltyPoints: response.loyalty_points ?? prev?.loyaltyPoints,
          loyaltyTier: response.loyalty_tier ?? prev?.loyaltyTier,
          guestStatus: response.guest_status ?? prev?.guestStatus,
        }));
      }

      addMessage(assistantMessage);

      // Auto-play voice response if enabled
      if (voiceEnabled && response.voice_response_available) {
        playResponse(response.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        type: 'assistant',
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again or contact our front desk at extension 0.",
        isError: true,
        quickActions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Contact Front Desk', action: 'front_desk' },
        ],
      });
    } finally {
      setIsTyping(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setIsRecording(false);
    setIsTyping(true);

    try {
      // Convert blob to base64
      const base64Audio = await agiAssistantService.blobToBase64(audioBlob);

      // Get audio format from blob type
      const format = audioBlob.type.includes('webm')
        ? 'webm'
        : audioBlob.type.includes('ogg')
        ? 'ogg'
        : 'webm';

      // Add placeholder for voice message
      const voiceMessageId = addMessage({
        type: 'user',
        content: '🎤 Voice message...',
        isVoice: true,
      });

      // Send voice request
      const response = await agiAssistantService.voiceChat({
        audio_base64: base64Audio,
        audio_format: format,
        session_id: sessionIdRef.current || undefined,
        room_number: guestContext?.roomNumber,
        booking_number: guestContext?.confirmationCode,
      });

      // Update user message with transcription (from context)
      // The AGI processes the transcription internally

      // Update session ID
      if (response.session_id) {
        sessionIdRef.current = response.session_id;
        localStorage.setItem(AGI_SESSION_ID_KEY, response.session_id);
      }

      // Update guest context
      if (response.guest_context) {
        updateGuestContextFromResponse(response.guest_context);
      }

      // Add assistant response
      addMessage({
        type: 'assistant',
        content: response.message,
        intent: response.intent,
        confidence: response.confidence,
        quickActions: response.quick_actions,
        taskInfo: response.task_id
          ? {
              taskId: response.task_id,
              taskType: response.task_type || 'service',
              status: 'created',
            }
          : undefined,
        actionResult: response.action_result,
      });

      // Auto-play response
      if (voiceEnabled) {
        playResponse(response.message);
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      addMessage({
        type: 'assistant',
        content: "I couldn't process your voice message. Please try again or type your request.",
        isError: true,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const updateGuestContextFromResponse = (context: Record<string, unknown>) => {
    setGuestContextState((prev) => ({
      sessionId: sessionIdRef.current || '',
      ...prev,
      guestName: (context.guest_name as string) || prev?.guestName,
      roomNumber: (context.room_number as string) || prev?.roomNumber,
      confirmationCode: (context.confirmation_code as string) || prev?.confirmationCode,
      isCheckedIn: (context.is_checked_in as boolean) || prev?.isCheckedIn,
      checkOutDate: (context.check_out_date as string) || prev?.checkOutDate,
      loyaltyTier: (context.loyalty_tier as string) || prev?.loyaltyTier,
      emotion: (context.emotion as string) || prev?.emotion,
    }));
  };

  const playResponse = async (text: string) => {
    if (!voiceEnabled) return;

    try {
      setIsPlayingAudio(true);

      const response = await agiAssistantService.textToSpeech({
        text,
        voice: 'nova', // Friendly female voice
        speed: 1.0,
      });

      if (response.audio_base64) {
        await agiAssistantService.playAudioFromBase64(response.audio_base64, response.audio_format);
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  const handleQuickAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'retry':
          const lastUserMessage = [...messages].reverse().find((m) => m.type === 'user');
          if (lastUserMessage) {
            sendMessage(lastUserMessage.content);
          }
          break;
        case 'front_desk':
          addMessage({
            type: 'assistant',
            content:
              "You can reach our front desk at:\n\n• Phone: Extension 0 from your room\n• Direct Line: +1 (555) 123-4567\n• Available 24/7\n\nWould you like me to help with anything else?",
          });
          break;
        default:
          sendMessage(action);
      }
    },
    [messages, sendMessage, addMessage]
  );

  const toggleChat = () => setIsOpen((prev) => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const clearHistory = async () => {
    stopAudio();

    // Clear on server
    if (sessionIdRef.current) {
      try {
        await agiAssistantService.clearContext(sessionIdRef.current);
      } catch (e) {
        console.error('Error clearing server context:', e);
      }
    }

    // Clear local state
    setMessages([]);
    setGuestContextState(null);

    // Clear localStorage
    localStorage.removeItem(AGI_CHAT_STORAGE_KEY);
    localStorage.removeItem(AGI_CONTEXT_KEY);
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);

    // Generate new session
    const newSessionId = `agi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = newSessionId;
    localStorage.setItem(AGI_SESSION_ID_KEY, newSessionId);

    // Show welcome message
    showWelcomeMessage();
  };

  const setGuestContext = (context: Partial<GuestContext>) => {
    setGuestContextState((prev) => ({
      sessionId: sessionIdRef.current || '',
      ...prev,
      ...context,
    }));
  };

  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    localStorage.setItem(VOICE_ENABLED_KEY, String(enabled));
  };

  return (
    <AGIChatContext.Provider
      value={{
        messages,
        isOpen,
        isTyping,
        isRecording,
        isPlayingAudio,
        unreadCount,
        sessionId: sessionIdRef.current,
        guestContext,
        voiceEnabled,
        sendMessage,
        sendVoiceMessage,
        toggleChat,
        openChat,
        closeChat,
        clearHistory,
        setGuestContext,
        handleQuickAction,
        setVoiceEnabled,
        playResponse,
        stopAudio,
      }}
    >
      {children}
    </AGIChatContext.Provider>
  );
};
