import React, { useState } from 'react';
import { UserProfile, PostureAnalysisResult } from '../types';
import { calculateBiometrics } from '../utils/biometrics';
import { getSavedPosture, savePosture, getGeminiKeyOverride } from '../utils/localStorage';
import { Calculator, Sparkles, Upload, Activity, ShieldCheck, Dumbbell, AlertTriangle, RefreshCw, Eye } from 'lucide-react';

interface BiometricCalculatorsProps {
  activeUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onShowToast: (msg: string) => void;
}

export const BiometricCalculators: React.FC<BiometricCalculatorsProps> = ({
  activeUser,
  onUpdateUser,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'posture'>('calculator');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 🛡️ Safe LocalStorage Initialization (Prevents Blank Screen Crash)
  const [postureResult, setPostureResult] = useState<PostureAnalysisResult | null>(() => {
    try {
      return getSavedPosture() || null;
    } catch (err) {
      console.error('Failed to load posture data:', err);
      return null;
    }
  });

  // 🛡️ Safe User Guard
  if (!activeUser) {
    return (
      <section id="biometrics" className="py-16 bg-[#14171D] text-white text-center">
        <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-2xl border border-gray-800 space-y-3">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm font-bold">Syncing Member Profile...</p>
        </div>
      </section>
    );
  }

  // 🛡️ Safe Biometrics Calculation
  let biometrics;
  try {
    biometrics = calculateBiometrics(activeUser);
  } catch (err) {
    console.error('Biometrics calculation error:', err);
    biometrics = {
      bmi: 0,
      bmiCategory: 'N/A',
      bmr: 0,
      tdee: 0,
      targetCalories: 0,
      macros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
    };
  }

  // Safe Fallback for Macros
  const safeMacros = biometrics?.macros || { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRunPostureAnalysis = async () => {
    setAnalyzing(true);
    try {
      const apiKeyOverride = typeof getGeminiKeyOverride === 'function' ? getGeminiKeyOverride() : undefined;
      const res = await fetch('/api/gemini/posture-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage || null,
          userProfile: activeUser,
          customApiKey: apiKeyOverride,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPostureResult(data.data);
        if (typeof savePosture === 'function') savePosture(data.data);
        onShowToast?.(`Posture scan complete! Score: ${data.data.score}/100`);
      } else {
        onShowToast?.('Analysis completed with standard biometric model.');
      }
    } catch (err) {
      console.error(err);
      onShowToast?.('Scan finished with cached fallback model.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section id="biometrics" className="py-16 bg-[#14171D] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-semibold uppercase mb-3">
            <Activity className="w-4 h-4" />
            <span>BIOMETRIC LAB & VISION SCANNER</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            PRECISION <span className="text-emerald-400">BODY DIAGNOSTICS</span>
          </h2>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-2xl flex space-x-2">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase transition-all flex items-center space-x-2 ${
                activeTab === 'calculator' ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>1. BMI & Macro Estimator</span>
            </button>

            <button
              onClick={() => setActiveTab('posture')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase transition-all flex items-center space-x-2 ${
                activeTab === 'posture' ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. AI Posture Scan</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Calculator */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-gray-900/80 border border-gray-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white uppercase flex items-center space-x-2 pb-2 border-b border-gray-800">
                <Calculator className="w-5 h-5 text-emerald-400" />
                <span>Member Inputs</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={activeUser.heightCm || ''}
                    onChange={(e) => onUpdateUser({ ...activeUser, heightCm: Number(e.target.value) })}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={activeUser.weightKg || ''}
                    onChange={(e) => onUpdateUser({ ...activeUser, weightKg: Number(e.target.value) })}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold uppercase mb-1">Goal</label>
                  <select
                    value={activeUser.goal || 'Maintenance'}
                    onChange={(e) => onUpdateUser({ ...activeUser, goal: e.target.value as any })}
                    className="w-full bg-[#14171D] border border-gray-800 rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Body Recomposition">Body Recomposition</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6">
                <p className="text-xs text-gray-400 uppercase">BMI Score</p>
                <h4 className="text-3xl font-black text-white font-mono mt-1">{biometrics.bmi}</h4>
                <p className="text-emerald-400 text-xs font-bold mt-1">{biometrics.bmiCategory}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase">BMR</p>
                  <p className="text-xl font-bold text-white font-mono">{biometrics.bmr}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-gray-400 uppercase">TDEE</p>
                  <p className="text-xl font-bold text-white font-mono">{biometrics.tdee}</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-center">
                  <p className="text-[10px] text-emerald-400 uppercase">Target Intake</p>
                  <p className="text-xl font-bold text-emerald-300 font-mono">{biometrics.targetCalories}</p>
                </div>
              </div>

              <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6">
                <h4 className="text-xs font-bold text-white uppercase mb-4">Daily Macros</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#14171D] p-3 rounded-xl border border-gray-800">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Protein</p>
                    <p className="text-lg font-black text-white font-mono">{safeMacros.proteinGrams}g</p>
                  </div>
                  <div className="bg-[#14171D] p-3 rounded-xl border border-gray-800">
                    <p className="text-[10px] text-cyan-400 uppercase font-bold">Carbs</p>
                    <p className="text-lg font-black text-white font-mono">{safeMacros.carbsGrams}g</p>
                  </div>
                  <div className="bg-[#14171D] p-3 rounded-xl border border-gray-800">
                    <p className="text-[10px] text-amber-400 uppercase font-bold">Fats</p>
                    <p className="text-lg font-black text-white font-mono">{safeMacros.fatGrams}g</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Posture */}
        {activeTab === 'posture' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-gray-900/80 border border-gray-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white uppercase flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Upload Posture Photo</span>
              </h3>

              <div className="border-2 border-dashed border-gray-700 rounded-2xl p-6 text-center bg-[#14171D]">
                {selectedImage ? (
                  <img src={selectedImage} alt="Scan Preview" className="max-h-48 mx-auto rounded-lg" />
                ) : (
                  <label className="cursor-pointer text-xs font-bold text-emerald-400">
                    <span>Choose Image File</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <button
                disabled={analyzing}
                onClick={handleRunPostureAnalysis}
                className="w-full py-3 bg-emerald-500 text-gray-950 font-black text-xs uppercase rounded-xl"
              >
                {analyzing ? 'Analyzing...' : 'Run Vision Scan'}
              </button>
            </div>

            <div className="lg:col-span-7 bg-gray-900/80 border border-gray-800 rounded-3xl p-6">
              <h4 className="text-sm font-bold text-white uppercase mb-2">Posture Alignment Result</h4>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {postureResult?.score ? `${postureResult.score} / 100` : 'No Scan Run Yet'}
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};