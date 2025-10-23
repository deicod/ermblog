import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { subscribeToSessionUnauthorized } from "./sessionEvents";

export function SessionRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  const redirectState = useMemo(
    () => ({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    }),
    [location.hash, location.pathname, location.search],
  );

  useEffect(() => {
    if (location.pathname === "/login") {
      return;
    }

    const unsubscribe = subscribeToSessionUnauthorized(() => {
      if (location.pathname === "/login") {
        return;
      }

      navigate("/login", { replace: true, state: { from: redirectState } });
    });

    return unsubscribe;
  }, [location.pathname, navigate, redirectState]);

  return null;
}
