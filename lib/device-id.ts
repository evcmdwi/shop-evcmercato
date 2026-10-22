// Device ID acak per browser untuk jejak perangkat member (lihat lib/member-devices.ts).
// Disimpan di cookie (dibaca server) dan localStorage (memulihkan cookie yang terhapus).

export const DEVICE_COOKIE = 'evc_did'
const MAX_AGE = 400 * 86400

export function ensureDeviceId(): string | null {
  try {
    const fromCookie = document.cookie.match(new RegExp(`(?:^|; )${DEVICE_COOKIE}=([^;]+)`))?.[1] ?? null
    let fromStorage: string | null = null
    try { fromStorage = localStorage.getItem(DEVICE_COOKIE) } catch {}
    const id = fromCookie || fromStorage || crypto.randomUUID()
    if (id !== fromCookie) document.cookie = `${DEVICE_COOKIE}=${id}; path=/; max-age=${MAX_AGE}; samesite=lax; secure`
    if (id !== fromStorage) try { localStorage.setItem(DEVICE_COOKIE, id) } catch {}
    return id
  } catch {
    return null
  }
}
