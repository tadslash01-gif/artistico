"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { PresenceIndicator } from "@/components/PresenceIndicator";

interface ConversationItem {
  conversationId: string;
  participants: string[];
  lastMessage: {
    text: string;
    senderId: string;
    sentAt: { seconds: number; nanoseconds: number } | null;
  };
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

interface MessageEntry {
  entryId?: string;
  senderId: string;
  text: string;
  sentAt: { seconds: number; nanoseconds: number } | null;
  _optimistic?: boolean;
  _sending?: boolean;
  _error?: boolean;
}

interface UserInfo {
  displayName: string;
  photoURL: string | null;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListenerRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time conversation list listener
  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(
      collection(firestore, "messages"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const convs = snap.docs.map((d) => d.data() as ConversationItem);
      setConversations(convs);

      // Pre-fetch user info for any new participants
      const uids = new Set<string>();
      convs.forEach((c) =>
        c.participants.forEach((p) => {
          if (p !== user.uid) uids.add(p);
        })
      );

      const missing = Array.from(uids).filter(
        (uid) => !userCache[uid]
      );
      if (missing.length > 0) {
        const fetched: Record<string, UserInfo> = {};
        await Promise.all(
          missing.map(async (uid) => {
            const userSnap = await getDoc(doc(firestore!, "users", uid));
            if (userSnap.exists()) {
              const data = userSnap.data();
              fetched[uid] = {
                displayName: data.displayName || "Unknown",
                photoURL: data.photoURL || null,
              };
            } else {
              fetched[uid] = { displayName: "Unknown User", photoURL: null };
            }
          })
        );
        setUserCache((prev) => ({ ...prev, ...fetched }));
      }

      setLoading(false);
    });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Switch to a conversation and attach a real-time listener for its messages
  const loadMessages = useCallback(
    (conversationId: string) => {
      if (!firestore) return;

      // Tear down any existing message listener
      if (messageListenerRef.current) {
        messageListenerRef.current();
        messageListenerRef.current = null;
      }

      setSelectedConv(conversationId);
      setLoadingMessages(true);
      setReplyText("");
      setMessages([]);

      const q = query(
        collection(firestore, "messages", conversationId, "entries"),
        orderBy("sentAt", "asc")
      );

      const unsub = onSnapshot(q, (snap) => {
        // Replace all messages from Firestore; drop matching optimistic entries
        setMessages(
          snap.docs.map((d) => ({ ...d.data(), entryId: d.id }) as MessageEntry)
        );
        setLoadingMessages(false);
      });

      messageListenerRef.current = unsub;
    },
    []
  );

  // Clean up message listener when component unmounts
  useEffect(() => {
    return () => {
      if (messageListenerRef.current) {
        messageListenerRef.current();
      }
    };
  }, []);

  const handleReply = async () => {
    if (!user || !firestore || !selectedConv || !replyText.trim()) return;

    const text = replyText.trim();
    const tempId = `optimistic-${Date.now()}`;

    // Optimistic append — shows immediately
    const optimisticMsg: MessageEntry = {
      entryId: tempId,
      senderId: user.uid,
      text,
      sentAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      _optimistic: true,
      _sending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyText("");

    setSending(true);
    try {
      const entryRef = doc(collection(firestore, "messages", selectedConv, "entries"));
      await setDoc(entryRef, {
        entryId: entryRef.id,
        senderId: user.uid,
        text,
        attachments: null,
        readAt: null,
        sentAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, "messages", selectedConv), {
        lastMessage: {
          text,
          senderId: user.uid,
          sentAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // onSnapshot will replace the optimistic message with the real one
    } catch (err) {
      console.error("Failed to send reply:", err);
      // Mark optimistic message as errored
      setMessages((prev) =>
        prev.map((m) =>
          m.entryId === tempId ? { ...m, _sending: false, _error: true } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (conv: ConversationItem) => {
    const otherId = conv.participants.find((p) => p !== user?.uid) || "";
    return userCache[otherId] || { displayName: "Unknown", photoURL: null };
  };

  const formatTs = (ts: { seconds: number; nanoseconds: number } | null) => {
    if (!ts) return "";
    return timeAgo(new Date(ts.seconds * 1000));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View and reply to buyer inquiries.
      </p>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No messages yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Messages from buyers will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Conversation List */}
            <div className="space-y-2 lg:col-span-1">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                const isSelected = selectedConv === conv.conversationId;

                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => loadMessages(conv.conversationId)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {other.photoURL ? (
                        <img
                          src={other.photoURL}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {other.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">
                            {other.displayName}
                          </p>
                          {(() => {
                            const otherId = conv.participants.find((p) => p !== user?.uid) || "";
                            return otherId ? <PresenceIndicator userId={otherId} dotOnly /> : null;
                          })()}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {conv.lastMessage.text}
                        </p>
                      </div>
                      {conv.updatedAt && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatTs(conv.updatedAt)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Message Thread */}
            <div className="lg:col-span-2">
              {!selectedConv ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Select a conversation to view messages.
                  </p>
                </div>
              ) : loadingMessages ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-white">
                  {/* Messages */}
                  <div className="max-h-96 space-y-1 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.uid;
                        const prevMsg = messages[i - 1];
                        const sameAsPrev =
                          prevMsg?.senderId === msg.senderId &&
                          msg.sentAt &&
                          prevMsg?.sentAt &&
                          msg.sentAt.seconds - prevMsg.sentAt.seconds < 300;

                        return (
                          <div
                            key={msg.entryId || i}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-0.5" : "mt-3"}`}
                          >
                            {!isMe && !sameAsPrev && (() => {
                              const otherId = conversations
                                .find((c) => c.conversationId === selectedConv)
                                ?.participants.find((p) => p !== user?.uid) || "";
                              const other = userCache[otherId];
                              return other?.photoURL ? (
                                <img
                                  src={other.photoURL}
                                  alt=""
                                  className="mr-2 h-6 w-6 shrink-0 self-end rounded-full object-cover"
                                />
                              ) : (
                                <div className="mr-2 flex h-6 w-6 shrink-0 self-end items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                  {(other?.displayName || "?")[0].toUpperCase()}
                                </div>
                              );
                            })()}
                            {!isMe && sameAsPrev && (
                              <div className="mr-2 w-6 shrink-0" />
                            )}
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                                msg._error
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : isMe
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <p
                                className={`mt-1 text-[10px] ${
                                  msg._error
                                    ? "text-red-400"
                                    : isMe
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {msg._error
                                  ? "Failed to send — tap to retry"
                                  : msg._sending
                                    ? "Sending…"
                                    : msg.sentAt
                                      ? formatTs(msg.sentAt)
                                      : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input */}
                  <div className="border-t border-border p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply();
                          }
                        }}
                        placeholder="Type a reply..."
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={handleReply}
                        disabled={sending || !replyText.trim()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {sending ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
