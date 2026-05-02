# Content Quality Telemetry Spec

Last updated: 2026-05-01

## Purpose

Track creator/project/product content quality evaluations so SEO/indexability and AdSense readiness can be measured over time.

## Event collection

- Firestore collection: `contentQualityEvents`
- Write source (current): `functions/src/api.ts`

## Event schema

Each event document includes:

- `eventId: string`
- `entityType: "creator_profile" | "project" | "product"`
- `entityId: string`
- `status: "thin" | "partial" | "complete"`
- `passed: boolean`
- `failedChecks: string[]`
- `source: "api" | "web" | "batch"`
- `evaluatedAt: Timestamp`

## Emission points (implemented)

- `POST /projects`
- `PUT /projects/:projectId`
- `POST /products`
- `PUT /products/:productId`
- `POST /users/creator-profile`

## Dashboard fields (minimum)

- Thin URL ratio by entity type (weekly)
- Pass rate by entity type (weekly)
- Top failed checks by frequency
- Quality trend over time (`thin -> partial -> complete` migrations)
- Indexable candidate count (quality-passed entities)

## Suggested KPI queries

1. `% thin` by entity type over trailing 7 days
2. Number of unique entities passing all checks in trailing 7 days
3. Most frequent failed check per entity type
4. Time-to-complete from first event for creator profiles

## Notes

- Current write path is non-blocking: telemetry failures do not fail user-facing requests.
- This spec should be kept aligned with shared thresholds in `shared/src/types.ts` and evaluator logic in `shared/src/validators.ts`.
