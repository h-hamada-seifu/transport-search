# 新規プロジェクト追加テンプレート（unified-auth-server統合）

## 概要

このドキュメントは、unified-auth-server を使用した新規プロジェクトを追加する際の手順とチェックリストをまとめたものです。

---

## 前提条件

- unified-auth-server が稼働していること
- Google Cloud プロジェクトへのアクセス権限があること
- プロジェクトのフレームワーク・言語を決定していること

---

## ステップ1: プロジェクトIDの決定

### プロジェクトIDの命名規則

- 小文字英数字とハイフンのみ使用
- 他のプロジェクトと重複しないこと
- 分かりやすい名前にすること

**例**:
- `transport-search` （進路ナビ）
- `slide-video` （スライド動画生成システム）
- `new-project` （新規プロジェクト）

**決定したプロジェクトID**: `_________________`

---

## ステップ2: Secret Manager にプロジェクト設定を追加

### 2.1 設定JSONの作成

```json
{
  "name": "プロジェクト表示名",
  "type": "web_app",
  "description": "プロジェクトの説明",
  "allowed_domains": ["i-seifu.jp"],
  "student_allowed": false,
  "admin_emails": [],
  "required_groups": [],
  "allowed_groups": ["staff@i-seifu.jp"],
  "required_org_units": [],
  "allowed_org_units": [],
  "redirect_uris": [
    "https://your-project.vercel.app/auth/callback",
    "http://localhost:3000/auth/callback"
  ],
  "token_delivery": "query_param",
  "token_expiry_days": 7,
  "api_proxy_enabled": false
}
```

### 2.2 Secret Manager への登録

```bash
# プロジェクトIDを環境変数に設定
export PROJECT_ID="new-project"  # ← 実際のプロジェクトIDに置き換える
export GCP_PROJECT_ID="interview-api-472500"

# Secret Managerに登録
gcloud secrets create project-config-${PROJECT_ID} \
  --project=${GCP_PROJECT_ID} \
  --replication-policy="automatic" \
  --data-file=project-config.json

# または、標準入力から直接登録
echo '{
  "name": "プロジェクト表示名",
  ...
}' | gcloud secrets create project-config-${PROJECT_ID} \
  --project=${GCP_PROJECT_ID} \
  --replication-policy="automatic" \
  --data-file=-
```

### 2.3 認証サーバーのキャッシュをクリア

```bash
gcloud run services update unified-auth-server \
  --region=asia-northeast1 \
  --project=${GCP_PROJECT_ID} \
  --update-env-vars="CACHE_BUST=$(date +%s)"
```

---

## ステップ3: プロジェクト側の実装

### 3.1 環境変数の設定

**.env.local** （ローカル開発用）:
```env
# 認証サーバー設定
AUTH_SERVER_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:8000

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=プロジェクト表示名
NEXT_PUBLIC_PROJECT_ID=new-project  # ← 実際のプロジェクトIDに置き換える
```

**Vercel環境変数** （本番環境用）:
| 変数名 | 値 |
|--------|-----|
| `AUTH_SERVER_URL` | `https://unified-auth-server-856773980753.asia-northeast1.run.app` |
| `NEXT_PUBLIC_AUTH_SERVER_URL` | `https://unified-auth-server-856773980753.asia-northeast1.run.app` |
| `NEXT_PUBLIC_APP_NAME` | `プロジェクト表示名` |
| `NEXT_PUBLIC_PROJECT_ID` | `new-project` |

### 3.2 認証コールバック処理の実装

**ファイル例**: `app/auth/callback/route.ts` （Next.js App Router）

```typescript
import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'new-project';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect');

  if (!token) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  // トークンの検証
  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/api/verify`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!verifyResponse.ok) {
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  // リダイレクト先の決定
  const redirectUrl = redirect ? new URL(redirect) : new URL('/', request.url);

  // プロジェクト固有のCookie名でセッションを保存
  const response = NextResponse.redirect(redirectUrl);
  const cookieName = `session_${PROJECT_ID}`;
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7日間
    path: '/',
  });

  return response;
}
```

### 3.3 認証チェック処理（ミドルウェア）の実装

**ファイル例**: `middleware.ts` （Next.js）

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'new-project';

const PUBLIC_PATHS = ['/auth/callback', '/auth/error', '/_next', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // プロジェクト固有のCookie名でセッションを取得
  const cookieName = `session_${PROJECT_ID}`;
  const sessionCookie = request.cookies.get(cookieName)
    || request.cookies.get('session')     // 後方互換性
    || request.cookies.get('auth_token'); // 後方互換性

  if (!sessionCookie) {
    // 未認証: ログインページにリダイレクト
    const loginUrl = new URL(`/login/${PROJECT_ID}`, AUTH_SERVER_URL);
    loginUrl.searchParams.set('redirect', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // トークンの有効性を検証
  const verifyResponse = await fetch(`${AUTH_SERVER_URL}/api/verify`, {
    headers: { 'Authorization': `Bearer ${sessionCookie.value}` },
  });

  if (!verifyResponse.ok) {
    // トークン無効: ログインページにリダイレクト
    const loginUrl = new URL(`/login/${PROJECT_ID}`, AUTH_SERVER_URL);
    loginUrl.searchParams.set('redirect', request.url);

    const response = NextResponse.redirect(loginUrl);
    // 無効なトークンを削除
    response.cookies.delete(cookieName);
    response.cookies.delete('session');
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.next();
}
```

### 3.4 ログアウト処理の実装

**ファイル例**: `app/api/auth/logout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'new-project';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'ログアウトしました' },
    { status: 200 }
  );

  // プロジェクト固有のCookieと従来のCookieを削除
  const cookieName = `session_${PROJECT_ID}`;
  response.cookies.delete(cookieName);
  response.cookies.delete('session');
  response.cookies.delete('auth_token');

  return response;
}
```

---

## ステップ4: Google OAuth リダイレクトURIの登録

### 4.1 Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト: `interview-api-472500` を選択
3. 「APIとサービス」→「認証情報」に移動
4. OAuth 2.0 クライアントID: `856773980753-adcsp4cj746gip75r2juhlo0qpn9atm2` を選択
5. 「承認済みのリダイレクトURI」に以下を追加：
   ```
   https://unified-auth-server-856773980753.asia-northeast1.run.app/callback/new-project
   ```

---

## ステップ5: テスト

### 5.1 ローカル環境でのテスト

1. 認証サーバーを起動
   ```bash
   cd /Volumes/990PRO_SSD/dev/unified-auth-server
   python run_dev.py
   ```

2. プロジェクトを起動
   ```bash
   cd /path/to/new-project
   npm run dev  # または相当するコマンド
   ```

3. ブラウザでアクセス
   - `http://localhost:3000` にアクセス
   - 認証サーバーのログインページにリダイレクトされることを確認
   - Googleでログイン
   - プロジェクトにリダイレクトされることを確認

4. Cookieの確認
   - DevTools (F12) → Application → Cookies
   - Cookie名が `session_new-project` になっているか確認

### 5.2 本番環境でのテスト

1. Vercelにデプロイ
2. 環境変数を設定
3. `https://your-project.vercel.app` にアクセス
4. 認証フローが正常に動作することを確認

### 5.3 複数プロジェクトでの並行テスト

1. 同じブラウザで他のプロジェクト（transport-search等）にもログイン
2. 両方のプロジェクトが正常に動作することを確認
3. Cookie混同が発生しないことを確認

---

## チェックリスト

### Secret Manager設定
- [ ] プロジェクトIDを決定
- [ ] Secret Managerにプロジェクト設定を追加
- [ ] 認証サーバーのキャッシュをクリア

### Google OAuth設定
- [ ] リダイレクトURIをGoogle Cloud Consoleに追加

### プロジェクト側実装
- [ ] 環境変数 `NEXT_PUBLIC_PROJECT_ID` を設定
- [ ] プロジェクト固有のCookie名（`session_{PROJECT_ID}`）を実装
- [ ] 認証コールバック処理を実装
- [ ] 認証チェック処理（ミドルウェア）を実装
- [ ] ログアウト処理を実装

### テスト
- [ ] ローカル環境でログインできることを確認
- [ ] Cookie名が `session_{PROJECT_ID}` であることを確認
- [ ] ログアウトできることを確認
- [ ] 本番環境でログインできることを確認
- [ ] 他のプロジェクトと並行してテストして問題ないことを確認

---

## トラブルシューティング

### プロジェクトが見つからない

**エラー**: "Project configuration not found"

**原因**: Secret Managerにプロジェクト設定が登録されていない

**解決策**:
1. Secret Managerに `project-config-{PROJECT_ID}` が存在するか確認
2. 認証サーバーのキャッシュをクリア

### リダイレクトURIエラー

**エラー**: "redirect_uri_mismatch"

**原因**: Google Cloud ConsoleにリダイレクトURIが登録されていない

**解決策**:
1. Google Cloud Consoleで承認済みリダイレクトURIを確認
2. `https://unified-auth-server-856773980753.asia-northeast1.run.app/callback/{PROJECT_ID}` を追加

### 別のプロジェクトにリダイレクトされる

**原因**: 環境変数 `NEXT_PUBLIC_PROJECT_ID` が間違っている、またはCookie混同

**解決策**:
1. 環境変数 `NEXT_PUBLIC_PROJECT_ID` を確認
2. プロジェクト固有のCookie名を実装しているか確認
3. ブラウザのCookieをクリア

---

## 参考実装

- **transport-search**: https://github.com/h-hamada-seifu/transport-search
  - 認証統合の実装例として参照可能
  - Cookie混同防止の実装を含む

---

## 更新履歴

- 2024-12-23: 初版作成
