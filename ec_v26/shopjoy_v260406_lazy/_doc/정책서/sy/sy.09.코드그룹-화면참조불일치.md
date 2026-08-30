# 공통코드 그룹 — 화면 참조 불일치 (2026-08-10 감사 / 2026-08-12 정정 완료)

## 왜 중요한가

화면은 `codeStore.saLoadCodes(['GRP_A','GRP_B'])` 로 공통코드를 불러온다.
요청한 그룹이 `sy_code_grp` 에 **없으면 에러가 나지 않고 빈 배열**이 돌아온다.
결과적으로 select 드롭다운이 조용히 비어, 사용자는 "선택할 게 없다"고만 느낀다.

**감사 결과**: 코드그룹 요청 304건 / DB 그룹 245개 → **존재하지 않는 그룹 16종**
**2026-08-12 전수 정정 완료** — 13종 전부 처리(오타 1건 정정 + 죽은 요청 12건 제거).

---

## 정정 완료 (4종) — 이름만 달랐던 것

| 화면 | 잘못된 그룹 | 실제 그룹 |
|---|---|---|
| `PmDiscntMng` | `DISCOUNT_STATUS` | **`DISCNT_STATUS`** |
| `PdProdMng` | `OPTION_TYPE` | **`OPT_TYPE`** |
| `StReconPayMng` | `PAYMENT_STATUS` | **`PAY_STATUS`** |
| `StErpGenMng`, `StErpViewMng` | `ERP_STATUS` | **`ERP_VOUCHER_STATUS_KR`** |

`ERP_STATUS`는 실제로는 `coUtil.cofCodeBadge()`를 통해 뱃지 표시에 쓰이고 있었다(단순 select 옵션이 아님).
호출부가 `'전송완료'`/`'생성완료'`/`'오류'` 같은 **한글 값**을 넘기고 있어, 대응하는 그룹은
영문 코드값 그룹(`ERP_VOUCHER_STATUS`)이 아니라 한글 라벨 그룹(`ERP_VOUCHER_STATUS_KR`)이었다.

**신규 화면 작성 시 그룹명은 반드시 `sy_code_grp` 에서 확인하고 복사할 것.**

---

## 제거 완료 (12종) — DB 에 대응 컬럼 자체가 없는 죽은 요청

아래 12종은 각 화면의 엔티티에 대응 상태/타입 컬럼이 애초에 없었고(`use_yn` 만 있거나 컬럼 자체가 없음),
로드된 값이 실제로 어떤 select/badge 에서도 읽히지 않는 **죽은 API 호출**이었다(선언 → saLoadCodes → 대입,
그리고 끝 — 소비처 0건). 매 화면 로드마다 존재하지 않는 그룹을 요청해 빈 배열을 받던 낭비였다.
`saLoadCodes([...])` 배열, `codes` reactive 스캐폴드, 대입문을 함께 제거했다.

| 그룹 | 화면 | 확인한 근거 |
|---|---|---|
| `ATTACH_TYPE` | SyAttachMng | `sy_attach` 에 타입 컬럼 없음(`mime_type_cd`/`storage_type` 뿐) |
| `BBM_STATUS` | SyBbmMng | `sy_bbm` 에 상태 컬럼 없음(`use_yn` 뿐) |
| `BLOG_DISPLAY_STATUS` | CmBlogMng | `cm_blog` 에 노출상태 컬럼 없음(`use_yn`/`blog_type_cd` 뿐) |
| `BRAND_STATUS` | SyBrandMng | `sy_brand` 에 상태 컬럼 없음(`use_yn` 뿐) |
| `CACHE_STATUS` | PmCacheMng | `pm_cache` 에 상태 컬럼 자체 없음 |
| `DLIV_TEMPLATE_TYPE` | PdDlivTmpltMng | `pd_dliv_tmplt` 에 해당 컬럼 없음(`dliv_method_cd` 등은 이미 별도 로드 중) |
| `ERP_RECON_STATUS` | StErpReconMng | select 는 실제로 `ERP_RECON_RESULT`(정상 로드됨)를 쓰고 있었음. 완전 중복 |
| `MENU_STATUS` | SyMenuMng | `sy_menu` 에 상태 컬럼 없음(`use_yn` 뿐) |
| `ROLE_STATUS` | SyRoleMng | `sy_role` 에 상태 컬럼 없음(`use_yn` 뿐) |
| `SAVE_STATUS` | PmSaveMng | `pm_save` 에 상태 컬럼 자체 없음 |
| `SUBSCRIPTION_PERIOD` | PmPlanMng | `pm_plan` 에 주기 개념 컬럼 없음 |
| `VENDOR_SETTLE_STATUS` | StReconVendorMng | 화면은 실제로 `RECON_RESULT_VENDOR`(정상 로드됨)만 사용 중이었음 |

향후 이 화면들에 실제 상태값이 필요해지면, DB 컬럼을 먼저 추가하고(업무 판단 필요) 그 다음 코드그룹을 등록할 것.
추측으로 코드를 먼저 만들면 잘못된 선택지가 사용자에게 노출된다.

---

## 재현 방법

```bash
# 1) DB 그룹 목록 추출
#    SELECT code_grp FROM shopjoy_2604.sy_code_grp  →  c:/tmp/code_grps.txt
# 2) 화면의 saLoadCodes([...]) 요청과 대조
node c:/tmp/audit_codegrp.js
# 3) 로드된 codes.xxx 변수가 실제 select/badge 에서 읽히는지 확인 (죽은 요청 판별)
grep -n "codes\.<변수명>" pages/bo/**/*.js
```
