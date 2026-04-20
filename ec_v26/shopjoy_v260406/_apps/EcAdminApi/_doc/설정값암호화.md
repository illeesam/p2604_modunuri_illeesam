# 설정값 암호화 정책 (Jasypt)

## 목적

`application-dev.yml`, `application-prod.yml` 등 설정 파일에 포함된 민감 정보(DB 비밀번호, JWT 시크릿 등)를 암호화하여 git 저장소 노출을 방지한다.

## 사용 라이브러리

| 항목 | 값 |
|---|---|
| 라이브러리 | `com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.5` |
| 내부 암호화 엔진 | `org.jasypt:jasypt:1.9.3` |
| 알고리즘 | `PBEWITHHMACSHA512ANDAES_256` |

## 암호화 대상

| 항목 | yml 키 |
|---|---|
| DB 비밀번호 | `spring.datasource.password` |
| JWT 시크릿 | `jwt.secret` |
| 기타 외부 API 키 | 각 해당 키 |

## 암호화 값 생성 방법

`src/test/java/com/shopjoy/ecadminapi/JasyptEncryptorTest.java` 의 `encryptValue()` 테스트를 실행한다.

1. `MASTER_KEY` 상수를 마스터키로 변경
2. `plainText` 를 암호화할 값으로 변경
3. JUnit 실행 → 콘솔의 `ENC(...)` 값 복사
4. yml 파일에 붙여넣기

```yaml
spring:
  datasource:
    password: ENC(암호화된값)
jwt:
  secret: ENC(암호화된값)
```

## 마스터키 주입 방법

> 마스터키는 절대 git에 커밋하지 않는다.

### 운영/개발 서버 (추천)

환경변수로 주입:

```bash
export JASYPT_ENCRYPTOR_PASSWORD=마스터키
java -jar ecadminapi.jar
```

### 로컬 개발 환경

`application-local.yml` 에 작성 (`.gitignore` 로 추적 제외됨):

```yaml
jasypt:
  encryptor:
    password: 마스터키
```

### IntelliJ Run Configuration

VM options에 추가:

```
-Djasypt.encryptor.password=마스터키
```

## 복호화 확인

`JasyptEncryptorTest.java` 의 `decryptValue()` 테스트에 ENC() 안의 값을 넣어 실행하면 원문 확인 가능.

## 주의사항

- 같은 평문도 실행마다 다른 암호문이 생성된다 (`RandomIvGenerator` 사용). 복호화는 동일하게 동작하므로 어느 값이든 사용 가능.
- `application-local.yml` 은 `.gitignore` 에 등록되어 있어 git 추적에서 제외된다.
- 마스터키를 분실하면 복호화 불가 → 별도 안전한 저장소(팀 패스워드 매니저 등)에 보관한다.
- CI/CD 파이프라인에서는 환경변수 또는 시크릿 스토어(GitHub Secrets, Vault 등)로 주입한다.

## 관련 파일

| 파일 | 용도 |
|---|---|
| `src/test/.../JasyptEncryptorTest.java` | 암호화/복호화 값 생성 테스트 |
| `build.gradle` | jasypt-spring-boot-starter 의존성 |
| `src/main/resources/application-dev.yml` | 개발 서버 설정 (ENC 값 적용) |
| `src/main/resources/application-local.yml` | 로컬 설정 (.gitignore 제외) |
