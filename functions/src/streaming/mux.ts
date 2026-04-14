import Mux from "@mux/mux-node";
import { defineSecret } from "firebase-functions/params";
import type { IStreamProvider, CreateStreamResult } from "./provider";

export const muxTokenId = defineSecret("MUX_TOKEN_ID");
export const muxTokenSecret = defineSecret("MUX_TOKEN_SECRET");

let _mux: Mux | null = null;

function getMux(): Mux {
  if (!_mux) {
    _mux = new Mux({
      tokenId: muxTokenId.value().trim(),
      tokenSecret: muxTokenSecret.value().trim(),
    });
  }
  return _mux;
}

const MUX_INGEST_URL = "rtmps://global-live.mux.com:443/app";

export class MuxStreamProvider implements IStreamProvider {
  async createStream(title: string): Promise<CreateStreamResult> {
    const mux = getMux();
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      latency_mode: "low",
      new_asset_settings: { playback_policy: ["public"] },
    });

    // Mux may return 0 or 1 stream keys
    const streamKey = liveStream.stream_key ?? "";
    const playbackId = liveStream.playback_ids?.[0]?.id ?? "";

    return {
      providerStreamId: liveStream.id,
      streamKey,
      ingestUrl: MUX_INGEST_URL,
      playbackId,
    };
  }

  async disableStream(providerStreamId: string): Promise<void> {
    const mux = getMux();
    await mux.video.liveStreams.disable(providerStreamId);
  }

  getPlaybackUrl(playbackId: string): string {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }
}
