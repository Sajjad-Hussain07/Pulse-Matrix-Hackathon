import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile } from './types';
import {
  initializeLocalStorage,
  getActiveUser,
  saveUserProfile,
  getStreakCount,
  getIsLoggedIn,
  setIsLoggedIn,
  setActiveUserId,
} from './utils/localStorage';
import {
  auth,
  testFirebaseConnection,
  getUserProfileFromFirestore,
  logOutFirebase,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BiometricCalculators } from './components/BiometricCalculators';
import { PlanGenerator } from './components/PlanGenerator';
import { HabitTracker } from './components/HabitTracker';
import { TrainersAndClasses } from './components/TrainersAndClasses';
import { MyBookings } from './components/MyBookings';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ChatbotWidget } from './components/ChatbotWidget';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';

const ADMIN_EMAIL = (import.meta.env?.VITE_ADMIN_EMAIL as string) || 'sajjadhussainbrohiofficial@gmail.com';
const ADMIN_PASSWORD = (import.meta.env?.VITE_ADMIN_PASSWORD as string) || '12345678';

const THEME_STORAGE_KEY = 'pulse_theme';
const BOOKINGS_STORAGE_KEY = 'pulse_bookings';

type Theme = 'light' | 'dark';
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface Booking {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  trainerName?: string;
  sessionName?: string;
  className?: string;
  date?: string;
  time?: string;
  createdAt?: string;
  status: BookingStatus;
  [key: string]: unknown;
}

const readBookings = (): Booking[] => {
  try {
    const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: unknown, index: number) => {
      const booking = typeof item === 'object' && item !== null ? (item as Partial<Booking>) : {};
      const id = typeof booking.id === 'string' && booking.id.trim() ? booking.id : `booking-${Date.now()}-${index}`;
      let status: BookingStatus = 'PENDING';
      if (booking.status === 'CONFIRMED') status = 'CONFIRMED';
      else if (booking.status === 'CANCELLED') status = 'CANCELLED';

      return { ...booking, id, status };
    });
  } catch (error) {
    console.error('Failed to read bookings:', error);
    return [];
  }
};

const saveBookings = (items: Booking[]) => {
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('pulse-bookings-updated', { detail: items }));
  } catch (error) {
    console.error('Failed to save bookings:', error);
  }
};

const normalizeBookings = () => {
  const current = readBookings();
  if (current.length === 0) return;
  const normalized = current.map((booking) => ({
    ...booking,
    status: booking.status === 'CONFIRMED' || booking.status === 'CANCELLED' ? booking.status : 'PENDING',
  }));
  saveBookings(normalized);
};

function App() {
  const [activeTab, setActiveTabState] = useState('hero');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  const [isLoggedIn, setIsLoggedInState] = useState(getIsLoggedIn());
  const [activeUser, setActiveUser] = useState<UserProfile | null>(getActiveUser());

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalContextMsg, setAuthModalContextMsg] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(getStreakCount());

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => readBookings());

  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }

    const html = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      html.classList.add('dark');
      body.classList.remove('bg-slate-100', 'text-slate-900');
      body.classList.add('bg-slate-950', 'text-slate-100');
    } else {
      html.classList.remove('dark');
      body.classList.remove('bg-slate-950', 'text-slate-100');
      body.classList.add('bg-slate-100', 'text-slate-900');
    }
  }, [theme]);

  useEffect(() => {
    initializeLocalStorage();
    testFirebaseConnection();
    normalizeBookings();

    const handleBookingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Booking[]>;
      if (Array.isArray(customEvent.detail)) {
        setBookings(customEvent.detail);
      } else {
        setBookings(readBookings());
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BOOKINGS_STORAGE_KEY) setBookings(readBookings());
      if (event.key === THEME_STORAGE_KEY) setTheme(event.newValue === 'dark' ? 'dark' : 'light');
    };

    window.addEventListener('pulse-bookings-updated', handleBookingUpdate);
    window.addEventListener('storage', handleStorage);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!getIsLoggedIn()) {
          setIsLoggedInState(false);
          setActiveUser(null);
        }
        return;
      }

      setIsLoggedInState(true);
      setIsLoggedIn(true);
      setActiveUserId(user.uid);

      try {
        const firestoreUser = await getUserProfileFromFirestore(user.uid);
        if (firestoreUser) {
          setActiveUser(firestoreUser);
          saveUserProfile(firestoreUser);
        } else {
          const newUser: UserProfile = {
            id: user.uid,
            name: user.displayName || 'Pulse Member',
            email: user.email || 'member@pulse.pk',
            goal: 'Muscle Gain',
            level: 'Intermediate',
            age: 26,
            gender: 'male',
            heightCm: 178,
            weightKg: 76,
            activityLevel: 'active',
            role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
            avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          };
          setActiveUser(newUser);
          saveUserProfile(newUser);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('pulse-bookings-updated', handleBookingUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 4000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (tab === 'bookings' || tab === 'myBookings' || tab === 'my-bookings') {
      window.setTimeout(() => scrollToSection('my-bookings'), 0);
    } else if (tab === 'trainers') {
      window.setTimeout(() => scrollToSection('trainers'), 0);
    } else if (tab === 'biometrics') {
      window.setTimeout(() => scrollToSection('biometrics'), 0);
    } else if (tab === 'hero') {
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };

  const handleOpenAuthModal = (contextMsg?: string) => {
    setAuthModalContextMsg(contextMsg || '');
    setAuthModalOpen(true);
  };

  const handleUpdateActiveUser = (updated: UserProfile) => {
    setActiveUser(updated);
    saveUserProfile(updated);
    setActiveUserId(updated.id);
    setIsLoggedInState(true);
    setIsLoggedIn(true);
    
    // Fix for black screen / ensuring active tab falls back to biometric/dashboard view safely
    setActiveTabState('biometrics');

    showToast(`Welcome back, ${updated?.name || 'Guest'}! Profile authenticated.`);
  };

  const openAdminLogin = () => {
    setAdminLoginError('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminLoginOpen(true);
  };

  const closeAdminLogin = () => {
    setAdminLoginOpen(false);
    setAdminEmail('');
    setAdminPassword('');
    setAdminLoginError('');
  };

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = adminEmail.trim().toLowerCase();

    if (email === ADMIN_EMAIL.toLowerCase() && adminPassword === ADMIN_PASSWORD) {
      setAdminAuthenticated(true);
      setIsAdminMode(true);
      setAdminLoginError('');
      closeAdminLogin();
      showToast('Admin authentication successful.');
      return;
    }

    setAdminAuthenticated(false);
    setIsAdminMode(false);
    setAdminLoginError('Access Denied');
  };

  const handleAdminModeChange = (enabled: boolean) => {
    if (!enabled) {
      setIsAdminMode(false);
      return;
    }
    if (adminAuthenticated) {
      setIsAdminMode(true);
    } else {
      openAdminLogin();
    }
  };

  const handleAdminLogout = () => {
    setAdminAuthenticated(false);
    setIsAdminMode(false);
    showToast('Admin mode closed.');
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    const updated = readBookings().map((booking) =>
      booking.id === bookingId ? { ...booking, status } : booking
    );
    saveBookings(updated);
    setBookings(updated);

    if (status === 'CONFIRMED') showToast('Booking approved successfully.');
    else if (status === 'CANCELLED') showToast('Booking rejected successfully.');
  };

  const refreshBookings = () => setBookings(readBookings());

  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'PENDING'), [bookings]);
  const confirmedBookings = useMemo(() => bookings.filter((b) => b.status === 'CONFIRMED'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.status === 'CANCELLED'), [bookings]);

  const handleSignOut = async () => {
    try {
      await logOutFirebase();
    } catch (error) {
      console.error('Sign out failed:', error);
    }

    setIsLoggedInState(false);
    setIsLoggedIn(false);
    setActiveUser(null);
    setActiveUserId('');
    setAdminAuthenticated(false);
    setIsAdminMode(false);
    showToast('Signed out successfully.');
  };

  const adminBookingsManagement = (
    <section id="admin-bookings-management" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Administrator</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Bookings Management</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Approve or reject pending trainer and session bookings.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={refreshBookings} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Refresh</button>
            <button type="button" onClick={handleAdminLogout} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Exit Admin</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</p>
            <p className="mt-1 text-3xl font-bold text-amber-900 dark:text-amber-100">{pendingBookings.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Confirmed</p>
            <p className="mt-1 text-3xl font-bold text-emerald-900 dark:text-emerald-100">{confirmedBookings.length}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-5 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Cancelled</p>
            <p className="mt-1 text-3xl font-bold text-red-900 dark:text-red-100">{cancelledBookings.length}</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pending Bookings</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">{pendingBookings.length} PENDING</span>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="font-semibold text-slate-700 dark:text-slate-200">No pending bookings</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New bookings will appear here with PENDING status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{booking.sessionName || booking.className || 'Fitness Session'}</h4>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">PENDING</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {booking.userName && <p><strong>Member:</strong> {booking.userName}</p>}
                        {booking.userEmail && <p><strong>Email:</strong> {booking.userEmail}</p>}
                        {booking.trainerName && <p><strong>Trainer:</strong> {booking.trainerName}</p>}
                        {booking.date && <p><strong>Date:</strong> {booking.date}</p>}
                        {booking.time && <p><strong>Time:</strong> {booking.time}</p>}
                        <p><strong>Booking ID:</strong> {booking.id}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">Approve</button>
                      <button type="button" onClick={() => updateBookingStatus(booking.id, 'CANCELLED')} className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <NotificationToast message={toastMessage} onClose={() => setToastMessage(null)} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeUser={activeUser}
        isLoggedIn={isLoggedIn}
        isAdminMode={isAdminMode}
        setIsAdminMode={handleAdminModeChange}
        onOpenAuthModal={handleOpenAuthModal}
        onSignOut={handleSignOut}
        streakCount={streakCount}
      />

      <div className="fixed right-4 top-20 z-40">
        <button
          type="button"
          onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-105 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <main>
        {isAdminMode && adminAuthenticated ? (
          <>
            <AdminPanel onShowToast={showToast} />
            {adminBookingsManagement}
          </>
        ) : (
          <>
            <Hero
              onStartAnalysis={() => {
                setActiveTab('biometrics');
                scrollToSection('biometrics');
              }}
              onExploreClasses={() => {
                setActiveTab('trainers');
                scrollToSection('trainers');
              }}
            />

            <div id="biometrics" className="scroll-mt-24">
              <BiometricCalculators activeUser={activeUser} onUpdateUser={handleUpdateActiveUser} onShowToast={showToast} />
            </div>

            <PlanGenerator activeUser={activeUser} onShowToast={showToast} />

            <HabitTracker activeUser={activeUser} onShowToast={showToast} streakCount={streakCount} setStreakCount={setStreakCount} />

            <div id="trainers" className="scroll-mt-24">
              <TrainersAndClasses activeUser={activeUser} isLoggedIn={isLoggedIn} onOpenAuthModal={handleOpenAuthModal} onShowToast={showToast} />
            </div>

            <div id="my-bookings" className="scroll-mt-24">
              <MyBookings
                activeUser={activeUser}
                isLoggedIn={isLoggedIn}
                onOpenAuthModal={handleOpenAuthModal}
                onNavigateToTrainers={() => {
                  setActiveTab('trainers');
                  scrollToSection('trainers');
                }}
                onShowToast={showToast}
              />
            </div>
          </>
        )}
      </main>

      <ChatbotWidget activeUser={activeUser} streakCount={streakCount} />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSaveUser={handleUpdateActiveUser} activeUser={activeUser} contextMsg={authModalContextMsg} />

      {adminLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl text-white dark:bg-white dark:text-slate-900">🔐</div>
              <h2 id="admin-login-title" className="text-2xl font-bold text-slate-900 dark:text-white">Admin Authentication</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Authorized administrator access only.</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Admin Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  autoComplete="username"
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
                />
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
                />
              </div>

              {adminLoginError === 'Access Denied' && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  ⚠️ Access Denied — Invalid administrator credentials.
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={closeAdminLogin} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Sign In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default App;