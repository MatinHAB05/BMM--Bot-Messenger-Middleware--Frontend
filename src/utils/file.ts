import { BroadcastAttachmentType } from '../types/broadcast';

export function getFileCategory(file: File): BroadcastAttachmentType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === 'image/gif' || name.endsWith('.gif')) {
    return 'animation';
  }

  if (mime.startsWith('image/')) {
    return 'photo';
  }

  if (mime.startsWith('video/')) {
    return 'video';
  }

  if (mime === 'audio/ogg' || name.endsWith('.ogg')) {
    return 'voice';
  }

  if (mime.startsWith('audio/')) {
    return 'audio';
  }

  return 'document';
}

export interface MediaValidationResult {
  isValid: boolean;
  category: BroadcastAttachmentType | null;
  error?: string;
  filesByCategory: Record<string, string[]>;
}

export function validateSingleMediaType(files: File[]): MediaValidationResult {
  if (!files || files.length === 0) {
    return { isValid: true, category: null, filesByCategory: {} };
  }

  const categoryMap: Record<string, string[]> = {};

  for (const file of files) {
    const cat = getFileCategory(file);
    if (!categoryMap[cat]) {
      categoryMap[cat] = [];
    }
    categoryMap[cat].push(file.name);
  }

  const detectedCategories = Object.keys(categoryMap) as BroadcastAttachmentType[];

  if (detectedCategories.length > 1) {
    const categoryDetails = detectedCategories
      .map((cat) => `${cat.toUpperCase()} (${categoryMap[cat].length} file(s): ${categoryMap[cat].join(', ')})`)
      .join(' AND ');

    return {
      isValid: false,
      category: null,
      error: `Constraint Violation: All attached files in a message batch must belong to the SAME media category. You mixed: ${categoryDetails}. Please attach files of only one type.`,
      filesByCategory: categoryMap,
    };
  }

  return {
    isValid: true,
    category: detectedCategories[0],
    filesByCategory: categoryMap,
  };
}

export function validateAttachmentBatch(files: File[]) {
  const result = validateSingleMediaType(files);
  return {
    isValid: result.isValid,
    detectedType: result.category || undefined,
    error: result.error,
  };
}

export function formatFileSize(bytes: number = 0): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
