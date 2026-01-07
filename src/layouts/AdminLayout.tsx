import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // AI Assistant hook
  const {
    messages,
    isPanelOpen,
    isListening,
    isTyping,
    voiceModalOpen,
    conversationEndRef,
    addUserMessage,
    togglePanel,
    closePanel,
    toggleListening,
    handleVoiceInput,
    clearConversation,
    sendQuickAction,
    sendSuggestion,
    hasMessages
  } = useAIAssistant();

  // Handle AI voice button click - toggles voice recording
  const handleAIVoiceClick = () => {
    toggleListening();
  };

  // Handle AI panel toggle
  const handleAIPanelToggle = () => {
    togglePanel();
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    // Full screen wrapper - centers the frame
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100 overflow-hidden">
      {/* Fixed Frame Container: 1440px × 1024px (responsive) */}
      <div className="relative w-full max-w-[1440px] h-full max-h-[1024px] bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100 overflow-hidden flex flex-col rounded-xl">
        {/* Top Row: Sidebar Brand + Header with shared border */}
        <div className="flex flex-shrink-0">
          {/* Sidebar Brand Section - Dynamic Width */}
          <div className={`transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              renderBrandOnly={true}
            />
          </div>

          {/* Header - Takes remaining width */}
          <div className="flex-1">
            <Header
              onAIVoiceClick={handleAIVoiceClick}
              onAIPanelToggle={handleAIPanelToggle}
              onSidebarToggle={handleSidebarToggle}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </div>
        </div>

        {/* Bottom Row: Sidebar Navigation + Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar Navigation - Dynamic Width */}
          <aside className={`h-full flex-shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              renderNavigationOnly={true}
            />
          </aside>

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100">
            <Outlet />
          </main>
        </div>

        {/* AI Assistant Panel */}
        <AIAssistantPanel
          isOpen={isPanelOpen}
          onClose={closePanel}
          messages={messages}
          isTyping={isTyping}
          isListening={isListening}
          voiceModalOpen={voiceModalOpen}
          conversationEndRef={conversationEndRef}
          onSendMessage={addUserMessage}
          onSuggestionClick={sendSuggestion}
          onQuickActionClick={sendQuickAction}
          onVoiceClick={toggleListening}
          onVoiceTranscriptReady={handleVoiceInput}
          onClearConversation={clearConversation}
          hasMessages={hasMessages}
        />
      </div>
    </div>
  );
}
