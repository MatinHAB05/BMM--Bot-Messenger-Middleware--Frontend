import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chat, ChatMessage } from "../../types/chat";
import { chatsApi } from "../../api/chats";
import { attachmentsApi } from "../../api/attachments";
import { broadcastsApi } from "../../api/broadcasts";
import { useToast } from "../../contexts/ToastContext";
import { usePermission } from "../../permissions/usePermission";
import { useLanguage } from "../../contexts/LanguageContext";
import { PlatformBadge } from "../common/PlatformBadge";
import { MessageItem } from "./MessageItem";
import { MessageComposer } from "./MessageComposer";
import { ChatProfileModal } from "./ChatProfileModal";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { BroadcastAttachmentType } from "../../types/broadcast";
import {
  RefreshCw,
  ChevronDown,
  Info,
  MessageSquare,
  Clock,
  Radio,
  Edit3,
  Trash2,
  CheckSquare,
  Copy,
  X,
} from "lucide-react";

interface ChatWindowProps {
  chat: Chat | null;
  onOpenLinkModal: () => void;
  onChatUpdated?: () => void;
  onActiveChatMessages?: (chatId: number, messages: ChatMessage[]) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  message: ChatMessage;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  onOpenLinkModal,
  onChatUpdated,
  onActiveChatMessages,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Polling interval
  const POLL_INTERVAL_OPTIONS: { label: string; value: number | null }[] = [
    { label: "2s", value: 2000 },
    { label: "4s", value: 4000 },
    { label: "10s", value: 10000 },
    { label: "30s", value: 30000 },
    { label: "1m", value: 60000 },
    { label: "Off", value: null },
  ];
  const [pollIntervalMs, setPollIntervalMs] = useState<number | null>(4000);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);

  // Broadcast Edit state
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [isUpdatingBroadcast, setIsUpdatingBroadcast] = useState(false);

  // Broadcast Delete state
  const [deletingMessage, setDeletingMessage] = useState<ChatMessage | null>(null);
  const [isDeletingBroadcast, setIsDeletingBroadcast] = useState(false);

  // Local Delete state
  const [deletingLocalMessage, setDeletingLocalMessage] = useState<ChatMessage | null>(null);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Batch Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const canUpdateBroadcast = hasPermission("broadcast", "update");
  const canDeleteBroadcast = hasPermission("broadcast", "delete");
  const canDeleteLocal = hasPermission("chat", "delete-message");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 120);
  };
  const activeChatIdRef = useRef<number | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    activeChatIdRef.current = chat?.id || null;
  }, [chat?.id]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Close context menu on Esc key or resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", () => setContextMenu(null));
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const fetchHistory = useCallback(
    async (isBackground = false) => {
      if (!chat) return;
      try {
        if (!isBackground) setIsLoading(true);
        else setIsSyncing(true);

        const res = await chatsApi.getHistory(chat.id, { limit: 100 });
        if (activeChatIdRef.current === chat.id) {
          const prevAttachmentsByMsgId = new Map<number, any[]>();
          const prevDownloadUrlByAttId = new Map<number, string>();
          messagesRef.current.forEach((m) => {
            if (m.attachments && m.attachments.length > 0) {
              prevAttachmentsByMsgId.set(m.id, m.attachments);
              m.attachments.forEach((a: any) => {
                if (a && a.id && a.download_url)
                  prevDownloadUrlByAttId.set(a.id, a.download_url);
              });
            }
          });

          const mergeKnownAttachments = (list: ChatMessage[]) =>
            list.map((m) => {
              const attachments =
                m.attachments && m.attachments.length > 0
                  ? m.attachments
                  : prevAttachmentsByMsgId.get(m.id) || m.attachments;
              if (!attachments || attachments.length === 0)
                return { ...m, attachments };
              return {
                ...m,
                attachments: attachments.map((a: any) =>
                  a &&
                  a.id &&
                  !a.download_url &&
                  prevDownloadUrlByAttId.has(a.id)
                    ? { ...a, download_url: prevDownloadUrlByAttId.get(a.id) }
                    : a
                ),
              };
            });

          let sorted = [...(res.messages || [])].sort(
            (a, b) =>
              new Date(a.message_timestamp).getTime() -
              new Date(b.message_timestamp).getTime()
          );
          sorted = mergeKnownAttachments(sorted);
          setMessages(sorted);
          if (chat) onActiveChatMessages?.(chat.id, sorted);

          // Enrich messages that have attachments but empty attachments array
          const needsAttachments = sorted.filter(
            (m) =>
              m.has_attachments &&
              (!m.attachments || m.attachments.length === 0)
          );
          if (
            needsAttachments.length > 0 &&
            activeChatIdRef.current === chat.id
          ) {
            const enriched = await Promise.allSettled(
              needsAttachments.map(async (msg) => {
                try {
                  const atts = await attachmentsApi.getForMessage(
                    chat.id,
                    msg.id
                  );
                  return { id: msg.id, atts };
                } catch {
                  return { id: msg.id, atts: [] };
                }
              })
            );
            const attMap: Record<number, any[]> = {};
            enriched.forEach((r) => {
              if (r.status === "fulfilled") attMap[r.value.id] = r.value.atts;
            });
            sorted = sorted.map((m) => {
              const atts = attMap[m.id];
              return atts && atts.length > 0 ? { ...m, attachments: atts } : m;
            });
            sorted = mergeKnownAttachments(sorted);
            if (activeChatIdRef.current === chat.id) {
              setMessages(sorted);
            }
          }

          // Resolve download URLs
          const pendingAttachmentIDs = sorted
            .flatMap((m) => m.attachments || [])
            .filter((a: any) => a && a.id && !a.download_url)
            .map((a: any) => a.id);

          if (
            pendingAttachmentIDs.length > 0 &&
            activeChatIdRef.current === chat.id
          ) {
            try {
              const links =
                await attachmentsApi.getDownloadURLsBatch(pendingAttachmentIDs);
              if (activeChatIdRef.current === chat.id) {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (!m.attachments || m.attachments.length === 0) return m;
                    return {
                      ...m,
                      attachments: m.attachments.map((a: any) =>
                        a && a.id && links[a.id]
                          ? { ...a, download_url: links[a.id] }
                          : a
                      ),
                    };
                  })
                );
              }
            } catch {
              // Non-fatal
            }
          }
        }
      } catch (err: any) {
        if (!isBackground) {
          showToast(err.message || "Failed to load chat history", "error");
        }
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [chat?.id]
  );

  // Initial fetch on chat change
  useEffect(() => {
    if (chat) {
      setMessages([]);
      cancelSelection();
      setContextMenu(null);
      fetchHistory(false).then(() => {
        setTimeout(() => scrollToBottom(false), 150);
      });
    }
  }, [chat?.id, fetchHistory]);

  // HTTP Polling
  useEffect(() => {
    if (!chat || pollIntervalMs === null) return;

    const interval = setInterval(() => {
      fetchHistory(true);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [chat?.id, fetchHistory, pollIntervalMs]);

  const handleSendMessage = async (
    text: string,
    files: File[],
    attachmentType?: BroadcastAttachmentType,
    platforms?: string[]
  ) => {
    if (!chat) return;

    try {
      setIsSending(true);
      const targetPlatforms =
        platforms && platforms.length > 0 ? platforms : [chat.platform];

      await broadcastsApi.send({
        message: text,
        platforms: targetPlatforms,
        attachmentType,
        files,
      });

      showToast(t("success"), "success");
      await fetchHistory(true);
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      showToast(err.message || "Failed to send message", "error");
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenEditBroadcast = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setEditText(msg.content || "");
  };

  const handleSaveBroadcastEdit = async () => {
    if (!editingMessage || !editingMessage.broadcast_uuid) return;
    try {
      setIsUpdatingBroadcast(true);
      await broadcastsApi.update(editingMessage.broadcast_uuid, {
        message: editText.trim(),
        platforms: [chat?.platform || "telegram"],
      });
      showToast(t("success"), "success");
      setEditingMessage(null);
      await fetchHistory(true);
    } catch (err: any) {
      showToast(err.message || "Failed to update broadcast", "error");
    } finally {
      setIsUpdatingBroadcast(false);
    }
  };

  const handleConfirmDeleteBroadcast = async () => {
    if (!deletingMessage || !deletingMessage.broadcast_uuid) return;
    try {
      setIsDeletingBroadcast(true);
      await broadcastsApi.delete(deletingMessage.broadcast_uuid, {
        platforms: [chat?.platform || "telegram"],
      });
      showToast(t("success"), "success");
      setDeletingMessage(null);
      await fetchHistory(true);
    } catch (err: any) {
      showToast(err.message || "Failed to delete broadcast", "error");
    } finally {
      setIsDeletingBroadcast(false);
    }
  };

  const handleConfirmDeleteLocal = async () => {
    if (!chat || !deletingLocalMessage) return;
    try {
      setIsDeletingLocal(true);
      await chatsApi.deleteMessage(chat.id, deletingLocalMessage.id);
      showToast(t("success"), "success");
      setDeletingLocalMessage(null);
      await fetchHistory(true);
    } catch (err: any) {
      showToast(err.message || "Failed to delete message", "error");
    } finally {
      setIsDeletingLocal(false);
    }
  };

  // Context Menu trigger
  const handleContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.min(e.clientY, window.innerHeight - 260);
    setContextMenu({ x, y, message: msg });
  };

  // Selection helpers
  const toggleSelectMessage = (message: ChatMessage) => {
    setIsSelectionMode(true);
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) next.delete(message.id);
      else next.add(message.id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(messages.map((m) => m.id)));
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  // Batch Delete execution
  const handleBatchDelete = async () => {
    if (selectedMessageIds.size === 0 || !chat) return;
    try {
      setIsBatchDeleting(true);
      const selectedMsgs = messages.filter((m) => selectedMessageIds.has(m.id));

      // Separate broadcast UUIDs
      const broadcastUUIDs = selectedMsgs
        .map((m) => m.broadcast_uuid)
        .filter((uuid): uuid is string => Boolean(uuid));

      // Delete broadcast messages across platforms if any
      if (broadcastUUIDs.length > 0) {
        try {
          await broadcastsApi.deleteBatch({
            platforms: ["telegram", "bale"],
            brodcast_ids: broadcastUUIDs,
          });
        } catch (err: any) {
          console.warn("Broadcast batch delete warning:", err);
        }
      }

      // Delete from local history
      await Promise.allSettled(
        selectedMsgs.map((m) => chatsApi.deleteMessage(chat.id, m.id))
      );

      showToast(t("success"), "success");
      setShowBatchDeleteConfirm(false);
      cancelSelection();
      await fetchHistory(true);
    } catch (err: any) {
      showToast(err.message || "Failed to batch delete messages", "error");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500 mb-4 shadow-xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t("noActiveChatTitle")}</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          {t("noActiveChatDesc")}
        </p>
        <button
          type="button"
          onClick={onOpenLinkModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-all cursor-pointer"
        >
          {t("linkNewChatNow")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-slate-50/60 dark:bg-slate-950 flex flex-col min-w-0 relative">
      {/* Active Chat Header */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <PlatformBadge
              platform={chat.platform}
              showText={false}
              size="md"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                chat.is_active ? "bg-emerald-500" : "bg-slate-600"
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {chat.title}
              </h3>
              <PlatformBadge platform={chat.platform} size="sm" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="capitalize">{chat.chat_type || "Group"}</span>
              <span>•</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                {chat.platform_chat_id}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Controls & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Select Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSelectionMode) cancelSelection();
              else setIsSelectionMode(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isSelectionMode
                ? "bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/50"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title={isSelectionMode ? t("cancelSelection") : t("selectMessages")}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSelectionMode ? t("cancelSelection") : t("selectMessages")}
            </span>
          </button>

          {/* Polling Interval Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIntervalMenu((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Polling interval"
            >
              <Clock className="w-3 h-3 text-blue-400" />
              <span>
                {pollIntervalMs === null
                  ? "Sync: Off"
                  : `Sync: ${POLL_INTERVAL_OPTIONS.find((o) => o.value === pollIntervalMs)?.label ?? `${pollIntervalMs / 1000}s`}`}
              </span>
              {isSyncing && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              )}
            </button>

            {showIntervalMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowIntervalMenu(false)}
                />
                <div className="absolute right-0 top-9 z-50 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                  {POLL_INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setPollIntervalMs(opt.value);
                        setShowIntervalMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-slate-800 cursor-pointer ${
                        opt.value === pollIntervalMs
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {opt.label}
                      {opt.value === pollIntervalMs && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchHistory(false)}
            disabled={isLoading || isSyncing}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t("refresh")}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading || isSyncing ? "animate-spin text-blue-400" : ""}`}
            />
          </button>

          {/* Chat Profile / Settings Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t("chatProfileDangerZone")}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed Area */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin relative">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <p className="text-xs">{t("fetchingMessages")}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              {t("noMessagesYet")}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
              {t("noMessagesSubtext")}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onBroadcastEdit={handleOpenEditBroadcast}
              onBroadcastDelete={setDeletingMessage}
              onDeleteLocal={setDeletingLocalMessage}
              onContextMenu={handleContextMenu}
              isSelectionMode={isSelectionMode}
              isSelected={selectedMessageIds.has(msg.id)}
              onToggleSelect={toggleSelectMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Batch Selection Action Bar (Appears when selection mode is active) */}
      {isSelectionMode && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-900/95 border-t border-b border-blue-200 dark:border-blue-900/50 text-xs shadow-lg backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              {t("selectedCount", { count: selectedMessageIds.size })}
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {selectedMessageIds.size === messages.length ? t("deselectAll") : t("selectAll")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={cancelSelection}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={selectedMessageIds.size === 0 || isBatchDeleting}
              onClick={() => setShowBatchDeleteConfirm(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t("deleteSelectedMessages")} ({selectedMessageIds.size})
            </Button>
          </div>
        </div>
      )}

            {/* Scroll to Bottom Floating Button (Telegram style) */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute end-6 bottom-24 z-30 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center transition-all cursor-pointer animate-in fade-in zoom-in-95 duration-150"
          title={isFA ? 'برو به پیام‌های جدید' : 'Scroll to latest message'}
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Composer Container */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        isLoading={isSending}
        disabled={!chat.is_active}
        defaultPlatform={chat.platform}
      />

      {/* Floating Custom Right-Click Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50 cursor-default"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            className="fixed z-50 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl py-1 text-xs select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Context Menu Header */}
            <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>
                {contextMenu.message.broadcast_uuid ? t("broadcastMessage") : t("chatMessage")}
              </span>
              {contextMenu.message.broadcast_uuid && (
                <span className="flex items-center gap-1 text-indigo-400">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>UUID</span>
                </span>
              )}
            </div>

            {/* Edit Broadcast */}
            {contextMenu.message.broadcast_uuid && canUpdateBroadcast && (
              <button
                type="button"
                onClick={() => {
                  const msg = contextMenu.message;
                  setContextMenu(null);
                  handleOpenEditBroadcast(msg);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>{t("broadcastEdit")}</span>
              </button>
            )}

            {/* Delete / Revoke Broadcast Everywhere */}
            {contextMenu.message.broadcast_uuid && canDeleteBroadcast && (
              <button
                type="button"
                onClick={() => {
                  const msg = contextMenu.message;
                  setContextMenu(null);
                  setDeletingMessage(msg);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-950/40 transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>{t("broadcastDelete")}</span>
              </button>
            )}

            {/* Copy Text */}
            {contextMenu.message.content && (
              <button
                type="button"
                onClick={() => {
                  const text = contextMenu.message.content;
                  setContextMenu(null);
                  navigator.clipboard.writeText(text);
                  showToast(t("copiedToClipboard"), "info");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("copyText")}</span>
              </button>
            )}

            {/* Select message for batch operation */}
            <button
              type="button"
              onClick={() => {
                const msg = contextMenu.message;
                setContextMenu(null);
                toggleSelectMessage(msg);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("selectMessages")}</span>
            </button>

            {/* Delete Local Message */}
            {canDeleteLocal && (
              <button
                type="button"
                onClick={() => {
                  const msg = contextMenu.message;
                  setContextMenu(null);
                  setDeletingLocalMessage(msg);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-left border-t border-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("deleteMessage")}</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Chat Profile Modal */}
      <ChatProfileModal
        chat={chat}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onChatUpdated={() => {
          onChatUpdated?.();
        }}
        onChatDeleted={() => {
          onChatUpdated?.();
        }}
      />

      {/* Broadcast Edit Modal */}
      <Modal
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        title={t("editBroadcastTitle")}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            {t("editBroadcastDesc")}
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t("updatedContent")}
            </label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t("enterUpdatedContent")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingMessage(null)}
              disabled={isUpdatingBroadcast}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveBroadcastEdit}
              isLoading={isUpdatingBroadcast}
              disabled={!editText.trim()}
            >
              {t("saveAndBroadcast")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Broadcast Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMessage}
        onClose={() => setDeletingMessage(null)}
        onConfirm={handleConfirmDeleteBroadcast}
        title={t("broadcastDeleteTitle")}
        message={t("broadcastDeleteMessage")}
        confirmText={t("revokeEverywhere")}
        variant="danger"
        isLoading={isDeletingBroadcast}
      />

      {/* Delete Local Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingLocalMessage}
        onClose={() => setDeletingLocalMessage(null)}
        onConfirm={handleConfirmDeleteLocal}
        title={t("deleteLocalTitle")}
        message={t("deleteLocalMessage")}
        confirmText={t("deleteMessage")}
        variant="danger"
        isLoading={isDeletingLocal}
      />

      {/* Batch Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title={t("confirmBatchDeleteChatTitle")}
        message={t("confirmBatchDeleteChatMessage", { count: selectedMessageIds.size })}
        confirmText={t("deleteSelectedMessages")}
        variant="danger"
        isLoading={isBatchDeleting}
      />
    </div>
  );
};