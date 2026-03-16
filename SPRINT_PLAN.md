# Sprintplan: Bloggpost Monitor (12 uker)

## Nøkkelforutsetninger
- Én landingsside for flysøk: **mondotickets.com**
- MVP for én intern operatør
- Alle flysøk gjøres på mondotickets.com (kun én adapter nødvendig)

## Sprint 1: Fundament + database
- Monorepo-struktur (Next.js + NestJS)
- Docker Compose (PostgreSQL + Redis)
- Migreringer for alle 11 tabeller
- Miljøvariabler, lint, format, testgrunnlag
- Helsesjekk-endepunkt

## Sprint 2: Leverandører + filimport
- Suppliers CRUD API
- Import CSV/XLS/XLSX med preview
- Validering og leverandørmapping
- Frontend: leverandørliste + filopplasting

## Sprint 3: Bloggpostkontroll
- URL checker service med BullMQ
- HTTP-status, responstid, redirect chain
- Statusklassifisering
- Frontend: bloggpoststatus-view

## Sprint 4: Browser automation + proxy + lenkeekstraksjon
- Playwright-runner
- Proxy/IP-rotasjon
- Lenkeekstraksjon fra bloggpostinnhold
- Lagring i extracted_links

## Sprint 5: Lenkestatus-view + landingsside-browsing
- Frontend: lenkestatus-view
- Landing page browser (2 min browsing)
- Realistiske ventemønstre
- Session metadata

## Sprint 6: Flysøk — mondotickets.com adapter
- Ruteoppsett (NYC→BOS, NYC→MIA, NYC→LAX, WAS→PAR)
- Datoberegning (2 mnd frem, 5 dager)
- Flight search orchestrator
- mondotickets.com-spesifikk adapter
- Lagring i flight_search_results

## Sprint 7: Prisvisning + historikk
- API: GET /flight-prices med filtrering
- Frontend: pristabell + historisk graf
- Paginering og filtrering

## Sprint 8: Rapporter + PDF
- 4 rapporttyper (samlet, leverandør, intern, leverandørvennlig)
- PDF-generering
- Leverandørseparasjon
- Frontend: rapporter-view

## Sprint 9: E-post
- E-postmaler med variabler
- Mal-editor i UI
- Manuell + automatisk sending
- Utsendingslogg

## Sprint 10: Dashboard + sanntid
- Dashboard med aggregerte tall
- SSE for live jobbstatus
- Jobbprogresjon per steg
- Søk og filtrering i alle views

## Sprint 11: Hardening + testing
- Structured logging
- Retry-policy, timeout, circuit breaker
- 80%+ testdekning
- E2E-test for kritisk sti

## Sprint 12: Sikkerhet + ytelse + produksjon
- Rate limiting, input-sanitering
- Tilgangsbeskyttelse
- Lasttest (1000+ rader)
- Docker produksjonskonfigurasjon
