import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, FileText, Users, FolderLock, Brain, Filter, Globe, Activity, Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const archiveItems = [
  { path: "/app/pferde", icon: Heart, labelKey: "sidebar.horses" },
  { path: "/app/notizen", icon: FileText, labelKey: "sidebar.notes" },
  { path: "/app/termine", icon: Calendar, labelKey: "sidebar.appointments" },
  { path: "/app/kunden", icon: Users, labelKey: "sidebar.customers" },
  { path: "/app/tresor", icon: FolderLock, labelKey: "sidebar.vault" },
  { path: "/app/wissen", icon: Brain, labelKey: "sidebar.knowledge" },
  { path: "/app/trichter", icon: Filter, labelKey: "sidebar.funnel" },
  { path: "/app/ecosystem", icon: Globe, labelKey: "sidebar.ecosystem" },
  { path: "/app/video-analyse", icon: Activity, labelKey: "sidebar.analysis" },
];

export default function Archive() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t("archive.title", "Archiv")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("archive.subtitle", "Alle Bereiche auf einen Blick")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {archiveItems.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={item.path}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="p-3 rounded-xl bg-secondary text-primary">
                <item.icon size={22} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">
                {t(item.labelKey)}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
