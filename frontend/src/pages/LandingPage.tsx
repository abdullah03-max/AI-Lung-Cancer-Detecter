import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  UploadCloud,
  Cpu,
  BarChart2,
  Lock,
  ArrowRight,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import type { ModelInfo } from '../types';

export const LandingPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    api.getModelInfo()
      .then(setModelInfo)
      .catch((err) => console.log('Model info loading:', err));
  }, []);

  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Deep Learning Computer Vision Prototype</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              AI-Powered Lung X-Ray{' '}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Classification System
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
              An academic AI diagnostic assistant leveraging transfer learning (MobileNetV2) trained on 5,800+ chest radiographs to classify pulmonary patterns into Cancer and Normal conditions.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/predict"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Upload &amp; Analyze X-Ray</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700/80 transition-colors"
              >
                <Activity className="w-5 h-5 text-teal-400" />
                <span>View Dashboard</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-6 text-left">
              <div>
                <p className="text-2xl font-bold text-white">
                  {modelInfo?.dataset_size ? `${modelInfo.dataset_size.toLocaleString()}+` : '5,856'}
                </p>
                <p className="text-xs text-slate-400 font-medium">Dataset Radiographs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-400">
                  {modelInfo?.evaluation_metrics ? `${(modelInfo.evaluation_metrics.overall.accuracy * 100).toFixed(1)}%` : 'Active'}
                </p>
                <p className="text-xs text-slate-400 font-medium">Evaluation Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">224 &times; 224</p>
                <p className="text-xs text-slate-400 font-medium">Resolution Matrix</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-md rounded-2xl p-1 bg-gradient-to-b from-teal-500/30 via-slate-800 to-slate-900 shadow-2xl shadow-cyan-500/10">
              <div className="rounded-[15px] bg-slate-900 p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono text-teal-400">MobileNetV2 Inference</span>
                </div>

                {/* Simulated Chest Radiograph Visual */}
                <div className="relative h-64 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  
                  {/* Stylized Chest Ribcage / Lung SVG */}
                  <svg className="w-44 h-44 text-slate-700/60 transition-transform duration-500 group-hover:scale-105" viewBox="0 0 200 200" fill="none" stroke="currentColor">
                    <path d="M100 20 V180" strokeWidth="3" strokeDasharray="4 4" className="text-teal-500/40" />
                    <path d="M50 50 Q100 30 100 80 Q100 130 50 160 Z" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <path d="M150 50 Q100 30 100 80 Q100 130 150 160 Z" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                    <circle cx="80" cy="110" r="18" className="text-rose-500/40 animate-pulse" strokeWidth="2" fill="none" />
                  </svg>

                  {/* Dynamic overlay pill */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Model Inference Output</p>
                      <p className="text-sm font-semibold text-emerald-400">Probabilities Calculated</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded bg-teal-500/20 text-teal-300">
                      224x224 RGB
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">Class 1: Cancer</span>
                    <span className="text-teal-400 font-mono">Softmax Probabilities</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full w-3/4" />
                  </div>
                  <div className="flex justify-between text-xs font-medium pt-1">
                    <span className="text-slate-300">Class 2: NORMAL</span>
                    <span className="text-slate-400 font-mono">ImageNet Features</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-700 h-2 rounded-full w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-white tracking-tight">How PulmoScan AI Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            End-to-end clinical radiograph workflow designed for transparency, verification, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-xl font-semibold text-white">Upload Radiograph</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload standard DICOM-exported JPEG, PNG, or WEBP chest X-ray images. Automatic format and corruption validation runs immediately.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-xl font-semibold text-white">Deep Feature Extraction</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The MobileNetV2 backbone extracts localized pulmonary features, comparing high-dimensional representations against learned patterns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-xl font-semibold text-white">Probability Breakdown</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive complete class probability distribution, model confidence rating, research disclaimer, and private encrypted history logging.
            </p>
          </div>
        </div>
      </section>

      {/* Technology & Architecture Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Architected for Research Reproducibility
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm">
                Unlike opaque black-box models, this application integrates verifiable data hygiene checks, zero-leakage stratified splits, class-imbalance weighting, and secure Supabase PostgreSQL Row Level Security (RLS).
              </p>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>MobileNetV2 / EfficientNetB0 pretrained on ImageNet</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Real Kaggle Chest Radiograph dataset (5,856 validated images)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Supabase Authentication with server-side JWT verification</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>Strict patient confidentiality: no raw medical image persistence</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <Lock className="w-6 h-6 text-teal-400" />
                <h4 className="font-semibold text-white text-sm">RLS Enforced</h4>
                <p className="text-xs text-slate-400">Users can only query or delete their own predictions.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <BarChart2 className="w-6 h-6 text-cyan-400" />
                <h4 className="font-semibold text-white text-sm">Balanced Loss</h4>
                <p className="text-xs text-slate-400">Handles 73% / 27% class skew with balanced class weights.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <Cpu className="w-6 h-6 text-blue-400" />
                <h4 className="font-semibold text-white text-sm">CPU / GPU Agnostic</h4>
                <p className="text-xs text-slate-400">Optimized inference runnable on standard workstations.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                <h4 className="font-semibold text-white text-sm">Auditable History</h4>
                <p className="text-xs text-slate-400">Full model versioning and probability records.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
