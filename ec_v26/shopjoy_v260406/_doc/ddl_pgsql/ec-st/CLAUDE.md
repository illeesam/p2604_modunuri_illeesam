# ec-st/ 정산 도메인 DDL

## 테이블 목록

### 기준 설정
- `st_settle_config` — 정산 기준 설정 (수수료율, 정산주기 등, FK: site_id + vendor_id)

### 수집원장
- `st_settle_raw` — 정산 수집원장 (PK: settle_raw_id)
  - **★ 기본 수집 단위: `od_order_item` + `od_claim_item`**
  - `raw_type_cd`: ORDER / CLAIM / ADJ / ETC_ADJ
  - `vendor_type_cd`: SALE / DLIV / EXTERNAL
  - 모든 금액 차원 1행 수집 (할인/결제수단/수수료 등)

### 정산 집계
- `st_settle` — 정산 마스터 (PK: settle_id, UNIQUE: site_id + vendor_id + settle_ym)
- `st_settle_item` — 정산 상세 항목

### 조정
- `st_settle_adj` — 정산 조정 (FK: settle_id)
- `st_settle_etc_adj` — 정산 기타 조정 (FK: settle_id)

### 마감/지급
- `st_settle_close` — 정산 마감 (FK: settle_id)
- `st_settle_pay` — 정산 지급 (FK: settle_id)

### 대사
- `st_recon` — 대사 (PK: recon_id)
  - `recon_type_cd`: ORDER / PAY / CLAIM / VENDOR
  - `recon_status_cd`: MATCHED / MISMATCH / RESOLVED

### ERP 전표
- `st_erp_voucher` — ERP 전표 마스터 (PK: erp_voucher_id)
  - `erp_voucher_type_cd`: SETTLE / RETURN / ADJ / PAY
  - `erp_voucher_status_cd`: DRAFT / CONFIRMED / SENT / MATCHED / MISMATCH / ERROR
- `st_erp_voucher_line` — ERP 전표 라인 분개 (UNIQUE: erp_voucher_id + line_no)
  - `debit_amt` / `credit_amt` 상호 배타적 (복식부기)

## 정산 상태 흐름
```
DRAFT → CONFIRMED → CLOSED → PAID
```
- CLOSED 이후 재오픈 불가
- 타월 환불: 환불 확정 시점 월의 st_settle_raw에 CLAIM 타입으로 수집

## 대차 균형 원칙
- `st_erp_voucher.total_debit_amt` = `total_credit_amt` (전표 확정 조건)

## 관련 정책서
- `_doc/정책서ec/st.01.정산마감.md`
- `_doc/정책서ec/st.02.정산처리.md`
- `_doc/정책서ec/st.03.정산수집원장대사.md`
- `_doc/정책서ec/st.04.정산ERP전표.md`
