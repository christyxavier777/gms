import autocannon, { Result } from "autocannon";

type Args = {
  url: string;
  endpoint: string;
  connections: number;
  durationSec: number;
  pipelining: number;
  token: string;
  sloLatencyP95Ms: number;
  sloErrorRatePct: number;
  enforceSlo: boolean;
};

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toPositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function parseArgs(): Args {
  const url = argValue("--url") ?? process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:4000";
  const endpoint = argValue("--endpoint") ?? process.env.LOADTEST_ENDPOINT ?? "/dashboard/admin/performance";
  const connections = toPositiveInt(argValue("--connections") ?? process.env.LOADTEST_CONNECTIONS, 100);
  const durationSec = toPositiveInt(argValue("--duration") ?? process.env.LOADTEST_DURATION_SEC, 20);
  const pipelining = toPositiveInt(argValue("--pipelining") ?? process.env.LOADTEST_PIPELINING, 1);
  const token = argValue("--token") ?? process.env.LOADTEST_BEARER_TOKEN ?? "";
  const sloLatencyP95Ms = toPositiveNumber(process.env.SLO_LATENCY_P95_MS, 300);
  const sloErrorRatePct = toPositiveNumber(process.env.SLO_ERROR_RATE_PCT, 1);
  const enforceSlo = toBool(argValue("--enforce-slo") ?? process.env.LOADTEST_ENFORCE_SLO, false);

  return {
    url,
    endpoint,
    connections,
    durationSec,
    pipelining,
    token,
    sloLatencyP95Ms,
    sloErrorRatePct,
    enforceSlo,
  };
}

async function run(): Promise<void> {
  const args = parseArgs();
  const requestUrl = `${args.url.replace(/\/+$/, "")}/${args.endpoint.replace(/^\/+/, "")}`;
  const headers: Record<string, string> = {};
  if (args.token) {
    headers.Authorization = `Bearer ${args.token}`;
  }

  console.log(
    JSON.stringify(
      {
        event: "dashboard_loadtest_start",
        requestUrl,
        connections: args.connections,
        durationSec: args.durationSec,
        pipelining: args.pipelining,
        hasToken: Boolean(args.token),
      },
      null,
      2,
    ),
  );

  const result = await new Promise<Result>((resolve, reject) => {
    const instance = autocannon(
      {
        url: requestUrl,
        method: "GET",
        duration: args.durationSec,
        connections: args.connections,
        pipelining: args.pipelining,
        headers,
      },
      (error, finalResult) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(finalResult);
      },
    );

    autocannon.track(instance, { renderProgressBar: true, renderResultsTable: true });
  });

  const totalRequests = result.requests.total ?? 0;
  const totalErrors = result.errors ?? 0;
  const totalNon2xx = result["non2xx"] ?? 0;
  const errorRatePct = totalRequests > 0 ? ((totalErrors + totalNon2xx) / totalRequests) * 100 : 0;
  const latency = result.latency as unknown as Record<string, number>;
  const p95Ms = latency.p95 ?? latency.p97_5 ?? 0;

  const latencyBreached = p95Ms > args.sloLatencyP95Ms;
  const errorRateBreached = errorRatePct > args.sloErrorRatePct;

  console.log(
    JSON.stringify(
      {
        event: "dashboard_loadtest_summary",
        requests: {
          total: totalRequests,
          averagePerSec: result.requests.average ?? 0,
        },
        latencyMs: {
          average: result.latency.average ?? 0,
          p95: p95Ms,
          max: result.latency.max ?? 0,
          thresholdP95: args.sloLatencyP95Ms,
        },
        errors: {
          errors: totalErrors,
          non2xx: totalNon2xx,
          errorRatePct: Number(errorRatePct.toFixed(2)),
          thresholdPct: args.sloErrorRatePct,
        },
        breached: {
          latencyP95: latencyBreached,
          errorRate: errorRateBreached,
        },
      },
      null,
      2,
    ),
  );

  if (!args.token) {
    console.warn("LOADTEST_BEARER_TOKEN not set. Protected endpoints may return 401/403 and inflate error rate.");
  }

  if (args.enforceSlo && (latencyBreached || errorRateBreached)) {
    process.exitCode = 1;
  }
}

void run();
