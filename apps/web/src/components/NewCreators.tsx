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

interface CreatorData {
  uid: string;
  displayName: string;
  photoURL: string | null;
  creatorProfile?: {
    bio: string;
    specialties: string[];
  };
}

export default function NewCreators() {
  const [creators, setCreators] = useState<CreatorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNewCreators() {
      if (!firestore) return;
      try {
        const q = query(
          collection(firestore, "users"),
          where("isCreator", "==", true),
          orderBy("createdAt", "desc"),
          limit(6)
        );
        const snapshot = await getDocs(q);
        setCreators(snapshot.docs.map((doc) => doc.data() as CreatorData));
      } catch (err) {
        console.error("Failed to fetch new creators:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNewCreators();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 w-40 shrink-0 animate-pulse rounded-xl border border-border bg-muted sm:w-auto"
          />
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
      {creators.map((creator) => (
        <Link
          key={creator.uid}
          href={`/creators/${creator.uid}`}
          className="group flex w-40 shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-white p-5 transition-all hover:shadow-lg hover:scale-[1.02] sm:w-auto"
        >
          {creator.photoURL ? (
            <Image
              src={creator.photoURL}
              alt={creator.displayName}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {(creator.displayName || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-foreground text-center line-clamp-1 group-hover:text-primary transition-colors">
            {creator.displayName}
          </span>
          {creator.creatorProfile?.specialties?.[0] && (
            <span className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-muted-foreground">
              {creator.creatorProfile.specialties[0]}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
