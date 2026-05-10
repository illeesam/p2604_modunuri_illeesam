# EcAdminApi — Claude Code 작업 가이드

## 빠른 참조

- 전체 실행 방법 / 환경변수 / 배치 스케줄러 상세 → [`README.md`](README.md)
- 설정 파일 속성 레퍼런스 → [`src/main/resources/application.yml`](src/main/resources/application.yml)

---

## 기술 스택

| 항목 | 값 |
|---|---|
| Java | 17 |
| Spring Boot | 3.x |
| DB | PostgreSQL — 스키마 `shopjoy_2604` |
| ORM | JPA (Hibernate) + MyBatis |
| 인증 | JWT (access 15분 / refresh 7일) |
| 캐시 | Redis (선택, `app.redis.enabled`) |
| 빌드 | Gradle |
| 서버 포트 | 3000 |

---

## 패키지 구조

```
com.shopjoy.ecadminapi/
├── auth/          JWT 인증·인가
├── autorest/      공통 REST 응답 (ApiResponse, PageResult)
├── base/          기준 데이터 엔티티/리포지토리 (sy.*, ec.*)
├── bo/            Back Office API (관리자)
├── cache/         Redis 캐시 유틸
├── co/            공통 유틸 (코드, 파일, 페이징)
├── common/        글로벌 예외 처리, 보안 설정
├── ext/           외부 연동
├── fo/            Front Office API (회원)
└── sch/           배치 스케줄러
    ├── config/    SchBatchConfig, SchBatchProperties
    ├── controller/SchBatchController
    ├── core/      SchBatchRunner, SchBatchExecutor, SchBatchJobRegistry
    └── handler/   SchBatchJobHandler (인터페이스 + 구현체 10개)
```

---

## Controller / Service 파라미터 패턴

**핵심 원칙**: 개별 `String/int` 파라미터 대신 `Map<String, Object>`, DTO, VO로 받는다.
이유: 항목 추가·삭제 시 Controller/Service 서명 변경 없이 Mapper XML만 수정.

```java
// GET 목록 — Map으로 모든 쿼리 파라미터 수신
@GetMapping
public ResponseEntity<ApiResponse<List<XxxDto>>> list(@RequestParam Map<String, Object> p) {
    return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
}

// GET 페이징
@GetMapping("/page")
public ResponseEntity<ApiResponse<PageResult<XxxDto>>> page(@RequestParam Map<String, Object> p) {
    return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
}

// POST/PUT — Entity 또는 DTO @RequestBody
@PostMapping
public ResponseEntity<ApiResponse<XxxEntity>> create(@RequestBody XxxEntity entity) { ... }
```

**`buildParam()` 헬퍼 메서드 금지** — Spring이 `@RequestParam Map`으로 자동 수집한다.

---

## Service 패턴

**트랜잭션 어노테이션 표준 (2026-05-08)**: `@Transactional(readOnly = true)`는 **클래스 레벨 1회**만 선언한다. 조회 메서드는 어노테이션 없이 클래스 레벨을 상속받고, 변경(쓰기) 메서드만 `@Transactional`을 명시해 클래스 디폴트를 오버라이드한다.

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)   // ← 클래스 디폴트
public class XxxService {

    // 목록 (pageSize 포함 시 자동 페이징) — 클래스 readOnly 상속
    public List<XxxDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    // 페이징 — 클래스 readOnly 상속
    public PageResult<XxxDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    // FO 서비스: memberId는 SecurityUtil로 주입
    public List<XxxDto> getMyXxx(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.currentUserId());
        return mapper.selectList(p);
    }

    // 변경 메서드는 @Transactional 명시 (readOnly=false 로 오버라이드)
    @Transactional
    public Xxx create(Xxx body) { ... }
}
```

**금지**: 조회 메서드에 `@Transactional(readOnly = true)`를 또 다시 붙이는 것 — 클래스 레벨과 중복이며 가독성을 해친다.

---

## CRUD 메서드 필수 패턴 (v2.0)

**2026-04-28 업데이트**: 모든 BO Service에 필수 적용

### getById / getById - 필수 검증

> 클래스에 `@Transactional(readOnly = true)`가 선언되어 있으므로 조회 메서드에는 어노테이션을 붙이지 않는다.

```java
public XxxDto getById(String id) {
    XxxDto dto = mapper.selectById(id);
    if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
    return dto;
}
```

### create - 저장 확인

```java
@Transactional
public Xxx create(Xxx body) {
    body.setId("ID" + LocalDateTime.now().format(ID_FMT) + ...);
    body.setRegBy(SecurityUtil.getAuthUser().authId());
    body.setRegDate(LocalDateTime.now());
    body.setUpdBy(SecurityUtil.getAuthUser().authId());
    body.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(body);
    if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
    return saved;
}
```

### update - 필드 복사 + 저장 확인 필수

```java
@Transactional
public XxxDto update(String id, Xxx body) {
    Xxx entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    // ← 모든 업데이트 가능 필드 복사 (updBy, updDate, regBy, regDate 제외)
    entity.setField1(body.getField1());
    entity.setField2(body.getField2());
    entity.setField3(body.getField3());
    entity.setUpdBy(SecurityUtil.getAuthUser().authId());
    entity.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(entity);
    if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
    em.flush();
    return getById(id);
}
```

### delete - 존재 확인

```java
@Transactional
public void delete(String id) {
    if (!repository.existsById(id)) 
        throw new CmBizException("존재하지 않는 데이터입니다: " + id);
    repository.deleteById(id);
}
```

**⚠️ 주의사항**:
- ❌ update() 메서드에서 body의 필드를 entity에 복사하지 않으면 UPDATE SQL이 생성되지 않음
- ❌ save() 결과를 확인하지 않으면 저장 실패를 감지할 수 없음
- ✅ 모든 수정 가능 필드를 명시적으로 복사 (`entity.setXxx(body.getXxx())`)
- ✅ save() 반환값이 null이면 CmBizException 발생

---

## VoUtil을 이용한 필드 자동 복사

Entity 수정 시 Request Body의 필드를 일일이 매핑하지 않고 `VoUtil.voCopy()` 또는 `VoUtil.mapCopy()`로 자동 복사 가능.

### 방식 1: VO/DTO 사용

```java
@Transactional
public XxxDto update(String id, XxxVo body) {
    Xxx entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    VoUtil.voCopy(body, entity);  // null이 아닌 필드만 entity에 복사
    entity.setUpdBy(SecurityUtil.getAuthUser().authId());
    entity.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(entity);
    if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
    em.flush();
    return getById(id);
}
```

### 방식 2: Map<String, Object> 사용 (동적 필드)

```java
@Transactional
public XxxDto update(String id, Map<String, Object> body) {
    Xxx entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    VoUtil.mapCopy(body, entity);  // Map의 모든 non-null 항목을 복사
    entity.setUpdBy(SecurityUtil.getAuthUser().authId());
    entity.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(entity);
    if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
    em.flush();
    return getById(id);
}
```

### 제외 필드 지정

```java
// id, regBy, regDate는 복사하지 않음
VoUtil.voCopy(body, entity, "id", "regBy", "regDate");
// 또는
VoUtil.mapCopy(body, entity, "id", "regBy", "regDate");
```

### 안전성 보장

1. **null 안전**: null 값은 복사하지 않음 (선택적 수정만 반영)
2. **타입 검증**: 타입이 다른 필드는 복사하지 않음
3. **필드 누락 허용**: VO/Map에 있지만 Entity에 없는 필드는 무시 (부분 복사)
4. **필드명 일치**: 같은 이름의 필드만 자동 매핑

### 사용 제약

- Entity와 VO/Map의 필드명이 **정확히 일치**해야 함
- MyBatis `<if test="field != null">` 조건은 여전히 유효함 (null 값이 복사되지 않으므로)
- JPA dirty checking은 정상 작동 (필드 변경이 감지됨)

### 메서드 요약

#### 기본 메서드 (배열 형식)
| 메서드 | 용도 | 예시 |
|---|---|---|
| `voCopy(vo, entity)` | VO/DTO → Entity (모두) | `VoUtil.voCopy(body, entity)` |
| `voCopy(vo, entity, excludes...)` | VO/DTO → Entity (제외) | `VoUtil.voCopy(body, entity, "id", "regBy")` |
| `mapCopy(map, entity)` | Map → Entity (모두) | `VoUtil.mapCopy(body, entity)` |
| `mapCopy(map, entity, excludes...)` | Map → Entity (제외) | `VoUtil.mapCopy(body, entity, "id", "regBy")` |

#### 편의 메서드 (문자열 형식, ^ 구분)

**VO/DTO 편의 메서드:**

| 메서드 | 용도 | 예시 |
|---|---|---|
| `voCopyExclude(vo, entity, "id^regBy^regDate")` | VO/DTO → Entity (제외, 문자열) | 감시 필드 제외 |
| `voCopyInclude(vo, entity, "memberNm^memberEmail")` | VO/DTO → Entity (포함만) | 특정 필드만 복사 |
| `voCopyIncludeExclude(vo, entity, "id^memberNm^email", "id^regBy")` | VO/DTO → Entity (포함 중 제외) | 포함 목록에서 감시 필드만 제외 |

**Map 편의 메서드:**

| 메서드 | 용도 | 예시 |
|---|---|---|
| `mapCopyExclude(map, entity, "id^regBy^regDate")` | Map → Entity (제외, 문자열) | 감시 필드 제외 |
| `mapCopyInclude(map, entity, "siteId^memberNm^email")` | Map → Entity (포함만) | 특정 필드만 복사 |

### 사용 예시 비교

**예시 1: 감시 필드 제외 (제외 방식)**
```java
// 배열 형식 (기존)
VoUtil.voCopy(body, entity, "id", "regBy", "regDate");

// 문자열 형식 (편의)
VoUtil.voCopyExclude(body, entity, "id^regBy^regDate");
```

**예시 2: 특정 필드만 복사 (포함 방식)**
```java
// 이름, 이메일, 폰만 복사
VoUtil.voCopyInclude(body, entity, "memberNm^memberEmail^memberPhone");
```

**예시 3: 포함 중 일부 제외**
```java
// 아래 필드들만 복사하되, id와 regBy는 제외
VoUtil.voCopyIncludeExclude(body, entity, 
    "id^memberNm^memberEmail^regBy^regDate",  // 포함
    "id^regBy"  // 포함 중 제외
);
```

---

## FO Service CRUD 메서드 필수 패턴 (v2.0)

**2026-04-28 업데이트**: 모든 FO Service에 필수 적용. 사용자 마주보는 API이므로 데이터 검증 및 오류 처리 필수.

### getById / getMyXxx - 필수 검증

> 클래스에 `@Transactional(readOnly = true)`가 선언되어 있으므로 조회 메서드에는 어노테이션을 붙이지 않는다.

```java
public XxxDto getById(String id) {
    XxxDto dto = mapper.selectById(id);
    if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
    return dto;
}

// FO 조회: memberId는 SecurityUtil로 주입 + 권한 검증
public List<XxxDto> getMyXxx(Map<String, Object> p) {
    String memberId = SecurityUtil.getAuthUser().authId();
    p.put("memberId", memberId);
    List<XxxDto> list = mapper.selectList(p);
    if (list == null || list.isEmpty()) 
        throw new CmBizException("조회 결과가 없습니다.");
    return list;
}
```

### create - 저장 확인 + ID 생성

```java
@Transactional
public Xxx create(Xxx body) {
    body.setId(CmUtil.generateId("prefix"));
    body.setMemberId(SecurityUtil.getAuthUser().authId());
    body.setRegBy(SecurityUtil.getAuthUser().authId());
    body.setRegDate(LocalDateTime.now());
    body.setUpdBy(SecurityUtil.getAuthUser().authId());
    body.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(body);
    if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
    return saved;
}
```

### update - 필드 복사 + 저장 확인 + 권한 검증

```java
@Transactional
public XxxDto update(String id, Xxx body) {
    Xxx entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    
    // ← 권한 검증: 본인 데이터인지 확인
    if (!entity.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
        throw new CmBizException("접근 권한이 없습니다.");
    
    // ← 모든 업데이트 가능 필드 복사 (memberId, regBy, regDate 제외)
    entity.setField1(body.getField1());
    entity.setField2(body.getField2());
    entity.setUpdBy(SecurityUtil.getAuthUser().authId());
    entity.setUpdDate(LocalDateTime.now());
    Xxx saved = repository.save(entity);
    if (saved == null) throw new CmBizException("데이터 수정에 실패했습니다.");
    em.flush();
    return getById(id);
}
```

### delete - 존재 확인 + 권한 검증 + flush

```java
@Transactional
public void delete(String id) {
    Xxx entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    
    // ← 권한 검증: 본인 데이터인지 확인
    if (!entity.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
        throw new CmBizException("접근 권한이 없습니다.");
    
    repository.deleteById(id);
    em.flush();
}
```

**⚠️ FO 필수 체크사항**:
- ❌ 사용자 권한 검증(memberId 비교) 없으면 다른 회원 데이터 조회/수정/삭제 가능 (심각한 보안 결함)
- ❌ save() / delete() 결과 확인 없으면 저장 실패를 감지할 수 없음
- ✅ 모든 update/delete 메서드에서 memberId 권한 검증 필수
- ✅ save() 반환값이 null이면 CmBizException 발생
- ✅ delete() 후 em.flush() 호출로 즉시 반영

---

## Mapper XML 패턴

```xml
<where>
  <if test="siteId != null">AND site_id = #{siteId}</if>
  <if test="searchValue != null">AND (title LIKE '%'||#{searchValue}||'%')</if>
  <if test="dateStart != null">AND reg_date >= #{dateStart}</if>
</where>
```

---

## 배치 스케줄러 — 핵심 규칙

### 새 핸들러 추가 시

1. `sch/handler/` 에 클래스 생성 — `@Slf4j @Component implements SchBatchJobHandler`
2. `batchCode()` 반환값은 `sy_batch.batch_code` 와 **정확히 일치**해야 함
3. `sy_batch` 테이블에 해당 코드로 INSERT 필요
4. 앱 재기동 또는 `POST /api/sch/reload` 호출로 자동 등록

```java
@Slf4j
@Component
public class MyNewJob implements SchBatchJobHandler {
    @Override public String batchCode() { return "MY_NEW_JOB"; }
    @Override public void execute(SyBatch batch) { /* 실행 로직 */ }
}
```

### cron 표현식 규칙

- `sy_batch.cron_expr`에는 Unix 5필드 형식 (`분 시 일 월 요일`) 저장
- `SchBatchJobRegistry`가 Spring 6필드(`초 분 시 일 월 요일`)로 자동 변환 (`"0 " + cron`)
- 5필드보다 많은 경우 그대로 사용

### Jenkins 모드 vs cron 모드

| 설정 | 동작 |
|---|---|
| `jenkins.enabled=false` (local/dev) | cron 자동 등록. 내부 ThreadPool 실행. |
| `jenkins.enabled=true` (prod) | cron 등록 생략. Jenkins가 `POST /api/sch/jenkins/{batchCode}` 직접 호출. |

두 모드는 **배타적**으로 동작한다. Jenkins 모드 활성 시 `register()`는 즉시 반환.

### 등록된 배치 코드

| batchCode | 주기 | 기능 |
|---|---|---|
| `SETTLEMENT_REPORT` | 매월 1일 08:00 | 월간 정산 리포트 |
| `MEMBER_GRADE_CALC` | 매월 1일 04:00 | 회원 등급 재산정 |
| `CACHE_EXPIRE` | 매월 1일 05:00 | 캐시 자동 소멸 |
| `ATTACH_CLEANUP` | 매주 일요일 03:00 | 임시 첨부파일 삭제 |
| `STATS_AGGREGATION` | 매일 00:00 | 통계 사전 집계 |
| `EVENT_STATUS_SYNC` | 매일 00:00 | 이벤트 상태 동기화 |
| `COUPON_EXPIRE` | 매일 01:00 | 쿠폰 만료 처리 |
| `ORDER_AUTO_COMPLETE` | 매일 02:00 | 주문 자동 완료 |
| `DLIV_STATUS_SYNC` | 2시간마다 | 배송 상태 업데이트 |
| `DEV_10MINUTE_LOG` | 10분마다 | 개발용 실행 확인 |

---

## ApiResponse 사용 규칙

```java
// 성공
return ResponseEntity.ok(ApiResponse.ok(data));

// 오류 — fail() 없음. error(int, String) 사용
return ResponseEntity.status(403).body(ApiResponse.error(403, "접근 권한이 없습니다."));
return ResponseEntity.status(401).body(ApiResponse.error(401, "인증 토큰이 유효하지 않습니다."));
```

---

## 주석 작성 시 주의

Java Javadoc (`/** ... */`) 블록 내에서 `*/` 문자열을 쓰면 주석이 조기 종료된다.
cron 표현식 `*/2` 등을 예시로 쓸 때는 `*\/2` 로 이스케이프하거나 텍스트로 설명.

---

## 설정 파일 프로파일 분리 규칙

| 파일 | 용도 |
|---|---|
| `application.yml` | 공통 설정 + 전체 속성 레퍼런스 (실행 방법 주석 포함) |
| `application-local.yml` | 로컬 개발 전용 값 |
| `application-dev.yml` | 개발 서버 전용 값 |
| `application-prod.yml` | 운영 서버 전용 값 (민감값 전부 환경변수) |

- 실행 방법 주석은 `application.yml` 상단에만 유지 (각 프로파일 yml에는 미기재)
- prod 프로파일에서 기본값 없는 `${VAR}` 플레이스홀더는 환경변수 미설정 시 앱 기동 실패 → 빠른 오류 감지 의도

---

## 운영 환경변수 보안 원칙

- `-DDB_PASSWORD=값` 형태의 JVM 인수는 `ps aux`에 평문 노출 — **prod 금지**
- `/etc/ecadminapi.env` (권한 600) + `source` 방식 또는 systemd `EnvironmentFile=` 사용
- `JENKINS_BATCH_TOKEN` 미설정 시 토큰 검증 생략 — **prod에서는 반드시 설정**
