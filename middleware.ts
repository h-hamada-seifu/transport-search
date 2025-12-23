import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'transport-search';

/**
 * 認証が不要なパス
 */
const PUBLIC_PATHS = [
  '/auth/callback',
  '/auth/error',
  '/api/auth/logout',
  '/_next',
  '/favicon.ico',
];

/**
 * ミドルウェア: 認証チェック
 *
 * 認証が必要なページへのアクセス時に、セッションクッキーの有効性を確認します。
 * 未認証の場合は、unified-auth-server のログインページにリダイレクトします。
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // セッションクッキーを取得
  // プロジェクト固有のCookie名を優先し、後方互換性のため従来のCookie名もチェック
  const cookieName = `session_${PROJECT_ID}`;
  const sessionCookie = request.cookies.get(cookieName) || request.cookies.get('session') || request.cookies.get('auth_token');

  if (!sessionCookie) {
    // 未認証: ログインページにリダイレクト
    const loginUrl = new URL(`/login/${PROJECT_ID}`, AUTH_SERVER_URL);
    loginUrl.searchParams.set('redirect', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // トークンの有効性を検証
  try {
    const verifyResponse = await fetch(`${AUTH_SERVER_URL}/api/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionCookie.value}`,
      },
      credentials: 'include',
    });

    if (!verifyResponse.ok) {
      // トークン無効: ログインページにリダイレクト
      const loginUrl = new URL(`/login/${PROJECT_ID}`, AUTH_SERVER_URL);
      loginUrl.searchParams.set('redirect', request.url);

      const response = NextResponse.redirect(loginUrl);
      // 無効なトークンを削除（プロジェクト固有のCookieと従来のCookieの両方）
      response.cookies.delete(cookieName);
      response.cookies.delete('session');
      response.cookies.delete('auth_token');
      return response;
    }

    // 認証成功: リクエストを継続
    return NextResponse.next();
  } catch (error) {
    console.error('認証検証エラー:', error);

    // エラー時はログインページにリダイレクト
    const loginUrl = new URL(`/login/${PROJECT_ID}`, AUTH_SERVER_URL);
    loginUrl.searchParams.set('redirect', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * ミドルウェアを適用するパスの設定
 */
export const config = {
  matcher: [
    /*
     * 以下を除く全てのパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
