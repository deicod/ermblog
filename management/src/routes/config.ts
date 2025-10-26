import type { RouteObject } from "react-router-dom";

import { wrapWithGuard } from "./wrapWithGuard";

export const ROUTE_IDS = {
  login: "login",
  dashboard: "dashboard",
  posts: "posts",
  postEditor: "postEditor",
  comments: "comments",
  roles: "roles",
  users: "users",
  taxonomies: "taxonomies",
  media: "media",
  notifications: "notifications",
  options: "options",
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
  {
    id: ROUTE_IDS.postEditor,
    path: "posts/:postId",
    href: "/posts/:postId",
    title: "Edit post",
    description: "Update post content, relationships, and SEO metadata",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./posts/PostEditorRoute")).PostEditorRoute,
    }),
  },
  {
    id: ROUTE_IDS.users,
    path: "users",
    href: "/users",
    title: "Users",
    description: "Manage user accounts, contact information, and profile details",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./users")).UsersRoute,
    }),
  },
  {
    id: ROUTE_IDS.roles,
    path: "roles",
    href: "/roles",
    title: "Roles",
    description: "Manage capability bundles and permission policies",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./roles")).RolesRoute,
    }),
  },
  {
    id: ROUTE_IDS.comments,
    path: "comments",
    href: "/comments",
    title: "Comments",
    description: "Moderate community feedback and discussion",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./comments")).CommentsRoute,
    }),
  },
  {
    id: ROUTE_IDS.taxonomies,
    path: "taxonomies",
    href: "/taxonomies",
    title: "Taxonomies",
    description: "Organize categories and tags for site content",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./taxonomies")).TaxonomiesRoute,
    }),
  },
  {
    id: ROUTE_IDS.media,
    path: "media",
    href: "/media",
    title: "Media",
    description: "Manage uploaded assets and metadata",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./media")).MediaRoute,
    }),
  },
  {
    id: ROUTE_IDS.notifications,
    path: "notifications",
    href: "/notifications",
    title: "Notifications",
    description: "Control which real-time categories trigger updates",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./notifications")).NotificationsRoute,
    }),
  },
  {
    id: ROUTE_IDS.options,
    path: "options",
    href: "/options",
    title: "Options",
    description: "Inspect and edit application configuration values",
    requiresAuth: true,
    lazy: async () => ({
      Component: (await import("./options")).OptionsRoute,
    }),
  },
];

export interface BuildChildRoutesOptions {
  includePublic?: boolean;
}

export function getRouteDefinition(
  routeId: RouteId,
  routeConfig: RouteDefinition[] = ROUTE_CONFIG,
): RouteDefinition {
  const definition = routeConfig.find((entry) => entry.id === routeId);

  if (!definition) {
    throw new Error(`Missing route configuration for id "${routeId}"`);
  }

  return definition;
}

export interface CreateRouteObjectOptions {
  useHref?: boolean;
}

export function createRouteObject(
  definition: RouteDefinition,
  options: CreateRouteObjectOptions = {},
): RouteObject {
  const { useHref = false } = options;
  const path = definition.index
    ? undefined
    : useHref
    ? definition.href
    : definition.path;

  return {
    id: definition.id,
    lazy: wrapWithGuard(definition.lazy, definition.requiresAuth),
    index: definition.index,
    path,
  };
}

export function buildChildRoutes(options: BuildChildRoutesOptions = {}): RouteObject[] {
  const { includePublic = true } = options;

  return ROUTE_CONFIG.filter((definition) => includePublic || definition.requiresAuth !== false).map(
    (definition) => createRouteObject(definition),
  );
}

const ROUTE_SNAPSHOT = {
  ids: ROUTE_IDS,
  config: ROUTE_CONFIG,
} as const;

export default ROUTE_SNAPSHOT;
