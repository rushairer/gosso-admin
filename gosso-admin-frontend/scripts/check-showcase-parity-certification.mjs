import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const repoRoot = resolve(frontendRoot, "..");
const ledgerRel = "docs/ui/showcase-parity-certifications.json";
const failures = [];

const expectedIds = [
  "gosso-account-settings",
  "gosso-callback",
  "gosso-forgot-password",
  "gosso-login",
  "gosso-not-found",
  "gosso-overview",
  "gosso-reset-password",
  "gosso-system-audit-logs",
  "gosso-system-clients",
  "gosso-system-site-settings",
  "gosso-system-status",
  "gosso-system-users",
].sort();

function fail(message) {
  failures.push(message);
}

function git(cwd, args) {
  try {
    return {
      ok: true,
      output: execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    };
  } catch {
    return { ok: false, output: "" };
  }
}

function hasRef(cwd, ref, label) {
  const result = git(cwd, ["rev-parse", "--verify", `${ref}^{commit}`]);
  if (!result.ok && process.env.PARITY_STRICT_HISTORY === "1") {
    fail(`${label}: reviewed ref ${ref} is unavailable.`);
  }
  return result.ok;
}

function sorted(values) {
  return [...new Set(values ?? [])].sort();
}

function sameStrings(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function touches(changed, prefixes) {
  return changed.some((path) =>
    prefixes.some((prefix) => path === prefix || path.startsWith(prefix)),
  );
}

const ledger = JSON.parse(
  await readFile(resolve(repoRoot, ledgerRel), "utf8"),
);

if (ledger.schemaVersion !== 1) fail("Certification schemaVersion must be 1.");
if (ledger.policy !== "manual-first-v1") {
  fail("Certification policy must remain manual-first-v1.");
}

const entries = ledger.certifications ?? [];
if (entries.length !== 1 || entries[0]?.id !== "gosso-admin-frozen") {
  fail("Keep exactly one gosso-admin-frozen certification entry.");
}

const entry = entries.find((item) => item.id === "gosso-admin-frozen");
if (entry) {
  if (!["needs-manual-recertification", "verified", "blocked"].includes(entry.status)) {
    fail(`Unsupported certification status: ${entry.status}`);
  }
  if (entry.reviewMethod !== "manual-first") {
    fail("reviewMethod must remain manual-first.");
  }
  if (!sameStrings(entry.canonicalIds, expectedIds)) {
    fail("canonicalIds must exactly match the 12 frozen Gosso Product ids.");
  }

  if (entry.status === "verified") {
    for (const field of [
      "manualReview",
      "reviewDate",
      "reviewedRefs",
      "gounoUiPackageVersion",
      "stateCoverage",
      "reviewDimensions",
      "ownedPaths",
      "canonicalPaths",
      "browserEvidence",
    ]) {
      if (!entry[field]) fail(`Verified certification is missing ${field}.`);
    }

    const packageJson = JSON.parse(
      await readFile(resolve(frontendRoot, "package.json"), "utf8"),
    );
    const currentUi = packageJson.dependencies?.["@gouno/ui"];
    if (currentUi !== entry.gounoUiPackageVersion) {
      fail(
        `Certified @gouno/ui ${entry.gounoUiPackageVersion} does not match current ${currentUi ?? "missing"}.`,
      );
    }

    const review = await readFile(resolve(repoRoot, entry.manualReview), "utf8");
    if (!/Status:\s*\*\*verified\s*\/\s*manual-reviewed\*\*/i.test(review)) {
      fail("Manual review document must record verified / manual-reviewed status.");
    }
    if (!/manual rendered review/i.test(review)) {
      fail("Manual review document must retain manual rendered review evidence.");
    }

    const runs = entry.browserEvidence?.runs ?? [];
    const artifacts = entry.browserEvidence?.artifacts ?? [];
    if (runs.length < 4 || runs.some((run) => run.result !== "success")) {
      fail("Verified certification needs at least four successful workflow runs.");
    }
    if (artifacts.length < 2 || artifacts.some((artifact) => !artifact.sha256)) {
      fail("Verified certification needs at least two digested browser artifacts.");
    }

    if (hasRef(repoRoot, entry.reviewedRefs?.gossoAdmin, "Gosso Admin history")) {
      const diff = git(repoRoot, [
        "diff",
        "--name-only",
        `${entry.reviewedRefs.gossoAdmin}..HEAD`,
        "--",
        ...(entry.ownedPaths ?? []),
      ]);
      if (!diff.ok && process.env.PARITY_STRICT_HISTORY === "1") {
        fail("Unable to compare reviewed Product paths against HEAD.");
      }
      const changed = diff.output.split("\n").filter(Boolean);
      if (changed.length) {
        fail(
          `Certification is stale because Product paths changed after ${entry.reviewedRefs.gossoAdmin.slice(0, 12)}: ${changed.join(", ")}`,
        );
      }
    }

    const upstreamRoot = process.env.GOUNO_UI_CANONICAL_ROOT
      ? resolve(frontendRoot, process.env.GOUNO_UI_CANONICAL_ROOT)
      : "";

    if (upstreamRoot) {
      if (hasRef(upstreamRoot, entry.reviewedRefs?.gounoUi, "Gouno UI history")) {
        const diff = git(upstreamRoot, [
          "diff",
          "--name-only",
          `${entry.reviewedRefs.gounoUi}..HEAD`,
          "--",
          ...(entry.canonicalPaths ?? []),
        ]);
        if (!diff.ok && process.env.PARITY_STRICT_HISTORY === "1") {
          fail("Unable to compare certified canonical paths against current Gouno UI.");
        }
        const changed = diff.output.split("\n").filter(Boolean);
        if (changed.length) {
          fail(
            `Certification is stale because canonical paths changed after ${entry.reviewedRefs.gounoUi.slice(0, 12)}: ${changed.join(", ")}`,
          );
        }
      }

      const matrix = JSON.parse(
        await readFile(resolve(upstreamRoot, "canonical-showcase.json"), "utf8"),
      );
      if (matrix.status !== "frozen") {
        fail(`Upstream canonical matrix must remain frozen, got ${matrix.status ?? "missing"}.`);
      }
      if (!sameStrings(entry.canonicalIds, matrix.productPages?.gossoAdmin ?? [])) {
        fail("Upstream frozen Gosso Product ids no longer match the certification ledger.");
      }
    }
  }
}

const baseSha = process.env.PARITY_BASE_SHA?.trim();
if (baseSha && entry) {
  const changedResult = git(repoRoot, ["diff", "--name-only", `${baseSha}...HEAD`]);
  if (!changedResult.ok && process.env.PARITY_STRICT_HISTORY === "1") {
    fail(`Unable to calculate changes from PR base ${baseSha}.`);
  }

  const changed = changedResult.output.split("\n").filter(Boolean);
  const baseLedger = git(repoRoot, ["show", `${baseSha}:${ledgerRel}`]);

  if (baseLedger.ok && baseLedger.output) {
    const previous = JSON.parse(baseLedger.output).certifications?.find(
      (item) => item.id === "gosso-admin-frozen",
    );

    if (previous?.status === "verified") {
      const productTouched = touches(changed, previous.ownedPaths ?? []);
      const entryUnchanged = JSON.stringify(previous) === JSON.stringify(entry);

      if (productTouched && entryUnchanged) {
        fail(
          "Certified Product paths changed but the certification entry was not updated. Demote or recertify in the same PR.",
        );
      }

      if (productTouched && entry?.status === "verified") {
        if (entry.reviewedRefs?.gossoAdmin === previous.reviewedRefs?.gossoAdmin) {
          fail("Verified Product changes require a fresh Gosso Admin reviewed ref.");
        }
        if (JSON.stringify(entry.browserEvidence) === JSON.stringify(previous.browserEvidence)) {
          fail("Verified Product changes require fresh browser/parity evidence.");
        }
      }

      const oldPackage = git(repoRoot, [
        "show",
        `${baseSha}:gosso-admin-frontend/package.json`,
      ]);
      if (oldPackage.ok && oldPackage.output) {
        const before = JSON.parse(oldPackage.output).dependencies?.["@gouno/ui"];
        const after = JSON.parse(
          await readFile(resolve(frontendRoot, "package.json"), "utf8"),
        ).dependencies?.["@gouno/ui"];

        if (before !== after && entry?.status === "verified") {
          if (entry.gounoUiPackageVersion !== after) {
            fail("@gouno/ui changed but the certified package version was not refreshed.");
          }
          if (entry.reviewedRefs?.gossoAdmin === previous.reviewedRefs?.gossoAdmin) {
            fail("@gouno/ui upgrades require a fresh Gosso Admin reviewed ref.");
          }
          if (JSON.stringify(entry.browserEvidence) === JSON.stringify(previous.browserEvidence)) {
            fail("@gouno/ui upgrades require fresh browser/parity evidence.");
          }
        }
      }
    }
  }
}

if (failures.length) {
  console.error("Gosso Showcase parity certification checks failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Gosso Showcase parity certification ledger is valid and current.");
