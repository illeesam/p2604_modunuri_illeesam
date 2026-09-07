# base.운영환경-배포설정 — ShopJoy 라이브 서버 구성 가이드

## 1. 아키텍처 개요

```
인터넷
  │
  ▼
Synology NAS (illeesam.synology.me)
  ├─ Nginx (Web Station 역방향 프록시)  ← HTTPS/HTTP2/gzip 처리
  │    ├─ 정적 파일 직접 서빙 (JS/CSS/이미지)
  │    └─ /api/* → localhost:3000 프록시
  └─ Spring Boot EcAdminApi (port 3000)
       └─ PostgreSQL (port 17632)
```

---

## 2. HTTPS 인증서 발급 (전제 조건)

HTTP/2는 **HTTPS 필수**. Let's Encrypt 무료 인증서 사용.

**DSM → 제어판 → 보안 → 인증서** 탭
1. `추가` 버튼 클릭
2. `Let's Encrypt에서 인증서 받기` 선택
3. 도메인: `illeesam.synology.me` 입력
4. 발급 완료 후 해당 사이트에 인증서 할당

> 90일마다 자동 갱신됨. 별도 작업 불필요.

---

## 3. HTTP/2 + gzip 활성화

### 왜 필요한가

`bo.html` 기준 script 태그 **156개** — HTTP/1.1에서는 브라우저가 도메인당 6개씩만 병렬 처리.

| 프로토콜 | 방식 | 156개 파일 로드 시간 (RTT 50ms 기준) |
|---|---|---|
| HTTP/1.1 | 6개씩 줄 서기 | 26라운드 × 50ms = **1.3초** 대기 |
| HTTP/2 | 멀티플렉싱 (동시 전송) | 1라운드 × 50ms = **50ms** |

gzip 압축 시 JS 파일 크기 약 70% 감소 (`BaseModals.js` 130KB → ~35KB).

### Synology Web Station에서 활성화

**DSM → 웹 스테이션 → 웹 서비스 포털 → 해당 사이트 편집**

- [x] **HTTP/2 활성화** 체크
- [x] **Gzip 압축 활성화** 체크

### Nginx 커스텀 설정으로 직접 적용 (선택)

```bash
# SSH 접속
sudo vi /etc/nginx/conf.d/shopjoy.conf
```

```nginx
server {
    listen 443 ssl http2;
    server_name illeesam.synology.me;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # gzip 압축
    gzip on;
    gzip_types text/javascript application/javascript text/css application/json text/html;
    gzip_min_length 1024;
    gzip_comp_level 6;

    # 정적 파일 캐시 (JS/CSS는 파일명 변경 시까지 캐시)
    root /var/www/shopjoy_v260406;
    location ~* \.(js|css|png|jpg|gif|ico|woff2|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API → Spring Boot
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name illeesam.synology.me;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t        # 문법 검사
sudo nginx -s reload # 무중단 적용
```

---

## 4. 역방향 프록시 설정 (Spring Boot API 연결)

**DSM → 로그인 포털 → 고급 → 역방향 프록시 → 생성**

| 항목 | 값 |
|---|---|
| 소스 프로토콜 | HTTPS |
| 소스 호스트명 | `illeesam.synology.me` |
| 소스 포트 | 443 |
| 대상 프로토콜 | HTTP |
| 대상 호스트명 | `localhost` |
| 대상 포트 | `3000` |

**사용자 지정 헤더** 탭 → **WebSocket** 버튼 클릭 (자동 추가):
```
Upgrade: $http_upgrade
Connection: $connection_upgrade
```

---

## 4-A. code-server(브라우저용 VS Code) 역방향 프록시 설정 (2026-09-08)

`scripts/scripts_deploy_illeesam_synol/codeserver/`로 배포하는 code-server 1~5번 인스턴스를
`http://illeesam.synology.me:2510N`(직접 포트) 대신 `https://2510N.illeesam.synology.me`
서브도메인으로 접속하고 싶을 때의 설정. §4와 동일한 패턴이지만 **대상 포트가 인스턴스마다
다르고(25100~25500), 인스턴스 개수만큼 인증서·규칙을 반복**해야 한다는 점이 다르다.

### 0단계 — 서브도메인 인증서 발급 (역방향 프록시보다 먼저)

`illeesam.synology.me` 인증서(§2)는 그 도메인 자체에만 유효하고, `2510N.illeesam.synology.me`
같은 서브도메인은 **별도 인증서가 있어야** 브라우저가 경고 없이 접속한다.

**DSM → 제어판 → 보안 → 인증서 → 추가**
1. `인증서 추가` → `Let's Encrypt에서 인증서 받기` 선택
2. 도메인 이름: `2510N.illeesam.synology.me` (예: 1번 인스턴스 → `25100.illeesam.synology.me`)
   — **와일드카드(`*.illeesam.synology.me`) 아님.** DSM 기본 HTTP-01 방식은 정확한 개별
   도메인명만 발급 가능하고, 와일드카드는 DNS-01 챌린지(지원되는 DNS 공급자 연동)가 필요해
   더 번거롭다 — 인스턴스가 5개뿐이라 서브도메인별 개별 발급이 더 간단하다.
3. 이메일 입력 후 발급 — 인증서 목록에 `2510N.illeesam.synology.me - {만료일}` 로 표시됨
   (예: `25100.illeesam.synology.me - 2026-12-06`, 90일 유효·자동 갱신, §2와 동일)
4. 인증서 목록 화면 우측 상단 **[설정]** 버튼 → 방금 만든 인증서를 이 서브도메인(또는 해당
   역방향 프록시 서비스)에 연결 — DSM 버전에 따라 SNI로 자동 매칭되기도 하나, 안 뜨면 이 단계를
   수동으로 확인할 것.
5. 인스턴스 5개(`25100`~`25500`) 만큼 반복.

### 1단계 — 역방향 프록시 규칙

**DSM → 로그인 포털 → 고급 → 역방향 프록시 → 생성** (인스턴스별로 반복)

| 항목 | 값 (예: 1번 인스턴스) |
|---|---|
| 소스 프로토콜 | HTTPS |
| 소스 호스트명 | `25100.illeesam.synology.me` |
| 소스 포트 | 443 |
| 대상 프로토콜 | HTTP |
| 대상 호스트명 | `localhost` |
| 대상 포트 | `25100` |

2번~5번은 `25100` 자리를 각각 `25200`~`25500`으로 바꿔서 동일하게 반복.

### ⛔ "사용자 지정 머리글" 탭 — WebSocket 헤더 필수 (빠뜨리기 쉬움)

"일반" 탭만 저장하고 끝내면 **초기 화면은 뜨지만 곧바로 아래 에러로 작업이 막힌다**(실측 확인,
2026-09-08):

```
An unexpected error occurred that requires a reload of this page.
The workbench failed to connect to the server (Error: WebSocket close with status code 1006)
```

**원인**: code-server(VS Code Web)는 터미널·파일감시·확장 호스트 통신에 WebSocket을 광범위하게
쓰는데, DSM 역방향 프록시는 기본 설정으로는 일반 HTTP 요청만 릴레이하고 **WebSocket 업그레이드
요청은 통과시키지 않는다**. HTTP로 뜨는 최초 페이지 로드는 성공하니 겉보기엔 정상처럼 보이다가,
WebSocket이 필요한 순간(터미널 열기 등) 끊긴다. **리로드해도 재발한다** — 클라이언트 문제가
아니라 프록시 설정 문제라서 브라우저 쪽에서 고칠 방법이 없다.

**해결**: 그 프록시 규칙 편집 → **사용자 지정 머리글** 탭 → **[생성] → WebSocket** 프리셋 선택
(DSM 7.x 기준 자동 추가됨). 프리셋이 없는 구버전이면 수동으로:
```
Upgrade: $http_upgrade
Connection: $connection_upgrade
```

> 이 헤더 2개는 code-server 뿐 아니라 **WebSocket을 쓰는 모든 백엔드**(Spring Boot의 STOMP/
> SockJS 엔드포인트 등)를 DSM 역방향 프록시 뒤에 둘 때 동일하게 필요하다 — §4의 Spring Boot API
> 규칙도 이미 이 헤더를 전제로 한다.

**임시 우회**: 프록시 설정을 아직 안 고쳤다면 직접 포트로 접속하면 WebSocket 문제 자체가 없다.
```
http://illeesam.synology.me:2510N
```

---

## 5. Spring Boot 운영 실행

```bash
# 환경변수 파일 로드 후 실행 (비밀번호 평문 노출 방지)
source /etc/ecadminapi.env
java -jar ecadminapi.jar --spring.profiles.active=prod
```

### `/etc/ecadminapi.env` 예시 (권한 600 필수)

```bash
export DB_HOST=illeesam.synology.me
export DB_PORT=17632
export DB_NAME=postgres
export DB_SCHEMA=shopjoy_2604
export DB_USERNAME=postgres
export DB_PASSWORD=실제비밀번호

export JWT_SECRET=32자이상랜덤문자열
export LICENSE_SECRET=라이센스시크릿

export AWS_S3_BUCKET=shopjoy-files-prod
export AWS_REGION=ap-northeast-2
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_CLOUDFRONT_URL=https://cdn.shopjoy.com
```

```bash
chmod 600 /etc/ecadminapi.env
```

---

## 6. 적용 확인

### HTTP/2 확인

```bash
curl -I --http2 https://illeesam.synology.me/bo.html
# HTTP/2 200 이 출력되면 성공
```

브라우저 개발자도구 → **Network 탭** → Protocol 컬럼:
- `h2` → HTTP/2 적용됨
- `http/1.1` → 미적용

### gzip 확인

```bash
curl -H "Accept-Encoding: gzip" -I https://illeesam.synology.me/bo.html
# Content-Encoding: gzip 이 출력되면 성공
```

---

## 7. 체크리스트

```
[ ] Let's Encrypt 인증서 발급 완료
[ ] Web Station HTTP/2 활성화
[ ] Web Station Gzip 활성화
[ ] 역방향 프록시 → localhost:3000 설정
[ ] /etc/ecadminapi.env 파일 생성 (chmod 600)
[ ] Spring Boot --spring.profiles.active=prod 실행
[ ] curl --http2 로 H2 확인
[ ] 브라우저 Network 탭 Protocol = h2 확인
```

---

## 관련 파일

| 파일 | 설명 |
|---|---|
| `_apps/EcAdminApi/src/main/resources/application-prod.yml` | Spring Boot 운영 설정 |
| `_apps/EcAdminApi/README.md` | API 서버 실행 방법 |
| `base.설정값암호화.md` | 환경변수 암호화 정책 |
