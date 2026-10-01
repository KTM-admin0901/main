/** フロント(google.script.run)から呼ばれる公開関数。末尾 _ の関数は非公開。 */

function api_bootstrap() {
  const user = Auth.requireUser();
  const favs = Db.all(SHEETS.FAVORITES).filter(f => String(f.email).toLowerCase() === user.email).map(f => String(f.appId));
  const now = new Date();
  const announcements = Db.all(SHEETS.ANNOUNCEMENTS)
    .filter(a => !a.expiresAt || new Date(a.expiresAt) >= now)
    .filter(a => !a.publishedAt || new Date(a.publishedAt) <= now)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, 10);
  return {
    title: CONFIG.PORTAL_TITLE,
    user: user,
    isAdmin: Auth.can(user, 'admin'),
    apps: listApps_(user, false).map(withLaunchUrl_),
    favorites: favs,
    announcements: announcements,
    canEdit: Auth.can(user, 'manager'),
    systems: Db.all(SHEETS.SYSTEMS).filter(s => Auth.can(user, s.minRole))
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)),
    documents: Db.all(SHEETS.DOCUMENTS)
      .filter(d => Auth.can(user, d.minRole) && (d.status !== 'hidden' || Auth.can(user, 'manager')))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  };
}

/** package型でurl未設定なら、ポータル内の自動生成ページへのURLを付ける */
function withLaunchUrl_(a) {
  const o = Object.assign({}, a);
  if (o.type === 'package' && !o.url) o.url = ScriptApp.getService().getUrl() + '?page=app&id=' + encodeURIComponent(o.id);
  return o;
}

function listApps_(user, includeHidden) {
  return Db.all(SHEETS.APPS)
    .filter(a => includeHidden || (a.status === 'active' && Auth.can(user, a.minRole)))
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
}

function api_toggleFavorite(appId) {
  const user = Auth.requireUser();
  const mine = f => String(f.email).toLowerCase() === user.email && String(f.appId) === String(appId);
  if (Db.all(SHEETS.FAVORITES).some(mine)) {
    Db.remove(SHEETS.FAVORITES, mine);
    return false;
  }
  Db.append(SHEETS.FAVORITES, { email: user.email, appId: appId });
  return true;
}

function api_logLaunch(appId) {
  Auth.requireUser();
  audit_('launch_app', appId);
}

// ---- 管理者向け ----

function api_admin_load() {
  const user = Auth.requireRole('admin');
  return { apps: listApps_(user, true), users: Db.all(SHEETS.USERS), announcements: Db.all(SHEETS.ANNOUNCEMENTS) };
}

function api_admin_saveApp(app) {
  Auth.requireRole('admin');
  if (!app || !app.name) throw new Error('名称は必須です');
  app.type = app.type === 'package' ? 'package' : 'web';
  if (app.type === 'web' && !/^https:\/\//.test(app.url || '')) throw new Error('Webアプリは https:// のURLが必須です');
  if (app.url && !/^https:\/\//.test(app.url)) throw new Error('URLは https:// で始めてください');
  if (app.downloadUrl && !/^https:\/\//.test(app.downloadUrl)) throw new Error('配布先URLは https:// で始めてください');
  app.id = app.id || Utilities.getUuid();
  app.status = app.status || 'active';
  app.minRole = CONFIG.ROLES.indexOf(app.minRole) >= 0 ? app.minRole : 'member';
  app.updatedAt = new Date();
  Db.upsert(SHEETS.APPS, 'id', app);
  audit_('save_app', app.id);
  return app.id;
}

function api_admin_deleteApp(id) {
  Auth.requireRole('admin');
  Db.remove(SHEETS.APPS, a => String(a.id) === String(id));
  audit_('delete_app', id);
}

function api_admin_saveUser(u) {
  Auth.requireRole('admin');
  if (!u || !u.email) throw new Error('メールアドレスは必須です');
  u.email = String(u.email).toLowerCase();
  u.role = CONFIG.ROLES.indexOf(u.role) >= 0 ? u.role : 'member';
  u.active = u.active !== false;
  Db.upsert(SHEETS.USERS, 'email', u);
  audit_('save_user', u.email);
}

function api_admin_saveAnnouncement(a) {
  const user = Auth.requireRole('manager');
  if (!a || !a.title) throw new Error('タイトルは必須です');
  a.id = a.id || Utilities.getUuid();
  a.publishedAt = a.publishedAt || new Date();
  a.author = user.email;
  Db.upsert(SHEETS.ANNOUNCEMENTS, 'id', a);
  audit_('save_announcement', a.id);
  return a.id;
}

/** 管理画面のボタンから INITIAL_APPS(Setup.gs)を Apps シートに同期する */
function api_admin_syncApps() {
  Auth.requireRole('admin');
  registerApps();
  audit_('sync_apps', '');
}

// ---- 設計書・資料 / 構築予定システム(展望) ----
const DOC_PHASES = ['構想', '設計', '開発', '稼働'];

function api_saveSystem(s) {
  const user = Auth.requireRole('manager');
  if (!s || !s.name) throw new Error('システム名は必須です');
  s.id = s.id || Utilities.getUuid();
  s.phase = DOC_PHASES.indexOf(s.phase) >= 0 ? s.phase : '構想';
  s.minRole = CONFIG.ROLES.indexOf(s.minRole) >= 0 ? s.minRole : 'member';
  s.showOnTop = s.showOnTop === 'hidden' ? 'hidden' : 'show';
  s.owner = s.owner || user.name;
  s.updatedAt = new Date();
  Db.upsert(SHEETS.SYSTEMS, 'id', s);
  audit_('save_system', s.id);
  return s.id;
}

function api_deleteSystem(id) {
  Auth.requireRole('admin');
  Db.remove(SHEETS.SYSTEMS, s => String(s.id) === String(id));
  audit_('delete_system', id);
}

function api_saveDocument(d) {
  const user = Auth.requireRole('manager');
  if (!d || !d.title) throw new Error('タイトルは必須です');
  if (!/^https:\/\//.test(d.url || '')) throw new Error('資料のURLは https:// で始めてください(Googleドキュメント/Driveの共有リンク等)');
  d.id = d.id || Utilities.getUuid();
  d.minRole = CONFIG.ROLES.indexOf(d.minRole) >= 0 ? d.minRole : 'member';
  d.status = d.status === 'hidden' ? 'hidden' : 'active';
  d.owner = d.owner || user.name;
  d.updatedAt = new Date();
  Db.upsert(SHEETS.DOCUMENTS, 'id', d);
  audit_('save_document', d.id);
  return d.id;
}

function api_deleteDocument(id) {
  Auth.requireRole('admin');
  Db.remove(SHEETS.DOCUMENTS, d => String(d.id) === String(id));
  audit_('delete_document', id);
}
