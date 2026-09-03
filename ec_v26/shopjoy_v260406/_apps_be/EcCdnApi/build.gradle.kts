// EcCdnApi — 동영상/이미지 스트리밍·업로드 전용 CDN 서버.
// EcAdminApi(관리자 CRUD API)와 형제 앱이지만 역할이 완전히 다르다 — 여기는 파일을 실제로
// 디스크에 쓰고, 이미지/동영상 썸네일을 만들고, Range 요청으로 스트리밍하는 것만 한다.
// 그래서 EcAdminApi가 쓰는 QueryDSL/MyBatis/Redis/POI/Flyway/Jasypt 는 전부 불필요 —
// Spring Data JPA(단순 CRUD) + JWT(내부 서비스간 인증) + Thumbnailator(이미지 썸네일)만 있으면 된다.
// 동영상 첫 프레임 추출은 라이브러리가 아니라 외부 프로세스(ffmpeg, Dockerfile에서 설치)로 한다.
plugins {
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.5"
    id("java")
}

group = "com.shopjoy"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot Starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // PostgreSQL — EcAdminApi 와 같은 서버(illeesam.synology.me:17632), cf_* 전용 테이블만 새로 씀
    runtimeOnly("org.postgresql:postgresql")

    // p6spy — SQL 로그(바인딩 값 치환 + 정렬) — EcAdminApi 와 동일 버전. local/dev 프로파일에서만
    // driver-class-name 을 com.p6spy.engine.spy.P6SpyDriver 로 스왑해 활성화(요청사항: "개발인 경우").
    implementation("p6spy:p6spy:3.9.1")

    // Jedis — 관리 화면의 "Redis 모니터링" 테스트 도구 전용(요청사항). 화면에서 입력한 임의의
    // host/port/password 로 그때그때 접속해 PING/INFO 만 확인하는 1회성 클라이언트라 커넥션풀이
    // 필요없는 Jedis 가 더 간단하다(요청마다 새 ConnectionFactory 를 만들어야 하는 Lettuce/Spring
    // Data Redis 보다).
    implementation("redis.clients:jedis:5.1.0")

    // Spring Data Redis(Lettuce) — 실제 인증 캐시 연동 전용(요청사항: "redis 인증 연동해줘 단
    // redis switch 될수 있게 해줘"). EcAdminApi 의 cache/config/RedisConfig.java 와 동일하게
    // app.redis.enabled=true 일 때만 빈이 뜨는 스위치 구조 — 기본은 off, DB(cf_token)가 항상
    // source of truth 이고 Redis 는 조회 편의용 캐시일 뿐이다.
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // JWT (jjwt 0.12.x) — EcAdminApi 와 동일 버전. accessToken(30초)/refreshToken 발급·검증에 사용
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")

    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // 이미지 썸네일 (EcAdminApi 의 CmUploadService 와 동일 라이브러리 — 컨벤션 통일)
    implementation("net.coobird:thumbnailator:0.4.20")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.add("-parameters")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// EcAdminApi 와 동일 — bootJar 만 쓰고 plain jar(*-plain.jar) 는 생성 안 함
tasks.named<Jar>("jar") {
    enabled = false
}
