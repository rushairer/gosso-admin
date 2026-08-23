import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import zh from './locales/zh.json';

type TranslationTree = Record<string, string | TranslationTree>;

function flattenTranslations(tree: TranslationTree, prefix = '', result = new Set<string>()) {
  Object.entries(tree).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result.add(path);
    } else {
      flattenTranslations(value, path, result);
    }
  });
  return result;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!['.ts', '.tsx'].includes(extname(entry.name)) || entry.name.includes('.test.')) return [];
    return [path];
  });
}

function staticTranslationKeys() {
  const sourceRoot = resolve(process.cwd(), 'src');
  const keys = new Set<string>();
  sourceFiles(sourceRoot).forEach((path) => {
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
      keys.add(match[1]);
    }
  });
  return keys;
}

describe('localization resources', () => {
  const englishKeys = flattenTranslations(en);
  const chineseKeys = flattenTranslations(zh);

  it('keeps English and Chinese key sets aligned', () => {
    expect([...englishKeys].sort()).toEqual([...chineseKeys].sort());
  });

  it('defines every statically referenced translation key in both locales', () => {
    const referencedKeys = [...staticTranslationKeys()];
    expect(referencedKeys.filter((key) => !englishKeys.has(key))).toEqual([]);
    expect(referencedKeys.filter((key) => !chineseKeys.has(key))).toEqual([]);
  });
});
