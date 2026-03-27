import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
  createdAt: number;
}

export interface ModalState {
  key: string;
  visible: boolean;
  payload?: unknown;
}

export interface UIState {
  toasts: ToastMessage[];
  modals: Record<string, ModalState>;
  showToast: (input: {
    message: string;
    type?: ToastType;
    durationMs?: number;
  }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  openModal: (key: string, payload?: unknown) => void;
  closeModal: (key: string) => void;
  closeAllModals: () => void;
}

interface ShowToastInput {
  message: string;
  type?: ToastType;
  durationMs?: number;
}

const createToastId = () => {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const useUIStore = create<UIState>((set: (partial: Partial<UIState> | ((state: UIState) => Partial<UIState>)) => void) => ({
  toasts: [],
  modals: {},

  showToast: ({
    message,
    type = "info",
    durationMs = 3000,
  }: ShowToastInput) => {
    const id = createToastId();

    set((state: UIState) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          message,
          type,
          durationMs,
          createdAt: Date.now(),
        },
      ],
    }));

    return id;
  },

  dismissToast: (id: string) => {
    set((state: UIState) => ({
      toasts: state.toasts.filter((toast: ToastMessage) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  openModal: (key: string, payload?: unknown) => {
    set((state: UIState) => ({
      modals: {
        ...state.modals,
        [key]: {
          key,
          visible: true,
          payload,
        },
      },
    }));
  },

  closeModal: (key: string) => {
    set((state: UIState) => ({
      modals: {
        ...state.modals,
        [key]: {
          ...(state.modals[key] ?? { key }),
          key,
          visible: false,
          payload: undefined,
        },
      },
    }));
  },

  closeAllModals: () => {
    set((state: UIState) => {
      const nextModals: Record<string, ModalState> = {};

      Object.keys(state.modals).forEach((key) => {
        nextModals[key] = {
          ...state.modals[key],
          visible: false,
          payload: undefined,
        };
      });

      return { modals: nextModals };
    });
  },
}));
