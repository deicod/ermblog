import { useEffect } from "react";
import { requestSubscription, useRelayEnvironment, type GraphQLSubscriptionConfig } from "react-relay";

import type { NotificationCategory } from "../../providers/NotificationPreferencesProvider";
import { useNotificationPreferences } from "../../providers/NotificationPreferencesProvider";
import { resolveRelayEnvironmentConfig } from "../../config/relayEnvironmentConfig";

export function useNotificationSubscription<T>(
  category: NotificationCategory,
  config: GraphQLSubscriptionConfig<T>,
): void {
  const environment = useRelayEnvironment();
  const { isCategoryEnabled, isLoaded } = useNotificationPreferences();
  const { subscriptionsEnabled } = resolveRelayEnvironmentConfig();

  useEffect(() => {
    if (!subscriptionsEnabled) {
      return undefined;
    }

    if (!isLoaded) {
      return undefined;
    }

    if (!isCategoryEnabled(category)) {
      return undefined;
    }
    const disposable = requestSubscription(environment, config);
    return () => {
      disposable.dispose();
    };
  }, [category, config, environment, isCategoryEnabled, isLoaded, subscriptionsEnabled]);
}
