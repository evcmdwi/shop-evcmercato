export function appendUTM(baseUrl: string, utmParams: Record<string, string>): string {
  try {
    const url = new URL(baseUrl)
    Object.entries(utmParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v)
    })
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function extractUTM(searchParams: URLSearchParams): Record<string, string> {
  const utm: Record<string, string> = {}
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  keys.forEach(k => {
    const v = searchParams.get(k)
    if (v) utm[k] = v
  })
  return utm
}
