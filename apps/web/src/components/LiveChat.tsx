"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import Image from "next/image";

interface ChatMessage {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string | null;
  content: string;
  createdAt: Timestamp | null;
}

const CHAT_LIMIT = 100;
const SEND_COOLDOWN_MS = 2_000;

interface LiveChatProps {
  streamId: string;
}

export default function LiveChat({ streamId }: LiveChatProps) {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat
  useEffect(() => {
    if (!firestore) return;

    const chatRef = collection(firestore, "streams", streamId, "chat");
    const q = query(chatRef, orderBy("createdAt", "asc"), limit(CHAT_LIMIT));

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ChatMessage, "id">),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [streamId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || cooldown || !user) return;

    setSending(true);
    setCooldown(true);
    setInput("");

    try {
      await apiFetch(`/streams/${streamId}/chat`, {
        method: "POST",
        authenticated: true,
        body: JSON.stringify({ content: trimmed }),
      });
    } catch {
      // Re-populate input on failure so user doesn't lose their message
      setInput(trimmed);
    } finally {
      setSending(false);
      // Enforce client-side cooldown to prevent spam
      setTimeout(() => setCooldown(false), SEND_COOLDOWN_MS);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-white/80">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Live Chat</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground pt-4">
            No messages yet. Be the first to say something!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            {msg.userAvatar ? (
              <Image
                src={msg.userAvatar}
                alt={msg.userDisplayName}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary/20 shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">
                {msg.userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground mr-1.5">
                {msg.userDisplayName}
              </span>
              <span className="text-xs text-muted-foreground break-words">
                {msg.content}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        {user ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              placeholder="Say something..."
              disabled={sending || cooldown}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || cooldown || !input.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50 hover:bg-primary/90"
            >
              Send
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            <a href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </a>{" "}
            to chat
          </p>
        )}
      </div>
    </div>
  );
}
