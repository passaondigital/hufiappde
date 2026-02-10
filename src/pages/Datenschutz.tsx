import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-sm text-muted-foreground space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Datenschutz auf einen Blick</h2>
            <h3 className="font-medium text-foreground">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Verantwortliche Stelle</h2>
            <p>
              Pascal Schmid<br />
              PASSA ON Digital<br />
              E-Mail: passaondigital@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Datenerfassung auf dieser Website</h2>
            <h3 className="font-medium text-foreground">Welche Daten werden erfasst?</h3>
            <p>Wir erfassen folgende Daten:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>E-Mail-Adresse und Name bei der Registrierung</li>
              <li>Von Ihnen eingegebene Pferdedaten, Notizen, Termine und Kundendaten</li>
              <li>Sprachnotizen werden ausschließlich als Text (Transkription) gespeichert, keine Audiodateien</li>
              <li>Chat-Nachrichten mit dem KI-Assistenten</li>
              <li>Nutzungsdaten zur Verbesserung des Dienstes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. KI-Assistent</h2>
            <p>
              Unser KI-Assistent verarbeitet Ihre Chat-Nachrichten, um Ihnen hilfreiche Antworten zu geben. Die Nachrichten werden an einen KI-Dienst übermittelt und zur Beantwortung verarbeitet. Der KI-Assistent gibt keine medizinischen Diagnosen und ersetzt keinen Tierarzt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Spracherkennung</h2>
            <p>
              Die Sprachnotiz-Funktion nutzt die Web Speech API Ihres Browsers. Die Spracherkennung findet lokal in Ihrem Browser statt. Es werden keine Audiodateien auf unseren Servern gespeichert – nur die resultierende Texttranskription wird in Ihrem Konto gespeichert.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung Ihrer Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p>Wenden Sie sich dazu an: passaondigital@gmail.com</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Datensicherheit</h2>
            <p>
              Ihre Daten werden verschlüsselt übertragen (SSL/TLS) und in einer gesicherten Datenbank gespeichert. Der Zugriff auf Ihre Daten ist durch Authentifizierung und Row-Level-Security geschützt – nur Sie können Ihre eigenen Daten sehen und bearbeiten.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
