import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import {
  BroadcastResponse,
  BroadcastAttachmentType,
  UpdateBroadcastPayload,
  DeleteBroadcastPayload,
  DeleteBroadcastBatchPayload,
} from '../types/broadcast';

export interface SendBroadcastOptions {
  message?: string;
  platforms: string[];
  attachmentType?: BroadcastAttachmentType;
  files?: File[];
}

export interface BroadcastListItem {
  broadcast_uuid: string;
  content: string;
  chat_id: number;
  chat_title: string;
  platform: string;
  sender_name?: string;
  created_at: string;
  message_id: number;
}

export const broadcastsApi = {
  send: async (options: SendBroadcastOptions): Promise<BroadcastResponse> => {
    if (options.files && options.files.length > 0) {
      const formData = new FormData();
      if (options.message) {
        formData.append('message', options.message);
      }
      options.platforms.forEach((platform) => {
        formData.append('platforms', platform);
      });
      if (options.attachmentType) {
        formData.append('attachment_type', options.attachmentType);
      }
      options.files.forEach((file) => {
        formData.append('attachment', file);
      });

      const { data } = await apiClient.post<ApiResponse<BroadcastResponse>>(
        '/broadcast',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to send broadcast');
      }
      return data.data;
    } else {
      const payload = {
        message: options.message || '',
        platforms: options.platforms,
      };
      const { data } = await apiClient.post<ApiResponse<BroadcastResponse>>(
        '/broadcast',
        payload
      );
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to send broadcast');
      }
      return data.data;
    }
  },

  update: async (broadcastUUID: string, payload: UpdateBroadcastPayload): Promise<void> => {
    const formattedPayload = {
      platforms: payload.platforms,
      message:
        typeof payload.message === 'string'
          ? { content: payload.message }
          : payload.message,
    };

    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      `/broadcast/${broadcastUUID}`,
      formattedPayload
    );
    if (!data.success) {
      throw new Error(data.error || 'Failed to update broadcast');
    }
  },

  delete: async (broadcastUUID: string, payload: DeleteBroadcastPayload): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/broadcast/${broadcastUUID}`,
      { data: payload }
    );
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete broadcast');
    }
  },

  deleteBatch: async (payload: DeleteBroadcastBatchPayload): Promise<void> => {
    const formattedPayload = {
      platforms: payload.platforms,
      brodcast_ids: payload.brodcast_ids || payload.broadcast_ids || payload.uuids || [],
    };

    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      '/broadcast/batch',
      { data: formattedPayload }
    );
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete broadcast batch');
    }
  },
};
