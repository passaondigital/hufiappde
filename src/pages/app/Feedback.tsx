import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import FeedbackSection from "@/components/FeedbackSection";

export default function Feedback() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Heart size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Huufi verbessern</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Dein Feedback hilft uns, HuufiApp besser zu machen. Melde Probleme, teile Ideen oder stelle Fragen.
      </p>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <FeedbackSection />
      </motion.div>
    </div>
  );
}
