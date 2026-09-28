import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '../types/chat';
import { chatsApi } from '../api/chats';
import { useToast } from '../contexts/ToastContext';
import { usePermission } from '../permissions/usePermission';
import { useLanguage } from '../contexts/LanguageContext';
import { PermissionGuard } from '../permissions/PermissionGuard';
import { PlatformBadge } from '../components/common/PlatformBadge';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ChatProfileModal } from '../components/chat/ChatProfileModal';
import { ChatLinkingModal } from '../components/linking/ChatLinkingModal';
import { formatDate } from '../utils/date';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit2,
} from 'lucide-react';

export const LinkedChatsPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedChatForProfile, setSelectedChatForProfile] = useState<Chat | null>(null);
  const [selectedChatForDelete, setSelectedChatForDelete] = useState<Chat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await chatsApi.list();
      setChats(res.chats || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch linked chats', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleDelete = async () => {
    if (!selectedChatForDelete) return;
    try {
      setIsDeleting(true);
      await chatsApi.delete(selectedChatForDelete.id);
      showToast(t('success'), 'success');
      setSelectedChatForDelete(null);
      fetchChats();
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink chat', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.platform_chat_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.is_active) ||
      (statusFilter === 'inactive' && !c.is_active);
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const tgCount = chats.filter((c) => c.platform === 'telegram').length;
  const baleCount = chats.filter((c) => c.platform === 'bale').length;
  const activeCount = chats.filter((c) => c.is_active).length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            {t('linkedChatsTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('linkedChatsDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchChats}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('refresh')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowLinkingModal(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('linkChat')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-400">{isFA ? 'کل چت‌های متصل' : 'Total Linked Chats'}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{chats.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-blue-400">{isFA ? 'چت‌های تلگرام' : 'Telegram Chats'}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{tgCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-emerald-400">{isFA ? 'چت‌های بله' : 'Bale Chats'}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{baleCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-xs text-slate-400">{isFA ? 'فعال و همگام' : 'Active Syncing'}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={isFA ? 'جستجو بر اساس عنوان یا شناسه...' : 'Search by title or platform ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{t('allPlatforms')}</option>
            <option value="telegram">Telegram</option>
            <option value="bale">Bale</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
      </div>

      {/* Chats Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{t('chatCol')} / {t('platform')}</th>
                <th className="py-3 px-4">{t('chatId')}</th>
                <th className="py-3 px-4">{t('type')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredChats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">{t('noChatsFound')}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {t('linkChatToBegin')}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredChats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Title & Platform Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <PlatformBadge platform={chat.platform} showText={false} size="md" />
                        <div>
                          <p className="font-semibold text-slate-100">{chat.title}</p>
                          <PlatformBadge platform={chat.platform} size="sm" />
                        </div>
                      </div>
                    </td>

                    {/* Platform Chat ID */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {chat.platform_chat_id}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {chat.chat_type || 'Group'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          chat.is_active
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            chat.is_active ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {chat.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>

                    {/* Linked Date */}
                    <td className="py-3 px-4 text-slate-400">
                      {formatDate(chat.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedChatForProfile(chat)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={t('edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <PermissionGuard
                          resource="chat"
                          action="delete"
                          mode="disable"
                          fallback={
                            <button
                              disabled
                              className="p-1.5 text-slate-600 cursor-not-allowed rounded-lg"
                              title={t('delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedChatForDelete(chat)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Profile & Settings Modal */}
      <ChatProfileModal
        chat={selectedChatForProfile}
        isOpen={!!selectedChatForProfile}
        onClose={() => setSelectedChatForProfile(null)}
        onChatUpdated={fetchChats}
        onChatDeleted={fetchChats}
      />

      {/* Chat Linking Modal */}
      <ChatLinkingModal
        isOpen={showLinkingModal}
        onClose={() => setShowLinkingModal(false)}
        onSuccess={fetchChats}
      />

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedChatForDelete}
        onClose={() => setSelectedChatForDelete(null)}
        onConfirm={handleDelete}
        title={isFA ? 'قطع اتصال چت' : 'Unlink Chat'}
        message={isFA ? `آیا از قطع ارتباط با چت "${selectedChatForDelete?.title}" اطمینان دارید؟` : `Are you sure you want to disconnect "${selectedChatForDelete?.title}"?`}
        confirmText={isFA ? 'بله، قطع اتصال' : 'Yes, Unlink'}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};