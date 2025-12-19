'use client';

import { useState } from 'react';
import { StationInput } from '@/components/StationInput';
import { SchoolInput } from '@/components/SchoolInput';
import { ResultCard } from '@/components/ResultCard';
import { getErrorMessage } from '@/lib/utils';
import type { Station, School, RouteResult } from '@/types';

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ルート検索実行
  const handleSearch = async () => {
    if (!selectedStation || !selectedSchool) {
      setError('出発駅と訪問先学校を選択してください');
      return;
    }

    setIsSearching(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch(
        `/api/route?start=${encodeURIComponent(selectedStation.id)}&goalLat=${selectedSchool.coord.lat}&goalLon=${selectedSchool.coord.lon}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ルートの検索に失敗しました');
      }

      const data: RouteResult = await response.json();
      setRouteResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  // 検索ボタンが有効かどうか
  const isSearchDisabled = !selectedStation || !selectedSchool || isSearching;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🚃 進路指導訪問 所要時間検索
          </h1>
          <p className="text-gray-600">
            出発駅から訪問先学校までの所要時間・距離を検索します
          </p>
        </header>

        {/* メインコンテンツ */}
        <main className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* 駅入力 */}
          <div className="mb-6">
            <StationInput
              onSelect={setSelectedStation}
              placeholder="例: 安倍野"
            />
          </div>

          {/* 学校入力 */}
          <div className="mb-6">
            <SchoolInput
              onSelect={setSelectedSchool}
              placeholder="例: 清風高校"
            />
          </div>

          {/* 検索ボタン */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSearch}
              disabled={isSearchDisabled}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                isSearchDisabled
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSearching ? '検索中...' : '検索する'}
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 検索結果 */}
          {routeResult && selectedStation && selectedSchool && (
            <ResultCard
              station={selectedStation}
              school={selectedSchool}
              result={routeResult}
            />
          )}
        </main>

        {/* フッター */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by NAVITIME API</p>
        </footer>
      </div>
    </div>
  );
}
