package resolvers

import (
	"context"
	"strings"
	"time"

	"github.com/deicod/ermblog/orm/gen"
)

func (r *Resolver) recordQuery(table string, operation string, start time.Time, err error) {
	if r == nil || r.collector == nil {
		return
	}
	tableLabel := strings.TrimSpace(table)
	if tableLabel == "" {
		tableLabel = "unknown"
	}
	operationLabel := strings.TrimSpace(operation)
	if operationLabel == "" {
		operationLabel = "unknown"
	}
	r.collector.RecordQuery(tableLabel, operationLabel, time.Since(start), err)
}

func (r *Resolver) countThrough(ctx context.Context, entity string, repo counter) (int, error) {
	if repo == nil {
		return 0, nil
	}
	start := time.Now()
	value, err := repo.Count(ctx)
	r.recordQuery(entity, "count", start, err)
	return value, err
}

func (r *Resolver) findOptionByName(ctx context.Context, repo optionRepository, name string) (*gen.Option, error) {
	if repo == nil {
		return nil, nil
	}
	start := time.Now()
	record, err := repo.FindByName(ctx, name)
	r.recordQuery("options", "find_by_name", start, err)
	return record, err
}

func (r *Resolver) createOption(ctx context.Context, repo optionRepository, input *gen.Option) (*gen.Option, error) {
	if repo == nil {
		return nil, nil
	}
	start := time.Now()
	record, err := repo.Create(ctx, input)
	r.recordQuery("options", "create", start, err)
	return record, err
}

func (r *Resolver) updateOption(ctx context.Context, repo optionRepository, input *gen.Option) (*gen.Option, error) {
	if repo == nil {
		return nil, nil
	}
	start := time.Now()
	record, err := repo.Update(ctx, input)
	r.recordQuery("options", "update", start, err)
	return record, err
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func optionalString(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	result := trimmed
	return &result
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func claimString(raw map[string]any, keys ...string) string {
	if len(raw) == 0 {
		return ""
	}
	for _, key := range keys {
		if candidate, ok := raw[key]; ok {
			switch v := candidate.(type) {
			case string:
				trimmed := strings.TrimSpace(v)
				if trimmed != "" {
					return trimmed
				}
			}
		}
	}
	return ""
}
