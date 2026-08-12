# sy.58. 코드성 컬럼 명명 규칙 (`_cd`)

> 2026-08-13 신규. **공통코드(`sy_code`) 값을 담는 컬럼은 예외 없이 `_cd` 로 끝난다.**

---

## 1. 규칙

| 구분 | 컬럼명 | 예 |
|---|---|---|
| 공통코드 값 | **`{의미}_cd`** | `order_status_cd`, `pay_method_cd`, `prod_type_cd` |
| 변경 전/후 값 | `{의미}_cd_before` / `_cd_after` | `order_status_cd_before` |
| 코드 라벨(조인 결과, DTO 전용) | `{필드}CdNm` | `prodTypeCdNm`, `runStatusCdNm` |

Java 필드는 대응해서 `xxxCd` (camelCase). 인덱스명도 컬럼명을 따르므로
컬럼을 바꾸면 **인덱스명(`{tbl}_ixNN_{col}`)도 함께 바꾼다** (→ [`base.인덱스튜닝정책.md`](../base/base.인덱스튜닝정책.md) 명명 규칙).

---

## 2. `_cd` 를 붙이지 않는 것 — 코드성 컬럼이 아니다

아래는 이름에 `code`/`type`/`status`/`reason` 이 들어가도 **`sy_code` 참조가 아니므로 대상이 아니다.**
일괄 치환 시 오탐이 대량 발생하므로 반드시 구분할 것.

| 분류 | 예시 | 이유 |
|---|---|---|
| **자체 식별 코드** | `brand_code`·`menu_code`·`dept_code`·`role_code`·`site_code`·`batch_code`·`bbm_code`·`template_code`·`popup_code`·`widget_code`·`prod_code`·`coupon_code`·`voucher_code`·`attach_grp_code` | 업무 키(사용자가 정하는 고유값). 코드표가 아님 |
| **우편번호** | `member_zip_code`·`site_zip_code`·`vendor_zip_code` | 외부 체계 |
| **자유 텍스트 사유** | `chg_reason`·`status_reason`·`fail_reason`·`refund_reason`·`appr_reason`·`adj_reason`·`close_reason` | 사람이 쓰는 문장 |
| **외부/기술 값** | `failure_code`(PG 오류)·`req_method`(HTTP)·`error_type`(예외 FQCN)·`kakao_tpl_code` | 외부 시스템 소유 |
| **다중 코드 묶음** | `visibility_targets` (`^A^B^` 형식) | 단일 코드값이 아니라 목록. 복수형 유지 |

---

## 3. 점검 방법 (근거 기반)

이름만 보고 판단하면 오탐이 많다. **실제로 `sy_code` 와 조인되는지**가 가장 확실한 근거다.

```bash
# ① QueryDSL 이 sy_code 와 조인하는 컬럼 중 Cd 로 끝나지 않는 것 → 위반
grep -rhoE 'codeValue\.eq\([a-zA-Z]+\.[a-zA-Z0-9_]+\)' \
  _apps_be/EcAdminApi/src/main/java --include="*.java" \
  | sed 's/codeValue.eq(//;s/)//' | sort -u | grep -vE "Cd$"
```

```sql
-- ② 컬럼 코멘트에 "(코드: XXX)" 가 있는데 컬럼명이 _cd 로 안 끝나는 것
--    단, _cd_before / _cd_after 는 정상이므로 제외해서 봐야 한다
SELECT c.table_name, c.column_name, d.description
  FROM information_schema.columns c
  JOIN pg_class pc      ON pc.relname = c.table_name
  JOIN pg_namespace ns  ON ns.oid = pc.relnamespace AND ns.nspname = 'shopjoy_2604'
  JOIN pg_description d ON d.objoid = pc.oid AND d.objsubid = c.ordinal_position
 WHERE c.table_schema = 'shopjoy_2604'
   AND d.description LIKE '%코드:%'
   AND c.column_name !~ '_cd(_before|_after)?$';
```

---

## 4. 2026-08-13 정비 내역

①번 방법으로 **`sy_code` 조인 컬럼 전수 검사 → 위반 2건**, 같은 계열 2건을 함께 정리했다.

| 테이블 | 변경 전 | 변경 후 | 근거 |
|---|---|---|---|
| `od_pay` | `vbank_bank_code` | **`vbank_bank_cd`** | `BANK_CODE` 그룹과 조인 |
| `syh_batch_log` | `run_status` | **`run_status_cd`** | `BATCH_STATUS` 그룹과 조인 |
| `syh_batch_hist` | `run_status` | **`run_status_cd`** | 위와 동일 구조 |
| `sy_batch` | `batch_run_status` | **`batch_run_status_cd`** | 위와 동일 계열(IDLE/RUNNING/SUCCESS/FAILED) |

동반 변경:

- 인덱스 `syh_batch_log_ix03_run_status` → **`syh_batch_log_ix03_run_status_cd`**
- Entity 필드 `vbankBankCode`→`vbankBankCd`, `runStatus`→`runStatusCd`, `batchRunStatus`→`batchRunStatusCd`
- DTO 필드 및 파생 라벨(`...CdNm`), QueryDSL Impl, `SchBatchExecutor`, `SchBatchController`,
  `CmDashboardDataSourceRegistry`(raw SQL), 프론트 `SyBatchMng.js`·`SyBatchHist.js`
- 컬럼 코멘트에 코드그룹 명시 보강 (`(코드: BANK_CODE)`, `(코드: BATCH_STATUS — ...)`)

검증: `codeValue.eq(...)` 대상 중 `Cd` 미종료 **0건**, `gradlew compileJava` **BUILD SUCCESSFUL**, JS `node --check` 통과.

---

## 5. ⚠️ 컬럼 rename 시 반드시 함께 볼 것

이번 작업에서 실제로 컴파일을 깨뜨린 함정들이다.

1. **PascalCase 접근자를 놓치기 쉽다.**
   `runStatus` 만 치환하면 Lombok 이 만드는 `getRunStatus()` / `setRunStatus()` 가 남아 컴파일 실패한다.
   필드명과 **`get`/`set`/`is`/`has` 접두 형태를 함께** 치환할 것.

2. **접두어가 다른 동일 어근을 놓치기 쉽다.**
   `runStatus` 치환은 `batchRunStatus`(대문자 R)를 **건드리지 않는다.** 별도로 처리해야 한다.

3. **이중 치환 방지.**
   `batchRunStatus` → `batchRunStatusCd` 를 두 번 돌리면 `...CdCd` 가 된다.
   `(?!Cd)` 부정 전방탐색을 쓰거나, 치환 전에 역정규화할 것.

4. **QueryDSL 생성 실패는 엉뚱한 에러로 보인다.**
   `generateQueryDsl` 이 깨지면 `package com.shopjoy...base.common.entity does not exist`,
   `Found no type for BaseEntity` 처럼 **원인과 무관한 메시지**가 뜬다.
   import 를 의심하지 말고 **직전에 바꾼 엔티티 필드**를 확인할 것.

5. **raw SQL 문자열과 레지스트리 매핑**도 대상이다.
   `CmDashboardDataSourceRegistry` 의 SQL 문자열, `TableRegistry.cdFields(Map.of("컬럼","그룹"))` 같은
   문자열 기반 참조는 컴파일러가 잡아주지 않는다.

---

## 6. 2차 정비 (2026-08-13) — `_type` / `_status` / 코드성 `reason`·`result`

### 적용 기준

| 접미어 | 기준 |
|---|---|
| `_type` · `_status` | **무조건** `_type_cd` · `_status_cd` |
| `reason` · `result` | **공통코드 데이터를 담는 경우에만** `_cd` |

`reason`/`result` 는 실제 저장값을 조회해 판정한다. 이름만으로는 구분되지 않는다.

### 변경 (9건)

| 테이블 | 변경 전 | 변경 후 | 값 |
|---|---|---|---|
| `cm_chatt_msg` | `ref_type` | `ref_type_cd` | ORDER/PRODUCT/CLAIM (다른 테이블은 이미 `ref_type_cd` 사용 중이었음) |
| `cm_dashboard_item` | `chart_type` | `chart_type_cd` | bar/line/pie/radar/scatter |
| `mb_device_token` | `os_type` | `os_type_cd` | ANDROID/IOS |
| `sy_attach` | `storage_type` | `storage_type_cd` | LOCAL/AWS_S3/NCP_OBS |
| `sy_vendor` | `vendor_type` | `vendor_type_cd` | SALES 등 |
| `zd_simul_log` | `simul_status` | `simul_status_cd` | SUCCESS/FAIL |
| `mbh_member_token_log` | `revoke_reason` | `revoke_reason_cd` | LOGOUT/FORCE/EXPIRED |
| `syh_user_token_log` | `revoke_reason` | `revoke_reason_cd` | 위와 동일 |
| `syh_ext_test_log` | `test_result` | `test_result_cd` | SUCCESS/FAIL |

인덱스 `sy_attach_ix04_storage_type` → `sy_attach_ix04_storage_type_cd` 동반 변경.
BE 35파일 + FE 18파일 반영. `gradlew clean compileJava` **BUILD SUCCESSFUL**.

### 제외 — 자유 텍스트로 확인됨

실제 저장값이 **문장**이라 코드가 아니다. 이름에 `reason` 이 있어도 대상이 아니다.

| 컬럼 | 실제 저장값 |
|---|---|
| `odh_*_status_hist.status_reason` | "배송완료 후 14일 경과 자동 완료 처리…" |
| `st_settle_adj.adj_reason` | "1월 정산 오류 수정", "우수판매 장려금" |
| `st_settle_close.close_reason` | "2026-01 정산 마감 처리" |
| `st_settle_etc_adj.etc_adj_reason` | "반품배송비 청구", "지연배송 위약금" |
| `syh_send_{email,msg}_log.fail_reason` | "Authentication failed", "SMS API 미연동…" |
| `*_chg_hist.chg_reason` · `appr_reason` · `refund_reason` · `failure_reason` | 코멘트상 자유 입력 (데이터 0건) |

### 보류 1건 — `syh_access_error_log.error_type`

`_type` 이지만 **예외 클래스 FQCN**(`java.lang.IllegalArgumentException`, `org.hibernate.exception…`)을 담는다.
공통코드가 아니므로 `_cd` 를 붙이면 **접미어가 거짓말이 된다**(= `_cd` 를 보고 코드 컬럼이라 믿는 규칙의 목적이 훼손).
접미어 형태를 우선한다면 rename, 의미를 우선한다면 현행 유지 — **의미 우선으로 보류했다.**

> 다만 `error_type` 이라는 이름이 오해를 부르므로, 코드성이 아님을 드러내는
> `error_class` 같은 이름으로 바꾸는 편이 더 낫다(별도 판단 필요).

---

## 관련 문서

- [`sy.52.ddl단어사전규칙.md`](sy.52.ddl단어사전규칙.md) — DDL 컬럼 명명 전반
- [`sy.08.공통코드.md`](sy.08.공통코드.md) — 코드그룹 목록·정본
- [`../ec/pd/pd.11.상품유형-구성요건.md`](../ec/pd/pd.11.상품유형-구성요건.md) §7 — 코드그룹명 정합 점검
