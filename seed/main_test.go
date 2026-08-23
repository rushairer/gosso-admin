package main

import "testing"

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

func TestValidateAdminSeedPolicyDevelopment(t *testing.T) {
	// The development default remains intentionally available for the local quick start.
	validateAdminSeedPolicy("development", "admin", "admin123")
}
