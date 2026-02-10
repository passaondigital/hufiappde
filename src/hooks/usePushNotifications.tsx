import { useState, useEffect } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (!isSupported || !user) return;
    checkSubscription();
  }, [isSupported, user]);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch {}
  };

  const subscribe = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Benachrichtigungen wurden abgelehnt");
        setLoading(false);
        return;
      }

      // Subscribe to push (no VAPID key needed for local notifications)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: undefined,
      });

      const subJson = sub.toJSON();
      
      // Save to DB
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subJson.endpoint || "",
        p256dh: subJson.keys?.p256dh || "",
        auth: subJson.keys?.auth || "",
      }, { onConflict: "user_id,endpoint" });

      setIsSubscribed(true);
      toast.success("Push-Benachrichtigungen aktiviert!");
    } catch (err: any) {
      console.error("Push subscription error:", err);
      // Fallback: just use local notification API
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setIsSubscribed(true);
        toast.success("Benachrichtigungen aktiviert (lokal)!");
      } else {
        toast.error("Benachrichtigungen konnten nicht aktiviert werden");
      }
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      if (user) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      }
      setIsSubscribed(false);
      toast.success("Benachrichtigungen deaktiviert");
    } catch {
      setIsSubscribed(false);
    }
  };

  // Schedule a local notification for an appointment
  const scheduleReminder = (title: string, body: string, dateTime: Date) => {
    if (!isSubscribed && Notification.permission !== "granted") return;
    
    const now = Date.now();
    const delay = dateTime.getTime() - now - 3600000; // 1 hour before
    if (delay < 0) return;

    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    }, Math.min(delay, 2147483647)); // Max setTimeout value
  };

  return { isSupported, isSubscribed, loading, subscribe, unsubscribe, scheduleReminder };
}

// UI Component for push notification toggle
export function PushNotificationToggle() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSubscribed
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      } disabled:opacity-50`}
    >
      {isSubscribed ? <Bell size={16} /> : <BellOff size={16} />}
      {loading ? "..." : isSubscribed ? "Benachrichtigungen an" : "Benachrichtigungen aktivieren"}
    </button>
  );
}
