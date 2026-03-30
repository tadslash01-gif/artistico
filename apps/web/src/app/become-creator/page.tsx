"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export default function BecomeCreatorPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (userData?.isCreator) {
    router.push("/dashboard");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!firestore || !user) throw new Error("Not authenticated");
      await updateDoc(doc(firestore, "users", user.uid), {
        isCreator: true,
        creatorProfile: {
          bio,
          location,
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          socialLinks: [],
          stripeAccountId: "",
          stripeOnboardingComplete: false,
        },
        updatedAt: serverTimestamp(),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">Become a Creator</h1>
      <p className="mt-2 text-muted-foreground">
        Set up your creator profile to start sharing projects and selling your work.
        You keep 95% of every sale.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            About You
          </label>
          <textarea
            id="bio"
            required
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell buyers about yourself and what you create..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, State or Country"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="specialties" className="block text-sm font-medium text-foreground">
            Specialties
          </label>
          <input
            id="specialties"
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="woodworking, digital art, ceramics (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">Separate with commas</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Setting up..." : "Create Creator Profile"}
        </button>
      </form>
    </div>
  );
}
