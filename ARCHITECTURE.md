# ARCHITECTURE.md

## Arkitekturvalg
Foreslått stack:
- Frontend: React + Next.js
- Backend: Node.js + NestJS
- Database: PostgreSQL
- Queue/Scheduler: BullMQ + Redis
- Browser automation: Playwright
- PDF-generering: Playwright/Puppeteer eller pdf-lib
- E-post: SMTP eller Resend/SendGrid
- Filimport: SheetJS + CSV parser

## Hovedkomponenter

### Frontend
- Dashboard
- Upload view
- Blog post status view
- Link status view
- Flight prices view
- Reports view
- Email templates view
- Supplier management view
- Job monitor view

### Backend API
- Import service
- Blog post checker service
- Link crawler service
- Landing page browser service
- Flight search orchestrator
- Reporting service
- PDF service
- Email service
- Supplier service
- Job scheduler
- Audit/logging service

### Asynkron jobbmodell
1. Import batch opprettes
2. Jobb legges i kø
3. URL-sjekk utføres
4. Innhold analyseres og lenker ekstraheres
5. Hver lenke legges i lenkekø
6. Landingssiden browses i 2 minutter
7. Flight search adapter forsøker å utføre søk
8. Resultater lagres fortløpende
9. Rapport kan genereres ved behov eller automatisk

## Designprinsipper
- Feilisolasjon: én feil stopper ikke hele jobben
- Idempotente jobber der mulig
- Klar separasjon mellom crawling, statuskontroll og rapportering
- Provider/adapter-mønster for ulike flysøkesider
- Leverandør som gjennomgående datadimensjon

## Modulstruktur

### 1. Import Module
Ansvar:
- opplasting
- parsing
- validering
- mapping til leverandør og bloggposter

### 2. BlogPost Check Module
Ansvar:
- HTTP-status
- redirect-kjede
- responstid
- feilklassifisering

### 3. Content & Link Extraction Module
Ansvar:
- laste bloggpost i browser
- identifisere innholdsområde
- hente ut alle klikkbare lenker i innholdet
- lagre ankertekst, href, final URL

### 4. Landing Page Browser Module
Ansvar:
- åpne landingssiden
- browse i 2 minutter
- scroll og realistiske pauser
- bruke proxy/IP-rotasjon

### 5. Flight Search Module
Ansvar:
- finne flysøkeform på landingssiden
- fylle inn:
  - origin
  - destination
  - depart date
  - return date
- lese ut priser
- støtte flere adaptere ved behov

### 6. Reporting Module
Ansvar:
- samlet rapport
- leverandørrapport
- intern rapport
- leverandørvennlig rapport
- PDF-eksport

### 7. Email Module
Ansvar:
- manuell utsending
- automatisk utsending
- malredigering
- mottakeroppsett per leverandør
- utsendingslogg

## Proxy/IP-rotasjon
Proxy må inn som førsteordens arkitekturkrav:
- sentral proxy-konfigurasjon
- støtte for roterende session
- støtte for auth
- eventuelt geolokasjon per provider
- observability på blokkeringer og captcha

## Sanntidsoppdatering
Frontend bør bruke:
- WebSocket eller SSE for job status
- polling som fallback

## Sikkerhet
- miljøvariabler for secrets
- tilgangsbeskyttet adminflate selv om appen ikke er flerbruker
- filvalidering
- rate limiting på interne API-er
