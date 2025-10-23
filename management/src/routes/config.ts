import type { RouteObject } from "react-router-dom";

export const ROUTE_IDS = {
  login: "login",
  dashboard: "dashboard",
  posts: "posts",
} as const;

export type RouteId = (typeof ROUTE_IDS)[keyof typeof ROUTE_IDS];

export type RouteDefinition = {
  id: RouteId;
  path?: string;
  index?: boolean;
  href: string;
  title: string;
  description: string;
  lazy: RouteObject["lazy"];
  requiresAuth?: boolean;
};

export const ROUTE_CONFIG: RouteDefinition[] = [
  {
    id: ROUTE_IDS.login,
    path: "login",
    href: "/login",
    title: "Sign in",
    description: "Authenticate with your account",
    requiresAuth: false,
    lazy: async () => ({
      Component: (await import("./login")).LoginRoute,
    }),
  },
  {
    id: ROUTE_IDS.dashboard,
    index: true,
    href: "/",
    title: "Dashboard",
    description: "Summary insights and system status",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./dashboard")).DashboardRoute,
    }),
  },
  {
    id: ROUTE_IDS.posts,
    path: "posts",
    href: "/posts",
    title: "Posts",
    description: "Editorial queue and publishing workflow",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./posts")).PostsRoute,
    }),
  },
];

export function buildChildRoutes(): RouteObject[] {
  return ROUTE_CONFIG.map(({ id, lazy, path, index }) => ({
    id,
    lazy,
    path,
    index,
  }));
}

const ROUTE_SNAPSHOT = {
  ids: ROUTE_IDS,
  config: ROUTE_CONFIG,
} as const;

export default ROUTE_SNAPSHOT;
