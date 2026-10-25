import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Upload,
  AlertCircle,
  Eye,
  X,
  Search
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
  const [filterClass, setFilterClass] = useState<'ALL' | 'CANCER' | 'NORMAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!window.confirm('Are you sure you want to permanently delete this analysis record from your audit trail?')) {
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

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const isCancer = item.predicted_class.toLowerCase().includes('cancer');
      if (filterClass === 'CANCER' && !isCancer) return false;
      if (filterClass === 'NORMAL' && isCancer) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(query);
        const matchesDate = new Date(item.created_at).toLocaleDateString().toLowerCase().includes(query);
        const matchesClass = item.predicted_class.toLowerCase().includes(query);
        if (!matchesId && !matchesDate && !matchesClass) return false;
      }

      return true;
    });
  }, [history, filterClass, searchQuery]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white border border-[#DCE3E7] rounded-lg p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#19354A]">
            Analysis History
          </h2>
          <p className="text-sm text-[#667580] mt-1">
            Searchable audit trail of previous thoracic radiograph evaluations.
          </p>
        </div>

        <Link
          to="/predict"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5 text-[#397C78]" />
          <span>New Analysis</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#FBEBEB] border border-[#A94442]/30 text-[#A94442] text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-[#DCE3E7] rounded-lg shadow-xs overflow-hidden flex flex-col">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-[#DCE3E7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F8FAFB]">
          {/* Class Filters */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterClass('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterClass === 'ALL'
                  ? 'bg-[#19354A] text-white shadow-xs'
                  : 'bg-white text-[#526A7A] hover:text-[#19354A] border border-[#DCE3E7]'
              }`}
            >
              All Records ({history.length})
            </button>
            <button
              onClick={() => setFilterClass('CANCER')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterClass === 'CANCER'
                  ? 'bg-[#A94442] text-white shadow-xs'
                  : 'bg-white text-[#526A7A] hover:text-[#A94442] border border-[#DCE3E7]'
              }`}
            >
              Cancer
            </button>
            <button
              onClick={() => setFilterClass('NORMAL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterClass === 'NORMAL'
                  ? 'bg-[#39704F] text-white shadow-xs'
                  : 'bg-white text-[#526A7A] hover:text-[#39704F] border border-[#DCE3E7]'
              }`}
            >
              Normal
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#667580] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or date..."
              className="w-full pl-8 pr-3 py-1.5 rounded bg-white border border-[#DCE3E7] text-xs text-[#263238] placeholder:text-[#667580] focus:outline-none focus:border-[#19354A]"
            />
          </div>
        </div>

        {/* Content Table or State */}
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-6 h-6 mx-auto border-2 border-[#19354A]/20 border-t-[#19354A] rounded-full animate-spin" />
            <p className="text-xs text-[#667580]">Loading audit records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F4F6F7] border border-[#DCE3E7] flex items-center justify-center text-[#667580]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#263238]">
                {searchQuery || filterClass !== 'ALL'
                  ? 'No matching records found'
                  : 'No evaluations recorded'}
              </p>
              <p className="text-xs text-[#667580] mt-0.5">
                {searchQuery || filterClass !== 'ALL'
                  ? 'Try adjusting your search query or filter settings.'
                  : 'Chest radiographs evaluated in your sessions will appear in this audit log.'}
              </p>
            </div>
            {history.length === 0 && (
              <Link
                to="/predict"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#397C78] hover:underline pt-1"
              >
                <span>Upload a radiograph</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#263238]">
              <thead>
                <tr className="bg-[#F8FAFB] text-[#667580] border-b border-[#DCE3E7]">
                  <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3 px-4 font-semibold">Analysis Reference</th>
                  <th className="py-3 px-4 font-semibold">Classification</th>
                  <th className="py-3 px-4 font-semibold">Model Confidence</th>
                  <th className="py-3 px-4 font-semibold">Model</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3E7]">
                {filteredHistory.map((item) => {
                  const isCancer = item.predicted_class.toLowerCase().includes('cancer');
                  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFB] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-[#263238]">
                        <div className="flex items-center space-x-1.5 text-[#526A7A]">
                          <Calendar className="w-3.5 h-3.5 text-[#667580]" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#526A7A]">
                        {item.id}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isCancer
                              ? 'bg-[#FBEBEB] text-[#A94442] border-[#A94442]/30'
                              : 'bg-[#EDF6F1] text-[#39704F] border-[#39704F]/30'
                          }`}
                        >
                          {isCancer ? (
                            <AlertTriangle className="w-3 h-3 text-[#A94442]" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-[#39704F]" />
                          )}
                          <span>{item.predicted_class}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-[#DCE3E7] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                isCancer ? 'bg-[#A94442]' : 'bg-[#39704F]'
                              }`}
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-[#19354A]">
                            {(item.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#667580]">
                        {item.model_version || 'MobileNetV2'}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="p-1.5 rounded hover:bg-[#F4F6F7] text-[#526A7A] hover:text-[#19354A] transition-colors"
                          title="View Probability Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded hover:bg-[#FBEBEB] text-[#667580] hover:text-[#A94442] transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Probability Details Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#DCE3E7] rounded-lg p-6 space-y-5 shadow-lg text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#DCE3E7] pb-3">
              <h3 className="text-base font-semibold text-[#19354A]">
                Analysis Record Details
              </h3>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1 rounded text-[#667580] hover:text-[#19354A] hover:bg-[#F4F6F7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#DCE3E7]">
                <span className="text-[#667580]">Record ID</span>
                <span className="font-mono text-[#263238] font-medium">{activeItem.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#DCE3E7]">
                <span className="text-[#667580]">Timestamp</span>
                <span className="text-[#263238]">{new Date(activeItem.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#DCE3E7]">
                <span className="text-[#667580]">Predicted Class</span>
                <span className={`font-bold ${
                  activeItem.predicted_class.toLowerCase().includes('cancer') ? 'text-[#A94442]' : 'text-[#39704F]'
                }`}>
                  {activeItem.predicted_class}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#DCE3E7]">
                <span className="text-[#667580]">Model Confidence</span>
                <span className="font-mono font-bold text-[#19354A]">
                  {(activeItem.confidence * 100).toFixed(2)}%
                </span>
              </div>

              {/* Class probabilities breakdown */}
              <div className="space-y-2 pt-1">
                <p className="font-semibold text-[#667580] uppercase tracking-wider text-[11px]">
                  Softmax Probability Breakdown
                </p>
                <div className="space-y-1.5 bg-[#F8FAFB] p-3 rounded border border-[#DCE3E7]">
                  {Object.entries(activeItem.probabilities).map(([cname, prob]) => (
                    <div key={cname} className="flex justify-between items-center text-xs">
                      <span className="text-[#263238] font-medium">{cname}</span>
                      <span className="font-mono font-bold text-[#19354A]">
                        {(prob * 100).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveItem(null)}
              className="w-full py-2 rounded-lg bg-[#19354A] hover:bg-[#122635] text-white font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
