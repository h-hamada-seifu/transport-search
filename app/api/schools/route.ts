import { NextRequest, NextResponse } from 'next/server';
import type { NavitimeSpotResponse, School, ErrorResponse } from '@/types';
import { API_TIMEOUT, MIN_SEARCH_LENGTH, MAX_SEARCH_LENGTH } from '@/lib/constants';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

/**
 * 学校検索API
 * NAVITIME Spot APIを使用して学校名のオートコンプリートを提供
 */
export async function GET(request: NextRequest): Promise<NextResponse<{ items: School[] } | ErrorResponse>> {
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
    // NAVITIME Spot API呼び出し
    const response = await fetch(
      `https://navitime-spot.p.rapidapi.com/spot?word=${encodeURIComponent(word)}&limit=10&datum=wgs84&coord_unit=degree`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'navitime-spot.p.rapidapi.com',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        console.error('API制限に達しました');
        return NextResponse.json(
          { error: 'API制限に達しました。しばらく待ってから再試行してください' },
          { status: 429 }
        );
      }
      throw new Error(`NAVITIME API error: ${response.status}`);
    }

    const data: NavitimeSpotResponse = await response.json();

    // レスポンス変換
    const schools: School[] = (data.items || []).map((item) => ({
      code: item.code,
      name: item.name,
      address: item.address_name,
      coord: {
        lat: item.coord.lat,
        lon: item.coord.lon,
      },
      phone: item.phone,
      categories: item.categories,
    }));

    return NextResponse.json({ items: schools });
  } catch (error) {
    clearTimeout(timeoutId);

    // タイムアウトエラー
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('学校検索APIタイムアウト');
      return NextResponse.json(
        { error: 'リクエストがタイムアウトしました。もう一度お試しください' },
        { status: 504 }
      );
    }

    console.error('学校検索APIエラー:', error);
    return NextResponse.json(
      { error: '学校の検索に失敗しました' },
      { status: 500 }
    );
  }
}
