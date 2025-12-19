import { NextRequest, NextResponse } from 'next/server';
import type { NavitimeRouteResponse, RouteResult, ErrorResponse } from '@/types';
import { API_TIMEOUT } from '@/lib/constants';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

/**
 * ルート検索API
 * NAVITIME Route(totalnavi) APIを使用してルート情報を取得
 */
export async function GET(request: NextRequest): Promise<NextResponse<RouteResult | ErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const goalLat = searchParams.get('goalLat');
  const goalLon = searchParams.get('goalLon');

  // バリデーション
  if (!start) {
    return NextResponse.json(
      { error: '出発駅IDが必要です' },
      { status: 400 }
    );
  }

  if (!goalLat || !goalLon) {
    return NextResponse.json(
      { error: '目的地の緯度経度が必要です' },
      { status: 400 }
    );
  }

  const lat = parseFloat(goalLat);
  const lon = parseFloat(goalLon);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: '緯度経度の形式が不正です' },
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
    // 現在時刻を取得（ISO 8601形式）
    const startTime = new Date().toISOString().slice(0, 19);

    // NAVITIME Route API呼び出し
    const response = await fetch(
      `https://navitime-route-totalnavi.p.rapidapi.com/route_transit?start=${encodeURIComponent(start)}&goal=${lat},${lon}&start_time=${startTime}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'navitime-route-totalnavi.p.rapidapi.com',
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

    const data: NavitimeRouteResponse = await response.json();

    // レスポンスから必要な情報を抽出
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'ルートが見つかりませんでした' },
        { status: 404 }
      );
    }

    const summary = data.items[0]?.summary?.move;

    if (!summary) {
      return NextResponse.json(
        { error: 'ルート情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    const result: RouteResult = {
      time: summary.time || 0,
      distance: summary.distance || 0,
      transitCount: summary.transit_count || 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    clearTimeout(timeoutId);

    // タイムアウトエラー
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('ルート検索APIタイムアウト');
      return NextResponse.json(
        { error: 'リクエストがタイムアウトしました。もう一度お試しください' },
        { status: 504 }
      );
    }

    console.error('ルート検索APIエラー:', error);
    return NextResponse.json(
      { error: 'ルートの検索に失敗しました' },
      { status: 500 }
    );
  }
}
