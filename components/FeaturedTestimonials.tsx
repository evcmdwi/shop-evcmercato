'use client'

import { useEffect, useState } from 'react'

interface Review {
  id: string
  customer_name: string
  customer_location: string | null
  rating: number
  title: string | null
  body: string
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-base">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export default function FeaturedTestimonials() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/reviews?featured=true&limit=6')
      .then(r => r.json())
      .then(json => {
        setReviews(json.reviews ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Tersembunyi kalau 0 review atau belum loaded
  if (!loaded || reviews.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {reviews.map(review => (
        <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <StarRating rating={review.rating} />
            <span className="text-xs bg-[#f8fce8] text-[#5a7a3a] font-semibold px-2.5 py-1 rounded-full border border-[#7FB300]/20">
              Verified Customer
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed flex-1">
            &ldquo;{truncate(review.body, 150)}&rdquo;
          </p>
          <div className="text-sm font-medium text-gray-900">
            {review.customer_name}
            {review.customer_location && (
              <span className="text-gray-400 font-normal"> · {review.customer_location}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
