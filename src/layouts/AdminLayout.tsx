import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change or window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    // Full screen wrapper - centers the frame
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100 overflow-hidden">
      {/* Fixed Frame Container - responsive, removes max constraints on mobile */}
      <div className="relative w-full h-full lg:max-w-[1440px] lg:max-h-[1024px] bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100 overflow-hidden flex flex-col lg:rounded-xl">
        {/* Top Row: Sidebar Brand + Header with shared border */}
        <div className="flex flex-shrink-0">
          {/* Sidebar Brand Section - Hidden on mobile, Dynamic Width on desktop */}
          <div className={`hidden lg:block transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              renderBrandOnly={true}
              renderNavigationOnly={false}
              isMobileMode={false}
              onCloseMobile={() => {}}
            />
          </div>

          {/* Header - Takes full width on mobile, remaining width on desktop */}
          <div className="flex-1">
            <Header
              onAIVoiceClick={handleAIVoiceClick}
              onAIPanelToggle={handleAIPanelToggle}
              onSidebarToggle={handleSidebarToggle}
              isSidebarCollapsed={isSidebarCollapsed}
              onMobileMenuToggle={handleMobileMenuToggle}
            />
          </div>
        </div>

        {/* Bottom Row: Sidebar Navigation + Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar Navigation - Hidden on mobile, Dynamic Width on desktop */}
          <aside className={`hidden lg:block h-full flex-shrink-0 transition-all duration-300 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={handleSidebarToggle}
              renderBrandOnly={false}
              renderNavigationOnly={true}
              isMobileMode={false}
              onCloseMobile={() => {}}
            />
          </aside>

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100">
            <Outlet />
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Sidebar */}
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slideInLeft">
              <Sidebar
                isCollapsed={false}
                onToggle={() => setIsMobileMenuOpen(false)}
                renderBrandOnly={false}
                renderNavigationOnly={false}
                isMobileMode={true}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

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
