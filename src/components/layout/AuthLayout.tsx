import { Outlet } from 'react-router-dom';
import { Hotel } from 'lucide-react';
import { APP_NAME } from '@/config/constants';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary-700 mb-2">
            <Hotel size={36} />
            <span className="text-3xl font-serif font-bold">{APP_NAME}</span>
          </div>
          <p className="text-neutral-600">
            Experience luxury and comfort
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
