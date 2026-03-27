import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  generateStyleImage,
  ServiceError,
  type ServiceErrorCode,
} from "../services/aiService";
import {
  useGenerationStore,
  type GenerationState,
} from "../store/useGenerationStore";
import { useUIStore, type UIState } from "../store/useUIStore";
import type { GenerationResult, StyleId } from "../types";

const FALLBACK_ERROR_MESSAGE = "Generation failed. Tap retry.";

function toUserMessage(code?: ServiceErrorCode): string {
  if (code === "NETWORK_ERROR") {
    return "Check your connection and try again";
  }
  if (code === "RATE_LIMIT_ERROR") {
    return "Too many requests. Wait a moment.";
  }
  if (code === "INVALID_IMAGE") {
    return "This image format isn't supported";
  }
  if (code === "FILE_TOO_LARGE") {
    return "Image too large. Max 10MB.";
  }
  return FALLBACK_ERROR_MESSAGE;
}

function isCompleted(result: GenerationResult): boolean {
  return result.status === "success" || result.status === "error";
}

export function useGeneration() {
  const selectedStyles = useGenerationStore(
    (state: GenerationState) => state.selectedStyles,
  );
  const sourceImageBase64 = useGenerationStore(
    (state: GenerationState) => state.sourceImageBase64,
  );
  const setResult = useGenerationStore(
    (state: GenerationState) => state.setResult,
  );
  const setResultStatus = useGenerationStore(
    (state: GenerationState) => state.setResultStatus,
  );
  const clearResultError = useGenerationStore(
    (state: GenerationState) => state.clearResultError,
  );
  const results = useGenerationStore((state: GenerationState) => state.results);

  const showToast = useUIStore((state: UIState) => state.showToast);

  const generateSingle = useCallback(
    async (styleId: StyleId, base64DataUri: string) => {
      try {
        const response = await generateStyleImage({
          imageBase64: base64DataUri,
          styleId,
        });

        setResult(styleId, {
          styleId,
          imageUrl: response.imageUrl,
          localUri: null,
          status: "success",
          error: null,
        });
      } catch (error) {
        const code = error instanceof ServiceError ? error.code : undefined;
        const message = toUserMessage(code);

        setResult(styleId, {
          styleId,
          imageUrl: null,
          localUri: null,
          status: "error",
          error: message,
        });

        showToast({ message, type: "error" });
      }
    },
    [setResult, showToast],
  );

  const generateMutation = useMutation({
    mutationFn: async (styleIds: StyleId[]) => {
      if (!sourceImageBase64) {
        throw new Error("Missing source image");
      }

      styleIds.forEach((styleId) => {
        clearResultError(styleId);
        setResultStatus(styleId, "loading");
      });

      const tasks = styleIds.map(async (styleId) => {
        await generateSingle(styleId, sourceImageBase64);
      });

      await Promise.allSettled(tasks);
      return styleIds.length;
    },
    onError: () => {
      showToast({ message: FALLBACK_ERROR_MESSAGE, type: "error" });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (styleId: StyleId) => {
      if (!sourceImageBase64) {
        throw new Error("Missing source image");
      }

      clearResultError(styleId);
      setResultStatus(styleId, "loading");
      await generateSingle(styleId, sourceImageBase64);
      return styleId;
    },
  });

  const totalSelected = selectedStyles.length;
  const completedCount = useMemo(() => {
    return selectedStyles.reduce((acc: number, styleId: StyleId) => {
      return isCompleted(results[styleId]) ? acc + 1 : acc;
    }, 0);
  }, [results, selectedStyles]);

  const readyCount = useMemo(() => {
    return selectedStyles.reduce((acc: number, styleId: StyleId) => {
      return results[styleId].status === "success" ? acc + 1 : acc;
    }, 0);
  }, [results, selectedStyles]);

  return {
    generateSelected: () => generateMutation.mutateAsync(selectedStyles),
    retryStyle: (styleId: StyleId) => retryMutation.mutateAsync(styleId),
    isGenerating: generateMutation.isPending,
    isRetrying: retryMutation.isPending,
    totalSelected,
    completedCount,
    readyCount,
    progressLabel: `${readyCount}/${totalSelected} ready`,
  };
}
