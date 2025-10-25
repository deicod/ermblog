package resolvers

import (
	"context"
	"testing"
	"time"

	"github.com/99designs/gqlgen/client"
	gqlgraphql "github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"

	graphqlpkg "github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/directives"
	prommetrics "github.com/deicod/ermblog/observability/metrics/prometheus"
	"github.com/deicod/ermblog/oidc"
)

type instrumentedCounter struct {
	collector   *prommetrics.Collector
	value       int
	recordQuery bool
}

func (c *instrumentedCounter) Count(ctx context.Context) (int, error) {
	duration := 25 * time.Millisecond
	c.collector.RecordDataloaderBatch("management_stats", 1, duration)
	if c.recordQuery {
		c.collector.RecordQuery("posts", "count", duration, nil)
	}
	return c.value, nil
}

func TestGraphQLRequestUpdatesMetrics(t *testing.T) {
	promCollector, err := prommetrics.New()
	if err != nil {
		t.Fatalf("new prom collector: %v", err)
	}

	resolver := NewWithOptions(Options{Collector: promCollector})
	resolver.postsCounter = &instrumentedCounter{collector: promCollector, value: 7, recordQuery: true}
	resolver.commentsCounter = &instrumentedCounter{collector: promCollector, value: 3}
	resolver.mediaItemsCounter = &instrumentedCounter{collector: promCollector, value: 5}
	resolver.categoriesCounter = &instrumentedCounter{collector: promCollector, value: 2}
	resolver.tagsCounter = &instrumentedCounter{collector: promCollector, value: 1}
	resolver.usersCounter = &instrumentedCounter{collector: promCollector, value: 4}

	cfg := graphqlpkg.Config{Resolvers: resolver, Directives: graphqlpkg.DirectiveRoot{
		Auth: func(ctx context.Context, obj interface{}, next gqlgraphql.Resolver, roles []string) (interface{}, error) {
			handler := directives.RequireAuth()
			if len(roles) > 0 {
				handler = directives.RequireRoles(roles)
			}
			return handler(ctx, obj, func(ctx context.Context) (interface{}, error) {
				return next(ctx)
			})
		},
	}}

	exec := graphqlpkg.NewExecutableSchema(cfg)
	gqlClient := client.New(handler.NewDefaultServer(exec))

	ctx := oidc.ToContext(context.Background(), oidc.Claims{Subject: "user-1"})
	ctx = resolver.WithLoaders(ctx)

	var resp struct {
		ManagementStats struct {
			Posts int
		}
	}

	if err := gqlClient.Post(`query { managementStats { posts } }`, &resp, withContext(ctx)); err != nil {
		t.Fatalf("graphql request: %v", err)
	}

	if resp.ManagementStats.Posts != 7 {
		t.Fatalf("unexpected posts count: %d", resp.ManagementStats.Posts)
	}

	metricFamilies, err := promCollector.Gatherer().Gather()
	if err != nil {
		t.Fatalf("gather metrics: %v", err)
	}

	var queryCounter float64
	var queryDurationSamples uint64
	var loaderCounter float64
	var loaderDurationSamples uint64
	for _, mf := range metricFamilies {
		switch mf.GetName() {
		case "ermblog_graphql_dataloader_batches_total":
			if len(mf.Metric) != 1 {
				t.Fatalf("expected single loader counter entry, got %d", len(mf.Metric))
			}
			loaderCounter = mf.Metric[0].GetCounter().GetValue()
		case "ermblog_graphql_dataloader_batch_duration_seconds":
			if len(mf.Metric) != 1 {
				t.Fatalf("expected single loader duration entry, got %d", len(mf.Metric))
			}
			loaderDurationSamples = mf.Metric[0].GetHistogram().GetSampleCount()
		case "ermblog_orm_queries_total":
			if len(mf.Metric) != 1 {
				t.Fatalf("expected single metric entry, got %d", len(mf.Metric))
			}
			queryCounter = mf.Metric[0].GetCounter().GetValue()
		case "ermblog_orm_query_duration_seconds":
			if len(mf.Metric) != 1 {
				t.Fatalf("expected single duration entry, got %d", len(mf.Metric))
			}
			queryDurationSamples = mf.Metric[0].GetHistogram().GetSampleCount()
		}
	}

	if queryCounter != 1 {
		t.Fatalf("expected query counter 1, got %v", queryCounter)
	}
	if queryDurationSamples != 1 {
		t.Fatalf("expected duration samples 1, got %d", queryDurationSamples)
	}
	if loaderCounter != 6 { // one call for each counter above
		t.Fatalf("expected loader counter 6, got %v", loaderCounter)
	}
	if loaderDurationSamples != 6 {
		t.Fatalf("expected loader duration samples 6, got %d", loaderDurationSamples)
	}
}
