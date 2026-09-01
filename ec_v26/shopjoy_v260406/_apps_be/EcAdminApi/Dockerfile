# ═══════════════════════════════════════════════════════════
#  ShopJoy EcAdminApi - Dockerfile (Multi-stage Build)
#  2026-08-30: JDK18 → JDK17(빌드)/JRE17(런타임) 로 정정 — build.gradle.kts 의
#  sourceCompatibility/targetCompatibility 가 VERSION_17 인데 이미지가 18이라 실제
#  프로젝트가 검증한 버전과 어긋나 있었음. 런타임 스테이지는 JDK 대신 JRE만 써서
#  빌드 도구(컴파일러 등)를 최종 이미지에서 빼 이미지 크기를 줄인다.
# ═══════════════════════════════════════════════════════════
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# 2026-08-30: 의존성 레이어를 소스 레이어와 분리 — build.gradle.kts/settings.gradle.kts/
# gradle wrapper 만 먼저 복사해서 의존성을 미리 받아두면, 그 다음 COPY . . 이후 소스만 바뀐
# 재빌드에서는(대부분의 경우) 이 레이어가 Docker 캐시에 그대로 남아 의존성을 매번 다시
# 안 받는다 — 이전엔 COPY . . 한 줄이라 소스 한 글자만 바뀌어도 그 레이어부터 전부 무효화돼
# 매번 전체 의존성을 재다운로드했다.
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew --no-daemon dependencies || true

# 나머지 소스 복사 + 실제 빌드
COPY . .
RUN ./gradlew --no-daemon bootJar -x test

# ───────────────────────────────────────────────────────────
#  런타임 스테이지 — JRE only (JDK 대비 이미지 약 100~200MB 절감, 빌드 도구 불필요)
# ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
