"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";

interface CreatorSummary {
  uid: string;
  displayName: string;
  photoURL: string | null;
  isCreator: boolean;
  followersCount: number;
  totalSales: number;
  isVerified: boolean;
  creatorProfile: {
    bio?: string;
    location?: string;
    specialties?: string[];
  } | null;
}

const PAGE_SIZE = 24;

export default function CreatorsPage() {
  const [creators, setCreators] = useState<CreatorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  async function fetchCreators(append = false) {
    if (!firestore) return;
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      let q = query(
        collection(firestore, "users"),
        where("isCreator", "==", true),
        orderBy("followersCount", "desc"),
        limit(PAGE_SIZE)
      );

      if (append && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newCreators = snapshot.docs.map((d) => d.data() as CreatorSummary);

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      if (append) {
        setCreators((prev) => [...prev, ...newCreators]);
      } else {
        setCreators(newCreators);
      }
    } catch (err) {
      console.error("Failed to fetch creators:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchCreators(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Creators</h1>
        <p className="mt-3 text-muted-foreground">
          Discover the makers and artists behind Artistico
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-muted h-52" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="py-20 text-center">
          <span className="text-5xl" aria-hidden="true">🎨</span>
          <p className="mt-4 text-lg font-medium text-foreground">No creators yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first!{" "}
            <Link href="/become-creator" className="text-primary hover:text-primary/80 font-medium">
              Start selling today →
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.map((creator) => (
              <CreatorCard key={creator.uid} creator={creator} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => fetchCreators(true)}
                disabled={loadingMore}
                className="rounded-xl border border-border bg-white px-8 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Creators"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CreatorCard({ creator }: { creator: CreatorSummary }) {
  const specialties = creator.creatorProfile?.specialties ?? [];
  const location = creator.creatorProfile?.location;

  return (
    <Link
      href={`/creators/${creator.uid}`}
      className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {creator.photoURL ? (
          <Image
            src={creator.photoURL}
            alt={creator.displayName}
            width={52}
            height={52}
            className="h-13 w-13 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {(creator.displayName || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
            {creator.displayName}
          </p>
          {location && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">📍 {location}</p>
          )}
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {specialties.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-accent/30 px-2.5 py-0.5 text-xs text-foreground"
            >
              {s}
            </span>
          ))}
          {specialties.length > 3 && (
            <span className="rounded-full border border-border bg-accent/30 px-2.5 py-0.5 text-xs text-muted-foreground">
              +{specialties.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{creator.followersCount || 0}</strong> followers
        </span>
        {(creator.totalSales || 0) > 0 && (
          <span>
            <strong className="text-foreground">{creator.totalSales}</strong> sales
          </span>
        )}
        {creator.isVerified && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
            Verified
          </span>
        )}
      </div>
    </Link>
  );
}
