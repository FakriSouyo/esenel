# ESENEL — Floral Atelier

A premium, editorial, botanical florist e-commerce site built with Next.js
14 (App Router), Tailwind CSS, and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Requires internet access on first build so
`next/font` can fetch Cormorant Garamond and DM Sans from Google Fonts.

## ⚠️ Placeholder data — read before launch

No real ESENEL catalog, product photography, or hero footage was supplied
when this project was generated. Everything visual/data-driven is wired up
but currently uses **placeholder content**:

- **`data/products.js`** — product names, prices, categories, and images
  are placeholders. Replace the array with the real ESENEL catalog; every
  filter pill, mega menu entry, collection page, product grid, and product
  detail page is derived from this file automatically — no component
  changes needed.
- **`data/collections.js`** — collection groupings/copy, keyed by the same
  category slugs as `products.js`.
- **`data/flowers.js`** — flower varieties, wrapping options, and pricing
  used by the `/craft` builder.
- **`components/hero/Hero.js`** — `HERO_IMAGE` is a temporary Unsplash
  photo. Replace with the final ESENEL flower-landscape asset. If a video
  is supplied instead, replace the background `<div>` with a
  `<video autoPlay muted loop playsInline>` — camera must stay completely
  static; only natural movement (wind, light) should animate.
- All other product/editorial images throughout the site are temporary
  Unsplash URLs and should be swapped for real ESENEL photography.

## Project structure

```
app/               Routes (App Router)
  page.js          Homepage
  shop/            Catalog + product detail (/shop/[slug])
  collections/     Collection index + detail (/collections/[slug])
  craft/           Craft builder (signature customization flow)
  about/, journal/, faq/, checkout/
components/
  navbar/          Floating navbar, scroll-shrink, Collections mega menu
  hero/            Immersive full-bleed hero
  products/        ProductCard, ProductGrid (filter pills), AddToBagButton
  collections/
  craft/           CraftBuilder (5-step flow) + BouquetWorkbench (Konva + Matter.js canvas)
  cart/            CartContext (localStorage-persisted), CartDrawer
  editorial/       Reusable asymmetric storytelling section
  faq/             Accordion
  footer/
data/              Source-of-truth content (see above)
lib/format.js      Shared IDR currency formatter
```

## Notes

- Cart persists to `localStorage` under the key `esenel-cart-v1`.
- Checkout (`/checkout`) shows an order summary only — no payment
  provider is wired up yet.
- Color system (Cloud, Earth, Sky, Grass, Meadow, Sand, Ink) and both
  fonts are defined in `tailwind.config.js` / `app/layout.js`.
