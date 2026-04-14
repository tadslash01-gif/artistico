/**
 * Provider abstraction for live streaming.
 * Swap the provider (Mux → LiveKit / AWS IVS) by replacing mux.ts only.
 */

export interface CreateStreamResult {
  /** Opaque provider-side ID for the live stream (used to disable later) */
  providerStreamId: string;
  /** RTMP stream key the broadcaster enters in OBS */
  streamKey: string;
  /** RTMP ingest URL */
  ingestUrl: string;
  /** Provider playback ID used to construct HLS URLs */
  playbackId: string;
}

export interface IStreamProvider {
  /** Create a new live stream on the provider */
  createStream(title: string): Promise<CreateStreamResult>;
  /** Disable/end a live stream on the provider */
  disableStream(providerStreamId: string): Promise<void>;
  /** Get the HLS playback URL for a given playback ID */
  getPlaybackUrl(playbackId: string): string;
}
