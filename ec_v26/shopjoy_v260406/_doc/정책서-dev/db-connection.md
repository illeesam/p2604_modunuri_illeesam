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

## 로컬 로그인 / 검증 계정 (마스터 비밀번호)

개발·검증 환경에서는 **마스터 비밀번호 `1111`** 이 모든 계정에 공통 적용된다.
(사용자 선택 모달에도 "선택 시 마스터 패스워드(1111)로 자동 로그인" 으로 명시)

| 항목 | 값 |
|---|---|
| **마스터 비밀번호** | `1111` (전 계정 공통) |
| **권장 검증 계정** | `admin1` / `1111`, `admin2` / `1111` (관리자 권한 — 전체 메뉴 접근) |
| **기타 계정** | `user1`, `oper1`, `mktmgr`, `salesview`, `prodmgr`, `csmgr` 등 (sy_user, 약 65명) |
| **로그인 API** | `POST http://127.0.0.1:3000/api/co/bo-auth/login` |
| **포트** | 백엔드 `3000` · Live Server `5501` (bo.html / index.html) |

> ⚠️ **비밀번호는 SHA256 해시로 전송**한다. body `{ loginId, loginPwd: sha256("1111"), authMethod }`.
> 평문 `1111` 은 `login:103`(불일치) 으로 실패. 프론트 `boAuthStore.saLogin(loginId, loginPwd, authMethod)` 가
> 내부에서 `coUtil.cofSha256(loginPwd)` 로 해시하므로 store 경유 시엔 평문 `1111` 을 그대로 전달하면 된다.

```bash
# 브라우저 자동 검증(puppeteer 등) — 페이지 컨텍스트에서 store 직접 호출
await window.useBoAuthStore().saLogin('admin1', '1111', '메인');
window.location.hash = '#page=cmNoticeMng';   // 이후 화면 이동
```
