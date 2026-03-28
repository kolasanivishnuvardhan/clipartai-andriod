import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

import type { AllowedMimeType } from "../constants/config";
import { APP_CONFIG } from "../constants/config";
import type { ImageAsset } from "../types";

export type ImageErrorCode = "INVALID_IMAGE" | "FILE_TOO_LARGE";

export class ImageValidationError extends Error {
  code: ImageErrorCode;

  constructor(code: ImageErrorCode, message: string) {
    super(message);
    this.name = "ImageValidationError";
    this.code = code;
  }
}

export interface ProcessedImage {
  asset: ImageAsset;
  base64DataUri: string;
}

export interface RawPickedImage {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  mimeType?: string | null;
}

const JPEG_MIME = "image/jpeg";

function getMimeType(input: RawPickedImage): string {
  if (input.mimeType && isAllowedMimeType(input.mimeType)) {
    return input.mimeType;
  }

  const lower = input.uri.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return JPEG_MIME;
}

function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (APP_CONFIG.upload.allowedMimeTypes as readonly string[]).includes(value);
}

function assertSupportedType(mimeType: string): void {
  if (!isAllowedMimeType(mimeType)) {
    throw new ImageValidationError(
      "INVALID_IMAGE",
      "This image format isn't supported",
    );
  }
}

function assertFileSize(fileSize: number): void {
  if (fileSize > APP_CONFIG.upload.maxFileBytes) {
    throw new ImageValidationError("FILE_TOO_LARGE", "Image too large. Max 10MB.");
  }
}

function getResizeDimensions(width: number, height: number): {
  width: number;
  height: number;
} {
  const maxDimension = APP_CONFIG.upload.maxDimension;

  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = width / height;
  if (ratio > 1) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / ratio),
    };
  }

  return {
    width: Math.round(maxDimension * ratio),
    height: maxDimension,
  };
}

async function getFileSize(uri: string): Promise<number> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  return fileInfo.exists ? (fileInfo.size ?? 0) : 0;
}

function toImageAsset(input: RawPickedImage, fileSize: number, mimeType: string): ImageAsset {
  return {
    uri: input.uri,
    width: input.width,
    height: input.height,
    fileSize,
    mimeType,
  };
}

async function compressToTarget(input: RawPickedImage): Promise<ImageAsset> {
  const mimeType = getMimeType(input);
  assertSupportedType(mimeType);

  const startFileSize = input.fileSize ?? (await getFileSize(input.uri));
  assertFileSize(startFileSize);

  const dimensions = getResizeDimensions(input.width, input.height);
  const actions = [{ resize: dimensions }];
  const qualityCandidates = [0.92, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4];

  let bestUri = input.uri;
  let bestSize = startFileSize;

  for (const compress of qualityCandidates) {
    const manipulated = await manipulateAsync(input.uri, actions, {
      compress,
      base64: false,
      format: SaveFormat.JPEG,
    });

    const size = await getFileSize(manipulated.uri);

    bestUri = manipulated.uri;
    bestSize = size;

    if (size <= APP_CONFIG.upload.maxCompressedBytes) {
      return {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        fileSize: size,
        mimeType: JPEG_MIME,
      };
    }
  }

  return {
    uri: bestUri,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: bestSize,
    mimeType: JPEG_MIME,
  };
}

async function toBase64DataUri(asset: ImageAsset): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:${asset.mimeType};base64,${base64}`;
}

export async function processImageForUpload(
  input: RawPickedImage,
): Promise<ProcessedImage> {
  const sourceMimeType = getMimeType(input);
  assertSupportedType(sourceMimeType);

  const sourceSize = input.fileSize ?? (await getFileSize(input.uri));
  assertFileSize(sourceSize);

  const normalizedAsset = toImageAsset(input, sourceSize, sourceMimeType);
  const compressedAsset = await compressToTarget(normalizedAsset);
  const base64DataUri = await toBase64DataUri(compressedAsset);

  return {
    asset: compressedAsset,
    base64DataUri,
  };
}
