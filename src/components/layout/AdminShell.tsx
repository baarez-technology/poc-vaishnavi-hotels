import { useState } from 'react';
import { cn } from '../../lib/utils';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({ children, onToggleAI }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[hsl(var(--background))]">
      <div className="h-full flex">
        {/* Sidebar (desktop + mobile) */}
        <div className="hidden lg:block h-full">
          <AdminSidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
          />
        </div>
        {mobileOpen ? (
          <AdminSidebar
            collapsed={false}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            onToggleCollapsed={() => {}}
          />
        ) : null}

        {/* Main */}
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <AdminTopbar
            onToggleMobileSidebar={() => setMobileOpen(true)}
            onToggleAI={onToggleAI}
          />

          <main className={cn('flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar')}>
            <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-5 lg:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


