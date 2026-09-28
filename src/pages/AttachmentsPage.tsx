import React, { useState, useEffect, useCallback } from 'react';
import { Attachment } from '../types/attachment';
import { attachmentsApi } from '../api/attachments';
import { useToast } from '../contexts/ToastContext';
import { usePermission } from '../permissions/usePermission';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatFileSize } from '../utils/file';
import { formatDate } from '../utils/date';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Download,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';

export const AttachmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Attachment Modal
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Single Delete state
  const [deletingAttachment, setDeletingAttachment] = useState<Attachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch Delete state
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const canDeleteAttachment = hasPermission('attachment', 'delete');
  const canUpdateAttachment = hasPermission('attachment', 'update');

  const fetchAttachments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 100 };
      if (fileTypeFilter !== 'all') {
        params.file_type = fileTypeFilter;
      }
      const res = await attachmentsApi.list(params);
      setAttachments(res.attachments || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch media attachments', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fileTypeFilter]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleDownload = async (attachment: Attachment) => {
    try {
      const url = await attachmentsApi.getDownloadURL(attachment.id);
      window.open(url, '_blank');
    } catch (err: any) {
      showToast(err.message || 'Failed to get download URL', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttachment || !editFileName.trim()) return;

    try {
      setIsUpdating(true);
      await attachmentsApi.update(editingAttachment.id, {
        file_name: editFileName.trim(),
      });
      showToast(t('success'), 'success');
      setEditingAttachment(null);
      fetchAttachments();
    } catch (err: any) {
      showToast(err.message || 'Failed to update attachment', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingAttachment) return;
    try {
      setIsDeleting(true);
      await attachmentsApi.delete(deletingAttachment.id);
      showToast(t('success'), 'success');
      setDeletingAttachment(null);
      fetchAttachments();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete attachment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBatchDeleting(true);
      await attachmentsApi.deleteBatch(selectedIds);
      showToast(t('success'), 'success');
      setSelectedIds([]);
      setShowBatchDeleteConfirm(false);
      fetchAttachments();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete selected attachments', 'error');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAttachments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAttachments.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredAttachments = attachments.filter((att) => {
    return (
      (att.file_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.file_type || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="w-4 h-4 text-blue-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'voice':
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {t('attachmentsTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('attachmentsDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && canDeleteAttachment && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowBatchDeleteConfirm(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              {t('deleteSelected', { count: selectedIds.length })}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchAttachments}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={isFA ? 'جستجو بر اساس نام فایل یا دسته‌بندی...' : 'Search by file name or category...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{isFA ? 'همه انواع فایل' : 'All File Types'}</option>
            <option value="photo">{isFA ? 'عکس / تصویر' : 'Photos / Images'}</option>
            <option value="video">{isFA ? 'ویدیو' : 'Videos'}</option>
            <option value="audio">{isFA ? 'صدا / ویس' : 'Audio / Voice'}</option>
            <option value="document">{isFA ? 'اسناد' : 'Documents'}</option>
          </select>
        </div>
      </div>

      {/* Attachments Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 hover:text-white cursor-pointer"
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredAttachments.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">{t('fileName')}</th>
                <th className="py-3 px-4">{t('type')}</th>
                <th className="py-3 px-4">{t('fileSize')}</th>
                <th className="py-3 px-4">{isFA ? 'شناسه پیام' : 'Message ID'}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAttachments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">{isFA ? 'فایلی یافت نشد' : 'No attachments found'}</p>
                    <p className="text-xs text-slate-600 mt-1">{isFA ? 'فایل‌های ارسال‌شده در چت‌ها در اینجا نمایش داده می‌شوند.' : 'Files sent in chats will show up here.'}</p>
                  </td>
                </tr>
              ) : (
                filteredAttachments.map((att) => {
                  const isSelected = selectedIds.includes(att.id);

                  return (
                    <tr
                      key={att.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(att.id)}
                          className="p-1 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* File Name & Preview Icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                            {getMediaIcon(att.file_type)}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-semibold text-slate-100 truncate" title={att.file_name}>
                              {att.file_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: #{att.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {att.file_type}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 text-slate-300">
                        {formatFileSize(att.file_size)}
                      </td>

                      {/* Message History Reference */}
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {att.chat_history_id ? `#${att.chat_history_id}` : '—'}
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(att.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(att)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title={t('download')}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {canUpdateAttachment && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAttachment(att);
                                setEditFileName(att.file_name || '');
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title={t('edit')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDeleteAttachment && (
                            <button
                              type="button"
                              onClick={() => setDeletingAttachment(att)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title={t('delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={!!editingAttachment}
        onClose={() => setEditingAttachment(null)}
        title={isFA ? 'ویرایش مشخصات فایل' : 'Edit Attachment Metadata'}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label={t('fileName')}
            value={editFileName}
            onChange={(e) => setEditFileName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingAttachment(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              disabled={!editFileName.trim()}
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingAttachment}
        onClose={() => setDeletingAttachment(null)}
        onConfirm={handleDeleteSingle}
        title={t('delete')}
        message={isFA ? `آیا از حذف پیوست "${deletingAttachment?.file_name}" اطمینان دارید؟` : `Are you sure you want to delete attachment "${deletingAttachment?.file_name}"?`}
        confirmText={t('delete')}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Batch Delete Confirmation */}
      <ConfirmDialog
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title={t('delete')}
        message={isFA ? `آیا از حذف دائمی ${selectedIds.length} فایل انتخاب‌شده اطمینان دارید؟` : `Are you sure you want to permanently delete ${selectedIds.length} selected attachment(s)?`}
        confirmText={t('delete')}
        variant="danger"
        isLoading={isBatchDeleting}
      />
    </div>
  );
};