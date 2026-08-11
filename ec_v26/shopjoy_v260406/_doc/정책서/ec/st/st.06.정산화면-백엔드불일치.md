# 정산 화면 ↔ 백엔드 불일치 (2026-08-10 발견 / 2026-08-12 정정 완료)

## 요약

정산 4개 화면의 **그리드 컬럼 key 가 백엔드 응답 DTO 필드와 거의 겹치지 않았다.**
DB · Entity · DTO 3계층은 서로 일치하는데 **프론트만 다른 설계(주문·클레임 집계 기반 정산월)를
전제로 만들어져 있었다.**

**2026-08-12 — 안 B(화면을 백엔드에 맞춘다)로 4개 화면 전부 재작성 완료.**
`StSettlePayMng` 은 이전 세션에서 먼저 정정됨. 이번엔 `StSettleCloseMng` / `StSettleAdjMng` /
`StSettleEtcAdjMng` 3개를 정정했다.

---

## 재설계 방향

`sales`/`refund`/`net`/`comm`/`promo` 같은 주문·클레임 파생 집계값은 DB 어디에도 저장되지 않는다.
정산 마스터(`st_settle`)가 이미 `totalOrderAmt`/`totalReturnAmt`/`commissionAmt`/`settleAmt`/
`adjAmt`/`etcAdjAmt`/`finalSettleAmt` 를 보유하고 있으므로(별도 집계 배치가 채우는 값),
화면은 **이 값을 그대로 표시**하고, 조정·마감은 `settleId` 로 정산 마스터를 참조하는
구조로 다시 짰다.

### StSettleCloseMng (정산마감)

- "이번달 마감 대상"(주문·클레임 재계산 카드) → **정산확정(`settleStatusCd='CONFIRMED'`) 상태의
  `st_settle` 목록**으로 교체. 행별 `[마감]` 버튼 클릭 시 그 `settleId` 를 참조하는
  `st_settle_close` 레코드를 생성한다.
- 저장 payload: `{ settleId, closeStatusCd:'CLOSED', finalSettleAmt, closeBy }` — 엔티티 NOT NULL
  전부 충족. 이전에는 `closeMon`/`sales`/`refund`/... 를 보내 전부 버려지고 INSERT 가 거부됐다.
- `closeStatusCd` 는 `SETTLE_STATUS`(CG000121) 코드값 `OPEN`/`CLOSED` 를 그대로 쓴다
  (`reopen()` 서비스가 실제로 `'OPEN'` 을 쓰기 때문 — 별도 한글 그룹을 쓰면 저장값과 어긋난다).

### StSettleAdjMng (정산조정) / StSettleEtcAdjMng (정산기타조정)

- `vendorId`/`vendorNm` 대신 **`settleId` select**(정산마스터 목록에서 선택, 라벨에 업체·정산월·
  최종정산액을 함께 노출)로 교체. 두 테이블 모두 `vendorId` 컬럼 자체가 없다(정산ID로만 연결).
- 필드명 정정: `adjId`→`settleAdjId`, `adjType`→`adjTypeCd`(실제 코드값 PENALTY/BONUS/ERROR_FIX/
  OTHER, `SETTLE_ADJ_TYPE_KR` 그룹은 존재하지 않아 정정), `reason`→`adjReason`/`etcAdjReason` 등.
- `StSettleEtcAdjMng` 에는 `etcAdjDirCd`(가산/차감, 코드그룹 `ADJ_DIR`) 입력이 **통째로 빠져 있었다**
  — NOT NULL 컬럼인데 폼에 필드 자체가 없어 저장이 항상 실패했다. 추가함.
- `StSettleEtcAdjMng` 은 승인 개념(`aprvStatusCd`)이 없는 테이블인데 화면은 `SETTLE_ADJ_STATUS`
  뱃지를 그리고 있었다 — 제거. 승인 흐름은 `StSettleAdjMng` 전용이다.

---

## 남은 제약 (표시명 미해결)

`vendorNm`/`regUserNm` 같은 조인 표시명은 여전히 Item 에 없다. 그리드는 `settleId`/`vendorId` 등
ID 를 그대로 보여준다(안 B 선택의 트레이드오프). 사람이 읽기 좋은 이름이 필요해지면
Item + QueryDSL 에 `st_settle`→`sy_vendor` 조인을 추가해야 한다(안 A, 별도 작업).

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
