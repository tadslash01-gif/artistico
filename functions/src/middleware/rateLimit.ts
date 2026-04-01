import { db } from "../admin";
import * as admin from "firebase-admin";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Default configs for read vs write operations
export const RATE_LIMIT_READ: RateLimitConfig = { maxRequests: 100, windowMs: 15 * 60_000 };
export const RATE_LIMIT_WRITE: RateLimitConfig = { maxRequests: 20, windowMs: 15 * 60_000 };

// In-memory cache to avoid Firestore reads on every request (hot path).
// Falls back to Firestore for persistence across cold starts and instances.
const localCache = new Map<string, { count: number; windowStart: number }>();

/**
 * Persistent rate limiter backed by Firestore.
 * Uses an in-memory cache for hot-path speed, and Firestore for cross-instance
 * persistence that survives cold starts and horizontal scaling.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_READ
): Promise<boolean> {
  const now = Date.now();
  // Quantise into fixed-size windows so all instances agree on the key
  const windowStart = now - (now % config.windowMs);
  const docId = `${identifier}:${windowStart}`;

  // Fast path: check in-memory cache first
  const cached = localCache.get(docId);
  if (cached && cached.windowStart === windowStart) {
    if (cached.count >= config.maxRequests) return false;
    cached.count++;
    // Fire-and-forget Firestore sync — don't block the request
    syncToFirestore(docId, windowStart, config.windowMs).catch(() => {});
    return true;
  }

  // Cold-start / new window: read from Firestore
  try {
    const ref = db.collection("_rateLimits").doc(docId);
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const currentCount = snap.exists ? (snap.data()!.count as number) : 0;

      if (currentCount >= config.maxRequests) return false;

      tx.set(
        ref,
        {
          count: admin.firestore.FieldValue.increment(1),
          windowStart,
          expiresAt: new Date(windowStart + config.windowMs),
        },
        { merge: true }
      );
      return true;
    });

    // Update local cache
    const newCount = (cached?.count || 0) + 1;
    localCache.set(docId, { count: newCount, windowStart });

    return result;
  } catch {
    // On Firestore failure, fall back to in-memory-only (best-effort)
    if (!cached) {
      localCache.set(docId, { count: 1, windowStart });
      return true;
    }
    if (cached.count >= config.maxRequests) return false;
    cached.count++;
    return true;
  }
}

/** Background sync — increments Firestore count without blocking the caller. */
async function syncToFirestore(docId: string, windowStart: number, windowMs: number): Promise<void> {
  const ref = db.collection("_rateLimits").doc(docId);
  await ref.set(
    {
      count: admin.firestore.FieldValue.increment(1),
      windowStart,
      expiresAt: new Date(windowStart + windowMs),
    },
    { merge: true }
  );
}
