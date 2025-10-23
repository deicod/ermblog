import { useMemo } from "react";
import { useLazyLoadQuery } from "react-relay";

import type { AppHeaderViewerQuery } from "./__generated__/AppHeaderViewerQuery.graphql";
import { appHeaderViewerQuery } from "./AppHeaderViewerQuery";
import { useAuthActions } from "../../session/SessionProvider";
import { APP_NAME, APP_TAGLINE, LAYOUT_STATUS_TEXT } from "./constants";

function computeInitials(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = (displayName ?? email ?? "").trim();

  if (source.length === 0) {
    return "";
  }

  const segments = source.split(/\s+/).filter(Boolean);

  if (segments.length >= 2) {
    const [first, second] = segments;
    const firstInitial = first?.[0]?.toUpperCase() ?? "";
    const secondInitial = second?.[0]?.toUpperCase() ?? "";
    return `${firstInitial}${secondInitial}`.trim();
  }

  const [first] = segments;
  if (!first) {
    return "";
  }

  if (first.length >= 2) {
    return first.slice(0, 2).toUpperCase();
  }

  return first[0]?.toUpperCase() ?? "";
}

export function AppHeader() {
  const { clearSessionToken } = useAuthActions();
  const data = useLazyLoadQuery<AppHeaderViewerQuery>(
    appHeaderViewerQuery,
    {},
    { fetchPolicy: "store-or-network" },
  );

  const viewer = data.viewer;
  const viewerName = viewer?.displayName ?? viewer?.email ?? null;
  const viewerEmail = viewer?.email && viewer?.email !== viewerName ? viewer.email : null;
  const viewerInitials = useMemo(
    () => computeInitials(viewer?.displayName, viewer?.email),
    [viewer?.displayName, viewer?.email],
  );
  const avatarAlt = viewerName ? `${viewerName}'s avatar` : "User avatar";

  return (
    <header className="app-header">
      <div className="app-header__title-block">
        <h1 className="app-header__name">{APP_NAME}</h1>
        <p className="app-header__subtitle">{APP_TAGLINE}</p>
      </div>
      <div className="app-header__actions">
        <div className="app-header__status" role="status" aria-live="polite">
          <span className="app-header__status-dot" aria-hidden />
          <span>{LAYOUT_STATUS_TEXT}</span>
        </div>
        {viewer ? (
          <div className="app-header__viewer">
            <div className="app-header__avatar" aria-hidden={!viewer.avatarURL && !viewerInitials}>
              {viewer.avatarURL ? (
                <img
                  className="app-header__avatar-image"
                  src={viewer.avatarURL}
                  alt={avatarAlt}
                  referrerPolicy="no-referrer"
                />
              ) : viewerInitials ? (
                <span aria-hidden>{viewerInitials}</span>
              ) : (
                <span aria-hidden>?</span>
              )}
            </div>
            <div className="app-header__viewer-details">
              <span className="app-header__viewer-name">{viewerName ?? "Signed-in user"}</span>
              {viewerEmail ? (
                <span className="app-header__viewer-email">{viewerEmail}</span>
              ) : null}
            </div>
            <button
              type="button"
              className="app-header__signout-button"
              onClick={() => clearSessionToken()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <span className="app-header__viewer-fallback" role="status">
            Not signed in
          </span>
        )}
      </div>
    </header>
  );
}
