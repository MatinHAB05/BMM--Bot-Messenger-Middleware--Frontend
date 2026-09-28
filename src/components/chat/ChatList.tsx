import React, { useState } from 'react';
import { Chat, ChatMessage } from '../../types/chat';
import { PlatformBadge } from '../common/PlatformBadge';
import { formatMessageTime, formatDate } from '../../utils/date';
import { Search, Plus, RefreshCw, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ChatPreviewInfo {
  lastMessage: ChatMessage | null;
  unseenCount: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId: number | null;
  onSelectChat: (chat: Chat) => void;
  onOpenLinkModal: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  previews?: Record<number, ChatPreviewInfo>;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onOpenLinkModal,
  isLoading,
  onRefresh,
  previews = {},
}) => {
  const { t, isFA } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'telegram' | 'bale'>('all');

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.platform_chat_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="w-80 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col shrink-0 select-none">
      {/* Top Header / Actions */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              {t('linkedChats')} ({chats.length})
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t('refreshChats')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onOpenLinkModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
              title={t('linkChat')}
            >
              <Plus className="w-3.5 h-3.5" />
              {t('linkChat')}
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('searchChatsPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
              platformFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t('all')}
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('telegram')}
            className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
              platformFilter === 'telegram'
                ? 'bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Telegram
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('bale')}
            className={`flex-1 py-1 rounded-md font-medium transition-all cursor-pointer ${
              platformFilter === 'bale'
                ? 'bg-emerald-100 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Bale
          </button>
        </div>
      </div>

      {/* Chat Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/60 scrollbar-thin">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {searchTerm || platformFilter !== 'all' ? t('noChatsFound') : (isFA ? 'هنوز چتی متصل نشده است' : 'No chats connected yet')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              {t('linkChatToBegin')}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const preview = previews[chat.id];
            const lastMsg = preview?.lastMessage;
            const unseenCount = preview?.unseenCount || 0;

            const getLastSnippet = () => {
              if (!lastMsg) return null;
              let prefix = '';
              if (lastMsg.direction === 'outgoing' || lastMsg.sender_type === 'company_user') {
                prefix = isFA ? 'شما: ' : 'You: ';
              } else if (lastMsg.sender_name) {
                prefix = `${lastMsg.sender_name}: `;
              }

              let text = lastMsg.content || '';
              if (lastMsg.has_attachments || (lastMsg.attachments && lastMsg.attachments.length > 0)) {
                const firstType = lastMsg.attachments?.[0]?.file_type || lastMsg.media_type;
                let icon = '📎';
                if (firstType === 'photo' || /photo|image/i.test(firstType || '')) icon = '📷';
                else if (firstType === 'video' || /video/i.test(firstType || '')) icon = '🎥';
                else if (firstType === 'audio' || firstType === 'voice' || /audio|voice/i.test(firstType || '')) icon = '🎵';
                else icon = '📁';

                text = text ? `${icon} ${text}` : `${icon} ${firstType || (isFA ? 'پیوست' : 'Attachment')}`;
              }

              return `${prefix}${text}`;
            };

            const displayTime = lastMsg
              ? formatMessageTime(lastMsg.message_timestamp || lastMsg.created_at)
              : formatDate(chat.updated_at || chat.created_at);

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-slate-900 border-l-4 border-l-blue-600 shadow-xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 border-l-4 border-l-transparent'
                }`}
              >
                {/* Platform Icon Badge */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-xs">
                    <PlatformBadge platform={chat.platform} showText={false} size="md" />
                  </div>
                  {/* Active status indicator dot */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${
                      chat.is_active ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                    title={chat.is_active ? t('active') : t('inactive')}
                  />
                </div>

                {/* Chat details snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {chat.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                      {displayTime}
                    </span>
                  </div>

                  {/* Last message snippet & Unread count badge */}
                  <div className="flex items-center justify-between gap-1.5 mt-0.5 min-h-[16px]">
                    <p className={`text-[11px] truncate flex-1 ${
                      unseenCount > 0
                        ? 'font-semibold text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {getLastSnippet() || (
                        <span className="italic text-slate-400 dark:text-slate-500 text-[10px]">
                          {isFA ? 'بدون پیام' : 'No messages'}
                        </span>
                      )}
                    </p>

                    {unseenCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-xs animate-in zoom-in-75 duration-100">
                        {unseenCount > 99 ? '99+' : unseenCount}
                      </span>
                    )}
                  </div>

                  {/* Platform & Chat Type Info */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium">
                      {chat.chat_type || 'Group'}
                    </span>
                    <span className="truncate font-mono">
                      {chat.platform_chat_id}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};