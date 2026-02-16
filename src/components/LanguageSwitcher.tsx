import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "de";

  const toggle = () => {
    i18n.changeLanguage(current === "de" ? "en" : "de");
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors ${className}`}
      title={current === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      <Globe size={14} />
      {current === "de" ? "EN" : "DE"}
    </button>
  );
}
