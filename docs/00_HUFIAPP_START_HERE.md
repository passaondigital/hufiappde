# HUFIAPP – START HERE

## Zweck
Dieses Dokument ist der Einstiegspunkt für jede neue HufiApp-Session. Vor größeren Änderungen zuerst hier beginnen und anschließend Code, Server, Datenbank und laufende Produktion verifizieren.

## Produktrollen
- **HufiApp** = strategisches High-End-Kundenprodukt für Pferdeprofis.
- **Hufi** = persönlicher, proaktiver Business-Assistent innerhalb der HufiApp.
- **HufManager** = bestehender spezialisierter Funktions- und Datenbestand; wichtige Migrations-, Workflow- und Logikquelle.
- **HufiBoss** = Pascals privates internes Orchestrierungs-/Jarvis-System. HufiApp-Kunden erhalten niemals Zugriff auf HufiBoss, Pascals Memory, Accounts, Projekte, Agenten oder Secrets.
- **HufiOS / HufiAgents / HufiBus / HufiVoice** = HUFI-Ökosystem-Komponenten; sie dürfen nicht ungeprüft mit der Kundenprodukt-Laufzeit vermischt werden.

## Kanonische Repositories
### HufiApp
Repository: `passaondigital/hufiappde`
Bekannter Produktions-/Deploymentstand: `main`
Zuletzt verifizierter relevanter Commit: `6f4f1453ce548be168cf07f6f3d7e3141af87ee1`

Dieser Stand enthält unter anderem:
- nginx-SPA-Routing
- `try_files $uri $uri/ /index.html`
- HTTPS-/Security-Header-Grundlage
- Asset-Caching
- PWA navigateFallback
- dokumentierten Serverpfad `/srv/hufi/hufiapp/repo/dist`

Vor jedem Release erneut verifizieren. Historische Dokumentation ist Kontext, nicht automatisch die aktuelle Wahrheit.

### HufManager / Preview-Quelle
Repository: `passaondigital/hufmanager`

Historisch relevante Hufi-Branches:
- `feature/hufi-assistant-cockpit`
- `release/hufi-assistant-cockpit`
- `feature/hufi-assistant-experience-preview`
- `release/hufi-assistant-experience`
- `hotfix/hufi-cockpit-wave`

Historisch relevante Commits:
- `5776cef5b1f7c866f96bf68a425789937fd38c6d`
- `d915ff16ddebea7d9cee08490b3fe0bc6c1315a4`

Die Preview-Branches nicht blind mergen. Gute Komponenten, UX und Logik selektiv in die aktuelle HufiApp portieren.

## Produktkern
HufiApp darf nicht als klassisches CRM mit Chatfenster enden. Ziel ist ein persönlicher Business-Assistent, der autorisiert versteht:
- Person und Betrieb
- Kunden
- Pferde
- Leistungen und Preise
- Termine und Touren
- Dokumentation
- Rechnungen und Zahlungsstatus
- Arbeitsweisen, Präferenzen und wiederkehrende Muster

Leitidee:
**Der Nutzer kümmert sich um Pferde und Menschen. Hufi kümmert sich um möglichst viel vom Rest.**

## Time-to-Value
P0-Ziel:
- 1–3 Minuten: Account + Tätigkeit + Grundkontext.
- ca. 5 Minuten: Betrieb + wichtigste Leistungen + Grundpreise.
- 5–10 Minuten: bestehende Kunden/Pferde/Termine idealerweise importiert oder übernommen.
- spätestens ca. 20 Minuten: typischer Solo-Betrieb arbeitsfähig.

Hufi soll sich mit dem Nutzer einrichten. Kein Formularfriedhof.

## Business Intake
Priorisierte Eingangswege:
1. vorhandenen HufManager-Bestand übernehmen/verknüpfen
2. CSV/XLSX/Tabellen importieren
3. Copy & Paste
4. Sprache/Text
5. mit Minimalsetup sofort anfangen und später ergänzen

Importregel:
READ → PARSE → NORMALIZE → MATCH → DEDUPLICATE → PREVIEW → CONFIRM → IMPORT → VERIFY

## Lernender Hufi
Lernen bedeutet kontrolliert:
BEOBACHTEN → MUSTER → VORSCHLAG → BESTÄTIGUNG → STRUKTURIERT SPEICHERN → WIEDERVERWENDEN

Das Modell schreibt keine dauerhaften Business-Regeln ungeprüft in den persistenten Zustand.

## Proaktivität
Hufi soll relevante Dinge selbst erkennen, ohne Notification-Spam:
- heutige Termine
- ungünstige Tour
- überfällige Pferde
- fehlende Dokumentation
- erledigter Termin ohne Rechnung
- offene Rechnung
- unbeantwortete Anfrage
- sinnvoller Folgetermin

## Action-First
Wenn Hufi etwas erledigen kann, soll er nicht nur erklären.
Pipeline:
UNDERSTAND → RESOLVE CONTEXT → CHECK PERMISSION → PREPARE → PREVIEW → CONFIRM IF REQUIRED → EXECUTE → VERIFY → REPORT

## Pferdezentrierte Identität
Zielmodell:
- #KID = Besitzer/Kunde
- #EQID = dauerhafte Pferdeidentität
- #PID = Pferdeprofi
- #PRID = Fachpartner

Das Pferd ist zentraler Beziehungsknoten. Rolle allein gibt niemals automatisch Zugriff.

## Plattformziel
HufiApp wird als webbasierte, responsive PWA aufgebaut:
- Android
- Windows
- macOS
- ChromeOS
- Desktop/Tablet/Smartphone
- installierbar, soweit Browser und Betriebssystem PWA-Installation unterstützen
- ansonsten vollständig als Web-App nutzbar

Die PWA muss echte Plattformgrenzen offen kommunizieren. Browser-Wakeword oder Hintergrundmikrofon niemals vortäuschen, wenn das OS es technisch nicht zuverlässig erlaubt.

## 2027+
Das Ziel ist ein Produkt, das nicht nur technisch funktioniert, sondern sich wie ein Premium-Assistent anfühlt und mit Nutzung wertvoller wird. 2027 ist die nächste große Qualitätsstufe, nicht das Ende. Architekturentscheidungen sollen Wachstum ermöglichen, ohne den aktuellen MVP durch Zukunftsfantasien zu blockieren.

## Arbeitsregel
Vor jeder größeren Mission:
1. aktuellen Repo-/Branch-/Commitstand prüfen
2. laufenden Server prüfen
3. Datenbank-/Migrationstand prüfen
4. Auth/Billing/Permissions prüfen
5. erst dann ändern
6. Preview/Test
7. Rollback sichern
8. kontrolliert deployen
