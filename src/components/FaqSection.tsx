import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Was ist HuufiApp?",
    a: "HuufiApp ist dein KI-gestuetzter Assistent fuer Pferdegesundheit, Terminplanung und Dokumentation. Die App hilft dir, den Ueberblick ueber alle wichtigen Informationen rund um dein Pferd zu behalten."
  },
  {
    q: "Wie lege ich ein Pferd an?",
    a: "Gehe zu Pferde und tippe auf Pferd anlegen. Gib Name, Rasse, Alter und Nutzungsart ein. Du kannst auch ein Foto hochladen. Das Profil wird sofort gespeichert."
  },
  {
    q: "Wie funktioniert der KI-Assistent?",
    a: "Oeffne den Chat oder nutze das Mikrofon in der unteren Leiste. Du kannst Fragen stellen wie Wann war der letzte Hufschmied-Termin? oder Fass meine letzten Notizen zusammen. Die KI kennt deine Daten und antwortet kontextbezogen."
  },
  {
    q: "Was kostet HuufiApp?",
    a: "Die Basis-Version ist kostenlos und umfasst bis zu 10 KI-Anfragen pro Tag. Mit Premium (9,99 Euro/Monat) bekommst du 100 KI-Anfragen, erweiterten Tresor-Speicher und Priority-Support."
  },
  {
    q: "Wie verbinde ich mich mit anderen Nutzern?",
    a: "Gehe zu Connect und teile deinen QR-Code oder 8-stelligen Connect-Code. Der andere Nutzer gibt den Code ein oder scannt den QR-Code. Nach Bestaetigung koennt ihr Pferde teilen und chatten."
  },
  {
    q: "Wie funktionieren Sprachnotizen?",
    a: "Tippe auf das Mikrofon in der unteren Leiste und sprich deine Notiz ein. Die Sprache wird automatisch in Text umgewandelt und als Notiz gespeichert. Du kannst sie spaeter einem Pferd zuordnen."
  },
  {
    q: "Was ist der Tresor?",
    a: "Der Tresor ist ein passwortgeschuetzter Bereich fuer wichtige Dokumente wie Equidenpaesse, Rechnungen oder Vertraege. Auf unterstuetzten Geraeten kannst du auch deinen Fingerabdruck zum Entsperren nutzen."
  },
  {
    q: "Wie nutze ich die Wetter-Anzeige?",
    a: "Im Dashboard siehst du automatisch das aktuelle Wetter an deinem Standort. Erlaube dazu den Standort-Zugriff in deinem Browser. Bei starkem Wind oder Unwetter wirst du gewarnt."
  },
  {
    q: "Kann ich meine Daten exportieren?",
    a: "Aktuell kannst du Dokumente aus dem Tresor einzeln herunterladen. Ein vollstaendiger Datenexport ist fuer ein zukuenftiges Update geplant."
  },
  {
    q: "Wie loesche ich mein Konto?",
    a: "Gehe zu Einstellungen und scrolle nach unten. Dort findest du die Option zur Kontoloeschung. Alle deine Daten werden dabei unwiderruflich geloescht."
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <HelpCircle size={16} />
          FAQ
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Haeufig gestellte Fragen
        </h2>
        <p className="text-muted-foreground text-lg">
          Alles, was du ueber HuufiApp wissen musst.
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
