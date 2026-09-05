# 백엔드 부팅 성능 기준 (EcAdminApi / local)

## 목적

EcAdminApi 로컬 부팅 시간을 **10초 내외**로 유지한다.
2026-08-10 기준 18.7초 → 9~11초로 단축했고, 이후 어떤 수정이 들어오더라도 **이 기준선을 되돌리지 않는 것**이 이 문서의 목표다.

---

## 기준선 (2026-08-10 확정)

| 항목 | 값 |
|---|---|
| 대상 | `apps/ecBeBo`, `spring.profiles.active=local` |
| 기준 시간 | **10초 내외** (허용 범위 9~12초) |
| 개선 전 | 18.669초 |
| 개선 후 | 9~11초 |
| 측정 기준 | `[구동 완료]` 로그 (= `main()` 진입 ~ `AppTableLog` 완료) |

### ⚠ 측정 시 주의

회차 간 편차가 **±1초 이상**이다. **1회 측정으로 판단하지 말 것.**
반드시 3회 이상 반복해 평균으로 비교한다. 실행 중인 개발 서버(3000)를 죽이지 않으려면 별도 포트를 쓴다.

```bash
cd apps/ecBeBo
for i in 1 2 3; do
  timeout 90 java -Dfile.encoding=UTF-8 -Dserver.port=3099 -Dspring.profiles.active=local \
    -jar build/libs/EcAdminApi-0.0.1-SNAPSHOT.jar 2>&1 \
    | grep -oE "Started EcAdminApiApplication in [0-9.]+ seconds"
done
```

---

## 지켜야 할 설정 (되돌리면 부팅이 다시 느려짐)

아래는 전부 **부팅 시간을 위해 의도적으로 넣은 설정**이다. 정리·리팩터링 중 "안 쓰는 설정 같다"고 지우지 말 것.

### 1. JPA 리포지토리 지연 생성 ⭐ 최대 효과 (단독 5초 이상)

```yaml
# application-local.yml
spring:
  data:
    jpa:
      repositories:
        bootstrap-mode: lazy
```

- 리포지토리 **175개** 프록시 생성을 첫 호출 시점으로 미룬다.
- ❌ `deferred` 는 효과 없음 — EMF 준비 후 부팅 중에 결국 175개를 전부 만든다. 실측에서 차이가 없었다.
- 트레이드오프: 설정 오류가 부팅이 아니라 **첫 요청**에서 드러난다. 이미 `spring.main.lazy-initialization: true` 를 쓰고 있어 방침이 일치한다.
- **local 전용.** dev/prod 는 기본값 유지 (기동 시 오류를 빨리 잡는 편이 낫다).

### 2. `@MapperScan` 범위 축소 (전 프로파일 공통)

```java
// EcAdminApiApplication.java
@MapperScan(basePackages = {
        "com.shopjoy.ecadminapi.autorest.mapper",
        "com.shopjoy.ecadminapi.base.sy.mapper",
        "com.shopjoy.ecadminapi.base.zz.mapper"
}, annotationClass = Mapper.class)
```

- ❌ 루트(`com.shopjoy.ecadminapi`) 로 두면 `@Mapper` **9개**를 찾자고 클래스 **1600여 개**를 ASM 전수 스캔한다 (`@ComponentScan` 과 **별개로 한 번 더**).
- **새 `@Mapper` 패키지를 추가하면 여기에도 반드시 등록할 것.** 누락 시 해당 매퍼 빈이 생성되지 않는다.

### 3. `mybatis.type-aliases-package` 미지정 (전 프로파일 공통)

- mapper XML 9개가 `resultType` 에 **전부 FQCN** 을 쓰고 있어 별칭이 애초에 무용하다.
- 루트 패키지를 지정하면 별칭 등록을 위해 클래스 1600여 개를 또 전수 스캔한다.
- XML 에서 짧은 별칭(`resultType="SyDeptDto"`)을 쓰고 싶어지면, 루트가 아니라 **해당 DTO 패키지만 좁혀서** 지정할 것.

### 4. 자동 설정 제외 (`spring.autoconfigure.exclude`, local)

| 제외 대상 | 이유 | 되살릴 조건 |
|---|---|---|
| `...jasyptspringbootstarter.JasyptSpringBootAutoConfiguration` | `ENC(...)` 값 0건 + `StringEncryptor` 참조 0건인데 전체 PropertySource 를 래핑 | local yml 에 `ENC(...)` 를 쓰게 되면 |
| `...data.redis.RedisRepositoriesAutoConfiguration` | `@RedisHash`/`KeyValueRepository` **0개**인데 base 패키지 전수 스캔 | Redis 리포지토리를 실제로 만들면 |
| OAuth2Client / Elasticsearch / Quartz / Mongo | 미사용 모듈 | 해당 기능 도입 시 |

> ⚠ **Jasypt 제외는 절대 dev/prod 로 복사하지 말 것.**
> dev/prod 는 [`base.설정값암호화.md`](base.설정값암호화.md) 에 따라 `ENC(...)` 를 쓰는 것이 정책이다.
> 거기서 Jasypt 를 제외하면 암호화된 값이 복호화되지 않고 **평문 그대로 주입**된다.

> ⚠ Jasypt 클래스명 주의: `com.ulisesbocchio.jasyptspringboot**starter**.JasyptSpringBootAutoConfiguration`
> (`jasyptspringboot` 아님). 틀리면 **에러 없이 조용히 무시**되어 제외가 안 먹는다.

### 5. Flyway 비활성 (local)

```yaml
spring:
  flyway:
    enabled: false
```

- 마이그레이션 파일이 **0개**(`db/migration` 디렉터리 자체가 없음)인데도 부팅마다 ClassPathScanner + 원격 DB 접속 + validate 를 수행했다.
- 마이그레이션을 실제로 도입하면 `true` 로 되돌릴 것.

---

## 검토했으나 채택하지 않은 것

| 후보 | 실측 결과 / 판단 |
|---|---|
| **MyBatis 제거** | **차이 0초.** MyBatis 를 완전히 끄고(`@MapperScan` 주석 + autoconfig 2종 제외) 3회 측정했으나 평균이 동일했다. 비쌌던 건 라이브러리가 아니라 위 2·3번의 전수 스캔이었고 그건 이미 제거됨. 매퍼 9개를 JPA 로 옮기는 마이그레이션 비용만 남으므로 **투자 가치 없음** |
| `hibernate.dialect` 제거 | 부팅 로그에 deprecation 경고(HHH90000025)가 뜨지만 **제거하면 안 된다.** `allow_jdbc_metadata_access: false` 를 쓰고 있어 dialect 자동 감지가 불가능하다. 경고는 무시할 것 |
| `bootstrap-mode: deferred` | 위 1번 참조 — 효과 없음 |
| spring-context-indexer | Spring 6.1 에서 deprecated. 채택 안 함 |

---

## 남은 병목 (더 줄이려면 여기부터)

| 구간 | 소요 | 비고 |
|---|---|---|
| Hibernate EntityManagerFactory 빌드 | 약 5초 | 엔티티 **189개** — 최대 병목 |
| 컴포넌트 스캔 + 오토컨피그 평가 | 약 3초 | 클래스 1600여 개 |
| Tomcat + 필터/설정 빈 | 약 1초 | |

EMF 5초를 더 줄이려면 AppCDS 도입(빌드·실행 스크립트 변경 필요) 또는 엔티티 분할 수준의 작업이 필요하다.
현재 규모(엔티티 189 / 리포지토리 175 / 클래스 1600여)에서 10초 내외는 합리적인 수치이므로 **추가 최적화는 보류**한다.

---

## 부팅이 다시 느려졌을 때 — 진단 순서

### 1) 로그 타임스탬프의 구간 공백부터 본다

```bash
grep -E "^[0-9]{2}:[0-9]{2}:[0-9]{2}" C:/_logs/shopjoy/ecadminapi.log | cut -c1-140
```

연속된 두 로그 사이의 시간 차가 큰 구간이 곧 병목이다. 추측하지 말고 이걸 먼저 뜰 것.

### 2) JPA 구간을 정확히 재려면

```bash
-Dlogging.level.org.springframework.orm.jpa=DEBUG
```

EMF 빌드 구간이 `Building JPA container EntityManagerFactory` ~ `Initialized JPA EntityManagerFactory` 로 정확히 찍힌다.

### 3) 자주 재발하는 원인

- 새 스타터 의존성 추가 → 오토컨피그 평가 + 전수 스캔 증가
- `type-aliases-package` / `@MapperScan` 을 루트 패키지로 되돌림
- `bootstrap-mode` 를 지우거나 `deferred` 로 바꿈
- 엔티티 대량 추가 → EMF 빌드 시간 증가

---

## 관련 문서

- [`base.backend-EcBeBo.md`](base.backend-EcBeBo.md) — 패키지 구조 및 서비스 패턴
- [`base.설정값암호화.md`](base.설정값암호화.md) — Jasypt (dev/prod 에서는 필수)
- [`base.운영환경-배포설정.md`](base.운영환경-배포설정.md) — 배포 환경 설정
