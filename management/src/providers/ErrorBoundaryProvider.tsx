import { useMemo, useCallback, createContext, useContext, type ReactNode } from "react";
import { ErrorBoundary, type FallbackProps, useErrorBoundary as useReactErrorBoundary } from "react-error-boundary";
import { RelayNetworkError } from "../RelayEnvironment";

type ErrorBoundaryContextValue = {
  showError: (error: unknown) => void;
  resetError: () => void;
};

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | undefined>(undefined);

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error("An unexpected error occurred.");
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const normalized = normalizeError(error);
  const isRelayError = error instanceof RelayNetworkError;
  const description = isRelayError && typeof error.status === "number"
    ? `Our request failed with status ${error.status}.`
    : "Please try again or return to the dashboard.";

  const handleRetry = () => {
    resetErrorBoundary();
  };

  const handleRedirect = () => {
    if (typeof window !== "undefined" && typeof window.location?.assign === "function") {
      window.location.assign("/");
    }
  };

  return (
    <div role="alert" className="error-boundary-fallback">
      <h1>Something went wrong.</h1>
      <p>{normalized.message}</p>
      <p>{description}</p>
      <div className="error-boundary-actions">
        <button type="button" onClick={handleRetry}>
          Try again
        </button>
        <button type="button" onClick={handleRedirect}>
          Go home
        </button>
      </div>
    </div>
  );
}

function ErrorBoundaryBridge({ children }: { children: ReactNode }) {
  const { showBoundary, resetBoundary } = useReactErrorBoundary();

  const contextValue = useMemo<ErrorBoundaryContextValue>(() => {
    return {
      showError: (error) => {
        showBoundary(normalizeError(error));
      },
      resetError: () => {
        resetBoundary();
      },
    };
  }, [resetBoundary, showBoundary]);

  return (
    <ErrorBoundaryContext.Provider value={contextValue}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ErrorBoundaryBridge>{children}</ErrorBoundaryBridge>
    </ErrorBoundary>
  );
}

export function useErrorBoundaryActions(): ErrorBoundaryContextValue {
  const context = useContext(ErrorBoundaryContext);

  if (!context) {
    throw new Error("useErrorBoundaryActions must be used within an ErrorBoundaryProvider.");
  }

  return context;
}

export function useHandledErrorReporter(): (error: unknown) => void {
  const { showError } = useErrorBoundaryActions();

  return useCallback(
    (error: unknown) => {
      showError(error);
    },
    [showError],
  );
}

export function useResetErrorBoundary(): () => void {
  const { resetError } = useErrorBoundaryActions();

  return useCallback(() => {
    resetError();
  }, [resetError]);
}
