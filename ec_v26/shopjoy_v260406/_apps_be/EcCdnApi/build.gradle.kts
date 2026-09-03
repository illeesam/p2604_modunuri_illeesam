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
