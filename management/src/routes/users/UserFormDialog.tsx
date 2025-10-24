import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { UserFormDialogCreateUserMutation } from "./__generated__/UserFormDialogCreateUserMutation.graphql";
import type { UserFormDialogUpdateUserMutation } from "./__generated__/UserFormDialogUpdateUserMutation.graphql";
import type { UserRecord } from "./UsersManager";

type UserFormState = {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarURL: string;
  websiteURL: string;
};

type UserDialogCallbacks = {
  onClose: () => void;
  onSuccess: (message: string, options?: { userId?: string }) => void;
  onError: (message: string) => void;
};

const createUserMutation = graphql`
  mutation UserFormDialogCreateUserMutation($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
        username
        email
        displayName
        bio
        avatarURL
        websiteURL
        createdAt
        updatedAt
      }
    }
  }
`;

const updateUserMutation = graphql`
  mutation UserFormDialogUpdateUserMutation($input: UpdateUserInput!) {
    updateUser(input: $input) {
      user {
        id
        username
        email
        displayName
        bio
        avatarURL
        websiteURL
        createdAt
        updatedAt
      }
    }
  }
`;

function buildInitialState(user?: UserRecord | null): UserFormState {
  return {
    username: user?.username ?? "",
    email: user?.email ?? "",
    displayName: user?.displayName ?? "",
    bio: user?.bio ?? "",
    avatarURL: user?.avatarURL ?? "",
    websiteURL: user?.websiteURL ?? "",
  };
}

function normalizeOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

type UserFormDialogBaseProps = {
  idPrefix: string;
  title: string;
  description: string;
  submitLabel: string;
  state: UserFormState;
  busy: boolean;
  onFieldChange: (field: keyof UserFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

function UserFormDialogBase({
  idPrefix,
  title,
  description,
  submitLabel,
  state,
  busy,
  onFieldChange,
  onSubmit,
  onClose,
}: UserFormDialogBaseProps) {
  const ids = useMemo(
    () => ({
      heading: `${idPrefix}-heading`,
      username: `${idPrefix}-username`,
      email: `${idPrefix}-email`,
      displayName: `${idPrefix}-display-name`,
      avatarURL: `${idPrefix}-avatar-url`,
      websiteURL: `${idPrefix}-website-url`,
      bio: `${idPrefix}-bio`,
    }),
    [idPrefix],
  );

  return (
    <div className="user-dialog" role="dialog" aria-modal="true" aria-labelledby={ids.heading}>
      <div className="user-dialog__panel">
        <div>
          <h3 id={ids.heading}>{title}</h3>
          <p className="user-dialog__description">{description}</p>
        </div>
        <form className="user-dialog__form" onSubmit={onSubmit}>
          <div className="user-dialog__field">
            <label htmlFor={ids.username}>Username</label>
            <input
              id={ids.username}
              type="text"
              value={state.username}
              onChange={(event) => onFieldChange("username", event.target.value)}
              required
              disabled={busy}
              placeholder="unique handle"
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.email}>Email</label>
            <input
              id={ids.email}
              type="email"
              value={state.email}
              onChange={(event) => onFieldChange("email", event.target.value)}
              required
              disabled={busy}
              placeholder="name@example.com"
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.displayName}>Display name</label>
            <input
              id={ids.displayName}
              type="text"
              value={state.displayName}
              onChange={(event) => onFieldChange("displayName", event.target.value)}
              disabled={busy}
              placeholder="Preferred display name"
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.websiteURL}>Website</label>
            <input
              id={ids.websiteURL}
              type="url"
              value={state.websiteURL}
              onChange={(event) => onFieldChange("websiteURL", event.target.value)}
              disabled={busy}
              placeholder="https://example.com"
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.avatarURL}>Avatar URL</label>
            <input
              id={ids.avatarURL}
              type="url"
              value={state.avatarURL}
              onChange={(event) => onFieldChange("avatarURL", event.target.value)}
              disabled={busy}
              placeholder="https://cdn.example/avatar.png"
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.bio}>Bio</label>
            <textarea
              id={ids.bio}
              value={state.bio}
              onChange={(event) => onFieldChange("bio", event.target.value)}
              disabled={busy}
              placeholder="Share a short summary or role description"
              rows={5}
            />
          </div>
          <div className="user-dialog__actions">
            <button type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserCreateDialog({ onClose, onSuccess, onError }: UserDialogCallbacks) {
  const [state, setState] = useState<UserFormState>(() => buildInitialState());
  const [commit, isInFlight] = useMutation<UserFormDialogCreateUserMutation>(createUserMutation);

  const handleChange = useCallback((field: keyof UserFormState, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const username = state.username.trim();
      const email = state.email.trim();

      if (!username || !email) {
        onError("Username and email are required fields.");
        return;
      }

      commit({
        variables: {
          input: {
            username,
            email,
            displayName: normalizeOptional(state.displayName),
            bio: normalizeOptional(state.bio),
            avatarURL: normalizeOptional(state.avatarURL),
            websiteURL: normalizeOptional(state.websiteURL),
          },
        },
        onCompleted: (response) => {
          const newUserId = response.createUser?.user?.id ?? undefined;
          onSuccess("User created successfully.", { userId: newUserId });
          onClose();
          setState(buildInitialState());
        },
        onError: () => {
          onError("Unable to create the user. Try again.");
        },
      });
    },
    [commit, onClose, onError, onSuccess, state],
  );

  return (
    <UserFormDialogBase
      idPrefix="user-create-dialog"
      title="Create new user"
      description="Provision a new account, capture contact details, and seed profile metadata for downstream services."
      submitLabel="Create user"
      state={state}
      busy={isInFlight}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}

type UserEditDialogProps = UserDialogCallbacks & {
  user: UserRecord;
};

export function UserEditDialog({ user, onClose, onSuccess, onError }: UserEditDialogProps) {
  const [state, setState] = useState<UserFormState>(() => buildInitialState(user));
  const [commit, isInFlight] = useMutation<UserFormDialogUpdateUserMutation>(updateUserMutation);

  useEffect(() => {
    setState(buildInitialState(user));
  }, [user]);

  const handleChange = useCallback((field: keyof UserFormState, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const username = state.username.trim();
      const email = state.email.trim();

      if (!username || !email) {
        onError("Username and email are required fields.");
        return;
      }

      commit({
        variables: {
          input: {
            id: user.id,
            username,
            email,
            displayName: normalizeOptional(state.displayName),
            bio: normalizeOptional(state.bio),
            avatarURL: normalizeOptional(state.avatarURL),
            websiteURL: normalizeOptional(state.websiteURL),
          },
        },
        onCompleted: () => {
          onSuccess("User profile updated successfully.");
          onClose();
        },
        onError: () => {
          onError("Unable to update the user. Try again.");
        },
      });
    },
    [commit, onClose, onError, onSuccess, state, user.id],
  );

  return (
    <UserFormDialogBase
      idPrefix={`user-edit-dialog-${user.id}`}
      title="Update user"
      description={`Edit contact channels and profile details for ${user.username}.`}
      submitLabel="Save changes"
      state={state}
      busy={isInFlight}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
