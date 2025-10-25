import type { UserRecord } from "./UsersManager";

type UsersTableProps = {
  users: ReadonlyArray<UserRecord>;
  emptyMessage: string;
  onEdit: (userId: string) => void;
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

function summarizeBio(value: string | null): string {
  if (!value) {
    return "Bio pending";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "Bio pending";
  }
  if (trimmed.length <= 120) {
    return trimmed;
  }
  return `${trimmed.slice(0, 117)}…`;
}

function summarizeRoles(roles: ReadonlyArray<{ name: string }>): string {
  if (!roles.length) {
    return "No roles assigned";
  }
  return roles.map((role) => role.name).join(", ");
}

export function UsersTable({ users, emptyMessage, onEdit }: UsersTableProps) {
  return (
    <table className="users-table__table">
      <thead>
        <tr>
          <th scope="col">Username</th>
          <th scope="col">Display name</th>
          <th scope="col">Contact</th>
          <th scope="col">Profile</th>
          <th scope="col">Roles</th>
          <th scope="col">Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={7} className="users-table__empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id}>
              <th scope="row">{user.username}</th>
              <td>{user.displayName ?? "—"}</td>
              <td>
                <div className="users-table__contact">
                  <span>{user.email}</span>
                  {user.websiteURL ? <span>{user.websiteURL}</span> : null}
                </div>
              </td>
              <td>
                <div className="users-table__profile">
                  <span>{summarizeBio(user.bio)}</span>
                  {user.avatarURL ? <span>{user.avatarURL}</span> : null}
                </div>
              </td>
              <td>{summarizeRoles(user.roles)}</td>
              <td>{formatTimestamp(user.createdAt, user.updatedAt)}</td>
              <td className="users-table__actions">
                <button type="button" onClick={() => onEdit(user.id)}>
                  Edit user
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default UsersTable;
