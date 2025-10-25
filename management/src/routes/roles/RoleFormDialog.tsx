import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { graphql, useMutation } from "react-relay";

import type { RoleFormDialogCreateRoleMutation } from "./__generated__/RoleFormDialogCreateRoleMutation.graphql";
import type { RoleFormDialogUpdateRoleMutation } from "./__generated__/RoleFormDialogUpdateRoleMutation.graphql";
import type { RoleRecord } from "./RolesManager";

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  capabilities: string;
};

type RoleDialogCallbacks = {
  onClose: () => void;
  onSuccess: (message: string, options?: { roleId?: string }) => void;
  onError: (message: string) => void;
};

type RoleFormDialogProps =
  | ({ mode: "create" } & RoleDialogCallbacks)
  | ({ mode: "edit"; role: RoleRecord } & RoleDialogCallbacks);

const createRoleMutation = graphql`
  mutation RoleFormDialogCreateRoleMutation($input: CreateRoleInput!) {
    createRole(input: $input) {
      role {
        id
        name
        slug
        description
        capabilities
        createdAt
        updatedAt
      }
    }
  }
`;

const updateRoleMutation = graphql`
  mutation RoleFormDialogUpdateRoleMutation($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      role {
        id
        name
        slug
        description
        capabilities
        createdAt
        updatedAt
      }
    }
  }
`;

function formatCapabilities(capabilities: Record<string, unknown>): string {
  try {
    return JSON.stringify(capabilities, null, 2);
  } catch (error) {
    return "{}";
  }
}

function buildInitialState(mode: "create" | "edit", role: RoleRecord | null): RoleFormState {
  if (mode === "edit" && role) {
    return {
      name: role.name,
      slug: role.slug,
      description: role.description ?? "",
      capabilities: formatCapabilities(role.capabilities),
    };
  }

  return {
    name: "",
    slug: "",
    description: "",
    capabilities: "{}",
  };
}

function normalizeOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function RoleFormDialog(props: RoleFormDialogProps) {
  const { mode, onClose, onSuccess, onError } = props;
  const role = mode === "edit" ? props.role : null;
  const [createRole, isCreating] = useMutation<RoleFormDialogCreateRoleMutation>(createRoleMutation);
  const [updateRole, isUpdating] = useMutation<RoleFormDialogUpdateRoleMutation>(updateRoleMutation);

  const [state, setState] = useState<RoleFormState>(() => buildInitialState(mode, role));
  const [capabilitiesAreValid, setCapabilitiesAreValid] = useState(true);

  useEffect(() => {
    setState(buildInitialState(mode, role));
    setCapabilitiesAreValid(true);
  }, [mode, role?.id]);

  const busy = mode === "create" ? isCreating : isUpdating;

  const ids = useMemo(() => {
    const prefix = mode === "create" ? "create-role" : `edit-role-${role?.id ?? ""}`;
    return {
      heading: `${prefix}-heading`,
      name: `${prefix}-name`,
      slug: `${prefix}-slug`,
      description: `${prefix}-description`,
      capabilities: `${prefix}-capabilities`,
    };
  }, [mode, role?.id]);

  const handleFieldChange = (field: keyof RoleFormState, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
    if (field === "capabilities") {
      try {
        const trimmed = value.trim();
        JSON.parse(trimmed.length === 0 ? "{}" : trimmed);
        setCapabilitiesAreValid(true);
      } catch (error) {
        setCapabilitiesAreValid(false);
      }
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const trimmedName = state.name.trim();
    const trimmedSlug = state.slug.trim();
    if (!trimmedName || !trimmedSlug) {
      return;
    }

    let capabilitiesValue: unknown = {};
    try {
      const draft = state.capabilities.trim();
      capabilitiesValue = draft.length === 0 ? {} : JSON.parse(draft);
      setCapabilitiesAreValid(true);
    } catch (error) {
      setCapabilitiesAreValid(false);
      return;
    }

    const baseInput = {
      name: trimmedName,
      slug: trimmedSlug,
      description: normalizeOptional(state.description),
      capabilities: capabilitiesValue,
    };

    if (mode === "create") {
      createRole({
        variables: {
          input: baseInput,
        },
        onCompleted: (response) => {
          const roleId = response.createRole?.role?.id ?? undefined;
          onSuccess("Role created successfully.", roleId ? { roleId } : undefined);
        },
        onError: (error) => {
          onError(error.message);
        },
      });
      return;
    }

    if (!role) {
      return;
    }

    updateRole({
      variables: {
        input: {
          id: role.id,
          ...baseInput,
        },
      },
      onCompleted: () => {
        onSuccess("Role updated successfully.");
      },
      onError: (error) => {
        onError(error.message);
      },
    });
  };

  return (
    <div className="role-dialog" role="dialog" aria-modal="true" aria-labelledby={ids.heading}>
      <div className="role-dialog__panel">
        <div>
          <h3 id={ids.heading}>{mode === "create" ? "Create a new role" : "Edit role"}</h3>
          <p className="role-dialog__description">
            {mode === "create"
              ? "Provide a unique name, slug, and capability JSON payload to create a new role."
              : `Update the details and capabilities for “${role?.name ?? ""}”.`}
          </p>
        </div>
        <form className="role-dialog__form" onSubmit={handleSubmit}>
          <label htmlFor={ids.name} className="role-dialog__field">
            <span>Name</span>
            <input
              id={ids.name}
              type="text"
              value={state.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              required
              disabled={busy}
              placeholder="Support"
            />
          </label>
          <label htmlFor={ids.slug} className="role-dialog__field">
            <span>Slug</span>
            <input
              id={ids.slug}
              type="text"
              value={state.slug}
              onChange={(event) => handleFieldChange("slug", event.target.value)}
              required
              disabled={busy}
              placeholder="support"
            />
          </label>
          <label htmlFor={ids.description} className="role-dialog__field">
            <span>Description</span>
            <input
              id={ids.description}
              type="text"
              value={state.description}
              onChange={(event) => handleFieldChange("description", event.target.value)}
              disabled={busy}
              placeholder="Summarize the responsibilities"
            />
          </label>
          <label htmlFor={ids.capabilities} className="role-dialog__field">
            <span>Capabilities JSON</span>
            <textarea
              id={ids.capabilities}
              value={state.capabilities}
              onChange={(event) => handleFieldChange("capabilities", event.target.value)}
              rows={10}
              disabled={busy}
              aria-invalid={!capabilitiesAreValid}
            />
          </label>
          {!capabilitiesAreValid ? (
            <p role="alert" className="role-dialog__error">
              Capabilities must be valid JSON.
            </p>
          ) : null}
          <div className="role-dialog__actions">
            <button type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" disabled={busy || !capabilitiesAreValid}>
              {busy ? "Saving…" : mode === "create" ? "Create role" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleFormDialog;

