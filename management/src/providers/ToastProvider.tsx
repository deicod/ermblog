import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { type NotificationCategory, useNotificationPreferences } from "./NotificationPreferencesProvider";
import "./toast.css";

type ToastIntent = "info" | "success" | "warning" | "error";

type ShowToastOptions = {
  message: string;
  title?: string;
  intent?: ToastIntent;
  duration?: number;
  category?: NotificationCategory;
};

type ToastRecord = {
  id: string;
  message: string;
  title?: string;
  intent: ToastIntent;
  duration: number;
};

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
};

const DEFAULT_DURATION = 5000;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 0;

function createToastId() {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

type ToastItemProps = {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, message, title, intent, duration } = toast;

  useEffect(() => {
    if (duration <= 0 || typeof window === "undefined") {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, id, onDismiss]);

  const role = intent === "error" ? "alert" : "status";

  return (
    <div
      className={`toast-viewport__toast toast-viewport__toast--${intent}`}
      role={role}
      aria-live={intent === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <div className="toast-viewport__content">
        {title ? <span className="toast-viewport__title">{title}</span> : null}
        <p className="toast-viewport__message">{message}</p>
      </div>
      <button
        type="button"
        className="toast-viewport__dismiss"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const { isCategoryEnabled } = useNotificationPreferences();

  const dismissToast = useCallback((id: string) => {
    setToasts((existing) => existing.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, title, intent = "info", duration = DEFAULT_DURATION, category }: ShowToastOptions) => {
      if (category && !isCategoryEnabled(category)) {
        return "";
      }
      const id = createToastId();
      const toast: ToastRecord = {
        id,
        message,
        title,
        intent,
        duration,
      };
      setToasts((existing) => [...existing, toast]);
      return id;
    },
    [isCategoryEnabled],
  );

  const contextValue = useMemo<ToastContextValue>(() => {
    return {
      showToast,
      dismissToast,
    };
  }, [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-viewport" role="region" aria-live="polite" aria-atomic="true" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Pick<ToastContextValue, "showToast"> {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return { showToast: context.showToast };
}
