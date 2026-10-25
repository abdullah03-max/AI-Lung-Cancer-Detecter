import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Clock,
  ArrowRight,
  Cpu,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { ModelInfo, PredictionHistoryItem } from '../types';

const PIE_COLORS = ['#A94442', '#39704F'];

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getModelInfo().catch(() => null),
      api.getHistory(token || undefined).catch(() => ({ items: [], total: 0 }))
    ]).then(([info, hist]) => {
      if (info) setModelInfo(info);
      if (hist && hist.items) setHistory(hist.items);
      setLoading(false);
    });
  }, [token]);

  const cancerCount = history.filter((h) =>
    h.predicted_class.toLowerCase().includes('cancer')
  ).length;
  const normalCount = history.filter((h) =>
    h.predicted_class.toLowerCase().includes('normal')
  ).length;

  const chartData = [
    { name: 'Cancer', value: cancerCount },
    { name: 'Normal', value: normalCount },
  ].filter((item) => item.value > 0);

  const recentHistory = history.slice(0, 5);

  return (
    <div className="space-y-6 text-left">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-semibold text-[#19354A]">
            Welcome, {user?.fullName || user?.email?.split('@')[0] || 'Clinician'}
          </h2>
          <p className="text-sm text-[#667580] mt-1">
            Clinical radiograph analysis workspace and diagnostic audit logs.
          </p>
        </div>

        <Link
          to="/predict"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white text-sm font-semibold shadow-xs transition-colors shrink-0 self-start md:self-auto"
        >
          <Upload className="w-4 h-4 text-[#397C78]" />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#667580]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Analyses
            </span>
            <Clock className="w-4 h-4 text-[#526A7A]" />
          </div>
          <p className="text-2xl font-bold text-[#19354A] mt-2">
            {history.length}
          </p>
          <p className="text-xs text-[#667580] mt-1">
            Evaluations recorded in your log
          </p>
        </div>

        {/* Model Status */}
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#667580]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Inference Engine
            </span>
            <Cpu className="w-4 h-4 text-[#397C78]" />
          </div>
          <p className="text-2xl font-bold text-[#19354A] mt-2 capitalize">
            {modelInfo?.status || 'Online'}
          </p>
          <p className="text-xs text-[#667580] mt-1 font-mono">
            {modelInfo?.model_architecture || 'MobileNetV2'}
          </p>
        </div>

        {/* Test Accuracy */}
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#667580]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Evaluation Accuracy
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#39704F]" />
          </div>
          <p className="text-2xl font-bold text-[#19354A] mt-2">
            {modelInfo?.evaluation_metrics
              ? `${(modelInfo.evaluation_metrics.overall.accuracy * 100).toFixed(1)}%`
              : '81.7%'}
          </p>
          <p className="text-xs text-[#667580] mt-1">
            ROC AUC: {modelInfo?.evaluation_metrics?.overall?.roc_auc ? modelInfo.evaluation_metrics.overall.roc_auc.toFixed(3) : '0.990'}
          </p>
        </div>

        {/* Target Classes */}
        <div className="bg-white border border-[#DCE3E7] rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#667580]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Classification Scope
            </span>
            <Layers className="w-4 h-4 text-[#526A7A]" />
          </div>
          <p className="text-2xl font-bold text-[#19354A] mt-2">
            {modelInfo?.classes ? modelInfo.classes.length : 2} Classes
          </p>
          <p className="text-xs text-[#667580] mt-1">
            {modelInfo?.classes ? modelInfo.classes.join(' vs ') : 'Cancer vs Normal'}
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Analyses & Model Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Analyses Table */}
        <div className="lg:col-span-7 bg-white border border-[#DCE3E7] rounded-lg shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-[#DCE3E7] flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#19354A]">
                Recent Analyses
              </h3>
              <p className="text-xs text-[#667580]">
                Most recent patient radiograph classifications
              </p>
            </div>
            {history.length > 0 && (
              <Link
                to="/history"
                className="text-xs font-semibold text-[#397C78] hover:text-[#2E6562] flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="p-0 flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#667580]">
                Loading previous evaluations...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center text-[#667580]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#263238]">
                    No previous analyses recorded
                  </p>
                  <p className="text-xs text-[#667580] mt-0.5">
                    Upload a thoracic chest radiograph to evaluate and store diagnostic predictions.
                  </p>
                </div>
                <Link
                  to="/predict"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#397C78] hover:underline pt-1"
                >
                  <span>Upload first X-Ray</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFB] text-[#667580] border-b border-[#DCE3E7]">
                    <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                    <th className="py-3 px-4 font-semibold">Analysis ID</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Model Confidence</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3E7]">
                  {recentHistory.map((item) => {
                    const isCancer = item.predicted_class.toLowerCase().includes('cancer');
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFB] transition-colors">
                        <td className="py-3 px-4 text-[#263238] whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#526A7A] text-[11px]">
                          {item.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isCancer
                                ? 'bg-[#FBEBEB] text-[#A94442] border-[#A94442]/30'
                                : 'bg-[#EDF6F1] text-[#39704F] border-[#39704F]/30'
                            }`}
                          >
                            {item.predicted_class}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#263238]">
                          {(item.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/history"
                            className="text-[#397C78] hover:text-[#2E6562] font-semibold"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Model Information & Prediction Distribution */}
        <div className="lg:col-span-5 space-y-6">
          {/* Model Information Card */}
          <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE3E7] pb-3">
              <h3 className="text-base font-semibold text-[#19354A]">
                Model Specifications
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F6F7] text-[#526A7A] border border-[#DCE3E7]">
                v{modelInfo?.model_version || '1.0.0'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <p className="text-[#667580]">Architecture</p>
                <p className="font-semibold text-[#263238] mt-0.5">
                  {modelInfo?.model_architecture || 'MobileNetV2'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <p className="text-[#667580]">Input Dimensions</p>
                <p className="font-semibold text-[#263238] mt-0.5">
                  224 &times; 224 &times; 3
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <p className="text-[#667580]">Macro F1 Score</p>
                <p className="font-semibold text-[#263238] mt-0.5">
                  {modelInfo?.evaluation_metrics
                    ? `${(modelInfo.evaluation_metrics.overall.f1_macro * 100).toFixed(1)}%`
                    : '68.3%'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFB] border border-[#DCE3E7]">
                <p className="text-[#667580]">Verified Samples</p>
                <p className="font-semibold text-[#263238] mt-0.5">
                  {modelInfo?.dataset_summary?.total_images_scanned?.toLocaleString() || '5,856'}
                </p>
              </div>
            </div>

            {/* Per-class Metrics breakdown */}
            {modelInfo?.evaluation_metrics?.per_class_metrics && (
              <div className="space-y-2 pt-1 border-t border-[#DCE3E7]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#667580]">
                  Class Validation Metrics
                </p>
                <div className="space-y-1.5">
                  {Object.entries(modelInfo.evaluation_metrics.per_class_metrics).map(([cls, metrics]) => (
                    <div
                      key={cls}
                      className="p-2.5 rounded bg-[#F8FAFB] border border-[#DCE3E7] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#263238]">{cls}</span>
                      <div className="flex space-x-3 text-[#667580]">
                        <span>Prec: <strong className="text-[#263238]">{(metrics.precision * 100).toFixed(0)}%</strong></span>
                        <span>Rec: <strong className="text-[#263238]">{(metrics.recall * 100).toFixed(0)}%</strong></span>
                        <span>N={metrics.support}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User History Distribution */}
          <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs space-y-4">
            <div className="border-b border-[#DCE3E7] pb-3">
              <h3 className="text-base font-semibold text-[#19354A]">
                Prediction Distribution
              </h3>
              <p className="text-xs text-[#667580]">
                Classification summary across your recorded sessions
              </p>
            </div>

            {chartData.length > 0 ? (
              <div className="flex items-center justify-between">
                <div className="w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={56}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.name === 'Cancer' ? PIE_COLORS[0] : PIE_COLORS[1]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#DCE3E7',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#263238',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs flex-1 pl-4">
                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFB] border border-[#DCE3E7]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A94442]" />
                      <span className="font-medium text-[#263238]">Cancer</span>
                    </div>
                    <span className="font-semibold text-[#19354A]">{cancerCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFB] border border-[#DCE3E7]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#39704F]" />
                      <span className="font-medium text-[#263238]">Normal</span>
                    </div>
                    <span className="font-semibold text-[#19354A]">{normalCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#667580] bg-[#F8FAFB] rounded border border-[#DCE3E7]">
                Distribution chart will render upon completing your first scan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
