import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui2/Button';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-2xl flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>

        {/* Action */}
        <Button
          variant="primary"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
