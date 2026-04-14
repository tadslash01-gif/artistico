"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import StreamPlayer from "@/components/StreamPlayer";

interface StartStreamResponse {
  streamId: string;
  playbackId: string;
  streamKey: string;
  ingestUrl: string;
}

interface StreamSession {
  streamId: string;
  playbackId: string;
  streamKey: string;
  ingestUrl: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access may be blocked in some contexts
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function StreamDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [session, setSession] = useState<StreamSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [showObs, setShowObs] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !userData?.isCreator) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center">
        <p className="font-semibold text-foreground">Creator account required</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You need a creator profile to go live.
        </p>
        <button
          onClick={() => router.push("/dashboard/profile")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Set up creator profile
        </button>
      </div>
    );
  }

  const handleGoLive = async () => {
    if (!title.trim()) {
      setError("Please enter a stream title.");
      return;
    }
    setError(null);
    setStarting(true);
    try {
      const data = await apiFetch<StartStreamResponse>("/streams/start", {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({ title: title.trim() }),
      });
      setSession(data);
      setIsLive(true);
    } catch (err: any) {
      setError(err?.message || "Failed to start stream. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!session) return;
    setStopping(true);
    try {
      await apiFetch(`/streams/${session.streamId}/stop`, {
        method: "POST",
        authenticated: true,
      });
      setIsLive(false);
      setSession(null);
      setTitle("");
      setRevealKey(false);
    } catch (err: any) {
      setError(err?.message || "Failed to stop stream.");
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Stream</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Go live and connect with your followers in real time.
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          {isLive ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </>
          ) : (
            <span className="relative inline-flex h-3 w-3 rounded-full bg-muted-foreground/30" />
          )}
        </span>
        <span className="text-sm font-medium text-foreground">
          {isLive ? "Stream is live" : "Not streaming"}
        </span>
        {isLive && session && (
          <a
            href={`/stream/${session.streamId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View stream page →
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pre-live: title + go live */}
      {!isLive && (
        <div className="rounded-xl border border-border bg-white/80 p-6 space-y-4">
          <div>
            <label
              htmlFor="stream-title"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Stream Title
            </label>
            <input
              id="stream-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="What are you creating today?"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={handleGoLive}
            disabled={starting || !title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {starting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Starting...
              </>
            ) : (
              "Go Live"
            )}
          </button>
        </div>
      )}

      {/* Live: stream key, ingest URL, stop */}
      {isLive && session && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Broadcast Settings
            </p>

            {/* Ingest URL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Server / Ingest URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono">
                  {session.ingestUrl}
                </code>
                <CopyButton value={session.ingestUrl} />
              </div>
            </div>

            {/* Stream Key */}
            <div className="mt-3 space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Stream Key
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono">
                  {revealKey ? session.streamKey : "•".repeat(Math.min(session.streamKey.length, 40))}
                </code>
                <button
                  onClick={() => setRevealKey((v) => !v)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {revealKey ? "Hide" : "Reveal"}
                </button>
                <CopyButton value={session.streamKey} />
              </div>
              <p className="text-xs text-muted-foreground">
                Keep your stream key private. Anyone with it can broadcast to your stream.
              </p>
            </div>
          </div>

          {/* OBS setup accordion */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowObs((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-foreground"
            >
              OBS Setup Instructions
              <span className="text-muted-foreground">{showObs ? "▲" : "▼"}</span>
            </button>
            {showObs && (
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Open OBS Studio → Settings → Stream</li>
                <li>Set <strong>Service</strong> to "Custom…"</li>
                <li>
                  Paste the <strong>Server</strong> URL:{" "}
                  <code className="bg-muted px-1 rounded text-xs">{session.ingestUrl}</code>
                </li>
                <li>Paste your <strong>Stream Key</strong> from above</li>
                <li>Recommended: 1080p, 6000 kbps, H.264</li>
                <li>Click <strong>Start Streaming</strong> in OBS</li>
              </ol>
            )}
          </div>

          {/* Stop button */}
          <div className="border-t border-border pt-4">
            <button
              onClick={handleStop}
              disabled={stopping}
              className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {stopping ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Stopping...
                </>
              ) : (
                "Stop Stream"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live preview */}
      {isLive && session && (
        <div className="rounded-xl border border-border bg-white/80 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Live Preview</p>
          <StreamPlayer playbackId={session.playbackId} />
          <p className="text-xs text-muted-foreground">
            Note: Preview may take up to 15 seconds to appear after OBS starts streaming.
          </p>
        </div>
      )}
    </div>
  );
}
