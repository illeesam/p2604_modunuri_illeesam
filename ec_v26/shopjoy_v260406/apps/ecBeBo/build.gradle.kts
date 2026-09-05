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

// QueryDSL Q클래스 생성 경로
val querydslDir = "$buildDir/generated/querydsl"  // 추가

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
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
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // QueryDSL
    implementation("com.querydsl:querydsl-jpa:5.0.0:jakarta")
    implementation("com.querydsl:querydsl-core:5.0.0")
    annotationProcessor("com.querydsl:querydsl-apt:5.0.0:jakarta")
    annotationProcessor("jakarta.annotation:jakarta.annotation-api")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")

    // MyBatis
    implementation("org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.3")
    implementation("org.mybatis:mybatis:3.5.15")

    // PostgreSQL
    runtimeOnly("org.postgresql:postgresql")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // JWT (jjwt 0.12.x)
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")

    // Jackson
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // P6Spy (local/dev SQL logging)
    implementation("p6spy:p6spy:3.9.1")

    // Jasypt (설정값 암호화)
    implementation("com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.5")

    // Redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // Apache POI (XLSX 다운로드, SXSSF 스트리밍 — 대용량 메모리 효율)
    implementation("org.apache.poi:poi:5.2.5")
    implementation("org.apache.poi:poi-ooxml:5.2.5")

    // Flyway (Database Migration)
    implementation("org.flywaydb:flyway-core:10.0.1")
    implementation("org.flywaydb:flyway-database-postgresql:10.0.1")

    // Swagger/OpenAPI — 2026-09-06: application.yml(springdoc.*)/SecurityConfig(permitAll)는
    // 이미 준비돼 있었는데 이 의존성 한 줄만 주석 처리돼 있어서 /swagger-ui/index.html 이 계속
    // 404 였다(test-urls.js 로 실측 발견). 활성화.
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.4.0")

    // DevTools (핫 리로드)
    //developmentOnly("org.springframework.boot:spring-boot-devtools")

    // 이미지 처리 (썸네일 생성)
    implementation("net.coobird:thumbnailator:0.4.20")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

// Q클래스 생성 전용 태스크
// impl 파일들은 Q-클래스를 임포트하므로 제외 (Q-클래스가 아직 없을 때 컴파일 오류)
tasks.register<JavaCompile>("generateQueryDsl") {
    group = "build"
    description = "QueryDSL Q-클래스 생성"
    // @Entity 클래스 + 의존 공통 파일 (EntitySaveListener → SecurityUtil → AuthPrincipal)
    // + 엔티티의 @Transient 필드가 참조하는 DTO (AttachFile)
    source = fileTree("src/main/java") {
        include(
            "**/entity/*.java",
            "**/data/entity/*.java",
            "**/common/util/SecurityUtil.java",
            "**/co/auth/security/AuthPrincipal.java",
            "**/base/sy/data/dto/AttachFile.java"
        )
    }
    classpath = configurations.compileClasspath.get()
    options.encoding = "UTF-8"
    options.annotationProcessorPath = configurations.annotationProcessor.get()
    options.compilerArgs.addAll(listOf("-proc:only"))
    destinationDirectory.set(layout.buildDirectory.dir("tmp/querydsl-apt-out"))
    options.generatedSourceOutputDirectory.set(file(querydslDir))
}

// Q클래스를 소스셋에 포함
sourceSets {
    main {
        java {
            srcDir(querydslDir)
        }
    }
}

// compileJava 는 Q클래스 생성 후 실행
// querydsl-apt 는 generateQueryDsl 에서 이미 실행됐으므로 제외 → 중복 생성 오류 방지
tasks.named<JavaCompile>("compileJava") {
    dependsOn("generateQueryDsl")
    options.encoding = "UTF-8"
    options.compilerArgs.add("-parameters")
    options.annotationProcessorPath = configurations.annotationProcessor.get().filter {
        !it.name.startsWith("querydsl-apt")
    }
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.named<Jar>("jar") {
    enabled = false
}
