import React, { useState } from 'react';
import { UserProfile, FitnessGoal, FitnessLevel } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { X, UserCheck, Key, User, Mail, Sparkles, CheckCircle2, ShieldCheck, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithGoogle, saveUserProfileToFirestore, signInWithEmail, signUpWithEmail, getUserProfileFromFirestore } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (user: UserProfile) => void;
  activeUser: UserProfile;
  contextMsg?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSaveUser, activeUser, contextMsg }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(activeUser?.name || '');
  const [email, setEmail] = useState(activeUser?.email || '');
  const [password, setPassword] = useState('pulse123');
  const [goal, setGoal] = useState<FitnessGoal>(activeUser?.goal || 'Muscle Gain');
  const [level, setLevel] = useState<FitnessLevel>(activeUser?.level || 'Intermediate');
  const [age, setAge] = useState<number>(activeUser?.age || 26);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(activeUser?.gender || 'male');
  const [heightCm, setHeightCm] = useState<number>(activeUser?.heightCm || 178);
  const [weightKg, setWeightKg] = useState<number>(activeUser?.weightKg || 76);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'extra'>(activeUser?.activityLevel || 'active');

  if (!isOpen) return null;

  // Handle Demo Credentials Fill
  const handlePrefillDemo = (demoUser: UserProfile) => {
    setName(demoUser.name);
    setEmail(demoUser.email);
    setPassword('pulse123');
    setGoal(demoUser.goal);
    setLevel(demoUser.level);
    setAge(demoUser.age);
    setGender(demoUser.gender);
    setHeightCm(demoUser.heightCm);
    setWeightKg(demoUser.weightKg);
    setActivityLevel(demoUser.activityLevel);
    setAuthError(null);
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setAuthError(null);
    try {
      const gUser = await signInWithGoogle();
      if (gUser) {
        // Fetch existing profile or create new
        let existingProfile = await getUserProfileFromFirestore(gUser.uid);
        if (!existingProfile) {
          existingProfile = {
            id: gUser.uid,
            name: gUser.displayName || name || 'Pulse Member',
            email: gUser.email || email || 'member@pulse.pk',
            goal,
            level,
            age: Number(age) || 25,
            gender,
            heightCm: Number(heightCm) || 175,
            weightKg: Number(weightKg) || 75,
            activityLevel,
            role: gUser.email?.includes('admin') ? 'admin' : 'user',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
            avatarUrl: gUser.photoURL || activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          };
          await saveUserProfileToFirestore(existingProfile);
        }
        onSaveUser(existingProfile);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError(null);

    try {
      if (isSignup) {
        // --- SIGN UP FLOW ---
        let firebaseUid = `user_${Date.now()}`;
        try {
          const authUser = await signUpWithEmail(email, password);
          firebaseUid = authUser.uid;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            setAuthError('An account with this email already exists! Click "Sign In" below to log in.');
            setIsSubmitting(false);
            return;
          } else if (authErr?.code === 'auth/weak-password') {
            setAuthError('Password must be at least 6 characters long.');
            setIsSubmitting(false);
            return;
          } else {
            console.warn('Firebase email signup warning:', authErr);
          }
        }

        const newUserProfile: UserProfile = {
          id: firebaseUid,
          name: name || 'Pulse Member',
          email: email || 'member@pulse.pk',
          goal,
          level,
          age: Number(age) || 25,
          gender,
          heightCm: Number(heightCm) || 175,
          weightKg: Number(weightKg) || 75,
          activityLevel,
          role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        };

        // Fire-and-forget or non-blocking async save to Firestore
        saveUserProfileToFirestore(newUserProfile).catch((err) => console.warn('Firestore background save:', err));
        
        onSaveUser(newUserProfile);
        setIsSubmitting(false);
        onClose();

      } else {
        // --- SIGN IN FLOW ---
        let firebaseUid = activeUser.id || `user_${Date.now()}`;
        try {
          const authUser = await signInWithEmail(email, password);
          firebaseUid = authUser.uid;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential' || authErr?.code === 'auth/wrong-password') {
            // Account might not exist in Auth yet or wrong password
            setAuthError('Invalid credentials or account does not exist. Click "Sign Up" above to create an account!');
            setIsSubmitting(false);
            return;
          } else {
            console.warn('Firebase email signin warning:', authErr);
          }
        }

        // Try loading existing profile from Firestore
        let fetchedProfile = await getUserProfileFromFirestore(firebaseUid);
        if (!fetchedProfile) {
          fetchedProfile = {
            id: firebaseUid,
            name: name || email.split('@')[0] || 'Pulse Member',
            email: email,
            goal,
            level,
            age: Number(age) || 25,
            gender,
            heightCm: Number(heightCm) || 175,
            weightKg: Number(weightKg) || 75,
            activityLevel,
            role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
            isActive: true,
            createdAt: new Date().toISOString().split('T')[0],
            avatarUrl: activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          };
          saveUserProfileToFirestore(fetchedProfile).catch((err) => console.warn('Firestore background save:', err));
        }

        onSaveUser(fetchedProfile);
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setAuthError('Authentication error occurred. Please check your network or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#14171D] border border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-white cursor-default"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-full transition hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Mode Switcher */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PULSE MATRIX AUTHENTICATION</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide mb-3">
            {isSignup ? 'Create Pulse Matrix Account' : 'Welcome Back Member'}
          </h2>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-gray-900 border border-gray-800 rounded-2xl mb-2">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                setAuthError(null);
              }}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
                !isSignup
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                setAuthError(null);
              }}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
                isSignup
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>

          {contextMsg && (
            <div className="mt-2 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-medium">
              ✨ {contextMsg}
            </div>
          )}

          <div className="mt-2 inline-flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-400 text-[11px] px-3 py-1 rounded-md border border-emerald-500/30 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase DB: <strong className="text-white">pulse-matrix-hackathon</strong></span>
          </div>
        </div>

        {/* Error Banner if any */}
        {authError && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/60 rounded-2xl text-xs text-red-200 flex items-start space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-300 mb-1">Authentication Notice</p>
              <p>{authError}</p>
              {authError.includes('Sign Up') && !isSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setAuthError(null);
                  }}
                  className="mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition"
                >
                  Switch to Sign Up Form
                </button>
              )}
              {authError.includes('Sign In') && isSignup && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setAuthError(null);
                  }}
                  className="mt-2 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition"
                >
                  Switch to Sign In Form
                </button>
              )}
            </div>
          </div>
        )}

        {/* Google Firebase Sign In */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || isSubmitting}
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg"
          >
            {loadingGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{loadingGoogle ? 'Connecting Firebase...' : 'Sign In with Google (Firebase)'}</span>
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-500"><span className="bg-[#14171D] px-2">or email authentication</span></div>
          </div>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="bg-gray-900/90 border border-emerald-500/40 rounded-2xl p-3 mb-6">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fast Pre-fill Sample Member Accounts</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {INITIAL_USERS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handlePrefillDemo(demo)}
                className="text-left px-3 py-1.5 bg-gray-800 hover:bg-gray-700/80 border border-gray-700/80 rounded-xl transition text-xs group"
              >
                <p className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                  <span>{demo.name}</span>
                  {demo.role === 'admin' && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded">Admin</span>}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{demo.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name - Required for Sign Up */}
            {isSignup && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required={isSignup}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Baloch"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className={isSignup ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@pulse.pk"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className={isSignup ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Additional Biometric fields for Sign Up */}
            {isSignup && (
              <>
                {/* Fitness Goal */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Fitness Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Weight Loss">Weight Loss (Fat Shred)</option>
                    <option value="Muscle Gain">Muscle Gain (Hypertrophy)</option>
                    <option value="Maintenance">Maintenance (Strength & Tone)</option>
                    <option value="Body Recomposition">Body Recomposition</option>
                  </select>
                </div>

                {/* Fitness Level */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Fitness Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as FitnessLevel)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="Beginner">Beginner (&lt; 6 months)</option>
                    <option value="Intermediate">Intermediate (1-3 yrs)</option>
                    <option value="Advanced">Advanced (3-5 yrs)</option>
                    <option value="Elite">Elite Athlete (&gt; 5 yrs)</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Height (cm) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Weight (kg) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Activity Level */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Weekly Activity</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    <option value="sedentary">Sedentary (Desk job, no gym)</option>
                    <option value="light">Lightly Active (1-2 workouts/wk)</option>
                    <option value="moderate">Moderately Active (3-4 workouts/wk)</option>
                    <option value="active">Active Gym Goer (5+ workouts/wk)</option>
                    <option value="extra">Extra Active (Athlete / Double sessions)</option>
                  </select>
                </div>
              </>
            )}

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-gray-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>
              {isSubmitting
                ? 'Saving to Firebase...'
                : isSignup
                ? 'Create Account & Save Profile'
                : 'Sign In & Access Dashboard'}
            </span>
          </button>
        </form>

        {/* Toggle Footer link */}
        <div className="mt-4 text-center text-xs text-gray-400">
          {isSignup ? (
            <p>
              Already have a Pulse Matrix account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(false);
                  setAuthError(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignup(true);
                  setAuthError(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Create a New Account (Sign Up)
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
