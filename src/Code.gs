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
