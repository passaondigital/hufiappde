import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AGB() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Allgemeine Geschäftsbedingungen</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 1 Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der HuufiApp, betrieben von Pascal Schmid (PASSA ON Digital). Mit der Registrierung erkennen Sie diese AGB an.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 2 Leistungsbeschreibung</h2>
            <p>HuufiApp ist ein KI-gestützter Assistent für Pferdebesitzer und Pferdeprofis. Die App bietet:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verwaltung von Pferdeprofilen und Gesundheitsnotizen</li>
              <li>KI-gestützten Chat-Assistenten</li>
              <li>Sprachnotiz-Funktion mit automatischer Transkription</li>
              <li>Termin- und Kundenverwaltung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 3 Haftungsausschluss KI</h2>
            <p>
              Der KI-Assistent bietet allgemeine Informationen und Hilfestellungen. Er ersetzt in keinem Fall eine tierärztliche Beratung oder Diagnose. Für Schäden, die aus der Befolgung von KI-Empfehlungen entstehen, wird keine Haftung übernommen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 4 Nutzungsbedingungen</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Die Nutzung ist erst ab 18 Jahren gestattet</li>
              <li>Sie sind für die Richtigkeit Ihrer eingegebenen Daten verantwortlich</li>
              <li>Missbrauch der KI-Funktion kann zur Kontosperrung führen</li>
              <li>Der kostenlose Tarif (Free) beinhaltet bis zu 10 KI-Anfragen pro Tag</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 5 Kündigung</h2>
            <p>
              Sie können Ihr Konto jederzeit löschen lassen. Kontaktieren Sie uns dazu unter passaondigital@gmail.com. Bei Kündigung werden alle Ihre Daten unwiderruflich gelöscht.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">§ 6 Schlussbestimmungen</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
