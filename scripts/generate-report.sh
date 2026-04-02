#!/usr/bin/env bash
set -euo pipefail

# Calculate date range: last Monday to last Sunday (UTC)
TODAY=$(date -u +%Y-%m-%d)
DOW=$(date -u +%u)           # 1=Mon ... 7=Sun
DAYS_SINCE_MON=$(( DOW % 7 ))
LAST_SUN=$(date -u -d "$TODAY - ${DAYS_SINCE_MON} days" +%Y-%m-%d)
LAST_MON=$(date -u -d "$LAST_SUN - 6 days" +%Y-%m-%d)

SINCE="${LAST_MON}T00:00:00Z"
UNTIL="${LAST_SUN}T23:59:59Z"
FILENAME="${LAST_MON}_${LAST_SUN}.md"
REPORT_FILE="reports/${FILENAME}"

echo "Generating report for ${LAST_MON} ~ ${LAST_SUN}"

# Fetch all repos for the user (paginated)
PAGE=1
ALL_REPOS=()
while true; do
  BATCH=$(curl -sf \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/users/${GH_USERNAME}/repos?per_page=100&page=${PAGE}" \
    | jq -r '.[].name')
  [ -z "$BATCH" ] && break
  mapfile -t -O "${#ALL_REPOS[@]}" ALL_REPOS <<< "$BATCH"
  PAGE=$(( PAGE + 1 ))
done

BODY=""
TOTAL_COMMITS=0
REPO_COUNT=0

for REPO in "${ALL_REPOS[@]}"; do
  COMMITS=$(curl -sf \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${GH_USERNAME}/${REPO}/commits?since=${SINCE}&until=${UNTIL}&author=${GH_USERNAME}&per_page=100" \
    | jq -r '.[] | "- \(.commit.author.date[:10]) · \(.sha[:7]) · \(.commit.message | split("\n")[0])"')

  if [ -n "$COMMITS" ]; then
    COUNT=$(echo "$COMMITS" | wc -l)
    TOTAL_COMMITS=$(( TOTAL_COMMITS + COUNT ))
    REPO_COUNT=$(( REPO_COUNT + 1 ))
    BODY+="## ${REPO}\n\n${COMMITS}\n\n"
  fi
done

if [ "$TOTAL_COMMITS" -eq 0 ]; then
  echo "No commits this week. Skipping report."
  exit 0
fi

mkdir -p reports
{
  printf "# Weekly Report: %s ~ %s\n\n" "$LAST_MON" "$LAST_SUN"
  printf "Generated: %s\n\n" "$(date -u +%Y-%m-%d)"
  printf "%b" "$BODY"
  printf -- "---\n*Total: %d commits across %d repositories*\n" "$TOTAL_COMMITS" "$REPO_COUNT"
} > "$REPORT_FILE"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add "$REPORT_FILE"
git commit -m "chore: add weekly report ${LAST_MON} ~ ${LAST_SUN}"
git push origin "${REPORT_BRANCH:-main}"

echo "HAS_COMMITS=true" >> "$GITHUB_ENV"
