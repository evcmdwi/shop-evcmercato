'use client'
import { trackCustomPixelEvent, trackPixelEvent } from '@/lib/marketing/pixel'

export type LinkEvent =
  | { type: 'checkout'; value: number; slug: string; position: string }
  | { type: 'contact'; context: string }
  | { type: 'vip' }

/** Link biasa yang mengirim event Meta Pixel saat diklik (InitiateCheckout / Contact / ClaimVIP). */
export default function TrackedLink({
  event,
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { event: LinkEvent; href: string }) {
  const isWa = href.startsWith('https://wa.me/')
  return (
    <a
      href={href}
      {...(isWa ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
      onClick={() => {
        if (event.type === 'checkout') {
          trackPixelEvent('InitiateCheckout', {
            value: event.value,
            currency: 'IDR',
            content_ids: [event.slug],
            content_type: 'product',
            content_name: 'EVC Resmi',
            position: event.position,
          })
          return
        }
        const context = event.type === 'vip' ? 'vip' : event.context
        trackPixelEvent('Contact', { content_name: 'EVC Resmi', context })
        if (event.type === 'vip') trackCustomPixelEvent('ClaimVIP', { campaign: 'evc_resmi' })
      }}
    >
      {children}
    </a>
  )
}
