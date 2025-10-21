package resolvers

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/graphql/dataloaders"
	"github.com/deicod/ermblog/graphql/subscriptions"
	"github.com/deicod/ermblog/observability/metrics"
	"github.com/deicod/ermblog/orm/gen"
)

// Options allows configuring resolver behaviour.
type Options struct {
	ORM           *gen.Client
	Collector     metrics.Collector
	Subscriptions subscriptions.Broker
}

// Resolver wires GraphQL resolvers into the executable schema.
type Resolver struct {
	ORM           *gen.Client
	collector     metrics.Collector
	subscriptions subscriptions.Broker
	hooks         entityHooks
}

// New creates a resolver root bound to the provided ORM client.
func New(orm *gen.Client) *Resolver {
	return NewWithOptions(Options{ORM: orm})
}

// NewWithOptions provides advanced resolver configuration.
func NewWithOptions(opts Options) *Resolver {
	collector := opts.Collector
	if collector == nil {
		collector = metrics.NoopCollector{}
	}
	resolver := &Resolver{ORM: opts.ORM, collector: collector, subscriptions: opts.Subscriptions}
	resolver.hooks = newEntityHooks()
	return resolver
}

// WithLoaders attaches per-request dataloaders to the supplied context.
func (r *Resolver) WithLoaders(ctx context.Context) context.Context {
	if r == nil || r.ORM == nil {
		return ctx
	}
	loaders := dataloaders.New(r.ORM, r.collector)
	return dataloaders.ToContext(ctx, loaders)
}

func (r *Resolver) Mutation() graphql.MutationResolver { return &mutationResolver{r} }
func (r *Resolver) Query() graphql.QueryResolver       { return &queryResolver{r} }
func (r *Resolver) Subscription() graphql.SubscriptionResolver {
	return &subscriptionResolver{r}
}

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }

func (r *Resolver) subscriptionBroker() subscriptions.Broker {
	if r == nil {
		return nil
	}
	return r.subscriptions
}

const defaultPageSize = 50

func encodeCursor(offset int) string {
	return strconv.Itoa(offset)
}

func decodeCursor(cursor string) (int, error) {
	return strconv.Atoi(cursor)
}

type SubscriptionTrigger string

const (
	SubscriptionTriggerCreated SubscriptionTrigger = "created"
	SubscriptionTriggerUpdated SubscriptionTrigger = "updated"
	SubscriptionTriggerDeleted SubscriptionTrigger = "deleted"
)

var ErrSubscriptionsDisabled = errors.New("graphql subscriptions disabled")

func publishSubscriptionEvent(ctx context.Context, broker subscriptions.Broker, entity string, trigger SubscriptionTrigger, payload any) {
	if broker == nil || entity == "" {
		return
	}
	_ = broker.Publish(ctx, subscriptionTopic(entity, trigger), payload)
}

func subscribeToEntity(ctx context.Context, broker subscriptions.Broker, entity string, trigger SubscriptionTrigger) (<-chan any, func(), error) {
	if broker == nil {
		return nil, nil, ErrSubscriptionsDisabled
	}
	stream, cancel, err := broker.Subscribe(ctx, subscriptionTopic(entity, trigger))
	if err != nil {
		return nil, nil, err
	}
	return stream, cancel, nil
}

func subscriptionTopic(entity string, trigger SubscriptionTrigger) string {
	base := strings.ToLower(entity)
	if base == "" {
		base = "entity"
	}
	return base + ":" + string(trigger)
}

func Topic(entity string, trigger SubscriptionTrigger) string {
	return subscriptionTopic(entity, trigger)
}

func (r *mutationResolver) Noop(context.Context) (*bool, error) {
	value := true
	return &value, nil
}

func (r *queryResolver) Health(context.Context) (string, error) {
	return "ok", nil
}

func (r *subscriptionResolver) Noop(context.Context) (<-chan *bool, error) {
	ch := make(chan *bool)
	close(ch)
	return ch, nil
}
