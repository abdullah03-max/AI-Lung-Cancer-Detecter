import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileImage,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight
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

  // Client-side quick check for non-radiographic images
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
        let whitePixels = 0;
        let borderLuminance = 0;
        let borderPixelCount = 0;
        const sampleCount = data.length / 4;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            totalDiff += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b)) / 3;
            if (lum > 235) whitePixels++;

            if (x < 4 || x >= w - 4 || y < 4 || y >= h - 4) {
              borderLuminance += lum;
              borderPixelCount++;
            }
          }
        }

        const avgDiff = totalDiff / sampleCount;
        const whiteRatio = whitePixels / sampleCount;
        const avgBorder = borderPixelCount > 0 ? borderLuminance / borderPixelCount : 0;

        if (avgBorder > 170 || whiteRatio > 0.18) {
          setPreCheckWarning(
            'White background exposure detected. Diagnostic chest radiographs have dark borders. Digital graphics, slides, or documents will be rejected.'
          );
        } else if (avgDiff > 9) {
          setPreCheckWarning(
            'Color saturation detected. Diagnostic thoracic X-rays are monochromatic. Color photographs or wallpapers will be rejected by the validation guardrail.'
          );
        } else {
          setPreCheckWarning(null);
        }
      } catch {
        // Ignore canvas CORS or inspection errors
      }
    };
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setResult(null);
    setPreCheckWarning(null);

    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/jfif'];
    if (!validExtensions.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|bmp|jfif)$/i)) {
      setError('Unsupported file type. Please upload a chest radiograph in JPEG, PNG, WebP, BMP, or JFIF format.');
      return;
    }

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
  const isGuardrailRejection =
    error?.toLowerCase().includes('non-x-ray') ||
    error?.toLowerCase().includes('radiograph') ||
    error?.toLowerCase().includes('manifold');

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Page Header */}
      <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#19354A]">
            Thoracic Radiograph Analysis
          </h2>
          <p className="text-sm text-[#667580] mt-1">
            Upload an anterior-posterior (AP) or posterior-anterior (PA) chest X-ray for deep learning evaluation.
          </p>
        </div>

        <Link
          to="/history"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#526A7A] hover:text-[#19354A] px-3 py-2 rounded-lg border border-[#DCE3E7] hover:bg-[#F4F6F7] transition-colors shrink-0 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-[#526A7A]" />
          <span>Analysis History</span>
        </Link>
      </div>

      {/* Error or Guardrail Rejection Card */}
      {error && (
        <div
          className={`p-5 rounded-lg border text-sm flex items-start space-x-3.5 shadow-xs ${
            isGuardrailRejection
              ? 'bg-[#FAF5EB] border-[#A87527]/40 text-[#263238]'
              : 'bg-[#FBEBEB] border-[#A94442]/40 text-[#263238]'
          }`}
        >
          {isGuardrailRejection ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#A87527]" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#A94442]" />
          )}
          <div className="space-y-2 flex-1">
            <div>
              <p className="font-semibold text-sm text-[#263238]">
                {isGuardrailRejection ? 'Image Verification Notice' : 'Analysis Request Notice'}
              </p>
              <p className="text-xs text-[#526A7A] mt-1 leading-relaxed">
                {error}
              </p>
            </div>

            {isGuardrailRejection && (
              <div className="p-3 rounded bg-white border border-[#DCE3E7] text-xs space-y-1 text-[#667580]">
                <p className="font-medium text-[#263238]">
                  Radiographic Criteria Requirements:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#526A7A]">
                  <li>Monochromatic frontal chest radiograph (AP or PA view)</li>
                  <li>Clear visualization of bilateral lung fields, clavicles, and ribs</li>
                  <li>Dark background exposure typical of radiographic cassette plates</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Analysis Workflow */}
      {!result ? (
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-6">
          {!previewUrl ? (
            /* Upload Drop Area */
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-[#397C78] bg-[#EEF6F5]'
                    : 'border-[#DCE3E7] bg-[#F8FAFB] hover:border-[#526A7A] hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp,.jfif"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div className="max-w-sm mx-auto space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center text-[#526A7A]">
                    <Upload className="w-6 h-6 text-[#19354A]" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#19354A]">
                      Select or drop chest radiograph
                    </p>
                    <p className="text-xs text-[#667580]">
                      Standard DICOM exports or image files (JPEG, PNG, WebP, BMP, JFIF)
                    </p>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white font-medium text-xs shadow-xs transition-colors"
                  >
                    Select X-Ray Image
                  </button>

                  <p className="text-[11px] text-[#667580]">
                    Maximum file size: 15 MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Image Preview & Ready for Analysis */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E7]">
                <div className="flex items-center space-x-2.5">
                  <FileImage className="w-5 h-5 text-[#526A7A]" />
                  <div>
                    <p className="text-sm font-semibold text-[#263238] truncate max-w-md">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-[#667580] font-mono">
                      {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB &bull; Ready for evaluation
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526A7A] hover:text-[#19354A] hover:bg-[#F4F6F7] border border-[#DCE3E7] transition-colors"
                  >
                    Replace Image
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={analyzing}
                    className="p-1.5 rounded-lg text-[#667580] hover:text-[#A94442] hover:bg-[#FBEBEB] border border-[#DCE3E7] transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pre-check Warning if triggered */}
              {preCheckWarning && (
                <div className="p-3.5 rounded-lg bg-[#FAF5EB] border border-[#A87527]/30 text-[#A87527] text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{preCheckWarning}</span>
                </div>
              )}

              {/* PACS Radiograph Viewer Panel */}
              <div className="relative max-h-96 w-full rounded-lg bg-[#122635] border border-[#DCE3E7] overflow-hidden flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Radiograph Preview"
                  className="max-h-80 w-auto object-contain rounded"
                />

                {analyzing && (
                  <div className="absolute inset-0 bg-[#19354A]/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
                    <RefreshCw className="w-7 h-7 text-[#397C78] animate-spin" />
                    <p className="text-sm font-semibold">
                      Executing neural inference...
                    </p>
                    <p className="text-xs text-[#DCE3E7]">
                      Extracting features &amp; calculating class probabilities
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={analyzing}
                  className="text-xs font-semibold text-[#667580] hover:text-[#263238]"
                >
                  Clear Selection
                </button>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-[#19354A] hover:bg-[#122635] disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Image</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Completed Analysis Results View */
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE3E7] pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-[#667580]">
                <span>Analysis Complete</span>
                <span>&bull;</span>
                <span className="font-mono">Model {result.model_version}</span>
              </div>
              <h3 className="text-lg font-semibold text-[#19354A] mt-0.5">
                Evaluation Findings
              </h3>
            </div>

            {/* Prediction Badge */}
            <div
              className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${
                isCancerDetected
                  ? 'bg-[#FBEBEB] border-[#A94442]/30 text-[#A94442]'
                  : 'bg-[#EDF6F1] border-[#39704F]/30 text-[#39704F]'
              }`}
            >
              {isCancerDetected ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span className="text-sm font-bold tracking-tight">
                Classification: {result.predicted_class}
              </span>
            </div>
          </div>

          {/* Grid: Image and Results Table / Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Image Preview Box */}
            <div className="md:col-span-5 bg-[#122635] rounded-lg border border-[#DCE3E7] p-3 flex items-center justify-center">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Evaluated Radiograph"
                  className="max-h-72 w-auto object-contain rounded"
                />
              )}
            </div>

            {/* Metrics Breakdown */}
            <div className="md:col-span-7 space-y-5">
              {/* Model Confidence Metric */}
              <div className="p-4 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#263238]">Model Confidence</span>
                  <span className="font-mono font-bold text-[#19354A] text-sm">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#DCE3E7] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isCancerDetected ? 'bg-[#A94442]' : 'bg-[#39704F]'
                    }`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#667580]">
                  Confidence represents statistical model probability, not diagnostic certainty.
                </p>
              </div>

              {/* Class Probability Distribution */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#667580] uppercase tracking-wider">
                  Class Probabilities
                </p>
                <div className="h-36 w-full bg-[#F8FAFB] rounded-lg p-2 border border-[#DCE3E7]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartData} margin={{ top: 8, right: 24, left: 24, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} unit="%" stroke="#667580" fontSize={11} />
                      <YAxis type="category" dataKey="class" stroke="#263238" fontSize={11} width={65} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE3E7',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#263238',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Probability']}
                      />
                      <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.class.toLowerCase().includes('cancer') ? '#A94442' : '#39704F'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div className="p-3.5 rounded-lg bg-[#FAF5EB] border border-[#A87527]/30 text-xs text-[#A87527] flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Clinical Notice: </strong>
              This tool is intended for research and educational use only. Results are not a medical diagnosis. All computer vision outputs require independent verification by a licensed radiologist.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#DCE3E7]">
            <button
              onClick={clearSelection}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-white border border-[#DCE3E7] hover:bg-[#F4F6F7] text-xs font-semibold text-[#19354A] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Analyze Another Image</span>
            </button>

            <Link
              to="/history"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#19354A] hover:bg-[#122635] text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <span>View in Analysis History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
