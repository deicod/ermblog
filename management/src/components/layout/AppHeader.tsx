import { APP_NAME, APP_TAGLINE, LAYOUT_STATUS_TEXT } from "./constants";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__title-block">
        <h1 className="app-header__name">{APP_NAME}</h1>
        <p className="app-header__subtitle">{APP_TAGLINE}</p>
      </div>
      <div className="app-header__actions">
        <span className="app-header__status-dot" aria-hidden />
        <span aria-live="polite">{LAYOUT_STATUS_TEXT}</span>
      </div>
    </header>
  );
}
