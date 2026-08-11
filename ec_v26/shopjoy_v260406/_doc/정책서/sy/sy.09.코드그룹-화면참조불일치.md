# 공통코드 그룹 — 화면 참조 불일치 (2026-08-10 감사)

## 왜 중요한가

화면은 `codeStore.saLoadCodes(['GRP_A','GRP_B'])` 로 공통코드를 불러온다.
요청한 그룹이 `sy_code_grp` 에 **없으면 에러가 나지 않고 빈 배열**이 돌아온다.
결과적으로 select 드롭다운이 조용히 비어, 사용자는 "선택할 게 없다"고만 느낀다.

**감사 결과**: 코드그룹 요청 304건 / DB 그룹 245개 → **존재하지 않는 그룹 16종**

---

## 정정 완료 (3종) — 이름만 달랐던 것

| 화면 | 잘못된 그룹 | 실제 그룹 |
|---|---|---|
| `PmDiscntMng` | `DISCOUNT_STATUS` | **`DISCNT_STATUS`** |
| `PdProdMng` | `OPTION_TYPE` | **`OPT_TYPE`** |
| `StReconPayMng` | `PAYMENT_STATUS` | **`PAY_STATUS`** |

`DISCOUNT`↔`DISCNT` 처럼 축약 표기가 엇갈린 사례다.
**신규 화면 작성 시 그룹명은 반드시 `sy_code_grp` 에서 확인하고 복사할 것.**

---

## 미해결 (13종) — DB 에 코드 자체가 없음

유사 그룹을 찾아봤으나 **대체할 그룹이 없다.** 코드값을 새로 정의해야 한다.

| 그룹 | 사용 화면 | 참고 (DB 에 있는 인접 그룹) |
|---|---|---|
| `ATTACH_TYPE` | SyAttachMng | `BBM_ATTACH_TYPE` 만 존재 |
| `BBM_STATUS` | SyBbmMng | `BBM_TYPE`/`BBM_SCOPE_TYPE` 는 있으나 STATUS 없음 |
| `BLOG_DISPLAY_STATUS` | CmBlogMng | `BLOG_TYPE` 만 존재 |
| `BRAND_STATUS` | SyBrandMng | `BRAND_CONTRACT` 만 존재 |
| `CACHE_STATUS` | PmCacheMng | `CACHE_TYPE`/`CACHE_TRANS_TYPE` 는 있음 |
| `DLIV_TEMPLATE_TYPE` | PdDlivTmpltMng | `DLIV_TYPE`/`DLIV_COST_TYPE` 는 있음 |
| `ERP_STATUS` | StErpGenMng, StErpViewMng | `ERP_VOUCHER_STATUS` 가 의도한 것일 수 있음 — 확인 필요 |
| `ERP_RECON_STATUS` | StErpReconMng | `ERP_RECON_RESULT` 가 의도한 것일 수 있음 — 확인 필요 |
| `MENU_STATUS` | SyMenuMng | `MENU_TYPE` 만 존재 |
| `ROLE_STATUS` | SyRoleMng | — |
| `SAVE_STATUS` | PmSaveMng | `SAVE_ISSUE_STATUS` 는 있음 |
| `SUBSCRIPTION_PERIOD` | PmPlanMng | 유사 그룹 없음 |
| `VENDOR_SETTLE_STATUS` | StReconVendorMng | — |

### 처리 방향

1. **`ERP_STATUS` / `ERP_RECON_STATUS`** 는 인접 그룹(`ERP_VOUCHER_STATUS` / `ERP_RECON_RESULT`)이
   의도한 대상일 가능성이 높다. 화면에서 무엇을 표시하려 했는지 확인 후 이름만 정정하면 된다.
2. 나머지는 **코드값을 새로 정의**해야 한다. 어떤 상태값이 필요한지는 업무 판단이므로
   추측으로 코드를 만들면 안 된다(잘못된 선택지가 사용자에게 노출된다).
3. 코드를 추가하면 `sy_code_grp` + `sy_code` 양쪽에 넣고,
   샘플 시딩 파일(`_doc/sample_insert_pgsql/sy_code*.sql`)도 재생성할 것.

---

## 재현 방법

```bash
# 1) DB 그룹 목록 추출
#    SELECT code_grp FROM shopjoy_2604.sy_code_grp  →  c:/tmp/code_grps.txt
# 2) 화면의 saLoadCodes([...]) 요청과 대조
node c:/tmp/audit_codegrp.js
```
