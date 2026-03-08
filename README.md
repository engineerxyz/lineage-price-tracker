# Lineage Classic Deporozu price tracker

- 기준 단위: **1만 아덴당 KRW**
- 수집 주기: **5분** (launchd)
- 정제: **상/하위 5% 제거(Trimmed)**

## 파일
- `collect.js` : 수집기
- `data/history.json` : 원본 누적
- `docs/index.html` : 그래프 페이지
- `docs/data/history.json` : GitHub Pages용 데이터

## 로컬 실행
```bash
node collect.js
```

## 에이전트(5분 주기)
LaunchAgent label: `com.minibot.lineage-price-tracker`

```bash
launchctl print gui/$(id -u)/com.minibot.lineage-price-tracker
```

## GitHub Pages 호스팅
1. 이 폴더를 GitHub repo로 push
2. Settings → Pages → Branch: `main` / Folder: `/lineage-price-tracker/docs` (또는 repo root면 `/docs`)
3. 접속 URL에서 그래프 확인
