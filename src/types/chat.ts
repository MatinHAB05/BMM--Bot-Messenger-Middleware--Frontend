export type MessengerPlatform = 'telegram' | 'bale';
export type ChatType = 'channel' | 'group' | 'supergroup';

export interface Chat {
  id: number;
  company_id?: number | null;
  platform: MessengerPlatform;
  platform_chat_id: string;
  title: string;
  username?: string;
  chat_type: ChatType;
  is_private: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatListResponse {
  chats: Chat[];
  total: number;
  page: number;
  page_size: number;
}

export interface UpdateChatRequest {
  title?: string;
  username?: string;
  is_active?: boolean;
}

export interface SendLinkChatOTPResponse {
  message: string;
  expires_in_seconds: number;
  expires_in?: number;
  code?: string;
  otp?: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  platform_message_id: number;
  sender_id?: string;
  sender_name?: string;
  sender_type?: 'company_user' | 'bot' | 'customer' | string;
  direction?: 'incoming' | 'outgoing' | string;
  platform?: MessengerPlatform | string;
  content: string;
  media_type: string;
  message_timestamp: string;
  created_at: string;
  updated_at?: string;
  is_broadcast: boolean;
  broadcast_uuid?: string | null;
  has_attachments: boolean;
  attachments?: any[];
  status?: string;
  raw_payload?: any;
  related_message_ids?: number[];
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  page_size: number;
}
