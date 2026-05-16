'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCodeModal from './QRCodeModal';
import LPStatsModal from './LPStatsModal';

interface LPCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  target_audience: string;
  conversion_benchmark_pct: number;
  preview_image_url: string | null;
  short_code: string | null;
  short_url: string | null;
  stats_7d: {
    clicks: number;
    signups: number;
    orders: number;
  };
}

export default function LPCard({
  id,
  slug,
  title,
  description,
  target_audience,
  conversion_benchmark_pct,
  preview_image_url,
  short_code,
  short_url,
  stats_7d,
}: LPCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const shareUrl = short_url ?? `https://shop.evcmercato.com`;
  const previewLpUrl = slug ? `https://shop.evcmercato.com/lp/${slug}` : null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — silently ignore
    }
  }

  function handleShareWA() {
    const message = `Cek ${title}: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <>
      <div className="bg-[#f8fce8] rounded-2xl p-4 border border-[#d4e87a]/60">
        {/* Header with optional thumbnail */}
        <div className="flex gap-3 mb-3">
          {/* Thumbnail */}
          {preview_image_url ? (
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#d4e87a]/40">
              <Image
                src={preview_image_url}
                alt={title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-[#d4e87a]/60 to-[#7FB300]/30 border border-[#d4e87a]/40 flex items-center justify-center text-2xl">
              🌿
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 leading-snug mb-1">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>
            {target_audience && (
              <p className="mt-1 text-xs text-[#7FB300] font-medium">👥 {target_audience}</p>
            )}
          </div>
        </div>

        {/* Short link */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-1 border border-gray-100">
          <span className="text-xs text-gray-600 truncate flex-1">{shareUrl}</span>
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

        {/* Preview LP link */}
        {previewLpUrl && (
          <div className="mb-3">
            <a
              href={previewLpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#7FB300] hover:text-[#5a8a00] hover:underline transition-colors"
            >
              <span>👁</span>
              <span>Preview LP →</span>
            </a>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{stats_7d.clicks}</span>
          <span>klik</span>
          <span className="mx-1 text-gray-300">→</span>
          <span className="font-medium text-gray-700">{stats_7d.signups}</span>
          <span>daftar</span>
          <span className="mx-1 text-gray-300">→</span>
          <span className="font-medium text-gray-700">{stats_7d.orders}</span>
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
          <button
            type="button"
            onClick={() => setStatsOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-[#7FB300]/40 text-xs font-medium text-[#7FB300] hover:bg-[#f8fce8] transition-colors"
          >
            👁 Detail
          </button>
        </div>
      </div>

      <QRCodeModal
        url={shareUrl}
        title={title}
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />

      <LPStatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        lpId={id}
        lpTitle={title}
      />
    </>
  );
}
