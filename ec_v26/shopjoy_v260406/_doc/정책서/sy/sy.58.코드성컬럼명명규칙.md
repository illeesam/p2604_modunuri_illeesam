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

## 7. 다국어(i18n) 저장 방식 — 언어별 컬럼 (2026-08-13)

### 결정

**지원 언어 4종 고정: 한국어(`ko`) / 영어(`en`) / 중국어(`cn`) / 일본어(`ja`)**
번역은 **행이 아니라 컬럼**으로 저장한다.

| 테이블 | 방식 |
|---|---|
| `sy_i18n` | `i18n_msg_ko` / `i18n_msg_en` / `i18n_msg_cn` / `i18n_msg_ja` |
| `sy_code` | `code_label` / `code_label_en` / `code_label_cn` / `code_label_ja` *(예정)* |

`sy_i18n_msg`(키 1건 = 언어 N행) 는 **폐기(DROP)** 했다.

### 왜 컬럼인가

- UI 문자열·코드 라벨은 **호출 빈도가 가장 높은 축**이다. 조인 없이 한 행에서 끝난다.
- 관리 화면에서 **한 행에 모든 언어를 나란히** 놓고 번역할 수 있어 누락이 즉시 보인다.
  (통합 전 129키 중 17건이 번역 1개뿐이었는데 화면에서 드러나지 않았다.)
- 로케일별 조회 로직이 `sy_i18n` / `sy_code` 양쪽에서 동일해진다.

### 감수하는 비용

**언어 추가 = DDL 변경**(`ALTER TABLE` + Entity + DTO + 관리화면).
행 방식이면 INSERT 로 끝난다. **4종 고정을 전제로 한 선택**이므로,
지원 언어가 수시로 늘어나는 상황이 되면 이 결정을 재검토해야 한다.

### 이관 결과 (2026-08-13)

| 항목 | 결과 |
|---|---|
| 키 | 129건 (변동 없음) |
| 이관 | `ko` 92 / `en` 108 / `ja` 7 — **전건 일치 검증 후 커밋** |
| 폐기 | `in`(인도네시아어) 21건 — 지원 언어 제외 결정 |
| `cn` | 0건 (신규 컬럼, 번역 입력 필요) |

동반 변경:

- `SyI18n` Entity + `SyI18nDto.Item` 에 언어 4컬럼 추가
- `BoSyI18nService.saveMsgs()` — 요청 형태(`{"msgs":{"ko":"…"}}`)는 **그대로 유지**하고
  내부만 언어컬럼 반영으로 교체. 미지원 언어코드는 무시
- `CacheRedisReloadService.reloadI18n()` — 캐시 자료구조(`langCd → (i18nId → msg)`)는 유지,
  소스만 교체. **빈 문자열은 캐시에 담지 않는다**(담으면 "번역 있음"으로 오인돼 기본언어 폴백이 안 됨)
- `SyI18nMsg*` 7개 파일 삭제 (Entity/Dto/Controller/Service/Repository/Q\*2)
- 프론트 `SyI18nMng.js` — 지원 언어 `['ko','en','cn','ja']`, 번역을 **행에서 직접** 읽도록 변경

### 키 규칙 (2026-08-13 2차)

`i18n_key` 는 **단독 UNIQUE** 다. (`UNIQUE (i18n_key, i18n_scope_cd)` → `UNIQUE (i18n_key)`)
따라서 **비교·조회·행 식별은 `i18n_id` 가 아니라 `i18n_key` 로 한다.**

- Redis 캐시: `langCd → (i18nKey → 메시지)`
  ← 이전엔 `i18nId` 로 잡혀 있어 `t('common.bt.save')` 조회 때마다 키→ID 를 다시 찾아야 해 캐시가 무의미했다
- 관리화면: `row-key="i18nKey"`, 선택 상태도 `uiState.selectedKey`

#### ⛔ 키는 **영문 + 숫자만**, 구분자는 **`.` 하나뿐**

**한글을 키에 넣지 않는다.** 키는 코드에서 타이핑하는 식별자이므로 영문이어야 한다.

| 대상 | 키 형식 | 예 |
|---|---|---|
| 공통코드 | `syCode.{code_grp}.{code_value}` | `syCode.PLAN_TYPE.GENERAL` |
| UI 문자열 | `{분류}.{camelCase(영문번역)}` | `label.productName`, `msg.loginIsRequired`, `button.save` |
| 키 충돌 | 뒤에 `_02`, `_03` | `label.status_02` |

분류(`i18n_category`): `label` / `text` / `msg` / `ph`(placeholder) / `title` / `code`

> **키는 영문 번역에서 파생된다.** 따라서 `i18n_msg_en` 이 없으면 키를 만들 수 없다.
> 수집 순서는 **한국어 적재 → 영문 번역 → 영문 키 생성** 이다.
> 번역 전 임시로 한글 키를 쓰지 말 것(전환 비용만 커진다).

**변수 자리는 `{0}`, `{1}` 로 표기한다.**
소스의 `` `${x}` `` 와 `{{ x }}` 를 수집 시 순서대로 치환한다.
치환하지 않고 버리면 `"선택한 {0}건의 클레임유형을 [{1}](으)로 변경하시겠습니까?"` 같은
**변수 포함 메시지가 통째로 누락**된다.

### 수집 결과 (2026-08-13)

소스 전체(`pages`/`lib`/`components`)와 공통코드에서 자동 수집해 적재했다.

| 분류 | 건수 | 출처 |
|---|---|---|
| `label` | 1,891 | `label:` / `nullLabel:` |
| `text` | 1,662 | 템플릿 텍스트 노드 |
| `code` | 822 | `sy_code.code_label` (한글 라벨만) |
| `msg` | 401 | `showToast()` / `showAlert()` / `showConfirm()` 2번째 인자 |
| `ph` | 176 | `placeholder:` |
| `title` | 112 | `title:` / `showConfirm()` 1번째 인자 |

**1차 수집 5,189건** (신규 5,060 + 기존 129). 플레이스홀더 151건.

수집 제외 기준: 한글 미포함 / 100자 초과(장문 설명) / 숫자·기호만 / 조사로 시작하는 문장 조각.
끝의 `:` 와 필수표시 `*` 는 장식이므로 제거 후 동일 항목으로 합친다.

### 영문 키 전환 후 현재 상태

`i18n_msg_ko` 는 **NOT NULL** 이다(빈 값 37건 삭제 후 적용).

| 단계 | 결과 |
|---|---|
| 1차 수집 | 5,189건 |
| 빈 ko·문법조각 정리 | −40건 |
| 1차 번역 (397 고유문구) | 845행에 en/cn/ja 반영 |
| **영문 키 생성 불가 행 삭제** | **−3,615건** (영문 번역이 없어 영문 키를 만들 수 없음) |
| **현재** | **1,535건** (UI 713 + 코드 822) |

> 삭제한 3,615건은 소스에 그대로 있으므로 **번역이 진행되는 만큼 재수집**하면 된다.
> 수집기: `c:/tmp/gen.js` → 적재 `c:/tmp/Load.java` → 번역적용 `c:/tmp/Apply.java` → 키전환 `c:/tmp/Rekey.java`

### 공통코드 값 영문 전환 (2026-08-13 완료)

`sy_code.code_value` 에 한글이 들어 있으면 `syCode.APPROVAL_ACTION.보류` 처럼 키에 한글이 남는다.
**코드값 자체를 영문으로 전환**해 해소했다.

| 대상 | 결과 |
|---|---|
| `sy_code.code_value` | **190건 전환** + 중복 8건 삭제 (48개 그룹) |
| `sy_contact.category_cd` (의존 업무데이터) | **29건 전환** |
| `sy_i18n.i18n_key` | **112건 전환** + 중복 5건 삭제 |
| 프론트 `필드Cd === '한글'` 비교 | **74곳 / 23파일** 치환 |

검증: `sy_code` 한글 코드값 **0건**, `sy_i18n` 한글 키 **0건**.

**세 곳을 한 트랜잭션으로** 처리했다 — 코드표·업무데이터·i18n 키 중 하나만 바뀌면
라벨이 빈칸이 되거나 필터가 조용히 안 걸린다.

#### 이 작업에서 실제로 걸린 함정

1. **같은 한글이 그룹마다 다른 영문**이 된다.
   `판매업체` 는 `PM_PROD_TARGET` 에서 `VENDOR`, `VENDOR_TYPE_KR` 에서 `SALES` 다.
   프론트 치환은 **필드명 단위 매핑**으로 해야 하고, 한글 문자열 일괄 치환은 반드시 틀린다.
2. **영문 코드가 이미 있는데 한글 코드가 중복 존재**하는 그룹이 있다
   (`USER_ROLE.슈퍼관리자` + `USER_ROLE.SUPER_ADMIN`).
   rename 하면 UNIQUE 충돌 → **한글 쪽을 삭제**해야 한다.
3. 업무 데이터에 한글 코드값이 저장된 곳을 **`*_cd` 컬럼 279개 전수 조회**로 찾았다.
   추측으로 몇 개만 확인하면 놓친 테이블에서 조용히 깨진다.

#### 남은 잔재 (코드표에 없는 값과 비교 — 원래부터 죽은 분기)

`OdOrderMng.js` 의 `orderStatusCd === '자동취소'` / `=== '입금대기'` 는
`ST_STATUS_ORDER` 코드표에 **없는 값**이라 전환 전에도 매칭된 적이 없다.
동작을 바꾸게 되므로 임의로 지우지 않았다 — 업무 확인 후 정리 대상.

> ⚠️ **공통코드 번역은 `sy_i18n` 단일 관리**다.
> `sy_code` 에는 `code_label`(한국어)만 두고 **`code_label_en`/`cn`/`ja` 를 추가하지 않는다.**
> 두 곳에 두면 번역본이 갈라져 어느 쪽이 정본인지 알 수 없게 된다.
>
> 운영 데이터(상품명·카테고리명·게시글 등)는 `sy_i18n` 대상이 **아니다.**
> 등록할 때마다 마스터가 무한히 불어나고 관리 주체가 꼬인다 —
> 필요하면 해당 테이블에 다국어 컬럼을 둔다.

### 통합 과정에서 발견한 기존 결함

- 화면의 `i18nMsgs` 배열이 **서버에서 한 번도 채워지지 않았다**(GET `/{id}/msgs` 엔드포인트 자체가 없음).
  즉 번역 컬럼이 항상 빈칸으로 보였다. 통합으로 목록 응답에 번역이 실려 해소됐다.
- 저장 시 **API 호출 전에 로컬 배열을 먼저 수정**해 실패해도 저장된 것처럼 보였다.
  저장 성공 후 재조회하도록 수정했다.
- `boApiSvc.syI18n.getMsgs()` — 대응 백엔드 엔드포인트가 없는 죽은 호출이라 제거했다.

---

## 8. 코드그룹명 = 참조 컬럼명 대문자 (2026-08-13 3차)

### 결정

`sy_code_grp.code_grp` 의 값을 **해당 그룹을 참조하는 DB 컬럼명의 대문자형**과 일치시킨다.
예: `pd_prod.prod_type_cd` 를 참조하는 그룹은 `PROD_TYPE` 이 아니라 **`PROD_TYPE_CD`**.

목적은 그룹명만 보고 "어느 컬럼이 이 코드를 쓰는지" 역추적 가능하게 하는 것이다.

### 적용 범위 판단 — 왜 전체(247개)가 아니라 105개인가

컬럼 코멘트(`(코드: X)`)를 근거로 전수 조사한 결과, **이 규칙이 성립하는 그룹은 전체의 43%뿐**이었다.

| 구분 | 건수 | 처리 |
|---|---|---|
| 컬럼 1개와 1:1 매핑 | 91개 | **적용** — 대문자 그대로 |
| 컬럼 여러 개가 공유(본값+`_before`/`_after` 이력값 패턴) | 14개 | **적용** — 본값 컬럼을 대표로 |
| 컬럼 여러 개가 공유(진짜 다른 개념) | 7개 | **제외** — 대표를 못 정함 |
| **신규 이름이 다른 그룹과 충돌** | 20개 | **제외** — 아래 §8-2 |
| 대응 컬럼 코멘트 없음(범용 재사용 목록) | 114개 | **제외** — "해당 컬럼"이 없음 |

**적용 105건**(91+14, 충돌 발견분 재조정 포함). 나머지는 그룹명을 그대로 유지한다.

### 8-1. 대표 컬럼으로 해소한 14개 (본값 + 이력값 패턴)

`appr_status_cd` / `appr_status_cd_before` 처럼 "본값 + 변경 전 이력값" 짝인 경우 본값 컬럼을 대표로 삼는다.

`APPR_STATUS`→`APPR_STATUS_CD`, `CLAIM_ITEM_STATUS`→`CLAIM_ITEM_STATUS_CD`, `CLAIM_STATUS`→`CLAIM_STATUS_CD`,
`COMMENT_STATUS`→`COMMENT_STATUS_CD`, `COUPON_STATUS`→`COUPON_STATUS_CD`,
`DISP_STATUS`→**`DISP_PANEL_STATUS_CD`**(대표 컬럼이 `disp_panel_status_cd` 라 그룹명과 어긋나 보이지만 컬럼명 그대로),
`EVENT_STATUS`→`EVENT_STATUS_CD`, `MEMBER_STATUS`→`MEMBER_STATUS_CD`,
`ORDER_ITEM_STATUS`→`ORDER_ITEM_STATUS_CD`, `ORDER_STATUS`→`ORDER_STATUS_CD`, `PAY_STATUS`→`PAY_STATUS_CD`,
`PROD_STATUS`→`PROD_STATUS_CD`, `REFUND_STATUS`→`REFUND_STATUS_CD`, `REVIEW_STATUS`→`REVIEW_STATUS_CD`

### 8-2. 제외 — 대표를 정할 수 없는 7개 (진짜 다른 개념 공유)

| 그룹 | 공유 컬럼 (서로 다른 개념) |
|---|---|
| `COURIER` | 배송·반품·교환·입고·출고 택배사 — 5개 |
| `DLIV_STATUS` | 배송상태 / 반품상태 / 배송품목상태 — 3개+이력 |
| `PAY_METHOD` | 결제수단 / 결제수단유형 — 2개 |
| `MEMBER_GRADE` | 등급 / 주문등급 / 회원등급 — 3개 |
| `APP_TYPE` | 토큰유형 / 앱유형 — 2개 (진짜 다른 의미) |
| `BANK_CODE` | 환불계좌은행 / 가상계좌은행 — 2개 (범용 은행 목록) |
| `BATCH_STATUS` | **오염된 그룹** — 아래 참조 |

**`BATCH_STATUS` 부수 발견**: 정의상태(`ACTIVE`/`INACTIVE`)와 실행결과(`PENDING`/`RUNNING`/`DONE`/`FAILED`)가
**한 그룹에 섞여** 있다. 별도로 존재하는 `BATCH_RUN_STATUS`(`SUCCESS`/`FAILED`/`RUNNING`/`IDLE`) 그룹이
실행결과의 정본으로 보인다. 게다가 `sy_batch.batch_run_status_cd` 실제 저장값에 **`FAIL`**(오타, 두 그룹 모두 `FAILED`)이
있어 그 값은 항상 라벨이 빈칸이다. **이번 작업 범위 밖이라 손대지 않았다** — 어느 컬럼을 어느 그룹으로 재배정할지는 업무 판단 필요.

### 8-3. 제외 — 이름 충돌 20건 (7클러스터)

**컬럼명이 도메인마다 로컬하게 재사용되는 것**(`content_type_cd`, `channel_cd` 등)과
**그룹명은 전역에서 유일해야 하는 것**이 충돌한다. 강제로 합치면 서로 다른 코드 목록이 하나로 뭉개진다.

| 충돌 후보 이름 | 원래 그룹들 (전부 다른 코드 목록) |
|---|---|
| `CHANNEL_CD` | `ALARM_CHANNEL`, `MSG_CHANNEL`, `PUSH_CHANNEL` |
| `CHG_TYPE_CD` | `PAYMENT_CHG_TYPE`, `SKU_CHG_TYPE` |
| `CONTENT_TYPE_CD` | `BBM_CONTENT_TYPE`, `PROD_CONTENT_TYPE`, `VENDOR_CONTENT_TYPE` |
| `DISCNT_TYPE_CD` | `DISCNT_TYPE`, `ORDER_DISCNT_TYPE`, `ORDER_ITEM_DISCNT_TYPE` |
| `PAY_STATUS_CD` | `PAY_STATUS`, `SETTLE_PAY_STATUS` |
| `RESULT_CD` | `LOGIN_RESULT`, `PUSH_RESULT`, `SEND_RESULT` |
| `TARGET_TYPE_CD` | `ALARM_TARGET_TYPE`, `EVENT_TARGET`, `LIKE_TARGET_TYPE`, `PROMO_TARGET_TYPE` |

**이 20개는 그룹명을 그대로 유지한다.**

### 8-4. ⚠️ 실제로 사고가 났던 지점 — `USE_YN`

자동화 1차 적용에서 **`USE_YN` → `CATEGORY_STATUS_CD_BEFORE`** 로 잘못 rename 되어
**DB `sy_code_grp`·소스코드 23개 파일·`sy_i18n` 키까지 실제로 반영됐다.**

원인: `pd_category.category_status_cd_before`(이력 컬럼)의 **낡은 코멘트**가 `(코드: USE_YN)` 이라고 잘못 남아 있었다.
`USE_YN`은 전사에서 광범위하게 재사용되는 범용 Y/N 그룹인데, 이 낡은 코멘트 하나가 "1:1 매핑"으로 오판되게 만들었다.

**감지 방법**: 적용 후 화면(`SyI18nMng.js`)에서 `sgGetGrpCodes('USE_YN')` 호출이
엉뚱한 그룹명으로 바뀐 것을 발견 → 즉시 DB 재확인 → 실제 반영 확인 → 롤백.

**전수 재검사 결과**: 적용된 106건 중 "근거 컬럼이 전부 `_before`/`_after` 뿐인 경우"는 **`USE_YN` 1건뿐**이었다.
나머지는 안전.

**교훈**: 컬럼 코멘트를 근거로 삼을 때, **그 컬럼이 `_before`/`_after` 이력 컬럼뿐이고 그룹명이
범용적으로 들리면(YN/STATUS/TYPE 등 흔한 단어) 반드시 실사용 범위를 먼저 확인**할 것.
이력 컬럼의 코멘트는 원본 컬럼 마이그레이션 시 갱신이 누락되기 쉽다.

### 실행 결과

- DB: `sy_code_grp` 105건 rename, `sy_i18n.i18n_key` 366건 동기화 (`syCode.{OLD}.` → `syCode.{NEW}.`)
- 소스: 백엔드 Java 106개 파일 + 프론트 JS 114개 파일, 총 500곳 치환 (`codeGrp.eq("X")`, `saLoadCodes(['X'])`, `sgGetGrpCodes('X')`, Entity 코멘트 `코드: X`)
- 검증: `sy_code_grp` 총 행수 247(불변) / 고유값 247(중복 rename 없음) / `sy_i18n` 총 행수 1530(불변, UPDATE만 수행) / 한글 키 0건
- `gradlew clean compileJava` **BUILD SUCCESSFUL**, 변경 JS `node --check` 전체 통과

### 재현 방법

```bash
# ① DB 컬럼 코멘트 "(코드: X)" 전수 스캔 → 그룹별 컬럼 매핑
# c:/tmp/GrpColMap.java 참조

# ② 다중공유 그룹의 실제 코드값 확인(대표 판단용)
# c:/tmp/MultiChk.java 참조

# ③ rename 맵 생성 + 충돌 검사(신규이름 중복 / 기존 그룹명과 충돌)
# c:/tmp/BuildMap.java → c:/tmp/rename_map.txt

# ④ DB 적용(sy_code_grp + sy_i18n.i18n_key 동기화, 한 트랜잭션)
# c:/tmp/ApplyRename.java

# ⑤ 소스 문자열 리터럴 치환(백엔드+프론트)
# c:/tmp/ferename.js

# ⑥ 위험군 재검사 — _before/_after 단독 근거 그룹 여부
# c:/tmp/AuditRisk.java
```

## 관련 문서

- [`sy.52.ddl단어사전규칙.md`](sy.52.ddl단어사전규칙.md) — DDL 컬럼 명명 전반
- [`sy.08.공통코드.md`](sy.08.공통코드.md) — 코드그룹 목록·정본
- [`../ec/pd/pd.11.상품유형-구성요건.md`](../ec/pd/pd.11.상품유형-구성요건.md) §7 — 코드그룹명 정합 점검
