import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { UserFormDialogCreateUserMutation } from "./__generated__/UserFormDialogCreateUserMutation.graphql";
import type {
  UserFormDialogUpdateUserMutation,
  UserFormDialogUpdateUserMutation$variables,
} from "./__generated__/UserFormDialogUpdateUserMutation.graphql";
import type { UserFormDialogAssignUserRolesMutation } from "./__generated__/UserFormDialogAssignUserRolesMutation.graphql";
import type { UserFormDialogRemoveUserRolesMutation } from "./__generated__/UserFormDialogRemoveUserRolesMutation.graphql";
import type { RoleOption, UserRecord } from "./UsersManager";

type UserFormState = {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarURL: string;
  websiteURL: string;
  password: string;
  passwordConfirmation: string;
  selectedRoleIds: string[];
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

const assignUserRolesMutation = graphql`
  mutation UserFormDialogAssignUserRolesMutation($input: AssignUserRolesInput!) {
    assignUserRoles(input: $input) {
      user {
        id
      }
    }
  }
`;

const removeUserRolesMutation = graphql`
  mutation UserFormDialogRemoveUserRolesMutation($input: RemoveUserRolesInput!) {
    removeUserRoles(input: $input) {
      user {
        id
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
    password: "",
    passwordConfirmation: "",
    selectedRoleIds: user?.roles.map((role) => role.id) ?? [],
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
  passwordRequired: boolean;
  confirmationRequired: boolean;
  errorMessage: string | null;
  onFieldChange: (field: keyof UserFormState, value: string) => void;
  availableRoles: ReadonlyArray<RoleOption>;
  selectedRoleIds: ReadonlyArray<string>;
  onRoleToggle: (roleId: string, selected: boolean) => void;
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
  passwordRequired,
  confirmationRequired,
  errorMessage,
  onFieldChange,
  availableRoles,
  selectedRoleIds,
  onRoleToggle,
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
      password: `${idPrefix}-password`,
      confirmPassword: `${idPrefix}-confirm-password`,
      roles: `${idPrefix}-roles`,
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
            <label htmlFor={ids.password}>Password</label>
            <input
              id={ids.password}
              type="password"
              value={state.password}
              onChange={(event) => onFieldChange("password", event.target.value)}
              required={passwordRequired}
              disabled={busy}
              autoComplete="new-password"
              placeholder={passwordRequired ? "Set an initial password" : "Provide a new password"}
            />
          </div>
          <div className="user-dialog__field">
            <label htmlFor={ids.confirmPassword}>Confirm password</label>
            <input
              id={ids.confirmPassword}
              type="password"
              value={state.passwordConfirmation}
              onChange={(event) => onFieldChange("passwordConfirmation", event.target.value)}
              required={passwordRequired || confirmationRequired}
              disabled={busy}
              autoComplete="new-password"
              placeholder="Re-enter the password"
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
          <fieldset className="user-dialog__field" aria-labelledby={ids.roles} disabled={busy}>
            <legend id={ids.roles}>Roles</legend>
            {availableRoles.length === 0 ? (
              <p className="user-dialog__roles-empty">No roles available.</p>
            ) : (
              <div className="user-dialog__roles">
                {availableRoles.map((role) => (
                  <label key={role.id} className="user-dialog__role-option">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={(event) => onRoleToggle(role.id, event.target.checked)}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {errorMessage ? (
            <div className="user-dialog__error" role="alert">
              {errorMessage}
            </div>
          ) : null}
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

type UserCreateDialogProps = UserDialogCallbacks & {
  availableRoles: ReadonlyArray<RoleOption>;
};

export function UserCreateDialog({ availableRoles, onClose, onSuccess, onError }: UserCreateDialogProps) {
  const [state, setState] = useState<UserFormState>(() => buildInitialState());
  const [commitCreate, isCreating] = useMutation<UserFormDialogCreateUserMutation>(createUserMutation);
  const [commitAssignRoles, isAssigningRoles] =
    useMutation<UserFormDialogAssignUserRolesMutation>(assignUserRolesMutation);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = useCallback((field: keyof UserFormState, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }, []);

  const handleRoleToggle = useCallback((roleId: string, selected: boolean) => {
    setState((current) => {
      const next = new Set(current.selectedRoleIds);
      if (selected) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return { ...current, selectedRoleIds: Array.from(next) };
    });
    setFormError(null);
  }, []);

  const assignRoles = useCallback(
    (userId: string, roleIds: string[]) =>
      new Promise<void>((resolve, reject) => {
        if (roleIds.length === 0) {
          resolve();
          return;
        }
        commitAssignRoles({
          variables: { input: { userID: userId, roleIDs: roleIds } },
          onCompleted: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    [commitAssignRoles],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const username = state.username.trim();
      const email = state.email.trim();
      const password = state.password.trim();
      const passwordConfirmation = state.passwordConfirmation.trim();

      if (!username || !email) {
        onError("Username and email are required fields.");
        return;
      }

      if (!password) {
        setFormError("Password is required.");
        return;
      }

      if (password !== passwordConfirmation) {
        setFormError("Password confirmation must match.");
        return;
      }

      setFormError(null);

      commitCreate({
        variables: {
          input: {
            username,
            email,
            password,
            displayName: normalizeOptional(state.displayName),
            bio: normalizeOptional(state.bio),
            avatarURL: normalizeOptional(state.avatarURL),
            websiteURL: normalizeOptional(state.websiteURL),
          },
        },
        onCompleted: async (response, errors) => {
          if (errors && errors.length > 0) {
            const message = errors.map((error) => error.message).join(" ") || "Unable to create the user. Try again.";
            setFormError(message);
            onError(message);
            return;
          }

          const newUserId = response.createUser?.user?.id ?? undefined;

          if (newUserId && state.selectedRoleIds.length > 0) {
            try {
              await assignRoles(newUserId, state.selectedRoleIds);
            } catch (error) {
              const message =
                (error instanceof Error ? error.message : null) || "Unable to assign roles to the new user. Try again.";
              setFormError(message);
              onError(message);
              return;
            }
          }

          onSuccess("User created successfully.", { userId: newUserId });
          onClose();
          setState(buildInitialState());
          setFormError(null);
        },
        onError: (error) => {
          const message = error.message || "Unable to create the user. Try again.";
          setFormError(message);
          onError(message);
        },
      });
    },
    [assignRoles, commitCreate, onClose, onError, onSuccess, state],
  );

  return (
    <UserFormDialogBase
      idPrefix="user-create-dialog"
      title="Create new user"
      description="Provision a new account, capture contact details, and seed profile metadata for downstream services."
      submitLabel="Create user"
      state={state}
      busy={isCreating || isAssigningRoles}
      passwordRequired
      confirmationRequired
      errorMessage={formError}
      onFieldChange={handleChange}
      availableRoles={availableRoles}
      selectedRoleIds={state.selectedRoleIds}
      onRoleToggle={handleRoleToggle}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}

type UserEditDialogProps = UserDialogCallbacks & {
  user: UserRecord;
  availableRoles: ReadonlyArray<RoleOption>;
};

export function UserEditDialog({ user, availableRoles, onClose, onSuccess, onError }: UserEditDialogProps) {
  const [state, setState] = useState<UserFormState>(() => buildInitialState(user));
  const [commitUpdate, isUpdating] = useMutation<UserFormDialogUpdateUserMutation>(updateUserMutation);
  const [commitAssignRoles, isAssigningRoles] =
    useMutation<UserFormDialogAssignUserRolesMutation>(assignUserRolesMutation);
  const [commitRemoveRoles, isRemovingRoles] =
    useMutation<UserFormDialogRemoveUserRolesMutation>(removeUserRolesMutation);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setState(buildInitialState(user));
    setFormError(null);
  }, [user]);

  const initialRoleIds = useMemo(() => user.roles.map((role) => role.id), [user.roles]);

  const handleChange = useCallback((field: keyof UserFormState, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }, []);

  const handleRoleToggle = useCallback((roleId: string, selected: boolean) => {
    setState((current) => {
      const next = new Set(current.selectedRoleIds);
      if (selected) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return { ...current, selectedRoleIds: Array.from(next) };
    });
    setFormError(null);
  }, []);

  const assignRoles = useCallback(
    (userId: string, roleIds: string[]) =>
      new Promise<void>((resolve, reject) => {
        if (roleIds.length === 0) {
          resolve();
          return;
        }
        commitAssignRoles({
          variables: { input: { userID: userId, roleIDs: roleIds } },
          onCompleted: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    [commitAssignRoles],
  );

  const removeRoles = useCallback(
    (userId: string, roleIds: string[]) =>
      new Promise<void>((resolve, reject) => {
        if (roleIds.length === 0) {
          resolve();
          return;
        }
        commitRemoveRoles({
          variables: { input: { userID: userId, roleIDs: roleIds } },
          onCompleted: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
    [commitRemoveRoles],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const username = state.username.trim();
      const email = state.email.trim();
      const password = state.password.trim();
      const passwordConfirmation = state.passwordConfirmation.trim();

      if (!username || !email) {
        onError("Username and email are required fields.");
        return;
      }

      const input: UserFormDialogUpdateUserMutation$variables["input"] = {
        id: user.id,
        username,
        email,
        displayName: normalizeOptional(state.displayName),
        bio: normalizeOptional(state.bio),
        avatarURL: normalizeOptional(state.avatarURL),
        websiteURL: normalizeOptional(state.websiteURL),
      };

      if (password || passwordConfirmation) {
        if (!password) {
          setFormError("Password is required when resetting an account.");
          return;
        }
        if (password !== passwordConfirmation) {
          setFormError("Password confirmation must match.");
          return;
        }
        input.password = password;
      }

      setFormError(null);

      commitUpdate({
        variables: { input },
        onCompleted: async (response, errors) => {
          if (errors && errors.length > 0) {
            const message = errors.map((error) => error.message).join(" ") || "Unable to update the user. Try again.";
            setFormError(message);
            onError(message);
            return;
          }

          const rolesToAssign = state.selectedRoleIds.filter((id) => !initialRoleIds.includes(id));
          const rolesToRemove = initialRoleIds.filter((id) => !state.selectedRoleIds.includes(id));

          try {
            await assignRoles(user.id, rolesToAssign);
            await removeRoles(user.id, rolesToRemove);
          } catch (error) {
            const message =
              (error instanceof Error ? error.message : null) || "Unable to update the user's roles. Try again.";
            setFormError(message);
            onError(message);
            return;
          }

          onSuccess("User profile updated successfully.");
          onClose();
          setFormError(null);
        },
        onError: (error) => {
          const message = error.message || "Unable to update the user. Try again.";
          setFormError(message);
          onError(message);
        },
      });
    },
    [assignRoles, commitUpdate, initialRoleIds, onClose, onError, onSuccess, removeRoles, state, user.id],
  );

  return (
    <UserFormDialogBase
      idPrefix={`user-edit-dialog-${user.id}`}
      title="Update user"
      description={`Edit contact channels and profile details for ${user.username}.`}
      submitLabel="Save changes"
      state={state}
      busy={isUpdating || isAssigningRoles || isRemovingRoles}
      passwordRequired={false}
      confirmationRequired={Boolean(state.password)}
      errorMessage={formError}
      onFieldChange={handleChange}
      availableRoles={availableRoles}
      selectedRoleIds={state.selectedRoleIds}
      onRoleToggle={handleRoleToggle}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
}
