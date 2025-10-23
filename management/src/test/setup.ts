import "@testing-library/jest-dom/vitest";

declare global {
  // Vitest with rolldown may not define this SSR helper, so ensure it exists.
  // eslint-disable-next-line no-var
  var __vite_ssr_exportName__: ((name: string, value: unknown) => void) | undefined;
  // eslint-disable-next-line no-var
  var __vite_ssr_exports__: Record<string, unknown> | undefined;
}

if (typeof globalThis.__vite_ssr_exportName__ !== "function") {
  globalThis.__vite_ssr_exportName__ = () => {};
}

if (typeof globalThis.__vite_ssr_exports__ !== "object") {
  globalThis.__vite_ssr_exports__ = {};
}
