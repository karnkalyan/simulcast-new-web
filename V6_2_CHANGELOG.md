# Simulcast V6.2 — V6-based website update

This is the **complete V6 Next.js source** with Prisma CMS and all service pages, *not* V6.1.

## Updated
- Homepage hero uses `public/visuals/futuristic_cloud_streaming_network.webp` anchored to the right edge at full hero height; left text stays real HTML.
- Removed clipped polygon hero, overlay fade inside image, and all GSAP image `clipPath` wipes. Scroll effects are now opacity/translation only.
- Enlarged slow logo motif; kept a consistent master logo file across all breakpoints.
- Added soft magenta/plum wave design as local assets for the About introduction and Industries sections.
- Added a separate software/AI/network/server composite showcase and linked solution content.
- Replaced broadcast-only software visuals in multiple sections.
- `.env` / `.env.example`: local MySQL `root`, blank password, `simulcast_web`. Never use root without password in production.
- Preserved V6 software catalog, articles, routes, animations, contact form, maps, Prisma and CMS.

## Verification
Use `npm install`, `npx prisma generate`, `npm run check:assets`, `npm run dev` and `npm run build`. Environment may require Internet for dependency and Google Font installation. See `README.md`.
