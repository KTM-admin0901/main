/** 認証・認可。ログインはGoogleアカウント(Workspace)に任せ、権限は Users シートで管理する。 */
const Auth = {
  currentEmail() {
    return (Session.getActiveUser().getEmail() || '').toLowerCase();
  },

  /** 登録済みかつ有効なユーザーを返す。未登録なら null */
  currentUser() {
    const email = this.currentEmail();
    if (!email) return null;
    const u = Db.all(SHEETS.USERS).find(r => String(r.email).toLowerCase() === email && r.active !== false && r.active !== 'FALSE');
    return u ? { email: email, name: u.name || email, department: u.department, role: u.role || 'member' } : null;
  },

  rank(role) {
    const i = CONFIG.ROLES.indexOf(role);
    return i < 0 ? 0 : i;
  },

  can(user, minRole) {
    return !!user && this.rank(user.role) >= this.rank(minRole || 'member');
  },

  requireUser() {
    const u = this.currentUser();
    if (!u) throw new Error('アクセス権がありません');
    return u;
  },

  requireRole(minRole) {
    const u = this.requireUser();
    if (!this.can(u, minRole)) throw new Error('権限が不足しています');
    return u;
  }
};

function audit_(action, target) {
  if (!CONFIG.AUDIT_ENABLED) return;
  try {
    Db.append(SHEETS.AUDIT, { timestamp: new Date(), email: Auth.currentEmail(), action: action, target: target || '' });
  } catch (e) { console.error(e); }
}
