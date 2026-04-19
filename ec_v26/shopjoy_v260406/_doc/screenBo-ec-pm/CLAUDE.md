# screenBo-ec-pm/ 관리자 화면 — 프로모션(PM) 도메인

## 화면 목록
- `index.html` — 프로모션 도메인 화면 목록 인덱스
- `pm-coupon-mng.html` — 쿠폰관리 (발행/사용/만료 관리)
- `pm-cache-mng.html` — 캐쉬(충전금)관리 (충전/사용/환불/유효기간)
- `pm-discnt-mng.html` — 할인관리 (할인 정책/적용 범위)
- `pm-event-mng.html` — 이벤트관리 (이벤트 생성/참여/당첨)

## 관련 관리자 컴포넌트
| pageId | 컴포넌트 | 파일 |
|---|---|---|
| `pmCouponMng` | `ec-pm-coupon-mng` | `pages/admin/ec/pm/PmCouponMng.js` |
| `pmCacheMng` | `ec-pm-cache-mng` | `pages/admin/ec/pm/PmCacheMng.js` |
| `pmEventMng` | `ec-pm-event-mng` | `pages/admin/ec/pm/PmEventMng.js` |

## 관련 DDL
- `_doc/ddlPgsql-ec-pm/` — 프로모션 도메인 전체 DDL

## 관련 정책서
- `_doc/정책서-ec-pm/` — 프로모션 도메인 정책
