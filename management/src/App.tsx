import { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppShellSkeleton } from "./components/layout/LayoutSkeleton";
import {
  ROUTE_IDS,
  buildChildRoutes,
  createRouteObject,
  getRouteDefinition,
} from "./routes/config";

const loginRoute = createRouteObject(getRouteDefinition(ROUTE_IDS.login), {
  useHref: true,
});

const router = createBrowserRouter([
  loginRoute,
  {
    path: "/",
    element: <AppShell />,
    children: buildChildRoutes({ includePublic: false }),
  },
]);

export default function App() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
