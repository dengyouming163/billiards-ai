"use client";

import { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-800",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-800",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  loading: {
    icon: Loader2,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-800",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
};

export function Toast({ id, type, message, onClose, duration = 4000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0 && type !== "loading") {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg
        ${config.bgColor} ${config.borderColor}
        transition-all duration-300 ease-out
        ${isExiting ? "opacity-0 translate-x-full scale-95" : "opacity-100 translate-x-0 scale-100"}
        hover:shadow-xl cursor-pointer
      `}
      onClick={handleClose}
    >
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${config.iconBg}
      `}>
        <Icon className={`w-4 h-4 ${config.iconColor} ${type === "loading" ? "animate-spin" : ""}`} />
      </div>
      
      <p className={`flex-1 text-sm font-medium ${config.textColor} leading-relaxed`}>
        {message}
      </p>

      <button
        className={`
          flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
          opacity-0 group-hover:opacity-100 hover:bg-black/5
          transition-all duration-200
        `}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: { id: string; type: ToastType; message: string }[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 max-w-md w-full px-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={onRemove}
        />
      ))}
    </div>
  );
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  loading: (message: string) => void;
}

export { toastConfig };
