package oidc

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Validator verifies incoming tokens using the issuer's JWKS endpoint and
// enriches request contexts with the resulting claims.
type Validator struct {
	issuer   string
	audience string

	client   *http.Client
	jwksURL  string
	cacheTTL time.Duration
	now      func() time.Time

	mu     sync.RWMutex
	keys   map[string]crypto.PublicKey
	expiry time.Time
}

// Option configures a Validator.
type Option func(*Validator)

// WithHTTPClient overrides the HTTP client used for discovery and JWKS fetches.
func WithHTTPClient(client *http.Client) Option {
	return func(v *Validator) {
		v.client = client
	}
}

// WithCacheTTL sets the TTL for JWKS cache entries.
func WithCacheTTL(ttl time.Duration) Option {
	return func(v *Validator) {
		v.cacheTTL = ttl
	}
}

// withNow injects a custom clock (primarily for testing).
func withNow(now func() time.Time) Option {
	return func(v *Validator) {
		v.now = now
	}
}

// NewValidator discovers JWKS metadata from the issuer and prepares a validator
// for verifying tokens addressed to the provided audience.
func NewValidator(ctx context.Context, issuer, audience string, opts ...Option) (*Validator, error) {
	if strings.TrimSpace(issuer) == "" {
		return nil, errors.New("oidc: issuer is required")
	}
	if strings.TrimSpace(audience) == "" {
		return nil, errors.New("oidc: audience is required")
	}
	v := &Validator{
		issuer:   strings.TrimRight(issuer, "/"),
		audience: audience,
		client:   http.DefaultClient,
		cacheTTL: 5 * time.Minute,
		now:      time.Now,
		keys:     make(map[string]crypto.PublicKey),
	}
	for _, opt := range opts {
		opt(v)
	}
	if v.client == nil {
		v.client = http.DefaultClient
	}
	if v.cacheTTL <= 0 {
		v.cacheTTL = 5 * time.Minute
	}
	if v.now == nil {
		v.now = time.Now
	}
	if ctx == nil {
		ctx = context.Background()
	}
	jwksURL, err := v.discoverJWKS(ctx)
	if err != nil {
		return nil, err
	}
	v.jwksURL = jwksURL
	return v, nil
}

// Middleware verifies the Authorization header and injects claims on success.
func (v *Validator) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			unauthorized(w)
			return
		}
		parts := strings.Fields(token)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			unauthorized(w)
			return
		}
		claims, err := v.ValidateToken(r.Context(), parts[1])
		if err != nil {
			unauthorized(w)
			return
		}
		ctx := ToContext(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ValidateToken parses and validates a JWT, returning extracted claims.
func (v *Validator) ValidateToken(ctx context.Context, token string) (Claims, error) {
	if strings.TrimSpace(token) == "" {
		return Claims{}, errors.New("oidc: token is empty")
	}
	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(tok *jwt.Token) (any, error) {
		kid, _ := tok.Header["kid"].(string)
		return v.getKey(ctx, kid)
	}, jwt.WithAudience(v.audience), jwt.WithIssuer(v.issuer))
	if err != nil {
		return Claims{}, err
	}
	if !parsed.Valid {
		return Claims{}, errors.New("oidc: invalid token")
	}
	return mapToClaims(claims), nil
}

func (v *Validator) getKey(ctx context.Context, kid string) (crypto.PublicKey, error) {
	if kid == "" {
		return nil, errors.New("oidc: token missing kid header")
	}
	now := v.now()
	v.mu.RLock()
	key, ok := v.keys[kid]
	expiry := v.expiry
	v.mu.RUnlock()
	if ok && now.Before(expiry) {
		return key, nil
	}

	v.mu.Lock()
	key, ok = v.keys[kid]
	expiry = v.expiry
	v.mu.Unlock()
	if ok && now.Before(expiry) {
		return key, nil
	}

	if err := v.refreshKeys(ctx); err != nil {
		return nil, err
	}

	v.mu.RLock()
	key, ok = v.keys[kid]
	v.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("oidc: key %q not found", kid)
	}
	return key, nil
}

func (v *Validator) refreshKeys(ctx context.Context) error {
	keys, err := v.fetchKeys(ctx)
	if err != nil {
		return err
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	v.keys = keys
	v.expiry = v.now().Add(v.cacheTTL)
	return nil
}

func (v *Validator) fetchKeys(ctx context.Context) (map[string]crypto.PublicKey, error) {
	if ctx == nil {
		ctx = context.Background()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("oidc: fetch jwks: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oidc: fetch jwks: unexpected status %d", resp.StatusCode)
	}
	var payload jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("oidc: decode jwks: %w", err)
	}
	keys := make(map[string]crypto.PublicKey, len(payload.Keys))
	for _, jwk := range payload.Keys {
		if jwk.Kid == "" {
			continue
		}
		key, err := jwk.PublicKey()
		if err != nil {
			continue
		}
		keys[jwk.Kid] = key
	}
	if len(keys) == 0 {
		return nil, errors.New("oidc: jwks contained no usable keys")
	}
	return keys, nil
}

func (v *Validator) discoverJWKS(ctx context.Context) (string, error) {
	discoveryURL := v.issuer + "/.well-known/openid-configuration"
	if ctx == nil {
		ctx = context.Background()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, discoveryURL, nil)
	if err != nil {
		return "", err
	}
	resp, err := v.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("oidc: discover configuration: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("oidc: discover configuration: unexpected status %d", resp.StatusCode)
	}
	var cfg struct {
		JWKSURL string `json:"jwks_uri"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&cfg); err != nil {
		return "", fmt.Errorf("oidc: decode configuration: %w", err)
	}
	if cfg.JWKSURL == "" {
		return "", errors.New("oidc: jwks_uri missing from discovery document")
	}
	return cfg.JWKSURL, nil
}

type jwksResponse struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kid string   `json:"kid"`
	Kty string   `json:"kty"`
	Use string   `json:"use"`
	Alg string   `json:"alg"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c"`
	Crv string   `json:"crv"`
	X   string   `json:"x"`
	Y   string   `json:"y"`
}

func (k jwkKey) PublicKey() (crypto.PublicKey, error) {
	switch k.Kty {
	case "RSA":
		if len(k.X5c) > 0 {
			certBytes, err := base64.StdEncoding.DecodeString(k.X5c[0])
			if err == nil {
				if cert, err := x509.ParseCertificate(certBytes); err == nil {
					if pk, ok := cert.PublicKey.(crypto.PublicKey); ok {
						return pk, nil
					}
				}
			}
		}
		if k.N == "" || k.E == "" {
			return nil, errors.New("oidc: rsa key missing modulus or exponent")
		}
		nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
		if err != nil {
			return nil, fmt.Errorf("oidc: decode modulus: %w", err)
		}
		eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
		if err != nil {
			return nil, fmt.Errorf("oidc: decode exponent: %w", err)
		}
		if len(eBytes) == 0 {
			return nil, errors.New("oidc: invalid exponent")
		}
		e := 0
		for _, b := range eBytes {
			e = e<<8 | int(b)
		}
		if e == 0 {
			return nil, errors.New("oidc: invalid exponent")
		}
		n := new(big.Int).SetBytes(nBytes)
		return &rsa.PublicKey{N: n, E: e}, nil
	case "EC":
		if k.Crv == "" || k.X == "" || k.Y == "" {
			return nil, errors.New("oidc: ec key missing curve parameters")
		}
		curve, err := curveFromString(k.Crv)
		if err != nil {
			return nil, err
		}
		xBytes, err := base64.RawURLEncoding.DecodeString(k.X)
		if err != nil {
			return nil, fmt.Errorf("oidc: decode x coordinate: %w", err)
		}
		yBytes, err := base64.RawURLEncoding.DecodeString(k.Y)
		if err != nil {
			return nil, fmt.Errorf("oidc: decode y coordinate: %w", err)
		}
		x := new(big.Int).SetBytes(xBytes)
		y := new(big.Int).SetBytes(yBytes)
		if !curve.IsOnCurve(x, y) {
			return nil, errors.New("oidc: ec point not on curve")
		}
		return &ecdsa.PublicKey{Curve: curve, X: x, Y: y}, nil
	default:
		return nil, fmt.Errorf("oidc: unsupported key type %q", k.Kty)
	}
}

func curveFromString(name string) (elliptic.Curve, error) {
	switch name {
	case "P-256", "secp256r1":
		return elliptic.P256(), nil
	case "P-384", "secp384r1":
		return elliptic.P384(), nil
	case "P-521", "secp521r1":
		return elliptic.P521(), nil
	default:
		return nil, fmt.Errorf("oidc: unsupported curve %q", name)
	}
}

func mapToClaims(claims jwt.MapClaims) Claims {
	result := Claims{
		Subject:       getString(claims, "sub"),
		Email:         getString(claims, "email"),
		Name:          getString(claims, "name"),
		Username:      firstNonEmpty(getString(claims, "preferred_username"), getString(claims, "username")),
		GivenName:     getString(claims, "given_name"),
		FamilyName:    getString(claims, "family_name"),
		EmailVerified: getBool(claims, "email_verified"),
		Roles:         getStringSlice(claims, "roles"),
		Raw:           make(map[string]any, len(claims)),
	}
	for k, v := range claims {
		result.Raw[k] = v
	}
	return result
}

func getString(claims jwt.MapClaims, key string) string {
	if val, ok := claims[key]; ok {
		switch v := val.(type) {
		case string:
			return v
		case fmt.Stringer:
			return v.String()
		}
	}
	return ""
}

func getBool(claims jwt.MapClaims, key string) bool {
	if val, ok := claims[key]; ok {
		switch v := val.(type) {
		case bool:
			return v
		case string:
			return strings.EqualFold(v, "true")
		case float64:
			return v != 0
		}
	}
	return false
}

func getStringSlice(claims jwt.MapClaims, key string) []string {
	val, ok := claims[key]
	if !ok {
		return nil
	}
	switch v := val.(type) {
	case []any:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if str, ok := item.(string); ok {
				out = append(out, str)
			}
		}
		return out
	case []string:
		return append([]string(nil), v...)
	case string:
		if v == "" {
			return nil
		}
		return []string{v}
	default:
		return nil
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", "Bearer")
	http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
}
