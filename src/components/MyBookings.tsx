import React, { useState, useEffect } from 'react';
import { UserBooking, UserProfile } from '../types';
import { getUserBookingsLocal, cancelUserBookingLocal } from '../utils/localStorage';
import { getUserBookingsFromFirestore, cancelBookingInFirestore } from '../lib/firebase';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
  UserCheck,
  PlusCircle,
  Filter,
  Download,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MyBookingsProps {
  activeUser?: UserProfile | null;
  isLoggedIn: boolean;
  onOpenAuthModal: (contextMsg?: string) => void;
  onNavigateToTrainers: () => void;
  onShowToast: (msg: string) => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({
  activeUser,
  isLoggedIn,
  onOpenAuthModal,
  onNavigateToTrainers,
  onShowToast,
}) => {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Trainer Consultation' | 'Class Session'>('All');
  const [cancelModalBooking, setCancelModalBooking] = useState<UserBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoggedIn || !activeUser?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      
      try {
        // 1. Fetch user local bookings
        let userList = getUserBookingsLocal(activeUser.id) || [];

        // 2. Sync with global pulse_bookings
        const rawPulse = localStorage.getItem('pulse_bookings');
        if (rawPulse) {
          const parsedPulse: UserBooking[] = JSON.parse(rawPulse);
          if (Array.isArray(parsedPulse)) {
            const pulseMap = new Map(parsedPulse.filter(b => b && b.id).map((b) => [b.id, b]));
            
            userList = userList.map((b) => {
              if (!b || !b.id) return b;
              const adminUpdated = pulseMap.get(b.id);
              return adminUpdated ? { ...b, ...adminUpdated } : b;
            });

            parsedPulse.forEach((b) => {
              if (
                b &&
                ((b as any).userId === activeUser.id || (b as any).userEmail === activeUser.email) &&
                !userList.some((ub) => ub && ub.id === b.id)
              ) {
                userList.push(b);
              }
            });
          }
        }

        // 3. Sync with Firestore
        const firestoreList = await getUserBookingsFromFirestore(activeUser.id);
        if (Array.isArray(firestoreList) && firestoreList.length > 0) {
          const map = new Map<string, UserBooking>();
          [...userList, ...firestoreList].forEach((b) => {
            if (!b || !b.id) return;
            const existing = map.get(b.id);
            if (!existing) {
              map.set(b.id, b);
            } else {
              const isConfirmed = (s?: string) =>
                ['APPROVED', 'CONFIRMED'].includes((s || '').toUpperCase());
              
              if (isConfirmed(b.status) && !isConfirmed(existing.status)) {
                map.set(b.id, b);
              } else {
                map.set(b.id, { ...existing, ...b });
              }
            }
          });
          userList = Array.from(map.values());
        }

        setBookings(userList);
      } catch (err) {
        console.warn('Bookings load/sync error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();

    const handleSync = () => {
      loadBookings();
    };

    window.addEventListener('pulse-bookings-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('pulse-bookings-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [activeUser?.id, activeUser?.email, isLoggedIn]);

  const handleCancelBooking = async (bookingId: string) => {
    cancelUserBookingLocal(bookingId);
    await cancelBookingInFirestore(bookingId);

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );

    window.dispatchEvent(new Event('pulse-bookings-updated'));
    setCancelModalBooking(null);
    onShowToast('Booking has been cancelled.');
  };

  const handleDownloadCalendar = (booking: UserBooking) => {
    const safeDate = (booking.date || '').replace(/-/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pulse Matrix Performance Club//Hyderabad//EN
BEGIN:VEVENT
SUMMARY:Pulse Matrix: ${booking.targetTitle || 'Booking'} (${booking.type || ''})
DESCRIPTION:${booking.targetSub || ''} - Notes: ${booking.notes || 'None'}
LOCATION:${booking.location || ''}
DTSTART:${safeDate}T090000Z
DTEND:${safeDate}T100000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `PulseMatrix_Booking_${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Calendar (.ics) invite downloaded!');
  };

  const getStatusType = (status: string = '') => {
    const s = status.toUpperCase();
    if (s === 'PENDING APPROVAL' || s === 'PENDING') return 'PENDING';
    if (s === 'CONFIRMED' || s === 'APPROVED') return 'CONFIRMED';
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'CANCELLED') return 'CANCELLED';
    return 'PENDING';
  };

  if (!isLoggedIn) {
    return (
      <section className="py-20 bg-[#0D0F12] text-white min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6 glass p-8 border border-gray-800">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 neon-green border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wide">Sign In Required</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            Access your personalized fitness schedule, trainer appointments, and class passes by logging into your Pulse Matrix account.
          </p>
          <button
            onClick={() => onOpenAuthModal('Please Sign In or Sign Up to access My Bookings.')}
            className="w-full py-3.5 bg-neon-green text-black font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </section>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (!b) return false;
    if (filterType === 'All') return true;
    return b.type === filterType;
  });

  const pendingCount = bookings.filter((b) => b && getStatusType(b.status) === 'PENDING').length;
  const confirmedCount = bookings.filter((b) => b && getStatusType(b.status) === 'CONFIRMED').length;
  const completedCount = bookings.filter((b) => b && getStatusType(b.status) === 'COMPLETED').length;

  return (
    <section id="my-bookings" className="py-16 bg-[#0D0F12] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>PULSE MATRIX MEMBER PASS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
              MY <span className="neon-green">BOOKINGS</span> & SCHEDULE
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
              Member: <strong className="text-white">{activeUser?.name || 'Member'}</strong> ({activeUser?.email || ''})
            </p>
          </div>

          <button
            onClick={onNavigateToTrainers}
            className="px-6 py-3.5 bg-neon-green text-black font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book New Trainer / Class</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
          <div className="glass p-5 border border-amber-500/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Pending Approvals</p>
              <p className="stat-value text-3xl font-black text-amber-400 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Approved & Confirmed</p>
              <p className="stat-value text-3xl font-black text-emerald-400 mt-1">{confirmedCount}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Completed Sessions</p>
              <p className="stat-value text-3xl font-black text-cyan-400 mt-1">{completedCount}</p>
            </div>
            <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="glass p-5 border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Reservations</p>
              <p className="stat-value text-3xl font-black text-white mt-1">{bookings.length}</p>
            </div>
            <div className="w-10 h-10 bg-gray-800 text-gray-300 border border-gray-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-8 pb-4 border-b border-gray-800 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
          {(['All', 'Trainer Consultation', 'Class Session'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filterType === cat
                  ? 'bg-neon-green text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'glass text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat === 'All' ? 'All Bookings' : cat}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-mono text-xs animate-pulse">
            Loading your schedule from Pulse Matrix servers...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="glass p-12 text-center border border-gray-800 max-w-2xl mx-auto space-y-4 my-8">
            <div className="w-12 h-12 bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase text-white">No Bookings Found</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              You haven't scheduled any 1-on-1 trainer consultations or reserved class spots yet.
            </p>
            <button
              onClick={onNavigateToTrainers}
              className="mt-4 px-6 py-3 bg-neon-green text-black font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition inline-flex items-center space-x-2"
            >
              <span>Explore Timetable & Coaches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((b) => {
              if (!b) return null;
              const statusType = getStatusType(b.status);
              return (
                <div
                  key={b.id || Math.random()}
                  className="glass border border-gray-800 p-6 flex flex-col justify-between space-y-5 hover:border-neon-green/40 transition-all group relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5">
                        {b.type || 'Session'}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border rounded ${
                          statusType === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                            : statusType === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : statusType === 'COMPLETED'
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40 line-through'
                        }`}
                      >
                        {statusType === 'CONFIRMED' ? 'CONFIRMED' : b.status || 'Pending'}
                      </span>
                    </div>

                    {b.isFeatured && (
                      <div className="mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>VIP Priority Reservation</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-start space-x-3 mb-4">
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.targetTitle || 'Session'}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 shrink-0 shadow"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center shrink-0 neon-green font-black text-sm">
                          PM
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-white">{b.targetTitle || 'Workout Session'}</h3>
                        <p className="text-xs text-gray-400">{b.targetSub || ''}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-300 font-mono bg-gray-950/60 p-3 border border-gray-900 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 neon-green shrink-0" />
                        <span>Date: <strong className="text-white">{b.date || 'TBD'}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 neon-green shrink-0" />
                        <span>Time: <strong className="text-white">{b.time || 'TBD'}</strong></span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-gray-400">{b.location || 'Pulse Studio'}</span>
                      </div>
                    </div>

                    {b.notes && (
                      <div className="mt-3 text-[11px] text-gray-400 italic bg-gray-900/40 p-2.5 border-l-2 border-neon-green rounded-r-lg">
                        <span className="not-italic text-gray-500 font-bold block text-[10px] uppercase">Member Note:</span>
                        "{b.notes}"
                      </div>
                    )}

                    {b.adminNote && (
                      <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 p-2.5 border border-amber-500/30 rounded-lg">
                        <span className="text-amber-400 font-bold block text-[10px] uppercase tracking-wider">
                          🛡️ Admin Feedback / Desk Note:
                        </span>
                        {b.adminNote}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDownloadCalendar(b)}
                      className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold text-[11px] uppercase tracking-wider transition flex items-center justify-center space-x-1 rounded-lg"
                      title="Export to Calendar"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>iCal</span>
                    </button>

                    {(statusType === 'PENDING' || statusType === 'CONFIRMED') && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-[11px] font-bold uppercase tracking-wider transition flex items-center space-x-1 rounded-lg"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelModalBooking && (
        <div
          onClick={() => setCancelModalBooking(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass max-w-sm w-full p-6 border border-red-500/30 space-y-4 cursor-default"
          >
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black uppercase text-white">Cancel Booking?</h3>
            </div>
            <p className="text-xs text-gray-300">
              Are you sure you want to cancel your appointment for{' '}
              <strong className="text-white">{cancelModalBooking.targetTitle}</strong> on{' '}
              <strong className="text-white">{cancelModalBooking.date}</strong> at{' '}
              <strong className="text-white">{cancelModalBooking.time}</strong>?
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-bold text-xs uppercase"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalBooking.id)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase shadow-lg shadow-red-600/30"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};