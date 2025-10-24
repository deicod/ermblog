package resolvers

import "strings"

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
