import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAssistantPanel from '../components/admin-panel/ai/AIAssistantPanel';
import { useAIAssistant } from '../hooks/admin/useAIAssistant';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminLayout() {
  // Theme
  const { isDark } = useTheme();

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // AI Assistant hook - admin version with backend AI and real-time voice
  const {
    messages,
    isPanelOpen,
    isTyping,
    conversationEndRef,
    addUserMessage,
    togglePanel,
    closePanel,
    clearConversation,
    sendQuickAction,
    sendSuggestion,
    hasMessages,
    confirmAction,
    cancelAction,
    hasPendingAction,
  } = useAIAssistant();

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
    <div className={`w-screen h-screen flex items-center justify-center overflow-hidden transition-colors ${
      isDark
        ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800'
        : 'bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100'
    }`}>
      {/* Fixed Frame Container: 1440px × 1024px (responsive) */}
      <div className={`relative w-full max-w-[1440px] h-full max-h-[1024px] overflow-hidden flex flex-col rounded-xl transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800'
          : 'bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100'
      }`}>
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
          <main className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800'
              : 'bg-gradient-to-br from-terra-50 via-terra-50/80 to-terra-100'
          }`}>
            <Outlet />
          </main>
        </div>

        {/* AI Assistant Panel - Admin version with real-time voice */}
        <AIAssistantPanel
          isOpen={isPanelOpen}
          onClose={closePanel}
          messages={messages}
          isTyping={isTyping}
          conversationEndRef={conversationEndRef}
          onSendMessage={addUserMessage}
          onSuggestionClick={sendSuggestion}
          onQuickActionClick={sendQuickAction}
          onClearConversation={clearConversation}
          hasMessages={hasMessages}
          onConfirmAction={confirmAction}
          onCancelAction={cancelAction}
        />
      </div>
    </div>
  );
}
