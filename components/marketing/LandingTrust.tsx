import type { TrustElement } from '@/lib/marketing/types'

export default function LandingTrust({ elements }: { elements: TrustElement[] }) {
  return (
    <section className="py-10 px-4 bg-white">
      <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {elements.map((el, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-3xl">{el.icon}</span>
            <p className="font-bold text-sm text-gray-900">{el.title}</p>
            <p className="text-xs text-gray-500">{el.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
