import { NextResponse } from "next/server";

// При статическом экспорте (GitHub Pages) роут вычисляется один раз на этапе сборки.
export const dynamic = "force-static";

// ─── Живая телеметрия GitHub с локальным кэшем в памяти ──────────────
// GitHub API без токена: 60 запросов/час на IP. Кэш 5 минут защищает лимит.

interface RepoStat {
  name: string;
  stars: number;
  forks: number;
  pushedAt: string | null;
  language: string | null;
}

interface StationPayload {
  source: "live" | "static";
  fetchedAt: number;
  user: {
    login: string;
    publicRepos: number;
    followers: number;
    avatar: string | null;
    bio: string | null;
  } | null;
  repos: RepoStat[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { payload: StationPayload; ts: number } | null = null;

const UA = "rvmxl-vibe-station";

// Опциональный токен: в CI (GitHub Actions) сборка получает secrets.GITHUB_TOKEN,
// чтобы билд-время телеметрия не упиралась в лимиты анонимных запросов.
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": UA,
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json(cache.payload, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch("https://api.github.com/users/rvmxl", {
        headers: authHeaders(),
        signal: AbortSignal.timeout(6000),
      }),
      fetch("https://api.github.com/users/rvmxl/repos?per_page=100&sort=pushed", {
        headers: authHeaders(),
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (!userRes.ok || !reposRes.ok) throw new Error(`github status ${userRes.status}/${reposRes.status}`);

    const user = (await userRes.json()) as {
      login: string;
      public_repos: number;
      followers: number;
      avatar_url: string;
      bio: string | null;
    };
    const reposRaw = (await reposRes.json()) as Array<{
      name: string;
      stargazers_count: number;
      forks_count: number;
      pushed_at: string;
      language: string | null;
      fork: boolean;
    }>;

    const repos: RepoStat[] = reposRaw
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        pushedAt: r.pushed_at,
        language: r.language,
      }));

    const payload: StationPayload = {
      source: "live",
      fetchedAt: Date.now(),
      user: {
        login: user.login,
        publicRepos: user.public_repos,
        followers: user.followers,
        avatar: user.avatar_url,
        bio: user.bio,
      },
      repos,
    };

    cache = { payload, ts: Date.now() };
    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
  } catch {
    // GitHub недоступен или лимит исчерпан — станция не падает,
    // она просто сообщает, что данные из локального архива.
    const fallback: StationPayload = {
      source: "static",
      fetchedAt: Date.now(),
      user: null,
      repos: [],
    };
    return NextResponse.json(fallback, { headers: { "X-Cache": "FALLBACK" } });
  }
}
