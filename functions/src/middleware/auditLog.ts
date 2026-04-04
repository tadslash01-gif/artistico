import { db } from "../admin";
import * as admin from "firebase-admin";

/**
 * Audit log categories for sensitive operations.
 * Logs are stored in the `_auditLogs` Firestore collection.
 */
export type AuditAction =
  | "account.delete"
  | "creator.promote"
  | "order.create"
  | "dispute.opened"
  | "stripe.account.create"
  | "download.access"
  | "stripe.onboarding"
  | "webhook.received";

interface AuditEntry {
  action: AuditAction;
  uid: string | null;
  targetResource?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Records an audit log entry in Firestore. Fire-and-forget — failures
 * are logged to console but never block the calling operation.
 */
export function auditLog(entry: AuditEntry): void {
  const ref = db.collection("_auditLogs").doc();
  ref
    .set({
      ...entry,
      logId: ref.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .catch((err) => {
      console.error("Audit log write failed:", err.message);
    });
}
