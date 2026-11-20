"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { ToastContainer, type ToastType } from "@/components/CustomToast";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  loading: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const handleShowToast = (event: Event) => {
      const detail = (event as CustomEvent<{ type: ToastType; message: string }>).detail;
      addToast(detail.type, detail.message);
    };

    window.addEventListener("showToast", handleShowToast);
    return () => window.removeEventListener("showToast", handleShowToast);
  }, [addToast]);

  const toast: ToastContextType["toast"] = useCallback((type, message) => {
    addToast(type, message);
  }, [addToast]);

  const success: ToastContextType["success"] = useCallback((message) => {
    addToast("success", message);
  }, [addToast]);

  const error: ToastContextType["error"] = useCallback((message) => {
    addToast("error", message);
  }, [addToast]);

  const warning: ToastContextType["warning"] = useCallback((message) => {
    addToast("warning", message);
  }, [addToast]);

  const info: ToastContextType["info"] = useCallback((message) => {
    addToast("info", message);
  }, [addToast]);

  const loading: ToastContextType["loading"] = useCallback((message) => {
    addToast("loading", message);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, loading }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function showToast(type: ToastType, message: string) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("showToast", { detail: { type, message } });
    window.dispatchEvent(event);
  }
}
