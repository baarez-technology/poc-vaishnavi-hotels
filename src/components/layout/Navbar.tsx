import { Link } from 'react-router-dom';
import { Hotel, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';
import { APP_NAME, ROUTES } from '@/config/constants';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-sm border-b border-neutral-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className={`flex items-center gap-2 transition-colors ${
              isScrolled 
                ? 'text-primary-700 hover:text-primary-800' 
                : 'text-white hover:text-white/80'
            }`}
          >
            <Hotel size={28} />
            <span className="text-xl font-serif font-bold">{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to={ROUTES.ROOMS}
              className={`transition-colors font-medium ${
                isScrolled 
                  ? 'text-neutral-700 hover:text-primary-600' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Rooms
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.BOOKING}
                  className={`transition-colors font-medium ${
                    isScrolled 
                      ? 'text-neutral-700 hover:text-primary-600' 
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  My Bookings
                </Link>
                <Link
                  to={ROUTES.PROFILE}
                  className={`transition-colors font-medium flex items-center gap-2 ${
                    isScrolled 
                      ? 'text-neutral-700 hover:text-primary-600' 
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  <User size={18} />
                  {user?.fullName}
                </Link>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant={isScrolled ? "ghost" : "ghost"} size="sm" className={!isScrolled ? 'text-white hover:text-white/80 hover:bg-white/10' : ''}>
                    Login
                  </Button>
                </Link>
                <Link to={ROUTES.SIGNUP}>
                  <Button size="sm" className={!isScrolled ? 'bg-white text-primary-700 hover:bg-white/90' : ''}>Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className={`md:hidden p-2 transition-colors ${
              isScrolled 
                ? 'text-neutral-700 hover:text-primary-600' 
                : 'text-white hover:text-white/80'
            }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-t ${
          isScrolled 
            ? 'border-neutral-200 bg-white' 
            : 'border-white/20 bg-black/90 backdrop-blur-lg'
        }`}>
          <div className="px-4 py-4 space-y-3">
            <Link
              to={ROUTES.ROOMS}
              className={`block transition-colors font-medium ${
                isScrolled 
                  ? 'text-neutral-700 hover:text-primary-600' 
                  : 'text-white hover:text-white/80'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rooms
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.BOOKING}
                  className={`block transition-colors font-medium ${
                    isScrolled 
                      ? 'text-neutral-700 hover:text-primary-600' 
                      : 'text-white hover:text-white/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  to={ROUTES.PROFILE}
                  className={`block transition-colors font-medium ${
                    isScrolled 
                      ? 'text-neutral-700 hover:text-primary-600' 
                      : 'text-white hover:text-white/80'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Button onClick={handleLogout} variant="ghost" fullWidth>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" fullWidth className={!isScrolled ? 'text-white hover:text-white/80 hover:bg-white/10' : ''}>
                    Login
                  </Button>
                </Link>
                <Link
                  to={ROUTES.SIGNUP}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button fullWidth className={!isScrolled ? 'bg-white text-primary-700 hover:bg-white/90' : ''}>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
