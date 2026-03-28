import type { StyleId } from "../types";
import { STYLE_IDS } from "./styles";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const APP_CONFIG = {
  appName: "ClipartAI",
  apiBaseUrl: API_BASE_URL,
  endpoints: {
    health: "/api/health",
    generate: "/api/generate",
  },
  requestTimeoutMs: 45_000,
  upload: {
    maxFileBytes: 10 * 1024 * 1024,
    maxCompressedBytes: 800 * 1024,
    maxDimension: 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  generation: {
    defaultStyleIds: STYLE_IDS as StyleId[],
    totalStyles: 5,
    parallelRequests: 1,
  },
} as const;

export type AllowedMimeType =
  (typeof APP_CONFIG.upload.allowedMimeTypes)[number];
