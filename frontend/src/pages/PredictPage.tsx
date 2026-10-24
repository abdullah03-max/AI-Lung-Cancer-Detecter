import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  X,
  AlertTriangle,
  CheckCircle,
  Activity,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { PredictionResult } from '../types';

export const PredictPage: React.FC = () => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preCheckWarning, setPreCheckWarning] = useState<string | null>(null);

  // Quick client-side color check on image selection
  const inspectImageChannels = (url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 64;
        const h = 64;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let totalDiff = 0;
        const sampleCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalDiff += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b)) / 3;
        }

        const avgDiff = totalDiff / sampleCount;
        if (avgDiff > 10) {
          setPreCheckWarning(
            'High color saturation detected. Medical chest X-rays are monochromatic radiographs. Unrelated photos or wallpapers will be rejected by the validation guardrail.'
          );
        } else {
          setPreCheckWarning(null);
        }
      } catch {
        // Ignore canvas CORS or inspection failures
      }
    };
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setResult(null);
    setPreCheckWarning(null);

    // Validate type
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validExtensions.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|bmp)$/i)) {
      setError('Unsupported file type. Please upload a chest X-ray in JPEG, PNG, or WEBP format.');
      return;
    }

    // Validate size (15 MB max)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15 MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    inspectImageChannels(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setPreCheckWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await api.predictImage(selectedFile, token || undefined);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred during radiograph analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const chartData = result?.probabilities
    ? Object.entries(result.probabilities).map(([name, prob]) => ({
        class: name,
        probability: Math.round(prob * 1000) / 10,
      }))
    : [];

  const isCancerDetected = result?.predicted_class?.toLowerCase().includes('cancer');
  const isGuardrailRejection = error?.toLowerCase().includes('non-x-ray') || error?.toLowerCase().includes('radiograph') || error?.toLowerCase().includes('manifold');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1 text-left">
        <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
          <Activity className="w-4 h-4" />
          <span>Computer Vision Diagnostic Workspace</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Chest Radiograph Analysis</h1>
        <p className="text-sm text-slate-400">
          Upload a high-resolution frontal chest X-ray to calculate AI-predicted pulmonary classifications.
        </p>
      </div>

      {/* Error or Guardrail Rejection Alert */}
      {error && (
        <div className={`p-5 rounded-2xl border text-sm flex items-start space-x-3.5 text-left shadow-lg ${
          isGuardrailRejection
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}>
          {isGuardrailRejection ? (
            <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-amber-400" />
          ) : (
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-400" />
          )}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-bold text-base text-white">
                {isGuardrailRejection ? 'Medical Guardrail: Image Rejected' : 'Analysis Request Error'}
              </p>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                X-Ray Gate Active
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            
            {isGuardrailRejection && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 text-slate-400">
                <p className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-teal-400" />
                  <span>Acceptable Medical Images:</span>
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400 pl-1">
                  <li>Frontal anterior-posterior (AP) or posterior-anterior (PA) thoracic radiographs</li>
                  <li>Monochromatic/grayscale DICOM-exported images</li>
                  <li>Images clearly showing thoracic ribcage, spine, and bilateral lung fields</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container: Upload & Preview */}
      {!result ? (
        <div className="space-y-6">
          {!previewUrl ? (
            /* Drag and Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-teal-400 bg-teal-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/bmp"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-bold text-white">
                    Drag &amp; drop chest X-ray radiograph
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports DICOM exports in JPEG, PNG, WEBP, or BMP format up to 15 MB
                  </p>
                </div>

                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors inline-block"
                >
                  Browse Computer Files
                </button>
              </div>
            </div>
          ) : (
            /* Preview State */
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <FileImage className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-sm">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={clearSelection}
                  disabled={analyzing}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Client-side Pre-Check Warning */}
              {preCheckWarning && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2 text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{preCheckWarning}</span>
                </div>
              )}

              {/* Image Preview Box */}
              <div className="relative max-h-96 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Chest X-Ray Preview"
                  className="max-h-80 w-auto object-contain rounded-lg shadow-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-2">
                <button
                  onClick={clearSelection}
                  disabled={analyzing}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Change Image
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md shadow-teal-500/20 transition-all"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating X-Ray &amp; Extracting Features...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      <span>Execute AI Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Result Display Card */
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-teal-400 uppercase tracking-wider">
                    Analysis Report &bull; {result.model_version}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    X-Ray Verified
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">Inference Classification Complete</h2>
              </div>

              {/* Predicted Class Badge */}
              <div
                className={`px-4 py-2 rounded-xl border flex items-center space-x-2 ${
                  isCancerDetected
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {isCancerDetected ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
                <span className="text-base font-bold tracking-wide">
                  Predicted Class: {result.predicted_class}
                </span>
              </div>
            </div>

            {/* Split layout: Image Preview & Probabilities Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Preview */}
              <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Analyzed Radiograph"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                )}
              </div>

              {/* Chart & Metrics */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Confidence banner */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Model Output Confidence</span>
                    <span className="font-mono text-teal-400 text-sm font-bold">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        isCancerDetected
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                      }`}
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    * Clearly labeled as mathematical model confidence, not clinical or medical certainty.
                  </p>
                </div>

                {/* Softmax Probability Distribution Bar Chart */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Full Class Probability Distribution
                  </p>
                  <div className="h-44 w-full bg-slate-950/70 rounded-xl p-3 border border-slate-800/80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" fontSize={11} />
                        <YAxis type="category" dataKey="class" stroke="#cbd5e1" fontSize={12} width={70} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value: any) => [`${value}%`, 'Probability']}
                        />
                        <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.class.toLowerCase().includes('cancer') ? '#f43f5e' : '#14b8a6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Academic Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs flex items-start space-x-3 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{result.disclaimer}</p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={clearSelection}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Analyze Another Image</span>
              </button>

              <span className="text-xs text-slate-500 font-mono">
                Encrypted &amp; logged to user profile
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
