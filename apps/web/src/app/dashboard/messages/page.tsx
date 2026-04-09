"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

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

  // Fetch conversations
  useEffect(() => {
    if (!user || !firestore) return;

    async function fetchConversations() {
      const q = query(
        collection(firestore!, "messages"),
        where("participants", "array-contains", user!.uid),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      const convs = snap.docs.map((d) => d.data() as ConversationItem);
      setConversations(convs);

      // Pre-fetch user info for all participants
      const uids = new Set<string>();
      convs.forEach((c) =>
        c.participants.forEach((p) => {
          if (p !== user!.uid) uids.add(p);
        })
      );

      const cache: Record<string, UserInfo> = {};
      await Promise.all(
        Array.from(uids).map(async (uid) => {
          const userSnap = await getDoc(doc(firestore!, "users", uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            cache[uid] = {
              displayName: data.displayName || "Unknown",
              photoURL: data.photoURL || null,
            };
          } else {
            cache[uid] = { displayName: "Unknown User", photoURL: null };
          }
        })
      );
      setUserCache(cache);
      setLoading(false);
    }

    fetchConversations();
  }, [user]);

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    if (!firestore) return;
    setSelectedConv(conversationId);
    setLoadingMessages(true);
    setReplyText("");

    const q = query(
      collection(firestore, "messages", conversationId, "entries"),
      orderBy("sentAt", "asc")
    );
    const snap = await getDocs(q);
    setMessages(snap.docs.map((d) => ({ ...d.data(), entryId: d.id }) as MessageEntry));
    setLoadingMessages(false);
  };

  const handleReply = async () => {
    if (!user || !firestore || !selectedConv || !replyText.trim()) return;

    setSending(true);
    try {
      const entryRef = doc(collection(firestore, "messages", selectedConv, "entries"));
      await setDoc(entryRef, {
        entryId: entryRef.id,
        senderId: user.uid,
        text: replyText.trim(),
        attachments: null,
        readAt: null,
        sentAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, "messages", selectedConv), {
        lastMessage: {
          text: replyText.trim(),
          senderId: user.uid,
          sentAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          senderId: user.uid,
          text: replyText.trim(),
          sentAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        },
      ]);
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
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
                        <p className="truncate text-sm font-medium text-foreground">
                          {other.displayName}
                        </p>
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
                  <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        No messages in this conversation.
                      </p>
                    ) : (
                      messages.map((msg, i) => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                          <div
                            key={i}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                                isMe
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              {msg.sentAt && (
                                <p
                                  className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                >
                                  {formatTs(msg.sentAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
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
