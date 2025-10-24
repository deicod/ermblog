import {
  ROUTE_CONFIG,
  getRouteDefinition,
  type RouteId,
  type RouteDefinition,
} from "../../routes/config";
import type { SessionToken } from "../../session/tokenStorage";

export type NavigationItem = {
  id: RouteId;
  label: string;
  description: string;
  icon: string;
  to: string;
};

const NAVIGATION_BLUEPRINT = [
  { id: "dashboard", icon: "📊" },
  { id: "posts", icon: "📝" },
  { id: "comments", icon: "💬" },
  { id: "taxonomies", icon: "🗂️" },
  { id: "login", icon: "🔐" },
] as const satisfies ReadonlyArray<{ id: RouteId; icon: string }>;

function resolveRoute(id: RouteId, routeConfig = ROUTE_CONFIG) {
  return getRouteDefinition(id, routeConfig);
}

export interface CreateNavigationItemsOptions {
  routeConfig?: RouteDefinition[];
  sessionToken?: SessionToken | null;
}

export function createNavigationItems(
  options: CreateNavigationItemsOptions = {},
): NavigationItem[] {
  const routeConfig = options.routeConfig ?? ROUTE_CONFIG;
  const hasSession = Boolean(options.sessionToken);

  return NAVIGATION_BLUEPRINT.reduce<NavigationItem[]>((items, { id, icon }) => {
    const route = resolveRoute(id, routeConfig);
    const requiresAuth = route.requiresAuth !== false;
    const shouldInclude = requiresAuth ? hasSession : !hasSession;

    if (!shouldInclude) {
      return items;
    }

    items.push({
      id,
      icon,
      label: route.title,
      description: route.description,
      to: route.href,
    });

    return items;
  }, []);
}

export const NAVIGATION_IDS_IN_ORDER: RouteId[] = NAVIGATION_BLUEPRINT.map(({ id }) => id);

const NAVIGATION_SNAPSHOT = {
  ids: NAVIGATION_IDS_IN_ORDER,
  items: createNavigationItems(),
} as const;

export default NAVIGATION_SNAPSHOT;
