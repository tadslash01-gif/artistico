"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/utils";

interface CommentData {
  commentId: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string | null;
  content: string;
  parentId: string | null;
  likeCount: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

function Avatar({
  name,
  photoURL,
  size = "sm",
}: {
  name: string;
  photoURL: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-sm";
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary`}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function CommentTimestamp({
  ts,
}: {
  ts: { seconds: number; nanoseconds: number } | null;
}) {
  if (!ts) return null;
  return (
    <span className="text-xs text-muted-foreground">
      {timeAgo(new Date(ts.seconds * 1000))}
    </span>
  );
}

interface ReplyListProps {
  parentId: string;
  projectId: string;
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
}

function ReplyList({ parentId, currentUserId, onDelete }: ReplyListProps) {
  const [replies, setReplies] = useState<CommentData[]>([]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "comments"),
      where("parentId", "==", parentId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => d.data() as CommentData));
    });
    return unsub;
  }, [parentId]);

  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 pl-9">
      {replies.map((reply) => (
        <div key={reply.commentId} className="flex gap-2">
          <Avatar
            name={reply.userDisplayName}
            photoURL={reply.userAvatar}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-semibold text-foreground">
                {reply.userDisplayName}
              </span>
              <CommentTimestamp ts={reply.createdAt} />
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
              {reply.content}
            </p>
          </div>
          {currentUserId === reply.userId && (
            <button
              onClick={() => onDelete(reply.commentId)}
              className="self-start text-xs text-muted-foreground hover:text-red-500 transition-colors"
              aria-label="Delete reply"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface CommentInputProps {
  onSubmit: (content: string, parentId?: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

function CommentInput({
  onSubmit,
  placeholder = "Write a comment…",
  autoFocus = false,
  onCancel,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-1">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        maxLength={1000}
        className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {content.length}/1000
        </span>
      </div>
    </div>
  );
}

// ─── Main CommentSection ──────────────────────────────────

interface CommentSectionProps {
  projectId: string;
  projectOwnerId: string;
}

export default function CommentSection({
  projectId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Real-time top-level comment listener
  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "comments"),
      where("projectId", "==", projectId),
      where("parentId", "==", null),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setComments(snap.docs.map((d) => d.data() as CommentData));
        setLoading(false);
      },
      () => {
        setError("Failed to load comments. Please refresh.");
        setLoading(false);
      }
    );
    return unsub;
  }, [projectId]);

  const postComment = async (content: string, parentId?: string) => {
    await apiFetch("/comments", {
      method: "POST",
      body: JSON.stringify({ projectId, content, parentId: parentId || null }),
    });
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    setDeleting(commentId);
    try {
      await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete comment");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-foreground">
        Comments {!loading && `(${comments.length})`}
      </h2>

      {/* Comment input — auth-gated */}
      <div className="mt-4">
        {user ? (
          <div className="flex gap-3">
            <Avatar
              name={user.displayName || user.email || "?"}
              photoURL={user.photoURL}
              size="md"
            />
            <div className="flex-1">
              <CommentInput
                onSubmit={(content) => postComment(content)}
                placeholder="Add a comment…"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-primary underline hover:no-underline">
              Sign in
            </a>{" "}
            to leave a comment.
          </p>
        )}
      </div>

      {/* Comment list */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center">
            <p className="text-2xl">💬</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              Be the first to comment
            </p>
            <p className="text-xs text-muted-foreground">
              Share your thoughts about this project
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map((comment) => (
              <div key={comment.commentId}>
                <div className="flex gap-3">
                  <Avatar
                    name={comment.userDisplayName}
                    photoURL={comment.userAvatar}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {comment.userDisplayName}
                      </span>
                      <CommentTimestamp ts={comment.createdAt} />
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    <div className="mt-1 flex items-center gap-3">
                      {user && (
                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.commentId
                                ? null
                                : comment.commentId
                            )
                          }
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Reply
                        </button>
                      )}
                      {user?.uid === comment.userId && (
                        <button
                          onClick={() => deleteComment(comment.commentId)}
                          disabled={deleting === comment.commentId}
                          className="text-xs text-muted-foreground hover:text-red-500 disabled:opacity-50 transition-colors"
                        >
                          {deleting === comment.commentId ? "Deleting…" : "Delete"}
                        </button>
                      )}
                    </div>

                    {/* Reply input */}
                    {replyingTo === comment.commentId && (
                      <div className="mt-2 flex gap-2">
                        <Avatar
                          name={user?.displayName || user?.email || "?"}
                          photoURL={user?.photoURL || null}
                          size="sm"
                        />
                        <div className="flex-1">
                          <CommentInput
                            placeholder={`Reply to ${comment.userDisplayName}…`}
                            autoFocus
                            onSubmit={async (content) => {
                              await postComment(content, comment.commentId);
                              setReplyingTo(null);
                            }}
                            onCancel={() => setReplyingTo(null)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies (max depth 1) */}
                <ReplyList
                  parentId={comment.commentId}
                  projectId={projectId}
                  currentUserId={user?.uid || null}
                  onDelete={deleteComment}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
