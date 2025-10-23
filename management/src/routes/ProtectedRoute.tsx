import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useSession } from "../session/SessionProvider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { sessionToken } = useSession();
  const location = useLocation();

  if (!sessionToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
