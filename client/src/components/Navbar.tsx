import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  ShoppingCart,
  User,
  Globe,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'farmer':
        return '/dashboard/farmer';
      case 'buyer':
        return '/dashboard/buyer';
      case 'supplier':
        return '/dashboard/supplier';
      case 'machinery_owner':
        return '/dashboard/machinery';
      case 'transport_provider':
        return '/dashboard/transport';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/buyer';
    }
  };

  const navLinks = [
    { to: '/', label: t('navHome') },
    { to: '/products', label: t('navProducts') },
    { to: '/machinery', label: t('navMachinery') },
    { to: '/transport', label: t('navTransport') },
    { to: '/market-prices', label: t('navMarketPrices') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-stone-900 group-hover:text-emerald-700 transition-colors">
                Gen Baazar
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-emerald-700 uppercase tracking-wider -mt-1">
                Agri Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-stone-600 hover:text-emerald-700 hover:bg-stone-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors"
              title="Switch Language (English / தமிழ்)"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-stone-700 hover:text-emerald-700 hover:bg-stone-100 rounded-xl transition-colors"
              title={t('navCart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Authenticated User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-stone-800 truncate max-w-[100px]">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-emerald-700 capitalize">
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-500">Signed in as</p>
                      <p className="text-sm font-semibold text-stone-900 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-full capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>{t('navDashboard')}</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navLogout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-stone-700 hover:text-emerald-700 rounded-xl transition-colors"
                >
                  {t('navLogin')}
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50"
              >
                {t('navDashboard')} ({user?.role.replace('_', ' ')})
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

