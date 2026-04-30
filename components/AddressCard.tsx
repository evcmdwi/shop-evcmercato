import { Address } from '@/types/address'

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{address.recipient_name}</span>
          {address.is_default && (
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: '#534AB7' }}>
              Default
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">{address.phone}</p>

      <p className="text-sm text-gray-700">
        {address.full_address}, {address.city}, {address.province} {address.postal_code}
      </p>

      <div className="flex gap-2 pt-1 flex-wrap">
        <button
          onClick={() => onEdit(address)}
          className="text-sm px-3 py-1.5 rounded-lg border border-[#534AB7] text-[#534AB7] hover:bg-[#EEEDFE] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="text-sm px-3 py-1.5 rounded-lg border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
        >
          Hapus
        </button>
        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Jadikan Default
          </button>
        )}
      </div>
    </div>
  )
}
