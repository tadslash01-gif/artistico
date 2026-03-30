"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, firestore, storage } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userData, loading: authLoading } = useAuth();

  // Basic profile
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);

  // Creator profile
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [specialties, setSpecialties] = useState("");

  const [savingBasic, setSavingBasic] = useState(false);
  const [savingCreator, setSavingCreator] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form from user data once loaded
  if (user && userData && !initialized) {
    setDisplayName(userData.displayName || "");
    setPhotoURL(userData.photoURL || null);
    setInitialized(true);
  }

  // Load creator profile data
  if (userData?.isCreator && !bio && !initialized) {
    // Creator data will be fetched from the extended userData
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB");
      return;
    }

    setUploadingPhoto(true);
    setPhotoProgress(0);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const storageRef = ref(
        storage,
        `users/${user.uid}/avatar/${Date.now()}.${ext}`
      );
      const task = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            setPhotoProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            setPhotoURL(url);
            resolve();
          }
        );
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      setPhotoProgress(0);
    }
  };

  const handleSaveBasic = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !auth?.currentUser || !firestore) return;

    setSavingBasic(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || undefined,
      });

      await updateDoc(doc(firestore, "users", user.uid), {
        displayName,
        photoURL: photoURL || null,
      });

      setSuccess("Profile updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveCreator = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingCreator(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/users/creator-profile", {
        method: "POST",
        body: JSON.stringify({
          bio,
          location,
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setSuccess("Creator profile updated!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update creator profile");
    } finally {
      setSavingCreator(false);
    }
  };

  if (authLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account details and public profile.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Basic Profile */}
      <form onSubmit={handleSaveBasic} className="mt-8 max-w-lg space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Basic Info</h2>

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Profile Photo
          </label>
          <div className="mt-2 flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {(userData?.displayName || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {uploadingPhoto ? `Uploading ${photoProgress}%...` : "Change Photo"}
            </label>
            {photoURL && (
              <button
                type="button"
                onClick={() => setPhotoURL(null)}
                className="text-sm text-destructive hover:text-destructive/80"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Email
          </label>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>

        <button
          type="submit"
          disabled={savingBasic}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {savingBasic ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Creator Profile */}
      {userData?.isCreator && (
        <form onSubmit={handleSaveCreator} className="mt-10 max-w-lg border-t border-border pt-8 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Creator Profile</h2>
          <p className="text-sm text-muted-foreground">
            This information is shown on your public creator page.
          </p>

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
            disabled={savingCreator}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingCreator ? "Saving..." : "Save Creator Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
