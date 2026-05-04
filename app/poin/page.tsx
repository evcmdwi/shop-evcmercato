'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PointTransaction {
  id: string
  type: string
  amount: number
  balance_after: number
  created_at: string
  notes: string | null
  related_order_id: string | null
}

interface PointsData {
  total_points: number
  tier: string
  points_to_next_tier: number | null
  transactions: PointTransaction[]
}

interface Redemption {
  id: string
  title: string
  points_required: number
  redeem_stock: number
  redeemed_count: number
  is_featured: boolean
  products: { name: string; image_url: string | null }
  product_variants: { name: string } | null
}

export default function PointsPage() {
  const [data, setData] = useState<PointsData | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [activeTab, setActiveTab] = useState<'tukar' | 'earning' | 'redeem'>('tukar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/points').then(r => r.json()),
      fetch('/api/redemptions').then(r => r.json()),
    ]).then(([pointsData, redemptionsData]) => {
      setData(pointsData)
      setRedemptions(redemptionsData.redemptions ?? [])
      setLoading(false)
    })
  }, [])

  const tierColor: Record<string, string> = {
    silver: 'text-gray-500',
    gold: 'text-amber-500',
    platinum: 'text-violet-600',
  }
  const tierBg: Record<string, string> = {
    silver: 'bg-gray-100',
    gold: 'bg-amber-50 border-amber-200',
    platinum: 'bg-violet-50 border-violet-200',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7FB300] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tier = data?.tier ?? 'silver'
  const earningTxs = data?.transactions.filter(t => t.type === 'earned') ?? []
  const redeemTxs = data?.transactions.filter(t => t.type === 'redeemed') ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Saldo Hero Card */}
      <div className={`rounded-2xl p-6 mb-6 border ${tierBg[tier] ?? 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Saldo EVC Points kamu</p>
            <p className="text-5xl font-extrabold text-gray-900">
              {data?.total_points?.toLocaleString('id') ?? 0}
            </p>
            <p className="text-lg font-bold text-gray-500 mt-1">points</p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold uppercase px-3 py-1 rounded-full bg-white ${tierColor[tier] ?? 'text-amber-500'}`}>
              💎 {data?.tier ?? 'Silver'}
            </span>
            {data?.points_to_next_tier && (
              <p className="text-xs text-gray-400 mt-2">{data.points_to_next_tier} pts lagi ke tier berikutnya</p>
            )}
          </div>
        </div>
        {data?.points_to_next_tier && (
          <div className="mt-4">
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (data.total_points / (data.total_points + data.points_to_next_tier)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Info biaya redeem */}
      <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-2">💡 Cara Tukar Points</p>
        <p className="text-xs text-gray-500">
          Produk 100% <strong>GRATIS</strong> — kamu hanya bayar:
        </p>
        <div className="flex gap-4 mt-2 text-xs text-gray-600">
          <span>🚚 Ongkir: <strong>Rp 10.000</strong></span>
          <span>📋 Admin: <strong>Rp 3.000</strong></span>
          <span className="font-bold text-[#7FB300]">Total: Rp 13.000</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {([
          ['tukar', '🎁 Tukar Points'],
          ['earning', '📈 Riwayat Dapat'],
          ['redeem', '📦 Riwayat Tukar'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Tukar Points */}
      {activeTab === 'tukar' && (
        <div>
          {redemptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🎁</p>
              <p className="text-sm">Belum ada promo tukar points aktif.</p>
              <p className="text-xs mt-1">Pantau terus — promo baru akan hadir!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {redemptions.map(r => {
                const stockLeft = r.redeem_stock - r.redeemed_count
                const canAfford = (data?.total_points ?? 0) >= r.points_required
                return (
                  <Link
                    key={r.id}
                    href={`/poin/redeem/${r.id}`}
                    prefetch={false}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all hover:shadow-md ${
                      r.is_featured ? 'border-amber-300' : 'border-gray-100'
                    }`}
                  >
                    {r.products.image_url && (
                      <div className="aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.products.image_url} alt={r.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.title}</p>
                      {r.product_variants?.name && (
                        <p className="text-xs text-gray-400">{r.product_variants.name}</p>
                      )}
                      <p className={`text-sm font-bold mt-1 ${canAfford ? 'text-amber-600' : 'text-gray-300'}`}>
                        💎 {r.points_required} pts
                      </p>
                      <p className="text-xs text-gray-400">Sisa: {stockLeft}</p>
                      {!canAfford && <p className="text-xs text-red-400 mt-1">Points tidak cukup</p>}
                      {stockLeft === 0 && <p className="text-xs text-gray-400 mt-1">Stok habis</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Riwayat Earning */}
      {activeTab === 'earning' && (
        <div className="space-y-2">
          {earningTxs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada riwayat poin diperoleh</div>
          ) : (
            earningTxs.map(tx => (
              <div
                key={tx.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.notes ?? 'Poin diperoleh'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#7FB300]">+{tx.amount} pts</p>
                  <p className="text-xs text-gray-400">{tx.balance_after} pts</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Riwayat Redeem */}
      {activeTab === 'redeem' && (
        <div className="space-y-2">
          {redeemTxs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada riwayat penukaran</div>
          ) : (
            redeemTxs.map(tx => (
              <div
                key={tx.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.notes ?? 'Penukaran points'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{tx.amount} pts</p>
                  <p className="text-xs text-gray-400">{tx.balance_after} pts sisa</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
