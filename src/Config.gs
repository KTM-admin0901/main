/**
 * 設定値・シート定義。
 * シートを増やす場合は SCHEMA に追加し setup() を再実行する(既存データは壊さない)。
 */
const CONFIG = {
  PORTAL_TITLE: '社内イントラネット',
  PROP_SPREADSHEET_ID: 'PORTAL_SPREADSHEET_ID',
  ROLES: ['member', 'manager', 'admin'], // 右ほど強い
  AUDIT_ENABLED: true
};

const SHEETS = {
  APPS: 'Apps',
  USERS: 'Users',
  ANNOUNCEMENTS: 'Announcements',
  FAVORITES: 'Favorites',
  AUDIT: 'AuditLog'
};

const SCHEMA = {
  Apps: ['id', 'name', 'description', 'category', 'url', 'icon', 'minRole', 'status', 'sortOrder', 'owner', 'updatedAt'],
  Users: ['email', 'name', 'department', 'role', 'active'],
  Announcements: ['id', 'title', 'body', 'level', 'publishedAt', 'expiresAt', 'author'],
  Favorites: ['email', 'appId'],
  AuditLog: ['timestamp', 'email', 'action', 'target']
};
