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
  SYSTEMS: 'Systems',
  DOCUMENTS: 'Documents',
  FAVORITES: 'Favorites',
  AUDIT: 'AuditLog'
};

const SCHEMA = {
  Apps: ['id', 'name', 'description', 'category', 'url', 'icon', 'minRole', 'status', 'sortOrder', 'owner', 'updatedAt',
    'type', 'version', 'downloadUrl', 'requirements', 'installGuide', 'command'],
  Users: ['email', 'name', 'department', 'role', 'active'],
  Announcements: ['id', 'title', 'body', 'level', 'publishedAt', 'expiresAt', 'author'],
  Systems: ['id', 'name', 'phase', 'targetDate', 'summary', 'owner', 'minRole', 'sortOrder', 'updatedAt', 'showOnTop'],
  Documents: ['id', 'title', 'kind', 'systemId', 'url', 'version', 'summary', 'tags', 'owner', 'minRole', 'status', 'updatedAt'],
  Favorites: ['email', 'appId'],
  AuditLog: ['timestamp', 'email', 'action', 'target']
};

// ポータル内の案内ページ。?page=<キー> で開く。値は src/ 内のHTMLファイル名(拡張子なし)
const PAGES = {
  // 'app' は package型アプリの自動生成ページ(?page=app&id=...)。doGetで個別処理

  'cad-guide': 'guide_cad'
};

// 案内ページに表示するリンク(未設定なら非表示)
const LINKS = {
  CAD_SHEET_URL: 'https://docs.google.com/spreadsheets/d/1tbEUa74kKhomKjNXqnRrEilyV2FN5-lF66V9XBsRyIs/edit',
  CAD_REQUEST_APP_URL: '' // 依頼画面(GASウェブアプリ)を公開したらURLを入れる
};
