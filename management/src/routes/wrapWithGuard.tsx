import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";

type LazyResolver = NonNullable<RouteObject["lazy"]>;
type LazyResult = Awaited<ReturnType<LazyResolver>>;

type ResultWithComponent = LazyResult & {
  Component?: ComponentType<any>;
};

function createGuardedComponent(component: ComponentType<any>): ComponentType<any> {
  const Guarded: ComponentType<any> = (props) => {
    const OriginalComponent = component;
    return (
      <ProtectedRoute>
        <OriginalComponent {...props} />
      </ProtectedRoute>
    );
  };

  const componentName = component.displayName ?? component.name ?? "Component";
  Guarded.displayName = `Protected(${componentName})`;

  return Guarded;
}

export function wrapWithGuard(
  lazy: RouteObject["lazy"],
  requiresAuth?: boolean,
): RouteObject["lazy"] {
  if (!lazy || requiresAuth === false) {
    return lazy;
  }

  const resolver: LazyResolver = lazy;

  return async () => {
    const result = (await resolver()) as ResultWithComponent;

    if (!result || typeof result !== "object" || !result.Component) {
      return result;
    }

    return {
      ...result,
      Component: createGuardedComponent(result.Component),
    };
  };
}
