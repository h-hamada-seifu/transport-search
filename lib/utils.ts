/**
 * デバウンス関数
 * API呼び出しを最適化するため、入力後一定時間待機してから実行する
 *
 * @param func - 実行する関数
 * @param wait - 待機時間（ミリ秒）
 * @returns デバウンスされた関数
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T;
}

/**
 * 距離をメートルからキロメートルに変換
 *
 * @param meters - メートル単位の距離
 * @returns キロメートル単位の距離（小数点1桁）
 */
export function metersToKilometers(meters: number): string {
  return (meters / 1000).toFixed(1);
}

/**
 * エラーメッセージを取得
 *
 * @param error - エラーオブジェクト
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '予期しないエラーが発生しました';
}
