package main

import "testing"

func TestExpectedSchemaVersion(t *testing.T) {
	t.Setenv("GOSSO_SCHEMA_VERSION", "")
	version, err := expectedSchemaVersion()
	if err != nil || version != defaultSchemaVersion {
		t.Fatalf("default version = %d, %v; want %d, nil", version, err, defaultSchemaVersion)
	}

	t.Setenv("GOSSO_SCHEMA_VERSION", "21")
	version, err = expectedSchemaVersion()
	if err != nil || version != 21 {
		t.Fatalf("configured version = %d, %v; want 21, nil", version, err)
	}

	for _, value := range []string{"zero", "0", "-1"} {
		t.Run(value, func(t *testing.T) {
			t.Setenv("GOSSO_SCHEMA_VERSION", value)
			if _, err := expectedSchemaVersion(); err == nil {
				t.Fatalf("expected error for %q", value)
			}
		})
	}
}

func TestValidateSchemaVersion(t *testing.T) {
	if err := validateSchemaVersion(20, false, 20); err != nil {
		t.Fatalf("matching clean schema rejected: %v", err)
	}
	if err := validateSchemaVersion(20, true, 20); err == nil {
		t.Fatal("dirty schema accepted")
	}
	if err := validateSchemaVersion(21, false, 20); err == nil {
		t.Fatal("unknown schema accepted")
	}
}

func TestValidateAdminSeedPolicyDevelopment(t *testing.T) {
	// The development default remains intentionally available for the local quick start.
	validateAdminSeedPolicy("development", "admin", "admin123")
}
