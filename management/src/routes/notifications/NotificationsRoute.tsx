import "./notifications.css";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";

import type { NotificationsRouteMutation } from "./__generated__/NotificationsRouteMutation.graphql";
import type { NotificationsRouteQuery } from "./__generated__/NotificationsRouteQuery.graphql";
import {
  type NotificationCategory,
  type NotificationPreferenceEntry,
  mapNotificationPreferencesEntries,
  normalizeNotificationPreferenceEntries,
  useNotificationPreferences,
} from "../../providers/NotificationPreferencesProvider";
import { useToast } from "../../providers/ToastProvider";

const notificationsRouteQuery = graphql`
  query NotificationsRouteQuery {
    notificationPreferences {
      entries {
        category
        enabled
      }
    }
  }
`;

const updateNotificationPreferencesMutation = graphql`
  mutation NotificationsRouteMutation(
    $input: UpdateNotificationPreferencesInput!
  ) {
    updateNotificationPreferences(input: $input) {
      preferences {
        entries {
          category
          enabled
        }
      }
    }
  }
`;

const CATEGORY_COPY: Record<NotificationCategory, { label: string; description: string }> = {
  COMMENT_CREATED: {
    label: "New comments",
    description: "Alerts when readers submit a fresh comment for moderation.",
  },
  COMMENT_UPDATED: {
    label: "Comment status changes",
    description: "Notifications when comment statuses shift between queues.",
  },
  COMMENT_DELETED: {
    label: "Comment removals",
    description: "Warnings when a moderator deletes or retracts a comment.",
  },
  POST_CREATED: {
    label: "Post creation",
    description: "Inform me when a draft or story is created in the newsroom.",
  },
  POST_UPDATED: {
    label: "Post updates",
    description: "Track status changes as posts move through the editorial pipeline.",
  },
  POST_DELETED: {
    label: "Post deletions",
    description: "Let me know when a post is archived or removed entirely.",
  },
};

function cloneEntries(entries: NotificationPreferenceEntry[]): NotificationPreferenceEntry[] {
  return entries.map((entry) => ({ ...entry }));
}

function areEntriesEqual(
  a: NotificationPreferenceEntry[],
  b: NotificationPreferenceEntry[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((entry, index) => {
    const other = b[index];
    return other?.category === entry.category && other?.enabled === entry.enabled;
  });
}

export function NotificationsRoute() {
  const data = useLazyLoadQuery<NotificationsRouteQuery>(
    notificationsRouteQuery,
    {},
    { fetchPolicy: "store-or-network" },
  );
  const queryEntries = mapNotificationPreferencesEntries(data.notificationPreferences ?? null);
  const { setEntries } = useNotificationPreferences();
  const { showToast } = useToast();
  const [formEntries, setFormEntries] = useState<NotificationPreferenceEntry[]>(() =>
    cloneEntries(queryEntries),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const savedEntriesRef = useRef<NotificationPreferenceEntry[]>(cloneEntries(queryEntries));
  const serialisedEntriesRef = useRef<string | null>(JSON.stringify(savedEntriesRef.current));
  const [commitMutation, isInFlight] = useMutation<NotificationsRouteMutation>(
    updateNotificationPreferencesMutation,
  );

  useEffect(() => {
    const serialised = JSON.stringify(queryEntries);
    if (serialisedEntriesRef.current === serialised) {
      return;
    }
    serialisedEntriesRef.current = serialised;
    savedEntriesRef.current = cloneEntries(queryEntries);
    setEntries(savedEntriesRef.current);
    setFormEntries(cloneEntries(queryEntries));
    setErrorMessage(null);
  }, [queryEntries, setEntries]);

  const handleToggle = useCallback((category: NotificationCategory) => {
    setFormEntries((current) =>
      current.map((entry) =>
        entry.category === category ? { ...entry, enabled: !entry.enabled } : entry,
      ),
    );
    setErrorMessage(null);
  }, []);

  const isDirty = useMemo(() => {
    return !areEntriesEqual(formEntries, savedEntriesRef.current);
  }, [formEntries]);

  const statusText = useMemo(() => {
    if (isDirty) {
      return "You have unapplied notification changes.";
    }
    if (lastSavedAt) {
      return `Preferences saved at ${lastSavedAt.toLocaleTimeString()}.`;
    }
    return "Preferences sync both toast notifications and live subscriptions.";
  }, [isDirty, lastSavedAt]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isDirty) {
        return;
      }

      setErrorMessage(null);
      const normalized = normalizeNotificationPreferenceEntries(formEntries);

      commitMutation({
        variables: {
          input: {
            preferences: normalized.map((entry) => ({
              category: entry.category,
              enabled: entry.enabled,
            })),
          },
        },
        onCompleted: (response) => {
          const nextEntries = mapNotificationPreferencesEntries(
            response.updateNotificationPreferences?.preferences ?? null,
          );
          savedEntriesRef.current = cloneEntries(nextEntries);
          serialisedEntriesRef.current = JSON.stringify(savedEntriesRef.current);
          setEntries(savedEntriesRef.current);
          setFormEntries(cloneEntries(nextEntries));
          setLastSavedAt(new Date());
          showToast({
            title: "Preferences saved",
            message: "Notification categories updated successfully.",
            intent: "success",
          });
        },
        onError: () => {
          setErrorMessage("Unable to save preferences. Please try again.");
        },
      });
    },
    [commitMutation, formEntries, isDirty, setEntries, showToast],
  );

  return (
    <section aria-labelledby="notification-preferences-heading" className="notifications-route">
      <header className="notifications-route__header">
        <h2 id="notification-preferences-heading">Notification preferences</h2>
        <p>
          Decide which event categories establish live subscriptions and surface toast alerts so
          that your team receives relevant updates without excess noise.
        </p>
      </header>

      <form className="notifications-route__form" onSubmit={handleSubmit}>
        <div className="notifications-route__preferences" role="group" aria-label="Notification categories">
          {formEntries.map((entry) => {
            const copy = CATEGORY_COPY[entry.category];
            const inputId = `notification-category-${entry.category.toLowerCase().replace(/_/g, "-")}`;
            return (
              <div key={entry.category} className="notifications-route__preference">
                <div className="notifications-route__preference-details">
                  <label className="notifications-route__preference-title" htmlFor={inputId}>
                    {copy.label}
                  </label>
                  <p className="notifications-route__helper-text">{copy.description}</p>
                </div>
                <input
                  id={inputId}
                  className="notifications-route__checkbox"
                  type="checkbox"
                  role="switch"
                  checked={entry.enabled}
                  onChange={() => handleToggle(entry.category)}
                  aria-checked={entry.enabled}
                />
              </div>
            );
          })}
        </div>

        <div className="notifications-route__actions">
          <button
            type="submit"
            className="notifications-route__save-button"
            disabled={isInFlight || !isDirty}
          >
            {isInFlight ? "Saving…" : "Save changes"}
          </button>
          <span className="notifications-route__status-text" role="status">
            {statusText}
          </span>
        </div>

        {errorMessage ? (
          <p role="alert" className="notifications-route__error">
            {errorMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export default NotificationsRoute;
