package gen

import (
	"context"
	"fmt"
)

const (
	assignUserRoleQuery = `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (role_id, user_id) DO NOTHING`
	removeUserRoleQuery = `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`
)

func (c *Client) AssignUserRoles(ctx context.Context, userID string, roleIDs []string) error {
	if c == nil {
		return fmt.Errorf("orm client is not configured")
	}
	if userID == "" {
		return fmt.Errorf("userID is required")
	}
	seen := make(map[string]struct{}, len(roleIDs))
	for _, roleID := range roleIDs {
		if roleID == "" {
			return fmt.Errorf("roleID is required")
		}
		if _, ok := seen[roleID]; ok {
			continue
		}
		seen[roleID] = struct{}{}
		if _, err := c.db.Pool.Exec(ctx, assignUserRoleQuery, userID, roleID); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) RemoveUserRoles(ctx context.Context, userID string, roleIDs []string) error {
	if c == nil {
		return fmt.Errorf("orm client is not configured")
	}
	if userID == "" {
		return fmt.Errorf("userID is required")
	}
	seen := make(map[string]struct{}, len(roleIDs))
	for _, roleID := range roleIDs {
		if roleID == "" {
			return fmt.Errorf("roleID is required")
		}
		if _, ok := seen[roleID]; ok {
			continue
		}
		seen[roleID] = struct{}{}
		if _, err := c.db.Pool.Exec(ctx, removeUserRoleQuery, userID, roleID); err != nil {
			return err
		}
	}
	return nil
}

func (c *Client) ListRolesForUser(ctx context.Context, userID string) ([]*Role, error) {
	if c == nil {
		return nil, fmt.Errorf("orm client is not configured")
	}
	if userID == "" {
		return nil, fmt.Errorf("userID is required")
	}
	user, err := c.Users().ByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return []*Role{}, nil
	}
	if err := c.Users().LoadRoles(ctx, user); err != nil {
		return nil, err
	}
	if user.Edges == nil || user.Edges.Roles == nil {
		return []*Role{}, nil
	}
	roles := make([]*Role, 0, len(user.Edges.Roles))
	for _, role := range user.Edges.Roles {
		if role != nil {
			roles = append(roles, role)
		}
	}
	return roles, nil
}

func (c *Client) ListUsersForRole(ctx context.Context, roleID string) ([]*User, error) {
	if c == nil {
		return nil, fmt.Errorf("orm client is not configured")
	}
	if roleID == "" {
		return nil, fmt.Errorf("roleID is required")
	}
	role, err := c.Roles().ByID(ctx, roleID)
	if err != nil {
		return nil, err
	}
	if role == nil {
		return []*User{}, nil
	}
	if err := c.Roles().LoadUsers(ctx, role); err != nil {
		return nil, err
	}
	if role.Edges == nil || role.Edges.Users == nil {
		return []*User{}, nil
	}
	users := make([]*User, 0, len(role.Edges.Users))
	for _, user := range role.Edges.Users {
		if user != nil {
			users = append(users, user)
		}
	}
	return users, nil
}
