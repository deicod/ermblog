package directives

import "context"

func RequireRoles(roles []string) func(ctx context.Context, obj interface{}, next func(ctx context.Context) (res interface{}, err error)) (interface{}, error) {
	return func(ctx context.Context, obj interface{}, next func(ctx context.Context) (res interface{}, err error)) (interface{}, error) {
		return next(ctx)
	}
}

func RequireAuth() func(ctx context.Context, obj interface{}, next func(ctx context.Context) (res interface{}, err error)) (interface{}, error) {
	return func(ctx context.Context, obj interface{}, next func(ctx context.Context) (res interface{}, err error)) (interface{}, error) {
		return next(ctx)
	}
}
