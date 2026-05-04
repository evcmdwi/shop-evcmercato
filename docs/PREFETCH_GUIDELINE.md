# RSC Prefetch Guidelines — EVC Mercato

## Background

Next.js 15 default: auto-prefetch RSC untuk semua `<Link>` di viewport.
Di Vercel Hobby plan, banyak link sekaligus → trigger burst protection → 503 errors → tab busy 3-4 detik.

**History fixes:**
- PR #75: Header Navbar links (`/dashboard`, `/orders`, `/keranjang`)
- Task #29: Product Card di katalog (22+ produk = 22 simultaneous prefetch)

---

## Rules

### ❌ JANGAN pakai default prefetch untuk:

```tsx
// BAD — list/grid dengan banyak item
<Link href={`/katalog/${slug}`}>  // 22+ items = 22 prefetch sekaligus
```

### ✅ WAJIB `prefetch={false}` untuk:

1. **Auth-required routes**
   - `/dashboard`, `/orders`, `/keranjang`, `/poin`, `/sambers/*`

2. **Dynamic list/grid** (banyak item di viewport bersamaan)
   - Product cards di katalog
   - Order list items
   - Search results

3. **Heavy server components** (banyak DB query)
   - Product detail pages

### ✅ BOLEH default prefetch untuk:

- Tombol navigasi tunggal (CTA buttons)
- Static pages: `/`, `/katalog`, `/login`, `/register`
- Breadcrumb links

---

## Quick Reference

```tsx
// Product list item — WAJIB prefetch={false}
<Link href={`/katalog/${slug}`} prefetch={false}>

// Auth route — WAJIB prefetch={false}  
<Link href="/keranjang" prefetch={false}>

// Static CTA — OK default
<Link href="/katalog">Lihat Semua</Link>
```

---

## Kenapa Vercel Hobby kena burst protection?

- Free tier: max ~6-10 concurrent serverless functions
- 22 product cards scroll into viewport = 22 RSC prefetch sekaligus
- Vercel block excess dengan 503
- Browser retry = tab busy state 3-4 detik

**Solusi permanen:** `prefetch={false}` di semua list items = 0 burst risk.
