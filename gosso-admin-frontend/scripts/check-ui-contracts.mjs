import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if ([".css", ".ts", ".tsx"].includes(extname(entry.name)))
      files.push(path);
  }
}

await collect(root);
const failures = [];

function jsxTagName(node, sourceFile) {
  if (ts.isJsxElement(node))
    return node.openingElement.tagName.getText(sourceFile);
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText(sourceFile);
  return null;
}

function location(sourceFile, node) {
  return (
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
  );
}

function checkTsxContracts(name, source) {
  if (!name.endsWith(".tsx") || name.includes("__tests__") || name.includes("test/")) return;
  const sourceFile = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const sharedPrimitive = name.startsWith("components/ui/") || name.startsWith("components/layout/");

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = jsxTagName(node, sourceFile);
      if (!sharedPrimitive && tag === "button") {
        failures.push(
          `${name}:${location(sourceFile, node)} native button must use Button, ButtonLink, or IconButton`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

for (const path of files) {
  const name = relative(root, path);
  const source = await readFile(path, "utf8");
  checkTsxContracts(name, source);
}

if (failures.length) {
  console.warn("UI contract warnings:\n" + failures.join("\n"));
} else {
  console.log(`UI contracts passed across ${files.length} source files.`);
}
