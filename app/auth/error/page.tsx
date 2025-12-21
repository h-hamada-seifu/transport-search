'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * 認証エラーページのコンテンツ
 */
function ErrorPageContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '認証中にエラーが発生しました';

  const handleRetry = () => {
    // ホームページにリダイレクト（ミドルウェアが自動的にログインページに転送）
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* エラーアイコン */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* エラーメッセージ */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">認証エラー</h1>
          <p className="text-gray-600 mb-8">{message}</p>

          {/* 再試行ボタン */}
          <button
            onClick={handleRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            再試行
          </button>

          {/* サポート情報 */}
          <p className="mt-6 text-sm text-gray-500">
            問題が解決しない場合は、管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 認証エラーページ
 *
 * 認証処理中にエラーが発生した場合に表示されます。
 */
export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      }
    >
      <ErrorPageContent />
    </Suspense>
  );
}
