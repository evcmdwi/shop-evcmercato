'use client'

import { useEffect } from 'react'
import { ensureDeviceId } from '@/lib/device-id'

/** Pastikan setiap pengunjung punya device ID sebelum login/checkout. */
export default function DeviceIdInit() {
  useEffect(() => { ensureDeviceId() }, [])
  return null
}
