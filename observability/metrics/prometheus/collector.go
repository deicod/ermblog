package prometheus

import (
	"errors"
	"net/http"
	"time"

	prom "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

const (
	namespace           = "ermblog"
	dataloaderSubsystem = "graphql_dataloader"
	ormSubsystem        = "orm"
)

type config struct {
	registerer       prom.Registerer
	gatherer         prom.Gatherer
	durationBuckets  []float64
	batchSizeBuckets []float64
}

// Option configures a Collector during construction.
type Option func(*config)

// WithRegisterer provides a custom Prometheus registerer.
func WithRegisterer(r prom.Registerer) Option {
	return func(cfg *config) {
		cfg.registerer = r
	}
}

// WithGatherer provides a custom Prometheus gatherer used by the HTTP handler.
func WithGatherer(g prom.Gatherer) Option {
	return func(cfg *config) {
		cfg.gatherer = g
	}
}

// WithDurationBuckets overrides the default histogram buckets for durations.
func WithDurationBuckets(buckets []float64) Option {
	return func(cfg *config) {
		if len(buckets) > 0 {
			cfg.durationBuckets = append([]float64(nil), buckets...)
		}
	}
}

// WithBatchSizeBuckets overrides the default histogram buckets for batch sizes.
func WithBatchSizeBuckets(buckets []float64) Option {
	return func(cfg *config) {
		if len(buckets) > 0 {
			cfg.batchSizeBuckets = append([]float64(nil), buckets...)
		}
	}
}

// Collector publishes metrics compatible with the metrics.Collector interface using Prometheus primitives.
type Collector struct {
	registerer prom.Registerer
	gatherer   prom.Gatherer
	handler    http.Handler

	batchDuration *prom.HistogramVec
	batchSize     *prom.HistogramVec
	batchCounter  *prom.CounterVec

	queryDuration *prom.HistogramVec
	queryCounter  *prom.CounterVec
}

// New constructs a Collector registered against a Prometheus registry.
func New(opts ...Option) (*Collector, error) {
	cfg := config{
		durationBuckets:  prom.DefBuckets,
		batchSizeBuckets: []float64{1, 2, 3, 5, 8, 13, 21, 34, 55, 89},
	}
	for _, opt := range opts {
		if opt != nil {
			opt(&cfg)
		}
	}
	if cfg.registerer == nil {
		reg := prom.NewRegistry()
		cfg.registerer = reg
		cfg.gatherer = reg
	}
	if cfg.gatherer == nil {
		if g, ok := cfg.registerer.(prom.Gatherer); ok {
			cfg.gatherer = g
		}
	}
	if cfg.gatherer == nil {
		return nil, errors.New("prometheus collector requires a gatherer")
	}

	c := &Collector{registerer: cfg.registerer, gatherer: cfg.gatherer}
	c.batchDuration = prom.NewHistogramVec(prom.HistogramOpts{
		Namespace: namespace,
		Subsystem: dataloaderSubsystem,
		Name:      "batch_duration_seconds",
		Help:      "Time taken for dataloader batch fetches.",
		Buckets:   cfg.durationBuckets,
	}, []string{"loader"})
	c.batchSize = prom.NewHistogramVec(prom.HistogramOpts{
		Namespace: namespace,
		Subsystem: dataloaderSubsystem,
		Name:      "batch_size",
		Help:      "Number of records fetched by dataloader batches.",
		Buckets:   cfg.batchSizeBuckets,
	}, []string{"loader"})
	c.batchCounter = prom.NewCounterVec(prom.CounterOpts{
		Namespace: namespace,
		Subsystem: dataloaderSubsystem,
		Name:      "batches_total",
		Help:      "Total number of dataloader batches executed.",
	}, []string{"loader"})

	c.queryDuration = prom.NewHistogramVec(prom.HistogramOpts{
		Namespace: namespace,
		Subsystem: ormSubsystem,
		Name:      "query_duration_seconds",
		Help:      "Latency of ORM queries segmented by table and operation.",
		Buckets:   cfg.durationBuckets,
	}, []string{"table", "operation", "status"})
	c.queryCounter = prom.NewCounterVec(prom.CounterOpts{
		Namespace: namespace,
		Subsystem: ormSubsystem,
		Name:      "queries_total",
		Help:      "Total ORM queries executed, labeled by status.",
	}, []string{"table", "operation", "status"})

	if err := cfg.registerer.Register(c.batchDuration); err != nil {
		if are, ok := err.(prom.AlreadyRegisteredError); ok {
			if hist, ok := are.ExistingCollector.(*prom.HistogramVec); ok {
				c.batchDuration = hist
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	if err := cfg.registerer.Register(c.batchSize); err != nil {
		if are, ok := err.(prom.AlreadyRegisteredError); ok {
			if hist, ok := are.ExistingCollector.(*prom.HistogramVec); ok {
				c.batchSize = hist
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	if err := cfg.registerer.Register(c.batchCounter); err != nil {
		if are, ok := err.(prom.AlreadyRegisteredError); ok {
			if counter, ok := are.ExistingCollector.(*prom.CounterVec); ok {
				c.batchCounter = counter
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	if err := cfg.registerer.Register(c.queryDuration); err != nil {
		if are, ok := err.(prom.AlreadyRegisteredError); ok {
			if hist, ok := are.ExistingCollector.(*prom.HistogramVec); ok {
				c.queryDuration = hist
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	if err := cfg.registerer.Register(c.queryCounter); err != nil {
		if are, ok := err.(prom.AlreadyRegisteredError); ok {
			if counter, ok := are.ExistingCollector.(*prom.CounterVec); ok {
				c.queryCounter = counter
			} else {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	c.handler = promhttp.HandlerFor(cfg.gatherer, promhttp.HandlerOpts{})
	return c, nil
}

// Handler exposes an HTTP handler for Prometheus scrapes.
func (c *Collector) Handler() http.Handler {
	if c == nil {
		return http.HandlerFunc(func(http.ResponseWriter, *http.Request) {})
	}
	return c.handler
}

// Gatherer returns the gatherer feeding this collector.
func (c *Collector) Gatherer() prom.Gatherer {
	if c == nil {
		return nil
	}
	return c.gatherer
}

// RecordDataloaderBatch implements metrics.Collector.
func (c *Collector) RecordDataloaderBatch(name string, size int, duration time.Duration) {
	if c == nil {
		return
	}
	if size < 0 {
		size = 0
	}
	seconds := duration.Seconds()
	c.batchCounter.WithLabelValues(name).Inc()
	c.batchDuration.WithLabelValues(name).Observe(seconds)
	c.batchSize.WithLabelValues(name).Observe(float64(size))
}

// RecordQuery implements metrics.Collector.
func (c *Collector) RecordQuery(table string, operation string, duration time.Duration, err error) {
	if c == nil {
		return
	}
	status := "success"
	if err != nil {
		status = "error"
	}
	seconds := duration.Seconds()
	labels := []string{table, operation, status}
	c.queryCounter.WithLabelValues(labels...).Inc()
	c.queryDuration.WithLabelValues(labels...).Observe(seconds)
}
