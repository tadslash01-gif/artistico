"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import FeaturedBadge from "@/components/FeaturedBadge";

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  followersCount?: number;
  isFeatured?: boolean;
  creatorProfile?: {
    bio: string;
    specialties: string[];
  };
}

export default function FeaturedCreators() {
  const [creators, setCreators] = useState<CreatorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      if (!firestore) return;
      try {
        // Try featured creators first, fall back to most followed
        let results: CreatorData[] = [];

        const featuredQuery = query(
          collection(firestore, "users"),
          where("isCreator", "==", true),
          where("isFeatured", "==", true),
          limit(8)
        );
        const featuredSnap = await getDocs(featuredQuery);
        results = featuredSnap.docs.map((doc) => doc.data() as CreatorData);

        // If not enough featured, fill with most-followed
        if (results.length < 4) {
          const topQuery = query(
            collection(firestore, "users"),
            where("isCreator", "==", true),
            orderBy("followersCount", "desc"),
            limit(8)
          );
          const topSnap = await getDocs(topQuery);
          const topCreators = topSnap.docs.map((doc) => doc.data() as CreatorData);

          // Merge, avoiding duplicates
          const existingUids = new Set(results.map((c) => c.uid));
          for (const c of topCreators) {
            if (!existingUids.has(c.uid) && results.length < 8) {
              results.push(c);
            }
          }
        }

        setCreators(results);
      } catch (err) {
        console.error("Failed to fetch featured creators:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 w-44 shrink-0 animate-pulse rounded-2xl bg-muted sm:w-48"
          />
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {creators.map((creator) => (
        <Link
          key={creator.uid}
          href={`/creators/${creator.uid}`}
          className="group flex w-44 shrink-0 snap-start flex-col items-center gap-3 rounded-2xl border border-border bg-white p-5 transition-all hover:shadow-lg hover:scale-[1.02] sm:w-48"
        >
          {creator.photoURL ? (
            <Image
              src={creator.photoURL}
              alt={creator.displayName}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(creator.displayName || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors">
            {creator.displayName}
          </span>
          {creator.isFeatured && <FeaturedBadge />}
          {creator.creatorProfile?.specialties?.[0] && (
            <span className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">
              {creator.creatorProfile.specialties[0]}
            </span>
          )}
          {(creator.followersCount ?? 0) > 0 && (
            <span className="text-xs text-muted-foreground">
              {creator.followersCount} followers
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
