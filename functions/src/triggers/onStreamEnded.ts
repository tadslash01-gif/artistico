import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../admin";
import * as admin from "firebase-admin";
import { muxTokenId, muxTokenSecret } from "../streaming/mux";
import Mux from "@mux/mux-node";

/**
 * Fires when a stream document is updated.
 * When status transitions to "ended":
 *  1. Fetches the Mux live-stream recording asset
 *  2. Creates a Mux clip (last 60 seconds of the stream)
 *  3. Writes clipPlaybackId + clipStatus:"processing" onto the linked project
 *
 * Clip completion is handled asynchronously by POST /mux-webhook when the
 * asset becomes ready.
 */
export const onStreamEnded = onDocumentUpdated(
  {
    document: "streams/{streamId}",
    secrets: [muxTokenId, muxTokenSecret],
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    // Only react to status → "ended" transition
    if (before.status === "ended" || after.status !== "ended") return;

    const { projectId } = after as { projectId?: string };
    if (!projectId) {
      // Stream was not linked to a project — no clip needed
      return;
    }

    // Ensure project still exists
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) return;

    const streamId: string = event.params.streamId;

    // Read provider stream ID from private credentials sub-collection
    const credDoc = await db
      .collection("streams")
      .doc(streamId)
      .collection("private")
      .doc("credentials")
      .get();
    const providerStreamId: string | undefined = credDoc.data()?.providerStreamId;
    if (!providerStreamId) {
      console.warn("[onStreamEnded] no providerStreamId for stream:", streamId);
      return;
    }

    const mux = new Mux({
      tokenId: muxTokenId.value().trim(),
      tokenSecret: muxTokenSecret.value().trim(),
    });

    try {
      // 1. Fetch the Mux live stream to get its most recent asset
      const liveStream = await mux.video.liveStreams.retrieve(providerStreamId);
      const recentAssetIds: string[] | undefined = (liveStream as any).recent_asset_ids;
      if (!recentAssetIds || recentAssetIds.length === 0) {
        console.warn("[onStreamEnded] no recent assets for stream:", providerStreamId);
        return;
      }
      const assetId = recentAssetIds[0];

      // 2. Fetch the asset to determine duration
      const asset = await mux.video.assets.retrieve(assetId);
      const duration: number = (asset as any).duration ?? 0;

      // Clip: last 60 seconds (or full asset if shorter)
      const clipDuration = 60;
      const startTime = Math.max(0, duration - clipDuration);
      const endTime = duration > 0 ? duration : clipDuration;

      // 3. Create clip via Mux Clips API
      const clip = await (mux.video as any).assets.createClip({
        input: {
          url: `mux://assets/${assetId}`,
          start_time: startTime,
          end_time: endTime,
        },
        playback_policy: ["public"],
      });

      const clipAssetId: string = clip.id ?? clip.asset_id;
      const clipPlaybackIds: Array<{ id: string }> = clip.playback_ids ?? [];
      const clipPlaybackId: string = clipPlaybackIds[0]?.id ?? clipAssetId;

      // 4. Write clip metadata to the project (status: processing)
      await projectRef.update({
        clipPlaybackId,
        clipStatus: "processing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.info(
        `[onStreamEnded] clip created: assetId=${clipAssetId} playbackId=${clipPlaybackId} for project=${projectId}`
      );
    } catch (err) {
      // Non-fatal — clip creation failure should not block stream end
      console.error("[onStreamEnded] clip creation failed:", err);
    }
  }
);
