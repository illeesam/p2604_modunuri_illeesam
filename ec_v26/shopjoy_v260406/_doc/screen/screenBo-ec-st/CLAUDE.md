# screenBo-ec-st/ 관리자 화면 — 정산(ST) 도메인

## 화면 목록
- `index.html` — 정산 도메인 화면 목록 인덱스
- `st-settle-close-mng.html` — 정산마감관리 (월별 판매자 정산액 마감)
- `st-settle-mng.html` — 정산처리관리 (지급 요청/확인/이의신청)

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `stSettleCloseMng` | `ec-st-settle-close-mng` | `pages/admin/ec/st/StSettleCloseMng.js` |
| `stSettleMng` | `ec-st-settle-mng` | `pages/admin/ec/st/StSettleMng.js` |

## 정산 흐름
1. 월별 판매 집계 → 정산마감(st-settle-close) 생성
2. 수수료 차감 → 판매자 정산액 확정
3. 지급 요청 → 확인 → 완료 (이의신청 처리 포함)

## 관련 DDL
- `_doc/ddlPgsql-ec-st/` — 정산 도메인 전체 DDL

## 관련 정책서
- `_doc/정책서-ec-st/` — 정산 도메인 정책
