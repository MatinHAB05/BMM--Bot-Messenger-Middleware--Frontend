import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { PlatformBadge } from '../common/PlatformBadge';
import { formatDateTime } from '../../utils/date';
import { formatFileSize } from '../../utils/file';
import { attachmentsApi } from '../../api/attachments';
import { useToast } from '../../contexts/ToastContext';
import { usePermission } from '../../permissions/usePermission';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  MoreVertical,
  Download,
  Edit3,
  Trash2,
  Radio,
  FileText,
  Play,
  CheckCheck,
  CheckSquare,
  Square,
  Copy,
  Maximize2,
  X,
  Layers,
} from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onBroadcastEdit?: (message: ChatMessage) => void;
  onBroadcastDelete?: (message: ChatMessage) => void;
  onDeleteLocal?: (message: ChatMessage) => void;
  onContextMenu?: (e: React.MouseEvent, message: ChatMessage) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onBroadcastEdit,
  onBroadcastDelete,
  onDeleteLocal,
  onContextMenu,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<any | null>(null);

  const canEditBroadcast = hasPermission('broadcast', 'update');
  const canDeleteBroadcast = hasPermission('broadcast', 'delete');
  const canDeleteLocal = hasPermission('chat', 'delete-message');

  const isSent = message.direction === 'outgoing' || message.sender_type === 'company_user';

  const handleDownload = async (attachmentId: number, cachedUrl?: string) => {
    if (cachedUrl) {
      window.open(cachedUrl, '_blank');
      return;
    }
    try {
      setIsDownloading(true);
      const url = await attachmentsApi.getDownloadURL(attachmentId);
      window.open(url, '_blank');
    } catch (err: any) {
      showToast(err.message || 'Failed to download attachment', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    showToast(t('copiedToClipboard'), 'info');
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect?.(message);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, message);
    } else {
      setShowMenu(true);
    }
  };

  // Classify attachments
  const attachments = message.attachments || [];
  const visualMedia = attachments.filter(
    (a) =>
      a.file_type === 'photo' ||
      a.file_type === 'video' ||
      /\.(jpe?g|png|gif|webp|bmp|mp4|webm|mov|mkv)$/i.test(a.file_name || '')
  );
  const audioMedia = attachments.filter(
    (a) =>
      a.file_type === 'audio' ||
      a.file_type === 'voice' ||
      /\.(mp3|ogg|wav|m4a|aac)$/i.test(a.file_name || '')
  );
  const docMedia = attachments.filter(
    (a) => !visualMedia.includes(a) && !audioMedia.includes(a)
  );

  const totalAttachments = attachments.length;

  return (
    <>
      <div
        onClick={handleContainerClick}
        onContextMenu={handleRightClick}
        className={`group relative flex flex-col mb-4 transition-colors ${
          isSent ? 'items-end' : 'items-start'
        } ${isSelectionMode ? 'cursor-pointer select-none' : ''}`}
      >
        {/* Sender Header */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
          <PlatformBadge platform={message.platform || 'telegram'} showText={false} size="sm" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {message.sender_name || (isSent ? (isFA ? 'شما' : 'You') : (isFA ? 'مشتری/بات' : 'Customer/Bot'))}
          </span>
          {message.broadcast_uuid && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded font-mono">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              {isFA ? 'برودکست' : 'Broadcast'}
              {totalAttachments > 1 && (
                <span className="text-[9px] text-indigo-300 ml-1 bg-indigo-900/60 px-1 rounded flex items-center gap-0.5">
                  <Layers className="w-2.5 h-2.5" />
                  {totalAttachments}
                </span>
              )}
            </span>
          )}
          <span>•</span>
          <span>{formatDateTime(message.created_at)}</span>
        </div>

        {/* Bubble Row with Selection Checkbox */}
        <div className="relative max-w-[85%] sm:max-w-[75%] flex items-center gap-2">
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(message);
              }}
              className="p-1 text-slate-400 hover:text-blue-400 transition-colors shrink-0"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-500 fill-blue-500/20" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
              )}
            </button>
          )}

          {/* Hover / Trigger Menu Button (When not in selection mode) */}
          {!isSelectionMode && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onContextMenu) {
                    onContextMenu(e, message);
                  } else {
                    setShowMenu(!showMenu);
                  }
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
                title={t('messageOptions')}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Fallback inline menu */}
              {showMenu && !onContextMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-6 z-50 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs">
                    {message.broadcast_uuid && canEditBroadcast && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onBroadcastEdit?.(message);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        {t('broadcastEdit')}
                      </button>
                    )}

                    {message.broadcast_uuid && canDeleteBroadcast && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onBroadcastDelete?.(message);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('broadcastDelete')}
                      </button>
                    )}

                    {message.content && (
                      <button
                        type="button"
                        onClick={(e) => {
                          setShowMenu(false);
                          handleCopyText(e);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        {t('copyText')}
                      </button>
                    )}

                    {canDeleteLocal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDeleteLocal?.(message);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors text-left border-t border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('deleteMessage')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Message Bubble Content */}
          <div
            className={`rounded-2xl p-3 shadow-md text-sm break-words transition-all ${
              isSelected
                ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-500/50 text-slate-900 dark:text-slate-100'
                : isSent
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-indigo-950/90 dark:to-slate-900 border border-blue-200 dark:border-indigo-800/50 text-slate-900 dark:text-slate-100 rounded-tr-sm hover:border-blue-300 dark:hover:border-indigo-600/60 shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            {/* Visual Media Section (Album Grid / Single Media) */}
            {visualMedia.length > 0 && (
              <div className="mb-2">
                {visualMedia.length === 1 ? (
                  /* Single visual media */
                  <div className="rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800 relative group/single max-w-sm">
                    {visualMedia[0].file_type === 'video' ? (
                      visualMedia[0].download_url ? (
                        <video
                          src={visualMedia[0].download_url}
                          controls
                          className="max-h-72 rounded-xl w-full"
                        />
                      ) : (
                        <div className="h-48 flex items-center justify-center bg-slate-800 text-slate-400 rounded-xl gap-2 animate-pulse">
                          <Play className="w-6 h-6 text-purple-400" />
                          <span>{t('videoAttachment')}</span>
                        </div>
                      )
                    ) : visualMedia[0].download_url ? (
                      <img
                        src={visualMedia[0].download_url}
                        alt={visualMedia[0].file_name || 'attachment'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxItem(visualMedia[0]);
                        }}
                        className="max-h-72 rounded-xl object-contain w-full bg-black/40 cursor-pointer hover:opacity-95 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-slate-800 text-slate-400 rounded-xl animate-pulse">
                        <span>{t('photoAttachment')}</span>
                      </div>
                    )}

                    {/* Single Media footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-950/80">
                      <span className="truncate max-w-[200px]">{visualMedia[0].file_name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(visualMedia[0].id, visualMedia[0].download_url);
                        }}
                        disabled={isDownloading}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        {t('download')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Multi-item Album Grid (Telegram-style Media Group) */
                  <div className="space-y-1.5">
                    {/* Album Grid Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Layers className="w-3 h-3" />
                        {isFA ? `آلبوم رسانه‌ای (${visualMedia.length} فایل)` : `Media Album (${visualMedia.length} files)`}
                      </span>
                    </div>

                    <div
                      className={`grid gap-1.5 rounded-xl overflow-hidden max-w-sm sm:max-w-md ${
                        visualMedia.length === 2
                          ? 'grid-cols-2'
                          : visualMedia.length === 3
                          ? 'grid-cols-2'
                          : 'grid-cols-2'
                      }`}
                    >
                      {visualMedia.slice(0, 4).map((att, idx) => {
                        const isVideo = att.file_type === 'video';
                        const isLastAndMore = idx === 3 && visualMedia.length > 4;
                        const remainingCount = visualMedia.length - 3;
                        const isFullWidthSpan = visualMedia.length === 3 && idx === 0;

                        return (
                          <div
                            key={att.id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxItem(att);
                            }}
                            className={`relative group/media overflow-hidden rounded-lg bg-slate-950/80 border border-slate-800/80 cursor-pointer transition-transform hover:scale-[1.01] ${
                              isFullWidthSpan
                                ? 'col-span-2 aspect-[16/9]'
                                : 'aspect-square'
                            }`}
                          >
                            {att.download_url ? (
                              isVideo ? (
                                <div className="w-full h-full relative bg-black/60 flex items-center justify-center">
                                  <video
                                    src={att.download_url}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-purple-600/80 flex items-center justify-center text-white shadow-lg">
                                      <Play className="w-5 h-5 ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={att.download_url}
                                  alt={att.file_name || 'media'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800/80 text-slate-500 animate-pulse text-xs">
                                <span>Loading…</span>
                              </div>
                            )}

                            {/* +N More Overlay */}
                            {isLastAndMore && (
                              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-white font-bold text-lg">
                                <span>+{remainingCount}</span>
                                <span className="text-[10px] text-slate-300 font-normal mt-0.5">
                                  {isFA ? 'بیشتر' : 'more'}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay with zoom & download */}
                            {!isLastAndMore && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="p-1.5 rounded-lg bg-black/60 text-white hover:text-blue-400">
                                  <Maximize2 className="w-4 h-4" />
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(att.id, att.download_url);
                                  }}
                                  className="p-1.5 rounded-lg bg-black/60 text-white hover:text-emerald-400"
                                  title={t('download')}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio Attachments */}
            {audioMedia.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {audioMedia.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1"
                  >
                    {att.download_url && (
                      <audio src={att.download_url} controls className="w-full h-8" />
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="truncate max-w-[180px]">{att.file_name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(att.id, att.download_url);
                        }}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        {t('download')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Document Attachments */}
            {docMedia.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {docMedia.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{att.file_name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(att.id, att.download_url);
                      }}
                      disabled={isDownloading}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3 h-3" />
                      {t('download')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Shared Caption Text Content (Below all attachments) */}
            {message.content && (
              <div className={totalAttachments > 0 ? 'pt-1.5 border-t border-slate-200 dark:border-slate-800/80 mt-1' : ''}>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-900 dark:text-slate-100 text-sm">
                  {message.content}
                </p>
              </div>
            )}

            {/* Delivery & Status footer */}
            <div className="flex items-center justify-end gap-1.5 mt-1.5 pt-0.5 text-[10px] text-slate-400">
              {message.status && <span className="capitalize">{message.status}</span>}
              {isSent && <CheckCheck className="w-3 h-3 text-blue-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Media Preview Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold truncate max-w-md">
                  {lightboxItem.file_name}
                </span>
                {lightboxItem.file_size && (
                  <span className="text-xs text-slate-400">
                    ({formatFileSize(lightboxItem.file_size)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(lightboxItem.id, lightboxItem.download_url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
                  title={t('download')}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('download')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="flex items-center justify-center max-h-[78vh] max-w-full overflow-hidden rounded-xl">
              {lightboxItem.file_type === 'video' ? (
                <video
                  src={lightboxItem.download_url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-xl shadow-2xl"
                />
              ) : (
                <img
                  src={lightboxItem.download_url}
                  alt={lightboxItem.file_name}
                  className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};