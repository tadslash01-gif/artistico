"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const CATEGORIES = [
  "woodworking",
  "digital-art",
  "crafts",
  "jewelry",
  "ceramics",
  "textiles",
  "paper-crafts",
  "3d-printing",
  "electronics",
  "painting",
  "photography",
  "other",
];

const PRODUCT_TYPES = [
  { value: "physical", label: "Physical Item" },
  { value: "digital", label: "Digital Download" },
  { value: "template", label: "Template / Pattern" },
  { value: "commission", label: "Commission" },
];

interface ProjectOption {
  projectId: string;
  title: string;
}

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("physical");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [shippingRequired, setShippingRequired] = useState(false);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch user's projects for the optional link
  useEffect(() => {
    if (!user) return;
    apiFetch<{ projects: ProjectOption[] }>(`/projects?creatorId=${user.uid}`)
      .then((data) => setProjects(data.projects))
      .catch(() => {});
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage || !user) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadProgress(0);
    setError("");
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
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
          `products/temp-${user.uid}/images/${Date.now()}-${i}.${ext}`
        );
        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: { creatorId: user.uid },
        });

        await new Promise<void>((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              setUploadProgress(
                Math.round(
                  ((i + snap.bytesTransferred / snap.totalBytes) /
                    filesToUpload.length) *
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

    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title,
        description,
        type,
        price: priceInCents,
        images,
        shippingRequired,
      };
      if (projectId) body.projectId = projectId;
      else body.projectId = null;
      if (category) body.category = category;

      const result = await apiFetch<{ productId: string }>("/products", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/dashboard/products/${result.productId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Create New Product</h1>
      <p className="mt-2 text-muted-foreground">
        List a product for sale. You can optionally link it to an existing project.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
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
            placeholder="Describe your product in detail..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-foreground">
              Product Type
            </label>
            <select
              id="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              required
              min="0.50"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground">
            Category <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">No category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-foreground">
            Link to Project <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <select
            id="projectId"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Standalone product (no project)</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {type === "physical" && (
          <div className="flex items-center gap-2">
            <input
              id="shipping"
              type="checkbox"
              checked={shippingRequired}
              onChange={(e) => setShippingRequired(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="shipping" className="text-sm text-foreground">
              Requires shipping
            </label>
          </div>
        )}

        {/* Images (up to 5) */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Product Images (up to 5)
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="group relative">
                <img
                  src={img}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover border border-border"
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
            {images.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploading ? `${uploadProgress}%` : "+"}
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
