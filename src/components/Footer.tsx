import React from 'react';
import { Activity, MapPin, Phone, Mail, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#090A0D] border-t border-gray-800 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-800/80">
          
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-white tracking-wider">
                PULSE<span className="text-emerald-400">MATRIX</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              AI-Powered Elite Human Evolution Gym & Biometric Optimization Club in Hyderabad, Pakistan. Integrating real-time computer vision, customized macro splits, and master strength coaching.
            </p>
          </div>

          {/* Col 2: Location */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Flagship Location</p>
            <div className="flex items-start space-x-2 text-gray-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Opposite Dawood Super Market, Auto Bahn Road, Hyderabad, Pakistan.</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 pt-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+92 22 2781000 / +92 300 1234567</span>
            </div>
          </div>

          {/* Col 3: Hours */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-white uppercase tracking-wider text-xs">Operating Hours</p>
            <p className="text-emerald-400 font-mono font-bold">24/7 Access for Club Members</p>
            <p className="text-gray-400">Coaching Staff: 06:00 AM - 11:00 PM</p>
            <p className="text-gray-400">AI Biometric Lab: Always Active</p>
          </div>

        </div>

        {/* Disclaimer Footer Note */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} PULSE MATRIX PERFORMANCE CLUB. All rights reserved.</p>

          <div className="flex items-center space-x-2 text-amber-400/90 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>PULSE MATRIX AI outputs are for fitness guidance only and do not replace professional medical advice.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
