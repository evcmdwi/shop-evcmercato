'use client';

import { useEffect, useState, useCallback } from 'react';

interface DailyRow {
  date: string;
  clicks: number;
  signups: number;
  orders: number;
}

interface StatsSummary {
  total_clicks: number;
  total_signups: number;
  total_orders: number;
  conversion_pct: number;
}

interface StatsResponse {
  summary: StatsSummary;
  daily: DailyRow[];
}

export interface LPStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpId: string;
  lpTitle: string;
}

type Range = 7 | 14 | 30;

const RANGE_LABELS: Record<Range, string> = {
  7: 'Last 7 days',
  14: 'Last 14 days',
  30: 'Last 30 days',
};

function buildFromDate(days: Range): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function buildToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

export default function LPStatsModal({ isOpen, onClose, lpId, lpTitle }: LPStatsModalProps) {
  const [range, setRange] = useState<Range>(14);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const from = buildFromDate(r);
      const to = buildToDate();
      const res = await fetch(
        `/api/affiliate/landing-pages/${lpId}/stats?from=${from}&to=${to}`,
      );
      if (!res.ok) throw new Error('Gagal memuat data statistik');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [lpId]);

  useEffect(() => {
    if (isOpen) {
      fetchStats(range);
    }
  }, [isOpen, range, fetchStats]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEmpty =
    !loading && !error && data && data.daily.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
              Statistik
            </p>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{lpTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 flex-shrink-0"
            aria-label="Tutup"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Range selector */}
        <div className="flex gap-2 px-5 py-3">
          {([7, 14, 30] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-[#7FB300] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {loading && (
            <div className="py-10 flex flex-col items-center gap-3 text-gray-400">
              <div className="w-7 h-7 border-2 border-[#7FB300] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Memuat data...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-500">⚠️ {error}</p>
            </div>
          )}

          {isEmpty && (
            <div className="py-8 text-center">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-sm text-gray-600 font-medium">Belum ada data.</p>
              <p className="text-xs text-gray-400 mt-1">
                Mulai share link ke audiensmu!
              </p>
            </div>
          )}

          {!loading && !error && data && data.daily.length > 0 && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <SummaryCard
                  label="Total Klik"
                  value={data.summary.total_clicks}
                  icon="👆"
                />
                <SummaryCard
                  label="Daftar"
                  value={data.summary.total_signups}
                  icon="✍️"
                />
                <SummaryCard
                  label="Orders"
                  value={data.summary.total_orders}
                  icon="🛍️"
                />
                <SummaryCard
                  label="Konversi"
                  value={`${data.summary.conversion_pct}%`}
                  icon="🎯"
                  highlight
                />
              </div>

              {/* Daily table */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-3 py-2 font-medium">Tanggal</th>
                      <th className="text-right px-3 py-2 font-medium">Klik</th>
                      <th className="text-right px-3 py-2 font-medium">Daftar</th>
                      <th className="text-right px-3 py-2 font-medium">Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.daily.map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 text-gray-600">{formatDate(row.date)}</td>
                        <td className="px-3 py-2 text-right text-gray-700 font-medium">
                          {row.clicks}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 font-medium">
                          {row.signups}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 font-medium">
                          {row.orders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight ? 'bg-[#f8fce8] border border-[#d4e87a]/60' : 'bg-gray-50'
      }`}
    >
      <p className="text-lg mb-0.5">{icon}</p>
      <p
        className={`text-lg font-bold leading-none mb-0.5 ${
          highlight ? 'text-[#7FB300]' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
