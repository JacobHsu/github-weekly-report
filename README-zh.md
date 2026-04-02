# GitHub 每週報告

每週一自動產生個人 commit 週報，並發布為 GitHub Pages 儀表板。

## 運作方式

```
每週一 02:00 UTC
  → GitHub Actions 擷取上週一至週日的所有 commits
  → 儲存報告至 reports/YYYY-MM-DD_YYYY-MM-DD.md
  → 部署儀表板至 GitHub Pages
```

## 儀表板

網址：`https://<your-username>.github.io/github-weekly-report/`

以 GitHub commit 歷史頁面的風格，依 repository 分組顯示本週 commits。

## 設定步驟

### 1. Fork 或 clone 此 repo

### 2. 啟用 GitHub Pages

Settings → Pages → Source → **GitHub Actions**

### 3. 設定 repository 變數

Settings → Actions → Variables → New repository variable

| 名稱 | 值 |
|------|-----|
| `GH_USERNAME` | 你的 GitHub 使用者名稱 |

### 4. 手動執行驗證

Actions → Weekly Report → Run workflow

幾分鐘內報告與儀表板就會上線。

## 專案結構

```
.github/
  workflows/
    weekly-report.yml       # 每週一執行，產生報告
    deploy-dashboard.yml    # push 後自動 build 並部署儀表板
scripts/
  generate-report.sh        # 透過 GitHub API 擷取 commits，寫入 Markdown
reports/
  YYYY-MM-DD_YYYY-MM-DD.md  # 每週報告（自動產生）
dashboard/                  # Next.js 靜態網站（GitHub Pages）
  app/
  components/
  lib/
SPEC.md                     # 完整規格說明（英文）
SPEC-zh.md                  # 完整規格說明（中文）
```

## 報告格式

```markdown
# Weekly Report: 2026-03-23 ~ 2026-03-29

Generated: 2026-03-30

## repo-name

- 2026-03-25 · abc1234 · feat: add login page

---
*Total: 3 commits across 2 repositories*
```

## 本地開發

```bash
# 本地預覽儀表板
cd dashboard
npm install
npm run dev
# → http://localhost:3000

# 執行測試
npm test

# 本地產生真實報告（需要 GitHub token）
GH_USERNAME=your-username GITHUB_TOKEN=ghp_xxx bash scripts/generate-report.sh
```
