import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/rate-limit-check
 *
 * Call this before auth operations to check whether the client is rate-limited.
 * Body: { route: "sign-in" | "sign-up" | "password-reset" }
 *
 * Returns 200 { allowed: true } when the request is within limits.
 * Returns 429 { error, resetAt } when the limit is exceeded.
 *
 * Limits:
 *   - sign-in / sign-up: 5 attempts per 15 minutes per IP
 *   - password-reset:    3 attempts per hour per IP
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  let body: { route?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const route = body.route;

  if (!route || !["sign-in", "sign-up", "password-reset"].includes(route)) {
    return NextResponse.json(
      { error: "route must be one of: sign-in, sign-up, password-reset" },
      { status: 400 }
    );
  }

  let limit: number;
  let windowMs: number;

  if (route === "password-reset") {
    limit = 3;
    windowMs = 60 * 60 * 1000; // 1 hour
  } else {
    limit = 5;
    windowMs = 15 * 60 * 1000; // 15 minutes
  }

  const key = `auth:${ip}:${route}`;
  const result = await rateLimit(key, limit, windowMs);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests", resetAt: result.resetAt },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          "Retry-After": String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  return NextResponse.json(
    { allowed: true, remaining: result.remaining },
    {
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
