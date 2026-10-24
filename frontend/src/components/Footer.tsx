import React from 'react';
import { AlertTriangle, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Medical Research Disclaimer Box */}
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-sm flex items-start space-x-3 text-left">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300 font-semibold">Academic Prototype Disclaimer: </strong>
            This application is an academic AI research prototype. Its predictions are experimental and are not a medical diagnosis. Results must not be used to make treatment decisions. Consult a qualified medical professional for clinical evaluation.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200">Lung Cancer X-Ray AI Detector</span>
            <span>&bull;</span>
            <span>Transfer Learning via MobileNetV2 &amp; ImageNet</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span>FastAPI</span>
            <span>&bull;</span>
            <span>TensorFlow 2</span>
            <span>&bull;</span>
            <span>Supabase Auth &amp; PostgreSQL</span>
            <span>&bull;</span>
            <span>React + Vite</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
