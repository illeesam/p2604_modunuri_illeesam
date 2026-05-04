# IDE 부팅 속도 최적화 가이드

local 프로파일 기준 부팅 시간을 단축하기 위한 IDE 별 설정.
운영(prod) / dev 프로파일에는 적용하지 말 것.

---

## IntelliJ IDEA

### Run/Debug Configuration → Modify options → Add VM options

```
-Dspring.profiles.active=local
-XX:TieredStopAtLevel=1
-XX:+AlwaysPreTouch
-Dspring.jmx.enabled=false
-Xss512k
-Xms512m
-Xmx1g
-Djava.awt.headless=true
-Dfile.encoding=UTF-8
-Duser.timezone=Asia/Seoul
--add-opens=java.base/java.lang=ALL-UNNAMED
--add-opens=java.base/java.util=ALL-UNNAMED
--add-opens=java.base/java.lang.reflect=ALL-UNNAMED
```

### Build, Execution, Deployment → Compiler

- ✅ **Build project automatically** 체크
- ✅ **Compile independent modules in parallel** 체크
- **Shared build process heap size**: `2048` (기본 700)

### Build Tools → Gradle

- **Build and run using**: `Gradle` (IntelliJ 자체 빌드 끄기)
- **Run tests using**: `Gradle`

---

## VSCode (Spring Boot Extension Pack)

`.vscode/launch.json` 에 자동 적용됨 — 별도 설정 불필요.

`Run and Debug` 패널 → `EcAdminApi (local) — fast boot` 선택 → ▶ 실행

---

## 각 옵션 의미

| 옵션 | 효과 |
|---|---|
| `-XX:TieredStopAtLevel=1` | JIT C1 컴파일러까지만 사용. 부팅 30% 단축 (런타임 성능은 떨어짐 — local 한정) |
| `-XX:+AlwaysPreTouch` | 힙 메모리를 부팅 시 즉시 할당 (이후 페이지 폴트 0) |
| `-Dspring.jmx.enabled=false` | JMX 관리 빈 등록 생략 |
| `-Xss512k` | 스레드 스택 사이즈 축소 (기본 1m → 0.5m) |
| `-Xms512m -Xmx1g` | 힙 사이즈 명시 (자동 산정 시간 절약) |
| `--add-opens` | Java 17 모듈 시스템 우회 (Spring/Hibernate 리플렉션) |

---

## 추가 단축 팁

### 1. AccessLog DB 저장 비활성 (개발 중)
local 에서 DB INSERT 가 부담스러우면:
```yaml
app:
  access-log:
    db-save: false      # 콘솔 로그만, DB INSERT 생략
  error-log:
    db-save: false
```

### 2. p6spy 끄기 (SQL 로그 불필요 시)
`spring.datasource.driver-class-name` 을 `org.postgresql.Driver` 로 변경.
SQL 로깅 부재 → 부팅/런타임 둘 다 빨라짐.

### 3. DevTools 의 LiveReload 끄기
브라우저 자동 새로고침 안 쓴다면:
```yaml
spring.devtools.livereload.enabled: false
```
부팅 시 LiveReload 서버 시작 생략.
