import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { broadcastsApi } from '../../api/broadcasts';
import { useToast } from '../../contexts/ToastContext';
import { BroadcastAttachmentType } from '../../types/broadcast';
import { validateAttachmentBatch, formatFileSize } from '../../utils/file';
import { Radio, Paperclip, X, AlertCircle, Send, FileText, Image as ImageIcon, Video, Music } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [message, setMessage] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['telegram', 'bale']);
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentType, setAttachmentType] = useState<BroadcastAttachmentType | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) {
        showToast('At least one target platform must be selected', 'warning');
        return;
      }
      setPlatforms(platforms.filter((item) => item !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const validation = validateAttachmentBatch(selected);
    if (!validation.isValid) {
      setFileError(validation.error || 'All files must belong to the same media category');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) {
      showToast('Please provide a message or attach files to broadcast', 'warning');
      return;
    }

    try {
      setIsSending(true);
      await broadcastsApi.send({
        message: message.trim(),
        platforms,
        attachmentType,
        files,
      });

      showToast('Broadcast published successfully across platforms!', 'success');
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send broadcast', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setFiles([]);
    setAttachmentType(undefined);
    setFileError(null);
    setPlatforms(['telegram', 'bale']);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Multi-Platform Broadcast"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Broadcast a message or announcement simultaneously across all connected company chats and channels on selected platforms.
        </p>

        {/* Platform Targets Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Target Platforms
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => togglePlatform('telegram')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                platforms.includes('telegram')
                  ? 'border-blue-500/80 bg-blue-950/30 text-blue-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-400">
                TG
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Telegram Chats</p>
                <p className="text-[10px] text-slate-400">All linked groups & channels</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => togglePlatform('bale')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                platforms.includes('bale')
                  ? 'border-emerald-500/80 bg-emerald-950/30 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-500'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-400">
                BL
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">Bale Chats</p>
                <p className="text-[10px] text-slate-400">All linked groups & channels</p>
              </div>
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Broadcast Content
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your broadcast announcement..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Strict Single Media-Type Attachments Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-blue-400" />
              Attachments
            </label>
            <span className="text-[11px] text-slate-400">
              Rule: Single media category per batch
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            id="broadcast-file-input"
          />

          <label
            htmlFor="broadcast-file-input"
            className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-colors text-xs text-slate-300"
          >
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span>Click to browse and attach files (Images, Documents, Videos, or Audio)</span>
          </label>

          {/* Validation Error Banner */}
          {fileError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="flex-1 font-medium">{fileError}</span>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className="p-1 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attachment Preview Chips */}
          {files.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Batch Type: {attachmentType} ({files.length} file{files.length > 1 ? 's' : ''})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setAttachmentType(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700"
                  >
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-0.5 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSending}
            disabled={!message.trim() && files.length === 0}
            leftIcon={<Radio className="w-4 h-4" />}
          >
            Publish Broadcast
          </Button>
        </div>
      </form>
    </Modal>
  );
};
