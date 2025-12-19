// 駅情報の型定義
export interface Station {
  id: string;
  name: string;
  ruby?: string;
  coord: {
    lat: number;
    lon: number;
  };
  addressName?: string;
}

// 学校（スポット）情報の型定義
export interface School {
  code: string;
  name: string;
  address: string;
  coord: {
    lat: number;
    lon: number;
  };
  phone?: string;
  categories?: Array<{
    code: string;
    name: string;
    level: string;
  }>;
}

// ルート検索結果の型定義
export interface RouteResult {
  time: number;         // 所要時間（分）
  distance: number;     // 距離（メートル）
  transitCount: number; // 乗換回数
}

// NAVITIME Transport API のレスポンス型
export interface NavitimeTransportResponse {
  items: Array<{
    id: string;
    name: string;
    ruby?: string;
    types?: string[];
    address_name?: string;
    coord: {
      lat: number;
      lon: number;
    };
  }>;
}

// NAVITIME Spot API のレスポンス型
export interface NavitimeSpotResponse {
  count: {
    total: number;
    offset: number;
    limit: number;
  };
  items: Array<{
    code: string;
    name: string;
    phone?: string;
    address_name: string;
    coord: {
      lat: number;
      lon: number;
    };
    categories?: Array<{
      code: string;
      name: string;
      level: string;
    }>;
  }>;
}

// NAVITIME Route API のレスポンス型
export interface NavitimeRouteResponse {
  items: Array<{
    summary: {
      move: {
        time: number;
        distance: number;
        fare?: {
          unit_0: number;
        };
        transit_count: number;
      };
    };
    sections?: unknown[];
  }>;
  unit: {
    time: string;
    distance: string;
    currency?: string;
  };
}

// エラーレスポンスの型定義
export interface ErrorResponse {
  error: string;
}
