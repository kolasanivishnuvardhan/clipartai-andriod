import axios, {
  AxiosError,
  type AxiosResponse,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { APP_CONFIG } from "../constants/config";
import type { StyleId } from "../types";

export type ServiceErrorCode =
  | "NETWORK_ERROR"
  | "RATE_LIMIT_ERROR"
  | "INVALID_IMAGE"
  | "FILE_TOO_LARGE"
  | "GENERATION_FAILED"
  | "UNKNOWN_ERROR";

export class ServiceError extends Error {
  code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export interface GenerateImageRequest {
  imageBase64: string;
  styleId: StyleId;
}

export interface GenerateImageResponse {
  styleId: StyleId;
  imageUrl: string;
  status: "success";
}

interface BackendErrorPayload {
  code?: string;
  message?: string;
}

const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  config.headers.set("Content-Type", "application/json");
  config.headers.set("Accept", "application/json");
  return config;
};

const responseErrorInterceptor = (error: AxiosError<BackendErrorPayload>) => {
  throw classifyAxiosError(error);
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: APP_CONFIG.apiBaseUrl,
    timeout: APP_CONFIG.requestTimeoutMs,
  });

  client.interceptors.request.use(requestInterceptor);
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    responseErrorInterceptor,
  );

  return client;
};

const apiClient = createApiClient();

function classifyAxiosError(error: AxiosError<BackendErrorPayload>): ServiceError {
  if (!error.response) {
    return new ServiceError(
      "NETWORK_ERROR",
      "Check your connection and try again",
    );
  }

  const status = error.response.status;
  const backendCode = error.response.data?.code;

  if (status === 429 || backendCode === "RATE_LIMIT_ERROR") {
    return new ServiceError("RATE_LIMIT_ERROR", "Too many requests. Wait a moment.");
  }

  if (
    status === 413 ||
    backendCode === "FILE_TOO_LARGE" ||
    backendCode === "PAYLOAD_TOO_LARGE"
  ) {
    return new ServiceError("FILE_TOO_LARGE", "Image too large. Max 10MB.");
  }

  if (backendCode === "INVALID_IMAGE" || backendCode === "INVALID_IMAGE_TYPE") {
    return new ServiceError("INVALID_IMAGE", "This image format isn't supported");
  }

  if (backendCode === "CONFIG_ERROR") {
    return new ServiceError(
      "GENERATION_FAILED",
      "Server model config is missing. Set REPLICATE_MODEL in Railway.",
    );
  }

  if (backendCode === "MODEL_NOT_FOUND") {
    return new ServiceError(
      "GENERATION_FAILED",
      "Configured model was not found. Update REPLICATE_MODEL in Railway.",
    );
  }

  if (backendCode === "GENERATION_FAILED" || status >= 500) {
    return new ServiceError("GENERATION_FAILED", "Generation failed. Tap retry.");
  }

  return new ServiceError("UNKNOWN_ERROR", "Generation failed. Tap retry.");
}

function assertGenerateResponse(data: unknown): asserts data is GenerateImageResponse {
  if (!data || typeof data !== "object") {
    throw new ServiceError("GENERATION_FAILED", "Generation failed. Tap retry.");
  }

  const payload = data as Partial<GenerateImageResponse>;

  if (
    typeof payload.styleId !== "string" ||
    typeof payload.imageUrl !== "string" ||
    payload.status !== "success"
  ) {
    throw new ServiceError("GENERATION_FAILED", "Generation failed. Tap retry.");
  }
}

export async function generateStyleImage(
  payload: GenerateImageRequest,
): Promise<GenerateImageResponse> {
  const response = await apiClient.post(APP_CONFIG.endpoints.generate, payload);
  assertGenerateResponse(response.data);
  return response.data;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get(APP_CONFIG.endpoints.health);
    return response.status === 200 && response.data?.status === "ok";
  } catch {
    return false;
  }
}
