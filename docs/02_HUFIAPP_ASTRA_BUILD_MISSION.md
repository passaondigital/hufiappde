# HUFIAPP – ASTRA BUILD MISSION

## Auftrag
HufiApp aus bestehendem Produkt, HufManager-Funktionsbestand und Hufi-Preview zu einem verkaufsfähigen Premium-MVP entwickeln.

Nicht nur analysieren. Reihenfolge:
AUDIT → SOURCE OF TRUTH → INTEGRATION → BUSINESS INTAKE → HUFI EXPERIENCE → END-TO-END FLOWS → QA → RELEASE → VERIFY

## P0
- aktuelle Produktion und Repo-Truth
- Auth
- Tenant-Isolation
- Business Onboarding
- HufManager-Übernahme
- CSV/XLSX/Copy-Paste/Sprache-Intake
- Firmen- und Rechnungsgrunddaten
- Leistungen/Preise
- Kunden/Pferde
- Hufi Home
- Context Resolution
- Termine
- Dokumentation
- Rechnungen
- Mobile/PWA
- reproduzierbares Deployment + Rollback

## Preview-Quellen
Nicht blind mergen. Selektiv prüfen und portieren:
- HufiAssistantCockpit
- HufiAssistantExperience
- HufiWave
- HufiTranscript
- HufiConfirmation
- HufiQuestion
- HufiChoiceCards
- HufiHorseCard
- HufiAppointmentCard
- HufiInvoicePreview
- HufiObservationPreview
- HufiProactiveNotice
- hufi-observation contracts / horse resolution / proposal flow

## Business Setup Acceptance
Ein nicht-technischer Solo-Pferdeprofi soll:
- innerhalb weniger Minuten ein Grundprofil besitzen
- Leistungen und Preise schnell erfassen/importieren
- vorhandene Kunden und Pferde übernehmen
- kommende Termine sehen
- Hufi sofort sinnvoll fragen können

Ziel: arbeitsfähiger Kontext in ca. 5–10 Minuten, vollständigeres Grundsetup maximal ca. 20 Minuten.

## Import-Architektur
SOURCE ADAPTER → NORMALIZED IMPORT MODEL → VALIDATION → ENTITY RESOLUTION → DUPLICATE DETECTION → IMPORT PLAN → PREVIEW → CONFIRM → COMMIT → AUDIT

Import muss idempotent und tenant-sicher sein.

## Action Architecture
HUFI EXPERIENCE → ORCHESTRATION → CONTEXT → POLICY → MODEL ROUTER → TOOLS → DATABASE/SERVICES

LLM niemals direkt unkontrolliert in Businessdaten schreiben lassen.

## Kern-Tools
Beispiele:
- find_customer
- find_horse
- get_day_context
- create_appointment_draft
- update_appointment_draft
- create_invoice_draft
- save_observation_proposal
- calculate_route
- draft_message
- propose_memory_update

## Sicherheit
P0:
- kein Cross-Tenant-Zugriff
- RLS/Policies prüfen
- Service-Role niemals im Client
- Admin-Routen absichern
- Upload-/Storage-Regeln prüfen
- Secrets/history audit
- sensible Aktionen bestätigen
- Audit Events

## PWA-Ziel
Eine Codebasis, responsive und installierbar, soweit Plattform und Browser es unterstützen:
- Android
- Windows
- macOS
- ChromeOS

Web-Fallback bleibt voll nutzbar.

Prüfen:
- manifest
- icons
- service worker
- installability
- deep links
- SPA refresh
- update flow
- offline fallback
- cache invalidation

## Definition of Done
Ein echter Nutzer kann:
1. Landingpage öffnen und Produkt verstehen
2. registrieren/login
3. Business innerhalb kurzer Zeit einrichten oder importieren
4. Kunden/Pferde verwenden
5. Hufi nach realen Betriebsdaten fragen
6. Termin anlegen/finden
7. Dokumentation erfassen
8. Rechnung vorbereiten/erstellen
9. mobile PWA installieren
10. später wiederkommen und weiterarbeiten

## Produktprüfung
Nach jeder Funktion fragen:
- Spart sie Zeit?
- Muss der Nutzer etwas wissen, das Hufi selbst wissen könnte?
- Muss der Nutzer Daten erneut eingeben, die bereits vorhanden sind?
- Versteht ein völlig untechnischer Mensch die nächste Aktion?

Wenn nein: vereinfachen.

## Release-Gates
- Build
- Lint
- Tests
- Auth
- Import
- Tenant-Isolation
- Mobile
- Deep Links
- PWA
- Kern-E2E
- Production Smoke
- Rollback verifiziert

## Abschluss
Dokumentieren:
- Repo
- Production Branch
- Production Commit
- Server
- DB
- Domain
- Payment
- aktive Capabilities
- bekannte Grenzen
- nächste 3 Post-MVP-Punkte

Ziel: keine versteckte zweite Wahrheit mehr.
