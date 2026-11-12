import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const SUPABASE_URL = "https://bmeddjzihcvraqmhkxen.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y5Vkz3pQPuihk6qXt2w2bA_BOPEJJpm";
const SESSION_KEY = "vyneshinden_analytics_session";

type AuthSession = { access_token: string; refresh_token: string; expires_at?: number };
type Visit = {
  visited_at: string;
  visitor_id: string;
  session_id: string | null;
  page_path: string;
  traffic_source: string;
  search_engine: string | null;
  bot_type?: "human" | "chatgpt" | "worker" | "unknown";
};
type AnalyticsPayload = { totalViews: number; rows: Visit[]; truncated: boolean };

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function readSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) throw new Error("Your session expired. Please sign in again.");
  const data = await response.json();
  const next = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

async function loadAnalytics(session: AuthSession): Promise<{ data: AnalyticsPayload; session: AuthSession }> {
  let active = session;
  if (active.expires_at && active.expires_at * 1000 < Date.now() + 30_000) {
    active = await refreshSession(active);
  }
  const request = () => fetch(`${SUPABASE_URL}/functions/v1/analytics-dashboard`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${active.access_token}` },
    cache: "no-store",
  });
  let response = await request();
  if (response.status === 401) {
    active = await refreshSession(active);
    response = await request();
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load analytics.");
  }
  return { data: await response.json(), session: active };
}

function AnalyticsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [range, setRange] = useState<1 | 7 | 30 | 0>(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "Sign-in failed.");
      const next = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setPassword("");
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (session) {
      void fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
      }).catch(() => undefined);
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPayload(null);
    setError("");
  }

  useEffect(() => {
    const saved = readSession();
    if (saved) setSession(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setBusy(true);
    setError("");
    loadAnalytics(session)
      .then(({ data, session: active }) => {
        if (cancelled) return;
        localStorage.setItem(SESSION_KEY, JSON.stringify(active));
        setSession(active);
        setPayload(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load analytics.");
        if (err instanceof Error && err.message.toLowerCase().includes("session")) {
          localStorage.removeItem(SESSION_KEY);
          setSession(null);
        }
      })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const rows = payload?.rows ?? [];
  const filtered = useMemo(() => {
    if (!range) return rows;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    if (range !== 1) cutoff.setDate(cutoff.getDate() - range);
    return rows.filter((row) => {
      const timestamp = new Date(row.visited_at).getTime();
      return timestamp >= cutoff.getTime() && timestamp <= now.getTime();
    });
  }, [rows, range]);

  const botCounts = { chatgpt: filtered.filter((row) => row.bot_type === "chatgpt").length, worker: filtered.filter((row) => row.bot_type === "worker").length, human: filtered.filter((row) => row.bot_type === "human").length, unknown: filtered.filter((row) => !row.bot_type || row.bot_type === "unknown").length };
  const uniqueVisitors = new Set(filtered.filter((row) => row.bot_type !== "chatgpt" && row.bot_type !== "worker").map((row) => row.visitor_id)).size;
  const uniqueSessions = new Set(filtered.map((row) => row.session_id).filter(Boolean)).size;
  const pages = Object.entries(filtered.reduce<Record<string, number>>((acc, row) => {
    acc[row.page_path] = (acc[row.page_path] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const sources = Object.entries(filtered.reduce<Record<string, number>>((acc, row) => {
    const key = row.traffic_source || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const dayCount = range === 7 ? 7 : 14;
  const dailyBars = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (dayCount - 1 - index));
    const key = date.toLocaleDateString("en-CA");
    return { key, label: date.toLocaleDateString("en", { weekday: "short" }), count: filtered.filter((row) => { const visitDate = new Date(row.visited_at); const visitKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, "0")}-${String(visitDate.getDate()).padStart(2, "0")}`; return visitKey === key; }).length };
  });
  const hourlyBars = Array.from({ length: 24 }, (_, index) => {
    const start = new Date();
    start.setHours(index, 0, 0, 0);
    const end = new Date(start);
    end.setHours(index + 1, 0, 0, 0);
    return {
      key: start.toISOString(),
      label: start.toLocaleTimeString("en", { hour: "numeric", hour12: true }),
      count: filtered.filter((row) => {
        const timestamp = new Date(row.visited_at).getTime();
        return timestamp >= start.getTime() && timestamp < end.getTime();
      }).length,
    };
  });
  const chartBars = range === 1 ? hourlyBars : dailyBars;
  const maxDay = Math.max(1, ...chartBars.map((bar) => bar.count));

  if (!loaded) return <div className="min-h-screen bg-[#080a0f]" />;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11151d] p-7 shadow-2xl sm:p-9">
          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.35em] text-[#FF7300]">VYNESHINDEN / PRIVATE</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Analytics access</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in with your authorized dashboard account.</p>
          </div>
          <form onSubmit={signIn} className="space-y-4">
            <label className="block text-sm text-slate-300">Email
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#090c12] px-4 py-3 text-white outline-none transition focus:border-[#FF7300]" />
            </label>
            <label className="block text-sm text-slate-300">Password
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#090c12] px-4 py-3 text-white outline-none transition focus:border-[#FF7300]" />
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-[#FF7300] px-4 py-3 font-semibold text-slate-950 transition hover:bg-[#FF7300] disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Private dashboard · Authorized account only</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0f] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.32em] text-[#FF7300]">VYNESHINDEN / CONTROL ROOM</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Site analytics</h1>
            <p className="mt-1 text-sm text-slate-400">A live look at the people visiting your world.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">PRIVATE ACCESS</span>
            <button onClick={signOut} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Sign out</button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{busy ? "Refreshing data…" : "Analytics overview"}</p>
          <div className="flex rounded-lg border border-white/10 bg-[#11151d] p-1">
            {([1, 7, 30, 0] as const).map((value) => (
              <button key={value} onClick={() => setRange(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${range === value ? "bg-[#FF7300] text-slate-950" : "text-slate-400 hover:text-white"}`}>{value === 1 ? "24 hours" : value === 0 ? "All" : `${value} days`}</button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Page views", value: range === 0 && !payload?.truncated ? payload?.totalViews ?? 0 : filtered.length, note: range === 0 && payload?.truncated ? "Latest 5,000 records" : "Recorded page loads" },
            { label: "Unique visitors", value: uniqueVisitors, note: "Anonymous browser IDs" },
            { label: "Sessions", value: uniqueSessions, note: "Browsing sessions" },
            { label: "Pages tracked", value: new Set(filtered.map((row) => row.page_path)).size, note: "Distinct page paths" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums sm:text-4xl">{item.value.toLocaleString()}</p>
              <p className="mt-2 text-[11px] text-slate-500">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "ChatGPT", value: botCounts.chatgpt, note: "Identifiable OpenAI agents" },
            { label: "Worker bots", value: botCounts.worker, note: "Other recognized automation" },
            { label: "Human / browser", value: botCounts.human, note: "Regular browser visits" },
            { label: "Unclassified", value: botCounts.unknown, note: "Older or unidentified visits" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-[#11151d] p-4">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-slate-500">{item.note}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Traffic over time</h2><span className="text-xs text-slate-500">{range === 1 ? "Today · hourly views" : "Daily views"}</span></div>
            {range === 1 ? (
              <div className="mt-5">
                <p className="mb-3 text-[11px] text-slate-500">Today · 12 AM to 11 PM</p>
                <div className="block w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-3 touch-pan-x" aria-label="Swipeable hourly traffic chart">
                  <div className="flex h-52 min-w-max items-end gap-2">
                    {hourlyBars.map((hour) => {
                      const barHeight = hour.count ? Math.max(5, (hour.count / maxDay) * 68) : 2;
                      return (
                        <div key={hour.key} className="flex h-full w-10 shrink-0 flex-col items-center">
                          <div className="flex h-6 w-full items-end justify-center">
                            <span className="whitespace-nowrap text-[10px] font-medium tabular-nums text-slate-300">{hour.count}</span>
                          </div>
                          <div className="flex w-full flex-1 items-end justify-center">
                            <div className="w-6 rounded-t-sm bg-[#FF7300]/80" style={{ height: `${barHeight}%` }} />
                          </div>
                          <span className="mt-2 h-4 whitespace-nowrap text-[10px] text-slate-400">{hour.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex h-44 items-end gap-1 sm:gap-2">
                {dailyBars.map((day) => {
                  const barHeight = day.count ? Math.max(5, (day.count / maxDay) * 78) : 1;
                  return (
                    <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center">
                      <div className="relative flex w-full flex-1 items-end justify-center">
                        {day.count > 0 && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tabular-nums text-slate-400" style={{ bottom: `calc(${barHeight}% + 4px)` }}>{day.count}</span>}
                        <div className="w-full rounded-t-sm bg-[#FF7300]/80" style={{ height: `${barHeight}%` }} />
                      </div>
                      <span className="mt-2 h-3 text-[10px] text-slate-500">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Traffic sources</h2>
            <div className="mt-5 space-y-4">
              {sources.length ? sources.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="capitalize text-slate-300">{name}</span><span className="tabular-nums text-slate-400">{count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7300]" style={{ width: `${(count / Math.max(1, filtered.length)) * 100}%` }} /></div>
                </div>
              )) : <p className="text-sm text-slate-500">No traffic data for this period yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Top pages</h2>
            <div className="mt-4 divide-y divide-white/5">
              {pages.length ? pages.map(([path, count]) => (
                <div key={path} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate text-slate-300">{path}</span><span className="shrink-0 tabular-nums text-slate-400">{count} views</span></div>
              )) : <p className="py-4 text-sm text-slate-500">No page views in this period.</p>}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Recent activity</h2>
            <div className="mt-4 divide-y divide-white/5">
              {filtered.slice(0, 7).length ? filtered.slice(0, 7).map((row, index) => (
                <div key={`${row.visited_at}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0"><p className="truncate text-slate-300">{row.page_path}</p><p className="mt-1 text-[11px] capitalize text-slate-500">{row.bot_type === "chatgpt" ? "ChatGPT" : row.bot_type === "worker" ? "Worker bot" : row.bot_type === "human" ? "Human / browser" : "Unclassified"} · {row.traffic_source || "unknown"} traffic</p></div>
                  <time className="shrink-0 text-[11px] text-slate-500">{new Date(row.visited_at).toLocaleString()}</time>
                </div>
              )) : <p className="py-4 text-sm text-slate-500">No activity recorded yet.</p>}
            </div>
          </div>
        </section>
        {payload?.truncated && <p className="mt-5 text-center text-xs text-amber-300/80">Showing the latest 5,000 page views. Older records are not included in the visitor and session breakdowns.</p>}
        <footer className="mt-8 border-t border-white/10 pt-4 text-center text-[11px] text-slate-600">VYNESHINDEN · PRIVATE ANALYTICS · No raw IP addresses are collected</footer>
      </div>
    </main>
  );
}
