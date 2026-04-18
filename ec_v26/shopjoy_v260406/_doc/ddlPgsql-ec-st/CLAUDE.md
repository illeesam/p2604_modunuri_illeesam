# ec-st/ 정산 도메인 DDL

## SQL 파일 목록

### 기준 설정
- `st_settle_config.sql` — 정산 기준 설정 (수수료율, 정산주기, FK: site_id + vendor_id)

### 수집원장
- `st_settle_raw.sql` — 정산 수집원장 (PK: settle_raw_id)
  - **★ 기본 수집 단위: `od_order_item` + `od_claim_item`**
  - `raw_type_cd`: ORDER / CLAIM / ADJ / ETC_ADJ
  - `vendor_type_cd`: SALE / DLIV / EXTERNAL

### 정산 집계
- `st_settle.sql` — 정산 마스터 (PK: settle_id, UNIQUE: site_id + vendor_id + settle_ym)
- `st_settle_item.sql` — 정산 상세 항목

### 조정
- `st_settle_adj.sql` — 정산 조정 (FK: settle_id)
- `st_settle_etc_adj.sql` — 정산 기타 조정 (FK: settle_id)

### 마감/지급
- `st_settle_close.sql` — 정산 마감 (FK: settle_id)
- `st_settle_pay.sql` — 정산 지급 (FK: settle_id)

### 대사
- `st_recon.sql` — 대사 (PK: recon_id)
  - `recon_type_cd`: ORDER / PAY / CLAIM / VENDOR
  - `recon_status_cd`: MATCHED / MISMATCH / RESOLVED

### ERP 전표
- `st_erp_voucher.sql` — ERP 전표 마스터 (PK: erp_voucher_id)
  - `erp_voucher_type_cd`: SETTLE / RETURN / ADJ / PAY
  - `erp_voucher_status_cd`: DRAFT / CONFIRMED / SENT / MATCHED / MISMATCH / ERROR
- `st_erp_voucher_line.sql` — ERP 전표 라인 분개 (UNIQUE: erp_voucher_id + line_no)
  - `debit_amt` / `credit_amt` 상호 배타적 (복식부기)

## 정산 상태 흐름
```
DRAFT → CONFIRMED → CLOSED → PAID
```
- CLOSED 이후 재오픈 불가
- 타월 환불: 환불 확정 시점 월의 st_settle_raw에 CLAIM 타입으로 수집

## 관리자 화면 경로
| pageId | 라벨 | 관련 테이블 |
|---|---|---|
| `stConfigMng` | 정산 > 정산기준관리 | st_settle_config |
| `stRawMng` | 정산 > 정산수집원장 | st_settle_raw |
| `stSettleAdjMng` | 정산 > 정산조정 | st_settle_adj |
| `stSettleEtcAdjMng` | 정산 > 정산기타조정 | st_settle_etc_adj |
| `stSettleCloseMng` | 정산 > 정산마감 | st_settle, st_settle_close |
| `stSettlePayMng` | 정산 > 정산지급관리 | st_settle_pay |
| `stStatusMng` | 정산 > 정산현황 | st_settle |
| `stSiteStatusMng` | 정산 > 사이트별현황 | st_settle_raw |
| `stVendorStatusMng` | 정산 > 업체별현황 | st_settle_raw |
| `stVendorTypeStatusMng` | 정산 > 업체구분별현황 | st_settle_raw (vendor_type_cd) |
| `stOrderStatusMng` | 정산 > 주문별현황 | st_settle_raw |
| `stOrderItemStatusMng` | 정산 > 주문상품별현황 | st_settle_raw |
| `stClaimStatusMng` | 정산 > 클레임별현황 | st_settle_raw (CLAIM) |
| `stClaimItemStatusMng` | 정산 > 클레임상품별현황 | st_settle_raw |
| `stProdStatusMng` | 정산 > 상품별현황 | st_settle_raw |
| `stMdStatusMng` | 정산 > MD별현황 | st_settle_raw |
| `stPromoStatusMng` | 정산 > 프로모션별현황 | st_settle_raw |
| `stCouponStatusMng` | 정산 > 쿠폰별현황 | st_settle_raw |
| `stDiscntStatusMng` | 정산 > 할인별현황 | st_settle_raw |
| `stVoucherStatusMng` | 정산 > 상품권별현황 | st_settle_raw |
| `stCacheStatusMng` | 정산 > 캐쉬별현황 | st_settle_raw |
| `stGiftStatusMng` | 정산 > 사은품별현황 | st_settle_raw |
| `stMileageStatusMng` | 정산 > 마일리지별현황 | st_settle_raw |
| `stPayMethodStatusMng` | 정산 > 결제수단별현황 | st_settle_raw |
| `stDailyMng` | 정산 > 일별정산현황 | st_settle_raw |
| `stMonthlyMng` | 정산 > 월별정산현황 | st_settle |
| `stReconOrderMng` | 정산 > 주문-정산 대사 | st_recon (ORDER) |
| `stReconPayMng` | 정산 > 결제-정산 대사 | st_recon (PAY) |
| `stReconClaimMng` | 정산 > 클레임-정산 대사 | st_recon (CLAIM) |
| `stReconVendorMng` | 정산 > 업체-정산 대사 | st_recon (VENDOR) |
| `stErpVoucherCreateMng` | 정산 > ERP 전표생성 | st_erp_voucher, st_erp_voucher_line |
| `stErpVoucherMng` | 정산 > ERP 전표조회 | st_erp_voucher, st_erp_voucher_line |
| `stErpReconMng` | 정산 > ERP 전표대사 | st_erp_voucher, st_recon |

## 관련 정책서
- `_doc/정책서ec/st.01.정산마감.md`
- `_doc/정책서ec/st.02.정산처리.md`
- `_doc/정책서ec/st.03.정산수집원장대사.md`
- `_doc/정책서ec/st.04.정산ERP전표.md`
