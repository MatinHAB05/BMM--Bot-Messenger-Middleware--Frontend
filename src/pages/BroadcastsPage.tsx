import React, { useState, useEffect, useCallback } from "react";
import { broadcastsApi } from "../api/broadcasts";
import { chatsApi } from "../api/chats";
import { useToast } from "../contexts/ToastContext";
import { usePermission } from "../permissions/usePermission";
import { useLanguage } from "../contexts/LanguageContext";
import { BroadcastModal } from "../components/broadcasts/BroadcastModal";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { Button } from "../components/common/Button";
import { PlatformBadge } from "../components/common/PlatformBadge";
import { Chat, ChatMessage, ALL_SUPPORTED_PLATFORMS } from "../types/chat";
import {
  Radio,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Square,
  CheckSquare,
  Clock,
  MessageSquare,
} from "lucide-react";
import { formatDateTime } from "../utils/date";

interface BroadcastRecord {
  id: string; // broadcast_uuid
  message_id: number;
  chat_id: number;
  chat_title: string;
  chat_titles?: string[];
  platform: string;
  platforms?: string[];
  content: string;
  sender_name?: string;
  created_at: string;
}

export const BroadcastsPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [records, setRecords] = useState<BroadcastRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // New broadcast modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Edit modal
  const [editingRecord, setEditingRecord] = useState<BroadcastRecord | null>(
    null,
  );
  const [editText, setEditText] = useState("");
  const [editPlatforms] = useState<string[]>(["telegram", "bale"]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete single
  const [deletingRecord, setDeletingRecord] = useState<BroadcastRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch delete
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const canBroadcast = hasPermission("broadcast", "send");
  const canUpdate = hasPermission("broadcast", "update");
  const canDelete = hasPermission("broadcast", "delete");

  // Load broadcast messages from all chats
  const loadBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const chatRes = await chatsApi.list({ page: 1, page_size: 100 });
      const chats: Chat[] = chatRes.chats || [];

      const allBroadcasts: BroadcastRecord[] = [];

      await Promise.allSettled(
        chats.map(async (chat) => {
          try {
            const histRes = await chatsApi.getHistory(chat.id, { limit: 200 });
            const msgs: ChatMessage[] = histRes.messages || [];
            const broadcasts = msgs.filter(
              (m) => m.is_broadcast && m.broadcast_uuid,
            );
            broadcasts.forEach((m) => {
              allBroadcasts.push({
                id: m.broadcast_uuid!,
                message_id: m.id,
                chat_id: chat.id,
                chat_title: chat.title,
                platform: chat.platform,
                content: m.content || "",
                sender_name: m.sender_name,
                created_at: m.created_at,
              });
            });
          } catch (_) {}
        }),
      );

      // Deduplicate by broadcast_uuid (merge platforms and chat titles, keep latest and preserve caption)
      const seen = new Map<string, BroadcastRecord>();
      allBroadcasts.forEach((r) => {
        if (!seen.has(r.id)) {
          seen.set(r.id, {
            ...r,
            platforms: r.platform ? [r.platform] : [],
            chat_titles: r.chat_title ? [r.chat_title] : [],
          });
        } else {
          const existing = seen.get(r.id)!;
          if (r.platform && !existing.platforms?.includes(r.platform)) {
            existing.platforms = existing.platforms || [];
            existing.platforms.push(r.platform);
          }
          if (r.chat_title && !existing.chat_titles?.includes(r.chat_title)) {
            existing.chat_titles = existing.chat_titles || [];
            existing.chat_titles.push(r.chat_title);
          }
          if (!existing.content && r.content) {
            existing.content = r.content;
          }
          if (new Date(r.created_at) > new Date(existing.created_at)) {
            existing.created_at = r.created_at;
          }
        }
      });
      const sorted = [...seen.values()].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setRecords(sorted);
    } catch (err: any) {
      showToast(err.message || "Failed to load broadcasts", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  };

  // Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editText.trim()) return;
    try {
      setIsUpdating(true);
      const targetPlatforms =
        editingRecord.platforms && editingRecord.platforms.length > 0
          ? editingRecord.platforms
          : ALL_SUPPORTED_PLATFORMS;
      await broadcastsApi.update(editingRecord.id, {
        message: editText.trim(),
        platforms: targetPlatforms,
      });
      showToast(t("success"), "success");
      setEditingRecord(null);
      setEditText("");
      loadBroadcasts();
    } catch (err: any) {
      showToast(err.message || "Failed to update broadcast", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete single
  const handleDeleteSingle = async () => {
    if (!deletingRecord) return;
    try {
      setIsDeleting(true);
      const targetPlatforms =
        deletingRecord.platforms && deletingRecord.platforms.length > 0
          ? deletingRecord.platforms
          : ALL_SUPPORTED_PLATFORMS;
      await broadcastsApi.delete(deletingRecord.id, {
        platforms: targetPlatforms,
      });
      showToast(t("success"), "success");
      setDeletingRecord(null);
      setRecords((prev) => prev.filter((r) => r.id !== deletingRecord.id));
      setSelected((prev) => {
        const n = new Set(prev);
        n.delete(deletingRecord.id);
        return n;
      });
    } catch (err: any) {
      showToast(err.message || "Failed to delete broadcast", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    try {
      setIsBatchDeleting(true);
      const selectedRecords = records.filter((r) => selected.has(r.id));
      const targetPlatforms = Array.from(
        new Set(
          selectedRecords.flatMap((r) =>
            r.platforms && r.platforms.length > 0 ? r.platforms : [r.platform]
          )
        )
      );
      await broadcastsApi.deleteBatch({
        platforms: targetPlatforms.length > 0 ? targetPlatforms : ALL_SUPPORTED_PLATFORMS,
        brodcast_ids: [...selected],
      });
      showToast(t("success"), "success");
      setRecords((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
    } catch (err: any) {
      showToast(err.message || "Failed to batch delete", "error");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const allSelected = records.length > 0 && selected.size === records.length;

  return (
    <div className="flex flex-col h-full p-6 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" /> {t("broadcastHub")}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t("broadcastHubDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleBatchDelete}
              isLoading={isBatchDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t("deleteSelected", { count: selected.size })}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadBroadcasts}
            disabled={isLoading}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            }
          >
            {t("refresh")}
          </Button>
          {canBroadcast && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBroadcastModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {t("newBroadcast")}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-900/60 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mb-2" />
            <p className="text-xs">{t("loading")}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              {t("noBroadcastsYet")}
            </p>
            <p className="text-xs mt-1">{t("sendFirstBroadcast")}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-left w-8">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-left font-semibold">
                  {t("messageCol")}
                </th>
                <th className="py-3 px-4 text-left font-semibold">
                  {t("chatCol")}
                </th>
                <th className="py-3 px-4 text-left font-semibold">
                  {t("platform")}
                </th>
                <th className="py-3 px-4 text-left font-semibold">
                  {t("broadcastUuid")}
                </th>
                <th className="py-3 px-4 text-left font-semibold">
                  {t("sentAt")}
                </th>
                <th className="py-3 px-4 text-right font-semibold">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((rec) => (
                <tr
                  key={rec.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    selected.has(rec.id) ? "bg-blue-950/20" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleSelect(rec.id)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {selected.has(rec.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-200 truncate" title={rec.content}>
                      {rec.content || (
                        <em className="text-slate-500">{t("mediaOnly")}</em>
                      )}
                    </p>
                    {rec.sender_name && (
                      <p className="text-slate-500 text-[10px]">
                        {isFA
                          ? `توسط ${rec.sender_name}`
                          : `by ${rec.sender_name}`}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-medium truncate max-w-[140px]" title={rec.chat_titles?.join(', ') || rec.chat_title}>
                    {rec.chat_titles && rec.chat_titles.length > 1
                      ? `${rec.chat_titles[0]} (+${rec.chat_titles.length - 1})`
                      : rec.chat_title}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {rec.platforms && rec.platforms.length > 0 ? (
                        rec.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p as any} size="sm" />
                        ))
                      ) : (
                        <PlatformBadge platform={rec.platform as any} size="sm" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="font-mono text-[10px] text-slate-400 truncate block max-w-[160px]"
                      title={rec.id}
                    >
                      {rec.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(rec.created_at)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(rec);
                            setEditText(rec.content);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={t("edit")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(rec)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title={t("delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Broadcast Modal */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onSuccess={loadBroadcasts}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title={t("editBroadcastTitle")}
        maxWidth="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <p className="text-xs text-slate-400">{t("editBroadcastDesc")}</p>
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
              onClick={() => setEditingRecord(null)}
              disabled={isUpdating}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              disabled={!editText.trim()}
            >
              {t("saveAndBroadcast")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleDeleteSingle}
        title={t("broadcastDeleteTitle")}
        message={t("broadcastDeleteMessage")}
        confirmText={t("revokeEverywhere")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
