import { useMemo, useState } from "react";

import {
  saveAllImagesSequentially,
  saveImageToGallery,
  shareImage,
  StorageServiceError,
} from "../services/storageService";
import {
  useGenerationStore,
  type GenerationState,
} from "../store/useGenerationStore";
import { useUIStore, type UIState } from "../store/useUIStore";
import type { GenerationResult, StyleId } from "../types";

function toStorageErrorMessage(error: unknown): string {
  if (error instanceof StorageServiceError) {
    if (error.message.includes("permission")) {
      return "Allow gallery access to save images";
    }
    if (error.message.includes("Sharing")) {
      return "Sharing is unavailable on this device";
    }
  }
  return "Action failed. Please try again.";
}

export function useDownload() {
  const [saveAllProgress, setSaveAllProgress] = useState({
    completed: 0,
    total: 0,
  });
  const [isSavingAll, setIsSavingAll] = useState(false);

  const results = useGenerationStore((state: GenerationState) => state.results);
  const showToast = useUIStore((state: UIState) => state.showToast);

  const completedItems = useMemo(() => {
    return Object.values(results as Record<StyleId, GenerationResult>)
      .filter(
        (result: GenerationResult) =>
          result.status === "success" && Boolean(result.imageUrl),
      )
      .map((result: GenerationResult) => ({
        styleId: result.styleId,
        imageUrl: result.imageUrl as string,
      }));
  }, [results]);

  const saveOne = async (styleId: StyleId, imageUrl: string) => {
    try {
      await saveImageToGallery(imageUrl, styleId);
      showToast({ message: "Saved to Gallery ✓", type: "success" });
    } catch (error) {
      showToast({ message: toStorageErrorMessage(error), type: "error" });
    }
  };

  const shareOne = async (styleId: StyleId, imageUrl: string) => {
    try {
      await shareImage(imageUrl, styleId);
    } catch (error) {
      showToast({ message: toStorageErrorMessage(error), type: "error" });
    }
  };

  const saveAll = async () => {
    if (completedItems.length === 0) {
      showToast({ message: "No generated images to save yet", type: "info" });
      return;
    }

    try {
      setIsSavingAll(true);
      setSaveAllProgress({ completed: 0, total: completedItems.length });

      await saveAllImagesSequentially(completedItems, (progress) => {
        setSaveAllProgress(progress);
      });

      showToast({ message: "Saved to Gallery ✓", type: "success" });
    } catch (error) {
      showToast({ message: toStorageErrorMessage(error), type: "error" });
    } finally {
      setIsSavingAll(false);
    }
  };

  return {
    saveOne,
    shareOne,
    saveAll,
    completedItems,
    isSavingAll,
    saveAllProgress,
  };
}
