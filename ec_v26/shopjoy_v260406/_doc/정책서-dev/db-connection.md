# DB 연결 정보

## 개발/운영 공통 DB (PostgreSQL)

| 항목 | 값 |
|---|---|
| **Profile** | `dev` |
| **DB 타입** | PostgreSQL |
| **Host** | `illeesam.synology.me` |
| **Port** | `17632` |
| **Database** | `postgres` |
| **Schema** | `shopjoy_2604` |
| **Username** | `postgres` |
| **Password** | `postgresilleesam` |

## Spring Boot 실행 파라미터

```
-Dspring.profiles.active=dev
-DDB_HOST=illeesam.synology.me
-DDB_PORT=17632
-DDB_NAME=postgres
-DDB_SCHEMA=shopjoy_2604
-DDB_USERNAME=postgres
-DDB_PASSWORD=postgresilleesam
```

## JDBC URL (참조용)

```
jdbc:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604
```

## application-dev.yml 설정 예시

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?currentSchema=${DB_SCHEMA}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
```
