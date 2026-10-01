/** スプレッドシートを簡易DBとして扱う薄いリポジトリ層。 */
const Db = {
  ss() {
    const id = PropertiesService.getScriptProperties().getProperty(CONFIG.PROP_SPREADSHEET_ID);
    if (!id) throw new Error('未初期化です。GASエディタで setup() を実行してください。');
    return SpreadsheetApp.openById(id);
  },

  sheet(name) {
    let sh = this.ss().getSheetByName(name);
    if (!sh && SCHEMA[name]) sh = this.ss().insertSheet(name); // スキーマに追加したシートは自動作成
    if (!sh) throw new Error('シートが見つかりません: ' + name);
    this._ensureHeader(sh, name);
    return sh;
  },

  /** スキーマに列が追加されていたら、ヘッダー行を自動で補完する(実行ごとに1回) */
  _ensureHeader(sh, name) {
    this._checked = this._checked || {};
    if (this._checked[name]) return;
    const header = SCHEMA[name];
    const cur = sh.getRange(1, 1, 1, header.length).getValues()[0];
    if (cur.join('|') !== header.join('|')) {
      sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#e8eef7');
    }
    this._checked[name] = true;
  },

  /** 全行をオブジェクト配列で返す */
  all(name) {
    const sh = this.sheet(name);
    const last = sh.getLastRow();
    if (last < 2) return [];
    const header = SCHEMA[name];
    return sh.getRange(2, 1, last - 1, header.length).getValues()
      .map(row => Db._toObj(header, row));
  },

  /** keyColumn が key と一致する行を更新、無ければ追加(排他制御付き) */
  upsert(name, keyColumn, obj) {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = this.sheet(name);
      const header = SCHEMA[name];
      const keyIdx = header.indexOf(keyColumn);
      const rowValues = header.map(h => (obj[h] === undefined ? '' : obj[h]));
      const last = sh.getLastRow();
      if (last >= 2) {
        const keys = sh.getRange(2, keyIdx + 1, last - 1, 1).getValues().map(r => String(r[0]));
        const i = keys.indexOf(String(obj[keyColumn]));
        if (i >= 0) {
          sh.getRange(i + 2, 1, 1, header.length).setValues([rowValues]);
          return;
        }
      }
      sh.appendRow(rowValues);
    } finally {
      lock.releaseLock();
    }
  },

  append(name, obj) {
    const header = SCHEMA[name];
    this.sheet(name).appendRow(header.map(h => (obj[h] === undefined ? '' : obj[h])));
  },

  /** 条件に合う行を削除 */
  remove(name, predicate) {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = this.sheet(name);
      const rows = this.all(name);
      for (let i = rows.length - 1; i >= 0; i--) {
        if (predicate(rows[i])) sh.deleteRow(i + 2);
      }
    } finally {
      lock.releaseLock();
    }
  },

  _toObj(header, row) {
    const o = {};
    header.forEach((h, i) => {
      const v = row[i];
      o[h] = v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss") : v;
    });
    return o;
  }
};
