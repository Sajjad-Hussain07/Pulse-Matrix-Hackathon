import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Shield, User, LogIn, LogOut, Menu, X, Flame, ChevronDown, Calendar, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeUser: UserProfile;
  isLoggedIn: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (isAdmin: boolean) => void;
  onOpenAuthModal: (msg?: string) => void;
  onSignOut: () => void;
  streakCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  isLoggedIn,
  isAdminMode,
  setIsAdminMode,
  onOpenAuthModal,
  onSignOut,
  streakCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'biometrics', label: 'Biometrics & AI Scan' },
    { id: 'plan', label: '7-Day AI Protocol' },
    { id: 'tracker', label: 'Habit Tracker' },
    { id: 'trainers', label: 'Coaches & Classes' },
    { id: 'bookings', label: 'My Bookings' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo with Glow Hover */}
        <div
          className="flex items-center space-x-3 cursor-pointer group transition-all duration-300"
          onClick={() => handleNavClick('hero')}
        >
          <div className="w-8 h-8 bg-neon-green rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] group-hover:scale-110 transition-all duration-300">
            <div className="w-4 h-4 bg-[#0D0F12] rotate-45 group-hover:rotate-90 transition-transform duration-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-neon-green transition-colors duration-300">
                PULSE<span className="neon-green group-hover:text-white transition-colors duration-300">MATRIX</span>
              </span>
              <span className="border border-neon-green/40 text-neon-green text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block group-hover:bg-neon-green group-hover:text-black transition-all duration-300">
                HYDERABAD
              </span>
            </div>
            <p className="text-[9px] text-gray-500 tracking-widest font-black uppercase group-hover:text-gray-300 transition-colors">PERFORMANCE CLUB</p>
          </div>
        </div>

        {/* Desktop Navigation with Neon Hover */}
        <nav className="hidden lg:flex items-center space-x-2 text-xs font-bold uppercase tracking-widest">
          {navItems.map((item) => {
            const isActive = activeTab === item.id && !isAdminMode;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  setIsAdminMode(false);
                  handleNavClick(item.id);
                }}
                className={`relative px-3.5 py-2 rounded-xl transition-all duration-300 font-black tracking-wider uppercase flex items-center space-x-1.5 ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-emerald-500/10 hover:border hover:border-emerald-500/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Streak Badge, View Switcher Pill & Profile/Login */}
        <div className="hidden sm:flex items-center space-x-3">
          
          {/* Streak Counter Badge */}
          {isLoggedIn && (
            <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:border-amber-400 hover:bg-amber-500/20 hover:scale-105 transition-all duration-300">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>{streakCount} Day Streak</span>
            </div>
          )}

          {/* View Switcher Pill: Member View vs Admin Panel */}
          <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-full text-xs">
            <button
              id="view-switcher-user"
              onClick={() => setIsAdminMode(false)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-300 flex items-center space-x-1 hover:scale-105 ${
                !isAdminMode
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User View</span>
            </button>
            <button
              id="view-switcher-admin"
              onClick={() => setIsAdminMode(true)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-300 flex items-center space-x-1 hover:scale-105 ${
                isAdminMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          </div>

          {/* User Profile Pill OR Sign In Button */}
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 border border-emerald-500/40 hover:border-neon-green px-3.5 py-1.5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_18px_rgba(16,185,129,0.4)]"
              >
                <img
                  src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={activeUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-400"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-white max-w-[110px] truncate">{activeUser.name}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-neon-green' : ''}`} />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#14171D] border border-gray-800 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-gray-800 mb-2">
                    <p className="font-bold text-white text-sm">{activeUser.name}</p>
                    <p className="text-gray-400 text-[11px] truncate">{activeUser.email}</p>
                    <div className="mt-1.5 flex items-center space-x-2">
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                        {activeUser.goal}
                      </span>
                      <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded font-mono">
                        {activeUser.level}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setIsAdminMode(false);
                      handleNavClick('bookings');
                    }}
                    className="w-full text-left px-3 py-2 text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border hover:border-emerald-500/30 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold mb-1"
                  >
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>My Bookings & Schedule</span>
                  </button>

                  <button
                    id="dropdown-switch-auth-btn"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-amber-500/10 hover:text-amber-300 hover:border hover:border-amber-500/30 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold mb-1"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Switch Profile / Fast Demo</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 border-t border-gray-800 rounded-xl transition-all duration-200 flex items-center space-x-2 font-semibold mt-1 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-signin-btn"
              onClick={() => onOpenAuthModal()}
              className="px-5 py-2.5 bg-neon-green text-black font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-95 transition-all duration-300 flex items-center space-x-2 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

        </div>

        {/* Mobile Hamburger Menu */}
        <div className="flex lg:hidden items-center space-x-2">
          {!isLoggedIn && (
            <button
              onClick={() => onOpenAuthModal()}
              className="px-3 py-1.5 bg-neon-green text-black font-black text-[11px] uppercase tracking-wider rounded-md"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl text-emerald-400"
            title="Toggle Admin/User Mode"
          >
            <Shield className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white bg-gray-900 border border-gray-800 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#14171D] border-b border-gray-800 px-4 pt-3 pb-6 space-y-3">
          
          {isLoggedIn ? (
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <img
                  src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={activeUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-xs font-bold text-white">{activeUser.name}</p>
                  <p className="text-[10px] text-gray-400">{activeUser.goal}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                <Flame className="w-3.5 h-3.5" />
                <span>{streakCount} Days</span>
              </div>
            </div>
          ) : (
            <div className="pb-3 border-b border-gray-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full py-3 bg-neon-green text-black font-black text-xs uppercase tracking-widest text-center"
              >
                Sign In / Create Account
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setIsAdminMode(false);
                  handleNavClick(item.id);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === item.id && !isAdminMode
                    ? 'bg-emerald-500 text-gray-950 font-bold'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl"
            >
              <Shield className="w-4 h-4" />
              <span>Switch to {isAdminMode ? 'User Mode' : 'Admin Panel'}</span>
            </button>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="flex items-center space-x-1 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-2 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

