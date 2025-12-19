'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';
import { DEBOUNCE_DELAY, MIN_SEARCH_LENGTH } from '@/lib/constants';
import type { Station } from '@/types';

interface StationInputProps {
  onSelect: (station: Station) => void;
  placeholder?: string;
}

export function StationInput({ onSelect, placeholder = '駅名を入力' }: StationInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // デバウンスされた検索関数
  const searchStations = useCallback(
    debounce(async (word: string) => {
      if (word.length < MIN_SEARCH_LENGTH) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stations?word=${encodeURIComponent(word)}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '駅の検索に失敗しました');
        }

        const data = await response.json();
        setSuggestions(data.items || []);
        setShowSuggestions(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '駅の検索に失敗しました');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY),
    []
  );

  // 入力変更時の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedStation(null);

    if (value.length >= MIN_SEARCH_LENGTH) {
      searchStations(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 候補選択時の処理
  const handleSelect = (station: Station) => {
    setSelectedStation(station);
    setQuery(station.name);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(station);
  };

  // クリア処理
  const handleClear = () => {
    setQuery('');
    setSelectedStation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    inputRef.current?.focus();
  };

  // 外部クリックで候補を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        出発駅
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="クリア"
          >
            ×
          </button>
        )}
      </div>

      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg text-center text-gray-500">
          検索中...
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-lg shadow-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && !isLoading && !error && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
          {suggestions.map((station) => (
            <li
              key={station.id}
              onClick={() => handleSelect(station)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium">{station.name}</div>
              {station.addressName && (
                <div className="text-sm text-gray-500">{station.addressName}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && !error && query.length >= MIN_SEARCH_LENGTH && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg text-center text-gray-500">
          該当する駅が見つかりませんでした
        </div>
      )}
    </div>
  );
}
