import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Crown, Zap, Sparkles, Users, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import UsageWidget from "@/components/UsageWidget";

// Stripe product/price mapping
const TIERS = {
  privat_smart: { product_id: "prod_TzPkNOORHJAZ0h", price_id: "price_1T1QueHvMPLLWloqdlb8yFhg" },
  privat_agent: { product_id: "prod_TzPkHLoZ7p3CZX", price_id: "price_1T1QuvHvMPLLWloqxyiqrk8O" },
  business_pro: { product_id: "prod_TzPkHZl5W5B7T2", price_id: "price_1T1Qv8HvMPLLWloq63EuvnB8" },
  business_expert: { product_id: "prod_TzPkUFXqZc7r60", price_id: "price_1T1QvNHvMPLLWloqfwivC8wd" },
  team: { product_id: "prod_TzPl6LsAiOE1Xl", price_id: "price_1T1QvaHvMPLLWloqdDBXQHz5" },
};

const productToTier: Record<string, string> = {};
Object.entries(TIERS).forEach(([key, val]) => { productToTier[val.product_id] = key; });

interface PlanDef {
  key: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  priceId: string | null;
  productId: string | null;
  icon: any;
  highlight: boolean;
}

const privatPlans: PlanDef[] = [
  { key: "free", name: "Basis", price: "0€", period: "/mo", features: ["Notizen & Cloud-Sync", "1 GB Storage", "Community Support"], priceId: null, productId: null, icon: Zap, highlight: false },
  { key: "privat_smart", name: "Smart Life", price: "4,90€", period: "/mo", features: ["KI für Bilder & Texte", "Grafiken & Protokolle", "5 GB Storage"], priceId: TIERS.privat_smart.price_id, productId: TIERS.privat_smart.product_id, icon: Sparkles, highlight: true },
  { key: "privat_agent", name: "Agent Mode", price: "14,99€", period: "/mo", features: ["Automatisierte Aufgaben", "Video-Analyse", "10 GB Storage"], priceId: TIERS.privat_agent.price_id, productId: TIERS.privat_agent.product_id, icon: Crown, highlight: false },
];

const businessPlans: PlanDef[] = [
  { key: "free", name: "Test-Modus", price: "0€", period: "/mo", features: ["Professioneller Test", "1 GB Storage", "Basis-Features"], priceId: null, productId: null, icon: Zap, highlight: false },
  { key: "business_pro", name: "Pro-Business", price: "9,90€", period: "/mo", features: ["Volle KI-Suite", "Beleg-Scanning", "10 GB Storage"], priceId: TIERS.business_pro.price_id, productId: TIERS.business_pro.product_id, icon: Sparkles, highlight: true },
  { key: "business_expert", name: "Expert Agent", price: "19,99€", period: "/mo", features: ["Full Automation", "Video-Bewegungsanalyse", "25 GB Storage"], priceId: TIERS.business_expert.price_id, productId: TIERS.business_expert.product_id, icon: Crown, highlight: false },
];

const teamPlan: PlanDef = {
  key: "team", name: "Team", price: "49€", period: "/mo", features: ["1-5 Nutzer", "Zentrales Dashboard", "Shared Storage", "Team-Reporting"], priceId: TIERS.team.price_id, productId: TIERS.team.product_id, icon: Users, highlight: false,
};

export default function AbonnementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"Privat" | "Business">("Privat");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setCurrentProductId(data?.product_id || null);
      setSubscriptionEnd(data?.subscription_end || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const handleCheckout = async (priceId: string) => {
    if (!user) { toast.error("Bitte zuerst anmelden"); return; }
    setCheckoutLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", { body: { priceId } });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Checkout-Fehler");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Portal-Fehler");
    }
  };

  const currentTierKey = currentProductId ? productToTier[currentProductId] || null : null;
  const plans = tab === "Privat" ? privatPlans : businessPlans;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Abonnement</h2>
        <p className="text-muted-foreground mt-1">Wähle den Plan, der zu dir passt.</p>
      </div>

      {/* Current plan info */}
      {currentTierKey && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Aktueller Plan: <span className="text-primary font-bold">{currentTierKey.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span></p>
            {subscriptionEnd && <p className="text-xs text-muted-foreground">Nächste Abrechnung: {new Date(subscriptionEnd).toLocaleDateString("de-DE")}</p>}
          </div>
          <button onClick={handleManage} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
            <ExternalLink size={14} /> Abo verwalten
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary w-fit">
        {(["Privat", "Business"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const isActive = plan.productId ? plan.productId === currentProductId : !currentProductId;
          const Icon = plan.icon;
          return (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-2xl border flex flex-col relative ${
                plan.highlight ? "bg-foreground text-background border-foreground shadow-xl scale-[1.03]" : "bg-card border-border"
              } ${isActive ? "ring-2 ring-primary" : ""}`}>
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">Dein Plan</span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} className={plan.highlight ? "text-primary" : "text-primary"} />
                <p className={`text-sm font-medium ${plan.highlight ? "text-primary" : "text-muted-foreground"}`}>{plan.name}</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-3xl font-bold ${plan.highlight ? "text-background" : "text-foreground"}`}>{plan.price}</span>
                <span className={`text-sm ${plan.highlight ? "text-background/60" : "text-muted-foreground"}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                    <ChevronRight size={14} className="text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.priceId && !isActive ? (
                <button onClick={() => handleCheckout(plan.priceId!)} disabled={!!checkoutLoading}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}>
                  {checkoutLoading === plan.priceId ? <Loader2 size={14} className="animate-spin" /> : null}
                  Upgrade
                </button>
              ) : isActive ? (
                <div className={`w-full text-center py-2.5 rounded-lg text-sm font-medium ${plan.highlight ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}>
                  Aktiv ✓
                </div>
              ) : (
                <div className={`w-full text-center py-2.5 rounded-lg text-sm font-medium ${plan.highlight ? "bg-background/10 text-background/50" : "bg-secondary text-muted-foreground"}`}>
                  Kostenlos
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Team plan */}
      <div className="p-6 rounded-2xl bg-card border border-border flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={22} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Team – {teamPlan.price}{teamPlan.period}</p>
            <p className="text-sm text-muted-foreground">{teamPlan.features.join(" · ")}</p>
          </div>
        </div>
        {teamPlan.productId === currentProductId ? (
          <span className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">Aktiv ✓</span>
        ) : (
          <button onClick={() => handleCheckout(teamPlan.priceId!)} disabled={!!checkoutLoading}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            {checkoutLoading === teamPlan.priceId ? <Loader2 size={14} className="animate-spin" /> : "Team wählen"}
          </button>
        )}
      </div>

      {/* Usage & Add-ons */}
      <UsageWidget />

      <p className="text-xs text-muted-foreground text-center">
        Alle Preise inkl. MwSt. Jederzeit kündbar. Nach dem Checkout wird dein Plan sofort aktiviert.
      </p>
    </div>
  );
}
