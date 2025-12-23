import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'transport-search';

/**
 * 認証コールバックAPI
 *
 * unified-auth-server からのリダイレクト後に呼び出されます。
 * セッションクッキーを設定し、元のページにリダイレクトします。
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get('redirect');
  const error = searchParams.get('error');

  // エラーがある場合はエラーページにリダイレクト
  if (error) {
    console.error('認証エラー:', error);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('message', error);
    return NextResponse.redirect(errorUrl);
  }

  // クエリパラメータまたはクッキーからトークンを取得
  // 認証サーバーがtoken_delivery='query_param'の場合はクエリパラメータ
  // token_delivery='cookie'の場合はクッキー（ただしクロスドメインでは動作しない）
  const tokenFromQuery = searchParams.get('token');
  const tokenFromCookie = request.cookies.get('auth_token');

  const token = tokenFromQuery || tokenFromCookie?.value;

  if (!token) {
    console.error('認証トークンが見つかりません');
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('message', '認証トークンが見つかりません');
    return NextResponse.redirect(errorUrl);
  }

  // トークンの有効性を検証
  try {
    const verifyResponse = await fetch(`${AUTH_SERVER_URL}/api/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!verifyResponse.ok) {
      console.error('トークン検証失敗:', verifyResponse.status);
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('message', 'トークン検証に失敗しました');
      return NextResponse.redirect(errorUrl);
    }

    // リダイレクト先URLの決定
    let redirectUrl: URL;
    if (redirect) {
      try {
        redirectUrl = new URL(redirect);
      } catch {
        // 不正なURLの場合はホームページにリダイレクト
        redirectUrl = new URL('/', request.url);
      }
    } else {
      // リダイレクト先が指定されていない場合はホームページ
      redirectUrl = new URL('/', request.url);
    }

    // レスポンスを作成し、セッションクッキーを設定
    // プロジェクト固有のCookie名を使用して、複数プロジェクトでのCookie混同を防ぐ
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
  } catch (error) {
    console.error('認証コールバック処理エラー:', error);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('message', '認証処理中にエラーが発生しました');
    return NextResponse.redirect(errorUrl);
  }
}
