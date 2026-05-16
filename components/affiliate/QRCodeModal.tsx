'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeModalProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ url, title, isOpen, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1 mr-2">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div ref={canvasRef} className="flex justify-center mb-4">
          <QRCodeCanvas value={url} size={256} level="M" />
        </div>

        <p className="text-xs text-gray-400 text-center break-all mb-4">{url}</p>

        <button
          type="button"
          onClick={handleDownload}
          className="w-full bg-[#7FB300] text-white py-3 rounded-2xl font-semibold text-sm hover:bg-[#6a9600] transition-colors"
        >
          ⬇️ Download QR PNG
        </button>
      </div>
    </div>
  );
}
