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

/**
 * 業務アプリをポータルに登録する(何度実行しても重複しない。idが同じなら上書き)。
 * アプリを追加・URL変更するときは INITIAL_APPS を編集し、GASエディタで実行する。
 * ※管理画面から登録する場合は、この関数を使わなくてもよい。
 */
const INITIAL_APPS = [
  {
    id: 'zaiko-kanri', name: '在庫管理', description: '在庫の確認・入出庫の管理',
    category: '在庫・購買', url: 'https://script.google.com/macros/s/AKfycbwOO2q0T9VxaO22_4bdiso9iSPLCUzaaNQdk98cqUaAylVJSMkbCZU-gi5Em0SUHW2uhA/exec', icon: '📦', sortOrder: 10
  },
  {
    id: 'cad-guide', name: 'CADデータ取得・SP登録アシスタント', description: 'CAD取得の使い方と依頼の案内',
    category: '設計', url: ScriptApp.getService().getUrl() + '?page=cad-guide', icon: '📐', sortOrder: 20
  }
];

function registerApps() {
  const me = (Session.getEffectiveUser().getEmail() || '').toLowerCase();
  INITIAL_APPS.forEach(a => Db.upsert(SHEETS.APPS, 'id', Object.assign(
    { minRole: 'member', status: 'active', owner: me, updatedAt: new Date() }, a)));
  // setup() が作ったサンプル行を削除
  Db.remove(SHEETS.APPS, a => a.name === 'サンプルアプリ');
  console.log('登録: ' + INITIAL_APPS.map(a => a.name).join(', '));
}
