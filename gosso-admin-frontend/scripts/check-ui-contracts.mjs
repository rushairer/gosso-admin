import { access, readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const root = fileURLToPath(new URL("../src/", import.meta.url));
const files = [];
const retiredProductStyles = new Set(["index.css"]);
const retiredVendoredAssets = ["public/ui-bootstrap.js", "public/gosso-admin.svg"];
const allowedGounoEntrypoints = new Set(["@gouno/ui/core", "@gouno/ui/gouno", "@gouno/ui/theme"]);
const directRadixImport = /(?:\bfrom\s+|\bimport\s*\(\s*)["']@radix-ui\//;

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if ([".css", ".ts", ".tsx"].includes(extname(entry.name))) files.push(path);
  }
}
async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}
await collect(root);
const failures = [];
for (const relativePath of retiredVendoredAssets) {
  if (await exists(join(projectRoot, relativePath))) failures.push(`${relativePath}: vendored Gouno UI runtime/brand asset must not be reintroduced; source it from the installed @gouno/ui release`);
}

function jsxTagName(node, sourceFile) {
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText(sourceFile);
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText(sourceFile);
  return null;
}
function location(sourceFile, node) { return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1; }
function buttonChildIcon(node, sourceFile) {
  let icon = null;
  function visitChild(child) {
    if (icon || !child) return;
    if (ts.isParenthesizedExpression(child)) return visitChild(child.expression);
    if (ts.isJsxFragment(child)) return child.children.forEach(visitChild);
    const tag = jsxTagName(child, sourceFile);
    if (tag && (tag === "svg" || /^[A-Z]/.test(tag))) { icon = child; return; }
    if (ts.isJsxExpression(child) && child.expression) return visitChild(child.expression);
    if (ts.isConditionalExpression(child)) { visitChild(child.whenTrue); visitChild(child.whenFalse); }
  }
  visitChild(node);
  return icon;
}
function staticClassName(attribute) {
  const initializer = attribute.initializer;
  if (!initializer) return "";
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (ts.isJsxExpression(initializer) && initializer.expression && (ts.isStringLiteral(initializer.expression) || ts.isNoSubstitutionTemplateLiteral(initializer.expression))) return initializer.expression.text;
  return "";
}
function staticJsxAttributeValue(node, attributeName) {
  const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
  for (const attribute of attributes.properties) {
    if (!ts.isJsxAttribute(attribute) || attribute.name.text !== attributeName) continue;
    const initializer = attribute.initializer;
    if (!initializer) return "";
    if (ts.isStringLiteral(initializer)) return initializer.text;
    if (ts.isJsxExpression(initializer) && initializer.expression && (ts.isStringLiteral(initializer.expression) || ts.isNoSubstitutionTemplateLiteral(initializer.expression))) return initializer.expression.text;
  }
  return "";
}
function nearestJsxAncestor(node, sourceFile, wanted) {
  let current = node.parent;
  while (current) {
    if ((ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) && jsxTagName(current, sourceFile) === wanted) return current;
    current = current.parent;
  }
  return null;
}
function isSupportedGounoImport(specifier) {
  return allowedGounoEntrypoints.has(specifier) || specifier.startsWith("@gouno/ui/brand-icons/");
}
function checkImports(name, sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    if (specifier === "@gouno/ui") failures.push(`${name}:${location(sourceFile, statement)} @gouno/ui package-root imports are compatibility-only; use an owned subpath`);
    else if (specifier.startsWith("@gouno/ui/") && !isSupportedGounoImport(specifier)) failures.push(`${name}:${location(sourceFile, statement)} unsupported @gouno/ui entrypoint ${specifier}; use an explicitly supported package subpath`);
  }
}

function checkTsxContracts(name, source) {
  if (!name.endsWith(".tsx") || name.includes("__tests__") || name.includes("test/")) return;
  const sourceFile = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const standaloneSystemManagement = name === "pages/SystemManagement.tsx";
  const accountSettings = name === "pages/AccountSettings.tsx";
  const adminLayout = name === "components/layout/AdminLayout.tsx";
  const siteSettings = name === "pages/system-management/SiteSettingsTab.tsx";
  let pageHeaders = 0;
  let tabs = 0;
  checkImports(name, sourceFile);

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = jsxTagName(node, sourceFile);
      if (tag === "PageHeader") pageHeaders += 1;
      if (tag === "Tabs") tabs += 1;
      if (standaloneSystemManagement && tag === "Tabs") failures.push(`${name}:${location(sourceFile, node)} system management domains are standalone Sidebar routes and must not add a route-family Tabs layer`);
      if (adminLayout && tag === "NavLink") {
        const target = staticJsxAttributeValue(node, "to");
        if (/^\/account-settings\/.+/.test(target)) failures.push(`${name}:${location(sourceFile, node)} account settings Tabs are page-local navigation; Sidebar must link only to /account-settings`);
      }
      if (["button", "select", "textarea"].includes(tag)) failures.push(`${name}:${location(sourceFile, node)} native ${tag} must use the canonical @gouno/ui primitive`);
      if (tag === "input") {
        const type = staticJsxAttributeValue(node, "type");
        const className = staticJsxAttributeValue(node, "className");
        const intentionallyHiddenFileInput = type === "file" && /(?:^|\s)(?:hidden|sr-only)(?:\s|$)/.test(className);
        if (!intentionallyHiddenFileInput) failures.push(`${name}:${location(sourceFile, node)} visible native input must use the shared Input/Checkbox/Radio primitive`);
      }
      if (siteSettings && tag === "LoginPreview" && nearestJsxAncestor(node, sourceFile, "form")) failures.push(`${name}:${location(sourceFile, node)} LoginPreview must remain a sibling of the real settings form; preview controls cannot participate in validation or submit`);
      if (ts.isJsxElement(node) && ["Button", "ButtonLink", "ChoiceButton"].includes(tag)) {
        for (const child of node.children) {
          const icon = buttonChildIcon(child, sourceFile);
          if (icon) failures.push(`${name}:${location(sourceFile, icon)} ${tag} icons must use the icon prop, not children`);
        }
      }
      const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
      for (const attribute of attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || attribute.name.text !== "className") continue;
        const value = staticClassName(attribute);
        if (/(^|\s)btn(?:\s|$)/.test(value)) failures.push(`${name}:${location(sourceFile, attribute)} shared button classes must use Button or ButtonLink`);
        if (/(^|\s)badge(?:\s|$)/.test(value)) failures.push(`${name}:${location(sourceFile, attribute)} shared badge classes must use Badge`);
        if (/(^|\s)fixed(?:\s|$)/.test(value)) failures.push(`${name}:${location(sourceFile, attribute)} raw fixed overlays are product-owned recreation; use Modal/Drawer/Message or another canonical overlay primitive`);
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["alert", "confirm", "prompt"].includes(node.expression.text)) failures.push(`${name}:${location(sourceFile, node)} browser ${node.expression.text}() is forbidden; use canonical feedback or confirmation primitives`);
    if (ts.isIdentifier(node) && node.text === "buttonClassName") failures.push(`${name}:${location(sourceFile, node)} buttonClassName is internal to the shared Button primitive`);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (accountSettings && (pageHeaders !== 1 || tabs !== 1)) failures.push(`${name}: Account Settings canonical grammar requires exactly one PageHeader followed by one page-local Tabs owner`);
}

for (const path of files) {
  const name = relative(root, path);
  const source = await readFile(path, "utf8");
  if (retiredProductStyles.has(name)) failures.push(`${name}: retired legacy stylesheet must not be reintroduced; canonical reset, fonts and primitive styling are owned by @gouno/ui`);
  if ((name.endsWith(".ts") || name.endsWith(".tsx")) && directRadixImport.test(source)) failures.push(`${name}: direct @radix-ui imports bypass @gouno/ui ownership; consume the canonical Gouno UI primitive instead`);
  checkTsxContracts(name, source);
}

if (failures.length) {
  console.error("UI contract failures:\n" + failures.join("\n"));
  process.exit(1);
} else {
  console.log(`UI contracts passed across ${files.length} source files.`);
}
