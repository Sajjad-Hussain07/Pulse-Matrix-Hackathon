import React from 'react';
import { MapPin, Sparkles, ArrowRight, ShieldCheck, Zap, Users, Trophy, Cpu } from 'lucide-react';

interface HeroProps {
  onStartAnalysis: () => void;
  onExploreClasses: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAnalysis, onExploreClasses }) => {
  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16">
      
      {/* Background Image with Dark Cyber Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/pulse_matrix_hero_1786215010349.jpg"
          alt="Pulse Matrix Gym Interior"
          className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-125 scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Cyber Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F12] via-[#0D0F12]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F12] via-transparent to-[#0D0F12]" />
        
        {/* Holographic Radial Pulse Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        
        {/* Location & AI Badge */}
        <div className="inline-flex items-center space-x-2 bg-gray-900/90 border border-emerald-500/30 backdrop-blur-md px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-emerald-400 mb-8 shadow-xl shadow-emerald-950/40">
          <MapPin className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>Flagship Club: Opposite Dawood Super Market, Auto Bahn Road, Hyderabad</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Main Headline */}
        <h1 className="hero-text text-5xl sm:text-7xl lg:text-8xl text-white max-w-5xl mx-auto my-4">
          TRANSFORM YOUR BODY WITH <br className="hidden sm:inline" />
          <span className="neon-green">
            PRECISION AI BIOMETRICS
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-gray-400 max-w-3xl mx-auto font-medium uppercase tracking-wider leading-relaxed">
          Welcome to <span className="text-white font-black">PULSE MATRIX PERFORMANCE CLUB</span>. Experience real-time posture scans, automated 7-day meal protocols, biometric tracking, and elite strength coaching at our state-of-the-art Hyderabad facility.
        </p>

        {/* Dual Call-To-Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <button
            id="hero-cta-start-ai"
            onClick={onStartAnalysis}
            className="w-full sm:w-auto px-8 py-4 bg-neon-green text-black font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center space-x-3 group shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          >
            <Sparkles className="w-5 h-5 text-black group-hover:rotate-12 transition-transform" />
            <span>Start AI Analysis</span>
            <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="hero-cta-explore-classes"
            onClick={onExploreClasses}
            className="w-full sm:w-auto px-8 py-4 glass hover:bg-gray-800/80 border border-gray-800 text-white font-black text-sm uppercase tracking-widest transition-all"
          >
            Explore Gym Memberships
          </button>
        </div>

        {/* Feature Highlights Pill Row */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-gray-400 font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-2 glass px-4 py-2 border border-gray-800">
            <ShieldCheck className="w-4 h-4 neon-green" />
            <span>Gemini 3.6-Flash Computer Vision</span>
          </div>
          <div className="flex items-center space-x-2 glass px-4 py-2 border border-gray-800">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>24/7 Context-Aware AI Specialist</span>
          </div>
          <div className="flex items-center space-x-2 glass px-4 py-2 border border-gray-800">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Custom Macro & Kinetic Training</span>
          </div>
        </div>

        {/* Statistics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="glass p-6 text-center hover:border-neon-green/50 transition-all group">
            <div className="w-10 h-10 rounded-none bg-emerald-500/10 neon-green flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <p className="stat-value text-4xl font-black text-white">2,500+</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-black">Active Members</p>
          </div>

          <div className="glass p-6 text-center hover:border-neon-green/50 transition-all group">
            <div className="w-10 h-10 rounded-none bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="stat-value text-4xl font-black text-white">99.2%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-black">Goal Success Rate</p>
          </div>

          <div className="glass p-6 text-center hover:border-neon-green/50 transition-all group">
            <div className="w-10 h-10 rounded-none bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <p className="stat-value text-4xl font-black text-white">24/7</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-black">AI Guidance</p>
          </div>

          <div className="glass p-6 text-center hover:border-neon-green/50 transition-all group">
            <div className="w-10 h-10 rounded-none bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <p className="stat-value text-4xl font-black text-white">15+</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-black">Master Coaches</p>
          </div>
        </div>

      </div>
    </section>
  );
};
