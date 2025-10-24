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
	ORM               *gen.Client
	collector         metrics.Collector
	subscriptions     subscriptions.Broker
	hooks             entityHooks
	users             userProvider
	postsCounter      counter
	commentsCounter   counter
	mediaItemsCounter counter
	categoriesCounter counter
	tagsCounter       counter
	usersCounter      counter
}

type userProvider interface {
	ByID(ctx context.Context, id string) (*gen.User, error)
}

type counter interface {
	Count(ctx context.Context) (int, error)
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
	if resolver.ORM != nil {
		resolver.users = resolver.ORM.Users()
		resolver.postsCounter = resolver.ORM.Posts()
		resolver.commentsCounter = resolver.ORM.Comments()
		resolver.mediaItemsCounter = resolver.ORM.Medias()
		resolver.categoriesCounter = resolver.ORM.Categories()
		resolver.tagsCounter = resolver.ORM.Tags()
		resolver.usersCounter = resolver.ORM.Users()
	}
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

func (r *Resolver) userClient() userProvider {
	if r == nil {
		return nil
	}
	if r.users != nil {
		return r.users
	}
	if r.ORM != nil {
		return r.ORM.Users()
	}
	return nil
}

func (r *Resolver) Mutation() graphql.MutationResolver { return &mutationResolver{r} }
func (r *Resolver) Post() graphql.PostResolver         { return &postResolver{r} }
func (r *Resolver) Query() graphql.QueryResolver       { return &queryResolver{r} }
func (r *Resolver) Subscription() graphql.SubscriptionResolver {
	return &subscriptionResolver{r}
}

func (r *Resolver) postCounter() counter {
	if r == nil {
		return nil
	}
	if r.postsCounter != nil {
		return r.postsCounter
	}
	if r.ORM != nil {
		return r.ORM.Posts()
	}
	return nil
}

func (r *Resolver) commentCounter() counter {
	if r == nil {
		return nil
	}
	if r.commentsCounter != nil {
		return r.commentsCounter
	}
	if r.ORM != nil {
		return r.ORM.Comments()
	}
	return nil
}

func (r *Resolver) mediaCounter() counter {
	if r == nil {
		return nil
	}
	if r.mediaItemsCounter != nil {
		return r.mediaItemsCounter
	}
	if r.ORM != nil {
		return r.ORM.Medias()
	}
	return nil
}

func (r *Resolver) categoryCounter() counter {
	if r == nil {
		return nil
	}
	if r.categoriesCounter != nil {
		return r.categoriesCounter
	}
	if r.ORM != nil {
		return r.ORM.Categories()
	}
	return nil
}

func (r *Resolver) tagCounter() counter {
	if r == nil {
		return nil
	}
	if r.tagsCounter != nil {
		return r.tagsCounter
	}
	if r.ORM != nil {
		return r.ORM.Tags()
	}
	return nil
}

func (r *Resolver) userCounter() counter {
	if r == nil {
		return nil
	}
	if r.usersCounter != nil {
		return r.usersCounter
	}
	if r.ORM != nil {
		return r.ORM.Users()
	}
	return nil
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
