import { ReactNode } from 'react';
import Sidebar from '../../components/staff-portal/nav/Sidebar';
import NotificationDrawer from '../../components/staff-portal/notifications/NotificationDrawer';
import { useUI } from '../../hooks/staff-portal/useStaffPortal';

interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const { sidebarOpen } = useUI();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar />

      <main
        className={`
          transition-all duration-300 ease-in-out
          lg:ml-[260px] min-h-screen
        `}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      <NotificationDrawer />
    </div>
  );
}





