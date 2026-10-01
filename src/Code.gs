/** Webアプリのエントリポイント */
function doGet(e) {
  let user = null;
  try { user = Auth.currentUser(); } catch (err) { return errorPage_(err.message); }

  if (!user) {
    return HtmlService.createHtmlOutput(
      '<meta charset="utf-8"><body style="font-family:sans-serif;padding:40px">' +
      '<h2>アクセス権がありません</h2><p>' + CONFIG.PORTAL_TITLE +
      ' への登録がありません。管理者に連絡してください。</p></body>'
    ).setTitle(CONFIG.PORTAL_TITLE);
  }

  // ?page=cad-guide のように、ポータル内の案内ページを開ける(許可リスト方式)
  const page = e && e.parameter && e.parameter.page;
  if (page === 'app') {
    const app = Db.all(SHEETS.APPS).find(a => String(a.id) === String(e.parameter.id));
    if (!app || app.type !== 'package' || app.status !== 'active' || !Auth.can(user, app.minRole)) {
      return errorPage_('アプリが見つかりません');
    }
    audit_('open_package', app.id);
    const t = HtmlService.createTemplateFromFile('guide_package');
    t.app = app;
    t.portalUrl = ScriptApp.getService().getUrl();
    t.steps = String(app.installGuide || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return t.evaluate().setTitle(app.name).addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page && PAGES[page]) {
    audit_('open_page', page);
    return HtmlService.createTemplateFromFile(PAGES[page]).evaluate()
      .setTitle(CONFIG.PORTAL_TITLE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  audit_('open_portal', '');
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle(CONFIG.PORTAL_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** テンプレートからHTML部品を読み込む */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function errorPage_(msg) {
  return HtmlService.createHtmlOutput('<meta charset="utf-8"><p>エラー: ' + msg + '</p>');
}
