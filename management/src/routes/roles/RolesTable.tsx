import type { RoleRecord } from "./RolesManager";

type RolesTableProps = {
  roles: ReadonlyArray<RoleRecord>;
  emptyMessage: string;
  disabled?: boolean;
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
};

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTimestamp(createdAt: string | null, updatedAt: string | null): string {
  const candidate = updatedAt ?? createdAt;
  if (!candidate) {
    return "—";
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  return timestampFormatter.format(parsed);
}

function collectCapabilityKeys(capabilities: Record<string, unknown>): string[] {
  return Object.entries(capabilities)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([key]) => key)
    .sort((a, b) => a.localeCompare(b));
}

function summarizeCapabilities(capabilities: Record<string, unknown>): {
  names: string;
  countLabel: string;
} {
  const keys = collectCapabilityKeys(capabilities);
  if (keys.length === 0) {
    return {
      names: "No capabilities assigned",
      countLabel: "0 capabilities",
    };
  }

  const visible = keys.slice(0, 3);
  const remainder = keys.length - visible.length;
  const nameSummary = remainder > 0 ? `${visible.join(", ")}…` : visible.join(", ");

  return {
    names: nameSummary,
    countLabel: `${keys.length} ${keys.length === 1 ? "capability" : "capabilities"}`,
  };
}

export function RolesTable({ roles, emptyMessage, disabled, onEdit, onDelete }: RolesTableProps) {
  return (
    <table className="roles-table__table" aria-label="Roles">
      <thead>
        <tr>
          <th scope="col">Role</th>
          <th scope="col">Slug</th>
          <th scope="col">Description</th>
          <th scope="col">Capabilities</th>
          <th scope="col">Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {roles.length === 0 ? (
          <tr>
            <td colSpan={6} className="roles-table__empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          roles.map((role) => {
            const summary = summarizeCapabilities(role.capabilities);
            return (
              <tr key={role.id}>
                <th scope="row">{role.name}</th>
                <td>{role.slug}</td>
                <td>{role.description ?? "—"}</td>
                <td>
                  <div className="roles-table__capabilities">
                    <span>{summary.names}</span>
                    <span className="roles-table__capabilities-count">{summary.countLabel}</span>
                  </div>
                </td>
                <td>{formatTimestamp(role.createdAt, role.updatedAt)}</td>
                <td className="roles-table__actions">
                  <button type="button" onClick={() => onEdit(role.id)} disabled={disabled}>
                    Edit role
                  </button>
                  <button type="button" onClick={() => onDelete(role.id)} disabled={disabled}>
                    Delete role
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export default RolesTable;

