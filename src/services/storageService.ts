import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

import type { StyleId } from "../types";

export class StorageServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageServiceError";
  }
}

interface SaveAllProgress {
  completed: number;
  total: number;
}

const TEMP_DIR = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

function ensureTempDirAvailable(): string {
  if (!TEMP_DIR) {
    throw new StorageServiceError("Storage not available on this device.");
  }
  return TEMP_DIR;
}

function buildFileName(styleId: StyleId): string {
  return `clipartai_${styleId}_${Date.now()}.png`;
}

async function downloadToTemp(imageUrl: string, fileName: string): Promise<string> {
  const directory = ensureTempDirAvailable();
  const target = `${directory}${fileName}`;

  const result = await FileSystem.downloadAsync(imageUrl, target);
  if (result.status !== 200) {
    throw new StorageServiceError("Download failed.");
  }

  return result.uri;
}

async function removeIfExists(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

async function requestGalleryPermission(): Promise<void> {
  const existing = await MediaLibrary.getPermissionsAsync();
  if (existing.granted) {
    return;
  }

  const requested = await MediaLibrary.requestPermissionsAsync();
  if (!requested.granted) {
    throw new StorageServiceError("Gallery permission denied.");
  }
}

export async function saveImageToGallery(
  imageUrl: string,
  styleId: StyleId,
): Promise<void> {
  const fileName = buildFileName(styleId);
  const tempUri = await downloadToTemp(imageUrl, fileName);

  try {
    await requestGalleryPermission();
    await MediaLibrary.saveToLibraryAsync(tempUri);
  } finally {
    await removeIfExists(tempUri);
  }
}

export async function shareImage(
  imageUrl: string,
  styleId: StyleId,
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new StorageServiceError("Sharing is not available on this device.");
  }

  const fileName = buildFileName(styleId);
  const tempUri = await downloadToTemp(imageUrl, fileName);

  try {
    await Sharing.shareAsync(tempUri, {
      mimeType: "image/png",
      dialogTitle: "Share ClipartAI image",
      UTI: "public.png",
    });
  } finally {
    await removeIfExists(tempUri);
  }
}

export async function saveAllImagesSequentially(
  items: Array<{ styleId: StyleId; imageUrl: string }>,
  onProgress?: (progress: SaveAllProgress) => void,
): Promise<void> {
  const total = items.length;
  let completed = 0;

  for (const item of items) {
    await saveImageToGallery(item.imageUrl, item.styleId);
    completed += 1;
    onProgress?.({ completed, total });
  }
}
