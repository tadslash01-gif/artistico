/**
 * Server-side Firestore REST API utilities.
 * Used for SSR/SSG data fetching in Next.js server components.
 * Pattern adapted from sitemap.ts — uses the public Firestore REST API
 * to avoid client-side Firebase SDK initialization issues on the server.
 */

const PROJECT_ID = "artistico-78f75";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ---------------------------------------------------------------------------
// Low-level Firestore REST helpers
// ---------------------------------------------------------------------------

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
  createTime: string;
  updateTime: string;
}

interface RunQueryResult {
  document?: FirestoreDocument;
  readTime?: string;
}

function extractValue(val: FirestoreValue): unknown {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(extractValue);
  }
  if (val.mapValue?.fields) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      obj[k] = extractValue(v);
    }
    return obj;
  }
  return null;
}

function documentToObject<T>(doc: FirestoreDocument): T {
  const obj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    obj[key] = extractValue(val);
  }
  return obj as T;
}

// ---------------------------------------------------------------------------
// Query helper
// ---------------------------------------------------------------------------

interface FieldFilter {
  field: string;
  op: "EQUAL" | "LESS_THAN" | "GREATER_THAN" | "ARRAY_CONTAINS";
  value: FirestoreValue;
}

interface QueryOptions {
  collection: string;
  filters?: FieldFilter[];
  orderBy?: { field: string; direction?: "ASCENDING" | "DESCENDING" };
  limit?: number;
  selectFields?: string[];
}

async function runQuery<T>(options: QueryOptions): Promise<T[]> {
  const url = `${FIRESTORE_BASE}:runQuery`;

  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: options.collection }],
  };

  // Build composite filter or single filter
  if (options.filters && options.filters.length > 0) {
    if (options.filters.length === 1) {
      const f = options.filters[0];
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: f.field },
          op: f.op,
          value: f.value,
        },
      };
    } else {
      structuredQuery.where = {
        compositeFilter: {
          op: "AND",
          filters: options.filters.map((f) => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: f.value,
            },
          })),
        },
      };
    }
  }

  if (options.orderBy) {
    structuredQuery.orderBy = [
      {
        field: { fieldPath: options.orderBy.field },
        direction: options.orderBy.direction || "DESCENDING",
      },
    ];
  }

  if (options.limit) {
    structuredQuery.limit = options.limit;
  }

  if (options.selectFields) {
    structuredQuery.select = {
      fields: options.selectFields.map((f) => ({ fieldPath: f })),
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data: RunQueryResult[] = await res.json();
  return data
    .filter((d) => d.document)
    .map((d) => documentToObject<T>(d.document!));
}

// ---------------------------------------------------------------------------
// Get a single document by path
// ---------------------------------------------------------------------------

async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const url = `${FIRESTORE_BASE}/${collectionName}/${docId}`;
  const res = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const doc: FirestoreDocument = await res.json();
  if (!doc.fields) return null;
  return documentToObject<T>(doc);
}

// ---------------------------------------------------------------------------
// Domain-specific fetchers
// ---------------------------------------------------------------------------

export interface SSRProject {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  materialsUsed: string[];
  tags: string[];
  category: string;
  status: string;
  productCount: number;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  savesCount: number;
  creatorStory: string | null;
  useCase: string | null;
  difficulty: string | null;
  timeToBuild: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Top-level quality status string persisted by the API (Sprint 0). */
  contentQualityStatus?: "thin" | "borderline" | "adequate" | "rich" | null;
}

export interface SSRCreator {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  followersCount: number;
  followingCount: number;
  totalSales: number;
  isVerified: boolean;
  creatorProfile: {
    bio?: string;
    location?: string;
    specialties?: string[];
    socialLinks?: { platform: string; url: string }[];
  } | null;
  /** Quality assessment persisted by the API (Sprint 0). */
  contentQuality?: {
    status: "thin" | "borderline" | "adequate" | "rich";
    score: number;
  } | null;
  updatedAt?: string | null;
}

export interface SSRProduct {
  productId: string;
  projectId: string | null;
  creatorId: string;
  title: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  images: string[];
  category: string | null;
  status: string;
  licenseType: string | null;
  salesCount: number;
  shippingRequired: boolean;
  inventory: number | null;
  videoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** Quality assessment persisted by the API (Sprint 0). */
  contentQuality?: {
    status: "thin" | "borderline" | "adequate" | "rich";
    score: number;
  } | null;
}

/**
 * Fetch a single project by its slug.
 */
export async function getProjectBySlug(slug: string): Promise<SSRProject | null> {
  const results = await runQuery<SSRProject>({
    collection: "projects",
    filters: [
      { field: "slug", op: "EQUAL", value: { stringValue: slug } },
      { field: "status", op: "EQUAL", value: { stringValue: "published" } },
    ],
    limit: 1,
  });
  return results[0] || null;
}

/**
 * Get the creator (user) data for a project.
 */
export async function getCreator(uid: string): Promise<SSRCreator | null> {
  return getDocument<SSRCreator>("users", uid);
}

/**
 * Fetch published projects, newest first.
 */
export async function getPublishedProjects(limitCount = 24): Promise<SSRProject[]> {
  return runQuery<SSRProject>({
    collection: "projects",
    filters: [
      { field: "status", op: "EQUAL", value: { stringValue: "published" } },
    ],
    orderBy: { field: "createdAt", direction: "DESCENDING" },
    limit: limitCount,
  });
}

/**
 * Fetch all creators.
 */
export async function getCreators(limitCount = 24): Promise<SSRCreator[]> {
  return runQuery<SSRCreator>({
    collection: "users",
    filters: [
      { field: "isCreator", op: "EQUAL", value: { booleanValue: true } },
    ],
    orderBy: { field: "followersCount", direction: "DESCENDING" },
    limit: limitCount,
  });
}

/**
 * Fetch related projects by category.
 */
export async function getRelatedProjects(
  category: string,
  excludeId: string,
  limitCount = 6
): Promise<SSRProject[]> {
  const results = await runQuery<SSRProject>({
    collection: "projects",
    filters: [
      { field: "status", op: "EQUAL", value: { stringValue: "published" } },
      { field: "category", op: "EQUAL", value: { stringValue: category } },
    ],
    orderBy: { field: "createdAt", direction: "DESCENDING" },
    limit: limitCount + 1,
  });
  return results.filter((p) => p.projectId !== excludeId).slice(0, limitCount);
}

// ---------------------------------------------------------------------------
// Product fetchers
// ---------------------------------------------------------------------------

/**
 * Fetch a single product by its ID.
 */
export async function getProductById(productId: string): Promise<SSRProduct | null> {
  const product = await getDocument<SSRProduct>("products", productId);
  if (!product) return null;
  // Only surface active products publicly
  if (product.status !== "active" && product.status !== "sold_out") return null;
  return product;
}

/**
 * Fetch products for a specific project (SSR sidebar/related block).
 */
export async function getProductsByProject(projectId: string, limitCount = 6): Promise<SSRProduct[]> {
  return runQuery<SSRProduct>({
    collection: "products",
    filters: [
      { field: "projectId", op: "EQUAL", value: { stringValue: projectId } },
      { field: "status", op: "EQUAL", value: { stringValue: "active" } },
    ],
    limit: limitCount,
  });
}

/**
 * Fetch active products that pass quality gating — used for sitemap inclusion. * Excludes "thin" quality products to satisfy AdSense content requirements.
 */
export async function getQualifiedProductsForSitemap(): Promise<
  Pick<SSRProduct, "productId" | "updatedAt">[]
> {
  // Query all active products; quality filter applied in-process because
  // Firestore REST runQuery does not support nested field filters on map values.
  const res = await fetch(
    `${FIRESTORE_BASE}:runQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "products" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "active" },
            },
          },
          select: {
            fields: [
              { fieldPath: "productId" },
              { fieldPath: "updatedAt" },
              { fieldPath: "contentQuality" },
            ],
          },
        },
      }),
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];

  const data: RunQueryResult[] = await res.json();

  return data
    .filter((d) => d.document)
    .map((d) => documentToObject<SSRProduct>(d.document!))
    .filter((p) => {
      // Include only adequate/rich quality products in sitemap
      const qs = p.contentQuality?.status;
      return qs === "adequate" || qs === "rich";
    })
    .map((p) => ({ productId: p.productId, updatedAt: p.updatedAt }));
}

// ---------------------------------------------------------------------------
// Creator fetchers (Sprint 2)
// ---------------------------------------------------------------------------

/**
 * Fetch published projects by a specific creator — SSR use.
 */
export async function getCreatorProjects(
  creatorId: string,
  limitCount = 24
): Promise<SSRProject[]> {
  return runQuery<SSRProject>({
    collection: "projects",
    filters: [
      { field: "creatorId", op: "EQUAL", value: { stringValue: creatorId } },
      { field: "status", op: "EQUAL", value: { stringValue: "published" } },
    ],
    orderBy: { field: "createdAt", direction: "DESCENDING" },
    limit: limitCount,
  });
}

/**
 * Fetch creator profiles that pass quality gating — used for sitemap inclusion.
 * Excludes thin profiles to satisfy AdSense content requirements.
 */
export async function getQualifiedCreatorsForSitemap(): Promise<
  Pick<SSRCreator, "uid" | "updatedAt">[]
> {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "isCreator" },
            op: "EQUAL",
            value: { booleanValue: true },
          },
        },
        select: {
          fields: [
            { fieldPath: "uid" },
            { fieldPath: "updatedAt" },
            { fieldPath: "contentQuality" },
          ],
        },
      },
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data: RunQueryResult[] = await res.json();

  return data
    .filter((d) => d.document)
    .map((d) => documentToObject<SSRCreator>(d.document!))
    .filter((c) => {
      // Include only adequate/rich quality creator profiles in sitemap
      const qs = c.contentQuality?.status;
      return qs === "adequate" || qs === "rich";
    })
    .map((c) => ({ uid: c.uid, updatedAt: c.updatedAt ?? null }));
}

/**
 * Fetch published projects that pass quality gating — used for sitemap inclusion.
 * Excludes thin/borderline projects to satisfy AdSense content requirements.
 */
export async function getQualifiedProjectsForSitemap(): Promise<
  Pick<SSRProject, "slug" | "updatedAt">[]
> {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "projects" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: "published" },
          },
        },
        select: {
          fields: [
            { fieldPath: "slug" },
            { fieldPath: "updatedAt" },
            { fieldPath: "contentQualityStatus" },
          ],
        },
      },
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data: RunQueryResult[] = await res.json();

  return data
    .filter((d) => d.document)
    .map((d) => documentToObject<SSRProject>(d.document!))
    .filter((p) => {
      // Include only adequate/rich quality projects in sitemap
      const qs = p.contentQualityStatus;
      return qs === "adequate" || qs === "rich";
    })
    .map((p) => ({ slug: p.slug, updatedAt: p.updatedAt ?? null }));
}
