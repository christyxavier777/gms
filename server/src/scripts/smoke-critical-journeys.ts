import dotenv from "dotenv";

dotenv.config({ quiet: true });

type MembershipPlanResponse = {
  plans?: Array<{
    id: string;
    name: string;
    priceInr: number;
    priceMinor: number;
    durationDays: number;
  }>;
};

type RegisterResponse = {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

type LoginResponse = {
  user?: {
    id: string;
    email: string;
    role: string;
  };
};

type SubscriptionResponse = {
  subscription?: {
    id: string;
    status: string;
    planId: string;
  };
};

type PaymentResponse = {
  payment?: {
    id: string;
    status: string;
    amount: number;
    subscriptionId: string | null;
  };
};

type ProgressResponse = {
  progress?: {
    id: string;
    userId: string;
    bmi: number | null;
  };
};

type ProgressListResponse = {
  progress?: Array<{
    id: string;
  }>;
};

type MeResponse = {
  user?: {
    id: string;
    email: string;
  };
};

type HealthResponse = {
  status?: string;
  database?: string;
  cache?: string;
  dependencies?: {
    database?: {
      status?: string;
    };
    cache?: {
      status?: string;
      mode?: string;
    };
  };
};

type SmokeConfig = {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
  memberPassword: string;
  memberNamePrefix: string;
  memberEmailPrefix: string;
  upiId: string;
  requestedPlanId: string;
};

function readOptionalEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function readRequiredEnv(name: string, fallback = ""): string {
  const value = readOptionalEnv(name, fallback);
  if (!value) {
    throw new Error(`${name} is required to run smoke:critical.`);
  }
  return value;
}

function buildConfig(): SmokeConfig {
  return {
    baseUrl: readOptionalEnv("SMOKE_BASE_URL", "http://127.0.0.1:4000").replace(/\/+$/, ""),
    adminEmail: readRequiredEnv("SMOKE_ADMIN_EMAIL", readOptionalEnv("ADMIN_EMAIL")),
    adminPassword: readRequiredEnv("SMOKE_ADMIN_PASSWORD", readOptionalEnv("ADMIN_PASSWORD")),
    memberPassword: readOptionalEnv("SMOKE_MEMBER_PASSWORD", "SmokeTest123"),
    memberNamePrefix: readOptionalEnv("SMOKE_MEMBER_NAME_PREFIX", "Smoke Member"),
    memberEmailPrefix: readOptionalEnv("SMOKE_MEMBER_EMAIL_PREFIX", "smoke.member"),
    upiId: readOptionalEnv("SMOKE_UPI_ID", "smoke.member@okaxis"),
    requestedPlanId: readOptionalEnv("SMOKE_PLAN_ID"),
  };
}

function buildRunToken(): string {
  const isoPart = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const entropy = Math.random().toString(36).slice(2, 8);
  return `${isoPart}${entropy}`;
}

function buildPhoneNumber(runToken: string): string {
  const digits = runToken.replace(/\D/g, "");
  const padded = `${digits}0123456789`;
  return padded.slice(-10);
}

function extractSessionCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) {
    throw new Error("Expected login to return a session cookie, but Set-Cookie was missing.");
  }

  const match = setCookieHeader.match(/gms_session=[^;]+/i);
  if (!match?.[0]) {
    throw new Error("Expected login to return the gms_session cookie.");
  }

  return match[0];
}

async function readResponseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<{ status: number; body: T; response: Response }> {
  const response = await fetch(input, init);
  const body = (await readResponseBody(response)) as T;

  return {
    status: response.status,
    body,
    response,
  };
}

async function requestJson<T>(
  label: string,
  input: string,
  init?: RequestInit,
): Promise<{ status: number; body: T; response: Response }> {
  const { status, body, response } = await fetchJson<T>(input, init);

  if (!response.ok) {
    throw new Error(
      `${label} failed with ${status}: ${JSON.stringify(body, null, 2)}`,
    );
  }

  return {
    status,
    body,
    response,
  };
}

function logStep(message: string, details?: Record<string, unknown>): void {
  const payload = details ? { step: message, ...details } : { step: message };
  console.log(JSON.stringify(payload));
}

async function verifyHealth(baseUrl: string): Promise<void> {
  const { status, body } = await fetchJson<HealthResponse>(`${baseUrl}/health`);
  const databaseStatus = body.dependencies?.database?.status ?? body.database ?? "unknown";
  const cacheStatus = body.dependencies?.cache?.status ?? body.cache ?? "unknown";
  const cacheMode = body.dependencies?.cache?.mode ?? "unknown";

  if (databaseStatus !== "up") {
    throw new Error(`Health check did not report a healthy database: ${JSON.stringify(body, null, 2)}`);
  }

  if (status === 200) {
    logStep("health check passed", { databaseStatus, cacheStatus, cacheMode });
    return;
  }

  logStep("health check returned degraded status but database is still reachable", {
    databaseStatus,
    cacheStatus,
    cacheMode,
  });
}

async function login(baseUrl: string, email: string, password: string): Promise<{ cookie: string; user: LoginResponse["user"] }> {
  const { body, response } = await requestJson<LoginResponse>("login", `${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!body.user) {
    throw new Error("Login succeeded but response body did not include a user object.");
  }

  return {
    cookie: extractSessionCookie(response.headers.get("set-cookie")),
    user: body.user,
  };
}

async function run(): Promise<void> {
  const config = buildConfig();
  const runToken = buildRunToken();
  const memberEmail = `${config.memberEmailPrefix}+${runToken}@example.com`;
  const memberPhone = buildPhoneNumber(runToken);
  const memberName = `${config.memberNamePrefix} ${runToken.slice(-6).toUpperCase()}`;

  await verifyHealth(config.baseUrl);

  const plansResponse = await requestJson<MembershipPlanResponse>(
    "membership plan listing",
    `${config.baseUrl}/membership-plans`,
  );
  const plans = plansResponse.body.plans ?? [];
  if (plans.length === 0) {
    throw new Error("Membership plan listing returned no active plans.");
  }

  const selectedPlan =
    (config.requestedPlanId ? plans.find((plan) => plan.id === config.requestedPlanId) : undefined) ??
    plans[0];

  if (!selectedPlan) {
    throw new Error(`Requested plan ${config.requestedPlanId} was not found in membership plan listing.`);
  }

  logStep("selected membership plan", {
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    amount: selectedPlan.priceInr,
  });

  const registerResult = await requestJson<RegisterResponse>(
    "member registration",
    `${config.baseUrl}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: memberName,
        email: memberEmail,
        phone: memberPhone,
        password: config.memberPassword,
        role: "MEMBER",
      }),
    },
  );

  const registeredUser = registerResult.body.user;
  if (!registeredUser) {
    throw new Error("Registration succeeded but response body did not include the created user.");
  }

  logStep("member registered", {
    memberUserId: registeredUser.id,
    email: registeredUser.email,
  });

  const memberLogin = await login(config.baseUrl, memberEmail, config.memberPassword);
  logStep("member logged in", { memberUserId: memberLogin.user?.id, email: memberLogin.user?.email });

  const meResult = await requestJson<MeResponse>("member session validation", `${config.baseUrl}/me`, {
    headers: {
      Cookie: memberLogin.cookie,
    },
  });

  if (meResult.body.user?.id !== registeredUser.id) {
    throw new Error(
      `Authenticated member session did not match the registered user. Expected ${registeredUser.id}, received ${meResult.body.user?.id ?? "unknown"}.`,
    );
  }

  const onboardingResult = await requestJson<SubscriptionResponse>(
    "subscription onboarding",
    `${config.baseUrl}/me/subscription/onboarding`,
    {
      method: "POST",
      headers: {
        Cookie: memberLogin.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: selectedPlan.id,
      }),
    },
  );

  const subscription = onboardingResult.body.subscription;
  if (!subscription) {
    throw new Error("Subscription onboarding succeeded but response body did not include a subscription.");
  }

  logStep("subscription created", {
    subscriptionId: subscription.id,
    status: subscription.status,
  });

  const paymentResult = await requestJson<PaymentResponse>(
    "payment submission",
    `${config.baseUrl}/payments/upi`,
    {
      method: "POST",
      headers: {
        Cookie: memberLogin.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: registeredUser.id,
        subscriptionId: subscription.id,
        amount: selectedPlan.priceInr,
        upiId: config.upiId,
        proofReference: `smoke-proof-${runToken}`,
      }),
    },
  );

  const payment = paymentResult.body.payment;
  if (!payment) {
    throw new Error("Payment submission succeeded but response body did not include a payment.");
  }

  logStep("payment created", {
    paymentId: payment.id,
    paymentStatus: payment.status,
    paymentAmount: payment.amount,
  });

  const adminLogin = await login(config.baseUrl, config.adminEmail, config.adminPassword);
  logStep("admin logged in", { adminUserId: adminLogin.user?.id, email: adminLogin.user?.email });

  const progressResult = await requestJson<ProgressResponse>(
    "progress creation",
    `${config.baseUrl}/progress`,
    {
      method: "POST",
      headers: {
        Cookie: adminLogin.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: registeredUser.id,
        weight: 78.4,
        height: 1.78,
        bodyFat: 20.5,
        notes: `Smoke flow progress entry ${runToken}`,
        recordedAt: new Date().toISOString(),
      }),
    },
  );

  const progress = progressResult.body.progress;
  if (!progress) {
    throw new Error("Progress creation succeeded but response body did not include a progress entry.");
  }

  const progressList = await requestJson<ProgressListResponse>(
    "member progress lookup",
    `${config.baseUrl}/progress/${registeredUser.id}?page=1&pageSize=5`,
    {
      headers: {
        Cookie: adminLogin.cookie,
      },
    },
  );

  const progressIds = (progressList.body.progress ?? []).map((entry) => entry.id);
  if (!progressIds.includes(progress.id)) {
    throw new Error("Freshly created progress entry was not returned by member progress lookup.");
  }

  console.log(
    JSON.stringify(
      {
        result: "ok",
        flow: "critical_user_journeys",
        baseUrl: config.baseUrl,
        member: {
          id: registeredUser.id,
          email: memberEmail,
          phone: memberPhone,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planId: subscription.planId,
        },
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
        },
        progress: {
          id: progress.id,
          bmi: progress.bmi,
        },
      },
      null,
      2,
    ),
  );
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke-test failure";
  console.error(
    JSON.stringify(
      {
        result: "failed",
        flow: "critical_user_journeys",
        message,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
