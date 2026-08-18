import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { formatDisplayDate, SYSTEM_TODAY } from '../utils/drillCalculator';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Download,
  Upload,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    customers,
    referenceDate,
    setReferenceDate,
    dueSoonDays,
    setDueSoonDays,
    resetToDemoData,
    exportDataJSON,
    importDataJSON,
  } = useCustomerContext();

  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberdrill_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: 'Customer drill data exported successfully!', type: 'success' });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importDataJSON(importText.trim());
    if (success) {
      setMessage({ text: 'Customer drill database successfully restored!', type: 'success' });
      setImportText('');
    } else {
      setMessage({ text: 'Failed to import JSON. Please verify the format.', type: 'error' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all customer accounts and drill history to sample demo data?')) {
      resetToDemoData();
      setMessage({ text: 'Data reset to initial demo state.', type: 'success' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16" id="settings-view-root">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Operations & Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure schedule parameters, date simulation, and customer drill database backups.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-500 hover:text-slate-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Schedule Parameters Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Timing & Alert Thresholds
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              System Reference Date (Simulation Date)
            </label>
            <input
              id="input-settings-ref-date"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Currently set to: <span className="font-semibold text-slate-700">{formatDisplayDate(referenceDate)}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              &quot;Due Soon&quot; Alert Threshold (Days)
            </label>
            <input
              id="input-settings-due-soon-days"
              type="number"
              min={1}
              max={60}
              value={dueSoonDays}
              onChange={(e) => setDueSoonDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Drills within {dueSoonDays} days of planned date will be flagged as &quot;Due Soon&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architecture Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          Standard Core Drill Lifecycle
        </h2>
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex flex-wrap items-center gap-2">
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Customer</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Annual Drill Plan</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Quarterly Drills</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Results</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Review Meeting</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Completion History</span>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900">Data Management & Backup</h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export All Customers JSON
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Initial Sample Data
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Restore / Import JSON Database
          </label>
          <textarea
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported JSON customer records here..."
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Import JSON Data
          </button>
        </div>
      </div>
    </div>
  );
};
