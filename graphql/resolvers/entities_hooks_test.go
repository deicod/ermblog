package resolvers

import (
	"context"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/deicod/ermblog/graphql"
	"github.com/deicod/ermblog/orm/gen"
)

func TestHashUserPasswordOnCreateHashesPlaintext(t *testing.T) {
	hooks := newEntityHooks()
	if hooks.BeforeCreateUser == nil {
		t.Fatal("expected BeforeCreateUser hook to be registered")
	}

	password := "super-secret"
	input := graphql.CreateUserInput{Password: &password}
	model := &gen.User{}

	if err := hooks.BeforeCreateUser(context.Background(), &Resolver{}, input, model); err != nil {
		t.Fatalf("hash hook returned error: %v", err)
	}

	if model.Password == password {
		t.Fatal("password was not hashed")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(model.Password), []byte(password)); err != nil {
		t.Fatalf("stored hash does not match plaintext: %v", err)
	}
}

func TestHashUserPasswordOnCreateRejectsEmptyPassword(t *testing.T) {
	hooks := newEntityHooks()
	empty := ""
	input := graphql.CreateUserInput{Password: &empty}
	model := &gen.User{}

	if err := hooks.BeforeCreateUser(context.Background(), &Resolver{}, input, model); err == nil {
		t.Fatal("expected error for empty password")
	}
}

func TestHashUserPasswordOnUpdateHashesWhenProvided(t *testing.T) {
	hooks := newEntityHooks()
	if hooks.BeforeUpdateUser == nil {
		t.Fatal("expected BeforeUpdateUser hook to be registered")
	}

	newPassword := "rotating-secret"
	input := graphql.UpdateUserInput{Password: &newPassword}
	model := &gen.User{Password: "old-hash"}

	if err := hooks.BeforeUpdateUser(context.Background(), &Resolver{}, input, model); err != nil {
		t.Fatalf("hash hook returned error: %v", err)
	}

	if model.Password == newPassword {
		t.Fatal("update hook stored plaintext password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(model.Password), []byte(newPassword)); err != nil {
		t.Fatalf("stored hash does not match new plaintext: %v", err)
	}
}

func TestHashUserPasswordOnUpdateSkipsWhenNil(t *testing.T) {
	hooks := newEntityHooks()
	model := &gen.User{Password: "existing-hash"}

	if err := hooks.BeforeUpdateUser(context.Background(), &Resolver{}, graphql.UpdateUserInput{}, model); err != nil {
		t.Fatalf("unexpected error when password absent: %v", err)
	}
	if model.Password != "existing-hash" {
		t.Fatalf("expected password to remain unchanged, got %q", model.Password)
	}
}

func TestRedactUserPasswordBeforeReturn(t *testing.T) {
	hooks := newEntityHooks()
	record := &gen.User{Password: "hashed-value"}

	if err := hooks.BeforeReturnUser(context.Background(), &Resolver{}, record); err != nil {
		t.Fatalf("redaction hook returned error: %v", err)
	}
	if record.Password != "" {
		t.Fatalf("expected password to be redacted, got %q", record.Password)
	}
}
