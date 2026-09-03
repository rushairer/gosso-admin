import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const fromRoot = (...parts) => path.join(projectRoot, ...parts);

function indent(source) {
  return source
    .trim()
    .split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n");
}

function findBlockEnd(source, startIndex) {
  const openIndex = source.indexOf("{", startIndex);
  if (openIndex < 0) throw new Error("Unable to find CSS block opening brace");

  let depth = 0;
  let quote = "";
  let escaped = false;
  let inComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (inComment) {
      if (character === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }

  throw new Error("Unable to find CSS block closing brace");
}

function splitLeadingImports(source) {
  const imports = [];
  let remaining = source.trimStart();

  while (remaining.startsWith("@import ")) {
    const semicolon = remaining.indexOf(";");
    if (semicolon < 0) throw new Error("Unterminated CSS import");
    const statement = remaining.slice(0, semicolon + 1);
    if (!statement.includes("tailwindcss")) imports.push(statement);
    remaining = remaining.slice(semicolon + 1).trimStart();
  }

  return { imports, remaining };
}

async function migrateIndex() {
  const file = fromRoot("src/index.css");
  const original = await readFile(file, "utf8");
  if (original.includes("@layer components")) return;

  const { imports, remaining } = splitLeadingImports(original);
  const rootStart = remaining.indexOf(":root");
  if (rootStart !== 0) throw new Error("Expected :root at the start of src/index.css");
  const rootEnd = findBlockEnd(remaining, rootStart);
  const theme = remaining.slice(rootStart, rootEnd);
  let rest = remaining.slice(rootEnd).trimStart();

  rest = rest.replace(
    /^\*\s*\{\s*box-sizing:\s*border-box;\s*margin:\s*0;\s*padding:\s*0;\s*\}\s*/,
    "",
  );

  const componentMarker = rest.indexOf(".shell {");
  if (componentMarker < 0) throw new Error("Unable to locate .shell component boundary");
  const base = rest.slice(0, componentMarker);
  const components = rest.slice(componentMarker);

  const migrated = [
    imports.join("\n"),
    `@layer theme {\n${indent(theme)}\n}`,
    `@layer base {\n${indent(base)}\n}`,
    `@layer components {\n${indent(components)}\n}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  await writeFile(file, `${migrated}\n`);
}

async function wrapFile(relativePath, layer) {
  const file = fromRoot(relativePath);
  const source = await readFile(file, "utf8");
  if (source.includes(`@layer ${layer}`)) return;
  await writeFile(file, `@layer ${layer} {\n${indent(source)}\n}\n`);
}

async function updateMain() {
  const file = fromRoot("src/main.tsx");
  let source = await readFile(file, "utf8");
  if (source.includes("./styles/tailwind.css")) return;

  source = source.replace(
    "import './index.css';\nimport './styles/tokens.css';\nimport './styles/design-system-alignment.css';",
    "import './styles/tailwind.css';\nimport './index.css';\nimport './styles/tokens.css';\nimport './styles/design-system-alignment.css';\nimport './styles/accessibility.css';",
  );
  if (!source.includes("./styles/tailwind.css")) {
    throw new Error("Unable to update CSS import order in src/main.tsx");
  }
  await writeFile(file, source);
}

async function updatePackage() {
  const file = fromRoot("package.json");
  const manifest = JSON.parse(await readFile(file, "utf8"));
  manifest.scripts["lint:css"] = "node scripts/check-css-cascade.mjs";
  manifest.scripts.quality =
    "npm run format:check && npm run lint && npm run lint:ui && npm run lint:css && npm run typecheck && npm run test:coverage && npm run build";
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function updateDesignSystem() {
  const file = fromRoot("DESIGN_SYSTEM.md");
  let source = await readFile(file, "utf8");
  if (source.includes("## CSS cascade isolation")) return;

  source = source.replace(
    "## Verification",
    `## CSS cascade isolation\n\n- Tailwind is imported exactly once from \`src/styles/tailwind.css\`, which must be the first CSS entry loaded by \`main.tsx\`.\n- Global document defaults live in \`@layer base\`; reusable product styles live in \`@layer components\`; semantic variables live in \`@layer theme\`.\n- Accessibility overrides that must outrank utilities live in the final \`overrides\` layer.\n- Unlayered source rules and standalone universal spacing resets are rejected by \`npm run lint:css\`.\n\n## Verification`,
  );
  await writeFile(file, source);
}

await writeFile(
  fromRoot("src/styles/tailwind.css"),
  '@import "tailwindcss";\n\n@layer overrides;\n',
);
await writeFile(
  fromRoot("src/styles/accessibility.css"),
  `@layer overrides {\n  @media (prefers-reduced-motion: reduce) {\n    *,\n    *::before,\n    *::after {\n      scroll-behavior: auto !important;\n      animation-duration: 0.01ms !important;\n      animation-iteration-count: 1 !important;\n      transition-duration: 0.01ms !important;\n    }\n  }\n}\n`,
);

await migrateIndex();
await wrapFile("src/styles/tokens.css", "theme");
await wrapFile("src/styles/design-system-alignment.css", "components");
await updateMain();
await updatePackage();
await updateDesignSystem();

console.log("GOSSO Admin CSS cascade migration completed.");
