export type CTAType = 'shop_home' | 'shop_category' | 'shop_product' | 'evie'

export interface LandingCTA {
  text: string
  link: string
  type: CTAType
}

export interface TrustElement {
  icon: string
  title: string
  description: string
}

export interface Testimonial {
  name: string
  role: string
  quote: string
  rating: number
}

export interface FAQ {
  question: string
  answer: string
}

export interface LandingPageContent {
  slug: string
  campaign_name: string
  meta: {
    title: string
    description: string
    og_image?: string
  }
  hero: {
    headline: string
    subheadline: string
    background_color?: string
    cta_primary: LandingCTA
    cta_secondary?: LandingCTA
  }
  trust_elements?: TrustElement[]
  product_highlights?: {
    title: string
    description: string
    image?: string
    badge?: string
  }[]
  testimonials?: Testimonial[]
  faq?: FAQ[]
}
