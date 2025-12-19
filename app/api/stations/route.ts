import { NextRequest, NextResponse } from 'next/server';
import type { NavitimeTransportResponse, Station, ErrorResponse } from '@/types';
import { API_TIMEOUT, MIN_SEARCH_LENGTH, MAX_SEARCH_LENGTH } from '@/lib/constants';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

/**
 * 駅検索API
 * NAVITIME Transport APIを使用して駅名のオートコンプリートを提供
 */
export async function GET(request: NextRequest): Promise<NextResponse<{ items: Station[] } | ErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  // バリデーション
  if (!word || word.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json(
      { error: `検索ワードは${MIN_SEARCH_LENGTH}文字以上必要です` },
      { status: 400 }
    );
  }

  if (word.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json(
      { error: `検索ワードは${MAX_SEARCH_LENGTH}文字以下にしてください` },
      { status: 400 }
    );
  }

  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY が設定されていません');
    return NextResponse.json(
      { error: 'サーバー設定エラー' },
      { status: 500 }
    );
  }

  // タイムアウト制御用のAbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // NAVITIME Transport API呼び出し
    const response = await fetch(
      `https://navitime-transport.p.rapidapi.com/transport_node/autocomplete?word=${encodeURIComponent(word)}&word_match=prefix&datum=wgs84&coord_unit=degree`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'navitime-transport.p.rapidapi.com',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // エラーレスポンスの詳細をログ出力
      const errorText = await response.text();
      console.error(`NAVITIME API error: ${response.status}`, errorText);

      if (response.status === 429) {
        console.error('API制限に達しました');
        return NextResponse.json(
          { error: 'API制限に達しました。しばらく待ってから再試行してください' },
          { status: 429 }
        );
      }

      if (response.status === 403) {
        console.error('API認証エラー: サブスクリプションまたはAPIキーが無効です');
        return NextResponse.json(
          { error: 'API認証エラー。APIキーとサブスクリプションを確認してください' },
          { status: 403 }
        );
      }

      throw new Error(`NAVITIME API error: ${response.status}`);
    }

    const data: NavitimeTransportResponse = await response.json();

    // レスポンス変換
    const stations: Station[] = (data.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      ruby: item.ruby,
      coord: {
        lat: item.coord.lat,
        lon: item.coord.lon,
      },
      addressName: item.address_name,
    }));

    return NextResponse.json({ items: stations });
  } catch (error) {
    clearTimeout(timeoutId);

    // タイムアウトエラー
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('駅検索APIタイムアウト');
      return NextResponse.json(
        { error: 'リクエストがタイムアウトしました。もう一度お試しください' },
        { status: 504 }
      );
    }

    console.error('駅検索APIエラー:', error);
    return NextResponse.json(
      { error: '駅の検索に失敗しました' },
      { status: 500 }
    );
  }
}
