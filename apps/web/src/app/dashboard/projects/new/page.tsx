"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "@/lib/firebase";

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

export default function NewProjectPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [creatorStory, setCreatorStory] = useState("");

  // Structured materials list
  const [materials, setMaterials] = useState<
    { name: string; quantity: string; unit: string; estimatedPrice: string; url: string; notes: string }[]
  >([]);

  const addMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      { name: "", quantity: "1", unit: "pcs", estimatedPrice: "", url: "", notes: "" },
    ]);
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };
  const [useCase, setUseCase] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [timeToBuild, setTimeToBuild] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Images (up to 5)
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !storage || !user) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      setError("Maximum 5 images allowed");
      return;
    }

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
          `projects/temp-${user.uid}/images/${Date.now()}-${i}.${ext}`
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
    if (!user || !firestore) return;

    setError("");
    setLoading(true);
    try {
      const projectRef = doc(collection(firestore, "projects"));
      const slug =
        title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-") +
        "-" +
        Date.now().toString(36);

      await setDoc(projectRef, {
        projectId: projectRef.id,
        creatorId: user.uid,
        creatorName: userData?.displayName || user.displayName || "",
        creatorAvatar: userData?.photoURL ?? user.photoURL ?? null,
        title,
        slug,
        description,
        images,
        materialsUsed: materialsUsed
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        materials: materials
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            quantity: parseFloat(m.quantity) || 0,
            unit: m.unit.trim() || "pcs",
            estimatedPrice: m.estimatedPrice ? Math.round(parseFloat(m.estimatedPrice) * 100) : null,
            url: m.url.trim() || null,
            notes: m.notes.trim() || null,
          })),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category,
        creatorStory: creatorStory || null,
        useCase: useCase || null,
        difficulty: difficulty || null,
        timeToBuild: timeToBuild || null,
        savesCount: 0,
        trendingScore: 0,
        status: "published",
        productCount: 0,
        averageRating: 0,
        reviewCount: 0,
        viewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/dashboard/projects/${projectRef.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
      <p className="mt-2 text-muted-foreground">
        Share a project you&apos;ve been working on. You can add products to it after
        creating.
      </p>

      {!userData?.isCreator && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          You need a creator account to create projects.{" "}
          <a href="/become-creator" className="font-semibold underline hover:no-underline">
            Become a creator →
          </a>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Project Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What did you make?"
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
            placeholder="Describe your project, your process, what inspired you..."
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
            placeholder="handmade, beginner-friendly, custom (comma separated)"
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
            placeholder="oak wood, epoxy resin, brass hardware (comma separated)"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Structured Materials List */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Detailed Materials List{" "}
            <span className="text-muted-foreground font-normal">(optional — helps buyers plan)</span>
          </label>
          <div className="mt-2 space-y-3">
            {materials.map((mat, i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Material {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={mat.name}
                    onChange={(e) => updateMaterial(i, "name", e.target.value)}
                    className="col-span-3 rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="any"
                    value={mat.quantity}
                    onChange={(e) => updateMaterial(i, "quantity", e.target.value)}
                    className="rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    title="Unit of measurement"
                    value={mat.unit}
                    onChange={(e) => updateMaterial(i, "unit", e.target.value)}
                    className="rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="pcs">pcs</option>
                    <option value="ft">ft</option>
                    <option value="in">in</option>
                    <option value="m">m</option>
                    <option value="cm">cm</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="rolls">rolls</option>
                    <option value="sheets">sheets</option>
                    <option value="other">other</option>
                  </select>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      value={mat.estimatedPrice}
                      onChange={(e) => updateMaterial(i, "estimatedPrice", e.target.value)}
                      className="w-full rounded border border-border bg-white pl-5 pr-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="Link to purchase (optional)"
                  value={mat.url}
                  onChange={(e) => updateMaterial(i, "url", e.target.value)}
                  className="w-full rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={mat.notes}
                  onChange={(e) => updateMaterial(i, "notes", e.target.value)}
                  className="w-full rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addMaterial}
              className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              + Add Material
            </button>
          </div>
        </div>

        {/* Storytelling Fields */}
        <div>
          <label htmlFor="creatorStory" className="block text-sm font-medium text-foreground">
            Your Story <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="creatorStory"
            rows={3}
            value={creatorStory}
            onChange={(e) => setCreatorStory(e.target.value)}
            placeholder="What inspired you to create this? What's the story behind it?"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="useCase" className="block text-sm font-medium text-foreground">
            Use Case <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="useCase"
            type="text"
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Home decor, gift, personal use, etc."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-foreground">
              Difficulty <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Not specified</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label htmlFor="timeToBuild" className="block text-sm font-medium text-foreground">
              Time to Build <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="timeToBuild"
              type="text"
              value={timeToBuild}
              onChange={(e) => setTimeToBuild(e.target.value)}
              placeholder="e.g. 3 hours, 2 weekends"
              className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Images (up to 5) */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Project Images (up to 5)
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
          <p className="mt-1 text-xs text-muted-foreground">
            Max 10MB per image. JPEG, PNG, WebP. {images.length}/5 uploaded.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !userData?.isCreator}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create Project"}
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
