# ═══════════════════════════════════════════════════════════
#  ShopJoy EcAdminApi - Dockerfile (Multi-stage Build)
# ═══════════════════════════════════════════════════════════
#  배치 위치: _apps/EcAdminApi/Dockerfile (이 파일을 복사하세요)
#  빌드 명령: docker build -t shopjoy/ecadminapi:latest .
# ═══════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────
#  STAGE 1: Build (Gradle + JDK 17)
#  - Gradle 의존성 캐시를 활용하여 재빌드 시간 단축
#  - 소스 변경 없이 의존성만 변경되면 다음 빌드는 매우 빠름
# ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

# Gradle 캐시 활용을 위해 의존성 파일을 먼저 복사
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

# gradlew 실행 권한 부여 + 의존성만 먼저 다운로드 (캐시 레이어)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# 소스 복사 후 빌드
COPY src ./src
RUN ./gradlew clean build -x test --no-daemon

# ───────────────────────────────────────────────────────────
#  STAGE 2: Runtime (JRE only - 이미지 크기 최소화)
#  - JDK 대신 JRE만 사용 → 이미지 약 200MB 절감
#  - builder 스테이지의 빌드 도구는 최종 이미지에 포함되지 않음
# ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre

LABEL maintainer="illeesam"
LABEL service="ShopJoy-EcAdminApi"
LABEL description="ShopJoy E-commerce Admin API (Spring Boot 3 / Java 17)"

# 컨테이너 내부 작업 디렉터리
WORKDIR /app

# 빌더 스테이지에서 JAR만 복사 (와일드카드로 버전 무관 매칭)
COPY --from=builder /workspace/build/libs/EcAdminApi-*.jar /app/EcAdminApi.jar

# 로그 디렉터리 (호스트 마운트 포인트)
RUN mkdir -p /app/logs

# 컨테이너 내부 포트 (Spring Boot HTTP — 외부 노출은 docker run -p 옵션에서 결정)
EXPOSE 3000

# JVM 옵션 (필요 시 docker run -e JAVA_OPTS="..." 로 오버라이드 가능)
ENV JAVA_OPTS="-Xms256m -Xmx1024m"

# Health check (60초 후부터 30초마다 상태 확인)
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/actuator/health || exit 1

# 컨테이너 시작 명령 (sh -c 로 환경변수 치환 가능하게 처리)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/EcAdminApi.jar"]
