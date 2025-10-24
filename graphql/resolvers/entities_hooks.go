package resolvers

import (
	"context"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/orm/gen"
)

const passwordHashCost = bcrypt.DefaultCost

func newEntityHooks() entityHooks {
	return entityHooks{
		BeforeCreateUser: hashUserPasswordOnCreate,
		BeforeUpdateUser: hashUserPasswordOnUpdate,
		BeforeReturnUser: redactUserPasswordBeforeReturn,
	}
}

func hashUserPasswordOnCreate(_ context.Context, _ *Resolver, input graphql.CreateUserInput, model *gen.User) error {
	if model == nil || input.Password == nil {
		return nil
	}
	hashed, err := generatePasswordHash(*input.Password)
	if err != nil {
		return err
	}
	model.Password = hashed
	return nil
}

func hashUserPasswordOnUpdate(_ context.Context, _ *Resolver, input graphql.UpdateUserInput, model *gen.User) error {
	if model == nil || input.Password == nil {
		return nil
	}
	hashed, err := generatePasswordHash(*input.Password)
	if err != nil {
		return err
	}
	model.Password = hashed
	return nil
}

func redactUserPasswordBeforeReturn(_ context.Context, _ *Resolver, record *gen.User) error {
	if record != nil {
		record.Password = ""
	}
	return nil
}

func generatePasswordHash(plain string) (string, error) {
	if plain == "" {
		return "", fmt.Errorf("password cannot be empty")
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(plain), passwordHashCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hashed), nil
}
