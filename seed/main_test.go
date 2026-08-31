package main

import (
	"bytes"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMissingSchemaCapabilities(t *testing.T) {
	available := make(map[string]map[string]bool)
	for table, columns := range requiredSchemaCapabilities {
		available[table] = make(map[string]bool)
		for _, column := range columns {
			available[table][column] = true
		}
	}
	if missing := missingSchemaCapabilities(available); len(missing) != 0 {
		t.Fatalf("complete schema reported missing capabilities: %v", missing)
	}

	delete(available["oauth2_clients"], "metadata")
	missing := missingSchemaCapabilities(available)
	if len(missing) != 1 || missing[0] != "oauth2_clients.metadata" {
		t.Fatalf("missing capabilities = %v; want oauth2_clients.metadata", missing)
	}
}

func TestReadRequiredSecretPrefersConfiguredFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "admin_password")
	if err := os.WriteFile(path, []byte(" file-password\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ADMIN_PASSWORD_FILE", path)
	t.Setenv("ADMIN_PASSWORD", "env-password")
	if got := readRequiredSecret("ADMIN_PASSWORD"); got != "file-password" {
		t.Fatalf("readRequiredSecret() = %q, want file value", got)
	}
}

func TestValidateAdminSeedPolicyDevelopment(t *testing.T) {
	// The development default remains intentionally available for the local quick start.
	var output bytes.Buffer
	original := log.Writer()
	log.SetOutput(&output)
	t.Cleanup(func() { log.SetOutput(original) })
	validateAdminSeedPolicy("development", "admin123")
	if strings.Contains(output.String(), "admin123") {
		t.Fatal("development warning must not log the default password")
	}
}
