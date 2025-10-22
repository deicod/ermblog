import { NavLink } from "react-router-dom";
import { createNavigationItems } from "./navigation";
import { WORKSPACE_NAME, WORKSPACE_SECTION_LABEL } from "./constants";

export function AppSidebar() {
  const navItems = createNavigationItems();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand" aria-label="Application name">
        {WORKSPACE_NAME}
      </div>
      <nav className="app-sidebar__section" aria-label="Primary">
        <span className="app-sidebar__label">{WORKSPACE_SECTION_LABEL}</span>
        <ul className="app-sidebar__list">
          {navItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "app-sidebar__link",
                    isActive ? "app-sidebar__link--active" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                aria-label={`${item.label}: ${item.description}`}
              >
                <span className="app-sidebar__icon" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
