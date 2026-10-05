import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, ChatMessage } from '../types/chat';
import { chatsApi } from '../api/chats';
import { useToast } from '../contexts/ToastContext';
import { ChatList, ChatPreviewInfo } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ChatLinkingModal } from '../components/linking/ChatLinkingModal';

const SEEN_STORAGE_KEY = 'bmm_last_seen_messages_v1';

const getStoredSeenIds = (): Record<number, number> => {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const storeSeenId = (chatId: number, msgId: number) => {
  try {
    const current = getStoredSeenIds();
    current[chatId] = msgId;
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Non-fatal
  }
};

export const MessagingPage: React.FC = () => {
  const { showToast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [previews, setPreviews] = useState<Record<number, ChatPreviewInfo>>({});
  const [pollIntervalMs, setPollIntervalMs] = useState<number | null>(4000);

  const selectedChatRef = useRef<Chat | null>(null);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Fetch previews (last message & unseen count) for all chats
  const fetchPreviews = useCallback(async (chatList: Chat[]) => {
    if (!chatList || chatList.length === 0) return;
    const seenMap = getStoredSeenIds();
    const activeChatId = selectedChatRef.current?.id || null;

    const results = await Promise.allSettled(
      chatList.map(async (c) => {
        try {
          const hist = await chatsApi.getHistory(c.id, { limit: 15 });
          const msgs = (hist.messages || []).sort(
            (a, b) => new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
          );
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

          let unseen = 0;
          if (lastMsg) {
            if (c.id === activeChatId) {
              unseen = 0;
              storeSeenId(c.id, lastMsg.id);
            } else {
              const seenId = seenMap[c.id] || 0;
              unseen = msgs.filter((m) => m.id > seenId).length;
            }
          }
          return { chatId: c.id, lastMessage: lastMsg, unseenCount: unseen };
        } catch {
          return { chatId: c.id, lastMessage: null, unseenCount: 0 };
        }
      })
    );

    const newPreviews: Record<number, ChatPreviewInfo> = {};
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        newPreviews[r.value.chatId] = {
          lastMessage: r.value.lastMessage,
          unseenCount: r.value.unseenCount,
        };
      }
    });

    setPreviews((prev) => ({ ...prev, ...newPreviews }));
  }, []);

  const fetchChats = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setIsLoading(true);
      const res = await chatsApi.list();
      const chatList = res.chats || [];
      setChats(chatList);

      // Keep selected chat updated if it exists in the new list
      setSelectedChat((current) => {
        if (!current) {
          return chatList.length > 0 ? chatList[0] : null;
        }
        const updated = chatList.find((c) => c.id === current.id);
        return updated || (chatList.length > 0 ? chatList[0] : null);
      });

      // Fetch previews for all chats
      fetchPreviews(chatList);
    } catch (err: any) {
      if (!quiet) {
        showToast(err.message || 'Failed to load chats', 'error');
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [fetchPreviews, showToast]);

  // Initial load
  useEffect(() => {
    fetchChats(false);
  }, [fetchChats]);

  // Periodic polling for newly linked chats & background unseen message counts (synced with ChatWindow polling)
  useEffect(() => {
    if (pollIntervalMs === null) return;

    const interval = setInterval(() => {
      fetchChats(true);
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [fetchChats, pollIntervalMs]);

  // When a chat is selected, immediately mark its unseen messages as seen
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setPreviews((prev) => {
      const current = prev[chat.id];
      if (current?.lastMessage) {
        storeSeenId(chat.id, current.lastMessage.id);
      }
      return {
        ...prev,
        [chat.id]: {
          lastMessage: current?.lastMessage || null,
          unseenCount: 0,
        },
      };
    });
  };

  // When active chat receives or updates messages in ChatWindow
  const handleActiveChatMessages = (chatId: number, messages: ChatMessage[]) => {
    if (!messages || messages.length === 0) return;
    const latestMsg = messages[messages.length - 1];
    storeSeenId(chatId, latestMsg.id);

    setPreviews((prev) => ({
      ...prev,
      [chatId]: {
        lastMessage: latestMsg,
        unseenCount: 0,
      },
    }));
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Pane: Chat List */}
      <ChatList
        chats={chats}
        selectedChatId={selectedChat?.id || null}
        onSelectChat={handleSelectChat}
        onOpenLinkModal={() => setShowLinkingModal(true)}
        isLoading={isLoading}
        onRefresh={() => fetchChats(false)}
        previews={previews}
      />

      {/* Right Pane: Chat Window & Composer */}
      <ChatWindow
        chat={selectedChat}
        onOpenLinkModal={() => setShowLinkingModal(true)}
        onChatUpdated={() => fetchChats(true)}
        onActiveChatMessages={handleActiveChatMessages}
        pollIntervalMs={pollIntervalMs}
        onPollIntervalChange={setPollIntervalMs}
      />

      {/* Chat Linking Modal */}
      <ChatLinkingModal
        isOpen={showLinkingModal}
        onClose={() => setShowLinkingModal(false)}
        onSuccess={() => {
          fetchChats(false);
        }}
      />
    </div>
  );
};