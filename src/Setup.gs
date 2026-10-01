/**
 * 初回セットアップ。GASエディタから手動で1回実行する。
 * - DB用スプレッドシートを作成(既に設定済みなら再利用し、不足シート/ヘッダーのみ補完)
 * - 実行者を admin として登録
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(CONFIG.PROP_SPREADSHEET_ID);
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create(CONFIG.PORTAL_TITLE + ' DB');
  props.setProperty(CONFIG.PROP_SPREADSHEET_ID, ss.getId());

  Object.keys(SCHEMA).forEach(name => {
    const header = SCHEMA[name];
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e8eef7');
    sh.setFrozenRows(1);
  });
  const def = ss.getSheetByName('シート1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  const me = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (me && !Db.all(SHEETS.USERS).some(u => String(u.email).toLowerCase() === me)) {
    Db.append(SHEETS.USERS, { email: me, name: me, department: '', role: 'admin', active: true });
  }
  if (Db.all(SHEETS.APPS).length === 0) {
    Db.append(SHEETS.APPS, {
      id: Utilities.getUuid(), name: 'サンプルアプリ', description: 'Apps シートまたは管理画面で実際のアプリを登録してください',
      category: 'サンプル', url: 'https://www.google.com/', icon: '🧩', minRole: 'member',
      status: 'active', sortOrder: 1, owner: me, updatedAt: new Date()
    });
  }
  console.log('DB: ' + ss.getUrl());
}
