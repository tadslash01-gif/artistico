"use client";

import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface ImageUploadProps {
  storagePath: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({
  storagePath,
  value,
  onChange,
  maxFiles = 20,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !storage) return;

      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxFiles} images allowed`);
        return;
      }

      const toUpload = Array.from(files).slice(0, remaining);
      setUploading(true);
      setProgress(0);
      setError("");
      const newUrls: string[] = [];

      try {
        for (let i = 0; i < toUpload.length; i++) {
          const file = toUpload[i];

          if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`"${file.name}" exceeds ${maxSizeMB}MB limit`);
            continue;
          }

          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type)
          ) {
            setError(`"${file.name}" is not a supported image type`);
            continue;
          }

          const ext = file.name.split(".").pop();
          const storageRef = ref(
            storage,
            `${storagePath}/${Date.now()}-${i}.${ext}`
          );
          const task = uploadBytesResumable(storageRef, file);

          await new Promise<void>((resolve, reject) => {
            task.on(
              "state_changed",
              (snap) => {
                setProgress(
                  Math.round(
                    ((i + snap.bytesTransferred / snap.totalBytes) /
                      toUpload.length) *
                      100
                  )
                );
              },
              reject,
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                newUrls.push(url);
                resolve();
              }
            );
          });
        }

        onChange([...value, ...newUrls]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setProgress(0);
        // Reset the input so the same file can be re-selected
        e.target.value = "";
      }
    },
    [storagePath, value, onChange, maxFiles, maxSizeMB]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dt = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
      const input = document.createElement("input");
      input.type = "file";
      input.files = dt.files;
      handleUpload({
        target: input,
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    },
    [handleUpload]
  );

  return (
    <div>
      <div
        className="flex flex-wrap gap-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value.map((img, i) => (
          <div key={i} className="group relative">
            <img
              src={img}
              alt=""
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs group-hover:flex"
            >
              ×
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            {uploading ? (
              <span className="text-xs font-medium">{progress}%</span>
            ) : (
              <>
                <span className="text-lg">+</span>
                <span className="text-[10px]">Upload</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Max {maxSizeMB}MB per image. JPEG, PNG, WebP.{" "}
        {value.length}/{maxFiles} uploaded.
      </p>
    </div>
  );
}
