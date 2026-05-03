'use client'

import { useState, useEffect, useCallback } from 'react'
import { Address } from '@/types/address'
import AddressCard from '@/components/AddressCard'
import AddressForm from '@/components/AddressForm'
import Modal from '@/components/Modal'

const MAX_ADDRESSES = 4

function AddressSkeleton() {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded-lg w-16" />
        <div className="h-8 bg-gray-200 rounded-lg w-16" />
      </div>
    </div>
  )
}

export default function AlamatClient() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/addresses')
      if (!res.ok) throw new Error('Gagal memuat alamat')
      const json = await res.json()
      setAddresses(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const openAdd = () => {
    setEditingAddress(null)
    setIsModalOpen(true)
  }

  const openEdit = (address: Address) => {
    setEditingAddress(address)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAddress(null)
  }

  const handleSuccess = () => {
    closeModal()
    fetchAddresses()
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Yakin hapus alamat ini?')
    if (!confirmed) return

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus alamat')
      fetchAddresses()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus alamat')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      if (!res.ok) throw new Error('Gagal mengatur alamat default')
      fetchAddresses()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengatur alamat default')
    }
  }

  const canAddMore = addresses.length < MAX_ADDRESSES

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Alamat Pengiriman</h1>
        {canAddMore && (
          <button
            onClick={openAdd}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ backgroundColor: '#7FB300' }}
          >
            + Tambah Alamat
          </button>
        )}
      </div>

      {/* Info max alamat */}
      {!canAddMore && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded-lg mb-4">
          Kamu sudah memiliki maksimal {MAX_ADDRESSES} alamat. Hapus salah satu untuk menambah yang baru.
        </div>
      )}

      {/* Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
          {error}
          <button onClick={fetchAddresses} className="ml-2 underline">Coba lagi</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <AddressSkeleton />
          <AddressSkeleton />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-gray-600 font-medium">Belum ada alamat tersimpan</p>
          <p className="text-sm text-gray-400 mb-4">Tambahkan alamat pengiriman pertama kamu</p>
          <button
            onClick={openAdd}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: '#7FB300' }}
          >
            + Tambah Alamat
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}
      >
        <AddressForm
          initialData={editingAddress}
          onSuccess={handleSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </>
  )
}
