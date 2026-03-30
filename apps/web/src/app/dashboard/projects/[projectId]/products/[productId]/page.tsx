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

interface ProductData {
  productId: string;
  projectId: string;
  creatorId: string;
  title: string;
  description: string;
  type: string;
  price: number;
  images: string[];
  digitalFileUrl: string | null;
  inventory: number | null;
  shippingRequired: boolean;
  status: string;
  salesCount: number;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ projectId: string; productId: string }>;
}) {
  const { projectId, productId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [product, setProduct] = useState<ProductData | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("physical");
  const [price, setPrice] = useState("");
  const [inventory, setInventory] = useState("");
  const [shippingRequired, setShippingRequired] = useState(true);
  const [status, setStatus] = useState<string>("active");

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Digital file
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      if (!firestore || !user) return;
      try {
        const productSnap = await getDoc(doc(firestore, "products", productId));
        if (!productSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = productSnap.data() as ProductData;
        if (data.creatorId !== user.uid || data.projectId !== projectId) {
          router.push("/dashboard/projects");
          return;
        }

        setProduct(data);
        setTitle(data.title);
        setDescription(data.description);
        setType(data.type);
        setPrice((data.price / 100).toFixed(2));
        setInventory(data.inventory !== null ? String(data.inventory) : "");
        setShippingRequired(data.shippingRequired);
        setStatus(data.status);
        setImages(data.images || []);
        setDigitalFileUrl(data.digitalFileUrl || "");
      } catch {
        router.push("/dashboard/projects");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [user, productId, projectId, router]);

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

        const ext = file.name.split(".").pop();
        const storageRef = ref(
          storage,
          `projects/${projectId}/products/temp/images/${Date.now()}-${i}.${ext}`
        );
        const task = uploadBytesResumable(storageRef, file);

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
        `products/${productId}/digital-file/${Date.now()}.${ext}`
      );
      const task = uploadBytesResumable(storageRef, file);

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
    setSuccess("");
    try {
      const body: Record<string, unknown> = {
        title,
        description,
        price: priceInCents,
        images,
        shippingRequired,
        status,
      };

      if (type === "digital" || type === "template") {
        body.digitalFileUrl = digitalFileUrl || null;
        body.inventory = null;
      } else {
        body.inventory = inventory ? parseInt(inventory, 10) : null;
      }

      await apiFetch(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setSuccess("Product updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to deactivate this product? It will no longer be visible to buyers.")) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setDeleting(false);
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

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="mt-4 inline-block text-sm text-primary hover:text-primary/80"
        >
          Back to Project
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.salesCount} sold
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Deactivating..." : "Deactivate Product"}
        </button>
      </div>

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

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        {/* Product Type (read-only after creation) */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Product Type
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PRODUCT_TYPES.map((pt) => (
              <div
                key={pt.value}
                className={`rounded-lg border p-3 text-left text-sm ${
                  type === pt.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/50 opacity-50"
                }`}
              >
                <span className="font-medium text-foreground">{pt.label}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pt.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Product type cannot be changed after creation.
          </p>
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Status
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setStatus("active")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === "active"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatus("inactive")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                status === "inactive"
                  ? "bg-gray-100 text-gray-700 border border-gray-300"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Inactive
            </button>
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
        {type === "physical" && (
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
            {saving ? "Saving..." : "Save Changes"}
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
