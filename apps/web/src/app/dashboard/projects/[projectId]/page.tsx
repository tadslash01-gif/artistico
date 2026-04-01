"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firestore, storage } from "@/lib/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

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

interface ProjectData {
  projectId: string;
  creatorId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  materialsUsed: string[];
  tags: string[];
  category: string;
  status: string;
  productCount: number;
}

interface ProductData {
  productId: string;
  title: string;
  type: string;
  price: number;
  status: string;
  salesCount: number;
}

export default function ProjectEditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Image upload
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function fetchProject() {
      if (!firestore || !user) return;
      try {
        const projSnap = await getDoc(doc(firestore, "projects", projectId));
        if (!projSnap.exists()) {
          setLoading(false);
          return;
        }

        const proj = projSnap.data() as ProjectData;
        if (proj.creatorId !== user.uid) {
          router.push("/dashboard/projects");
          return;
        }

        setProject(proj);
        setTitle(proj.title);
        setDescription(proj.description);
        setCategory(proj.category);
        setTags(proj.tags.join(", "));
        setMaterialsUsed(proj.materialsUsed.join(", "));
        setImages(proj.images || []);

        // Fetch products
        const productsSnap = await getDocs(
          query(
            collection(firestore, "products"),
            where("projectId", "==", projectId)
          )
        );
        setProducts(productsSnap.docs.map((d) => d.data() as ProductData));
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [user, projectId, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage || !user) return;

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
          `projects/${projectId}/images/${Date.now()}-${i}.${ext}`
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
      setError("");
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          materialsUsed: materialsUsed
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          images,
        }),
      });
      setSuccess("Project saved successfully! Your changes are live.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !project) return;
    setSaving(true);
    setError("");
    try {
      const newStatus =
        project.status === "published" ? "draft" : "published";
      await apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setProject({ ...project, status: newStatus });
      setSuccess(
        newStatus === "published"
          ? "🎉 Your project is live! Share it with the world."
          : "Project unpublished."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
        <div className="h-40 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Project Not Found
        </h1>
        <Link
          href="/dashboard/projects"
          className="mt-4 inline-block text-sm text-primary hover:text-primary/80"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              project.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {project.status}
          </span>
        </div>
        <button
          onClick={handlePublish}
          disabled={saving}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            project.status === "published"
              ? "border border-border text-foreground hover:bg-muted"
              : "bg-green-600 text-white hover:bg-green-700"
          } disabled:opacity-50`}
        >
          {project.status === "published" ? "Unpublish" : "Publish"}
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

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Images
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
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Max 10MB per image. JPEG, PNG, WebP.
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a category</option>
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
          <label htmlFor="tags" className="block text-sm font-medium text-foreground">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="handmade, beginner-friendly (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="materials" className="block text-sm font-medium text-foreground">
            Materials Used
          </label>
          <input
            id="materials"
            type="text"
            value={materialsUsed}
            onChange={(e) => setMaterialsUsed(e.target.value)}
            placeholder="oak wood, epoxy resin (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/dashboard/projects"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Back
          </Link>
        </div>
      </form>

      {/* Products Section */}
      <div className="mt-10 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Products ({products.length})
          </h2>
          <Link
            href={`/dashboard/projects/${projectId}/products/new`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No products yet.</p>
            <Link
              href={`/dashboard/projects/${projectId}/products/new`}
              className="mt-2 inline-block text-sm text-primary hover:text-primary/80"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {products.map((product) => (
              <div
                key={product.productId}
                className="flex items-center justify-between rounded-lg border border-border bg-white p-4"
              >
                <div>
                  <h3 className="font-medium text-foreground">
                    {product.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {product.type} · ${(product.price / 100).toFixed(2)} ·{" "}
                    {product.salesCount} sold
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/projects/${projectId}/products/${product.productId}`}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Edit
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
