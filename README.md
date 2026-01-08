# 商會分組導航員 - Chamber Grouping Navigator

本專案是一個基於 React 的商會分組導航系統，旨在協助商會快速進行分組並進行產業對接分析。

## 專案功能

- **自動分組機制**：根據房長、會員、來賓身份進行智慧分配。
- **產業避嫌與對接**：內建產業對接庫，可設定絕對避嫌或允許重複。
- **即時數據統計**：顯示房長、會員、來賓比例，以及衝突與對接次數。
- **列印與匯出**：支援投影模式、文字複製與 CSV 報告匯出。

## 技術棧

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: GitHub Actions (GitHub Pages)

## 開發指南

### 環境要求

- Node.js (建議 v20 以上)
- npm 或 yarn

### 安裝

```bash
npm install
```

### 本地開發

```bash
npm run dev
```

### 編譯打包

```bash
npm run build
```

## 部署說明

本專案已配置 GitHub Actions。當代碼推送到 `main` 分支時，系統會自動編譯並部署至 GitHub Pages。

**部署配置流程：**

1. 確保 `.github/workflows/deploy.yml` 存在。
2. 在 GitHub 存儲庫設定 (Settings) -> Pages -> Build and deployment -> Source 選擇 `GitHub Actions`。

## 操作日誌 (2026-01-08)

- 補全 `package.json` 依賴與類型定義。
- 正式引入 Tailwind CSS 設定與編譯流程。
- 新增 GitHub Action 自動部署服務。
- 優化 `.gitignore` 排除不必要的環境與暫存檔。
