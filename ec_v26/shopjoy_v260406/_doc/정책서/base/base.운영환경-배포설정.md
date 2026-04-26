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

gzip 압축 시 JS 파일 크기 약 70% 감소 (`BaseModal.js` 130KB → ~35KB).

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
