'use client'
import { useState } from 'react'
import Image from 'next/image'
import { BadgeCheck } from 'lucide-react'

export interface Testimonial {
  quote: string
  name: string
  label: string
  photo: string
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="rounded-2xl border border-[#1F4A33]/10 bg-white p-4">
      <blockquote className="text-[15px] leading-relaxed text-[#1D2A22]">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-3 flex items-center gap-3">
        <Image src={t.photo} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
        <span className="leading-tight">
          <span className="block text-sm font-bold text-[#1D2A22]">
            {t.name} <span className="font-normal text-[#1D2A22]/75">· {t.label}</span>
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#1F4A33]">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Verified Customer
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

/** 3 testimoni pertama + sisanya dibuka di tempat. */
export default function Testimonials({ first, rest }: { first: Testimonial[]; rest: Testimonial[] }) {
  const [open, setOpen] = useState(false)
  const total = first.length + rest.length
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {first.map((t) => <Card key={t.name} t={t} />)}
      </div>
      {rest.length > 0 && (
        <div id="testimoni-lain" hidden={!open} className="mt-3 grid gap-3 md:grid-cols-3">
          {rest.map((t) => <Card key={t.name} t={t} />)}
        </div>
      )}
      {rest.length > 0 && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="testimoni-lain"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border-2 border-[#1F4A33] text-sm font-bold text-[#1F4A33] hover:bg-[#E3ECE3] md:mx-auto md:w-auto md:px-8"
        >
          Lihat semua cerita ({total})
        </button>
      )}
    </>
  )
}
