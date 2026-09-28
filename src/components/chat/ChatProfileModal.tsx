import React, { useState, useEffect } from 'react';
import { Chat } from '../../types/chat';
import { chatsApi } from '../../api/chats';
import { useToast } from '../../contexts/ToastContext';
import { usePermission } from '../../permissions/usePermission';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { PlatformBadge } from '../common/PlatformBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatDate } from '../../utils/date';
import { ShieldAlert, Trash2, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';

interface ChatProfileModalProps {
  chat: Chat | null;
  isOpen: boolean;
  onClose: () => void;
  onChatUpdated: (updatedChat: Chat) => void;
  onChatDeleted: (chatId: number) => void;
}

export const ChatProfileModal: React.FC<ChatProfileModalProps> = ({
  chat,
  isOpen,
  onClose,
  onChatUpdated,
  onChatDeleted,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();

  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

  const canUpdate = hasPermission('chat', 'update');
  const canDelete = hasPermission('chat', 'delete');

  useEffect(() => {
    if (chat) {
      setTitle(chat.title || '');
      setIsActive(chat.is_active ?? true);
    }
  }, [chat]);

  if (!chat) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      showToast('You do not have permission to update chat details', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await chatsApi.update(chat.id, {
        title: title.trim(),
        is_active: isActive,
      });
      showToast('Chat settings updated successfully', 'success');
      onChatUpdated(updated);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update chat', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlink = async () => {
    if (!canDelete) {
      showToast('You do not have permission to unlink this chat', 'warning');
      return;
    }

    try {
      setIsDeleting(true);
      await chatsApi.delete(chat.id);
      showToast('Chat unlinked successfully', 'success');
      setShowConfirmUnlink(false);
      onChatDeleted(chat.id);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink chat', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chat Profile & Settings"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="p-3 rounded-xl bg-slate-800/80">
              <PlatformBadge platform={chat.platform} showText={false} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-white truncate">
                  {chat.title}
                </h4>
                <PlatformBadge platform={chat.platform} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Platform Chat ID: <span className="font-mono text-slate-300">{chat.platform_chat_id}</span>
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  chat.is_active
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                    : 'bg-red-950/60 text-red-400 border border-red-800/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    chat.is_active ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                {chat.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Chat Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Internal ID</span>
              <span className="font-mono text-slate-200">{chat.id}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Chat Type</span>
              <span className="capitalize font-medium text-slate-200">{chat.chat_type || 'Supergroup'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Linked At</span>
              <span className="text-slate-200">{formatDate(chat.created_at)}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Last Sync / Activity</span>
              <span className="text-slate-200">{chat.updated_at ? formatDate(chat.updated_at) : 'N/A'}</span>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Chat Title / Label"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter custom chat title"
              disabled={!canUpdate || isSaving}
              helperText={!canUpdate ? 'Only users with edit permissions can modify this title' : undefined}
            />

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-200">Active Status</p>
                <p className="text-xs text-slate-400">
                  Allow sending and receiving messages for this chat
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!canUpdate || isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {canUpdate && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  disabled={!title.trim()}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>

          {/* Danger Zone: Unlink Chat */}
          {canDelete && (
            <div className="pt-4 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Unlink Chat
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Disconnect this chat from your company. The bot will stop synchronizing messages.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setShowConfirmUnlink(true)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Unlink
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmUnlink}
        onClose={() => setShowConfirmUnlink(false)}
        onConfirm={handleUnlink}
        title="Unlink Chat Confirmation"
        message={`Are you sure you want to unlink "${chat.title}"? The bot will no longer manage messages for this chat.`}
        confirmText="Yes, Unlink Chat"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
