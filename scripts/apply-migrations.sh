#!/bin/bash

# Script to manually apply all ERM migrations
# Use this when ERM migrate planning fails

set -e

DB_URL="postgres://dev:dev@localhost:5432/ermblog?sslmode=disable"
MIGRATIONS_DIR="migrations"

echo "Applying migrations manually to: $DB_URL"
echo "Migrations directory: $MIGRATIONS_DIR"
echo ""

# Check if database exists, create if needed
echo "Checking if database exists..."
if ! psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Database doesn't exist. Creating..."
    psql "postgres://dev:dev@localhost:5432/postgres?sslmode=disable" -c "CREATE DATABASE ermblog;"
    echo "Database created."
fi

# Apply all migration files in order
for file in "$MIGRATIONS_DIR"/20251021162004_schema_*.sql; do
    if [ -f "$file" ]; then
        echo "Applying: $(basename "$file")"
        psql "$DB_URL" -f "$file"
        echo "✓ Applied"
    fi
done

echo ""
echo "All migrations applied successfully!"
echo ""
echo "Now try: erm migrate status"
```

Now create a script to help diagnose the issue:
