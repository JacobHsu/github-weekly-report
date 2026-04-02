# 週報儀表板 — 設計規格說明書

**日期：** 2026-04-02
**狀態：** 已確認

---

## 概述

一個 Next.js 網頁儀表板，用於瀏覽自動產生的每週 commit 報告。
報告由現有的 GitHub Actions 工作流程產生（詳見 `SPEC.md`），
儲存於同一 repository 的 `reports/` 資料夾。
儀表板部署於 Vercel，每週一新報告 commit 後自動重新 build。

---

## 目標

- 讓開發者週一早上可以在乾淨的網頁介面閱讀當週報告。
- 初次設定完成後，完全自動執行，無需人工介入。
- UI 風格與 GitHub Dark 主題一致。

## 不在範圍內

- 編輯或刪除報告。
- 身份驗證 / 存取控制（個人工具，適用公開或私有 repo）。
- 即時更新或即時 commit 追蹤。
- 圖表、統計分析（僅顯示每份報告的基本數字）。

---

## 架構

```
weekly-report/                  ← Next.js 專案（獨立於 shell script repo）
├── app/
│   ├── layout.tsx              ← 全域 layout：header + GitHub Dark 基礎樣式
│   ├── page.tsx                ← 首頁：報告列表
│   └── reports/
│       └── [slug]/
│           └── page.tsx        ← 單篇報告頁
├── lib/
│   ├── github.ts               ← GitHub Contents API 存取層
│   └── markdown.ts             ← Markdown 解析 + 統計數字擷取
├── components/
│   ├── ReportCard.tsx          ← 列表卡片（日期範圍、commit 數、repo 數）
│   ├── ReportContent.tsx       ← 報告內文 render
│   └── StatsBar.tsx            ← 統計列：N commits · M repositories
├── .env.local                  ← GITHUB_TOKEN, REPO_OWNER, REPO_NAME
└── next.config.ts              ← output: 'export' 靜態產生設定
```

---

## 資料流

### Build 時（SSG）

1. `lib/github.ts` 呼叫 `GET /repos/{owner}/{repo}/contents/reports` 取得所有 `.md` 檔案清單。
2. 對每個檔案，透過 `download_url` 取得原始內容。
3. `lib/markdown.ts` 解析每份檔案，擷取：週期範圍、commit 清單、commit 總數、repo 數。
4. Next.js 靜態產生 `/` 與 `/reports/[slug]` 的所有頁面。

### 每週更新流程

```
每週一約 02:00 UTC：
  GitHub Actions → 產生報告 → commit 至 reports/
                 → 呼叫 Vercel Deploy Hook
                 → Vercel 重新 build 靜態網站
                 → 儀表板於數分鐘內更新完成
```

### 環境變數

| 變數名稱 | 說明 |
|----------|------|
| `GITHUB_TOKEN` | Personal access token（唯讀，`contents` 權限）|
| `REPO_OWNER` | 擁有報告 repo 的 GitHub 使用者名稱 |
| `REPO_NAME` | Repository 名稱（例如 `github-weekly-report`）|
| `VERCEL_DEPLOY_HOOK` | Vercel deploy hook URL（設定於 GitHub Actions secrets）|

---

## 頁面

### 首頁 `/`

- 依日期降序列出所有報告（最新在最上方）。
- 每張 `ReportCard` 顯示：
  - 週期範圍：`2026-03-23 ~ 2026-03-29`
  - 摘要：`12 commits · 4 repositories`
  - 點擊進入報告頁的箭頭連結。

### 報告頁 `/reports/2026-03-23_2026-03-29`

- 頂部 `StatsBar`：本週 commit 總數 + repo 數。
- 返回首頁連結。
- `ReportContent` render Markdown 內容：
  - Repo 名稱為 `h2` 區塊標題。
  - 每筆 commit：日期 · SHA（monospace，附 GitHub 連結）· commit 訊息。

---

## UI 設計

完全採用 **GitHub Dark** 官方色系：

| 色彩 Token | 色碼 | 用途 |
|------------|------|------|
| `canvas-default` | `#0d1117` | 頁面背景 |
| `canvas-subtle` | `#161b22` | 卡片背景 |
| `border-default` | `#30363d` | 卡片 / 分隔線邊框 |
| `fg-default` | `#e6edf3` | 主要文字 |
| `fg-muted` | `#8b949e` | 次要文字（日期、數量）|
| `accent-fg` | `#58a6ff` | 連結（repo 名稱、SHA）|
| `success-fg` | `#3fb950` | SHA highlight（monospace）|

字型：內文使用系統預設；SHA 使用 monospace（`ui-monospace, SFMono-Regular, Menlo`）。

---

## 技術選型

| 工具 | 版本 | 選用理由 |
|------|------|----------|
| Next.js | 15（App Router）| SSG、檔案路由 |
| TypeScript | 5 | 型別安全 |
| Tailwind CSS | 4 | Utility-first，易套用 GitHub Dark 色系 |
| ESLint | 9 | 程式碼品質 |

---

## 驗收標準

- [ ] 首頁依降序列出 `reports/` 中所有報告。
- [ ] 每個報告頁正確 render Markdown 內容。
- [ ] 每份報告的統計數字（commit 數、repo 數）正確。
- [ ] SHA 連結正確指向對應的 GitHub commit 頁面。
- [ ] Repo 名稱標題連結正確指向對應的 GitHub repository。
- [ ] GitHub Actions 在每次報告 commit 後呼叫 Vercel Deploy Hook。
- [ ] 呼叫 Hook 後 5 分鐘內，網站完成重新 build 並顯示新報告。
- [ ] UI 與 GitHub Dark 色系一致。
- [ ] Build 通過，無 TypeScript 或 ESLint 錯誤。

---

## 範圍外（未來可考慮擴充）

- 跨週搜尋 / 篩選。
- 深色 / 淺色模式切換。
- 新報告上線時發送 Email 或 Slack 通知。
