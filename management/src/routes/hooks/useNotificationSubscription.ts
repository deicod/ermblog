import { useEffect } from "react";
import { requestSubscription, useRelayEnvironment, type GraphQLSubscriptionConfig } from "react-relay";

import type { NotificationCategory } from "../../providers/NotificationPreferencesProvider";
import { useNotificationPreferences } from "../../providers/NotificationPreferencesProvider";

export function useNotificationSubscription<T>(
  category: NotificationCategory,
  config: GraphQLSubscriptionConfig<T>,
): void {
  const environment = useRelayEnvironment();
  const { isCategoryEnabled } = useNotificationPreferences();

  useEffect(() => {
    if (!isCategoryEnabled(category)) {
      return undefined;
    }
    const disposable = requestSubscription(environment, config);
    return () => {
      disposable.dispose();
    };
  }, [category, config, environment, isCategoryEnabled]);
}
