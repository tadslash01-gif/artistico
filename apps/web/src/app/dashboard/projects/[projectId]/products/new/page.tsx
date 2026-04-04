"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { doc, getDoc } from "firebase/firestore";
import { firestore, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const PRODUCT_TYPES = [
  { value: "physical", label: "Physical Item", desc: "A tangible product shipped to the buyer" },
  { value: "digital", label: "Digital Download", desc: "Files delivered electronically" },
  { value: "template", label: "Template", desc: "A reusable template or pattern" },
  { value: "commission", label: "Commission", desc: "Custom work made to order" },
];

export default function NewProductPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verify project ownership
  const [authorized, setAuthorized] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("physical");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [shippingRequired, setShippingRequired] = useState(true);
  const [licenseType, setLicenseType] = useState<string>("personal");

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Digital file
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);

  useEffect(() => {
    async function checkProject() {
      if (!firestore || !user) return;
      try {
        const projSnap = await getDoc(doc(firestore, "projects", projectId));
        if (!projSnap.exists() || projSnap.data().creatorId !== user.uid) {
          router.push("/dashboard/projects");
          return;
        }
        setAuthorized(true);
      } catch {
        router.push("/dashboard/projects");
      } finally {
        setLoading(false);
      }
    }

    checkProject();
  }, [user, projectId, router]);

  // Update shipping based on type
  useEffect(() => {
    if (type === "digital" || type === "template") {
      setShippingRequired(false);
    } else if (type === "physical") {
      setShippingRequired(true);
    }
  }, [type]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage) return;

    setUploading(true);
    setUploadProgress(0);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds 10MB limit`);
          continue;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setError(`"${file.name}" must be a JPEG, PNG, or WebP image`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const storageRef = ref(
          storage,
          `projects/${projectId}/products/temp/images/${Date.now()}-${i}.${ext}`
        );
        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: { creatorId: user!.uid },
        });

        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              setUploadProgress(
                Math.round(
                  ((i + snap.bytesTransferred / snap.totalBytes) /
                    files.length) *
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
      setImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDigitalFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    if (file.size > 100 * 1024 * 1024) {
      setError("File exceeds 100MB limit");
      return;
    }

    setUploadingFile(true);
    setFileProgress(0);

    try {
      const ext = file.name.split(".").pop();
      const storageRef = ref(
        storage,
        `projects/${projectId}/products/temp/downloads/${Date.now()}.${ext}`
      );
      const task = uploadBytesResumable(storageRef, file, {
        customMetadata: { creatorId: user!.uid },
      });

      await new Promise<void>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => {
            setFileProgress(
              Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            );
          },
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            setDigitalFileUrl(url);
            resolve();
          }
        );
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploadingFile(false);
      setFileProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents) || priceInCents < 50) {
      setError("Price must be at least $0.50");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        projectId,
        title,
        description,
        type,
        licenseType,
        price: priceInCents,
        images,
        shippingRequired,
      };

      if (type === "digital" || type === "template") {
        body.digitalFileUrl = digitalFileUrl || null;
        body.inventory = null;
      } else {
        body.inventory = inventory ? parseInt(inventory, 10) : null;
      }

      await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
      <p className="mt-2 text-muted-foreground">
        List something for sale in this project.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Product Type
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setType(pt.value)}
                className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                  type === pt.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white hover:border-primary/30"
                }`}
              >
                <span className="font-medium text-foreground">{pt.label}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Product Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this product..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground">
            Price (USD)
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0.50"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="block w-full rounded-lg border border-border bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            You keep 95%. Platform fee is 5%.
          </p>
        </div>

        {/* License Type */}
        <div>
          <label htmlFor="licenseType" className="block text-sm font-medium text-foreground">
            License Type
          </label>
          <select
            id="licenseType"
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="personal">Personal Use</option>
            <option value="commercial">Commercial Use</option>
            <option value="extended-commercial">Extended Commercial</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Defines how buyers can use the product.
          </p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Product Images
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="group relative">
                <img
                  src={img}
                  alt=""
                  className="h-20 w-20 rounded-lg object-cover border border-border"
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
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading ? `${uploadProgress}%` : "+"}
            </label>
          </div>
        </div>

        {/* Conditional fields by type */}
        {(type === "physical") && (
          <div>
            <label htmlFor="inventory" className="block text-sm font-medium text-foreground">
              Inventory Count
            </label>
            <input
              id="inventory"
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {(type === "digital" || type === "template") && (
          <div>
            <label className="block text-sm font-medium text-foreground">
              Digital File
            </label>
            {digitalFileUrl ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-green-700">✓ File uploaded</span>
                <button
                  type="button"
                  onClick={() => setDigitalFileUrl("")}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleDigitalFileUpload}
                  className="hidden"
                />
                {uploadingFile
                  ? `Uploading ${fileProgress}%...`
                  : "Click to upload file (max 100MB)"}
              </label>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
