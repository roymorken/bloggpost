# requirements_prd.md

## Prosjektnavn
Blog Post URL Availability, Link Validation and Flight Search Monitor

## Formål
Applikasjonen skal importere bloggposter fra CSV/Excel, kontrollere om bloggpost-URL-er er aktive eller returnerer feil, følge alle lenker i innholdet, browse landingssiden i 2 minutter, utføre flysøk på landingssiden, og presentere resultater i egne views med eksport og e-postutsending.

## Kjernekrav
- Import av CSV/XLS/XLSX
- Minimumsfelter:
  - `supplier_name`
  - `blog_post_url`
- Valgfrie felter:
  - `supplier_email`
  - `title`
  - `date`
  - `notes`

## Funksjonell flyt
1. Bruker laster opp CSV/Excel med bloggposter.
2. Systemet validerer fil og viser preview.
3. Systemet sjekker hver bloggpost-URL og registrerer:
   - aktiv
   - 404
   - redirect
   - timeout
   - annen feil
4. Dersom bloggposten er tilgjengelig, åpnes siden i browser automation.
5. Systemet finner alle klikkbare lenker i bloggpostens innhold.
6. Hver lenke følges.
7. På hver landingsside browses siden i 2 minutter.
8. Deretter forsøker systemet å bruke flysøket på den aktuelle siden.
9. Det kjøres flysøk for:
   - New York → Boston
   - New York → Miami
   - New York → Los Angeles
   - Washington → Paris
10. Reisedato settes til 2 måneder frem i tid, tur/retur, 5 dagers varighet.
11. Resultater lagres og vises fortløpende i UI.
12. Rapporter kan eksporteres til PDF og sendes via e-post manuelt eller automatisk.

## Leverandørkrav
- Hver bloggpost tilhører en leverandør.
- Alle rapporter skal kunne filtreres per leverandør.
- Leverandørspesifikke rapporter skal bare inneholde bloggposter fra den aktuelle leverandøren.
- Systemet skal kunne sende riktig rapport til riktig leverandør.
- Rapporter skal brukes både internt og mot leverandører.

## Views
### 1. Bloggpoststatus
- leverandør
- bloggpost-URL
- status
- HTTP-statuskode
- responstid
- siste sjekk
- feiltype

### 2. Lenkestatus
- leverandør
- bloggpost-URL
- ankertekst
- link-URL
- final URL
- status
- HTTP-statuskode
- siste sjekk
- feiltype

### 3. Flypriser
- leverandør
- bloggpost-URL
- landingsside
- rute
- avreisedato
- returdato
- pris
- valuta
- kilde
- innhentet tidspunkt

## Filtrering
- leverandør
- status
- dato
- prisintervall
- rute

## Rapportering
- samlet rapport
- rapport per leverandør
- PDF-eksport
- grafer og tabeller
- intern detaljrapport
- leverandørvennlig rapport

## E-post
- manuell sending
- automatisk sending etter jobb
- redigerbare maler i UI
- variabler i mal:
  - leverandørnavn
  - rapportdato
  - antall aktive URL-er
  - antall feil
  - antall 404
  - laveste/høyeste pris

## Ikke-funksjonelle krav
- Proxy/IP-rotasjon er obligatorisk
- Systemet må støtte headless browser automation
- Feil i én URL eller ett flysøk skal ikke stoppe hele jobben
- Historiske prisdata skal lagres over tid
- UI skal oppdateres fortløpende
- PDF-rapporter skal kunne genereres fra appen
