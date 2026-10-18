'use client'
import { trackCustomPixelEvent, trackPixelEvent } from '@/lib/marketing/pixel'

export type LinkEvent =
  | { type: 'checkout'; value: number; slug: string; position: string }
  | { type: 'contact'; context: string }

/** Link biasa yang mengirim event Meta Pixel saat diklik (InitiateCheckout / Contact). */
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
            content_name: 'Supergreen Food',
            position: event.position,
          })
        } else {
          trackPixelEvent('Contact', { content_name: 'Supergreen Food', context: event.context })
          trackCustomPixelEvent('WhatsAppClick', { campaign: 'supergreen_food', context: event.context })
        }
      }}
    >
      {children}
    </a>
  )
}
