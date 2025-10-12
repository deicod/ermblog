package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/deicod/erm/orm/pg"
	"github.com/deicod/ermblog/graphql/server"
	"github.com/deicod/ermblog/orm/gen"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://user:pass@localhost:5432/app?sslmode=disable"
	}

	ctx := context.Background()
	dbCtx, cancelDB := context.WithTimeout(ctx, 5*time.Second)
	defer cancelDB()

	db, err := pg.Connect(dbCtx, dsn)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer db.Close()

	ormClient := gen.NewClient(db)

	graphqlOpts := server.Options{
		ORM: ormClient,
		Subscriptions: server.SubscriptionOptions{
			Enabled: true,
		},
	}

	graphqlHandler := server.NewServer(graphqlOpts)

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.Handle("/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := server.WithLoaders(r.Context(), graphqlOpts)
		graphqlHandler.ServeHTTP(w, r.WithContext(ctx))
	}))

	srv := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	log.Printf("serving HTTP on %s", srv.Addr)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
		}
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}
