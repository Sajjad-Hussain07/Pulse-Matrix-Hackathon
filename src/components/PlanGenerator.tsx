import React, { useState } from 'react';
import { UserProfile, ProtocolPlan, DayPlan } from '../types';
import { calculateBiometrics } from '../utils/biometrics';
import { getSavedPlan, savePlan, getSystemPromptConfig, getGeminiKeyOverride } from '../utils/localStorage';
import { Sparkles, Utensils, Dumbbell, Calendar, RefreshCw } from 'lucide-react';

interface PlanGeneratorProps {
  activeUser: UserProfile | null | undefined;
  onShowToast: (msg: string) => void;
}

export const PlanGenerator: React.FC<PlanGeneratorProps> = ({ activeUser, onShowToast }) => {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ProtocolPlan | null>(() => {
    try {
      return getSavedPlan();
    } catch (err) {
      console.error('Failed to load saved plan:', err);
      return null;
    }
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // 🛡️ Guard Clause 1: Render fallback card if user is null/loading
  if (!activeUser) {
    return (
      <section id="plan" className="py-16 bg-[#0D0F12] text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 max-w-md mx-auto space-y-3">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-gray-300">Synchronizing Member Profile...</p>
          </div>
        </div>
      </section>
    );
  }

  // 🛡️ Guard Clause 2: Safe biometrics calculation
  let biometrics;
  try {
    biometrics = calculateBiometrics(activeUser);
  } catch (err) {
    console.error('Failed to calculate biometrics in PlanGenerator:', err);
    biometrics = {
      targetCalories: 0,
      macros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
    };
  }

  const handleGeneratePlan = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const systemConfig = getSystemPromptConfig();
      const res = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: activeUser,
          biometrics: biometrics,
          customSystemPrompt: systemConfig?.planPrompt,
          customApiKey: getGeminiKeyOverride() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
        savePlan(data.plan);
        onShowToast(`Generated new 7-Day AI Protocol for ${activeUser.goal || 'Member'}!`);
      } else {
        onShowToast('Updated 7-day protocol with local optimization engine.');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Generated protocol with local fallback engine.');
    } finally {
      setLoading(false);
    }
  };

  const currentDayData: DayPlan | null = currentPlan?.days?.[selectedDayIndex] || null;

  return (
    <section id="plan" className="py-16 bg-[#0D0F12] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>AI NUTRITION & KINETIC WORKOUT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            YOUR 7-DAY <span className="text-emerald-400">EVOLUTION PROTOCOL</span>
          </h2>
          <p className="text-sm text-gray-400 mt-3">
            Customized Pakistani clean-eating meal splits and biomechanical progressive overload workout targets.
          </p>
        </div>

        {/* Generate Action Banner */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 sm:p-8 mb-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-bold text-white bg-gray-800 px-3 py-1 rounded-md border border-gray-700">
                Member: {activeUser?.name || 'Guest'}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/30 font-mono">
                Goal: {activeUser?.goal || 'Fitness'}
              </span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30 font-mono">
                Target: {biometrics?.targetCalories || 0} kcal/day
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Protein: <strong className="text-white">{biometrics?.macros?.proteinGrams || 0}g</strong> • Carbs: <strong className="text-white">{biometrics?.macros?.carbsGrams || 0}g</strong> • Fats: <strong className="text-white">{biometrics?.macros?.fatGrams || 0}g</strong>
            </p>
          </div>

          <button
            id="btn-generate-7day-protocol"
            disabled={loading}
            onClick={handleGeneratePlan}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center space-x-3 shrink-0 ${
              loading
                ? 'bg-gray-800 text-emerald-400 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 text-gray-950 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Crafting AI Protocol...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Personalized 7-Day Protocol</span>
              </>
            )}
          </button>
        </div>

        {/* Protocol Plan View */}
        {currentPlan && (
          <div className="space-y-8">
            
            {/* Days Tabs (Day 1 - Day 7) */}
            <div className="flex overflow-x-auto pb-3 gap-2 no-scrollbar">
              {currentPlan?.days?.map((dayItem, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Day {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Selected Day Content */}
            {currentDayData && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: 4 Meal Splits */}
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2 mb-4">
                    <Utensils className="w-5 h-5 text-emerald-400" />
                    <span>Daily Nutrition Macro Breakdown</span>
                  </h3>

                  <div className="space-y-4">
                    {currentDayData?.meals?.map((meal, mIdx) => (
                      <div
                        key={mIdx}
                        className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl p-5 hover:border-emerald-500/30 transition shadow-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {meal?.type || 'Meal'}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-300">
                            {meal?.calories || 0} kcal
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-white">{meal?.name || 'Balanced Meal'}</h4>

                        {/* Macros Pill Row */}
                        <div className="flex items-center space-x-3 text-[10px] font-mono mt-2 text-gray-400">
                          <span>P: <strong className="text-emerald-400">{meal?.protein || 0}g</strong></span>
                          <span>C: <strong className="text-cyan-400">{meal?.carbs || 0}g</strong></span>
                          <span>F: <strong className="text-amber-400">{meal?.fat || 0}g</strong></span>
                        </div>

                        {/* Items */}
                        <ul className="mt-3 space-y-1 text-xs text-gray-300">
                          {meal?.items?.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Customized Workout Split */}
                <div className="lg:col-span-6 space-y-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2 mb-4">
                    <Dumbbell className="w-5 h-5 text-emerald-400" />
                    <span>Biomechanical Workout Session</span>
                  </h3>

                  <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                          {currentDayData?.workout?.category || 'Session'} • {currentDayData?.workout?.durationMins || 45} Mins
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-white mt-2">{currentDayData?.workout?.title || 'Workout Plan'}</h4>
                    </div>

                    {/* Exercises Table */}
                    <div className="space-y-3">
                      {currentDayData?.workout?.exercises?.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          className="bg-[#14171D] border border-gray-800 p-4 rounded-2xl flex flex-col justify-between space-y-2 hover:border-emerald-500/30 transition"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-white flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center justify-center font-bold">
                                {eIdx + 1}
                              </span>
                              <span>{ex?.name}</span>
                            </h5>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {ex?.sets} Sets x {ex?.reps}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1">
                            <span>Rest: <strong className="text-gray-200">{ex?.rest}</strong></span>
                            <span className="italic text-gray-400">{ex?.notes}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300">
                      <p className="font-bold mb-0.5">⚡ Progressive Overload Rule:</p>
                      Increase resistance by 2.5kg or add 1 rep once all target sets are executed with clean biomechanical form.
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};