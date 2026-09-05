# ═══════════════════════════════════════════════════════════
#  ShopJoy EcCdnApi - Dockerfile
# ═══════════════════════════════════════════════════════════
#  EcAdminApi/Dockerfile 과 같은 원칙(단일스테이지, jar 는 컨테이너 밖에서 이미 빌드해서
#  build context 에 올려둔다 — deploy-dev-synol-be-ecCdnApi.js 가 gradlew bootJar 를 먼저 돌림).
#
#  EcAdminApi 와 다른 점 하나: ffmpeg 가 필요하다(동영상 첫 프레임 추출, CfVideoFrameService 가
#  외부 프로세스로 호출). eclipse-temurin 공식 이미지는 Debian/Ubuntu 계열(non-alpine 태그)이라
#  apt-get 으로 바로 설치 가능 — apt 캐시는 마지막에 지워서 이미지 크기를 최소화한다.
# ═══════════════════════════════════════════════════════════
FROM eclipse-temurin:17-jre

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY *.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
