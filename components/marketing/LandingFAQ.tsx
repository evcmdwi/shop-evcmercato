'use client'
import { useState } from 'react'
import type { FAQ } from '@/lib/marketing/types'

export default function LandingFAQ({ items }: { items: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="py-10 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Pertanyaan Umum</h2>
        <div className="space-y-3">
          {items.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 font-semibold text-sm flex justify-between items-center"
              >
                {faq.question}
                <span className="text-[#7FB300]">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
