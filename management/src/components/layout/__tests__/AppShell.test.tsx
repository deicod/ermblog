import { describe, expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

import { createNavigationItems } from "../navigation";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(TEST_DIR, "..", "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), "utf-8");
}

describe("layout constants", () => {
  const constantsSource = readSource("components/layout/constants.ts");
  const constantPattern = /export const (\w+) = "([^"]+)";/g;
  const constants = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = constantPattern.exec(constantsSource))) {
    constants.set(match[1], match[2]);
  }

  test("expose workspace labels and status copy", () => {
    expect(constants.get("APP_NAME")).toBe("ERM Management");
    expect(constants.get("APP_TAGLINE")).toMatch(/Operational tools/i);
    expect(constants.get("WORKSPACE_NAME")).toBe("ERM Studio");
    expect(constants.get("WORKSPACE_SECTION_LABEL")).toBe("Workspace");
    expect(constants.get("LAYOUT_STATUS_TEXT")).toBe("Systems nominal");
  });

  test("define accessible placeholders", () => {
    expect(constants.get("BREADCRUMB_PLACEHOLDER_TEXT")).toMatch(
      /Breadcrumbs will appear here/i,
    );
    expect(constants.get("BREADCRUMB_ARIA_LABEL")).toBe("Breadcrumb");
    expect(constants.get("LAYOUT_SKELETON_ARIA_LABEL")).toBe(
      "Loading workspace layout",
    );
  });
});

describe("route configuration", () => {
  const routeSource = readSource("routes/config.ts");
  const routePattern = /{\s*id: ROUTE_IDS\.(\w+),[\s\S]*?href: "([^"]+)"[\s\S]*?title: "([^"]+)"[\s\S]*?description: "([^"]+)"[\s\S]*?lazy:/g;
  const routes = new Map(
    Array.from(routeSource.matchAll(routePattern), ([, id, href, title, description]) => [
      id,
      { href, title, description },
    ]),
  );

  test("declares lazy-loaded dashboard, posts, and comments routes", () => {
    expect(routes.size).toBeGreaterThanOrEqual(3);
    const dashboard = routes.get("dashboard");
    const posts = routes.get("posts");
    const users = routes.get("users");
    const comments = routes.get("comments");
    expect(dashboard).toBeDefined();
    expect(dashboard?.href).toBe("/");
    expect(dashboard?.title).toBe("Dashboard");
    expect(dashboard?.description).toMatch(/Summary insights/i);
    expect(posts).toBeDefined();
    expect(posts?.href).toBe("/posts");
    expect(posts?.title).toBe("Posts");
    expect(posts?.description).toMatch(/Editorial queue/i);
    expect(users).toBeDefined();
    expect(users?.href).toBe("/users");
    expect(users?.title).toBe("Users");
    expect(users?.description).toMatch(/Manage user accounts/i);
    expect(comments).toBeDefined();
    expect(comments?.href).toBe("/comments");
    expect(comments?.title).toBe("Comments");
    expect(comments?.description).toMatch(/Moderate community feedback/i);

    expect(routeSource).toMatch(/index:\s*true/);
    expect(routeSource).toMatch(/path:\s*"posts"/);
    expect(routeSource).toMatch(/path:\s*"comments"/);
  });
});

describe("navigation metadata", () => {
  const navigationSource = readSource("components/layout/navigation.ts");
  const navPattern = /{ id: "(\w+)", icon: "([^\"]+)" }/g;
  const navIds: string[] = [];
  while (true) {
    const match = navPattern.exec(navigationSource);
    if (!match) break;
    navIds.push(match[1]);
  }

  test("mirrors route configuration for primary items", () => {
    expect(navIds).toEqual([
      "dashboard",
      "posts",
      "users",
      "comments",
      "taxonomies",
      "media",
      "options",
      "login",
    ]);
    expect(navigationSource).toContain("NAVIGATION_BLUEPRINT");
    expect(navigationSource).toContain("to: route.href");
    expect(navigationSource).toContain("route.requiresAuth !== false");
  });

  test("exposes login navigation entry when signed out", () => {
    const items = createNavigationItems({ sessionToken: null });
    expect(items.map((item) => item.id)).toContain("login");
  });

  test("hides login navigation entry once authenticated", () => {
    const items = createNavigationItems({
      sessionToken: { accessToken: "token", tokenType: "Bearer" },
    });
    expect(items.map((item) => item.id)).not.toContain("login");
  });

  test("surfaces media navigation entry once authenticated", () => {
    const items = createNavigationItems({
      sessionToken: { accessToken: "token", tokenType: "Bearer" },
    });
    expect(items.map((item) => item.id)).toContain("media");
  });
});
