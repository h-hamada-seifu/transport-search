import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8000';
const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || 'transport-search';

/**
 * ログアウトAPI
 *
 * unified-auth-server のログアウトエンドポイントを呼び出し、
 * セッションクッキーを削除してログインページにリダイレクトします。
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // レスポンスを作成
  const response = NextResponse.json(
    { success: true, message: 'ログアウトしました' },
    { status: 200 }
  );

  // プロジェクト固有のCookieと従来のCookieを削除（互換性のため）
  const cookieName = `session_${PROJECT_ID}`;
  response.cookies.delete(cookieName);
  response.cookies.delete('session');
  response.cookies.delete('auth_token');

  return response;
}
