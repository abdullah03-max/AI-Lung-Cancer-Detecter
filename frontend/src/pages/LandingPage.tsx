import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Cpu,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import type { ModelInfo } from '../types';

export const LandingPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    api.getModelInfo()
      .then(setModelInfo)
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-16 py-10 text-left">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#DCE3E7] text-xs font-semibold text-[#19354A] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#397C78]" />
              <span>Thoracic Radiology Evaluation System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#19354A] tracking-tight leading-tight">
              Automated Deep Learning Classification for Chest Radiographs
            </h1>

            <p className="text-base text-[#526A7A] max-w-xl leading-relaxed">
              A clinical decision-support and research platform utilizing convolutional neural network transfer learning to evaluate thoracic radiographs and classify pulmonary patterns into Cancer and Normal conditions.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/predict"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4 text-[#397C78]" />
                <span>Upload &amp; Analyze Radiograph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-[#F4F6F7] text-[#19354A] font-semibold text-xs border border-[#DCE3E7] transition-colors"
              >
                <span>Launch Workstation</span>
              </Link>
            </div>

            {/* Benchmark Highlights */}
            <div className="pt-6 border-t border-[#DCE3E7] grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-[#19354A]">
                  {modelInfo?.dataset_summary?.total_images_scanned
                    ? `${modelInfo.dataset_summary.total_images_scanned.toLocaleString()}+`
                    : '5,856'}
                </p>
                <p className="text-xs text-[#667580] font-medium mt-0.5">
                  Verified Radiographs
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-[#39704F]">
                  {modelInfo?.evaluation_metrics
                    ? `${(modelInfo.evaluation_metrics.overall.accuracy * 100).toFixed(1)}%`
                    : '81.7%'}
                </p>
                <p className="text-xs text-[#667580] font-medium mt-0.5">
                  Evaluation Accuracy
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-[#19354A]">224 &times; 224</p>
                <p className="text-xs text-[#667580] font-medium mt-0.5">
                  Resolution Matrix
                </p>
              </div>
            </div>
          </div>

          {/* Right Hero PACS Simulator Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#DCE3E7] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E7]">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#19354A]" />
                  <span className="text-xs font-semibold text-[#19354A]">
                    Thoracic Diagnostic Preview
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#526A7A] px-2 py-0.5 rounded bg-[#F4F6F7] border border-[#DCE3E7]">
                  PA Projection
                </span>
              </div>

              {/* PACS Screen Representation */}
              <div className="relative h-60 rounded bg-[#122635] border border-[#DCE3E7] flex items-center justify-center overflow-hidden">
                {/* Stylized Chest Radiograph Anatomy */}
                <svg
                  className="w-40 h-40 text-slate-500/40"
                  viewBox="0 0 200 200"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M100 20 V180" strokeWidth="2" strokeDasharray="3 3" className="text-slate-400/50" />
                  <path d="M50 50 Q100 35 100 80 Q100 130 50 160 Z" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                  <path d="M150 50 Q100 35 100 80 Q100 130 150 160 Z" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
                  <circle cx="75" cy="115" r="14" className="text-[#A94442]/70" strokeWidth="2" fill="none" />
                </svg>

                <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-300">
                  <p>KV: 120 &bull; MA: 320</p>
                  <p>FILTER: MobileNetV2</p>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-white/95 rounded p-2.5 border border-[#DCE3E7] flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[10px] text-[#667580] uppercase tracking-wider">Classification Output</p>
                    <p className="text-xs font-bold text-[#19354A]">Confidence: 94.2%</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#A94442] bg-[#FBEBEB] px-2 py-0.5 rounded border border-[#A94442]/20">
                    Suspected Lesion
                  </span>
                </div>
              </div>

              {/* Class Probability Preview */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-[#263238]">
                  <span className="font-medium">Class: Cancer</span>
                  <span className="font-mono text-[#A94442] font-semibold">94.2%</span>
                </div>
                <div className="w-full bg-[#DCE3E7] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#A94442] h-1.5 rounded-full w-[94%]" />
                </div>

                <div className="flex justify-between text-[#263238] pt-1">
                  <span className="font-medium">Class: Normal</span>
                  <span className="font-mono text-[#39704F] font-semibold">5.8%</span>
                </div>
                <div className="w-full bg-[#DCE3E7] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#39704F] h-1.5 rounded-full w-[6%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#DCE3E7] pt-12 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-[#19354A]">
              Clinical Diagnostic Workflow
            </h2>
            <p className="text-xs text-[#667580] mt-1">
              Standardized three-phase pipeline for processing thoracic chest radiographs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center font-bold text-sm text-[#19354A]">
                1
              </div>
              <h3 className="text-sm font-semibold text-[#19354A]">
                Radiograph Acquisition &amp; Verification
              </h3>
              <p className="text-xs text-[#667580] leading-relaxed">
                Accepts frontal anterior-posterior (AP) and posterior-anterior (PA) chest radiographs. Automated quality checks inspect border exposure and monochromatic levels to reject invalid non-medical uploads.
              </p>
            </div>

            <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center font-bold text-sm text-[#19354A]">
                2
              </div>
              <h3 className="text-sm font-semibold text-[#19354A]">
                Deep Feature Extraction &amp; Inference
              </h3>
              <p className="text-xs text-[#667580] leading-relaxed">
                Transfer learning with ImageNet pre-trained representations maps normalized radiographs into high-dimensional feature embeddings, evaluating bilateral pulmonary tissue against validated training patterns.
              </p>
            </div>

            <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center font-bold text-sm text-[#19354A]">
                3
              </div>
              <h3 className="text-sm font-semibold text-[#19354A]">
                Probabilistic Report &amp; Audit Trail
              </h3>
              <p className="text-xs text-[#667580] leading-relaxed">
                Generates a complete class probability distribution, model confidence rating, research disclaimer, and encrypted historical audit record accessible only to the authenticated clinician.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Quality Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-8 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#19354A]">
                Quality Assurance &amp; Data Governance
              </h3>
              <p className="text-xs text-[#667580] leading-relaxed">
                Designed according to clinical software principles with strict verification boundaries, stratified evaluation splits, and authenticated session management.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center space-x-2.5 text-xs text-[#263238]">
                  <CheckCircle2 className="w-4 h-4 text-[#39704F] shrink-0" />
                  <span>Transfer Learning backbone (MobileNetV2) trained on 5,856 radiographs</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-[#263238]">
                  <CheckCircle2 className="w-4 h-4 text-[#39704F] shrink-0" />
                  <span>Zero-leakage independent test dataset validation</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-[#263238]">
                  <CheckCircle2 className="w-4 h-4 text-[#39704F] shrink-0" />
                  <span>Secure user-isolated audit logs with deletion capability</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs text-[#263238]">
                  <CheckCircle2 className="w-4 h-4 text-[#39704F] shrink-0" />
                  <span>Integrated guardrail rejecting non-radiographic graphics or photos</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7] space-y-1">
                <Lock className="w-4 h-4 text-[#526A7A]" />
                <p className="font-semibold text-[#19354A]">Private Audit Logs</p>
                <p className="text-[11px] text-[#667580]">User-isolated session records</p>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7] space-y-1">
                <Layers className="w-4 h-4 text-[#526A7A]" />
                <p className="font-semibold text-[#19354A]">Balanced Weights</p>
                <p className="text-[11px] text-[#667580]">Optimized for dataset class balance</p>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7] space-y-1">
                <Cpu className="w-4 h-4 text-[#526A7A]" />
                <p className="font-semibold text-[#19354A]">Low-Latency Inference</p>
                <p className="text-[11px] text-[#667580]">Dual-runtime ONNX &amp; Keras engine</p>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7] space-y-1">
                <FileCheck2 className="w-4 h-4 text-[#526A7A]" />
                <p className="font-semibold text-[#19354A]">Research Compliant</p>
                <p className="text-[11px] text-[#667580]">Clear educational disclaimer</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
