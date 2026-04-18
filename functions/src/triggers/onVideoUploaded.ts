import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import ffmpeg from "fluent-ffmpeg";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic = require("ffmpeg-static") as string;

import { db, storage } from "../admin";

ffmpeg.setFfmpegPath(ffmpegStatic);

const MAX_NOTIFY_BATCH = 499;

/**
 * Parses a Storage object path and returns entity info for video uploads.
 * Handles three path shapes:
 *   projects/{projectId}/videos/{fileName}
 *   projects/{projectId}/products/{productId}/videos/{fileName}
 *   products/{productId}/videos/{fileName}
 *
 * Returns null if the path is not a video upload.
 */
function parseVideoPath(
  objectPath: string
): { type: "project"; projectId: string; fileName: string }
  | { type: "linked-product"; projectId: string; productId: string; fileName: string }
  | { type: "standalone-product"; productId: string; fileName: string }
  | null {
  // Pattern: projects/{projectId}/videos/{fileName}
  const projectVideoRe = /^projects\/([^/]+)\/videos\/([^/]+)$/;
  const projectMatch = projectVideoRe.exec(objectPath);
  if (projectMatch) {
    return { type: "project", projectId: projectMatch[1], fileName: projectMatch[2] };
  }

  // Pattern: projects/{projectId}/products/{productId}/videos/{fileName}
  const linkedProductRe = /^projects\/([^/]+)\/products\/([^/]+)\/videos\/([^/]+)$/;
  const linkedMatch = linkedProductRe.exec(objectPath);
  if (linkedMatch) {
    return {
      type: "linked-product",
      projectId: linkedMatch[1],
      productId: linkedMatch[2],
      fileName: linkedMatch[3],
    };
  }

  // Pattern: products/{productId}/videos/{fileName}
  const standaloneProductRe = /^products\/([^/]+)\/videos\/([^/]+)$/;
  const standaloneMatch = standaloneProductRe.exec(objectPath);
  if (standaloneMatch) {
    return { type: "standalone-product", productId: standaloneMatch[1], fileName: standaloneMatch[2] };
  }

  return null;
}

/**
 * Gets the duration (in seconds) and extracts a thumbnail JPEG from a video file.
 * Thumbnail is captured at 2 seconds (or 0 if video is shorter).
 */
function processVideo(
  inputPath: string,
  thumbnailPath: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    let duration = 0;

    ffmpeg(inputPath)
      .on("codecData", (data) => {
        // Parse duration string "HH:MM:SS.ss"
        const parts = data.duration.split(":").map(Number);
        duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      })
      .on("error", reject)
      .on("end", () => resolve(duration))
      .screenshots({
        timestamps: ["00:00:02"],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: "1280x?",
      });
  });
}

export const onVideoUploaded = onObjectFinalized(
  {
    memory: "1GiB",
    timeoutSeconds: 300,
    minInstances: 1,
  },
  async (event) => {
    const objectPath = event.data.name;
    const bucket = event.data.bucket;
    const contentType = event.data.contentType ?? "";

    // ── Guard: only handle video MIME types ─────────────
    if (!contentType.startsWith("video/")) return;

    // ── Guard: skip temp upload paths ────────────────────
    if (objectPath.includes("/temp-")) return;

    // ── Parse path ───────────────────────────────────────
    const parsed = parseVideoPath(objectPath);
    if (!parsed) return;

    const bucketRef = storage.bucket(bucket);
    const tmpDir = os.tmpdir();
    const tmpVideo = path.join(tmpDir, `video_${Date.now()}`);
    const tmpThumb = path.join(tmpDir, `thumb_${Date.now()}.jpg`);

    try {
      // ── Download the uploaded video ───────────────────
      await bucketRef.file(objectPath).download({ destination: tmpVideo });

      // ── Extract thumbnail + duration ──────────────────
      let duration = 0;
      try {
        duration = await processVideo(tmpVideo, tmpThumb);
      } catch (err) {
        console.error("[onVideoUploaded] FFmpeg failed to process video:", err);
        // If ffmpeg fails, continue without thumbnail
      }

      // ── Build video public URL ────────────────────────
      const videoFile = bucketRef.file(objectPath);
      try {
        await videoFile.makePublic();
        console.log(`[onVideoUploaded] Video made public: https://storage.googleapis.com/${bucket}/${objectPath}`);
      } catch (err) {
        console.error("[onVideoUploaded] Failed to make video public:", err);
        throw err;
      }
      const videoUrl = `https://storage.googleapis.com/${bucket}/${objectPath}`;

      // ── Upload thumbnail if generated ─────────────────
      let thumbnailUrl: string | null = null;
      if (fs.existsSync(tmpThumb)) {
        const baseName = path.basename(objectPath, path.extname(objectPath));
        const thumbStoragePath =
          parsed.type === "project"
            ? `thumbnails/projects/${parsed.projectId}/${baseName}.jpg`
            : parsed.type === "linked-product"
            ? `thumbnails/products/${parsed.productId}/${baseName}.jpg`
            : `thumbnails/products/${parsed.productId}/${baseName}.jpg`;

        await bucketRef.upload(tmpThumb, {
          destination: thumbStoragePath,
          metadata: { contentType: "image/jpeg" },
        });

        const thumbFile = bucketRef.file(thumbStoragePath);
        try {
          await thumbFile.makePublic();
          console.log(`[onVideoUploaded] Thumbnail made public: https://storage.googleapis.com/${bucket}/${thumbStoragePath}`);
        } catch (err) {
          console.error("[onVideoUploaded] Failed to make thumbnail public:", err);
        }
        thumbnailUrl = `https://storage.googleapis.com/${bucket}/${thumbStoragePath}`;
      }

      // ── Update Firestore ──────────────────────────────
      const videoFields: Record<string, unknown> = {
        videoUrl,
        videoThumbnailUrl: thumbnailUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        if (parsed.type === "project") {
          if (duration > 0) videoFields.videoDuration = duration;
          await db
            .collection("projects")
            .doc(parsed.projectId)
            .update(videoFields);
          console.log(`[onVideoUploaded] Updated Firestore for project ${parsed.projectId}`);

          // ── Fan-out project_video_added notifications ──
          const projectSnap = await db
            .collection("projects")
            .doc(parsed.projectId)
            .get();
          const projectData = projectSnap.data();
          if (projectData) {
            await sendVideoNotifications(
              parsed.projectId,
              projectData.creatorId,
              projectData.title || "Untitled Project",
              projectData.slug || parsed.projectId,
              projectData.creatorName || "A creator",
              projectData.creatorAvatar || null
            );
          }
        } else if (parsed.type === "linked-product") {
          await db
            .collection("products")
            .doc(parsed.productId)
            .update(videoFields);
          console.log(`[onVideoUploaded] Updated Firestore for linked product ${parsed.productId}`);
        } else {
          await db
            .collection("products")
            .doc(parsed.productId)
            .update(videoFields);
          console.log(`[onVideoUploaded] Updated Firestore for standalone product ${parsed.productId}`);
        }
      } catch (err) {
        console.error("[onVideoUploaded] Failed to update Firestore:", err);
        throw err;
      }
    } finally {
      // ── Cleanup temp files ────────────────────────────
      [tmpVideo, tmpThumb].forEach((f) => {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {
          // ignore cleanup errors
        }
      });
    }
  }
);

async function sendVideoNotifications(
  projectId: string,
  creatorId: string,
  title: string,
  slug: string,
  actorName: string,
  actorAvatar: string | null
) {
  const followsSnap = await db
    .collection("follows")
    .where("followingId", "==", creatorId)
    .limit(MAX_NOTIFY_BATCH)
    .get();

  if (followsSnap.empty) return;

  const batch = db.batch();
  let opCount = 0;

  for (const followDoc of followsSnap.docs) {
    const followerId = followDoc.data().followerId as string;
    if (followerId === creatorId) continue;

    const notifRef = db.collection("notifications").doc();
    batch.set(notifRef, {
      notificationId: notifRef.id,
      recipientId: followerId,
      type: "project_video_added",
      actorId: creatorId,
      actorName,
      actorAvatar,
      entityId: projectId,
      entityTitle: title,
      entitySlug: slug,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    opCount++;
    if (opCount >= MAX_NOTIFY_BATCH) break;
  }

  if (opCount > 0) {
    await batch.commit();
  }
}
