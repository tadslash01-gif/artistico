"use client";

import { useRef, useState } from "react";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_EXTENSIONS = ".mp4,.webm,.mov";

interface VideoUploadProps {
  storagePath: string;
  value: string | null;
  onChange: (url: string | null) => void;
  maxSizeMB?: number;
  label?: string;
  customMetadata?: Record<string, string>;
}

export default function VideoUpload({
  storagePath,
  value,
  onChange,
  maxSizeMB = 200,
  label = "Project Video",
  customMetadata,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const taskRef = useRef<ReturnType<typeof uploadBytesResumable> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startUpload = async (file: File) => {
    if (!storage) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only MP4, WebM, and MOV files are supported.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Video exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const storageRef = ref(storage, `${storagePath}/${Date.now()}.${ext}`);
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        ...(customMetadata ? { customMetadata } : {}),
      });
      taskRef.current = task;

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            setProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            onChange(url);
            resolve();
          }
        );
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "storage/canceled") {
        setError("");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    } finally {
      setUploading(false);
      setProgress(0);
      taskRef.current = null;
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  };

  const handleCancel = () => {
    taskRef.current?.cancel();
    setUploading(false);
    setProgress(0);
  };

  const handleRemove = async () => {
    if (!value || !storage) {
      onChange(null);
      return;
    }
    try {
      // Attempt to delete from Storage (best-effort; Cloud Function will handle orphan cleanup)
      const storageRef = ref(storage, value);
      await deleteObject(storageRef).catch(() => {});
    } finally {
      onChange(null);
    }
  };

  // ── Uploaded state ──────────────────────────────────────
  if (value) {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="mt-1 overflow-hidden rounded-xl border border-border bg-white">
          <video
            src={value}
            controls
            preload="metadata"
            className="w-full rounded-t-xl bg-black max-h-80"
          />
          <div className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-green-700">✓ Video uploaded</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-primary hover:text-primary/80"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-destructive hover:text-destructive/80"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          onChange={handleFileInput}
          className="hidden"
          aria-label="Replace video file"
        />
      </div>
    );
  }

  // ── Upload zone ─────────────────────────────────────────
  return (
    <div>
      <label className="block text-sm font-medium text-foreground">
        {label}{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </label>
      <div
        className={`mt-1 rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mt-3 text-sm text-muted-foreground">
              Uploading {progress}%…
            </span>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-2 text-xs text-destructive hover:text-destructive/80"
            >
              Cancel
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center px-4 py-10 text-center">
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_EXTENSIONS}
              onChange={handleFileInput}
              className="hidden"
              aria-label="Replace video file"
            />
            <span className="text-3xl">🎬</span>
            <span className="mt-2 text-sm font-medium text-foreground">
              Drag & drop or click to upload
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              MP4, WebM, or MOV · max {maxSizeMB}MB
            </span>
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
