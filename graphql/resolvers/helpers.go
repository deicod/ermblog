package resolvers

import "time"

func nullableString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func nullableTime(value time.Time) *time.Time {
	if value.IsZero() {
		return nil
	}
	return &value
}
