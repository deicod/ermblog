package resolvers

import "time"

type queryRecord struct {
	table     string
	operation string
	duration  time.Duration
	err       error
}

type batchRecord struct {
	name     string
	size     int
	duration time.Duration
}

type recordingCollector struct {
	queries []queryRecord
	batches []batchRecord
}

func newRecordingCollector() *recordingCollector {
	return &recordingCollector{}
}

func (c *recordingCollector) RecordDataloaderBatch(name string, size int, duration time.Duration) {
	if c == nil {
		return
	}
	c.batches = append(c.batches, batchRecord{name: name, size: size, duration: duration})
}

func (c *recordingCollector) RecordQuery(table string, operation string, duration time.Duration, err error) {
	if c == nil {
		return
	}
	c.queries = append(c.queries, queryRecord{table: table, operation: operation, duration: duration, err: err})
}
