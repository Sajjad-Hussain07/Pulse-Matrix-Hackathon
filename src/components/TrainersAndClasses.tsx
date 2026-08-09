import React, { useState } from 'react';
import {
  Trainer,
  ClassSession,
  UserProfile,
  UserBooking,
} from '../types';
import { MOCK_TRAINERS, MOCK_CLASSES } from '../data/mockData';
import { ConsultationModal } from './ConsultationModal';
import { saveUserBookingLocal } from '../utils/localStorage';
import { saveBookingToFirestore } from '../lib/firebase';
import {
  Star,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  ArrowUpRight,
} from 'lucide-react';

interface TrainersAndClassesProps {
  activeUser: UserProfile;
  isLoggedIn: boolean;
  onOpenAuthModal: (contextMsg?: string) => void;
  onShowToast: (msg: string) => void;
}

type PulseBookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface PulseBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  targetTitle: string;
  targetSub: string;
  date: string;
  time: string;
  durationMins: number;
  status: PulseBookingStatus;
  location: string;
  createdAt: string;
  trainerName?: string;
  classId?: string;
  trainerId?: string;
}

const PULSE_BOOKINGS_KEY = 'pulse_bookings';

const getPulseBookings = (): PulseBooking[] => {
  try {
    const stored = localStorage.getItem(PULSE_BOOKINGS_KEY);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (booking): booking is PulseBooking =>
        typeof booking === 'object' &&
        booking !== null &&
        typeof (booking as PulseBooking).id === 'string',
    );
  } catch (error) {
    console.error('Failed to read Pulse bookings:', error);
    return [];
  }
};

const savePulseBookings = (bookings: PulseBooking[]) => {
  try {
    localStorage.setItem(
      PULSE_BOOKINGS_KEY,
      JSON.stringify(bookings),
    );

    window.dispatchEvent(
      new CustomEvent('pulse-bookings-updated', {
        detail: bookings,
      }),
    );
  } catch (error) {
    console.error('Failed to save Pulse bookings:', error);
  }
};

const addPulseBooking = (booking: PulseBooking) => {
  const existingBookings = getPulseBookings();
  const updatedBookings = [...existingBookings, booking];
  savePulseBookings(updatedBookings);
};

export const TrainersAndClasses: React.FC<TrainersAndClassesProps> = ({
  activeUser,
  isLoggedIn,
  onOpenAuthModal,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTrainerForModal, setActiveTrainerForModal] = useState<Trainer | null>(null);
  const [classesList, setClassesList] = useState<ClassSession[]>(MOCK_CLASSES);

  const categories = [
    'All',
    'HIIT',
    'Hypertrophy',
    'Mobility',
    'Boxing',
  ];

  const filteredClasses =
    selectedCategory === 'All'
      ? classesList
      : classesList.filter(
          (session) => session.category === selectedCategory,
        );

  const handleBookTrainerClick = (trainer: Trainer) => {
    if (!isLoggedIn) {
      onOpenAuthModal(
        'Please Sign In or Sign Up to book a 1-on-1 consultation with our coaches.',
      );
      return;
    }

    setActiveTrainerForModal(trainer);
  };

  const handleEnrollClass = async (session: ClassSession) => {
    if (!isLoggedIn) {
      onOpenAuthModal(
        'Please Sign In or Sign Up to reserve your spot for group classes.',
      );
      return;
    }

    const currentSession = classesList.find(
      (item) => item.id === session.id,
    );

    if (!currentSession) {
      onShowToast('Unable to find this class session.');
      return;
    }

    if (currentSession.enrolled >= currentSession.capacity) {
      onShowToast('This class is already fully booked.');
      return;
    }

    const bookingId = `class_booking_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setClassesList((prev) =>
      prev.map((cls) => {
        if (
          cls.id === session.id &&
          cls.enrolled < cls.capacity
        ) {
          return {
            ...cls,
            enrolled: cls.enrolled + 1,
          };
        }

        return cls;
      }),
    );

    const newBooking: UserBooking = {
      id: bookingId,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      type: 'Class Session',
      targetTitle: session.title,
      targetSub: `Coach ${session.trainerName} • ${session.category} (${session.intensity} Intensity)`,
      date: `Next ${session.day}`,
      time: session.time,
      durationMins: session.durationMins,
      status: 'Pending Approval',
      location:
        'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
      createdAt: new Date().toISOString(),
    };

    try {
      saveUserBookingLocal(newBooking);
    } catch (error) {
      console.error(
        'Failed to save booking through localStorage utility:',
        error,
      );
    }

    try {
      await saveBookingToFirestore(newBooking);
    } catch (error) {
      console.error(
        'Failed to save booking to Firestore:',
        error,
      );
    }

    const pulseBooking: PulseBooking = {
      id: bookingId,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      type: 'Class Session',
      targetTitle: session.title,
      targetSub: `Coach ${session.trainerName} • ${session.category} (${session.intensity} Intensity)`,
      date: `Next ${session.day}`,
      time: session.time,
      durationMins: session.durationMins,
      status: 'PENDING',
      location:
        'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
      createdAt: new Date().toISOString(),
      classId: session.id,
      trainerName: session.trainerName,
    };

    addPulseBooking(pulseBooking);

    onShowToast(
      `Reserved spot for "${session.title}"! Booking is pending admin approval.`,
    );
  };

  const handleTrainerBookingConfirmed = async (message: string) => {
    const trainer = activeTrainerForModal;

    if (!trainer) {
      onShowToast(message);
      return;
    }

    const bookingId = `trainer_booking_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const createdAt = new Date().toISOString();

    const trainerBooking: UserBooking = {
      id: bookingId,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      type: '1-on-1 Consultation',
      targetTitle: trainer.name,
      targetSub: `${trainer.specialty} • ${trainer.role}`,
      date: 'Consultation',
      time: 'To Be Scheduled',
      durationMins: 60,
      status: 'Pending Approval',
      location:
        'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
      createdAt,
    };

    try {
      saveUserBookingLocal(trainerBooking);
    } catch (error) {
      console.error(
        'Failed to save trainer booking locally:',
        error,
      );
    }

    try {
      await saveBookingToFirestore(trainerBooking);
    } catch (error) {
      console.error(
        'Failed to save trainer booking to Firestore:',
        error,
      );
    }

    const pulseTrainerBooking: PulseBooking = {
      id: bookingId,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      type: '1-on-1 Consultation',
      targetTitle: trainer.name,
      targetSub: `${trainer.specialty} • ${trainer.role}`,
      date: 'Consultation',
      time: 'To Be Scheduled',
      durationMins: 60,
      status: 'PENDING',
      location:
        'Pulse Matrix Cyber Studio, Jubilee Hills, Hyderabad',
      createdAt,
      trainerId: trainer.id,
      trainerName: trainer.name,
    };

    addPulseBooking(pulseTrainerBooking);

    setActiveTrainerForModal(null);

    onShowToast(
      `${message} Booking is pending admin approval.`,
    );
  };

  return (
    <section
      id="trainers"
      className="relative bg-[#0D0F12] py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Award className="h-4 w-4" />
            <span>ELITE FACULTY & PERFORMANCE CLASSES</span>
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            MASTER COACHES &{' '}
            <span className="text-emerald-400">CYBER TIMETABLE</span>
          </h2>

          <p className="mt-3 text-sm text-gray-400">
            Train under certified sports scientists, Olympic biomechanists, and combat masters at Pulse Matrix Hyderabad.
          </p>
        </div>

        <div className="mb-20">
          <h3 className="mb-8 flex items-center space-x-2 text-xl font-extrabold uppercase tracking-wider text-white">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            <span>Head Coaching Staff</span>
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {MOCK_TRAINERS.map((trainer) => (
              <div
                key={trainer.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/80 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-emerald-500/50"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={trainer.imageUrl}
                    alt={trainer.name}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#14171D] via-transparent to-transparent" />

                  <div className="absolute right-4 top-4 flex items-center space-x-1 rounded-full border border-amber-500/30 bg-gray-950/80 px-3 py-1 text-xs font-bold text-amber-400 backdrop-blur-md">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{trainer.rating} / 5.0</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {trainer.specialty}
                    </span>

                    <h4 className="mt-1.5 text-xl font-black text-white">
                      {trainer.name}
                    </h4>

                    <p className="text-xs text-gray-300">
                      {trainer.role}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between space-y-4 p-6">
                  <p className="text-xs font-normal leading-relaxed text-gray-400">
                    {trainer.bio}
                  </p>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                      Credentials
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {trainer.credentials.map((credential, index) => (
                        <span
                          key={index}
                          className="rounded-md border border-gray-700/80 bg-gray-800 px-2.5 py-0.5 font-mono text-[10px] text-gray-300"
                        >
                          {credential}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-gray-800/80 pt-2">
                    {trainer.achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-xs text-gray-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="truncate">{achievement}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    id={`btn-book-consult-${trainer.id}`}
                    type="button"
                    onClick={() => handleBookTrainerClick(trainer)}
                    className="mt-4 flex w-full items-center justify-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-xs font-black uppercase tracking-wider text-emerald-400 transition duration-200 hover:bg-emerald-500 hover:text-gray-950 group-hover:bg-emerald-500 group-hover:text-gray-950"
                  >
                    <span>Book 1-on-1 Consultation</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl backdrop-blur-md sm:p-10">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-800 pb-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                Interactive Class Timetable
              </h3>

              <p className="mt-1 text-xs text-gray-400">
                Filter by workout intensity and reserve your spot instantly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    selectedCategory === category
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((session) => {
              const isFull = session.enrolled >= session.capacity;
              const fillPct =
                session.capacity > 0
                  ? Math.round((session.enrolled / session.capacity) * 100)
                  : 100;

              return (
                <div
                  key={session.id}
                  className="flex flex-col justify-between space-y-4 rounded-2xl border border-gray-800 bg-[#14171D] p-5 transition-all hover:border-emerald-500/40"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-400">
                        {session.category}
                      </span>

                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
                          session.intensity === 'Extreme'
                            ? 'border-red-500/30 bg-red-500/10 text-red-400'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {session.intensity} Intensity
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white">
                      {session.title}
                    </h4>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Coach:{' '}
                      <span className="font-semibold text-gray-200">
                        {session.trainerName}
                      </span>
                    </p>

                    <div className="mt-4 space-y-1 text-xs text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                        <span>
                          Every{' '}
                          <strong className="text-white">{session.day}</strong>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>
                          {session.time} ({session.durationMins} Mins)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="h-3.5 w-3.5 text-emerald-400" />
                        <span>
                          Capacity: {session.enrolled} / {session.capacity}
                        </span>
                      </span>

                      <span className="font-bold text-emerald-400">
                        {fillPct}% Full
                      </span>
                    </div>

                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          fillPct >= 90 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(fillPct, 100)}%`,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => handleEnrollClass(session)}
                      className={`flex w-full items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider shadow-md transition ${
                        isFull
                          ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                          : 'bg-gradient-to-r from-emerald-500 to-lime-400 text-gray-950 hover:scale-[1.01] hover:shadow-emerald-500/20 active:scale-95'
                      }`}
                    >
                      <span>
                        {isFull ? 'Class Fully Booked' : 'Reserve Spot Now'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ConsultationModal
        trainer={activeTrainerForModal}
        activeUser={activeUser}
        onClose={() => setActiveTrainerForModal(null)}
        onConfirm={handleTrainerBookingConfirmed}
      />
    </section>
  );
};