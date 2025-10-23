import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useSession } from "../session/SessionProvider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { sessionToken } = useSession();

  if (!sessionToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
