import { Outlet } from "react-router-dom";

import { SessionRedirector } from "../../session/SessionRedirector";
import { BREADCRUMB_ARIA_LABEL, BREADCRUMB_PLACEHOLDER_TEXT } from "./constants";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";

function BreadcrumbPlaceholder() {
  return (
    <div
      className="app-shell__breadcrumb"
      role="navigation"
      aria-label={BREADCRUMB_ARIA_LABEL}
      data-testid="breadcrumb-placeholder"
    >
      {BREADCRUMB_PLACEHOLDER_TEXT}
    </div>
  );
}

export function AppShell() {
  return (
    <div className="app-shell">
      <SessionRedirector />
      <AppSidebar />
      <div className="app-shell__chrome">
        <AppHeader />
        <div className="app-shell__main">
          <BreadcrumbPlaceholder />
          <main className="app-shell__content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
