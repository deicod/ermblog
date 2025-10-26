package resolvers

import (
	"context"
	"encoding/json"
	"testing"

	graphql "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/oidc"
	"github.com/deicod/ermblog/orm/gen"
)

type stubOptionRepository struct {
	records map[string]*gen.Option
	created []*gen.Option
	updated []*gen.Option
}

func newStubOptionRepository() *stubOptionRepository {
	return &stubOptionRepository{records: make(map[string]*gen.Option)}
}

func cloneOption(record *gen.Option) *gen.Option {
	if record == nil {
		return nil
	}
	clone := *record
	if record.Value != nil {
		clone.Value = append(json.RawMessage(nil), record.Value...)
	}
	return &clone
}

func (s *stubOptionRepository) FindByName(_ context.Context, name string) (*gen.Option, error) {
	if s == nil {
		return nil, nil
	}
	if record, ok := s.records[name]; ok {
		return cloneOption(record), nil
	}
	return nil, nil
}

func (s *stubOptionRepository) Create(_ context.Context, input *gen.Option) (*gen.Option, error) {
	if s == nil {
		s = newStubOptionRepository()
	}
	if input == nil {
		return nil, nil
	}
	record := cloneOption(input)
	if record.ID == "" {
		record.ID = "option-created"
	}
	s.records[record.Name] = cloneOption(record)
	s.created = append(s.created, cloneOption(record))
	return cloneOption(record), nil
}

func (s *stubOptionRepository) Update(_ context.Context, input *gen.Option) (*gen.Option, error) {
	if s == nil {
		return nil, nil
	}
	if input == nil {
		return nil, nil
	}
	record, ok := s.records[input.Name]
	if !ok {
		return nil, nil
	}
	if input.Value != nil {
		record.Value = append(json.RawMessage(nil), input.Value...)
	}
	if input.ID != "" {
		record.ID = input.ID
	}
	record.Autoload = input.Autoload
	s.records[input.Name] = cloneOption(record)
	s.updated = append(s.updated, cloneOption(record))
	return cloneOption(record), nil
}

func preferenceEntriesToMap(entries []*graphql.NotificationPreference) map[graphql.NotificationCategory]bool {
	result := make(map[graphql.NotificationCategory]bool, len(entries))
	for _, entry := range entries {
		result[entry.Category] = entry.Enabled
	}
	return result
}

func TestNotificationPreferencesDefaultsWhenNoOptionsExist(t *testing.T) {
	resolver := &Resolver{options: newStubOptionRepository()}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-default"})

	prefs, err := resolver.Query().NotificationPreferences(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(prefs.Entries) != len(notificationCategoryOrder) {
		t.Fatalf("expected %d entries, got %d", len(notificationCategoryOrder), len(prefs.Entries))
	}

	for _, entry := range prefs.Entries {
		if !entry.Enabled {
			t.Errorf("expected category %s to be enabled by default", entry.Category)
		}
	}
}

func TestNotificationPreferencesLoadStoredValues(t *testing.T) {
	repo := newStubOptionRepository()
	stored := storedNotificationPreferences{Preferences: map[string]bool{
		string(graphql.NotificationCategoryCommentCreated): false,
		string(graphql.NotificationCategoryPostDeleted):    false,
	}}
	data, err := json.Marshal(&stored)
	if err != nil {
		t.Fatalf("failed to marshal stored preferences: %v", err)
	}
	name := preferenceOptionName("user-stored")
	repo.records[name] = &gen.Option{ID: "opt-1", Name: name, Value: json.RawMessage(data)}

	resolver := &Resolver{options: repo}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-stored"})

	prefs, err := resolver.Query().NotificationPreferences(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	entries := preferenceEntriesToMap(prefs.Entries)
	if entries[graphql.NotificationCategoryCommentCreated] != false {
		t.Errorf("expected comment created to be disabled, got %v", entries[graphql.NotificationCategoryCommentCreated])
	}
	if entries[graphql.NotificationCategoryPostDeleted] != false {
		t.Errorf("expected post deleted to be disabled, got %v", entries[graphql.NotificationCategoryPostDeleted])
	}
	if entries[graphql.NotificationCategoryPostCreated] != true {
		t.Errorf("expected post created to remain enabled")
	}
}

func TestUpdateNotificationPreferencesCreatesOptionWhenMissing(t *testing.T) {
	repo := newStubOptionRepository()
	resolver := &Resolver{options: repo}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-new"})

	input := graphql.UpdateNotificationPreferencesInput{
		Preferences: []*graphql.NotificationPreferenceInput{
			{Category: graphql.NotificationCategoryCommentUpdated, Enabled: false},
			{Category: graphql.NotificationCategoryPostUpdated, Enabled: true},
		},
	}

	payload, err := resolver.Mutation().UpdateNotificationPreferences(ctx, input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(repo.created) != 1 {
		t.Fatalf("expected one option to be created, got %d", len(repo.created))
	}
	created := repo.created[0]
	if created.Name != preferenceOptionName("user-new") {
		t.Fatalf("unexpected option name: %s", created.Name)
	}
	var stored storedNotificationPreferences
	if err := json.Unmarshal(created.Value, &stored); err != nil {
		t.Fatalf("failed to unmarshal stored preferences: %v", err)
	}
	if stored.Preferences[string(graphql.NotificationCategoryCommentUpdated)] != false {
		t.Errorf("expected stored comment updated preference to be false")
	}
	if payload == nil || payload.Preferences == nil {
		t.Fatalf("expected payload preferences, got %#v", payload)
	}
	entries := preferenceEntriesToMap(payload.Preferences.Entries)
	if entries[graphql.NotificationCategoryCommentUpdated] != false {
		t.Errorf("payload should mark comment updated disabled")
	}
}

func TestUpdateNotificationPreferencesUpdatesExistingRecord(t *testing.T) {
	repo := newStubOptionRepository()
	name := preferenceOptionName("user-existing")
	repo.records[name] = &gen.Option{ID: "opt-update", Name: name, Value: json.RawMessage(`{"preferences":{"COMMENT_CREATED":true}}`), Autoload: true}

	resolver := &Resolver{options: repo}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-existing"})

	clientMutationID := "mut-1"
	input := graphql.UpdateNotificationPreferencesInput{
		ClientMutationID: &clientMutationID,
		Preferences: []*graphql.NotificationPreferenceInput{
			{Category: graphql.NotificationCategoryPostDeleted, Enabled: false},
		},
	}

	payload, err := resolver.Mutation().UpdateNotificationPreferences(ctx, input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if payload.ClientMutationID == nil || *payload.ClientMutationID != clientMutationID {
		t.Fatalf("expected clientMutationId %q in payload, got %#v", clientMutationID, payload.ClientMutationID)
	}
	if len(repo.updated) != 1 {
		t.Fatalf("expected an update call, got %d", len(repo.updated))
	}
	updated := repo.updated[0]
	if updated.ID != "opt-update" {
		t.Fatalf("expected update to preserve option ID, got %q", updated.ID)
	}
	if updated.Autoload != true {
		t.Fatalf("expected autoload flag to be preserved")
	}
	var stored storedNotificationPreferences
	if err := json.Unmarshal(updated.Value, &stored); err != nil {
		t.Fatalf("failed to decode stored value: %v", err)
	}
	if stored.Preferences[string(graphql.NotificationCategoryPostDeleted)] != false {
		t.Errorf("expected post deleted preference to be false")
	}
}

func TestUpdateNotificationPreferencesRecordsMetrics(t *testing.T) {
	repo := newStubOptionRepository()
	collector := newRecordingCollector()
	resolver := &Resolver{options: repo, collector: collector}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-metrics"})

	input := graphql.UpdateNotificationPreferencesInput{
		Preferences: []*graphql.NotificationPreferenceInput{
			{Category: graphql.NotificationCategoryCommentUpdated, Enabled: false},
		},
	}

	if _, err := resolver.Mutation().UpdateNotificationPreferences(ctx, input); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(collector.queries) != 2 {
		t.Fatalf("expected 2 query metrics, got %d", len(collector.queries))
	}

	if collector.queries[0].table != "options" || collector.queries[0].operation != "find_by_name" {
		t.Fatalf("unexpected first metric: %+v", collector.queries[0])
	}
	if collector.queries[1].table != "options" || collector.queries[1].operation != "create" {
		t.Fatalf("unexpected second metric: %+v", collector.queries[1])
	}
}

func TestUpdateNotificationPreferencesRecordsMetricsOnUpdate(t *testing.T) {
	repo := newStubOptionRepository()
	name := preferenceOptionName("user-metrics-update")
	repo.records[name] = &gen.Option{ID: "opt-existing", Name: name, Value: json.RawMessage(`{"preferences":{"COMMENT_CREATED":true}}`)}

	collector := newRecordingCollector()
	resolver := &Resolver{options: repo, collector: collector}
	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-metrics-update"})

	input := graphql.UpdateNotificationPreferencesInput{
		Preferences: []*graphql.NotificationPreferenceInput{
			{Category: graphql.NotificationCategoryPostUpdated, Enabled: false},
		},
	}

	if _, err := resolver.Mutation().UpdateNotificationPreferences(ctx, input); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(collector.queries) != 2 {
		t.Fatalf("expected 2 query metrics, got %d", len(collector.queries))
	}

	if collector.queries[0].operation != "find_by_name" {
		t.Fatalf("expected find_by_name metric first, got %+v", collector.queries[0])
	}
	if collector.queries[1].operation != "update" {
		t.Fatalf("expected update metric second, got %+v", collector.queries[1])
	}
}
