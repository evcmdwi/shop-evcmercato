'use client';

import { useEffect, useState } from 'react';
import LPCard from './LPCard';

interface LPItem {
  id: string;
  title: string;
  description: string;
  target_audience: string;
  conversion_benchmark_pct: number;
  short_link: {
    code: string;
    url: string;
  };
  stats_last_7_days: {
    clicks: number;
    signups: number;
    orders: number;
  };
}

export default function LandingPagesTab() {
  const [items, setItems] = useState<LPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLPs() {
      try {
        const res = await fetch('/api/affiliate/landing-pages');
        if (!res.ok) throw new Error('Gagal memuat data landing page');
        const data = await res.json();
        setItems(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    }
    fetchLPs();
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        <div className="inline-block w-6 h-6 border-2 border-[#7FB300] border-t-transparent rounded-full animate-spin mb-3" />
        <p>Memuat landing page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-sm text-red-500">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-3xl mb-3">🏗️</p>
        <p className="text-sm text-gray-600 font-medium mb-1">Belum ada landing page tersedia.</p>
        <p className="text-xs text-gray-400">Tim EVC sedang mempersiapkan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 mb-2">
        {items.length} landing page tersedia untuk kamu promosikan.
      </p>
      {items.map((item) => (
        <LPCard key={item.id} {...item} />
      ))}
    </div>
  );
}
