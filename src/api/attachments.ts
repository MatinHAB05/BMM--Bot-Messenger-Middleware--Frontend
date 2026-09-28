import { apiClient } from "./client";
import { ApiResponse } from "../types/auth";
import {
  Attachment,
  AttachmentListResponse,
  UpdateAttachmentRequest,
} from "../types/attachment";

export interface AttachmentFilterParams {
  limit?: number;
  offset?: number;
  sort?: string;
  file_type?: string;
}

export const attachmentsApi = {
  list: async (
    params?: AttachmentFilterParams,
  ): Promise<AttachmentListResponse> => {
    const { data } = await apiClient.get<ApiResponse<AttachmentListResponse>>(
      "/attachments",
      {
        params,
      },
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to list attachments");
    }
    return data.data;
  },

  getByID: async (id: number): Promise<Attachment> => {
    const { data } = await apiClient.get<ApiResponse<Attachment>>(
      `/attachments/${id}`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to get attachment");
    }
    return data.data;
  },

  getDownloadURL: async (id: number): Promise<string> => {
    const { data } = await apiClient.post<ApiResponse<string>>(
      `/attachments/${id}/links/download`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to generate download URL");
    }
    return data.data;
  },

  // getDownloadURLsBatch resolves presigned download links for an
  // arbitrary set of attachment ids in ONE request, regardless of which
  // message(s) they belong to. This is what ChatWindow uses to resolve
  // every attachment on screen after a fetch/poll, instead of one
  // request per attachment.
  //
  // Backend note: BatchGetDownloadLinksAttachmentsByAttachmentID is
  // wired at POST /attachments/:id/links/download/batch. The handler
  // ignores the :id path param entirely and reads the full id list from
  // the body -- so the path id is just a placeholder, and we use the
  // first id in the batch to satisfy the route.
  getDownloadURLsBatch: async (
    attachmentIDs: number[],
  ): Promise<Record<number, string>> => {
    if (attachmentIDs.length === 0) return {};
    const anchorId = attachmentIDs[0];
    const { data } = await apiClient.post<ApiResponse<Record<number, string>>>(
      `/attachments/${anchorId}/links/download/batch`,
      { attachment_ids: attachmentIDs },
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to get attachment download links");
    }
    return data.data;
  },

  getByMessageIDs: async (
    chatHistoryIDs: number[],
  ): Promise<Record<number, Attachment[]>> => {
    const { data } = await apiClient.post<
      ApiResponse<Record<number, Attachment[]>>
    >("/attachments/by-messages", { chat_history_ids: chatHistoryIDs });
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to fetch message attachments");
    }
    return data.data;
  },

  getForMessage: async (
    chatID: number,
    messageID: number,
  ): Promise<Attachment[]> => {
    const { data } = await apiClient.get<ApiResponse<Attachment[]>>(
      `/chats/${chatID}/history/${messageID}/attachments`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to get message attachments");
    }
    return data.data;
  },

  getDownloadURLsForMessage: async (
    chatID: number,
    messageID: number,
  ): Promise<Record<number, string>> => {
    const { data } = await apiClient.post<ApiResponse<Record<number, string>>>(
      `/chats/${chatID}/history/${messageID}/attachments/links/download`,
    );
    if (!data.success || !data.data) {
      throw new Error(
        data.error || "Failed to get message attachment download links",
      );
    }
    return data.data;
  },

  update: async (
    id: number,
    payload: UpdateAttachmentRequest,
  ): Promise<Attachment> => {
    const { data } = await apiClient.put<ApiResponse<Attachment>>(
      `/attachments/${id}`,
      payload,
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to update attachment");
    }
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/attachments/${id}`,
    );
    if (!data.success) {
      throw new Error(data.error || "Failed to delete attachment");
    }
  },

  deleteBatch: async (ids: number[]): Promise<void> => {
    const { data } = await apiClient.delete<
      ApiResponse<{ message: string; count: number }>
    >("/attachments/batch", { data: { ids } });
    if (!data.success) {
      throw new Error(data.error || "Failed to delete attachments batch");
    }
  },

  restore: async (id: number): Promise<Attachment> => {
    const { data } = await apiClient.post<ApiResponse<Attachment>>(
      `/attachments/${id}/restore`,
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || "Failed to restore attachment");
    }
    return data.data;
  },
};
