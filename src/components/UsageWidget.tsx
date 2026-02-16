import { useState, useEffect } from "react";
import { Zap, HardDrive, Loader2, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TOKEN_ADDONS = [
  { key: "quick_fill", label: "Quick-Fill", tokens: 500, price: "2,90€", priceId: "price_1T1R2JHvMPLLWloq5rJNV6gf" },
  { key: "pro_fill", label: "Pro-Fill", tokens: 2000, price: "7,90€", priceId: "price_1T1R2YHvMPLLWloqXqatUrnq" },
];

const STORAGE_ADDONS = [
  { key: "storage_10", label: "+10 GB", gb: 10, price: "4,90€", priceId: "price_1T1R2lHvMPLLWloqWOfioYhG" },
  { key: "storage_50", label: "+50 GB", gb: 50, price: "14,90€", priceId: "price_1T1R2xHvMPLLWloqMa3EvUoA" },
  { key: "storage_100", label: "+100 GB", gb: 100, price: "29,90€", priceId: "price_1T1R39HvMPLLWloqK6lOhx7V" },
];

export default function UsageWidget() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const [storageExtraGb, setStorageExtraGb] = useState(0);
  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [aiLimit, setAiLimit] = useState(10);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [balanceRes, subRes] = await Promise.all([
        supabase.from("user_balances").select("ai_tokens_remaining, storage_extra_gb").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_subscriptions").select("ai_requests_today, plan").eq("user_id", user.id).maybeSingle(),
      ]);
      if (balanceRes.data) {
        setTokensRemaining(balanceRes.data.ai_tokens_remaining);
        setStorageExtraGb(balanceRes.data.storage_extra_gb);
      }
      if (subRes.data) {
        setAiUsedToday(subRes.data.ai_requests_today);
        setAiLimit(subRes.data.plan === "premium" ? 100 : 10);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleBuy = async (priceId: string, addonKey: string, addonType: string, amount: number) => {
    if (!user) { toast.error("Bitte anmelden"); return; }
    setBuyLoading(addonKey);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-addon", {
        body: { priceId, addonKey, addonType, amount },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Kauf");
    } finally {
      setBuyLoading(null);
    }
  };

  if (loading) return null;

  const usagePercent = aiLimit > 0 ? Math.min((aiUsedToday / aiLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Daily AI usage */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">KI-Nutzung heute</h3>
          </div>
          <span className="text-sm text-muted-foreground">{aiUsedToday} / {aiLimit}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${usagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Bonus-Tokens: {tokensRemaining}</span>
          <span>Speicher-Bonus: +{storageExtraGb} GB</span>
        </div>
      </motion.div>

      {/* Token Add-ons */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap size={14} className="text-primary" /> KI-Tokens nachkaufen
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {TOKEN_ADDONS.map((addon) => (
            <button
              key={addon.key}
              onClick={() => handleBuy(addon.priceId, addon.key, "tokens", addon.tokens)}
              disabled={!!buyLoading}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left space-y-1"
            >
              <p className="text-sm font-semibold text-foreground">{addon.label}</p>
              <p className="text-xs text-muted-foreground">{addon.tokens} Tokens</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary">{addon.price}</span>
                {buyLoading === addon.key ? (
                  <Loader2 size={14} className="animate-spin text-primary" />
                ) : (
                  <ShoppingCart size={14} className="text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Storage Add-ons */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HardDrive size={14} className="text-primary" /> Speicher erweitern
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {STORAGE_ADDONS.map((addon) => (
            <button
              key={addon.key}
              onClick={() => handleBuy(addon.priceId, addon.key, "storage", addon.gb)}
              disabled={!!buyLoading}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left space-y-1"
            >
              <p className="text-sm font-semibold text-foreground">{addon.label}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-primary">{addon.price}</span>
                {buyLoading === addon.key ? (
                  <Loader2 size={14} className="animate-spin text-primary" />
                ) : (
                  <ShoppingCart size={14} className="text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
