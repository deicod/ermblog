import { Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppShellSkeleton } from "./components/layout/LayoutSkeleton";
import { buildChildRoutes } from "./routes/config";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />, 
    children: buildChildRoutes(),
  },
]);

export default function App() {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
