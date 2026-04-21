# sy.53 캐시 관리 정책

## 1. 개요

EcAdminApi는 Redis를 이용한 애플리케이션 레벨 캐시를 운영한다.  
`app.redis.enabled: false`(기본값)이면 모든 캐시 연산은 no-op 처리되며, DB 직접 조회로 fallback된다.

---

## 2. 캐시 구조

### 2-1. Redis 노드 구분

| 노드 | 용도 | 저장 도메인 |
|---|---|---|
| **primary** | 인증·시스템 공통 | AUTH(BO/FO/EXT), SY(code/menu/role/prop/i18n) |
| **secondary** | EC 도메인 데이터 | EC(pd/pm/dp) — 미설정 시 primary fallback |

### 2-2. TTL 기준

| 그룹 | TTL | 근거 |
|---|---|---|
| AUTH(세션) | 900s (15분) | JWT access-expiry 와 동일 |
| SY-* | 3600s (1시간) | 변경 빈도 낮음. evict()로 실시간 반영하므로 TTL은 안전망 |
| EC-* | 3600s (1시간) | 변경 시 evict() 호출 전제. TTL은 안전망 |

### 2-3. 도메인별 캐시 키

| 도메인 | 대표 키 | 설명 |
|---|---|---|
| sy-code | `sy:code:all`, `sy:code:grp:{grp}` | 공통코드 전체 / 그룹별 |
| sy-menu | `sy:menu:all`, `sy:menu:role:{roleId}` | 메뉴 전체 / 역할별 |
| sy-role | `sy:role:all`, `sy:role:dtl:{roleId}` | 역할 전체 / 단건 |
| sy-role-menu | `sy:role:menu:{roleId}` | 역할별 허용 메뉴 ID 목록 |
| sy-prop | `sy:prop:all`, `sy:prop:key:{key}` | 시스템 프로퍼티 |
| sy-i18n | `sy:i18n:all`, `sy:i18n:msg:{lang}:{key}` | 다국어 메시지 |
| ec-pd-prod | `ec:pd:prod:dtl:{id}`, `ec:pd:prod:all:{siteId}` | 상품 |
| ec-pd-cate | `ec:pd:cate:all`, `ec:pd:cate:dtl:{id}` | 카테고리 |
| ec-pd-cate-prod | `ec:pd:cate:prod:dtl:{id}`, `ec:pd:cate:prod:all:{cateId}` | 카테고리 상품 |
| ec-pm-prom | `ec:pm:prom:dtl:{id}`, `ec:pm:prom:all:{siteId}` | 프로모션 |
| ec-pm-prom-item | `ec:pm:prom:item:dtl:{id}`, `ec:pm:prom:item:all:{promId}` | 프로모션 항목 |
| ec-dp-disp | `ec:dp:disp:dtl:{id}`, `ec:dp:disp:all:{siteId}` | 전시 |
| ec-dp-disp-item | `ec:dp:disp:item:dtl:{id}`, `ec:dp:disp:item:all:{dispId}` | 전시 항목 |

---

## 3. 캐시 관리 API

### 3-1. 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/cache/status` | 캐시 활성 여부 + 도메인별 지원 방식 확인 |
| GET | `/api/cache/info` | 도메인별 캐시 상태 (키 존재, 갱신 시각, 남은 TTL, 키 수) |
| GET | `/api/cache/data/{domain}` | 도메인 전체 캐시값 조회 |
| GET | `/api/cache/data/{domain}/{key}` | 서브키 단건 캐시값 조회 |
| POST | `/api/cache/reload` | 전체 도메인 evict + DB 재조회 |
| POST | `/api/cache/reload/{domains}` | 특정 도메인 evict + DB 재조회 |
| DELETE | `/api/cache/{domains}` | 특정 도메인 evict only (lazy 재적재) |

### 3-2. 캐시값 조회 서브키 규칙

| 도메인 | 전체 조회 | 서브키 조회 예시 |
|---|---|---|
| sy-code | 전체 코드 맵 | `sy-code/ORDER_STATUS` → 주문상태 코드 목록 |
| sy-menu | 전체 메뉴 목록 | `sy-menu/ROLE001` → 역할별 메뉴 |
| sy-role | 전체 역할 목록 | `sy-role/ROLE001` → 역할 상세 |
| sy-role-menu | -(서브키 필요) | `sy-role-menu/ROLE001` → 허용 menuId 목록 |
| sy-prop | 전체 프로퍼티 맵 | `sy-prop/site.name` → 프로퍼티 값 |
| sy-i18n | 전체 다국어 맵 | `sy-i18n/ko:btn.save` → 메시지 단건 |
| ec-pd-cate | 전체 카테고리 목록 | `ec-pd-cate/CATE001` → 카테고리 상세 |
| ec-pd-prod | -(서브키 필요) | `ec-pd-prod/P2604001` → 상품 상세 |
| ec-pd-cate-prod | -(서브키 필요) | `ec-pd-cate-prod/CATE001` → 카테고리 상품 목록 |
| ec-pm-prom | -(서브키 필요) | `ec-pm-prom/PROM001` → 프로모션 상세 |
| ec-pm-prom-item | -(서브키 필요) | `ec-pm-prom-item/PROM001` → 프로모션 항목 목록 |
| ec-dp-disp | -(서브키 필요) | `ec-dp-disp/DISP001` → 전시 상세 |
| ec-dp-disp-item | -(서브키 필요) | `ec-dp-disp-item/DISP001` → 전시 항목 목록 |

### 3-3. 멀티 도메인 지정 (`^` 구분자)

단일 또는 복수 도메인을 `^`로 구분하여 한 번에 처리한다.

```
# 단일
POST /api/cache/reload/sy-code
DELETE /api/cache/ec-pd-prod

# 멀티
POST /api/cache/reload/sy-code^sy-menu^sy-role
DELETE /api/cache/ec-pd-prod^ec-pm-prom^ec-dp-disp
```

### 3-3. reload vs evict-only

| 구분 | 동작 | 대상 도메인 |
|---|---|---|
| **reload** | evict 후 DB 재조회 → 즉시 캐시 저장 | sy-code, sy-menu, sy-role, sy-role-menu, sy-prop, sy-i18n, ec-pd-cate |
| **evict-only** | 캐시 삭제만. 다음 요청 시 lazy 재적재 | ec-pd-prod, ec-pd-cate-prod, ec-pm-prom, ec-pm-prom-item, ec-dp-disp, ec-dp-disp-item |

> EC 상품·프로모션·전시는 데이터 규모가 커서 전체 reload가 부적합하므로 evict-only.  
> 카테고리(`ec-pd-cate`)는 소량이므로 reload 지원.

### 3-4. 캐시 정보 조회 응답 예시

```json
[
  {
    "domain": "sy-code",
    "cached": true,
    "keyCount": 15,
    "remainTtlSec": 3245,
    "configTtlSec": 3600,
    "updatedAt": "2026-04-21 14:23:10"
  },
  {
    "domain": "ec-pd-prod",
    "cached": false,
    "keyCount": 0,
    "remainTtlSec": -2,
    "configTtlSec": 3600,
    "updatedAt": null
  }
]
```

> `updatedAt`: `now - (configTTL - remainTTL)` 로 계산한 **근사 갱신 시각**.  
> 패턴 키(`*` 포함) 기반 도메인은 TTL 개별 조회 생략, `remainTtlSec: -1` 반환.

---

## 4. 서비스 레이어 evict 정책

| 시점 | 처리 방식 |
|---|---|
| 데이터 변경 (create/update/delete) | 해당 CacheStore의 `evict()` 또는 `evictAll()` 즉시 호출 |
| TTL 만료 | 안전망. evict 누락 시 최대 TTL 시간 후 자동 만료 |
| 운영 중 강제 갱신 | 캐시 관리 API `POST /api/cache/reload/{domain}` 호출 |
| 장애·불일치 발생 | `DELETE /api/cache/{domain}` 으로 evict → lazy 재적재 |

---

## 5. 관련 파일

| 파일 | 역할 |
|---|---|
| `cache/config/CacheKey.java` | 모든 Redis 키 프리픽스 상수 |
| `cache/config/RedisProperties.java` | TTL 설정 (`app.redis.ttl.*`) |
| `cache/config/RedisUtil.java` | Redis 공통 연산 (get/set/delete/getTtl/countKeys) |
| `cache/store/Sy*CacheStore.java` | SY 도메인별 캐시 연산 |
| `cache/store/Ec*CacheStore.java` | EC 도메인별 캐시 연산 |
| `cache/service/CacheAdminService.java` | reload/evict/info 비즈니스 로직 |
| `cache/controller/CacheAdminController.java` | 캐시 관리 REST API |
