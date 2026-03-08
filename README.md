# Lineage Classic Price Tracker (Next.js Server Components)

- 단위: **1만 아덴당 KRW**
- 수집 주기: **5분** (launchd)
- 단일값 로직: **상/하위 5% 제거 후 최저값**
- 서버 탭: **데포로쥬 / 조우**

## 보안/노출 정책
- 원시 데이터는 `data/*.json` (서버 파일) 에만 저장
- `public/`에 데이터 파일을 두지 않음
- 클라이언트에는 화면에 필요한 값만 SSR로 렌더링

## 실행
```bash
npm install
npm run dev
# http://localhost:3311
```

## 수집기
```bash
node collect.js
```

## 자동수집 에이전트
Label: `com.minibot.lineage-price-tracker`

```bash
launchctl print gui/$(id -u)/com.minibot.lineage-price-tracker
```
