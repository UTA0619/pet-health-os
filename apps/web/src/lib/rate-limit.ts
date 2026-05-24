import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Module-scope store — persists across requests in the same serverless instance
const store = new Map<string, RateLimitEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limiter.
 * Falls back to Upstash Redis when UPSTASH_REDIS_REST_URL is set.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Use Upstash if configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    return rateLimitUpstash(key, limit, windowMs, upstashUrl, upstashToken);
  }

  return rateLimitMemory(key, limit, windowMs);
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Periodically clean up expired entries (1 in 50 chance per call)
  if (Math.random() < 0.02) cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number,
  url: string,
  token: string
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const now = Date.now();
  const resetAt = now + windowMs;

  try {
    // INCR + EXPIRE via pipeline
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
      ]),
    });

    if (!res.ok) throw new Error("Upstash error");

    const data = (await res.json()) as [{ result: number }, unknown];
    const count = data[0].result;

    if (count > limit) {
      return { success: false, remaining: 0, resetAt };
    }

    return { success: true, remaining: limit - count, resetAt };
  } catch {
    // Fall back to in-memory on Upstash error
    return rateLimitMemory(key, limit, windowMs);
  }
}

type RouteHandler = (
  request: NextRequest,
  context?: unknown
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a Next.js route handler with rate limiting.
 * Reads the limit key from the X-Rate-Limit-Key header or uses IP.
 */
export function withRateLimit(
  handler: RouteHandler,
  options: { key: (req: NextRequest) => string; limit: number; windowMs: number }
): RouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    const key = options.key(request);
    const result = await rateLimit(key, options.limit, options.windowMs);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests", resetAt: result.resetAt },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(options.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const response = await handler(request, context);
    // Attach rate limit headers to successful responses
    if (response instanceof NextResponse) {
      response.headers.set("X-RateLimit-Limit", String(options.limit));
      response.headers.set(
        "X-RateLimit-Remaining",
        String(result.remaining)
      );
      response.headers.set(
        "X-RateLimit-Reset",
        String(Math.ceil(result.resetAt / 1000))
      );
    }
    return response;
  };
}
