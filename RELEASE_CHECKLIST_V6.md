# V6 release checklist

- [ ] `npm ci` (or `npm install`) after installing Node 22 and setting registry access.
- [ ] Configure `.env` / secure database / admin seed credentials; run `npx prisma generate && npx prisma db push && npm run db:seed`.
- [ ] `npm run typecheck && npm run build && npm run start` (not run in artifact environment; npm registry DNS unavailable).
- [ ] Test all header and software menu routes / scroll-to-top on desktop and mobile.
- [ ] Confirm service categories, licenses, product feature claims and pricing with the business team.
- [ ] Verify Google Maps business pin; user-provided address and business listing did not exactly match.
- [ ] Test form submission and admin inquiry processing with live database; enable email notification separately.
- [ ] Configure domain, HTTPS, Search Console, Google Business Profile, analytics consent, backups and rate limiting.
- [ ] Replace all conceptual project illustrations with real project photography only after permission/verification.
- [ ] Review generated media alt text and contrast; run accessibility/Core Web Vitals audit.
