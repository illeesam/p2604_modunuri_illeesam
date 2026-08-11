# 정산 화면 ↔ 백엔드 불일치 (2026-08-10 발견)

## 요약

정산 4개 화면의 **그리드 컬럼 key 가 백엔드 응답 DTO 필드와 거의 겹치지 않는다.**
DB · Entity · DTO 3계층은 서로 일치하며 **프론트만 다른 설계를 전제**로 만들어져 있다.

4개 화면 모두 `boAppMenuData.js` 에 등록되어 실제 렌더된다(프로토타입 아님).
따라서 현재 사용자에게는 **값이 비어 보이는 그리드**가 노출되고 있을 가능성이 높다.

| 테이블 | 행수 |
|---|---|
| `st_settle_close` | 8 |
| `st_settle_pay` | 7 |
| `st_settle_adj` | 5 |
| `st_settle_etc_adj` | 5 |

데이터는 실제로 들어 있으므로 "데이터가 없어서 안 보이는" 것이 아니다.

---

## 화면별 불일치

### StSettleCloseMng (정산마감)

| 프론트 컬럼 | 백엔드 Item 필드 | 비고 |
|---|---|---|
| `closeMon` | — | **없음.** 정산월 개념이 DB 에 없다 |
| `sales` `refund` `net` `comm` `promo` `settle` | — | **없음.** DB 는 `final_settle_amt` 하나만 저장 |
| `status` | `closeStatusCd` | 이름 불일치 |
| `regUserNm` | `regBy` | ID 만 있음(이름 조인 없음) |
| — | `settleCloseId` `settleId` `closeReason` `closeBy` `closeDate` | 화면이 안 쓰는 실제 필드 |

⚠ **저장 경로도 어긋난다.**
`boApiSvc.stSettleClose.create({ closeMon, sales, refund, net, comm, promo, settle })` 로 보내는데
백엔드에 해당 필드가 없어 **값이 전부 버려질 가능성이 크다.**

### StSettleAdjMng (정산조정)

| 프론트 | 백엔드 |
|---|---|
| `adjId` | `settleAdjId` |
| `adjType` | `adjTypeCd` |
| `reason` | `adjReason` |
| `adjDate` | — (없음, `regDate` 로 대체 가능) |
| `vendorNm` `regUserNm` | — (조인 필드 없음. `vendorId` 도 이 DTO 엔 없음) |

### StSettleEtcAdjMng (정산기타조정)

| 프론트 | 백엔드 |
|---|---|
| `adjId` | `settleEtcAdjId` |
| `adjType` | `etcAdjTypeCd` |
| `adjAmt` | `etcAdjAmt` |
| `reason` | `etcAdjReason` |
| `aprvStatusCd` | — (`st_settle_adj` 에만 있고 이 테이블엔 없음) |
| `vendorNm` `adjDate` `regUserNm` | — |

### StSettlePayMng (정산지급관리)

| 프론트 | 백엔드 |
|---|---|
| `payId` | `settlePayId` |
| `settleAmt` | `payAmt` |
| `payStatus` | `payStatusCd` |
| `vendorNm` | `vendorId` 만 있음 |
| `closeMon` `regUserNm` | — |

---

## 왜 기계적으로 못 고치는가

1. **이름 불일치가 아니라 설계 불일치다.**
   `sales`/`refund`/`net`/`comm`/`promo` 는 주문·클레임을 집계한 파생값인데
   DB 는 `final_settle_amt` 하나만 저장한다. 이름을 바꿔서 될 문제가 아니다.
2. **표시명 필드가 백엔드에 없다.**
   `vendorNm` / `regUserNm` / `closeMon` 은 Item 에 없다. 프론트만 고치면
   화면에 **ID 가 그대로 노출**되어 퇴화한다. 제대로 하려면 DTO + QueryDSL 에 조인 필드를 추가해야 한다.
3. **금액을 다루는 화면이다.** 매핑을 추측하면 *틀린 숫자*를 보여주게 되는데,
   이는 빈 화면보다 위험하다. 그래서 추측 수정을 하지 않았다.

---

## 선택지

| 안 | 내용 | 비용 / 리스크 |
|---|---|---|
| **A. 백엔드를 화면에 맞춘다** | Item 에 `vendorNm`·`closeMon`·`regUserNm` 조인 추가 + 집계값(sales/refund/…) 산출 로직 | 큼. 다만 화면 기획 의도는 보존 |
| **B. 화면을 백엔드에 맞춘다** | 그리드 컬럼을 실제 DTO 필드로 교체, 없는 컬럼은 제거 | 작음. 단 화면이 단순해지고 ID 노출 |
| **C. 절충** | 이름 불일치만 먼저 정정(`adjId`→`settleAdjId` 등)하고, 조인 필드는 백엔드에 추가 | 권장 |

**C 를 권장한다.** 이름만 맞추면 실제 저장된 데이터가 즉시 화면에 뜨고,
표시명(`vendorNm` 등)은 백엔드 조인 추가로 단계적으로 채울 수 있다.

⚠ 어느 안이든 **`StSettleCloseMng` 의 저장 경로(create 파라미터)를 먼저 확인**할 것.
지금 구조면 마감 데이터가 저장되지 않고 있을 수 있다.

---

## 점검 방법 (재현)

```bash
# 프론트 그리드 컬럼 key ↔ 백엔드 응답 DTO 필드 대조
node c:/tmp/audit_grid.js
# 프론트 검색 키 ↔ 백엔드 Request 필드 대조
node c:/tmp/audit_search.js
```

⚠ 오탐 주의: `fmt: () => ...` 로 프론트가 값을 만드는 컬럼(예: `siteNm`)은
row 필드가 없어도 정상이다. 감사 결과에서 걸러야 한다.
