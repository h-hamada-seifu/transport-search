'use client';

import { useState } from 'react';
import type { School } from '@/types';

interface SchoolInputProps {
  onSelect: (school: School) => void;
  placeholder?: string;
}

// 事前定義された目的地リスト
const DESTINATIONS: School[] = [
  {
    code: 'tennoji-station',
    name: '天王寺駅',
    address: '大阪府大阪市天王寺区悲田院町',
    coord: {
      lat: 34.647828,
      lon: 135.513256,
    },
  },
  {
    code: 'abeno-station',
    name: '阿倍野駅',
    address: '大阪府大阪市阿倍野区阿倍野筋一丁目',
    coord: {
      lat: 34.6372,
      lon: 135.5142,
    },
  },
  {
    code: 'showacho-station',
    name: '昭和町駅',
    address: '大阪府大阪市阿倍野区昭和町一丁目',
    coord: {
      lat: 34.633506,
      lon: 135.516949,
    },
  },
  {
    code: 'seifu-college',
    name: '清風情報工科学院',
    address: '大阪府大阪市阿倍野区丸山通1丁目6-3',
    coord: {
      lat: 34.636468,
      lon: 135.509725,
    },
  },
];

export function SchoolInput({ onSelect }: SchoolInputProps) {
  const [selectedValue, setSelectedValue] = useState('');

  // 選択変更時の処理
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);

    if (value) {
      const destination = DESTINATIONS.find((d) => d.code === value);
      if (destination) {
        onSelect(destination);
      }
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="destination-select" className="block text-sm font-medium text-gray-700 mb-2">
        訪問先
      </label>
      <select
        id="destination-select"
        value={selectedValue}
        onChange={handleChange}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="">訪問先を選択してください</option>
        {DESTINATIONS.map((destination) => (
          <option key={destination.code} value={destination.code}>
            {destination.name}
          </option>
        ))}
      </select>
      {selectedValue && (
        <div className="mt-2 text-sm text-gray-600">
          {DESTINATIONS.find((d) => d.code === selectedValue)?.address}
        </div>
      )}
    </div>
  );
}
