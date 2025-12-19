# 認証設定ガイド

## 概要

「進路ナビ」アプリケーションは、unified-auth-server を使用してGoogle OAuth認証を実装しています。
`staff-i-safe.jp` グループに所属しているユーザーのみがアクセス可能です。

---

## 1. 認証サーバー側の設定

### 1.1 プロジェクト設定

unified-auth-server の `/Volumes/990PRO_SSD/dev/unified-auth-server/app/config.py` に以下の設定を追加済み:

```python
"transport-search": {
    "name": "進路ナビ",
    "type": "web_app",
    "description": "進路指導訪問 所要時間検索アプリケーション",
    "allowed_domains": ["i-seifu.jp"],
    "student_allowed": False,
    "admin_emails": [],
    # staff@i-seifu.jp グループに所属していればログイン可能
    "required_groups": [],
    "allowed_groups": ["staff@i-seifu.jp"],
    "required_org_units": [],
    "allowed_org_units": [],
    "redirect_uris": [
        "http://localhost:3000/auth/callback",
        "https://transport-search.vercel.app/auth/callback"
    ],
    "token_delivery": "cookie",
    "token_expiry_days": 7,
    "api_proxy_enabled": False
}
```

### 1.2 グループ制限の詳細

- **allowed_groups**: `["staff@i-seifu.jp"]`
  - このグループに所属しているユーザーのみがログイン可能
  - Google Workspace Admin SDK を使用してグループメンバーシップを検証

- **allowed_domains**: `["i-seifu.jp"]`
  - i-seifu.jp ドメインのユーザーのみがログイン可能

- **student_allowed**: `False`
  - 学生アカウントは許可しない

### 1.3 トークン配信方法

- **token_delivery**: `"cookie"`
  - セッションIDをHTTP-Only Cookieで配信
  - XSS攻撃からの保護

- **token_expiry_days**: `7`
  - セッションの有効期限は7日間

---

## 2. アプリケーション側の設定

### 2.1 環境変数 (.env.local)

```env
# 認証サーバー設定
# unified-auth-server のURL（サーバーサイド用）
AUTH_SERVER_URL=http://localhost:8000

# unified-auth-server のURL（クライアントサイド用）
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=進路ナビ
NEXT_PUBLIC_PROJECT_ID=transport-search
```

### 2.2 Vercel環境変数（本番環境）

Vercelダッシュボードで以下の環境変数を設定:

| 変数名 | 値（例） | 説明 |
|--------|---------|------|
| `RAPIDAPI_KEY` | `d6fe2c3da...` | NAVITIME API キー |
| `AUTH_SERVER_URL` | `https://your-auth-server.run.app` | 認証サーバーURL（本番） |
| `NEXT_PUBLIC_AUTH_SERVER_URL` | `https://your-auth-server.run.app` | 認証サーバーURL（クライアント用） |
| `NEXT_PUBLIC_APP_NAME` | `進路ナビ` | アプリケーション名 |
| `NEXT_PUBLIC_PROJECT_ID` | `transport-search` | プロジェクトID |

---

## 3. 認証フロー

### 3.1 ログインフロー

1. **未認証ユーザーがアクセス**
   - middleware.ts がリクエストをインターセプト
   - セッションクッキーが存在しない → 認証サーバーのログインページにリダイレクト
   - リダイレクト先: `{AUTH_SERVER_URL}/login/{PROJECT_ID}?redirect={元のURL}`

2. **Google認証**
   - ユーザーがGoogleアカウントでログイン
   - 認証サーバーがGoogle Workspace Admin SDKを使用してグループメンバーシップを検証
   - `staff@i-seifu.jp` グループに所属していない場合 → エラー

3. **コールバック**
   - 認証成功後、`/auth/callback?session={SESSION_ID}&redirect={元のURL}` にリダイレクト
   - コールバックAPIがセッションを検証し、HTTP-Only Cookieを設定
   - 元のURLにリダイレクト

4. **認証完了**
   - middleware.ts がセッションクッキーを確認
   - `/api/verify` エンドポイントでセッションの有効性を検証
   - 認証済み → リクエストを許可

### 3.2 ログアウトフロー

1. **ログアウトボタンをクリック**
   - `/api/auth/logout` にPOSTリクエスト

2. **セッション削除**
   - 認証サーバーの `/api/logout` を呼び出し
   - セッションクッキーを削除

3. **ログインページにリダイレクト**
   - middleware.ts がセッションクッキーがないことを検出
   - ログインページにリダイレクト

---

## 4. セキュリティ対策

### 4.1 クッキー設定

```typescript
response.cookies.set('session', sessionId, {
  httpOnly: true,          // JavaScriptからアクセス不可（XSS対策）
  secure: NODE_ENV === 'production', // HTTPS経由のみ（本番環境）
  sameSite: 'lax',         // CSRF対策
  maxAge: 60 * 60 * 24 * 7, // 7日間
  path: '/',
});
```

### 4.2 ミドルウェアによる保護

- **公開パス**: `/auth/callback`, `/auth/error`, `/api/auth/logout`, `/_next`, `/favicon.ico`
- **保護パス**: 上記以外のすべてのパス

### 4.3 セッション検証

- すべてのリクエストで `/api/verify` エンドポイントに問い合わせ
- セッションが無効な場合は自動的にログインページにリダイレクト

---

## 5. 開発環境での動作確認

### 5.1 認証サーバーの起動

```bash
cd /Volumes/990PRO_SSD/dev/unified-auth-server
python run_dev.py
```

- デフォルトポート: `8000`

### 5.2 アプリケーションの起動

```bash
cd /Volumes/990PRO_SSD/dev/transport-search
npm run dev
```

- デフォルトポート: `3000`

### 5.3 動作確認手順

1. ブラウザで `http://localhost:3000` にアクセス
2. 自動的に `http://localhost:8000/login/transport-search` にリダイレクトされる
3. 「Googleでログイン」をクリック
4. `staff@i-seifu.jp` グループに所属しているアカウントでログイン
5. 認証成功後、`http://localhost:3000` にリダイレクトされる
6. アプリケーションが正常に表示される

---

## 6. トラブルシューティング

### 6.1 「認証エラー」が表示される

**原因**: グループメンバーシップの検証失敗

**確認事項**:
1. ログインしたアカウントが `staff@i-seifu.jp` グループに所属しているか
2. Google Workspace Admin SDKの設定が正しいか
3. サービスアカウントに適切な権限があるか

### 6.2 「サーバー設定エラー」が表示される

**原因**: 環境変数が設定されていない

**確認事項**:
1. `.env.local` ファイルが存在するか
2. `AUTH_SERVER_URL` が正しく設定されているか
3. `NEXT_PUBLIC_PROJECT_ID` が `transport-search` に設定されているか

### 6.3 ログインページにリダイレクトされ続ける

**原因**: セッションクッキーが正しく設定されていない

**確認事項**:
1. ブラウザのCookieが有効になっているか
2. コールバックURLが正しく設定されているか (`/auth/callback`)
3. 認証サーバーとアプリケーションが同じドメインまたは適切なCORS設定がされているか

### 6.4 「403 Forbidden」エラー

**原因**: ドメイン制限

**確認事項**:
1. ログインしたアカウントのドメインが `i-seifu.jp` であるか
2. `allowed_domains` の設定が正しいか

---

## 7. 本番環境へのデプロイ

### 7.1 認証サーバーのデプロイ

1. Cloud Runにデプロイ
2. Secret Managerにプロジェクト設定を保存:
   - Secret名: `project-config-transport-search`
   - 内容: 上記のプロジェクト設定JSON

### 7.2 Vercelへのデプロイ

1. Vercelダッシュボードで環境変数を設定
2. `redirect_uris` を本番URLに更新:
   ```
   https://transport-search.vercel.app/auth/callback
   ```
3. デプロイ実行

---

## 8. 参考資料

- [unified-auth-server 統合ガイド](../../unified-auth-server/INTEGRATION_GUIDE.md)
- [Google Workspace Admin SDK](https://developers.google.com/admin-sdk)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
