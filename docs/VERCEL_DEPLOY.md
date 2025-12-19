# Vercel デプロイ手順

## 概要

このドキュメントは、進路ナビ（transport-search）をVercelにデプロイする際の手順をまとめたものです。

---

## 1. Vercel 環境変数の設定

Vercelダッシュボード → プロジェクト → Settings → Environment Variables で以下を設定してください。

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `RAPIDAPI_KEY` | （RapidAPIで取得したキー） | NAVITIME API キー |
| `AUTH_SERVER_URL` | `https://unified-auth-server-856773980753.asia-northeast1.run.app` | 認証サーバーURL（サーバーサイド用） |
| `NEXT_PUBLIC_AUTH_SERVER_URL` | `https://unified-auth-server-856773980753.asia-northeast1.run.app` | 認証サーバーURL（クライアントサイド用） |
| `NEXT_PUBLIC_APP_NAME` | `進路ナビ` | アプリケーション名 |
| `NEXT_PUBLIC_PROJECT_ID` | `transport-search` | プロジェクトID |

**注意**: 環境は「Production」「Preview」「Development」すべてにチェックを入れてください。

---

## 2. 設定済みの項目（追加作業不要）

以下の項目は既に設定済みのため、追加作業は不要です。

### 2.1 Secret Manager（Google Cloud）

Secret名: `project-config-transport-search`

```json
{
  "name": "進路ナビ",
  "type": "web_app",
  "description": "進路指導訪問 所要時間検索アプリケーション",
  "allowed_domains": ["i-seifu.jp"],
  "student_allowed": false,
  "admin_emails": [],
  "required_groups": [],
  "allowed_groups": ["staff@i-seifu.jp"],
  "required_org_units": [],
  "allowed_org_units": [],
  "redirect_uris": [
    "http://localhost:3000/auth/callback",
    "https://transport-search.vercel.app/auth/callback"
  ],
  "token_delivery": "query_param",
  "token_expiry_days": 7,
  "api_proxy_enabled": false
}
```

### 2.2 Google OAuth リダイレクトURI

Client ID: `856773980753-adcsp4cj746gip75r2juhlo0qpn9atm2`

登録済みのリダイレクトURI:
- `https://unified-auth-server-856773980753.asia-northeast1.run.app/callback/transport-search`

---

## 3. デプロイ手順

1. **GitHubリポジトリとVercelを連携**（初回のみ）
   - Vercelダッシュボードで「New Project」
   - GitHubリポジトリ `h-hamada-seifu/transport-search` を選択
   - ブランチは `main` または `feature/auth` を選択

2. **環境変数を設定**
   - 上記「1. Vercel 環境変数の設定」を参照

3. **デプロイ実行**
   - Vercelが自動的にビルド・デプロイを実行

4. **動作確認**
   - `https://transport-search.vercel.app` にアクセス
   - 認証サーバーのログインページにリダイレクトされることを確認
   - Googleでログイン
   - アプリケーションが正常に表示されることを確認

---

## 4. トラブルシューティング

### 4.1 認証エラーが発生する場合

1. **環境変数の確認**
   - `AUTH_SERVER_URL` が正しく設定されているか
   - `NEXT_PUBLIC_PROJECT_ID` が `transport-search` になっているか

2. **Secret Managerの確認**
   - `redirect_uris` に `https://transport-search.vercel.app/auth/callback` が含まれているか

3. **Cloud Runのキャッシュ**
   - Secret Managerを更新した場合、Cloud Runの新しいリビジョンをデプロイする必要がある
   ```bash
   gcloud run services update unified-auth-server \
     --region=asia-northeast1 \
     --project=interview-api-472500 \
     --update-env-vars="CACHE_BUST=$(date +%s)"
   ```

### 4.2 NAVITIME APIエラーが発生する場合

1. **RAPIDAPI_KEYの確認**
   - Vercelの環境変数に `RAPIDAPI_KEY` が設定されているか
   - キーが有効か（RapidAPIダッシュボードで確認）

---

## 5. カスタムドメインを使用する場合

`transport-search.vercel.app` 以外のドメインを使用する場合は、以下の追加作業が必要です。

1. **Secret Managerの更新**
   - `redirect_uris` に新しいドメインのコールバックURLを追加
   ```
   https://your-custom-domain.com/auth/callback
   ```

2. **Cloud Runのリビジョン更新**
   - Secret Managerの変更を反映するため、Cloud Runを更新

---

## 6. 関連リソース

- **GitHubリポジトリ**: https://github.com/h-hamada-seifu/transport-search
- **Vercelプロジェクト**: https://transport-search.vercel.app
- **認証サーバー**: https://unified-auth-server-856773980753.asia-northeast1.run.app
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=interview-api-472500

---

## 更新履歴

- 2024-12-19: 初版作成
