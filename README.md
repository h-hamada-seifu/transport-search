# 進路指導訪問 所要時間検索アプリ

教員が進路指導で学校訪問する際の、自宅最寄り駅から訪問先学校までの所要時間・距離を簡単に検索できるWebアプリケーションです。

## 機能

- 駅名のオートコンプリート検索
- 学校名のオートコンプリート検索
- 電車での所要時間・距離・乗換回数の表示
- Google Mapsとの連携

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **API**: NAVITIME RapidAPI
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` を `.env.local` にコピーして、RapidAPI キーを設定します。

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、RapidAPI キーを設定してください：

```env
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3. RapidAPI の設定

以下の手順でRapidAPIキーを取得してください：

1. [RapidAPI](https://rapidapi.com/) にアクセス
2. アカウント作成（Google連携可）
3. 以下の3つのサービスをサブスクライブ（BASICプラン/無料）：
   - [NAVITIME Transport](https://rapidapi.com/navitime/api/navitime-transport)
   - [NAVITIME Spot](https://rapidapi.com/navitime/api/navitime-spot)
   - [NAVITIME Route(totalnavi)](https://rapidapi.com/navitime/api/navitime-route-totalnavi)
4. APIキーを取得（各サービス共通のキー）

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

1. **出発駅を入力**: 最寄り駅の名前を入力（2文字以上）
2. **訪問先学校を入力**: 訪問する学校名を入力（2文字以上）
3. **検索ボタンをクリック**: 所要時間・距離・乗換回数が表示されます
4. **詳細を確認**: Google Mapsリンクから詳細なルートを確認できます

## プロジェクト構成

```
transport-search/
├── app/
│   ├── api/
│   │   ├── stations/route.ts    # 駅検索API
│   │   ├── schools/route.ts     # 学校検索API
│   │   └── route/route.ts       # ルート検索API
│   ├── page.tsx                 # メインページ
│   ├── layout.tsx               # レイアウト
│   └── globals.css              # グローバルスタイル
├── components/
│   ├── StationInput.tsx         # 駅入力コンポーネント
│   ├── SchoolInput.tsx          # 学校入力コンポーネント
│   └── ResultCard.tsx           # 結果表示コンポーネント
├── lib/
│   └── utils.ts                 # ユーティリティ関数
├── types/
│   └── index.ts                 # TypeScript型定義
└── docs/
    └── school-visit-transit-app-design.md  # 設計書
```

## API制限

各NAVITIMEサービスは月間500リクエストまで無料で利用可能です：

- Transport API: 500回/月
- Spot API: 500回/月
- Route API: 500回/月

API消費量を抑えるため、以下の最適化を実装しています：

- オートコンプリートは300msのデバウンス処理
- 最小2文字以上で検索開始
- 候補選択後は自動的に検索停止

## Vercel へのデプロイ

1. GitHubリポジトリを作成してプッシュ
2. [Vercel](https://vercel.com/) でプロジェクトをインポート
3. 環境変数 `RAPIDAPI_KEY` を設定
4. デプロイ実行

## ライセンス

ISC

## 作成者

開発者名
