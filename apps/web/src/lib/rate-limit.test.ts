import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock next/server before importing the module under test
// ---------------------------------------------------------------------------
vi.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    body: unknown;
    headers: Map<string, string>;

    constructor(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(data, init);
    }
  }

  class MockNextRequest {
    url: string;
    headers: Map<string, string>;

    constructor(url: string, options: { headers?: Record<string, string> } = {}) {
      this.url = url;
      this.headers = new Map(Object.entries(options.headers ?? {}));
    }

    get(header: string) {
      return this.headers.get(header) ?? null;
    }
  }

  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

import { rateLimit, withRateLimit } from './rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Reset module-level store between tests by re-importing fresh state each test.
// Because the store is module-scoped we use unique keys per test instead.
// ---------------------------------------------------------------------------

let keyCounter = 0;
function uniqueKey(prefix = 'test') {
  return `${prefix}-${Date.now()}-${++keyCounter}`;
}

// ---------------------------------------------------------------------------
// rateLimit — counter increments
// ---------------------------------------------------------------------------
describe('rateLimit — counter increments', () => {
  it('first call succeeds with remaining = limit - 1', async () => {
    const key = uniqueKey();
    const result = await rateLimit(key, 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('second call decrements remaining', async () => {
    const key = uniqueKey();
    await rateLimit(key, 5, 60_000);
    const result = await rateLimit(key, 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it('consecutive calls decrement correctly', async () => {
    const key = uniqueKey();
    const limit = 3;
    for (let i = 0; i < limit - 1; i++) {
      const r = await rateLimit(key, limit, 60_000);
      expect(r.success).toBe(true);
    }
    const last = await rateLimit(key, limit, 60_000);
    expect(last.success).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it('returns resetAt in the future', async () => {
    const key = uniqueKey();
    const before = Date.now();
    const result = await rateLimit(key, 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(before);
  });
});

// ---------------------------------------------------------------------------
// rateLimit — 429 threshold
// ---------------------------------------------------------------------------
describe('rateLimit — 429 threshold', () => {
  it('fails on limit+1 call', async () => {
    const key = uniqueKey();
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      await rateLimit(key, limit, 60_000);
    }
    const result = await rateLimit(key, limit, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('continues to fail after limit exceeded', async () => {
    const key = uniqueKey();
    const limit = 2;
    for (let i = 0; i < limit; i++) {
      await rateLimit(key, limit, 60_000);
    }
    const r1 = await rateLimit(key, limit, 60_000);
    const r2 = await rateLimit(key, limit, 60_000);
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it('limit of 1 fails on second call', async () => {
    const key = uniqueKey();
    const first = await rateLimit(key, 1, 60_000);
    expect(first.success).toBe(true);
    const second = await rateLimit(key, 1, 60_000);
    expect(second.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// rateLimit — window reset
// ---------------------------------------------------------------------------
describe('rateLimit — window reset', () => {
  it('resets after window expires', async () => {
    const key = uniqueKey();
    const limit = 2;
    // Use a 1ms window — already expired by next tick
    await rateLimit(key, limit, 1);
    await rateLimit(key, limit, 1);
    // Exhaust the limit
    const exhausted = await rateLimit(key, limit, 1);
    expect(exhausted.success).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 10));

    // New window — should succeed again
    const reset = await rateLimit(key, limit, 1);
    expect(reset.success).toBe(true);
    expect(reset.remaining).toBe(limit - 1);
  });

  it('new key always starts fresh', async () => {
    const key1 = uniqueKey('a');
    const key2 = uniqueKey('b');

    // Exhaust key1
    await rateLimit(key1, 1, 60_000);
    const r1 = await rateLimit(key1, 1, 60_000);
    expect(r1.success).toBe(false);

    // key2 is independent
    const r2 = await rateLimit(key2, 1, 60_000);
    expect(r2.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rateLimit — Upstash fallback (env not set → memory path)
// ---------------------------------------------------------------------------
describe('rateLimit — Upstash env not configured', () => {
  it('uses in-memory path when UPSTASH_REDIS_REST_URL is not set', async () => {
    const original = process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    const key = uniqueKey();
    const result = await rateLimit(key, 10, 60_000);
    expect(result.success).toBe(true);
    if (original !== undefined) process.env.UPSTASH_REDIS_REST_URL = original;
  });
});

// ---------------------------------------------------------------------------
// withRateLimit
// ---------------------------------------------------------------------------
describe('withRateLimit', () => {
  function makeRequest(headers: Record<string, string> = {}) {
    return new NextRequest('http://localhost/api/test', { headers }) as unknown as import('next/server').NextRequest;
  }

  it('calls the handler when under limit', async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler as any, {
      key: () => uniqueKey('wrap'),
      limit: 10,
      windowMs: 60_000,
    });

    const response = await wrapped(makeRequest());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when limit exceeded', async () => {
    const key = uniqueKey('wrap-limit');
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler as any, {
      key: () => key,
      limit: 1,
      windowMs: 60_000,
    });

    await wrapped(makeRequest());           // first call OK
    const response = await wrapped(makeRequest()) as any; // second call — over limit
    expect(response.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(1); // handler not called second time
  });

  it('attaches X-RateLimit-Limit header to 429 response', async () => {
    const key = uniqueKey('wrap-header');
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler as any, {
      key: () => key,
      limit: 1,
      windowMs: 60_000,
    });

    await wrapped(makeRequest());
    const response = await wrapped(makeRequest()) as any;
    expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('attaches rate limit headers to successful response', async () => {
    const key = uniqueKey('wrap-success-header');
    const mockResponse = NextResponse.json({ ok: true });
    const handler = vi.fn().mockResolvedValue(mockResponse);
    const wrapped = withRateLimit(handler as any, {
      key: () => key,
      limit: 10,
      windowMs: 60_000,
    });

    const response = await wrapped(makeRequest()) as any;
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).not.toBeNull();
  });
});
