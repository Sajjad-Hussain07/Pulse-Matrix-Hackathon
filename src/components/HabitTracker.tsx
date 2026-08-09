import React, { useState, useEffect } from 'react';
import { HabitLog, UserProfile } from '../types';
import { getTodayHabitLog, saveHabitLog, getStreakCount } from '../utils/localStorage';
import { Flame, Droplets, CheckSquare, Dumbbell, Award, Plus, Minus, RotateCcw, CheckCircle2 } from 'lucide-react';

interface HabitTrackerProps {
  activeUser: UserProfile;
  onShowToast: (msg: string) => void;
  streakCount: number;
  setStreakCount: (count: number) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  activeUser,
  onShowToast,
  streakCount,
  setStreakCount,
}) => {
  const [habitLog, setHabitLog] = useState<HabitLog>(getTodayHabitLog());

  const waterTarget = 3500; // ml
  const waterPct = Math.min(100, Math.round((habitLog.waterMl / waterTarget) * 100));

  const mealLabels = [
    'Breakfast (Clean Protein & Oats)',
    'Lunch (Lean Tikka/Beef & Basmati)',
    'Dinner (Fish/Kebabs & Quinoa)',
    'Post-Workout Recovery Shake',
  ];

  // Save changes to state and localStorage
  const updateLog = (newLog: HabitLog) => {
    setHabitLog(newLog);
    saveHabitLog(newLog);
    setStreakCount(getStreakCount());
  };

  const handleAddWater = (amount: number) => {
    const updatedMl = Math.max(0, habitLog.waterMl + amount);
    updateLog({ ...habitLog, waterMl: updatedMl });
    onShowToast(`Logged +${amount}ml Water! Current total: ${updatedMl}ml`);
  };

  const handleResetWater = () => {
    updateLog({ ...habitLog, waterMl: 0 });
    onShowToast('Reset water intake counter.');
  };

  const handleToggleMeal = (index: number) => {
    const newMeals = [...habitLog.mealsChecked];
    newMeals[index] = !newMeals[index];
    updateLog({ ...habitLog, mealsChecked: newMeals });
    onShowToast(newMeals[index] ? 'Meal completed!' : 'Meal unchecked');
  };

  const handleToggleWorkout = () => {
    const newStatus = !habitLog.workoutCompleted;
    updateLog({ ...habitLog, workoutCompleted: newStatus });
    onShowToast(newStatus ? '🔥 Workout marked complete! Streak incremented!' : 'Workout unchecked');
  };

  return (
    <section id="tracker" className="py-16 bg-[#14171D] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>DAILY HABIT & STREAK TRACKER</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            CONSISTENCY <span className="text-emerald-400">DASHBOARD</span>
          </h2>
          <p className="text-sm text-gray-400 mt-3">
            Log water, meal adherence, and daily workout completions. Saved instantly to local storage.
          </p>
        </div>

        {/* Streak Counter Header Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-[#1A1E26] to-gray-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 mb-12 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Flame className="w-9 h-9 fill-amber-400 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">EVOLUTION STREAK</p>
              <h3 className="text-3xl font-black text-white font-mono">{streakCount} Consecutive Days</h3>
              <p className="text-xs text-gray-400 mt-0.5">Keep completing your water and workout logs to expand your streak!</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-bold font-mono">
              Today: {new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Water Intake Counter with Visual bottle fill */}
          <div className="lg:col-span-5 bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <span>Hydration Counter</span>
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                  {habitLog.waterMl} / {waterTarget} ml
                </span>
              </div>

              {/* Animated Water Bottle Graphic */}
              <div className="relative w-32 h-56 mx-auto bg-gray-950 border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl my-6 flex flex-col justify-end p-1">
                {/* Cap */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-cyan-500 rounded-b-md" />
                
                {/* Fluid Fill with Wave Effect */}
                <div
                  className="w-full bg-gradient-to-t from-cyan-600 via-cyan-400 to-emerald-400 rounded-2xl transition-all duration-700 ease-out flex items-center justify-center text-xs font-black text-gray-950 font-mono shadow-lg"
                  style={{ height: `${waterPct}%` }}
                >
                  {waterPct > 15 && <span>{waterPct}%</span>}
                </div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="btn-add-water-250"
                  onClick={() => handleAddWater(250)}
                  className="py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>250ml</span>
                </button>

                <button
                  id="btn-add-water-500"
                  onClick={() => handleAddWater(500)}
                  className="py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>500ml</span>
                </button>

                <button
                  id="btn-reset-water"
                  onClick={handleResetWater}
                  className="py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Meal Checklists & Daily Workout Completion */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Meal Checklists */}
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>Daily Meal Adherence</span>
              </h3>

              <div className="space-y-3">
                {mealLabels.map((label, idx) => {
                  const isChecked = habitLog.mealsChecked[idx] || false;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleMeal(idx)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#14171D] border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <span className="text-xs font-bold">{label}</span>
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                        isChecked ? 'bg-emerald-500 border-emerald-400 text-gray-950' : 'border-gray-700'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Workout Toggle */}
            <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-base font-black text-white uppercase tracking-wide flex items-center space-x-2">
                  <Dumbbell className="w-5 h-5 text-amber-400" />
                  <span>Daily Session Completed</span>
                </h4>
                <p className="text-xs text-gray-400">Toggle once you finish your daily workout at Pulse Matrix or home.</p>
              </div>

              <button
                id="btn-toggle-workout-complete"
                onClick={handleToggleWorkout}
                className={`px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center space-x-2 ${
                  habitLog.workoutCompleted
                    ? 'bg-emerald-500 text-gray-950 shadow-emerald-500/30'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{habitLog.workoutCompleted ? 'Workout Done' : 'Mark Completed'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
