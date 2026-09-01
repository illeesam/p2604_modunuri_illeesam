# ═══════════════════════════════════════════════════════════
#  ShopJoy EcAdminApi - Dockerfile (Multi-stage Build)
# ═══════════════════════════════════════════════════════════
#  배치 위치: _apps/EcAdminApi/Dockerfile (이 파일을 복사하세요 — 실제 소스와 동일한 파일이며,
#    _apps_be/EcAdminApi/Dockerfile 이 진짜 사용되는 원본이다. 이 문서 사본은 참고용으로만 두되,
#    바뀔 때마다 같이 갱신할 것 — 예전에 build.gradle/settings.gradle(Groovy) 로 잘못 적혀있던
#    걸 실제 프로젝트가 쓰는 build.gradle.kts/settings.gradle.kts(Kotlin DSL) 로 2026-08-30 정정)
#  빌드 명령: docker build -t shopjoy/ecadminapi:latest .
# ═══════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────
#  STAGE 1: Build (JDK 17 — build.gradle.kts 의 sourceCompatibility/targetCompatibility 와 일치)
#  - Gradle 의존성 캐시를 활용하여 재빌드 시간 단축(소스만 바뀌면 의존성 재다운로드 스킵)
# ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Gradle 캐시 활용을 위해 의존성 관련 파일만 먼저 복사
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew --no-daemon dependencies || true

# 나머지 소스 복사 후 빌드
COPY . .
RUN ./gradlew --no-daemon bootJar -x test

# ───────────────────────────────────────────────────────────
#  STAGE 2: Runtime (JRE only - 이미지 크기 최소화)
#  - JDK 대신 JRE만 사용 → 이미지 약 100~200MB 절감
#  - build 스테이지의 컴파일러 등 빌드 도구는 최종 이미지에 포함되지 않음
# ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
