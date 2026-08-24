package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/argon2"
)

const (
	Argon2Time    = 1
	Argon2Memory  = 64 * 1024
	Argon2Threads = 4
	Argon2SaltLen = 16
	Argon2KeyLen  = 32

	seedAdvisoryLockID = 476_677_601
)

var requiredSchemaCapabilities = map[string][]string{
	"accounts":            {"id", "username", "display_name", "status"},
	"account_credentials": {"account_id", "credential_type", "identifier", "credential_value", "verified", "primary_credential"},
	"roles":               {"id", "name", "description", "permissions"},
	"account_roles":       {"account_id", "role_id"},
	"oauth2_clients":      {"account_id", "client_id", "name", "description", "redirect_uris", "grant_types", "scopes", "is_confidential", "metadata"},
}

func missingSchemaCapabilities(available map[string]map[string]bool) []string {
	missing := make([]string, 0)
	for table, columns := range requiredSchemaCapabilities {
		for _, column := range columns {
			if !available[table][column] {
				missing = append(missing, table+"."+column)
			}
		}
	}
	sort.Strings(missing)
	return missing
}

func validateSchemaCapabilities(ctx context.Context, db *sql.DB) error {
	rows, err := db.QueryContext(ctx, `SELECT table_name, column_name FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name IN ('accounts', 'account_credentials', 'roles', 'account_roles', 'oauth2_clients')`)
	if err != nil {
		return fmt.Errorf("inspect GOSSO schema capabilities: %w", err)
	}
	defer rows.Close()
	available := make(map[string]map[string]bool)
	for rows.Next() {
		var table, column string
		if err := rows.Scan(&table, &column); err != nil {
			return fmt.Errorf("read GOSSO schema capabilities: %w", err)
		}
		if available[table] == nil {
			available[table] = make(map[string]bool)
		}
		available[table][column] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate GOSSO schema capabilities: %w", err)
	}
	if missing := missingSchemaCapabilities(available); len(missing) > 0 {
		return fmt.Errorf("required GOSSO schema capabilities are unavailable: %s", strings.Join(missing, ", "))
	}
	return nil
}

func deploymentEnv() string {
	for _, key := range []string{"GOSSO_ADMIN_ENV", "GOUNO_ENV", "APP_ENV", "ENV"} {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return strings.ToLower(value)
		}
	}
	return "development"
}

func isDevelopmentLike(env string) bool {
	switch env {
	case "", "dev", "development", "local", "test", "testing":
		return true
	default:
		return false
	}
}

func validateAdminSeedPolicy(env, password string) {
	if isDevelopmentLike(env) {
		if password == "admin123" {
			log.Print("WARNING: local development default credentials are enabled. Do not use this configuration outside local development.")
		}
		return
	}

	if password == "" || password == "admin123" {
		log.Fatalf("Refusing to seed default admin password in %q environment. Set ADMIN_PASSWORD to a unique password with at least 12 characters.", env)
	}
	if len(password) < 12 {
		log.Fatalf("Refusing to seed weak admin password in %q environment. ADMIN_PASSWORD must be at least 12 characters.", env)
	}
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, Argon2SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, Argon2Time, Argon2Memory, Argon2Threads, Argon2KeyLen)
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		Argon2Memory, Argon2Time, Argon2Threads, saltB64, hashB64), nil
}

func parseRedirectURIs(envVal string) (string, error) {
	if envVal == "" {
		return `["http://localhost:8080/callback"]`, nil
	}
	envVal = strings.TrimSpace(envVal)
	if strings.HasPrefix(envVal, "[") && strings.HasSuffix(envVal, "]") {
		var uris []string
		if err := json.Unmarshal([]byte(envVal), &uris); err != nil {
			return "", fmt.Errorf("invalid JSON in redirect URIs: %w", err)
		}
		return envVal, nil
	}
	parts := strings.Split(envVal, ",")
	var uris []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			uris = append(uris, trimmed)
		}
	}
	bytes, err := json.Marshal(uris)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func main() {
	env := deploymentEnv()
	dsn := os.Getenv("PG_DSN")
	if dsn == "" {
		log.Fatal("PG_DSN environment variable is required")
	}

	adminUsername := os.Getenv("ADMIN_USERNAME")
	if adminUsername == "" {
		adminUsername = "admin"
	}
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin123"
	}
	validateAdminSeedPolicy(env, adminPassword)
	adminDisplayName := os.Getenv("ADMIN_DISPLAY_NAME")
	if adminDisplayName == "" {
		adminDisplayName = "System Admin"
	}

	redirectURIsEnv := os.Getenv("OAUTH2_CLIENT_REDIRECT_URIS")
	redirectURIsJSON, err := parseRedirectURIs(redirectURIsEnv)
	if err != nil {
		log.Fatalf("Failed to parse OAUTH2_CLIENT_REDIRECT_URIS: %v", err)
	}
	log.Printf("Starting GOSSO admin seed for %q environment.", env)
	log.Println("Connecting to GOSSO database...")
	var db *sql.DB

	// Wait and retry database connection
	for i := 0; i < 30; i++ {
		db, err = sql.Open("pgx", dsn)
		if err == nil {
			err = db.Ping()
			if err == nil {
				break
			}
		}
		log.Printf("Database not ready yet, retrying in 1s (error: %v)...", err)
		time.Sleep(1 * time.Second)
	}
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Waiting for required GOSSO schema capabilities...")
	ctx := context.Background()

	// Wait until the exact tables and columns this seed writes are available.
	schemaReady := false
	for i := 0; i < 30; i++ {
		err = validateSchemaCapabilities(ctx, db)
		if err == nil {
			schemaReady = true
			break
		}
		log.Printf("Required GOSSO schema capabilities are not ready yet. Retrying in 1s: %v", err)
		time.Sleep(1 * time.Second)
	}
	if !schemaReady {
		log.Fatalf("Timeout waiting for required GOSSO schema capabilities: %v", err)
	}
	log.Println("Required schema capabilities detected. Starting database seeding...")

	tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		log.Fatalf("Failed to start seed transaction: %v", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if _, err = tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock($1)", seedAdvisoryLockID); err != nil {
		log.Fatalf("Failed to acquire seed advisory lock: %v", err)
	}

	// 1. Seed Admin User
	var adminCount int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM accounts WHERE username = $1", adminUsername).Scan(&adminCount)
	if err != nil {
		log.Fatalf("Failed to query admin user count: %v", err)
	}

	var adminID string
	if adminCount == 0 {
		log.Printf("Seeding default admin user '%s'...\n", adminUsername)
		err = tx.QueryRowContext(ctx,
			"INSERT INTO accounts (username, display_name, status) VALUES ($1, $2, 'active') RETURNING id",
			adminUsername, adminDisplayName,
		).Scan(&adminID)
		if err != nil {
			log.Fatalf("Failed to seed admin account: %v", err)
		}

		pwHash, err := hashPassword(adminPassword)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		_, err = tx.ExecContext(ctx,
			`INSERT INTO account_credentials (account_id, credential_type, identifier, credential_value, verified, primary_credential)
			 VALUES ($1, 'password', $2, $3, true, true)`,
			adminID, adminUsername, pwHash,
		)
		if err != nil {
			log.Fatalf("Failed to seed admin password credential: %v", err)
		}
		log.Printf("Admin user %q seeded successfully. Store the initial password securely and rotate it after first sign-in.", adminUsername)
	} else {
		err = tx.QueryRowContext(ctx, "SELECT id FROM accounts WHERE username = $1", adminUsername).Scan(&adminID)
		if err != nil {
			log.Fatalf("Failed to get admin ID: %v", err)
		}
		log.Printf("Admin user '%s' already exists.\n", adminUsername)
	}

	// 2. Seed Admin Role
	var roleID string
	err = tx.QueryRowContext(ctx, "SELECT id FROM roles WHERE name = 'admin'").Scan(&roleID)
	if err == sql.ErrNoRows {
		log.Println("Seeding admin role...")
		err = tx.QueryRowContext(ctx,
			`INSERT INTO roles (name, description, permissions) VALUES ('admin', 'System Administrator', '["admin:*"]'::jsonb) RETURNING id`,
		).Scan(&roleID)
		if err != nil {
			log.Fatalf("Failed to seed admin role: %v", err)
		}
	} else if err != nil {
		log.Fatalf("Failed to query role id: %v", err)
	}
	if _, err = tx.ExecContext(ctx,
		`UPDATE roles SET permissions = COALESCE(permissions, '[]'::jsonb) || '["admin:*"]'::jsonb
		 WHERE id = $1 AND NOT (COALESCE(permissions, '[]'::jsonb) ? 'admin:*')`, roleID); err != nil {
		log.Fatalf("Failed to enforce built-in admin permissions: %v", err)
	}

	// 3. Link Admin User to Admin Role
	var linkCount int
	err = tx.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM account_roles WHERE account_id = $1 AND role_id = $2",
		adminID, roleID,
	).Scan(&linkCount)
	if err != nil {
		log.Fatalf("Failed to query account_roles count: %v", err)
	}
	if linkCount == 0 {
		_, err = tx.ExecContext(ctx,
			"INSERT INTO account_roles (account_id, role_id) VALUES ($1, $2)",
			adminID, roleID,
		)
		if err != nil {
			log.Fatalf("Failed to link admin user to admin role: %v", err)
		}
		log.Println("Linked admin user to admin role.")
	}

	// 4. Seed OAuth2 Client for GOSSO Admin Frontend
	var clientCount int
	err = tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM oauth2_clients WHERE client_id = 'gosso-admin-spa'").Scan(&clientCount)
	if err != nil {
		log.Fatalf("Failed to query oauth2_clients count: %v", err)
	}
	if clientCount == 0 {
		log.Println("Seeding OAuth2 client 'gosso-admin-spa'...")
		_, err = tx.ExecContext(ctx,
			`INSERT INTO oauth2_clients (account_id, client_id, name, description, redirect_uris, grant_types, scopes, is_confidential, metadata)
			 VALUES ($1, 'gosso-admin-spa', 'GOSSO Admin Console', 'OAuth2 Client for React GOSSO Admin Frontend', 
			         $2::jsonb, 
			         '["authorization_code", "refresh_token"]'::jsonb, 
			         '["openid", "profile", "email", "admin"]'::jsonb, 
			         false,
			         '{"capability":"admin"}'::jsonb)`,
			adminID, redirectURIsJSON,
		)
		if err != nil {
			log.Fatalf("Failed to seed OAuth2 client: %v", err)
		}
		log.Println("OAuth2 client seeded successfully.")
	} else {
		log.Println("OAuth2 client 'gosso-admin-spa' already exists. Updating admin client policy and redirect URIs...")
		_, err = tx.ExecContext(ctx,
			`UPDATE oauth2_clients
			 SET redirect_uris = $1::jsonb,
			     grant_types = '["authorization_code", "refresh_token"]'::jsonb,
			     scopes = '["openid", "profile", "email", "admin"]'::jsonb,
			     metadata = COALESCE(metadata, '{}'::jsonb) || '{"capability":"admin"}'::jsonb
			 WHERE client_id = 'gosso-admin-spa'`,
			redirectURIsJSON,
		)
		if err != nil {
			log.Fatalf("Failed to update OAuth2 admin client policy: %v", err)
		}
		log.Println("OAuth2 client 'gosso-admin-spa' admin policy updated.")
	}

	if err = tx.Commit(); err != nil {
		log.Fatalf("Failed to commit database seed transaction: %v", err)
	}
	committed = true
	log.Printf("Database seeding completed successfully. Admin account: %s; Admin console client: gosso-admin-spa.", adminUsername)
}
