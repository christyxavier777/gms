"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const load_dashboard_1 = require("./load-dashboard");
function argValue(name) {
    const index = process.argv.indexOf(name);
    if (index < 0)
        return undefined;
    return process.argv[index + 1];
}
function parseLoginArgs() {
    return {
        url: argValue("--url") ?? process.env.LOADTEST_BASE_URL ?? "http://127.0.0.1:4000",
        email: argValue("--email") ?? process.env.ADMIN_EMAIL ?? "",
        password: argValue("--password") ?? process.env.ADMIN_PASSWORD ?? "",
    };
}
function extractSessionCookie(setCookieHeader) {
    if (!setCookieHeader) {
        throw new Error("Login succeeded but no Set-Cookie header was returned.");
    }
    const match = setCookieHeader.match(/gms_session=[^;]+/i);
    if (!match?.[0]) {
        throw new Error("Login response did not include gms_session cookie.");
    }
    return match[0];
}
async function loginAndGetSessionCookie(args) {
    if (!args.email || !args.password) {
        throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for loadtest:dashboard:auth.");
    }
    const loginUrl = `${args.url.replace(/\/+$/, "")}/auth/login`;
    const response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: args.email,
            password: args.password,
        }),
    });
    if (!response.ok) {
        const rawBody = await response.text();
        throw new Error(`Login failed (${response.status}). Response: ${rawBody}`);
    }
    return extractSessionCookie(response.headers.get("set-cookie"));
}
async function run() {
    const loginArgs = parseLoginArgs();
    const sessionCookie = await loginAndGetSessionCookie(loginArgs);
    console.log(JSON.stringify({
        event: "dashboard_loadtest_auth_success",
        email: loginArgs.email,
    }, null, 2));
    await (0, load_dashboard_1.runDashboardLoadTest)({
        ...(0, load_dashboard_1.parseDashboardLoadTestArgsFromProcess)(),
        token: "",
        sessionCookie,
    });
}
void run();
//# sourceMappingURL=load-dashboard-auth.js.map