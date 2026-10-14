# Simulcast Technologies — Next.js Website V6

**Public site:** `www.simulcast.com.np` · **CMS:** `/admin` · **Contact:** info@simulcast.com.np · +977 9814823222 / +977 9851188274

## Stack
Next.js 16, React 19, TypeScript, Tailwind 4, GSAP ScrollTrigger, Framer Motion, Anime.js, Lenis, Prisma 6 and MySQL. Uses Poppins, Inter and JetBrains Mono.

## Start
1. Install Node.js 22+, MySQL 8+. Run `npm install` in this directory.
2. Copy `.env.example` to `.env`; configure `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, and unique admin credentials. Never use example passwords.
3. Run `npx prisma generate`, `npx prisma db push`, `npm run db:seed`.
4. Run `npm run dev`. Open `http://localhost:3000` and `/admin/login`.
5. Before production run `npm run typecheck` and `npm run build`; use `npm run start` with proper reverse proxy and HTTPS.

## What V6 adds
- 16 original capability pages at `/software`, using categories and hover interactions; no Kashtrix product names in public-facing navigation.
- Six original blog articles, plus existing CMS-managed published posts at `/insights`.
- New hero image representing the integrated media-and-technology ecosystem, not just a video editing workstation.
- Contact-form enhancements, location map, SEO schema and sitemap support, navigation scroll reset.
- 31 earlier conceptual images and new hero/SVG brand artwork; official master logo remains unchanged.

## Important
This source package is **not an audited or deployed application**. The generated visuals are conceptual and must not be presented as completed Simulcast client work. Features/software scope must be confirmed. Google's search rankings depend on indexing, site quality, authority, relevance and competition and cannot be guaranteed by source-code changes.

See `V6_CHANGELOG.md` and `RELEASE_CHECKLIST_V6.md`.


## V6.2: New hero + wave layouts

V6.2 updates the **full V6 source tree**. The `/` hero uses the `futuristic_cloud_streaming_network.webp` image with a white-light background and no polygon masking; software, AI, networking, servers and broadcast each have service pages and visuals. GSAP reveals use fade and vertical movement rather than image wipes. The pale wave image decorates selected page sections.

### Local MySQL configuration requested

`.env` and `.env.example` include `DATABASE_URL="mysql://root:@localhost:3306/simulcast_web"`. First create the database (`CREATE DATABASE simulcast_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`), then replace `AUTH_SECRET` and `SEED_ADMIN_PASSWORD` with strong values. Run `npm install`, `npm run db:setup` and `npm run dev`. Do **not** use an empty root database password for any Internet-exposed/production deployment.
