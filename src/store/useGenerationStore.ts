import { create } from "zustand";

import { STYLE_IDS } from "../constants/styles";
import type {
  GenerationResult,
  ImageAsset,
  ResultStatus,
  StyleId,
} from "../types";

export interface GenerationState {
  sourceImage: ImageAsset | null;
  sourceImageBase64: string | null;
  selectedStyles: StyleId[];
  results: Record<StyleId, GenerationResult>;
  setSourceImage: (image: ImageAsset) => void;
  setSourceImageBase64: (base64: string | null) => void;
  toggleStyle: (id: StyleId) => void;
  selectAllStyles: () => void;
  clearSelectedStyles: () => void;
  setResult: (styleId: StyleId, result: GenerationResult) => void;
  setResultStatus: (styleId: StyleId, status: ResultStatus) => void;
  clearResultError: (styleId: StyleId) => void;
  resetResults: () => void;
  reset: () => void;
}

const createInitialResults = (): Record<StyleId, GenerationResult> => {
  return STYLE_IDS.reduce((acc, styleId) => {
    acc[styleId] = {
      styleId,
      imageUrl: null,
      localUri: null,
      status: "idle",
      error: null,
    };
    return acc;
  }, {} as Record<StyleId, GenerationResult>);
};

export const useGenerationStore = create<GenerationState>((set: (partial: Partial<GenerationState> | ((state: GenerationState) => Partial<GenerationState>)) => void) => ({
  sourceImage: null,
  sourceImageBase64: null,
  selectedStyles: [...STYLE_IDS],
  results: createInitialResults(),

  setSourceImage: (image: ImageAsset) => {
    set({ sourceImage: image });
  },

  setSourceImageBase64: (base64: string | null) => {
    set({ sourceImageBase64: base64 });
  },

  toggleStyle: (id: StyleId) => {
    set((state: GenerationState) => {
      const isSelected = state.selectedStyles.includes(id);

      if (isSelected) {
        return {
          selectedStyles: state.selectedStyles.filter((styleId: StyleId) => styleId !== id),
        };
      }

      return {
        selectedStyles: [...state.selectedStyles, id],
      };
    });
  },

  selectAllStyles: () => {
    set({ selectedStyles: [...STYLE_IDS] });
  },

  clearSelectedStyles: () => {
    set({ selectedStyles: [] });
  },

  setResult: (styleId: StyleId, result: GenerationResult) => {
    set((state: GenerationState) => ({
      results: {
        ...state.results,
        [styleId]: result,
      },
    }));
  },

  setResultStatus: (styleId: StyleId, status: ResultStatus) => {
    set((state: GenerationState) => ({
      results: {
        ...state.results,
        [styleId]: {
          ...state.results[styleId],
          status,
          error: status === "error" ? state.results[styleId].error : null,
        },
      },
    }));
  },

  clearResultError: (styleId: StyleId) => {
    set((state: GenerationState) => ({
      results: {
        ...state.results,
        [styleId]: {
          ...state.results[styleId],
          error: null,
        },
      },
    }));
  },

  resetResults: () => {
    set({ results: createInitialResults() });
  },

  reset: () => {
    set({
      sourceImage: null,
      sourceImageBase64: null,
      selectedStyles: [...STYLE_IDS],
      results: createInitialResults(),
    });
  },
}));
