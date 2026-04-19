# screenBo-ec-od/ 관리자 화면 — 주문(OD) 도메인

## 화면 목록
- `index.html` — 주문 도메인 화면 목록 인덱스
- `od-order-mng.html` — 주문관리 (주문목록/상세/상태변경/일괄처리)
- `od-claim-mng.html` — 클레임관리 (취소/반품/교환 목록/상세)
- `od-dliv-mng.html` — 배송관리 (출고/입고/송장/택배사)
- `od-pay-mng.html` — 결제관리 (결제수단/승인/취소 이력)

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `odOrderMng` | `ec-od-order-mng` | `pages/admin/ec/od/OdOrderMng.js` |
| `odClaimMng` | `ec-od-claim-mng` | `pages/admin/ec/od/OdClaimMng.js` |
| `odDlivMng` | `ec-od-dliv-mng` | `pages/admin/ec/od/OdDlivMng.js` |

## 주문 상태 코드
`order_status_cd`: PENDING / PAID / PREPARING / SHIPPED / COMPLT / CANCEL

## 관련 DDL
- `_doc/ddlPgsql-ec-od/` — 주문 도메인 전체 DDL

## 관련 정책서
- `_doc/정책서-ec-od/` — 주문 도메인 정책
