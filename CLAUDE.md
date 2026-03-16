# CLAUDE.md

## Formål
Denne filen styrer hvordan Claude skal jobbe med prosjektet.

## Arbeidsregler
- Følg `requirements_prd.md` som source of truth for produktkrav.
- Bruk `PRD.md` for scope og forretningsmål.
- Bruk `ARCHITECTURE.md` for tekniske beslutninger.
- Bruk `DATABASE_SCHEMA.md` og `API_SPEC.md` som førende forslag, men oppdater dem dersom implementasjonen krever presisering.
- Bruk `TASKS.md` som arbeidsliste og oppdater status løpende.

## Viktige krav som ikke må mistes
- Hver bloggpost tilhører en leverandør.
- Alle rapporter må kunne skilles per leverandør.
- Rapporter til leverandører skal kun inneholde den leverandørens data.
- Alle lenker i bloggpostinnholdet skal følges.
- Etter landing skal siden browses i 2 minutter før flysøk.
- Flysøket skal skje på landingssiden, ikke via separat global motor som standard.
- Flysøket skal bruke:
  - 2 måneder frem i tid
  - tur/retur
  - 5 dagers varighet
- Proxy/IP-rotasjon er obligatorisk.
- Historiske prisdata skal lagres.
- E-postmaler skal kunne redigeres i UI.
- MVP er for én intern operatør, ikke flerbrukersystem.

## Implementasjonsstrategi
- Start med datamodell og import.
- Deretter bloggpoststatus og lenkeuttrekk.
- Deretter browser automation og proxy.
- Deretter flight search adapterlag.
- Deretter rapporter, PDF og e-post.
- Lever vertikale slices som kan testes tidlig.

## Kodekrav
- Bruk TypeScript i frontend og backend.
- Lag små, testbare moduler.
- Unngå hardkoding av leverandørspesifikk logikk i kjernen.
- Bruk adaptermønster for ulike flysøkesider.
- Logg status og feil strukturert.
- Sørg for at feil i ett steg ikke stopper hele batchen.

## Svarformat fra Claude under utvikling
Når du leverer implementasjonsstatus, bruk dette formatet:

STATUS
- Implementert:
- Gjenstår:
- Risiko/blokkere:
- Neste konkrete steg:

## Prioritert rekkefølge
1. Database + import
2. Supplier mapping
3. Blog post checks
4. Link extraction
5. Landing page browsing
6. Flight search capture
7. Reporting
8. Email templates and sending
9. Dashboard and filters

## Ikke gjør dette
- Ikke bygg full flerbruker-autentisering i MVP.
- Ikke anta én fast ekstern flymotor for alle sider.
- Ikke begrens lenkekontroll til bare utvalgte nøkkelord.
- Ikke bland rapportdata mellom leverandører.
