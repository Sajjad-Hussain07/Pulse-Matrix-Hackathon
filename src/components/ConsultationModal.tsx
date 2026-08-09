import React, { useState } from 'react';
import { Trainer, UserProfile, UserBooking } from '../types';
import { saveUserBookingLocal } from '../utils/localStorage';
import { saveBookingToFirestore } from '../lib/firebase';
import { X, Calendar, Clock, CheckCircle2, UserCheck } from 'lucide-react';

interface ConsultationModalProps {
  trainer: Trainer | null;
  activeUser: UserProfile;
  onClose: () => void;
  onConfirm: (bookingDetails: string) => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  trainer,
  activeUser,
  onClose,
  onConfirm,
}) => {
  const [date, setDate] = useState('2026-08-10');
  const [time, setTime] = useState('05:00 PM');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!trainer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBooking: UserBooking = {
      id: `booking_${Date.now()}`,
      userId: activeUser.id || 'guest_user',
      userName: activeUser.name || 'Member',
      userEmail: activeUser.email || 'member@pulse.pk',
      type: 'Trainer Consultation',
      targetTitle: trainer.name,
      targetSub: `${trainer.role} (${trainer.specialty})`,
      imageUrl: trainer.imageUrl,
      date,
      time,
      durationMins: 60,
      status: 'Pending Approval',
      notes,
      location: 'Pulse Matrix Performance Club, Jubilee Hills, Hyderabad',
      createdAt: new Date().toISOString(),
    };

    saveUserBookingLocal(newBooking);
    await saveBookingToFirestore(newBooking);

    setSubmitted(true);
    setTimeout(() => {
      onConfirm(`Consultation booked with ${trainer.name} on ${date} at ${time}`);
      onClose();
    }, 1500);
  };


  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#14171D] border border-gray-800 rounded-3xl p-6 text-white shadow-2xl cursor-default"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/50 animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase text-white">Consultation Confirmed!</h3>
            <p className="text-sm text-gray-300">
              Your appointment with <span className="text-emerald-400 font-bold">{trainer.name}</span> is scheduled for {date} at {time}.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <img
                src={trainer.imageUrl}
                alt={trainer.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {trainer.specialty}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{trainer.name}</h3>
                <p className="text-xs text-gray-400">{trainer.role}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Preferred Time Slot</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="09:00 AM">09:00 AM - Morning Slot</option>
                    <option value="11:30 AM">11:30 AM - Midday Slot</option>
                    <option value="05:00 PM">05:00 PM - Evening Slot</option>
                    <option value="07:30 PM">07:30 PM - Prime Night Slot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Primary Focus / Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discussing posture alignment, knee rehabilitation, or custom powerlifting prep."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.01] active:scale-95 transition flex items-center justify-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirm 1-on-1 Consultation</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
