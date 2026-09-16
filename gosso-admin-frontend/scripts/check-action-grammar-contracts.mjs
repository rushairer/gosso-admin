import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const failures = [];

async function source(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

function requireText(sourceText, text, message) {
  if (!sourceText.includes(text)) failures.push(message);
}

function forbidText(sourceText, text, message) {
  if (sourceText.includes(text)) failures.push(message);
}

const profile = await source('pages/account-settings/ProfilePanel.tsx');
requireText(profile, '保存显示名称', 'ProfilePanel.tsx: localized save-display-name accessible action is required');
requireText(profile, '取消编辑显示名称', 'ProfilePanel.tsx: localized cancel-edit accessible action is required');
forbidText(profile, 'label="Save display name"', 'ProfilePanel.tsx: hard-coded English accessible label reintroduced');
forbidText(profile, 'label="Cancel"', 'ProfilePanel.tsx: hard-coded English accessible label reintroduced');

const password = await source('pages/account-settings/PasswordPanel.tsx');
for (const label of ['显示当前密码', '隐藏当前密码', '显示新密码', '隐藏新密码']) {
  requireText(password, label, `PasswordPanel.tsx: missing localized password action ${label}`);
}
forbidText(password, 'Toggle current password visibility', 'PasswordPanel.tsx: hard-coded English current-password label reintroduced');
forbidText(password, 'Toggle new password visibility', 'PasswordPanel.tsx: hard-coded English new-password label reintroduced');

const mfa = await source('pages/account-settings/MFAPanel.tsx');
requireText(mfa, "chinese ? '重新生成' : 'Regenerate'", 'MFAPanel.tsx: regenerate confirmation must name the action');
requireText(mfa, "chinese ? '重新载入' : 'Reload'", 'MFAPanel.tsx: persistent load failure must use reload grammar');

const passkeys = await source('pages/account-settings/PasskeysPanel.tsx');
requireText(passkeys, "chinese ? '重新载入' : 'Reload'", 'PasskeysPanel.tsx: persistent load failure must use reload grammar');

const sessions = await source('pages/account-settings/SessionsPanel.tsx');
requireText(sessions, "chinese ? '重新载入' : 'Reload'", 'SessionsPanel.tsx: persistent load failure must use reload grammar');

const clients = await source('pages/system-management/ClientsTab.tsx');
for (const label of ['确认删除', '确认轮换', '复制重定向 URI']) {
  requireText(clients, label, `ClientsTab.tsx: missing action-specific wording ${label}`);
}
requireText(clients, "chinese ? '重新载入' : 'Reload'", 'ClientsTab.tsx: persistent load failure must use reload grammar');

const users = await source('pages/system-management/UsersTab.tsx');
for (const label of ['确认停用', '确认启用', '确认解锁', '确认重置 MFA', '确认删除', '当前管理员']) {
  requireText(users, label, `UsersTab.tsx: missing action-specific wording ${label}`);
}
requireText(users, "chinese ? '重新载入' : 'Reload'", 'UsersTab.tsx: persistent load failure must use reload grammar');

const siteSettings = await source('pages/system-management/SiteSettingsTab.tsx');
requireText(siteSettings, '所有修改已保存', 'SiteSettingsTab.tsx: stable saved state must remain explicit');
requireText(siteSettings, "chinese ? '重新载入' : 'Reload'", 'SiteSettingsTab.tsx: persistent load failure must use reload grammar');

const notFound = await source('pages/NotFound.tsx');
requireText(notFound, '返回概览', 'NotFound.tsx: admin 404 must return to the management overview, not use generic home wording');
requireText(notFound, "t('notFound.goBack')", 'NotFound.tsx: previous-page recovery action must remain available');

const governedRoots = [
  path.join(root, 'pages/account-settings'),
  path.join(root, 'pages/system-management'),
];
for (const governedRoot of governedRoots) {
  for (const name of await readdir(governedRoot)) {
    if (!name.endsWith('.tsx')) continue;
    const text = await readFile(path.join(governedRoot, name), 'utf8');
    if (/okText\s*=\s*\{t\(['"]common\.continue['"]\)\}/.test(text)) {
      failures.push(`${path.basename(governedRoot)}/${name}: generic Continue is forbidden for governed confirmation CTAs; name the action`);
    }
  }
}

if (failures.length) {
  console.error(`GOSSO action grammar contract failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('GOSSO microcopy/action grammar contract passed.');