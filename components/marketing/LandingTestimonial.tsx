import type { Testimonial } from '@/lib/marketing/types'

interface LandingTestimonialProps {
  testimonials: Testimonial[]
}

export default function LandingTestimonial({ testimonials }: LandingTestimonialProps) {
  if (!testimonials || testimonials.length === 0) return null

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-xl font-bold text-gray-800 mb-8">
          Apa Kata Pelanggan Kami 💬
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-[#f9fdf0] border border-[#d4e8a0] rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-yellow-400 text-base">★</span>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto">
                <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
