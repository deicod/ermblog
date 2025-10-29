import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchQuery, graphql, useRelayEnvironment } from "react-relay";

import type { NotificationPreferencesProviderQuery } from "./__generated__/NotificationPreferencesProviderQuery.graphql";
import { useSession } from "../session/SessionProvider";
import type { SessionToken } from "../session/tokenStorage";

const NOTIFICATION_CATEGORY_VALUES = [
  "COMMENT_CREATED",
  "COMMENT_UPDATED",
  "COMMENT_DELETED",
  "POST_CREATED",
  "POST_UPDATED",
  "POST_DELETED",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORY_VALUES)[number];

export type NotificationPreferenceEntry = {
  category: NotificationCategory;
  enabled: boolean;
};

export type NotificationPreferencesEntriesSource = {
  entries?:
    | Array<{
        category?: NotificationCategory | null;
        enabled?: boolean | null;
      } | null>
    | null;
} | null;

function buildDefaultEntries(): NotificationPreferenceEntry[] {
  return NOTIFICATION_CATEGORY_VALUES.map((category) => ({ category, enabled: true }));
}

export function normalizeNotificationPreferenceEntries(
  entries: NotificationPreferenceEntry[] | null | undefined,
): NotificationPreferenceEntry[] {
  const state = new Map<NotificationCategory, boolean>();
  for (const category of NOTIFICATION_CATEGORY_VALUES) {
    state.set(category, true);
  }
  if (entries) {
    for (const entry of entries) {
      if (!entry) {
        continue;
      }
      if (!state.has(entry.category)) {
        continue;
      }
      state.set(entry.category, Boolean(entry.enabled));
    }
  }
  return NOTIFICATION_CATEGORY_VALUES.map((category) => ({
    category,
    enabled: state.get(category) ?? true,
  }));
}

export function mapNotificationPreferencesEntries(
  source: NotificationPreferencesEntriesSource,
): NotificationPreferenceEntry[] {
  const rawEntries = source?.entries ?? [];
  const mapped = rawEntries
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .map((entry) => ({
      category: entry.category as NotificationCategory,
      enabled: entry.enabled ?? true,
    }));
  return normalizeNotificationPreferenceEntries(mapped);
}

export type NotificationPreferencesContextValue = {
  entries: NotificationPreferenceEntry[];
  isCategoryEnabled: (category: NotificationCategory) => boolean;
  setEntries: (entries: NotificationPreferenceEntry[]) => void;
  refresh: () => Promise<void>;
  isLoaded: boolean;
  loadErrorCount: number;
};

const NotificationPreferencesContext = createContext<NotificationPreferencesContextValue>({
  entries: buildDefaultEntries(),
  isCategoryEnabled: () => true,
  setEntries: () => {},
  refresh: async () => {},
  isLoaded: false,
  loadErrorCount: 0,
});

const notificationPreferencesQuery = graphql`
  query NotificationPreferencesProviderQuery {
    notificationPreferences {
      entries {
        category
        enabled
      }
    }
  }
`;

export function NotificationPreferencesProvider({ children }: { children: ReactNode }) {
  const environment = useRelayEnvironment();
  const { sessionToken } = useSession();
  const mountedRef = useRef(true);
  const sessionTokenRef = useRef<SessionToken | null>(sessionToken);
  const [entries, setEntriesState] = useState<NotificationPreferenceEntry[]>(() => buildDefaultEntries());
  const [isLoaded, setIsLoaded] = useState<boolean>(() => sessionToken == null);
  const [loadErrorCount, setLoadErrorCount] = useState<number>(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    sessionTokenRef.current = sessionToken;
  }, [sessionToken]);

  const setEntries = useCallback((nextEntries: NotificationPreferenceEntry[]) => {
    setEntriesState(normalizeNotificationPreferenceEntries(nextEntries));
  }, []);

  const loadPreferences = useCallback(async () => {
    const activeSessionToken = sessionTokenRef.current;
    if (!activeSessionToken) {
      return;
    }

    setIsLoaded(false);

    try {
      const data = await fetchQuery<NotificationPreferencesProviderQuery>(
        environment,
        notificationPreferencesQuery,
        {},
      ).toPromise();
      if (!mountedRef.current || sessionTokenRef.current !== activeSessionToken) {
        return;
      }
      setEntriesState(
        mapNotificationPreferencesEntries(data?.notificationPreferences ?? null),
      );
      setIsLoaded(true);
    } catch (error) {
      const isActive =
        mountedRef.current && sessionTokenRef.current === activeSessionToken;
      if (isActive) {
        setIsLoaded(true);
        setLoadErrorCount((count) => count + 1);
      }
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Failed to load notification preferences", error);
      }
      throw error;
    }
  }, [environment]);

  useEffect(() => {
    if (!sessionToken) {
      setEntriesState((currentEntries) => {
        const defaults = buildDefaultEntries();
        if (
          currentEntries.length === defaults.length &&
          currentEntries.every((entry, index) => {
            const defaultEntry = defaults[index];
            return (
              entry.category === defaultEntry.category && entry.enabled === defaultEntry.enabled
            );
          })
        ) {
          return currentEntries;
        }

        return defaults;
      });
      setIsLoaded(true);
      setLoadErrorCount(0);
      return;
    }

    setIsLoaded(false);
    void loadPreferences().catch(() => {});
  }, [loadPreferences, sessionToken]);

  const enabledMap = useMemo(() => {
    return entries.reduce<Record<NotificationCategory, boolean>>((acc, entry) => {
      acc[entry.category] = entry.enabled;
      return acc;
    }, Object.create(null));
  }, [entries]);

  const isCategoryEnabled = useCallback(
    (category: NotificationCategory) => {
      return enabledMap[category] !== false;
    },
    [enabledMap],
  );

  const contextValue = useMemo<NotificationPreferencesContextValue>(() => {
    return {
      entries,
      isCategoryEnabled,
      setEntries,
      refresh: loadPreferences,
      isLoaded,
      loadErrorCount,
    };
  }, [entries, isCategoryEnabled, isLoaded, loadPreferences, loadErrorCount, setEntries]);

  return (
    <NotificationPreferencesContext.Provider value={contextValue}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences(): NotificationPreferencesContextValue {
  return useContext(NotificationPreferencesContext);
}

export { NotificationPreferencesContext, NOTIFICATION_CATEGORY_VALUES as NOTIFICATION_CATEGORIES };
