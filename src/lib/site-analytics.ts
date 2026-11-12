const SUPABASE_URL = "https://bmeddjzihcvraqmhkxen.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Y5Vkz3pQPuihk6qXt2w2bA_BOPEJJpm";

const VISITOR_KEY = "vyneshinden_visitor_id";
const SESSION_KEY = "vyneshinden_session_id";
const ATTRIBUTION_KEY = "vyneshinden_attribution";

type Attribution = {
  referrer: string | null;
  traffic_source: "search" | "social" | "referral" | "direct" | "unknown";
  search_engine: string | null;
};

const SEARCH_ENGINES = [
  "google.", "bing.com", "search.yahoo.", "duckduckgo.com",
  "ecosia.org", "baidu.com", "yandex.", "search.brave.com",
];

const SOCIAL_SITES = [
  "facebook.com", "l.facebook.com", "instagram.com", "t.co",
  "twitter.com", "x.com", "reddit.com", "pinterest.",
  "tiktok.com", "youtube.com", "youtu.be", "threads.net",
];

function makeId(): string {
  return crypto.randomUUID();
}

function getOrCreate(storage: Storage, key: string): string {
  let value = storage.getItem(key);
  if (!value) {
    value = makeId();
    storage.setItem(key, value);
  }
  return value;
}

function getAttribution(): Attribution {
  const saved = sessionStorage.getItem(ATTRIBUTION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as Attribution;
    } catch {
      sessionStorage.removeItem(ATTRIBUTION_KEY);
    }
  }

  const rawReferrer = document.referrer;
  let attribution: Attribution = {
    referrer: null,
    traffic_source: "direct",
    search_engine: null,
  };

  if (rawReferrer) {
    try {
      const url = new URL(rawReferrer);
      const host = url.hostname.toLowerCase();
      const safeReferrer = url.origin;

      const searchMatch = SEARCH_ENGINES.find((domain) => host.includes(domain));
      if (searchMatch) {
        attribution = {
          referrer: safeReferrer,
          traffic_source: "search",
          search_engine: host,
        };
      } else if (SOCIAL_SITES.some((domain) => host.includes(domain))) {
        attribution = {
          referrer: safeReferrer,
          traffic_source: "social",
          search_engine: null,
        };
      } else {
        attribution = {
          referrer: safeReferrer,
          traffic_source: "referral",
          search_engine: null,
        };
      }
    } catch {
      attribution.traffic_source = "unknown";
    }
  }

  sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
}

export function trackPageView(pathname: string): void {
  if (typeof window === "undefined") return;

  try {
    const visitorId = getOrCreate(localStorage, VISITOR_KEY);
    const sessionId = getOrCreate(sessionStorage, SESSION_KEY);
    const attribution = getAttribution();

    void fetch(`${SUPABASE_URL}/functions/v1/track-visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        visitor_id: visitorId,
        session_id: sessionId,
        page_path: pathname,
        ...attribution,
        user_agent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch((error) => {
      console.debug("Visit analytics unavailable:", error);
    });
  } catch (error) {
    // Analytics must never interrupt the portfolio if browser storage is unavailable.
    console.debug("Visit analytics unavailable:", error);
  }
}
