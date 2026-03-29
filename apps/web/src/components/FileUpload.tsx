"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface FileUploadProps {
  storagePath: string;
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  storagePath,
  value,
  onChange,
  maxSizeMB = 100,
  label = "Digital File",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const storageRef = ref(
        storage,
        `${storagePath}/${Date.now()}.${ext}`
      );
      const task = uploadBytesResumable(storageRef, file);

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
            setFileName(file.name);
            resolve();
          }
        );
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  };

  if (value) {
    return (
      <div>
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="mt-1 flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
          <span className="text-sm text-green-700">✓ {fileName || "File uploaded"}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFileName("");
            }}
            className="text-xs text-destructive hover:text-destructive/80"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <label className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-8 text-center hover:border-primary/50 transition-colors">
        <input type="file" onChange={handleUpload} className="hidden" />
        {uploading ? (
          <>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="mt-2 text-xs text-muted-foreground">
              Uploading {progress}%...
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl">📎</span>
            <span className="mt-1 text-sm text-muted-foreground">
              Click to upload (max {maxSizeMB}MB)
            </span>
          </>
        )}
      </label>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
