import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import {
  Chat,
  ChatListResponse,
  UpdateChatRequest,
  SendLinkChatOTPResponse,
  ChatMessage,
  ChatHistoryResponse,
} from '../types/chat';

export interface ChatFilterParams {
  platform?: string;
  chat_type?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface ChatHistoryFilterParams {
  search?: string;
  media_type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export const chatsApi = {
  list: async (params?: ChatFilterParams): Promise<ChatListResponse> => {
    const { data } = await apiClient.get<ApiResponse<ChatListResponse>>('/chats', {
      params,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to list chats');
    }
    return data.data;
  },

  getByID: async (id: number): Promise<Chat> => {
    const { data } = await apiClient.get<ApiResponse<Chat>>(`/chats/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to get chat');
    }
    return data.data;
  },

  update: async (id: number, payload: UpdateChatRequest): Promise<Chat> => {
    const { data } = await apiClient.put<ApiResponse<Chat>>(`/chats/${id}`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update chat');
    }
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/chats/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete chat');
    }
  },

  sendLinkOTP: async (): Promise<SendLinkChatOTPResponse> => {
    const { data } = await apiClient.post<ApiResponse<SendLinkChatOTPResponse>>('/chats/otp/send');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to generate chat link OTP');
    }
    return {
      ...data.data,
      otp: data.data.code || data.data.otp || '',
      expires_in: data.data.expires_in_seconds || data.data.expires_in || 600,
    };
  },

  getHistory: async (
    chatID: number,
    params?: ChatHistoryFilterParams
  ): Promise<ChatHistoryResponse> => {
    const { data } = await apiClient.get<ApiResponse<ChatHistoryResponse>>(
      `/chats/${chatID}/history`,
      { params }
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch chat history');
    }
    return data.data;
  },

  getMessageByID: async (chatID: number, messageID: number): Promise<ChatMessage> => {
    const { data } = await apiClient.get<ApiResponse<ChatMessage>>(
      `/chats/${chatID}/history/${messageID}`
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch message details');
    }
    return data.data;
  },

  deleteMessage: async (chatID: number, messageID: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/chats/${chatID}/history/${messageID}`
    );
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete message');
    }
  },
};
