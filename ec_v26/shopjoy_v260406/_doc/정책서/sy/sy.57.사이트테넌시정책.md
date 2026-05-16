---
정책명: 멀티사이트 테넌시(site_id) 표준 및 재설계 정책
정책번호: 957
관리자: 개발팀
최종수정: 2026-05-16
---

# 957. 멀티사이트 테넌시(site_id) 표준 및 재설계 정책

## 목적

플랫폼의 멀티사이트 데이터 격리 키인 `site_id` 의 **컬럼 의미·무결성·전파 범위·공유 모델**을 표준화한다.
기존에 ~95개 테이블에 `site_id` 가 무제약(FK 0, 대부분 NULL 허용)으로 흩어져 발생하던 교차오염·의미 모호성·중복 전파 문제를 제거한다.

> 관련: [`sy.02.플랫폼.md`](sy.02.플랫폼.md) (멀티사이트 운영 개념), [`sy.52.ddl단어사전규칙.md`](sy.52.ddl단어사전규칙.md) (컬럼 표준), [`sy.56.JPA스키마검증.md`](sy.56.JPA스키마검증.md) (Entity↔DB 검증).

---

## 1. 현황 문제 (재설계 배경)

| # | 문제 | 근거 |
|---|------|------|
| P1 | `site_id` 에 `sy_site` 참조 무결성 전무 | `REFERENCES sy_site` 건 테이블 = 0 |
| P2 | NULL 정책 불일치 | NOT NULL 7건 vs NULL 허용 127건 |
| P3 | 자식·상세·이력 테이블까지 `site_id` 중복 전파 | od_order_item / pd_prod_sku / od_pay / odh_*_hist 등 |
| P4 | 인덱스·유니크 정책 불일치 | 일부 도메인(dp_*)만 `(site_id, code)` 복합 유니크 보유 |
| P5 | 격리를 애플리케이션 코드에만 의존 | `req.setSiteId()` 누락 시 DB 무방비 |
| P6 | 전역(공유) 데이터 표현 부재 | `site_id = NULL` 의미 비표준(전역? 미지정? 누락?) |

---

## 2. 채택 모델: 전 도메인 사이트 전용(1:1) — 매핑 테이블 없음

**모든 자원은 사이트 전용(1:1)이다.** 한 자원은 한 사이트에만 귀속하며, 도메인 **기준(루트) 테이블의 `site_id` 컬럼 + FK** 로 표현한다. N:M 공유 매핑 테이블은 **만들지 않는다**(상품 포함 전 도메인).

> **설계 판단 근거**: 상품·프로모션을 포함해 같은 자원을 여러 사이트에서 동시 운영하는 요구가 현재 없다(1:1 운영 확정). 매핑 테이블은 상품 등 최다 조회 도메인에 JOIN을 강제하고, "사이트별 가격" 도입 시 주문 단가·할인·정산까지 연쇄 오염시킨다(YAGNI). 따라서 예외 없이 전 도메인을 `site_id` 컬럼+FK 단일 패턴으로 통일한다(스키마 일관성 100%, JOIN·복잡도 최소). 향후 공유 운영이 실제 필요해지면 그 시점에 매핑 테이블을 신설하고 기존 데이터를 1행씩 backfill 하면 무손실 전환된다.

### 핵심 원칙

1. **단일 진실원천**: `sy_site.site_id` 가 유일 마스터. 모든 `site_id` 는 이를 참조한다.
2. **컬럼 의미 고정**: `{루트}.site_id` = **"소속 사이트"** (1:1, 변경 불가).
3. **루트에만 보유**: `site_id` 컬럼은 도메인 **기준(루트) 엔티티에만** 둔다(원칙). 자식/상세는 부모로 사이트를 도출하나, 반정규화 효용이 있으면 컬럼을 유지한다(§3 B).
4. **매핑 테이블 없음**: 공유 매핑(`pd_prod_site` 등)은 채택하지 않는다. 전 자원이 기준테이블 `site_id` 컬럼+FK 로 사이트당 전용 처리된다.
5. **DB가 격리 보장**: 루트는 `NOT NULL + FK`. 앱 버그가 있어도 고아 site_id·교차오염 차단.
6. **전역 데이터 명시화**: NULL 대신 예약 site_id `__GLOBAL__` 행을 둔다 (P6 제거).

---

## 3. 테이블 3분류 (전수 적용 기준)

| 분류 | 정의 | site_id | FK(sy_site) | NOT NULL | 예시 |
|------|------|---------|-------------|----------|------|
| **A. 루트(소유)** | 사이트가 직접 소유하는 도메인 기준 엔티티 | 유지 | ✅ 신설 | ✅ | mb_member, pd_prod, pd_category, od_order, od_pay, od_dliv, od_claim, st_settle, dp_ui, cm_blog, cm_chatt_room, pm_coupon, pm_discnt, pm_event, pm_plan, pm_gift, pm_save, pm_voucher, pm_cache, sy_user |
| **B. 자식/상세** | 부모를 통해 사이트가 결정되는 종속 테이블 | **반정규화로 유지** (물리 삭제 안 함, 부모와 값 일치 보장) | 선택(보통 미설정) | — | od_order_item, od_order_discnt, pd_prod_sku, pd_prod_img, pd_prod_opt(_item), od_dliv_item, od_claim_item, od_refund(_method), pm_coupon_issue/usage/item, pm_event_item/benefit, mb_member_addr/sns/grade/group, cm_blog_reply/file/tag/good, dp_area, dp_panel, dp_panel_item, dp_widget, dp_ui_area, dp_area_panel |
| **C. 이력/로그** | 시점 스냅샷 (불변) | **원본 컬럼 유지** | ❌ (이력 불변) | 원본 따름 | odh_*_hist, syh_*_log, pdh_*_hist, *_view_log, cmh_push_log |

> **B 분류 site_id 물리 제거는 채택하지 않는다 (확정, 2026-05-16).**
> 근거: 전수 점검 결과 모든 자식/상세 테이블의 `site_id` 가 QueryDSL `buildCondition` 의 `siteId` 직접 필터로 **실사용 중**이다. 물리 제거 시 ① ~60개 자식 조회가 부모 JOIN 강제로 전환되어 **반정규화(조인 회피) 이점이 상실**되고 ② QueryDSL impl·Entity·DTO Request 동시 대규모 수정으로 코드가 깨진다.
> 따라서 자식 `site_id` 는 **반정규화 컬럼으로 유지**하되, **부모 루트의 site_id 와 항상 동일**해야 한다(앱 저장 로직 또는 트리거로 일치 보장; 자식 site_id 단독 변경 금지). FK·NOT NULL 은 자식에 강제하지 않는다(루트가 보장).

---

## 3.1 INSERT 시 site_id 주입 규약 (필수)

**모든 INSERT 는 site_id 를 반드시 채운다.** 단 값의 출처는 분류별로 다르며, **클라이언트 body 의 site_id 는 신뢰하지 않는다**(위변조 방지 — `reg_by`/`reg_date` 와 동일 원칙).

| 분류 | INSERT 시 site_id | 주입 주체 |
|------|------------------|-----------|
| **A. 루트** | **필수** | 서버가 인증 컨텍스트의 site_id 를 강제 주입. body 값은 무시·덮어쓰기 |
| **B. 자식/상세** | **필수 (부모와 동일값)** | 서버가 부모 루트의 `site_id` 를 복사 주입 (자식 단독 임의값 금지) |
| **C. 이력/로그** | 원본 행의 site_id 복사 | 이력 생성 로직 |

### 표준 구현

site_id 는 **요청 컨텍스트(헤더/JWT)에 항상 존재**하며 `SecurityUtil.getSiteId()` 로 조회한다. 각 루트 `create()` 에서 `reg_by` 주입과 같은 위치에 주입한다.

```java
// 루트(A) create — site_id 서버 강제 주입 (body 값 무시)
@Transactional
public Xxx create(Xxx body) {
    body.setSiteId(SecurityUtil.getSiteId());        // ★ 클라이언트 값 덮어쓰기
    body.setRegBy(SecurityUtil.getAuthUser().authId());
    body.setRegDate(LocalDateTime.now());
    ...
}

// 자식(B) create — 부모 site_id 복사
child.setSiteId(parent.getSiteId());
```

> 현황: `SecurityUtil.getSiteId()` 인프라는 존재하나 `create()` 들의 호출이 누락되어 있다. 본 규약 적용 시 전 루트 `create()` 에 위 주입을 표준화한다(누락 점검 대상).
> DB `NOT NULL`(§4) + 앱 자동주입(본 절)을 **함께** 갖춰야 격리가 실제 보장된다. DB만 막으면 기존 INSERT가 깨지고, 앱만 하면 우회 가능 → 적용 순서는 §7(앱 주입 먼저 → 데이터 정합 → DDL NOT NULL).

---

## 4. 컬럼·제약 표준

### 4.1 루트(A) site_id 정의

```sql
site_id VARCHAR(21) NOT NULL
    REFERENCES shopjoy_2604.sy_site(site_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
```

- 타입은 현행 `VARCHAR(21)` 유지(전 테이블 일관 — 변경 비용 0).
- `ON DELETE RESTRICT`: 데이터 보유 사이트의 물리 삭제 차단(사이트는 `site_status_cd` 소프트 종료 사용).

### 4.2 인덱스/유니크 표준

- 모든 A 테이블: `CREATE INDEX idx_{tbl}_site ON {tbl}(site_id);`
- 사이트 범위 자연키는 **복합 유니크**: `UNIQUE (site_id, {자연키})`
  - 예: `pd_prod(site_id, prod_code)`, `mb_member(site_id, login_id)`, 기존 `dp_ui(site_id, ui_cd)` 패턴 전 도메인 확대.
- 조회 빈도 높은 테이블은 `(site_id, status_cd, reg_date)` 류 커버링 인덱스 검토.

### 4.3 전역(공통) 데이터 규약

```sql
INSERT INTO shopjoy_2604.sy_site(site_id, site_code, site_nm, site_status_cd)
VALUES ('__GLOBAL__', 'GLOBAL', '전역(공통)', 'ACTIVE');
```

- `sy_code`, `sy_menu`, `sy_template` 등 사이트 공통 마스터: `site_id = '__GLOBAL__'` 명시.
- 조회 표준: `WHERE site_id IN (:siteId, '__GLOBAL__')`.

---

## 5. 매핑 엔티티 — 없음 (전 도메인 사이트 전용)

**공유 매핑 테이블은 만들지 않는다.** 상품(`pd_prod_site`)·프로모션(`pm_promo_site`) 등 후보를 검토했으나, 같은 자원을 여러 사이트에서 동시 운영하는 요구가 없어(1:1 확정) 전 도메인을 §3의 기준테이블 `site_id` 컬럼+FK 단일 패턴으로 통일한다.

- ~~`pd_prod_site`~~ 채택 안 함 — 상품도 사이트 전용. 사이트별 가격/노출 차등 요구 없음.
- ~~`pm_promo_site`~~ 채택 안 함 — 프로모션도 사이트 전용.
- 향후 공유 운영이 실제 필요해지면 그 시점에 매핑 테이블 신설 + 기존 데이터 1행씩 backfill (무손실 전환).

---

## 6. 조회 표준

```sql
-- 전 도메인 동일: 기준테이블 단일 조건
SELECT * FROM shopjoy_2604.pd_prod  WHERE site_id = :siteId;
SELECT * FROM shopjoy_2604.pm_coupon WHERE site_id = :siteId;
SELECT * FROM shopjoy_2604.od_order  WHERE site_id = :siteId;
```

- 서비스 레이어에 공통 사이트 스코프 헬퍼(`siteScope(:siteId)`)를 두어 WHERE 누락을 방지한다.
- 전역 공통 마스터 조회는 `WHERE site_id IN (:siteId, '__GLOBAL__')`.
- 자식/상세는 부모 site_id 와 동일하므로(반정규화, §3 B) 자식 단독 조회 시에도 자식 `site_id` 로 바로 필터 가능(JOIN 불필요).

---

## 7. 마이그레이션 단계 (안전 우선)

| 단계 | 내용 | 산출물 | 리스크 |
|------|------|--------|--------|
| 0a | **앱 INSERT 주입 표준화** — 전 루트 `create()` 에 `setSiteId(SecurityUtil.getSiteId())`, 자식 create 에 부모 site_id 복사 (§3.1). DDL NOT NULL 전에 선행해야 기존 INSERT 가 깨지지 않음 | 서비스 코드 | 중 (전 create 점검) |
| 0b | NULL/고아 site_id 데이터 스캔·교정, `sy_site` 에 `__GLOBAL__` 삽입 | 점검 SQL | 낮음 |
| 1 | 루트(A) `site_id` `NOT NULL` + FK + 인덱스. FK는 `NOT VALID` 추가 후 `VALIDATE` (락 최소화) | `migration_site_id_root_fk.sql` | 중 (0a·0b 선행 필수) |
| 2 | 도메인별 `(site_id, 자연키)` 복합 유니크 (중복 사전 점검) | (1과 통합 가능) | 중 |
| 3 | 자식(B) site_id 부모 동기화 보장(앱 저장 로직 또는 트리거) — **컬럼은 유지** | `migration_child_site_sync.sql` | 중 |
| 4 | (옵션) 핵심 거래 테이블 RLS 적용 | `migration_site_rls.sql` | 높음 → 최후 |
| 5 | 정책서/단어사전/Entity(@ManyToOne sy_site, nullable=false)/Mapper siteScope 헬퍼 반영 | 문서·코드 | 낮음 |

> 매핑 테이블 신설 단계 없음(전 도메인 사이트 전용, §5). 자식(B) site_id 물리 제거 단계도 없음(반정규화 유지, §3) — 부모와 값 동기화만 보장한다.

### 7.1 (옵션) 행 수준 격리 — PostgreSQL RLS

```sql
ALTER TABLE shopjoy_2604.od_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON shopjoy_2604.od_order
  USING (site_id = current_setting('app.site_id', true));
```

- 커넥션마다 `SET app.site_id = :siteId` (Spring 커넥션 인터셉터). 관리자 전체조회용 bypass 롤 별도.
- 효과: 서비스에서 site 조건 누락 시에도 DB가 차단(P5 근본 해결). 전 쿼리 영향 → 마지막 단계로 점진 적용.

---

## 8. 관련 테이블

루트(A) 대표: `sy_site`(마스터), `mb_member`, `pd_prod`, `pd_category`, `od_order`, `od_pay`, `od_dliv`, `od_claim`, `st_settle`, `dp_ui`, `cm_blog`, `pm_coupon`, `pm_discnt`, `pm_event`, `pm_plan`, `pm_gift`, `pm_save`, `pm_voucher`, `pm_cache`, `sy_user`
신설 매핑: **없음** (전 도메인 사이트 전용)

## 9. 관련 화면

| pageId | 라벨 |
|--------|------|
| `sySiteMng` | 시스템 > 사이트관리 |
| `pdProdMng` | 상품관리 (사이트당 전용) |
| `pmCouponMng` / `pmEventMng` | 프로모션 (사이트당 전용) |

## 10. 제약사항

- 루트 테이블 `site_id` 는 등록 후 변경 불가(소속 사이트 고정). 이전이 필요하면 별도 마이그레이션 절차.
- 공유 매핑 테이블(`pd_prod_site`/`pm_promo_site` 등)은 만들지 않는다. 전 도메인 사이트 전용. 다중 사이트 운영 요구가 실제 발생하면 본 정책 개정 후 매핑 신설.
- 이력/로그(C)는 FK·NOT NULL 적용 대상이 아니다(스냅샷 불변, 현 DDL 규칙 유지).
- **B 자식 `site_id` 컬럼은 물리 삭제하지 않는다**(반정규화 유지 — QueryDSL 전반에서 site 직접 필터로 실사용 중, 제거 시 조인 강제·코드 대량 변경). 단 자식 값은 부모 루트와 항상 일치해야 하며 자식 단독 변경을 금지한다.
- 신규 도메인 테이블 추가 시 본 3분류(A/B/C)에 따라 site_id 정책을 결정하고 [`sy.52.ddl단어사전규칙.md`](sy.52.ddl단어사전규칙.md) 에 반영한다. 신규 자식 테이블도 site 직접 조회가 예상되면 반정규화 site_id 를 둔다.
