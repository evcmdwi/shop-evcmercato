'use client';

import { useState } from 'react';
import QRCodeModal from './QRCodeModal';

interface LPCardProps {
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

export default function LPCard({
  title,
  description,
  target_audience,
  conversion_benchmark_pct,
  short_link,
  stats_last_7_days,
}: LPCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(short_link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — silently ignore
    }
  }

  function handleShareWA() {
    const message = `Cek ${title}: ${short_link.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <>
      <div className="bg-[#f8fce8] rounded-2xl p-4 border border-[#d4e87a]/60">
        {/* Header */}
        <div className="mb-3">
          <p className="font-semibold text-sm text-gray-900 leading-snug mb-1">{title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          {target_audience && (
            <p className="mt-1 text-xs text-[#7FB300] font-medium">👥 {target_audience}</p>
          )}
        </div>

        {/* Short link */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-3 border border-gray-100">
          <span className="text-xs text-gray-600 truncate flex-1">{short_link.url}</span>
          <button
            type="button"
            onClick={handleCopy}
            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors flex-shrink-0 ${
              copied
                ? 'bg-[#7FB300] text-white'
                : 'bg-[#f8fce8] text-[#7FB300] hover:bg-[#e8f5b0]'
            }`}
          >
            {copied ? '✓ Disalin!' : '📋 Copy'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{stats_last_7_days.clicks}</span>
          <span>klik</span>
          <span className="mx-1 text-gray-300">→</span>
          <span className="font-medium text-gray-700">{stats_last_7_days.signups}</span>
          <span>daftar</span>
          <span className="mx-1 text-gray-300">→</span>
          <span className="font-medium text-gray-700">{stats_last_7_days.orders}</span>
          <span>sales</span>
          <span className="ml-1 text-gray-400">(7 hari)</span>
          {conversion_benchmark_pct > 0 && (
            <span className="ml-auto text-[#7FB300] font-medium">
              ~{conversion_benchmark_pct}% CR
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            📱 QR Code
          </button>
          <button
            type="button"
            onClick={handleShareWA}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-green-200 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
          >
            📤 Share WA
          </button>
          <a
            href={short_link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-[#7FB300]/40 text-xs font-medium text-[#7FB300] hover:bg-[#f8fce8] transition-colors"
          >
            👁 Detail
          </a>
        </div>
      </div>

      <QRCodeModal
        url={short_link.url}
        title={title}
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}
