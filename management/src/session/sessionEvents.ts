export const SESSION_UNAUTHORIZED_EVENT = "session:unauthorized" as const;

export interface SessionUnauthorizedDetail {
  status?: number;
  reason?: unknown;
}

export type SessionUnauthorizedEvent = CustomEvent<SessionUnauthorizedDetail>;

export function dispatchSessionUnauthorized(
  detail: SessionUnauthorizedDetail = { status: 401 },
): void {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function" ||
    typeof CustomEvent !== "function"
  ) {
    return;
  }

  const event: SessionUnauthorizedEvent = new CustomEvent(
    SESSION_UNAUTHORIZED_EVENT,
    { detail },
  );

  window.dispatchEvent(event);
}

export function subscribeToSessionUnauthorized(
  listener: (event: SessionUnauthorizedEvent) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }

  const eventListener = (event: Event) => {
    listener(event as SessionUnauthorizedEvent);
  };

  window.addEventListener(SESSION_UNAUTHORIZED_EVENT, eventListener as EventListener);

  return () => {
    window.removeEventListener(SESSION_UNAUTHORIZED_EVENT, eventListener as EventListener);
  };
}
