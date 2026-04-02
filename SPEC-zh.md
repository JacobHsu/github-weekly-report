# GitHub 每週報告 — 規格說明書

**日期：** 2026-04-02
**狀態：** 已確認

---

## 概述

這是一個以 GitHub Actions 為基礎的工具，每週自動產生一份 Markdown 格式的個人 commit 週報，涵蓋上一個完整週（週一至週日）內，使用者在所有 GitHub repo 中的 commit 記錄，並自動將報告提交回同一個 repository 的 `reports/` 資料夾。

---

## 目標

- 讓個人開發者無需手動操作，就能每週回顧自己的工作內容。
- 初次設定完成後，完全自動執行，無需人工介入。
- 保持方案簡單，不依賴外部套件。

## 不在範圍內

- PR、Issue、Code Review、Discussion 等活動不納入統計。
- 不支援多人或團隊報告。
- 不支援對外發佈（Email、社群媒體、儀表板等）。
- 不包含統計圖表或視覺化內容，僅呈現 commit 清單。

---

## 使用者故事

| # | 身為… | 我希望… | 目的是… |
|---|-------|---------|---------|
| 1 | 個人開發者 | 報告每週自動產生 | 不需要記得手動執行 |
| 2 | 個人開發者 | 看到上週一至週日所有的 commit | 清楚掌握上週的工作內容 |
| 3 | 個人開發者 | 每個 repo 的 commit 列出日期與訊息 | 快速掃描各專案的變更 |
| 4 | 個人開發者 | 報告以 Markdown 格式存入 repo | 可在 GitHub 或任何 Markdown 閱讀器查看 |
| 5 | 個人開發者 | 歷週報告保留不刪除 | 可回顧任何一週的工作記錄 |

---

## 功能需求

### 報告內容

- **涵蓋範圍：** 已驗證 GitHub 使用者名下的所有 repository。
- **時間範圍：** 上一個完整週 — 週一 00:00 UTC 至週日 23:59 UTC。
- **記錄類型：** 僅限 Git commit（作者需符合設定的 GitHub 使用者名稱）。
- **每個 repo 的區塊包含：**
  - Repository 名稱（附 GitHub 連結）
  - Commit 清單，每筆顯示：
    - 日期（YYYY-MM-DD）
    - Commit 訊息（僅第一行）
    - 短 SHA（7 碼，附 GitHub 連結）

### 報告格式範例

```markdown
# 每週報告：2026-03-23 ~ 2026-03-29

產生時間：2026-03-30

## repo-name-1

- 2026-03-25 · abc1234 · feat: 新增登入頁面
- 2026-03-27 · def5678 · fix: 修正登出時的 null pointer 問題

## repo-name-2

- 2026-03-24 · 1a2b3c4 · chore: 更新相依套件

---
*本週共 3 筆 commits，涵蓋 2 個 repositories*
```

- 若某個 repo 在該週沒有 commit，該 repo 不出現在報告中。
- 報告最末顯示 commit 總數與涵蓋的 repo 數量。

### 檔案命名與儲存位置

- 路徑：`reports/YYYY-MM-DD_YYYY-MM-DD.md`
  - 範例：`reports/2026-03-23_2026-03-29.md`
- 由 GitHub Actions bot 自動 commit 至 `main` 分支。
- Commit 訊息格式：`chore: add weekly report YYYY-MM-DD ~ YYYY-MM-DD`

---

## 技術設計

### 實作方案選擇

**Shell Script + GitHub REST API（透過 `curl`）**，不依賴任何外部套件。

選擇理由：
- GitHub Actions 原生支援 `curl` 與 `bash`，無需額外安裝。
- 資料擷取邏輯簡單，Shell script 完全勝任。
- 避免 `npm install` 或 `pip install` 步驟，工作流程執行更快速。

### 專案結構

```
.github/
  workflows/
    weekly-report.yml       # GitHub Actions 排程工作流程
scripts/
  generate-report.sh        # 核心邏輯：擷取 commits、產生 Markdown
reports/
  YYYY-MM-DD_YYYY-MM-DD.md  # 每週自動產生的報告
SPEC.md                     # 英文規格說明書
SPEC-zh.md                  # 本文件（中文版）
```

### GitHub Actions 工作流程

- **觸發方式：** `schedule` 排程 — 每週一 02:00 UTC 自動執行
  （cron：`0 2 * * 1`）
- **同時支援：** `workflow_dispatch`，可手動觸發
- **執行環境：** `ubuntu-latest`
- **所需權限：** `contents: write`（用於 commit 報告）

### Script 執行邏輯（`generate-report.sh`）

1. 計算日期範圍：上週一至上週日（UTC）。
2. 呼叫 `GET /users/{username}/repos`（支援分頁）取得所有 repo 清單。
3. 對每個 repo 呼叫 `GET /repos/{owner}/{repo}/commits`，帶入 `since`、`until` 與 `author` 參數篩選。
4. 收集結果，跳過當週無 commit 的 repo。
5. 組合 Markdown 字串，寫入 `reports/<檔名>.md`。
6. 執行 `git add`、`git commit`、`git push`。

### 身份驗證

- 使用 GitHub Actions 內建的 `GITHUB_TOKEN` secret，無需額外設定。
- 對公開及私有 repo 皆適用（在同一使用者帳號下，`contents: write` 權限已足夠）。

### 設定項目（透過工作流程環境變數）

| 變數名稱 | 預設值 | 說明 |
|----------|--------|------|
| `GH_USERNAME` | （必填）| 用於篩選 commit 的 GitHub 使用者名稱 |
| `REPORT_BRANCH` | `main` | 報告要 commit 至的分支名稱 |

`GH_USERNAME` 設定於 GitHub Settings → Actions → Variables（非 Secret）。

---

## 驗收標準

- [ ] 工作流程每週一 02:00 UTC 自動執行。
- [ ] 報告涵蓋恰好為上週一 00:00 UTC 至週日 23:59 UTC。
- [ ] 所有在該週有 commit 的 repo 均出現在報告中。
- [ ] 每筆 commit 顯示日期、短 SHA（附連結）及第一行訊息。
- [ ] 當週無 commit 的 repo 不出現在報告中。
- [ ] 報告以正確檔名 commit 至 `reports/` 資料夾。
- [ ] `workflow_dispatch` 手動觸發亦可正常運作。
- [ ] 當週完全無 commit 時，工作流程正常結束，不產生空白檔案。

---

## 範圍外（未來可考慮擴充）

- PR / Issue / Code Review 活動統計
- Email 或 Slack 通知
- Commit 統計圖表
- 組織（Organization）層級的 repo 掃描
- 多個 GitHub 帳號支援
