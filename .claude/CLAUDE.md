# プロジェクト AI ガイド（進路指導訪問 所要時間検索アプリ）

> このファイルは、**進路指導訪問 所要時間検索アプリ専用の AI 向けルール集**です。
> 共通ルール（`~/.claude/CLAUDE.md`）に加えて、このプロジェクト固有の前提・例外・開発規約を定義します。

---

## 1. プロジェクト概要

- **プロジェクト名**: 進路指導訪問 所要時間検索アプリ（transport-search）
- **概要**:
  - 教員が進路指導で学校訪問する際の所要時間・距離を検索するWebアプリ
  - Next.js 14（App Router）ベースのフルスタックアプリケーション
  - NAVITIME RapidAPIを使用した駅検索・スポット検索・ルート検索
  - Vercelにデプロイ予定
- **想定ユーザー**:
  - 進路指導担当の教員
  - 学校訪問の所要時間を事前に把握したい職員

---

## 2. 技術スタック

### 2.1 フレームワーク・言語
- **Next.js**: 14（App Router）
- **TypeScript**: 5.x
- **React**: 18.x
- **Tailwind CSS**: 3.x

### 2.2 外部API
- **NAVITIME Transport API**: 駅検索（オートコンプリート）
- **NAVITIME Spot API**: スポット（学校）検索
- **NAVITIME Route(totalnavi) API**: ルート検索

### 2.3 デプロイ・インフラ
- **Vercel**: メインデプロイ環境
- **データベース**: なし（テスト版のため不使用）

> AI への指示例：
> 「このプロジェクトでは Next.js 14 の App Router と TypeScript を使用します。
> API Routesはサーバーサイドで実行し、外部APIキーがクライアントに漏れないようにしてください。」

---

## 3. ディレクトリ構成ルール

```text
transport-search/
├── app/
│   ├── page.tsx              # メインページ
│   ├── layout.tsx            # レイアウト
│   ├── globals.css           # グローバルスタイル
│   └── api/
│       ├── stations/
│       │   └── route.ts      # 駅検索API
│       ├── schools/
│       │   └── route.ts      # 学校検索API
│       └── route/
│           └── route.ts      # ルート検索API
├── components/
│   ├── StationInput.tsx      # 駅入力コンポーネント
│   ├── SchoolInput.tsx       # 学校入力コンポーネント
│   └── ResultCard.tsx        # 結果表示コンポーネント
├── lib/
│   └── navitime.ts           # NAVITIME API呼び出し関数
├── types/
│   └── index.ts              # 型定義
├── docs/                     # ドキュメント
│   └── school-visit-transit-app-design.md  # 設計書
├── .claude/                  # AI設定
│   └── CLAUDE.md             # このファイル
├── .env.local                # 環境変数（APIキー）- Git管理外
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### ディレクトリに関するルール

- `app/`: Next.js App Routerのルートディレクトリ
- `app/api/`: サーバーサイドAPI Routes（外部API呼び出しはここで行う）
- `components/`: 再利用可能なReactコンポーネント
- `lib/`: ユーティリティ関数・API呼び出し関数
- `types/`: TypeScript型定義

> AI への指示例：
> 「新しいコンポーネントを追加する場合は、components/以下に配置してください。
> API呼び出しロジックはlib/navitime.tsにまとめてください。」

---

## 4. コーディング規約（このプロジェクト専用）

### 4.1 TypeScript コーディングスタイル

```typescript
// ✅ 良い例：型定義を明確に
interface Station {
  id: string;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
}

interface School {
  code: string;
  name: string;
  address: string;
  coord: {
    lat: number;
    lon: number;
  };
}

interface RouteResult {
  time: number;        // 所要時間（分）
  distance: number;    // 距離（メートル）
  transitCount: number; // 乗換回数
}
```

### 4.2 React コンポーネント

```typescript
// ✅ 良い例：関数コンポーネント + TypeScript
'use client';

import { useState, useCallback } from 'react';

interface StationInputProps {
  onSelect: (station: Station) => void;
  placeholder?: string;
}

export function StationInput({ onSelect, placeholder = '駅名を入力' }: StationInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // デバウンス処理で API 呼び出しを最適化
  const handleSearch = useCallback(
    debounce(async (word: string) => {
      if (word.length < 2) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stations?word=${encodeURIComponent(word)}`);
        const data = await response.json();
        setSuggestions(data.items);
      } catch (error) {
        console.error('駅検索エラー:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  return (
    // ... JSX
  );
}
```

### 4.3 API Routes（Next.js App Router）

```typescript
// ✅ 良い例：app/api/stations/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word || word.length < 2) {
    return NextResponse.json(
      { error: '検索ワードは2文字以上必要です' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://navitime-transport.p.rapidapi.com/transport_node/autocomplete?word=${encodeURIComponent(word)}&word_match=prefix&datum=wgs84&coord_unit=degree`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'navitime-transport.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NAVITIME API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('駅検索APIエラー:', error);
    return NextResponse.json(
      { error: '駅の検索に失敗しました' },
      { status: 500 }
    );
  }
}
```

### 4.4 エラーハンドリングの統一

```typescript
// ✅ 良い例：エラーハンドリング
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    // HTTPエラー
    if (response.status === 429) {
      throw new Error('API制限に達しました。しばらく待ってから再試行してください。');
    }
    throw new Error(`APIエラー: ${response.status}`);
  }

  return await response.json();
} catch (error) {
  // ネットワークエラーなど
  console.error('API呼び出しエラー:', error);
  throw error;
}
```

---

## 5. NAVITIME RapidAPI 統合

### 5.1 APIサービス一覧

| サービス名 | ホスト | 用途 | 無料枠 |
|-----------|--------|------|--------|
| NAVITIME Transport | `navitime-transport.p.rapidapi.com` | 駅検索 | 500回/月 |
| NAVITIME Spot | `navitime-spot.p.rapidapi.com` | 学校検索 | 500回/月 |
| NAVITIME Route(totalnavi) | `navitime-route-totalnavi.p.rapidapi.com` | ルート検索 | 500回/月 |

### 5.2 API呼び出しパターン

```typescript
// lib/navitime.ts

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// 駅検索
export async function searchStations(word: string): Promise<Station[]> {
  const response = await fetch(
    `https://navitime-transport.p.rapidapi.com/transport_node/autocomplete?word=${encodeURIComponent(word)}&word_match=prefix&datum=wgs84&coord_unit=degree`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'navitime-transport.p.rapidapi.com',
      },
    }
  );
  const data = await response.json();
  return data.items || [];
}

// 学校検索
export async function searchSchools(word: string): Promise<School[]> {
  const response = await fetch(
    `https://navitime-spot.p.rapidapi.com/spot?word=${encodeURIComponent(word)}&limit=10&datum=wgs84&coord_unit=degree`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'navitime-spot.p.rapidapi.com',
      },
    }
  );
  const data = await response.json();
  return data.items || [];
}

// ルート検索
export async function searchRoute(
  startNodeId: string,
  goalLat: number,
  goalLon: number
): Promise<RouteResult> {
  const startTime = new Date().toISOString().slice(0, 19);
  const response = await fetch(
    `https://navitime-route-totalnavi.p.rapidapi.com/route_transit?start=${startNodeId}&goal=${goalLat},${goalLon}&start_time=${startTime}`,
    {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'navitime-route-totalnavi.p.rapidapi.com',
      },
    }
  );
  const data = await response.json();
  const summary = data.items?.[0]?.summary?.move;
  return {
    time: summary?.time || 0,
    distance: summary?.distance || 0,
    transitCount: summary?.transit_count || 0,
  };
}
```

### 5.3 API消費量の最適化

**必須の最適化**:
- **デバウンス処理**: オートコンプリートは300ms待機後に実行
- **最小文字数**: 2文字以上で検索開始
- **候補選択後は検索停止**: 選択完了後はAPI呼び出しを行わない

```typescript
// デバウンス実装例
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}
```

> AI への指示例：
> 「オートコンプリート機能を実装する際は、必ず300msのデバウンス処理を入れてください。
> API制限（各500回/月）を超えないよう、不要なリクエストは避けてください。」

---

## 6. 環境変数

### 6.1 必要な環境変数

```env
# .env.local
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 6.2 環境変数の使用ルール

- **クライアントサイドで直接使用しない**: `NEXT_PUBLIC_` プレフィックスは付けない
- **API Routesでのみ使用**: サーバーサイドでAPIキーを使用
- **Git管理外**: `.env.local` は `.gitignore` に含める

```typescript
// ✅ 良い例：サーバーサイドでのみ使用
// app/api/stations/route.ts
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// ❌ 悪い例：クライアントサイドで使用
// components/StationInput.tsx
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY; // 危険！
```

---

## 7. UI/UX 仕様

### 7.1 オートコンプリート動作

| 項目 | 仕様 |
|------|------|
| 最小入力文字数 | 2文字 |
| デバウンス時間 | 300ms |
| 最大候補数 | 10件 |
| 候補選択方法 | クリック |
| クリア機能 | ×ボタンで入力クリア |

### 7.2 検索結果表示

| 項目 | 仕様 |
|------|------|
| 所要時間 | 「約 XX 分」形式 |
| 距離 | km単位（小数点1桁）|
| 乗換回数 | 「X 回」形式 |
| Google Maps連携 | 外部リンクで詳細表示（任意） |

### 7.3 エラー表示

```typescript
// エラーメッセージのパターン
const ERROR_MESSAGES = {
  STATION_NOT_FOUND: '駅が見つかりませんでした',
  SCHOOL_NOT_FOUND: '学校が見つかりませんでした',
  ROUTE_NOT_FOUND: 'ルートが見つかりませんでした',
  API_LIMIT: 'API制限に達しました。しばらく待ってから再試行してください',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
};
```

---

## 8. セキュリティ

### 8.1 APIキーの保護

- **サーバーサイドのみ**: API RoutesでAPIキーを使用
- **環境変数**: `.env.local` に保存、Vercelダッシュボードで設定
- **Git管理外**: `.gitignore` に `.env.local` を追加

### 8.2 入力バリデーション

```typescript
// クエリパラメータのバリデーション
function validateSearchWord(word: string | null): string {
  if (!word) {
    throw new Error('検索ワードが必要です');
  }
  if (word.length < 2) {
    throw new Error('検索ワードは2文字以上必要です');
  }
  if (word.length > 50) {
    throw new Error('検索ワードは50文字以下にしてください');
  }
  // XSS対策は Next.js が自動的に行う
  return word;
}
```

---

## 9. テスト方針

### 9.1 テストの優先度

1. **API Routes のユニットテスト**: NAVITIME APIとの連携
2. **コンポーネントテスト**: オートコンプリート動作
3. **E2Eテスト**: 検索フロー全体

### 9.2 テストファイル配置

```text
__tests__/
├── api/
│   ├── stations.test.ts
│   ├── schools.test.ts
│   └── route.test.ts
├── components/
│   ├── StationInput.test.tsx
│   ├── SchoolInput.test.tsx
│   └── ResultCard.test.tsx
└── e2e/
    └── search-flow.test.ts
```

> AI への指示例：
> 「テストコードを追加する場合は、__tests__/ディレクトリ以下に配置してください。
> モックは MSW（Mock Service Worker）を使用してください。」

---

## 10. デプロイ

### 10.1 Vercel デプロイ手順

1. GitHubリポジトリと連携
2. 環境変数を設定（`RAPIDAPI_KEY`）
3. ビルド設定はデフォルト（自動検出）
4. デプロイ実行

### 10.2 環境変数の設定

Vercelダッシュボード → Settings → Environment Variables:
- `RAPIDAPI_KEY`: RapidAPIで取得したキー

---

## 11. 実装チェックリスト

### 11.1 初期セットアップ
- [ ] Next.js 14 プロジェクト初期化
- [ ] TypeScript 設定
- [ ] Tailwind CSS 設定
- [ ] 環境変数設定（.env.local）

### 11.2 API Routes
- [ ] `/api/stations` - 駅検索API
- [ ] `/api/schools` - 学校検索API
- [ ] `/api/route` - ルート検索API

### 11.3 コンポーネント
- [ ] `StationInput` - 駅入力（オートコンプリート）
- [ ] `SchoolInput` - 学校入力（オートコンプリート）
- [ ] `ResultCard` - 検索結果表示

### 11.4 メインページ
- [ ] レイアウト
- [ ] 状態管理
- [ ] 検索フロー
- [ ] エラーハンドリング
- [ ] ローディング表示

### 11.5 デプロイ
- [ ] Vercel連携
- [ ] 環境変数設定
- [ ] 動作確認

---

## 12. 禁止事項・注意事項

### 12.1 禁止事項
- クライアントサイドでの直接API呼び出し（APIキー漏洩防止）
- NAVITIME APIレスポンスのキャッシュ保存（利用規約違反）
- 運賃情報の表示（今回のスコープ外）
- データベースの使用（テスト版のため）

### 12.2 注意事項
- API制限（各500回/月）を意識した実装
- デバウンス処理の徹底
- エラーメッセージは日本語で表示

---

## 13. AI への依頼テンプレート

このプロジェクトで AI にコードを書いてもらうときの依頼例：

```text
あなたは Next.js 14 / TypeScript を使用した
進路指導訪問 所要時間検索アプリの開発アシスタントです。

共通ルール（~/.claude/CLAUDE.md）に加えて、
次のプロジェクト固有ルールを守ってください：
- App Router を使用
- API Routes でサーバーサイド処理
- APIキーはクライアントに漏洩させない
- オートコンプリートには300msデバウンス必須
- API制限（各500回/月）を考慮した実装
- エラーメッセージは日本語

【依頼内容】
駅検索のオートコンプリート機能を実装してください。
- components/StationInput.tsx を作成
- デバウンス処理を含める
- ローディング状態を表示
- エラーハンドリングを実装

実装後は以下の流れで品質チェックを実施してください：
1. TypeScript型チェック（tsc --noEmit）
2. ESLint チェック
3. 動作確認
```

---

## 14. 更新ポリシー

- この専用メモリは、**機能追加・仕様変更時に更新**する
- 大きな方針変更がある場合は、設計書（docs/school-visit-transit-app-design.md）も確認する
- 更新履歴や改訂日を下に追記して管理する

---

### 更新履歴

- 2024-12-19: 初版作成（設計書を基に作成）
