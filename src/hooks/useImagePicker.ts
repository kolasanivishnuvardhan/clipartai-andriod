import { useCallback, useState } from "react";
import * as ExpoImagePicker from "expo-image-picker";

import {
  ImageValidationError,
  processImageForUpload,
  type RawPickedImage,
} from "../services/imageService";
import {
  useGenerationStore,
  type GenerationState,
} from "../store/useGenerationStore";
import { useUIStore, type UIState } from "../store/useUIStore";

type PickerSource = "camera" | "gallery";

function toRawPickedImage(asset: ExpoImagePicker.ImagePickerAsset): RawPickedImage {
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? undefined,
    mimeType: asset.mimeType ?? null,
  };
}

function getImagePickerErrorMessage(error: unknown): string {
  if (error instanceof ImageValidationError) {
    if (error.code === "FILE_TOO_LARGE") {
      return "Image too large. Max 10MB.";
    }
    return "This image format isn't supported";
  }
  return "Could not process image. Try another photo.";
}

export function useImagePicker() {
  const [isProcessing, setIsProcessing] = useState(false);

  const setSourceImage = useGenerationStore(
    (state: GenerationState) => state.setSourceImage,
  );
  const setSourceImageBase64 = useGenerationStore(
    (state: GenerationState) => state.setSourceImageBase64,
  );
  const resetResults = useGenerationStore(
    (state: GenerationState) => state.resetResults,
  );
  const resetGeneration = useGenerationStore(
    (state: GenerationState) => state.reset,
  );

  const showToast = useUIStore((state: UIState) => state.showToast);

  const pickImage = useCallback(
    async (source: PickerSource): Promise<boolean> => {
      try {
        setIsProcessing(true);

        if (source === "camera") {
          const cameraPermission =
            await ExpoImagePicker.requestCameraPermissionsAsync();
          if (!cameraPermission.granted) {
            showToast({ message: "Camera permission is required", type: "error" });
            return false;
          }
        }

        const mediaPermission =
          await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
          showToast({ message: "Gallery permission is required", type: "error" });
          return false;
        }

        const result =
          source === "camera"
            ? await ExpoImagePicker.launchCameraAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
                base64: false,
              })
            : await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                quality: 1,
                allowsEditing: false,
                base64: false,
              });

        if (result.canceled || result.assets.length === 0) {
          return false;
        }

        const rawImage = toRawPickedImage(result.assets[0]);
        const processed = await processImageForUpload(rawImage);

        setSourceImage(processed.asset);
        setSourceImageBase64(processed.base64DataUri);
        resetResults();

        return true;
      } catch (error) {
        showToast({
          message: getImagePickerErrorMessage(error),
          type: "error",
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [resetResults, setSourceImage, setSourceImageBase64, showToast],
  );

  const clearImage = useCallback(() => {
    resetGeneration();
  }, [resetGeneration]);

  return {
    isProcessing,
    pickFromCamera: () => pickImage("camera"),
    pickFromGallery: () => pickImage("gallery"),
    clearImage,
  };
}
