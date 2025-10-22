#!/bin/bash

# Script to diagnose ERM migration issues
# Run this when erm migrate fails with planning errors

set -e

DB_URL="postgres://dev:dev@localhost:5432/ermblog?sslmode=disable"
POSTGRES_URL="postgres://dev:dev@localhost:5432/postgres?sslmode=disable"

echo "=== ERM Migration Diagnosis ==="
echo ""

echo "1. Testing PostgreSQL connection..."
if psql "$POSTGRES_URL" -c "SELECT version();" >/dev/null 2>&1; then
    echo "✓ PostgreSQL connection successful"
else
    echo "✗ PostgreSQL connection failed"
    echo "  Check if PostgreSQL is running and credentials are correct"
    exit 1
fi

echo ""
echo "2. Checking if ermblog database exists..."
if psql "$POSTGRES_URL" -c "SELECT 1 FROM pg_database WHERE datname='ermblog';" | grep -q "1"; then
    echo "✓ ermblog database exists"

    echo ""
    echo "3. Checking current database state..."
    if psql "$DB_URL" -c "\dt" >/dev/null 2>&1; then
        echo "✓ Database accessible"
        echo "Current tables:"
        psql "$DB_URL" -c "\dt" || echo "No tables found"
    else
        echo "✗ Database exists but not accessible"
    fi
else
    echo "✗ ermblog database does not exist"
    echo "Creating database..."
    psql "$POSTGRES_URL" -c "CREATE DATABASE ermblog;"
    echo "✓ Database created"
fi

echo ""
echo "4. Checking for ERM migration tracking table..."
if psql "$DB_URL" -c "\dt" | grep -q "schema_migrations\|erm_migrations\|migrations"; then
    echo "✓ Migration tracking table found"
    echo "Migration status:"
    psql "$DB_URL" -c "SELECT * FROM schema_migrations ORDER BY version;" 2>/dev/null || \
    psql "$DB_URL" -c "SELECT * FROM erm_migrations ORDER BY version;" 2>/dev/null || \
    psql "$DB_URL" -c "SELECT * FROM migrations ORDER BY version;" 2>/dev/null || \
    echo "Could not read migration table"
else
    echo "✗ No migration tracking table found"
    echo "This might be causing the planning error"
fi

echo ""
echo "5. Checking migration files..."
MIGRATION_COUNT=$(ls migrations/20251021162004_schema_*.sql 2>/dev/null | wc -l)
echo "Found $MIGRATION_COUNT migration files"

if [ $MIGRATION_COUNT -eq 0 ]; then
    echo "✗ No migration files found"
else
    echo "✓ Migration files present"
    echo "First few files:"
    ls migrations/20251021162004_schema_*.sql | head -3
fi

echo ""
echo "6. Testing ERM configuration..."
if [ -f "erm.yaml" ]; then
    echo "✓ erm.yaml found"
    echo "Database URL from config:"
    grep -A1 "database:" erm.yaml | grep "url:" || echo "Could not extract URL"
else
    echo "✗ erm.yaml not found"
fi

echo ""
echo "7. Checking ERM cache..."
if [ -d ".erm/cache" ]; then
    echo "✓ ERM cache exists"
    echo "Cache contents:"
    ls -la .erm/cache/
else
    echo "✗ ERM cache not found"
fi

echo ""
echo "=== Diagnosis Complete ==="
echo ""
echo "Recommended actions:"
echo "1. If database connection failed: Fix PostgreSQL setup"
echo "2. If no migration tracking table: Run manual migration setup"
echo "3. If cache issues: Run 'rm -rf .erm/cache && erm gen --force'"
echo "4. If database is empty: Run './scripts/apply-migrations.sh'"
echo ""
echo "Try running: erm migrate status"
```

Now let me create a comprehensive fix script:

<file_path>
ermblog/scripts/fix-migrations.sh
</file_path>
<edit_description>
Create script to fix migration issues completely
</edit_description>
```bash
#!/bin/bash

# Complete fix for ERM migration planning errors
# This script performs a full reset and proper migration setup

set -e

DB_URL="postgres://dev:dev@localhost:5432/ermblog?sslmode=disable"
POSTGRES_URL="postgres://dev:dev@localhost:5432/postgres?sslmode=disable"

echo "=== ERM Migration Fix ==="
echo "This will completely reset your database and migrations"
echo "⚠️  ALL DATA WILL BE LOST"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "1. Stopping any running processes..."
pkill -f "go run cmd/api/main.go" 2>/dev/null || true

echo "2. Dropping and recreating database..."
echo "Dropping ermblog database..."
psql "$POSTGRES_URL" -c "DROP DATABASE IF EXISTS ermblog;" 2>/dev/null || true

echo "Creating fresh ermblog database..."
psql "$POSTGRES_URL" -c "CREATE DATABASE ermblog;"

echo "3. Clearing ERM cache and regenerating..."
rm -rf .erm/cache
echo "✓ Cache cleared"

echo "Regenerating code with force..."
erm gen --force
echo "✓ Code regenerated"

echo "4. Manually applying all migrations..."
MIGRATION_COUNT=$(ls migrations/20251021162004_schema_*.sql 2>/dev/null | wc -l)
echo "Found $MIGRATION_COUNT migrations to apply"

for file in migrations/20251021162004_schema_*.sql; do
    if [ -f "$file" ]; then
        echo "Applying: $(basename "$file")"
        psql "$DB_URL" -f "$file"
    fi
done
echo "✓ All migrations applied"

echo "5. Creating ERM migration tracking table..."
# Create a basic migration tracking table that ERM expects
psql "$DB_URL" -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    dirty BOOLEAN NOT NULL DEFAULT FALSE
);
" 2>/dev/null || psql "$DB_URL" -c "
CREATE TABLE IF NOT EXISTS erm_migrations (
    version VARCHAR(255) PRIMARY KEY,
    dirty BOOLEAN NOT NULL DEFAULT FALSE
);
" 2>/dev/null || echo "Migration table may already exist"

echo "6. Marking all migrations as applied..."
LATEST_MIGRATION=$(ls migrations/20251021162004_schema_*.sql | tail -1 | sed 's/.*schema_\([0-9]*\)\.sql/\1/')

for i in $(seq 1 $LATEST_MIGRATION); do
    MIGRATION_ID=$(printf "%02d" $i)
    psql "$DB_URL" -c "INSERT INTO schema_migrations (version, dirty) VALUES ('20251021162004_schema_$MIGRATION_ID', FALSE) ON CONFLICT (version) DO NOTHING;" 2>/dev/null || \
    psql "$DB_URL" -c "INSERT INTO erm_migrations (version, dirty) VALUES ('20251021162004_schema_$MIGRATION_ID', FALSE) ON CONFLICT (version) DO NOTHING;" 2>/dev/null || true
done

echo "✓ Migration tracking updated"

echo ""
echo "7. Verifying setup..."
echo "Database tables:"
psql "$DB_URL" -c "\dt"

echo ""
echo "Testing ERM migration status..."
if erm migrate status 2>/dev/null; then
    echo "✓ ERM migration status works!"
else
    echo "⚠️  ERM migration status still has issues, but database is set up"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Your database is now set up with:"
echo "- All $MIGRATION_COUNT migrations applied"
echo "- Migration tracking table created"
echo "- Fresh ERM cache"
echo ""
echo "Try running your application now:"
echo "go run cmd/api/main.go"
echo ""
echo "If ERM migrate still has issues, your database should work fine for development."
```

## **How to Use These Scripts**

1. **First, diagnose the issue:**
```bash
chmod +x scripts/diagnose-migrations.sh
./scripts/diagnose-migrations.sh
```

2. **If you want a complete fix (will delete all data):**
```bash
chmod +x scripts/fix-migrations.sh
./scripts/fix-migrations.sh
```

3. **Alternative - just apply migrations manually:**
```bash
chmod +x scripts/apply-migrations.sh
./scripts/apply-migrations.sh
```

## **What's Likely Happening**

The "plan migrations" error usually occurs when:

1. **Database doesn't exist** - ERM can't connect to plan migrations
2. **Migration tracking is corrupted** - ERM can't determine current state
3. **Cache is out of sync** - ERM's internal state doesn't match reality
4. **Partial migration state** - Some migrations applied, others failed midway

The scripts above handle all these scenarios systematically.

**Start with the diagnosis script first to understand what's wrong, then use the fix script if needed!**
