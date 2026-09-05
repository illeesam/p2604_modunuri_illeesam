# scripts_testUrl — 점검용 URL 모음

5개 앱(`ecBeBo`/`ecBeCdn`/`ecFeBo`/`ecGateway`/`ecBeRedis`) 배포 스크립트(`apps/scripts_deploy_illeesam_synol/deploy-dev-synol-*.js`)의 `notifyDeployResult({ checkUrls })` 안에 흩어져 있던 점검 URL을 한 곳에 정리한 폴더입니다. NAS 접속정보(`.synology-deploy.env`) 없이 그냥 `node test-urls.js` 만 돌리면 됩니다 — 전부 공개(permitAll) URL만 다룹니다.

## 실행

```bash
cd apps/scripts_testUrl
npm run test:all          # 전체
npm run test:ecBeBo       # 서비스 하나만
node test-urls.js ecBeCdn ecFeBo   # 여러 개 지정
```

## 서비스별 URL

### ecBeBo — 백엔드(EcAdminApi, 22300)

| URL | 설명 |
|---|---|
| `http://illeesam.synology.me:22300/actuator/health` | 헬스체크 |
| `http://illeesam.synology.me:22300/home/index.html` | 🪵 로그뷰어(운영 도구, 인증 불필요) |
| `http://illeesam.synology.me:22300/swagger-ui/index.html` | API 문서(Swagger UI) |
| `http://illeesam.synology.me:22300/api/co/sy/code/page?pageNo=1&pageSize=1` | 공통코드 페이징 |
| `http://illeesam.synology.me:22300/api/co/sy/site?pageNo=1&pageSize=1` | 사이트 목록 |
| `http://illeesam.synology.me:22300/api/co/log/tail?file=app&lines=20` | 로그 tail API |

### ecBeCdn — CDN 서버(EcCdnApi, 22400)

| URL | 설명 |
|---|---|
| `http://illeesam.synology.me:22400/actuator/health` | 헬스체크 |
| `http://illeesam.synology.me:22400/home/index.html` | 관리자 화면(cf_file 관리) |
| `http://illeesam.synology.me:22400/home/index.html?page=logViewer` | 🪵 로그뷰어 |
| `http://illeesam.synology.me:22400/home/index.html?page=authTest` | 인증 테스트(로그인/재발급/강제폐기) |
| `http://illeesam.synology.me:22400/home/index.html?page=dbTest` | DB 연결 테스트 |
| `http://illeesam.synology.me:22400/api/cdn/client/page?pageNo=1&pageSize=1` | cf_client 목록 API |
| `http://illeesam.synology.me:22400/api/cdn/file/page?pageNo=1&pageSize=1` | cf_file 목록 API |
| `http://illeesam.synology.me:22400/api/cdn/log/tail?file=app&lines=20` | 로그 tail API |
| `http://illeesam.synology.me:22400/api/cdn/serve/file/__ping__` | 바이너리 서빙 라우팅 확인(404가 정상 — 존재하지 않는 fileId) |

> 2026-09-06: 인증(`/api/auth` → `/api/cdn/auth`)과 바이너리 서빙(`/cf` → `/api/cdn/serve`)을 `/api/cdn/**` 하나로 통일했습니다. 실제 파일 서빙(`/api/cdn/serve/file/{fileId}` 등)은 존재하는 `fileId`가 있어야 200이 나오는 동적 경로라 여기선 라우팅 생존만 404로 확인합니다.

### ecFeBo — 프론트 정적서버(22000, HTTPS)

| URL | 설명 |
|---|---|
| `https://22000.illeesam.synology.me/index.html` | 사용자(FO) 메인 화면 |
| `https://22000.illeesam.synology.me/bo.html` | 관리자(BO) 메인 화면(로그인 필요) |
| `https://22000.illeesam.synology.me/assets/cdn/pkg/vue/3.4.21/vue.global.prod.min.js` | 로컬 CDN 패키지(Vue) 정적서빙 확인 |

### ecGateway — 테스트 전용 게이트웨이(22099)

⚠️ 운영 경로가 아닙니다 — `ecBeBo`/`ecBeCdn`/`ecFeBo`가 이 NAS에 이미 떠 있어야 502 없이 통과합니다.

| URL | 설명 |
|---|---|
| `http://illeesam.synology.me:22099/index.html` | 사용자(FO) 메인(게이트웨이 경유) |
| `http://illeesam.synology.me:22099/bo.html` | 관리자(BO) 메인(게이트웨이 경유) |
| `http://illeesam.synology.me:22099/api/co/sy/code/page?pageNo=1&pageSize=1` | 공통코드 API(게이트웨이→ecBeBo) |
| `http://illeesam.synology.me:22099/admin-tools/index.html` | ecBeBo 로그뷰어(rewrite 경유) |
| `http://illeesam.synology.me:22099/cdn-admin/index.html` | ecBeCdn 관리화면(rewrite 경유) |
| `http://illeesam.synology.me:22099/api/cdn/client/page?pageNo=1&pageSize=1` | ecBeCdn API(게이트웨이 경유, `/api/cdn/` 통합 확인) |

### ecBeRedis — HTTP 점검 없음

Redis는 HTTP가 아니라 자체 프로토콜이라 이 스크립트로는 확인하지 않습니다. `npm run deploy:dev-synol-ecBeRedis`(`apps/scripts_deploy_illeesam_synol/`)가 배포 중 컨테이너 안에서 `redis-cli -a $REDIS_PASSWORD ping`으로 직접 확인합니다.

## 목록을 최신으로 유지하려면

URL이 추가/삭제되면 **두 곳을 같이** 고쳐야 합니다 — 어느 한쪽만 고치면 다음에 또 어긋납니다.

1. `apps/scripts_testUrl/test-urls.data.js` (이 폴더)
2. `apps/scripts_deploy_illeesam_synol/deploy-dev-synol-*.js` 안의 해당 서비스 `checkUrls` 배열
