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

interface AggregateRating {
  average: number
  count: number
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-yellow-400 text-xl' : 'text-yellow-400 text-sm'
  return (
    <span className={cls}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [aggregateRating, setAggregateRating] = useState<AggregateRating | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!productId) return
    fetch(`/api/reviews?product_id=${productId}&limit=10`)
      .then(r => r.json())
      .then(json => {
        setReviews(json.reviews ?? [])
        setAggregateRating(json.aggregateRating ?? null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [productId])

  if (!loaded || reviews.length === 0) return null

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ulasan Pelanggan</h3>

        {/* Aggregate */}
        {aggregateRating && (
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
            <StarRating rating={Math.round(aggregateRating.average)} size="lg" />
            <span className="text-2xl font-bold text-gray-900">{aggregateRating.average}</span>
            <span className="text-sm text-gray-400">dari {aggregateRating.count} ulasan</span>
          </div>
        )}

        {/* Review list */}
        <div className="space-y-5">
          {reviews.map(review => (
            <div key={review.id} className="pb-5 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={review.rating} />
                {review.title && (
                  <span className="text-sm font-medium text-gray-800">{review.title}</span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">{review.body}</p>
              <div className="text-xs text-gray-400">
                <span className="font-medium text-gray-600">{review.customer_name}</span>
                {review.customer_location && <span> · {review.customer_location}</span>}
                <span> · {new Date(review.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
