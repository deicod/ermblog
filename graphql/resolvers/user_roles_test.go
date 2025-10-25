package resolvers

import (
	"context"
	"testing"

	graphql "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/relay"
	"github.com/deicod/ermblog/orm/gen"
)

type testUserProvider struct {
	records map[string]*gen.User
}

func (p *testUserProvider) ByID(_ context.Context, id string) (*gen.User, error) {
	if p == nil {
		return nil, nil
	}
	return p.records[id], nil
}

type testRoleProvider struct {
	records map[string]*gen.Role
}

func (p *testRoleProvider) ByID(_ context.Context, id string) (*gen.Role, error) {
	if p == nil {
		return nil, nil
	}
	return p.records[id], nil
}

type stubUserRoleManager struct {
	assignCalls []struct {
		userID  string
		roleIDs []string
	}
	removeCalls []struct {
		userID  string
		roleIDs []string
	}
	rolesByUser map[string][]*gen.Role
	usersByRole map[string][]*gen.User
}

func (s *stubUserRoleManager) AssignUserRoles(_ context.Context, userID string, roleIDs []string) error {
	s.assignCalls = append(s.assignCalls, struct {
		userID  string
		roleIDs []string
	}{userID: userID, roleIDs: append([]string(nil), roleIDs...)})
	return nil
}

func (s *stubUserRoleManager) RemoveUserRoles(_ context.Context, userID string, roleIDs []string) error {
	s.removeCalls = append(s.removeCalls, struct {
		userID  string
		roleIDs []string
	}{userID: userID, roleIDs: append([]string(nil), roleIDs...)})
	return nil
}

func (s *stubUserRoleManager) ListRolesForUser(_ context.Context, userID string) ([]*gen.Role, error) {
	if s == nil || s.rolesByUser == nil {
		return []*gen.Role{}, nil
	}
	return append([]*gen.Role(nil), s.rolesByUser[userID]...), nil
}

func (s *stubUserRoleManager) ListUsersForRole(_ context.Context, roleID string) ([]*gen.User, error) {
	if s == nil || s.usersByRole == nil {
		return []*gen.User{}, nil
	}
	return append([]*gen.User(nil), s.usersByRole[roleID]...), nil
}

func TestAssignUserRolesInvokesServiceWithNativeIDs(t *testing.T) {
	userID := "user-123"
	encodedUserID := relay.ToGlobalID("User", userID)
	role1 := "role-1"
	role2 := "role-2"

	manager := &stubUserRoleManager{}
	resolver := &Resolver{
		users: &testUserProvider{records: map[string]*gen.User{
			userID: {ID: userID, Username: "tester"},
		}},
		roles: &testRoleProvider{records: map[string]*gen.Role{
			role1: {ID: role1, Name: "Author"},
			role2: {ID: role2, Name: "Editor"},
		}},
		userRoles: manager,
	}

	clientMutationID := "track-me"
	input := graphql.AssignUserRolesInput{
		ClientMutationID: &clientMutationID,
		UserID:           encodedUserID,
		RoleIDs: []string{
			relay.ToGlobalID("Role", role1),
			relay.ToGlobalID("Role", role2),
			relay.ToGlobalID("Role", role1),
		},
	}

	payload, err := (&mutationResolver{resolver}).AssignUserRoles(context.Background(), input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if payload == nil || payload.User == nil {
		t.Fatalf("expected user payload, got %#v", payload)
	}

	if payload.ClientMutationID == nil || *payload.ClientMutationID != clientMutationID {
		t.Fatalf("expected clientMutationId %q, got %#v", clientMutationID, payload.ClientMutationID)
	}

	if payload.User.ID != encodedUserID {
		t.Fatalf("expected user id %q, got %q", encodedUserID, payload.User.ID)
	}

	if len(manager.assignCalls) != 1 {
		t.Fatalf("expected 1 assign call, got %d", len(manager.assignCalls))
	}
	call := manager.assignCalls[0]
	if call.userID != userID {
		t.Fatalf("expected user id %q, got %q", userID, call.userID)
	}
	expectedRoles := []string{role1, role2}
	if len(call.roleIDs) != len(expectedRoles) {
		t.Fatalf("expected %d role ids, got %d", len(expectedRoles), len(call.roleIDs))
	}
	for i, id := range expectedRoles {
		if call.roleIDs[i] != id {
			t.Fatalf("expected role id %q at position %d, got %q", id, i, call.roleIDs[i])
		}
	}
}

func TestRemoveUserRolesInvokesServiceWithNativeIDs(t *testing.T) {
	userID := "user-1"
	encodedUserID := relay.ToGlobalID("User", userID)
	roleID := "role-9"

	manager := &stubUserRoleManager{}
	resolver := &Resolver{
		users: &testUserProvider{records: map[string]*gen.User{
			userID: {ID: userID, Username: "owner"},
		}},
		roles: &testRoleProvider{records: map[string]*gen.Role{
			roleID: {ID: roleID, Name: "Subscriber"},
		}},
		userRoles: manager,
	}

	input := graphql.RemoveUserRolesInput{
		UserID:  encodedUserID,
		RoleIDs: []string{relay.ToGlobalID("Role", roleID)},
	}

	payload, err := (&mutationResolver{resolver}).RemoveUserRoles(context.Background(), input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if payload == nil || payload.User == nil {
		t.Fatalf("expected user payload, got %#v", payload)
	}

	if len(manager.removeCalls) != 1 {
		t.Fatalf("expected 1 remove call, got %d", len(manager.removeCalls))
	}
	call := manager.removeCalls[0]
	if call.userID != userID {
		t.Fatalf("expected user id %q, got %q", userID, call.userID)
	}
	if len(call.roleIDs) != 1 || call.roleIDs[0] != roleID {
		t.Fatalf("expected role id %q, got %#v", roleID, call.roleIDs)
	}
}

func TestUserRolesConnectionReturnsSortedRoles(t *testing.T) {
	userID := "user-roles"
	encodedUserID := relay.ToGlobalID("User", userID)

	manager := &stubUserRoleManager{
		rolesByUser: map[string][]*gen.Role{
			userID: {
				{ID: "3", Name: "editor"},
				{ID: "1", Name: "administrator"},
				{ID: "2", Name: "author"},
			},
		},
	}

	resolver := &Resolver{userRoles: manager}
	user := &graphql.User{ID: encodedUserID}

	conn, err := resolver.User_roles(context.Background(), user, nil, nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conn == nil {
		t.Fatal("expected connection, got nil")
	}
	if conn.TotalCount != 3 {
		t.Fatalf("expected total count 3, got %d", conn.TotalCount)
	}
	if len(conn.Edges) != 3 {
		t.Fatalf("expected 3 edges, got %d", len(conn.Edges))
	}
	names := []string{"administrator", "author", "editor"}
	for i, edge := range conn.Edges {
		if edge == nil || edge.Node == nil {
			t.Fatalf("expected edge %d to have node, got %#v", i, edge)
		}
		if edge.Node.Name != names[i] {
			t.Fatalf("expected role name %q at position %d, got %q", names[i], i, edge.Node.Name)
		}
	}
}

func TestRoleUsersConnectionReturnsSortedUsers(t *testing.T) {
	roleID := "role-users"
	encodedRoleID := relay.ToGlobalID("Role", roleID)

	manager := &stubUserRoleManager{
		usersByRole: map[string][]*gen.User{
			roleID: {
				{ID: "2", Username: "zoe"},
				{ID: "3", Username: "amy"},
				{ID: "1", Username: "amy"},
			},
		},
	}

	resolver := &Resolver{userRoles: manager}
	role := &graphql.Role{ID: encodedRoleID}

	conn, err := resolver.Role_users(context.Background(), role, nil, nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conn == nil {
		t.Fatal("expected connection, got nil")
	}
	if conn.TotalCount != 3 {
		t.Fatalf("expected total count 3, got %d", conn.TotalCount)
	}
	if len(conn.Edges) != 3 {
		t.Fatalf("expected 3 edges, got %d", len(conn.Edges))
	}
	usernames := []string{"amy", "amy", "zoe"}
	ids := []string{"1", "3", "2"}
	for i, edge := range conn.Edges {
		if edge == nil || edge.Node == nil {
			t.Fatalf("expected edge %d to have node, got %#v", i, edge)
		}
		if edge.Node.Username != usernames[i] {
			t.Fatalf("expected username %q at position %d, got %q", usernames[i], i, edge.Node.Username)
		}
		if _, nativeID, err := relay.FromGlobalID(edge.Node.ID); err != nil || nativeID != ids[i] {
			t.Fatalf("expected native id %q at position %d, got %q (err=%v)", ids[i], i, nativeID, err)
		}
	}
}
