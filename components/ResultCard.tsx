'use client';

import { metersToKilometers } from '@/lib/utils';
import type { RouteResult, Station, School } from '@/types';

interface ResultCardProps {
  station: Station;
  school: School;
  result: RouteResult;
}

export function ResultCard({ station, school, result }: ResultCardProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">検索結果</h2>

      <div className="border-t-2 border-gray-200 mb-4"></div>

      <div className="mb-4">
        <p className="text-gray-700">
          <span className="inline-block mr-2">📍</span>
          <span className="font-medium">{station.name}</span>
          <span className="mx-2">→</span>
          <span className="font-medium">{school.name}</span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🕐</span>
            <div>
              <div className="text-sm text-gray-500">所要時間</div>
              <div className="text-xl font-semibold text-gray-900">
                約 {result.time} 分
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-2xl mr-3">📏</span>
            <div>
              <div className="text-sm text-gray-500">距離</div>
              <div className="text-xl font-semibold text-gray-900">
                {metersToKilometers(result.distance)} km
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-2xl mr-3">🔄</span>
            <div>
              <div className="text-sm text-gray-500">乗換回数</div>
              <div className="text-xl font-semibold text-gray-900">
                {result.transitCount} 回
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${station.coord.lat},${station.coord.lon}&destination=${school.coord.lat},${school.coord.lon}&travelmode=transit`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
        >
          Google Mapsで詳細を見る
          <span className="ml-1">→</span>
        </a>
      </div>
    </div>
  );
}
