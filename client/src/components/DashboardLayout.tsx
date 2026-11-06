import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  ExternalLink,
  Store,
  Wrench,
  Truck,
  TrendingUp,
  User as UserIcon,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeVariant?: 'emerald' | 'amber' | 'blue' | 'rose';
}

interface DashboardLayoutProps {
  roleTitle: string;
  roleBadge: string;
  roleBadgeColor?: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navItems: DashboardNavItem[];
  headerActions?: React.ReactNode;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  roleTitle,
  roleBadge,
  roleBadgeColor = 'bg-emerald-100 text-emerald-800',
  activeTab,
  onTabChange,
  navItems,
  headerActions,
  searchPlaceholder = 'Search records, orders, items...',
  searchQuery,
  onSearchChange,
  children,
}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-stone-50/70 flex flex-col lg:flex-row text-stone-900 font-sans antialiased">
      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION (FIXED DESKTOP + SLIDE-OUT MOBILE) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-stone-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:w-68 xl:w-72 shrink-0 shadow-sm lg:shadow-none`}
      >
        {/* Top: Branding & Role Identity */}
        <div>
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-stone-900 block group-hover:text-emerald-700 transition-colors">
                  Gen Baazar
                </span>
                <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase block -mt-0.5">
                  Agri Workspace
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Header Badge */}
          <div className="px-5 pt-4 pb-2">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-stone-700">{roleTitle}</div>
                <div className="text-[10px] text-stone-400 truncate max-w-[140px] font-medium">
                  {user?.farmOrBusinessName || user?.email}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
                {roleBadge}
              </span>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="px-3 py-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
              Workspace Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-stone-400 group-hover:text-emerald-700'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : item.badgeVariant === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : item.badgeVariant === 'rose'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Platform Quick Links */}
          <div className="px-3 pt-3 border-t border-stone-100">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
              Quick Portals
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1 py-1">
              <Link
                to="/products"
                className="flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium text-stone-600 hover:text-emerald-700 hover:bg-stone-100 transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marketplace</span>
              </Link>
              <Link
                to="/machinery"
                className="flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium text-stone-600 hover:text-emerald-700 hover:bg-stone-100 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rentals</span>
              </Link>
              <Link
                to="/transport"
                className="flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium text-stone-600 hover:text-emerald-700 hover:bg-stone-100 transition-colors"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Logistics</span>
              </Link>
              <Link
                to="/market-prices"
                className="flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-medium text-stone-600 hover:text-emerald-700 hover:bg-stone-100 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mandi Feed</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900 truncate">{user?.name}</div>
                <div className="text-[10px] text-stone-500 truncate">{user?.phone || user?.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out of Gen Baazar"
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP DASHBOARD HEADER */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                <span>Workspace</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-emerald-800">{roleTitle}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight truncate">
                Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Context Search Input */}
            {onSearchChange && (
              <div className="relative hidden md:block w-48 lg:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-100/80 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            )}

            {/* Date Badge */}
            <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 text-[11px] font-medium border border-stone-200/60">
              {currentDateStr}
            </div>

            {/* Language Switcher Pill */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="px-2.5 py-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-bold text-emerald-800 transition-colors shadow-2xs"
            >
              {language === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 space-y-2 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-900">Notifications</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Mark read</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl space-y-1">
                    <div className="font-semibold text-emerald-900">Daily Mandi Rates Refreshed</div>
                    <div className="text-[11px] text-stone-600">
                      Coimbatore MGR Wholesale Mandi rates updated for today in INR.
                    </div>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl space-y-1">
                    <div className="font-semibold text-stone-900">Logistics Fleet Verified</div>
                    <div className="text-[11px] text-stone-600">
                      Vehicles calibrated for small-produce farm delivery (1–200 kg).
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role-specific Header Action Button */}
            {headerActions}
          </div>
        </header>

        {/* BODY WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

