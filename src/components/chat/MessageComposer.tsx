import React, { useState, useRef } from 'react';
import { Smile, Paperclip, Send, X, AlertCircle, FileText, Image as ImageIcon, Video, Music } from 'lucide-react';
import { BroadcastAttachmentType } from '../../types/broadcast';
import { validateAttachmentBatch, formatFileSize } from '../../utils/file';
import { EmojiPicker } from './EmojiPicker';
import { useLanguage } from '../../contexts/LanguageContext';
import { ALL_SUPPORTED_PLATFORMS } from '../../types/chat';

interface MessageComposerProps {
  onSendMessage: (
    text: string,
    files: File[],
    attachmentType?: BroadcastAttachmentType,
    platforms?: string[]
  ) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  defaultPlatform?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
  defaultPlatform,
}) => {
  const { t, isFA } = useLanguage();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentType, setAttachmentType] = useState<BroadcastAttachmentType | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    ALL_SUPPORTED_PLATFORMS
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const validation = validateAttachmentBatch(selected);
    if (!validation.isValid) {
      setFileError(validation.error || (isFA ? 'تمامی فایل‌ها باید از یک دسته رسانه باشند' : 'All files must belong to the same media category'));
      e.target.value = '';
      return;
    }

    setFileError(null);
    setFiles(selected);
    setAttachmentType(validation.detectedType);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setFiles([]);
      setAttachmentType(undefined);
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      const validation = validateAttachmentBatch(updated);
      setFiles(updated);
      setAttachmentType(validation.detectedType);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || isLoading || disabled) return;
    try {
      await onSendMessage(text.trim(), files, attachmentType, selectedPlatforms);
      setText('');
      setFiles([]);
      setAttachmentType(undefined);
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Handled in caller
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const getMediaIcon = (type?: BroadcastAttachmentType) => {
    switch (type) {
      case 'photo':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
      case 'audio':
      case 'voice':
        return <Music className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="relative border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 flex flex-col gap-2">
      {/* File Validation Error Banner */}
      {fileError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span className="flex-1 font-medium">{fileError}</span>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="p-1 hover:text-red-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Files Preview Chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
            {getMediaIcon(attachmentType)}
            <span>{t('batchType', { type: attachmentType || '', count: files.length, s: files.length > 1 ? 's' : '' })}</span>
          </div>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <span className="max-w-[140px] truncate">{file.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-0.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title={t('removeFile')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-3 z-50">
          <EmojiPicker
            onSelect={(emoji) => {
              setText((prev) => prev + emoji);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Main Composer Row */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          id="composer-file-input"
          disabled={disabled || isLoading}
        />
        <label
          htmlFor="composer-file-input"
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title={t('attachFilesTooltip')}
        >
          <Paperclip className="w-5 h-5" />
        </label>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition-colors shrink-0 cursor-pointer ${
            showEmojiPicker
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={t('insertEmojiTooltip')}
          disabled={disabled || isLoading}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? t('selectChatPlaceholder') : t('typeMessagePlaceholder')}
            disabled={disabled || isLoading}
            rows={2}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 resize-none transition-all"
          />
        </div>

        {/* Platform Targets Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => togglePlatform('telegram')}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              selectedPlatforms.includes('telegram')
                ? 'bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/50 font-semibold'
                : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
            title="Telegram"
          >
            TG
          </button>
          <button
            type="button"
            onClick={() => togglePlatform('bale')}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              selectedPlatforms.includes('bale')
                ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 font-semibold'
                : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
            title="Bale"
          >
            Bale
          </button>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isLoading || (!text.trim() && files.length === 0)}
          className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-200 dark:disabled:from-slate-800 disabled:to-slate-200 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          title={t('sendBroadcastTooltip')}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};