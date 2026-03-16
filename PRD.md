# PRD.md

## Produktoversikt
Dette produktet er et internt operatørverktøy for å kontrollere tilgjengelighet og kvalitet på bloggposter levert av ulike leverandører, samt samle flyprisdata fra landingssider som nås via lenkene i bloggpostinnholdet.

## Problem
Bloggposter fra eksterne leverandører kan bli utilgjengelige over tid, lenker kan brytes, og flyrelaterte landingssider kan vise utdatert eller utilgjengelig innhold. Det finnes behov for å:
- identifisere utilgjengelige bloggposter
- følge opp ansvarlig leverandør
- dokumentere status per leverandør
- hente prisinformasjon fra landingssider
- sende målrettede rapporter

## Mål
- Automatisere kontroll av bloggposter og lenker
- Koble alle bloggposter til riktig leverandør
- Lage løpende visning av status og prisdata
- Gjøre det enkelt å sende riktige rapporter til riktige leverandører
- Bygge historikk for trendanalyse på prisdata

## Primærbruker
Én intern operatør / administrator.

## Brukerbehov
- Jeg vil laste opp en fil med bloggposter og leverandører.
- Jeg vil se hvilke bloggposter som feiler.
- Jeg vil se hvilke lenker som er døde eller feilaktige.
- Jeg vil se priser fra flysøk på landingssider.
- Jeg vil filtrere på leverandør.
- Jeg vil kunne sende rapport til riktig leverandør.
- Jeg vil kunne eksportere rapporter til PDF.

## Scope for MVP
In scope:
- Filimport
- URL-sjekk
- Browser automation
- Lenkeuttrekk fra bloggpostinnhold
- 2 minutters browsing per landingsside
- Flysøk på landingssiden
- Sanntidsstatus i appen
- Leverandørfiltrering
- PDF-eksport
- Manuell og automatisk e-postsending
- Historiske prisdata
- Proxy/IP-rotasjon

Out of scope:
- Flerbrukerplattform
- Avansert rollemodell
- Kundelogin
- API-integrasjon mot tredjeparts flysøk som hovedløsning

## Suksesskriterier
- 95 % av importer kan valideres uten manuell korrigering
- Systemet klarer å gjennomføre URL-sjekker og lenkesjekker uten å stoppe ved enkeltfeil
- Leverandørrapporter kan genereres separat
- Prisdata kan vises historisk i graf og tabell
- E-postrapporter kan sendes med riktig mottaker per leverandør

## Viktige beslutninger
- Alle lenker i bloggpostinnholdet skal følges
- Flysøket skjer på landingssiden som lenken leder til
- Proxy/IP-rotasjon er påkrevd
- Reisedato er 2 måneder frem, tur/retur, 5 dagers opphold
- Systemet skal støtte rapporter både internt og mot leverandører
- E-postmaler skal kunne redigeres i UI
- Ingen flerbrukerinnlogging i MVP

## Risikoer
- Ulike landingssider kan ha ulike søkegrensesnitt
- Captcha, bot-beskyttelse og rate limiting
- Prisfelter kan være dynamiske og vanskelig å parse
- Tunge browserjobber kan gi lang kjøretid
- Enkelte leverandørrapporter kan kreve egne tilpasninger
