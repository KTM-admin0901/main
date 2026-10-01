# 社内イントラネット(ポータル)

既存の業務管理アプリ(GAS等)を一箇所に集約するポータル。

## 構成
- **バックエンド**: Google Apps Script(`src/*.gs`)
- **フロント**: GAS HtmlService(`src/index.html` `style.html` `app.html`)
- **DB**: Googleスプレッドシート(`setup()` が自動作成)

Googleアカウント認証をそのまま利用し、権限は `Users` シートで管理します(未登録ユーザーは入れません)。

| シート | 用途 |
|---|---|
| Apps | 登録アプリ(名称・URL・カテゴリ・`minRole`・表示状態・並び順) |
| Users | メール・部署・role(`member`/`manager`/`admin`)・有効 |
| Announcements | お知らせ(manager以上が投稿) |
| Systems | 構築予定システム(フェーズ: 構想/設計/開発/稼働、予定時期、概要、担当) |
| Documents | 設計書・要件定義・ロードマップ等の資料(URL、種別、関連システム、版、要約、公開範囲) |
| Favorites | ユーザー別お気に入り |
| AuditLog | ポータル表示・アプリ起動・管理操作の履歴 |

## 機能
アプリ一覧(カテゴリ/検索/お気に入り)、権限別表示、お知らせ、管理画面(アプリ・ユーザー・お知らせ登録)、監査ログ。

## セットアップ
```
npm i
npx clasp login
npx clasp create --type webapp --title "Intranet Portal" --rootDir src   # または .clasp.json.example を .clasp.json にコピーしscriptIdを記入
npx clasp push
npx clasp open
```
1. GASエディタで `setup()` を実行(DBスプレッドシート作成、実行者をadmin登録)
2. デプロイ → ウェブアプリ(実行ユーザー: 自分 / アクセス: 組織内全員)
3. 発行URLを社内に周知。管理画面からアプリ・ユーザーを登録

## 設計書・展望の管理
「資料・展望」タブで、構築予定システムをフェーズ別(構想→設計→開発→稼働)に並べて展望を管理し、システムごとに設計書などの資料(Googleドキュメント/Drive等のURL)を紐づけます。登録・編集は manager 以上、削除は admin。資料の本体はDrive等に置き、ポータルはリンクと要約・版・公開範囲を管理します。

## アプリの種別
- **web**: URLを開くだけのウェブアプリ(GAS / Cloudflare 等)。
- **package**: 各PCにインストールして使うアプリ(CADデータ取得ツール等)。管理画面で種別を「パッケージ型」にし、バージョン・配布先URL・動作要件・インストール手順・起動コマンドを入力すると、ポータル内に案内ページ(`?page=app&id=...`)が自動生成されます。個別の案内ページを作った場合は URL 欄にそのURLを入れるとそちらが開きます。

## 各業務アプリの連携
各アプリはURLを Apps シートに登録するだけ。ポータルと同じドメインのGASウェブアプリなら、アプリ側で `Session.getActiveUser().getEmail()` を使い、同じ Users シートを参照すれば権限を共通化できます。

## 注意点 / 今後
- `executeAs: USER_DEPLOYING` + `access: DOMAIN` により、同一Workspace内でユーザーのメールが取得できます(Workspace外の個人Gmailでは取得不可)。
- GAS同士のiframe埋め込みはできないためリンク遷移方式です。
- Cloudflare化する場合は `Api.gs` を `doPost` JSON API化し、Cloudflare Access等で認証する構成が候補です。
- 今後の候補: アクセス集計ダッシュボード、申請ワークフロー、部署別表示。
