# TASKS.md

## Phase 0 - Foundations
- [x] Opprett repo-struktur (monorepo med workspaces)
- [x] Sett opp monorepo: Next.js frontend + NestJS backend
- [x] Konfigurer miljøvariabler (.env.example)
- [x] Sett opp PostgreSQL, Redis (Docker Compose)
- [x] Sett opp database-migrering (TypeORM)
- [x] Sett opp lint, format og testgrunnlag (Jest)

## Phase 1 - Data model and import
- [x] Implementer suppliers-tabell og CRUD (API + frontend)
- [x] Implementer import_batches og blog_posts entiteter
- [x] Bygg filopplasting for CSV/XLS/XLSX (SheetJS + csv-parse)
- [x] Implementer parsing og preview
- [x] Valider `supplier_name` og `blog_post_url`
- [x] Map importerte rader til leverandører (findOrCreate)

## Phase 2 - Bloggpostkontroll
- [x] Bygg URL checker service (BullMQ prosessor)
- [x] Lagre HTTP-status, responstid og redirect chain
- [x] Klassifiser statuskategorier (active, not_found, redirected, timeout, server_error)
- [x] Eksponer bloggpoststatus i API (GET /blog-post-checks)
- [x] Bygg bloggpoststatus-view i frontend med filtrering

## Phase 3 - Browser automation and link extraction
- [x] Sett opp Playwright-runner (BrowserService)
- [x] Integrer proxy/IP-rotasjon (ProxyService med rotering)
- [x] Åpne bloggpostside i browser
- [x] Ekstraher alle klikkbare lenker i innholdsområde
- [x] Lagre anchor_text, href, final_url, status
- [x] Bygg lenkestatus-view i frontend

## Phase 4 - Landing page browsing
- [x] Åpne hver landingsside (LandingPageProcessor)
- [x] Browse i 2 minutter
- [x] Implementer scroll og realistiske ventemønstre
- [x] Logg blokkeringer/captcha/timeout
- [x] Lagre session metadata (landing_page_sessions)

## Phase 5 - Flight search
- [x] Lag ruteoppsett for NYC→BOS, NYC→MIA, NYC→LAX, WAS→PAR
- [x] Beregn avreisedato = i dag + 2 måneder
- [x] Beregn returdato = avreise + 5 dager
- [x] Implementer generell flight search orchestrator
- [x] Implementer mondotickets.com adapter
- [x] Parse pris, valuta og provider
- [x] Lagre historiske prisdata
- [x] Bygg price view med tabell og graf (Recharts)

## Phase 6 - Reports
- [x] Bygg samlet rapport
- [x] Bygg leverandørspesifikk rapport
- [x] Bygg intern detaljrapport
- [x] Bygg leverandørvennlig rapport
- [x] Implementer PDF-eksport (pdf-lib)
- [x] Støtt filtrering per leverandør
- [x] Frontend: rapporter-view med generering og nedlasting

## Phase 7 - Email
- [x] Bygg email_templates med seed-data
- [x] Lag UI for redigering av maler med variabelstøtte
- [x] Implementer manuell sending (SMTP/nodemailer)
- [x] Implementer automatisk sending etter jobb
- [x] Logg all utsending (email_logs)
- [x] Sørg for at hver leverandør bare får egne data

## Phase 8 - Job monitoring and UX
- [x] Bygg dashboard med oppsummering og siste data
- [x] Bygg live status via SSE (EventsController)
- [x] Implementer jobbprogresjon per steg
- [x] Implementer filtrering og søk i alle views
- [x] Auto-refresh på dashboard

## Phase 9 - Hardening
- [x] Enhetstester (14 tester: health, suppliers, imports, flight-routes)
- [x] Full pipeline-kjede: URL-sjekk → lenkeekstraksjon → browsing → flysøk
- [ ] Observability og structured logging (delvis — Logger brukes overalt)
- [ ] Retry-policy (BullMQ-konfigurasjon)
- [ ] Lasttest på større importfiler
- [ ] E2E-tester
- [ ] Sikkerhetssjekk på adminflate

## Definition of done
- [x] Import fungerer for CSV/XLS/XLSX
- [x] Bloggposter sjekkes og status vises
- [x] Alle lenker i innholdet følges
- [x] Landingssider browses i 2 minutter
- [x] Flysøk forsøkes på landingssiden (mondotickets.com)
- [x] Priser lagres historisk
- [x] Rapporter kan genereres per leverandør
- [x] PDF og e-post fungerer
