"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface InquiryFormProps {
  creatorId: string;
  creatorName: string;
  relatedProjectId?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function InquiryForm({
  creatorId,
  creatorName,
  relatedProjectId,
  onClose,
  onSent,
}: InquiryFormProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSending(true);
    setError("");

    try {
      // Create or find existing conversation between these two users
      const participants = [user.uid, creatorId].sort();
      const conversationId = participants.join("_");

      const convRef = doc(firestore, "messages", conversationId);
      const convSnap = await getDoc(convRef);

      const messageText = subject
        ? `[${subject}] ${message}`
        : message;

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          conversationId,
          participants,
          relatedOrderId: null,
          relatedProjectId: relatedProjectId || null,
          lastMessage: {
            text: messageText,
            senderId: user.uid,
            sentAt: serverTimestamp(),
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(convRef, {
          lastMessage: {
            text: messageText,
            senderId: user.uid,
            sentAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
      }

      // Add the message entry
      const entryRef = doc(collection(firestore, "messages", conversationId, "entries"));
      await setDoc(entryRef, {
        entryId: entryRef.id,
        senderId: user.uid,
        text: messageText,
        attachments: null,
        readAt: null,
        sentAt: serverTimestamp(),
      });

      onSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <a href="/login" className="font-medium text-primary hover:text-primary/80">
            log in
          </a>{" "}
          to contact this creator.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Message {creatorName}
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="inquiry-subject"
            className="block text-sm font-medium text-foreground"
          >
            Subject (optional)
          </label>
          <input
            id="inquiry-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Question about your project..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="inquiry-message"
            className="block text-sm font-medium text-foreground"
          >
            Message
          </label>
          <textarea
            id="inquiry-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I'm interested in..."
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
