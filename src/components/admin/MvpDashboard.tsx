import { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Users, MessageCircle,
  Heart, FileText, Calendar, Star, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, MinusCircle, Lightbulb, BarChart3, Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserMvpData {
  user_id: string;
  display_name: string | null;
  user_type: string;
  created_at: string;
  last_activity: string;
  mvp_score: number;
  mvp_status: "red" | "yellow" | "green";
  metrics: {
    chat_interactions: number;
    horses: number;
    notes: number;
    appointments: number;
    usage_days: number;
    feedbacks: number;
  };
  risk_flags: string[];
}

interface FeedbackItem {
  id: string;
  user_id: string;
  display_name: string | null;
  category: string;
  content: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

interface MvpQuestionResult {
  question_key: string;
  avg_rating: number;
  count: number;
}

interface Recommendation {
  type: "danger" | "warning" | "success" | "info";
  title: string;
  description: string;
  icon: typeof AlertTriangle;
}

export default function MvpDashboard() {
  const [users, setUsers] = useState<UserMvpData[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [questionResults, setQuestionResults] = useState<MvpQuestionResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "feedback" | "risks" | "exit">("overview");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [globalScore, setGlobalScore] = useState(0);

  useEffect(() => {
    fetchMvpData();
  }, []);

  const fetchMvpData = async () => {
    const [profilesRes, chatRes, horsesRes, notesRes, aptsRes, feedbackRes, questionsRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("chat_messages").select("user_id, created_at").eq("role", "user"),
      supabase.from("horses").select("user_id, id"),
      supabase.from("notes").select("user_id, id, created_at"),
      supabase.from("appointments").select("user_id, id"),
      supabase.from("user_feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("mvp_question_responses").select("*"),
    ]);

    const profiles = profilesRes.data || [];
    const chats = chatRes.data || [];
    const horses = horsesRes.data || [];
    const notes = notesRes.data || [];
    const apts = aptsRes.data || [];
    const allFeedback = feedbackRes.data || [];
    const allQuestions = questionsRes.data || [];

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Build per-user MVP data
    const mvpUsers: UserMvpData[] = profiles.map(p => {
      const uid = p.user_id;
      const userChats = chats.filter(c => c.user_id === uid);
      const userHorses = horses.filter(h => h.user_id === uid);
      const userNotes = notes.filter(n => n.user_id === uid);
      const userApts = apts.filter(a => a.user_id === uid);
      const userFeedbacks = allFeedback.filter(f => f.user_id === uid);

      // Chat interactions this week
      const chatsThisWeek = userChats.filter(c => new Date(c.created_at).getTime() > weekAgo).length;

      // Unique usage days (from all activity)
      const allDates = [
        ...userChats.map(c => c.created_at.split("T")[0]),
        ...userNotes.map(n => n.created_at.split("T")[0]),
      ];
      const uniqueDays = new Set(allDates.filter(d => new Date(d).getTime() > weekAgo)).size;

      // Last activity
      const activityDates = [
        ...userChats.map(c => new Date(c.created_at).getTime()),
        ...userNotes.map(n => new Date(n.created_at).getTime()),
      ];
      const lastActivity = activityDates.length > 0 ? new Date(Math.max(...activityDates)).toISOString() : p.created_at;

      // MVP Score calculation (0-100)
      let score = 0;
      // Recurring usage (max 30 points)
      score += Math.min(30, uniqueDays * 6);
      // Active horse profiles (max 15 points)
      score += Math.min(15, userHorses.length * 5);
      // Chat engagement (max 20 points)
      score += Math.min(20, chatsThisWeek * 2);
      // Notes/health tracking (max 15 points)
      score += Math.min(15, userNotes.length * 3);
      // Appointments (max 10 points)
      score += Math.min(10, userApts.length * 2);
      // Positive feedback (max 10 points)
      const positiveFeedback = allQuestions.filter(q => q.user_id === uid && (q.response_rating || 0) >= 4).length;
      score += Math.min(10, positiveFeedback * 5);

      score = Math.min(100, Math.round(score));

      const mvpStatus: "red" | "yellow" | "green" = score < 25 ? "red" : score < 60 ? "yellow" : "green";

      // Risk flags
      const risks: string[] = [];
      const daysSinceActivity = (now - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 7) risks.push("Inaktiv seit >7 Tagen");
      if (userHorses.length === 0 && uniqueDays > 2) risks.push("Keine Pferde angelegt");
      if (chatsThisWeek === 0 && userNotes.length === 0 && userApts.length === 0) risks.push("Keine Kernfunktion genutzt");
      const negativeFeedback = userFeedbacks.filter(f => f.category === "problem").length;
      if (negativeFeedback >= 2) risks.push("Mehrere Probleme gemeldet");

      return {
        user_id: uid,
        display_name: p.display_name,
        user_type: (p as any).user_type || "besitzer",
        created_at: p.created_at,
        last_activity: lastActivity,
        mvp_score: score,
        mvp_status: mvpStatus,
        metrics: {
          chat_interactions: chatsThisWeek,
          horses: userHorses.length,
          notes: userNotes.length,
          appointments: userApts.length,
          usage_days: uniqueDays,
          feedbacks: userFeedbacks.length,
        },
        risk_flags: risks,
      };
    });

    // Aggregate question results
    const qMap = new Map<string, { total: number; count: number }>();
    allQuestions.forEach(q => {
      const existing = qMap.get(q.question_key) || { total: 0, count: 0 };
      qMap.set(q.question_key, {
        total: existing.total + (q.response_rating || 0),
        count: existing.count + 1,
      });
    });
    const qResults: MvpQuestionResult[] = Array.from(qMap.entries()).map(([key, v]) => ({
      question_key: key,
      avg_rating: v.count > 0 ? v.total / v.count : 0,
      count: v.count,
    }));

    // Enriched feedback with display names
    const enrichedFeedback: FeedbackItem[] = allFeedback.map(f => ({
      ...f,
      display_name: profiles.find(p => p.user_id === f.user_id)?.display_name || null,
    })) as FeedbackItem[];

    // Global MVP score
    const avgScore = mvpUsers.length > 0
      ? Math.round(mvpUsers.reduce((s, u) => s + u.mvp_score, 0) / mvpUsers.length)
      : 0;
    setGlobalScore(avgScore);

    // Generate recommendations
    const recs: Recommendation[] = [];
    const greenPct = mvpUsers.filter(u => u.mvp_status === "green").length / (mvpUsers.length || 1) * 100;
    const redPct = mvpUsers.filter(u => u.mvp_status === "red").length / (mvpUsers.length || 1) * 100;
    const inactiveUsers = mvpUsers.filter(u => u.risk_flags.includes("Inaktiv seit >7 Tagen")).length;

    if (avgScore < 25) {
      recs.push({ type: "danger", title: "MVP-Status gefährdet", description: "Der durchschnittliche MVP-Score liegt unter 25. Die Kernhypothese wird aktuell nicht validiert.", icon: AlertTriangle });
    }
    if (greenPct >= 60) {
      recs.push({ type: "success", title: "Hypothese bestätigt", description: `${Math.round(greenPct)}% der Nutzer zeigen bestätigten, wiederkehrenden Nutzen. MVP-Exit prüfen.`, icon: CheckCircle2 });
    }
    if (redPct > 50) {
      recs.push({ type: "danger", title: "Hohe Abbruchrate", description: `${Math.round(redPct)}% der Nutzer zeigen keinen validierten Nutzen.`, icon: XCircle });
    }
    if (inactiveUsers > mvpUsers.length * 0.3) {
      recs.push({ type: "warning", title: "Inaktivitätswelle", description: `${inactiveUsers} Nutzer sind seit über 7 Tagen inaktiv.`, icon: MinusCircle });
    }
    if (negativeFeedbackCount(enrichedFeedback) > 3) {
      recs.push({ type: "warning", title: "Wiederkehrende Probleme", description: "Mehrere Nutzer melden Probleme. Kernnutzen prüfen.", icon: AlertTriangle });
    }
    if (avgScore >= 60) {
      recs.push({ type: "info", title: "MVP-Score stabil", description: "Der Durchschnittswert zeigt solide Nutzung. Weiter beobachten.", icon: Lightbulb });
    }

    setUsers(mvpUsers.sort((a, b) => b.mvp_score - a.mvp_score));
    setFeedbacks(enrichedFeedback);
    setQuestionResults(qResults);
    setRecommendations(recs);
    setLoading(false);
  };

  const updateFeedbackStatus = async (id: string, status: string, response?: string) => {
    const update: any = { status };
    if (response !== undefined) update.admin_response = response;
    await supabase.from("user_feedback").update(update).eq("id", id);
    fetchMvpData();
  };

  if (loading) return <p className="text-sm text-muted-foreground">MVP-Daten laden…</p>;

  const totalUsers = users.length;
  const greenUsers = users.filter(u => u.mvp_status === "green").length;
  const yellowUsers = users.filter(u => u.mvp_status === "yellow").length;
  const redUsers = users.filter(u => u.mvp_status === "red").length;
  const atRisk = users.filter(u => u.risk_flags.length > 0).length;

  return (
    <div className="space-y-5">
      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <ScoreCard label="MVP-Score Ø" value={globalScore} suffix="/100" color={globalScore >= 60 ? "text-green-600" : globalScore >= 25 ? "text-yellow-600" : "text-destructive"} />
        <ScoreCard label="🟢 Validiert" value={greenUsers} suffix={`/${totalUsers}`} color="text-green-600" />
        <ScoreCard label="🟡 Teilweise" value={yellowUsers} suffix={`/${totalUsers}`} color="text-yellow-600" />
        <ScoreCard label="🔴 Kein Nutzen" value={redUsers} suffix={`/${totalUsers}`} color="text-destructive" />
        <ScoreCard label="⚠️ Risiko" value={atRisk} suffix=" Nutzer" color="text-orange-500" />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System-Empfehlungen</h4>
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                rec.type === "danger" ? "bg-destructive/5 border-destructive/20" :
                rec.type === "warning" ? "bg-yellow-500/5 border-yellow-500/20" :
                rec.type === "success" ? "bg-green-500/5 border-green-500/20" :
                "bg-primary/5 border-primary/20"
              }`}
            >
              <rec.icon size={16} className={
                rec.type === "danger" ? "text-destructive" :
                rec.type === "warning" ? "text-yellow-600" :
                rec.type === "success" ? "text-green-600" : "text-primary"
              } />
              <div>
                <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                <p className="text-[10px] text-muted-foreground">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 overflow-x-auto">
        {[
          { key: "overview" as const, label: "Nutzer-MVP" },
          { key: "feedback" as const, label: `Feedback (${feedbacks.length})` },
          { key: "risks" as const, label: "Risiken" },
          { key: "exit" as const, label: "Exit-Kriterien" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeSubTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* User MVP Overview */}
      {activeSubTab === "overview" && (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {users.map(u => (
            <div key={u.user_id}>
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    u.mvp_status === "green" ? "bg-green-500" : u.mvp_status === "yellow" ? "bg-yellow-500" : "bg-destructive"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.display_name || "Unbenannt"}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{u.user_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      u.mvp_score >= 60 ? "text-green-600" : u.mvp_score >= 25 ? "text-yellow-600" : "text-destructive"
                    }`}>{u.mvp_score}</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  {expandedUser === u.user_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              {expandedUser === u.user_id && (
                <div className="px-4 py-4 bg-secondary/10 border-t border-border space-y-3">
                  {/* Score bar */}
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        u.mvp_score >= 60 ? "bg-green-500" : u.mvp_score >= 25 ? "bg-yellow-500" : "bg-destructive"
                      }`}
                      style={{ width: `${u.mvp_score}%` }}
                    />
                  </div>
                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <MetricBox icon={MessageCircle} label="Chats/Wo." value={u.metrics.chat_interactions} />
                    <MetricBox icon={Heart} label="Pferde" value={u.metrics.horses} />
                    <MetricBox icon={FileText} label="Notizen" value={u.metrics.notes} />
                    <MetricBox icon={Calendar} label="Termine" value={u.metrics.appointments} />
                    <MetricBox icon={Activity} label="Tage/Wo." value={u.metrics.usage_days} />
                    <MetricBox icon={Star} label="Feedbacks" value={u.metrics.feedbacks} />
                  </div>
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Aktiv seit</span><p className="text-foreground">{new Date(u.created_at).toLocaleDateString("de-DE")}</p></div>
                    <div><span className="text-muted-foreground">Letzte Aktivität</span><p className="text-foreground">{new Date(u.last_activity).toLocaleDateString("de-DE")}</p></div>
                  </div>
                  {/* Risk flags */}
                  {u.risk_flags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {u.risk_flags.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback Tab */}
      {activeSubTab === "feedback" && (
        <FeedbackAdminList feedbacks={feedbacks} onUpdate={updateFeedbackStatus} />
      )}

      {/* Risks Tab */}
      {activeSubTab === "risks" && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">MVP-Risiko-Indikatoren</h4>
          {users.filter(u => u.risk_flags.length > 0).map(u => (
            <div key={u.user_id} className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-destructive" />
                <span className="text-sm font-medium text-foreground">{u.display_name || "Unbenannt"}</span>
                <span className="text-[10px] text-muted-foreground">(Score: {u.mvp_score})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {u.risk_flags.map((r, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">{r}</span>
                ))}
              </div>
            </div>
          ))}
          {users.filter(u => u.risk_flags.length > 0).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Keine Risiken erkannt ✅</p>
          )}
        </div>
      )}

      {/* Exit Criteria Tab */}
      {activeSubTab === "exit" && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">MVP-Exit-Kriterien</h4>
          <div className="space-y-3">
            <ExitCriterion
              label="≥60% der Nutzer nutzen Huufi ≥4 Tage/Woche"
              current={totalUsers > 0 ? Math.round(users.filter(u => u.metrics.usage_days >= 4).length / totalUsers * 100) : 0}
              target={60}
            />
            <ExitCriterion
              label="≥50% bestätigen klaren Alltagsnutzen (Score ≥60)"
              current={totalUsers > 0 ? Math.round(greenUsers / totalUsers * 100) : 0}
              target={50}
            />
            <ExitCriterion
              label="≥20% zahlen für Premium"
              current={totalUsers > 0 ? 0 : 0}
              target={20}
            />
            <ExitCriterion
              label="Durchschnittliches Feedback-Rating ≥4.0"
              current={questionResults.length > 0 ? Math.round(questionResults.reduce((s, q) => s + q.avg_rating, 0) / questionResults.length * 10) / 10 : 0}
              target={4}
              isRating
            />
          </div>

          {/* MVP Question Results */}
          {questionResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">MVP-Fragen Ergebnisse</h4>
              {questionResults.map(q => (
                <div key={q.question_key} className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground font-medium">{q.question_key.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} size={12} className={n <= Math.round(q.avg_rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{q.avg_rating.toFixed(1)} ({q.count})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper components
function ScoreCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border text-center">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}<span className="text-xs font-normal text-muted-foreground">{suffix}</span></p>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number }) {
  return (
    <div className="p-2 rounded-lg bg-background border border-border">
      <Icon size={12} className="text-primary mx-auto mb-1" />
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ExitCriterion({ label, current, target, isRating }: { label: string; current: number; target: number; isRating?: boolean }) {
  const met = current >= target;
  const pct = isRating ? (current / 5) * 100 : Math.min(100, (current / target) * 100);
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground">{label}</p>
        {met ? <CheckCircle2 size={16} className="text-green-500" /> : <Target size={16} className="text-muted-foreground" />}
      </div>
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${met ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Aktuell: <span className={`font-medium ${met ? "text-green-600" : "text-foreground"}`}>
          {isRating ? current : `${current}%`}
        </span> / Ziel: {isRating ? target : `${target}%`}
      </p>
    </div>
  );
}

function FeedbackAdminList({ feedbacks, onUpdate }: { feedbacks: FeedbackItem[]; onUpdate: (id: string, status: string, response?: string) => void }) {
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  const catLabel = (c: string) => {
    const map: Record<string, string> = { problem: "🔴 Problem", wunsch: "💡 Wunsch", frage: "❓ Frage", feedback: "💬 Feedback", nutzen: "✅ Nutzen", verstaendnis: "📖 Verständnis" };
    return map[c] || c;
  };

  return (
    <div className="space-y-2">
      {feedbacks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Kein Feedback vorhanden</p>}
      {feedbacks.map(fb => (
        <div key={fb.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">{catLabel(fb.category)}</span>
              <span className="text-[10px] text-muted-foreground">{fb.display_name || "Unbekannt"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                fb.status === "offen" ? "bg-yellow-500/10 text-yellow-600" :
                fb.status === "geprueft" ? "bg-blue-500/10 text-blue-600" :
                "bg-green-500/10 text-green-600"
              }`}>{fb.status}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                fb.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
              }`}>{fb.priority}</span>
            </div>
          </div>
          <p className="text-sm text-foreground">{fb.content}</p>
          {fb.admin_response && (
            <div className="p-2 rounded-lg bg-primary/5 text-xs text-foreground">{fb.admin_response}</div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={responseText[fb.id] || ""}
              onChange={e => setResponseText(prev => ({ ...prev, [fb.id]: e.target.value }))}
              placeholder="Antwort schreiben…"
              className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => { onUpdate(fb.id, "geprueft", responseText[fb.id]); setResponseText(prev => ({ ...prev, [fb.id]: "" })); }}
              className="px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:opacity-90"
            >
              Antworten
            </button>
            {fb.status !== "erledigt" && (
              <button
                onClick={() => onUpdate(fb.id, "erledigt")}
                className="px-2 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-medium hover:bg-green-500/20"
              >
                ✓ Erledigt
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{new Date(fb.created_at).toLocaleDateString("de-DE")}</p>
        </div>
      ))}
    </div>
  );
}

function negativeFeedbackCount(feedbacks: FeedbackItem[]): number {
  return feedbacks.filter(f => f.category === "problem").length;
}
