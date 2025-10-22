import { ROUTE_CONFIG, type RouteId } from "../../routes/config";

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
] as const satisfies ReadonlyArray<{ id: RouteId; icon: string }>;

function resolveRoute(id: RouteId, routeConfig = ROUTE_CONFIG) {
  const route = routeConfig.find((entry) => entry.id === id);
  if (!route) {
    throw new Error(`Missing route configuration for navigation id "${id}"`);
  }
  return route;
}

export function createNavigationItems(routeConfig = ROUTE_CONFIG): NavigationItem[] {
  return NAVIGATION_BLUEPRINT.map(({ id, icon }) => {
    const route = resolveRoute(id, routeConfig);
    return {
      id,
      icon,
      label: route.title,
      description: route.description,
      to: route.href,
    } satisfies NavigationItem;
  });
}

export const NAVIGATION_IDS_IN_ORDER: RouteId[] = NAVIGATION_BLUEPRINT.map(({ id }) => id);

const NAVIGATION_SNAPSHOT = {
  ids: NAVIGATION_IDS_IN_ORDER,
  items: createNavigationItems(),
} as const;

export default NAVIGATION_SNAPSHOT;
