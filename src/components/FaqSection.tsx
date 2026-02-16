import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FaqSection() {
  const { t } = useTranslation();
  const items = t("faq.items", { returnObjects: true }) as { q: string; a: string }[];

  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <HelpCircle size={16} />
          FAQ
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("faq.title")}</h2>
        <p className="text-muted-foreground text-lg">{t("faq.subtitle")}</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {items.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
