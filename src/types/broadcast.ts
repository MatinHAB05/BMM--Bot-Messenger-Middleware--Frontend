export type BroadcastAttachmentType =
  | 'photo'
  | 'video'
  | 'voice'
  | 'document'
  | 'animation'
  | 'audio';

export interface BroadcastTarget {
  name: string;
  platform: string;
  is_private: boolean;
  type: string;
}

export interface BroadcastResult {
  platform: string;
  success: boolean;
  error?: string[];
}

export interface BroadcastResponse {
  targets: BroadcastTarget[];
  results: BroadcastResult[];
}

export interface SendBroadcastTextPayload {
  message: string;
  platforms: string[];
}

export interface UpdateBroadcastPayload {
  platforms: string[];
  message:
    | string
    | {
        content: string;
      };
}

export interface DeleteBroadcastPayload {
  platforms: string[];
}

export interface DeleteBroadcastBatchPayload {
  platforms: string[];
  brodcast_ids?: string[];
  broadcast_ids?: string[];
  uuids?: string[];
}
