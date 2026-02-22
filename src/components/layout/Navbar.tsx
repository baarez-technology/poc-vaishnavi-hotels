import { Link, useLocation } from 'react-router-dom';
import { Hotel, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';
import { ROUTES } from '@/config/constants';
import { useHotelInfo } from '@/hooks/useHotelInfo';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const hotelInfo = useHotelInfo();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
            {hotelInfo.logo ? (
              <img src={hotelInfo.logo} alt={hotelInfo.name} className="h-8 w-auto max-w-[180px] object-contain" />
            ) : (
              <>
                <Hotel size={28} />
                <span className="text-xl font-serif font-bold">{hotelInfo.name}</span>
              </>
            )}
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
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(true);
            }}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay - Using Portal for proper rendering */}
      {createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
              opacity: isMobileMenuOpen ? 1 : 0,
              pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
              transition: 'opacity 300ms ease-out',
            }}
            className="md:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(false);
            }}
          />

          {/* Mobile Menu Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100%',
              width: '300px',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 9999,
              transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 300ms ease-out',
            }}
            className="md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-100">
              <span className="text-lg font-semibold text-neutral-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Menu Content */}
            <div className="px-4 py-6 space-y-2">
              <Link
                to={ROUTES.ROOMS}
                className="block px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rooms
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.BOOKING}
                    className="block px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Link
                    to={ROUTES.PROFILE}
                    className="block px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="pt-4 mt-4 border-t border-neutral-100">
                    <Button onClick={handleLogout} variant="ghost" fullWidth>
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <div className="pt-4 mt-4 border-t border-neutral-100 space-y-3">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="outline" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link
                    to={ROUTES.SIGNUP}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button fullWidth>Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </nav>
  );
};
