package prometheus

import (
	"errors"
	"math"
	"testing"
	"time"

	prom "github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
)

func newCollectorForTest(t *testing.T) *Collector {
	t.Helper()
	c, err := New()
	if err != nil {
		t.Fatalf("new collector: %v", err)
	}
	return c
}

func TestRecordDataloaderBatchUpdatesMetrics(t *testing.T) {
	collector := newCollectorForTest(t)

	duration := 75 * time.Millisecond
	collector.RecordDataloaderBatch("users", 3, duration)

	metric := &dto.Metric{}
	if err := collector.batchCounter.WithLabelValues("users").Write(metric); err != nil {
		t.Fatalf("write counter: %v", err)
	}
	if got := metric.GetCounter().GetValue(); got != 1 {
		t.Fatalf("expected counter 1, got %v", got)
	}

	metric = readMetric(t, collector.batchDuration, map[string]string{"loader": "users"})
	hist := metric.GetHistogram()
	if hist.GetSampleCount() != 1 {
		t.Fatalf("expected duration sample count 1, got %d", hist.GetSampleCount())
	}
	if sum := hist.GetSampleSum(); math.Abs(sum-duration.Seconds()) > 1e-6 {
		t.Fatalf("expected duration sum %.6f, got %.6f", duration.Seconds(), sum)
	}

	metric = readMetric(t, collector.batchSize, map[string]string{"loader": "users"})
	hist = metric.GetHistogram()
	if hist.GetSampleCount() != 1 {
		t.Fatalf("expected size sample count 1, got %d", hist.GetSampleCount())
	}
	if sum := hist.GetSampleSum(); math.Abs(sum-3) > 1e-6 {
		t.Fatalf("expected size sum 3, got %.6f", sum)
	}
}

func TestRecordQueryUpdatesMetrics(t *testing.T) {
	collector := newCollectorForTest(t)

	collector.RecordQuery("posts", "count", 50*time.Millisecond, nil)
	collector.RecordQuery("posts", "count", 30*time.Millisecond, errors.New("boom"))

	metric := &dto.Metric{}
	if err := collector.queryCounter.WithLabelValues("posts", "count", "success").Write(metric); err != nil {
		t.Fatalf("write success counter: %v", err)
	}
	if got := metric.GetCounter().GetValue(); got != 1 {
		t.Fatalf("expected success counter 1, got %v", got)
	}

	metric = &dto.Metric{}
	if err := collector.queryCounter.WithLabelValues("posts", "count", "error").Write(metric); err != nil {
		t.Fatalf("write error counter: %v", err)
	}
	if got := metric.GetCounter().GetValue(); got != 1 {
		t.Fatalf("expected error counter 1, got %v", got)
	}

	metric = readMetric(t, collector.queryDuration, map[string]string{"table": "posts", "operation": "count", "status": "success"})
	hist := metric.GetHistogram()
	if hist.GetSampleCount() != 1 {
		t.Fatalf("expected success duration sample count 1, got %d", hist.GetSampleCount())
	}
	expected := 50 * time.Millisecond
	if sum := hist.GetSampleSum(); math.Abs(sum-expected.Seconds()) > 1e-6 {
		t.Fatalf("expected success duration sum %.6f, got %.6f", expected.Seconds(), sum)
	}

	metric = readMetric(t, collector.queryDuration, map[string]string{"table": "posts", "operation": "count", "status": "error"})
	hist = metric.GetHistogram()
	if hist.GetSampleCount() != 1 {
		t.Fatalf("expected error duration sample count 1, got %d", hist.GetSampleCount())
	}
	expected = 30 * time.Millisecond
	if sum := hist.GetSampleSum(); math.Abs(sum-expected.Seconds()) > 1e-6 {
		t.Fatalf("expected error duration sum %.6f, got %.6f", expected.Seconds(), sum)
	}
}

func readMetric(t *testing.T, collector prom.Collector, labels map[string]string) *dto.Metric {
	t.Helper()
	ch := make(chan prom.Metric, 16)
	go func() {
		collector.Collect(ch)
		close(ch)
	}()
	for metric := range ch {
		dtoMetric := &dto.Metric{}
		if err := metric.Write(dtoMetric); err != nil {
			t.Fatalf("write metric: %v", err)
		}
		if labelsMatch(dtoMetric, labels) {
			return dtoMetric
		}
	}
	t.Fatalf("metric with labels %v not found", labels)
	return nil
}

func labelsMatch(metric *dto.Metric, expected map[string]string) bool {
	if len(expected) == 0 {
		return true
	}
	matched := 0
	for _, label := range metric.GetLabel() {
		value, ok := expected[label.GetName()]
		if !ok {
			continue
		}
		if label.GetValue() != value {
			return false
		}
		matched++
	}
	return matched == len(expected)
}
