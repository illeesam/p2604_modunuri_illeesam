# ═══════════════════════════════════════════════════════════
#  ShopJoy EcAdminApi - Dockerfile
# ═══════════════════════════════════════════════════════════
#  2026-09-05: 멀티스테이지(컨테이너 안에서 gradlew bootJar 재빌드) → 단일스테이지로
#  단순화. 이 프로젝트가 백엔드를 배포하는 두 경로(직접 SSH — scripts/deployDevSynolBe.js
#  / GitHub Actions CI — shopjoy-be-illeesam-synol-deploy.yml) 는 **둘 다 Docker 빌드
#  이전에 이미 로컬 또는 CI 러너에서 gradlew bootJar 로 jar 를 먼저 만들어서 build
#  context 에 포함시켜둔다** — 그러니 이 Dockerfile 이 컨테이너 안에서 Gradle 로 또
#  재빌드할 이유가 없다.
#
#  실제로 겪은 장애(2026-09-05): 옛 멀티스테이지 버전은 COPY gradlew/gradle/*.gradle.kts +
#  COPY . . 로 "전체 소스"가 build context 에 있어야만 했다. GitHub Actions 경로는 CI
#  체크아웃 전체가 context 라 문제없었지만, 직접 SSH 배포 경로는 NAS의
#  /volume1/docker/shopjoy/backend/ 에 jar + 설정파일 몇 개만 올라가 있어서(전체 소스
#  없음) COPY gradlew.bat 단계에서 "not found"로 빌드 자체가 실패했다 — NAS 폴더가
#  수동 삭제됐다가 복구되는 과정에서 이 설계 결함이 처음 드러남.
#
#  JDK17-jdk 스테이지(Gradle 재빌드) 없이, JRE17 이미지 하나로 이미 만들어진 jar 만
#  담아 실행한다 — 이미지도 더 작고 빌드도 훨씬 빠르며, 두 배포 경로 모두에서 build
#  context 요구사항이 "jar 파일 하나"로 통일된다.
# ═══════════════════════════════════════════════════════════
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY *.jar app.jar
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
