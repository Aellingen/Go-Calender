import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'error') => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  error: (message) => useToastStore.getState().addToast(message, 'error'),
  success: (message) => useToastStore.getState().addToast(message, 'success'),
  info: (message) => useToastStore.getState().addToast(message, 'info'),
};
