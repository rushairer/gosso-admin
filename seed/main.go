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
)

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

func validateAdminSeedPolicy(env, username, password string) {
	if isDevelopmentLike(env) {
		if password == "admin123" {
			log.Printf("WARNING: using local development default credentials %q / %q. Do not use this outside local development.", username, password)
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
	validateAdminSeedPolicy(env, adminUsername, adminPassword)
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

	log.Println("Waiting for schema migrations to complete (checking for 'accounts' table)...")
	ctx := context.Background()

	// Wait until GOSSO migrations have run and created the accounts table
	tableExists := false
	for i := 0; i < 30; i++ {
		var exists bool
		query := `SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' AND table_name = 'accounts'
		)`
		err = db.QueryRowContext(ctx, query).Scan(&exists)
		if err == nil && exists {
			tableExists = true
			break
		}
		log.Printf("Table 'accounts' does not exist yet. GOSSO migrations might be running. Retrying in 1s...")
		time.Sleep(1 * time.Second)
	}
	if !tableExists {
		log.Fatal("Timeout waiting for 'accounts' table to be created by GOSSO migrations.")
	}
	log.Println("Schema detected. Starting database seeding...")

	// 1. Seed Admin User
	var adminCount int
	err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM accounts WHERE username = $1", adminUsername).Scan(&adminCount)
	if err != nil {
		log.Fatalf("Failed to query admin user count: %v", err)
	}

	adminID := "00000000-0000-0000-0000-000000000001"
	if adminCount == 0 {
		log.Printf("Seeding default admin user '%s'...\n", adminUsername)
		_, err = db.ExecContext(ctx,
			"INSERT INTO accounts (id, username, display_name, status) VALUES ($1, $2, $3, 'active')",
			adminID, adminUsername, adminDisplayName,
		)
		if err != nil {
			log.Fatalf("Failed to seed admin account: %v", err)
		}

		pwHash, err := hashPassword(adminPassword)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		_, err = db.ExecContext(ctx,
			`INSERT INTO account_credentials (account_id, credential_type, identifier, credential_value, verified, primary_credential)
			 VALUES ($1, 'password', $2, $3, true, true)`,
			adminID, adminUsername, pwHash,
		)
		if err != nil {
			log.Fatalf("Failed to seed admin password credential: %v", err)
		}
		log.Printf("Admin user %q seeded successfully. Store the initial password securely and rotate it after first sign-in.", adminUsername)
	} else {
		err = db.QueryRowContext(ctx, "SELECT id FROM accounts WHERE username = $1", adminUsername).Scan(&adminID)
		if err != nil {
			log.Fatalf("Failed to get admin ID: %v", err)
		}
		log.Printf("Admin user '%s' already exists.\n", adminUsername)
	}

	// 2. Seed Admin Role
	var roleID string
	err = db.QueryRowContext(ctx, "SELECT id FROM roles WHERE name = 'admin'").Scan(&roleID)
	if err == sql.ErrNoRows {
		log.Println("Seeding admin role...")
		err = db.QueryRowContext(ctx,
			"INSERT INTO roles (name, description) VALUES ('admin', 'System Administrator') RETURNING id",
		).Scan(&roleID)
		if err != nil {
			log.Fatalf("Failed to seed admin role: %v", err)
		}
	} else if err != nil {
		log.Fatalf("Failed to query role id: %v", err)
	}

	// 3. Link Admin User to Admin Role
	var linkCount int
	err = db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM account_roles WHERE account_id = $1 AND role_id = $2",
		adminID, roleID,
	).Scan(&linkCount)
	if err != nil {
		log.Fatalf("Failed to query account_roles count: %v", err)
	}
	if linkCount == 0 {
		_, err = db.ExecContext(ctx,
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
	err = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM oauth2_clients WHERE client_id = 'gosso-admin-spa'").Scan(&clientCount)
	if err != nil {
		log.Fatalf("Failed to query oauth2_clients count: %v", err)
	}
	if clientCount == 0 {
		log.Println("Seeding OAuth2 client 'gosso-admin-spa'...")
		_, err = db.ExecContext(ctx,
			`INSERT INTO oauth2_clients (account_id, client_id, name, description, redirect_uris, grant_types, scopes, is_confidential, metadata)
			 VALUES ($1, 'gosso-admin-spa', 'GOSSO Admin Console', 'OAuth2 Client for React GOSSO Admin Frontend', 
			         $2::jsonb, 
			         '["authorization_code"]'::jsonb, 
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
		_, err = db.ExecContext(ctx,
			`UPDATE oauth2_clients
			 SET redirect_uris = $1::jsonb,
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

	log.Printf("Database seeding completed successfully. Admin account: %s; Admin console client: gosso-admin-spa.", adminUsername)
}
