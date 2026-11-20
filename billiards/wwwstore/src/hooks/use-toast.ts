import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
}

let toasts: Toast[] = [];
let listeners: Set<(toasts: Toast[]) => void> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastItem: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
    };
    
    toasts = [...toasts, toastItem];
    notifyListeners();
    
    const duration = options.duration || 3000;
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, duration);
    
    return {
      id,
      dismiss: () => {
        toasts = toasts.filter((t) => t.id !== id);
        notifyListeners();
      },
    };
  }, []);

  return { toast };
}

export function useToastListener(callback: (toasts: Toast[]) => void) {
  const subscribe = useCallback(() => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, [callback]);

  return { subscribe, toasts: [...toasts] };
}

export type { Toast, ToastOptions };