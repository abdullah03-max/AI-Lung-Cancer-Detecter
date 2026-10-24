import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Trash2,
  Calendar,
  ShieldAlert,
  CheckCircle,
  UploadCloud,
  FileText,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import type { PredictionHistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const { token } = useAuth();
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<PredictionHistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getHistory(token || undefined);
      setHistory(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve prediction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prediction record from your history?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deletePrediction(id, token || undefined);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 text-left">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <History className="w-4 h-4" />
            <span>Audit Trail &amp; Patient Records</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Prediction History</h1>
          <p className="text-sm text-slate-400">
            View, audit, or remove past chest X-ray deep learning classification records.
          </p>
        </div>

        <Link
          to="/predict"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all shrink-0 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-3 text-left">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-3 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading history records...</p>
        </div>
      ) : history.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Predictions Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't run any chest X-ray analyses yet. Upload an image to generate your first classification record.
            </p>
          </div>
          <Link
            to="/predict"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Analyze First Radiograph</span>
          </Link>
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Timestamp</th>
                  <th scope="col" className="px-6 py-4">Classification</th>
                  <th scope="col" className="px-6 py-4">Model Confidence</th>
                  <th scope="col" className="px-6 py-4">Architecture</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-normal">
                {history.map((item) => {
                  const isCancer = item.predicted_class.toLowerCase().includes('cancer');
                  const formattedDate = new Date(item.created_at).toLocaleString();

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400 flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formattedDate}</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            isCancer
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {isCancer ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{item.predicted_class}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${isCancer ? 'bg-rose-500' : 'bg-teal-400'}`}
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-white">
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">
                        {item.model_version || 'MobileNetV2'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Probability Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Probability Details Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Prediction Details</h3>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Record ID</span>
                <span className="font-mono text-slate-200">{activeItem.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Date &amp; Time</span>
                <span className="text-slate-200">{new Date(activeItem.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Predicted Class</span>
                <span className="font-bold text-teal-400">{activeItem.predicted_class}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Overall Confidence</span>
                <span className="font-mono text-white font-bold">{(activeItem.confidence * 100).toFixed(2)}%</span>
              </div>

              {/* Class probabilities breakdown */}
              <div className="space-y-2 pt-2">
                <p className="font-semibold text-slate-300">Class Probability Breakdown:</p>
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {Object.entries(activeItem.probabilities).map(([cname, prob]) => (
                    <div key={cname} className="flex justify-between items-center font-mono">
                      <span className="text-slate-300">{cname}</span>
                      <span className="text-teal-400 font-bold">{(prob * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
