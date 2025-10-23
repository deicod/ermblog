package oidc

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestValidatorMiddleware(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	modulus := base64.RawURLEncoding.EncodeToString(key.N.Bytes())
	exponent := base64.RawURLEncoding.EncodeToString(bigIntBytes(key.E))

	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	jwks := map[string]any{
		"keys": []map[string]any{
			{
				"kty": "RSA",
				"kid": "test-key",
				"n":   modulus,
				"e":   exponent,
			},
		},
	}
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jwks_uri": server.URL + "/jwks",
		})
	})
	mux.HandleFunc("/jwks", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(jwks)
	})

	validator, err := NewValidator(context.Background(), server.URL, "ermblog", withNow(time.Now))
	if err != nil {
		t.Fatalf("create validator: %v", err)
	}

	handler := validator.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := FromContext(r.Context())
		if !ok {
			t.Error("claims missing from context")
			w.WriteHeader(http.StatusForbidden)
			return
		}
		if claims.Subject != "user-123" {
			t.Errorf("unexpected subject: %s", claims.Subject)
		}
		if len(claims.Roles) != 2 || claims.Roles[0] != "writer" || claims.Roles[1] != "admin" {
			t.Errorf("unexpected roles: %#v", claims.Roles)
		}
		w.WriteHeader(http.StatusOK)
	}))

	t.Run("missing token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})

	t.Run("invalid token", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
		req.Header.Set("Authorization", "Bearer invalid")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss":                server.URL,
		"aud":                "ermblog",
		"sub":                "user-123",
		"email":              "user@example.com",
		"name":               "Example User",
		"preferred_username": "example",
		"given_name":         "Example",
		"family_name":        "User",
		"email_verified":     true,
		"roles":              []string{"writer", "admin"},
		"exp":                time.Now().Add(time.Hour).Unix(),
		"iat":                time.Now().Unix(),
	})
	token.Header["kid"] = "test-key"
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestValidatorFallsBackToCachedKeyWhenRefreshFails(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	modulus := base64.RawURLEncoding.EncodeToString(key.N.Bytes())
	exponent := base64.RawURLEncoding.EncodeToString(bigIntBytes(key.E))

	mux := http.NewServeMux()
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	jwks := map[string]any{
		"keys": []map[string]any{
			{
				"kty": "RSA",
				"kid": "test-key",
				"n":   modulus,
				"e":   exponent,
			},
		},
	}

	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jwks_uri": server.URL + "/jwks",
		})
	})

	var failJWKS bool
	mux.HandleFunc("/jwks", func(w http.ResponseWriter, r *http.Request) {
		if failJWKS {
			http.Error(w, "boom", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(jwks)
	})

	now := time.Now()
	validator, err := NewValidator(context.Background(), server.URL, "ermblog", WithCacheTTL(time.Second), withNow(func() time.Time {
		return now
	}))
	if err != nil {
		t.Fatalf("create validator: %v", err)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"iss": server.URL,
		"aud": "ermblog",
		"sub": "user-123",
		"exp": now.Add(time.Hour).Unix(),
	})
	token.Header["kid"] = "test-key"
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	if _, err := validator.ValidateToken(context.Background(), signed); err != nil {
		t.Fatalf("validate token (initial): %v", err)
	}

	failJWKS = true
	now = now.Add(2 * time.Second)

	claims, err := validator.ValidateToken(context.Background(), signed)
	if err != nil {
		t.Fatalf("validate token with stale keys: %v", err)
	}
	if claims.Subject != "user-123" {
		t.Fatalf("unexpected subject: %s", claims.Subject)
	}
}

func bigIntBytes(v int) []byte {
	b := big.NewInt(int64(v)).Bytes()
	if len(b) == 0 {
		return []byte{0}
	}
	return b
}
