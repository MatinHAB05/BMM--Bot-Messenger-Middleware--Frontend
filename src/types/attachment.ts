export interface Attachment {
  id: number;
  chat_history_id: number;
  platform_file_id: string;
  file_type: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail_platform_file_id?: string;
  storage_path?: string;
  thumbnail_storage_path?: string;
  width?: number;
  height?: number;
  duration?: number;
  created_at: string;
  /**
   * NOT part of the API response. Populated on the client after we
   * resolve a presigned download URL for this attachment (see
   * attachmentsApi.getDownloadURLsBatch). Absent until then.
   */
  download_url?: string;
}

export interface AttachmentListResponse {
  attachments: Attachment[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateAttachmentRequest {
  id?: number;
  file_name?: string;
  mime_type?: string;
  thumbnail_platform_file_id?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface DownloadLinkResponse {
  [key: string]: string;
}
