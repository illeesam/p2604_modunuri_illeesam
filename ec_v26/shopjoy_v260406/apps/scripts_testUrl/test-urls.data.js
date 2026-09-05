/* test-urls.data.js — 5개 앱(ecBeBo/ecBeCdn/ecFeBo/ecGateway/ecBeRedis)의 점검용 URL을 한 곳에
 * 모아둔 데이터 파일(로직 없음). 각 deploy-dev-synol-*.js 의 notifyDeployResult({ checkUrls })
 * 에 흩어져 있던 목록을 그대로 옮겨왔다 — 배포 스크립트를 매번 뒤져야 "지금 뭘로 확인하면
 * 되지?"를 알 수 있던 걸, 이 파일 하나만 보면 되게 정리(요청사항: "테스트 URL 정보 정리해줄
 * 수 있어?").
 *
 * ⚠️ 이 파일은 목록만 갖고 있다 — 실제로 찔러보는 건 test-urls.js. 여기 URL을 추가/삭제할 땐
 * 대응하는 deploy-dev-synol-*.js 의 checkUrls 배열도 같이 맞춰줄 것(반대도 마찬가지).
 *
 * ecBeRedis 는 HTTP 엔드포인트가 없다(Redis 프로토콜) — deploy-dev-synol-be-ecBeRedis.js 가
 * 배포 중 `redis-cli -a $REDIS_PASSWORD ping` 으로 직접 확인하므로 여기 목록엔 없음.
 *
 * 2026-09-06: 22000/22099/22300/22400 전부 DSM 리버스프록시+전용 Let's Encrypt 인증서(SAN
 * 단독) 등록 완료(curl 실측 200 확인). 이제 같은 엔드포인트를 아래 3가지 접근 방식으로 각각
 * 확인할 수 있다(요청사항: "npm script 에는 URL예제에 https 방식 http port 방식 다 제시해주고"
 * + "gateway 방식도") — 접근 방식별로 실제로 뭐가 다른지는 각 서비스 블록 상단 주석 참조.
 *   1) HTTPS 서브도메인 직접   — https://{port}.illeesam.synology.me/...   (운영/브라우저 정식 경로)
 *   2) HTTP 호스트:포트 직접   — http://illeesam.synology.me:{port}/...    (디버깅 전용, 평문)
 *   3) 게이트웨이(22099) 경유 — http(s)://…22099…/...                     (ecGateway 가 내부 prefix
 *      라우팅으로 3개 서비스를 한 origin 으로 묶어줌 — 테스트 전용, 운영 경로 아님. ecGateway
 *      의 locations.conf 에 명시적 규칙이 있는 경로만 여기 포함시켰다 — 없는 경로는 "/" 캐치올
 *      → @backend 폴백으로 우연히 될 수도 있지만 확실치 않아 목록에서 뺐다)
 */
const HOST = 'illeesam.synology.me';
const GW = `${HOST}:22099`;      // ecGateway, HTTP 포트 방식
const GW_HTTPS = `22099.${HOST}`; // ecGateway, HTTPS 서브도메인 방식(2026-09-06 인증서 등록 완료)

const services = {
  // ── ecBeBo(22300) — 관리자 백엔드 API. 전부 로그인 불필요(공개 라우트만 모음). ──
  // 접근 방식 3가지: HTTPS 서브도메인(22300.illeesam...) / HTTP 포트(illeesam...:22300) /
  // 게이트웨이(22099, /api/**·/admin-tools/** 만 명시적으로 이 백엔드로 라우팅됨).
  ecBeBo: {
    label: '백엔드(EcAdminApi, 22300)',
    urls: [
      { url: `https://22300.${HOST}/actuator/health`, note: '헬스체크 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/actuator/health`, note: '헬스체크 (HTTP 포트)' },

      { url: `https://22300.${HOST}/home/index.html`, note: '🪵 로그뷰어 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/home/index.html`, note: '🪵 로그뷰어 (HTTP 포트)' },
      { url: `http://${GW}/admin-tools/index.html`, note: '🪵 로그뷰어 (게이트웨이 경유, HTTP — rewrite: /admin-tools/→/home/)' },
      { url: `https://${GW_HTTPS}/admin-tools/index.html`, note: '🪵 로그뷰어 (게이트웨이 경유, HTTPS)' },

      { url: `https://22300.${HOST}/swagger-ui/index.html`, note: 'API 문서(Swagger UI) (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/swagger-ui/index.html`, note: 'API 문서(Swagger UI) (HTTP 포트)' },

      { url: `https://22300.${HOST}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징 (HTTP 포트)' },
      { url: `http://${GW}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징 (게이트웨이 경유, HTTP — /api/→ecBeBo)' },
      { url: `https://${GW_HTTPS}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징 (게이트웨이 경유, HTTPS)' },

      { url: `https://22300.${HOST}/api/co/sy/site?pageNo=1&pageSize=1`, note: '사이트 목록 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/api/co/sy/site?pageNo=1&pageSize=1`, note: '사이트 목록 (HTTP 포트)' },

      { url: `https://22300.${HOST}/api/co/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄) (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22300/api/co/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄) (HTTP 포트)' },
    ],
  },

  // ── ecBeCdn(22400) — CDN 서버(파일 업로드/서빙). 관리화면+API 전부 permitAll. ──
  // 게이트웨이는 /api/cdn/** 와 /cdn-admin/**(rewrite) 만 명시적으로 이 서버로 라우팅.
  ecBeCdn: {
    label: 'CDN 서버(EcCdnApi, 22400)',
    urls: [
      { url: `https://22400.${HOST}/actuator/health`, note: '헬스체크 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/actuator/health`, note: '헬스체크 (HTTP 포트)' },

      { url: `https://22400.${HOST}/home/index.html`, note: '관리자 화면 기본 진입(cf_file 관리) (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/home/index.html`, note: '관리자 화면 기본 진입(cf_file 관리) (HTTP 포트)' },
      { url: `http://${GW}/cdn-admin/index.html`, note: '관리자 화면 (게이트웨이 경유, HTTP — rewrite: /cdn-admin/→/home/)' },
      { url: `https://${GW_HTTPS}/cdn-admin/index.html`, note: '관리자 화면 (게이트웨이 경유, HTTPS)' },

      { url: `https://22400.${HOST}/home/index.html?page=logViewer`, note: '🪵 로그뷰어 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/home/index.html?page=logViewer`, note: '🪵 로그뷰어 (HTTP 포트)' },

      { url: `https://22400.${HOST}/home/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기) (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/home/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기) (HTTP 포트)' },

      { url: `https://22400.${HOST}/home/index.html?page=dbTest`, note: 'DB 연결 테스트 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/home/index.html?page=dbTest`, note: 'DB 연결 테스트 (HTTP 포트)' },

      { url: `https://22400.${HOST}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API (HTTP 포트)' },
      { url: `http://${GW}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API (게이트웨이 경유, HTTP — /api/cdn/→ecBeCdn)' },
      { url: `https://${GW_HTTPS}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API (게이트웨이 경유, HTTPS)' },

      { url: `https://22400.${HOST}/api/cdn/file/page?pageNo=1&pageSize=1`, note: 'cf_file 목록 API (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/api/cdn/file/page?pageNo=1&pageSize=1`, note: 'cf_file 목록 API (HTTP 포트)' },

      { url: `https://22400.${HOST}/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄) (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22400/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄) (HTTP 포트)' },

      // 2026-09-06: CfAuthController/CfFileServeController/CfStreamController 를 /api/auth,/cf →
      // /api/cdn/auth,/api/cdn/serve 로 통일한 뒤의 실제 경로. file/{fileId} 는 존재하는 fileId 가
      // 있어야 200 이 나므로(동적 값) 여기선 "경로 존재 확인"만 한다 — CfFileService.getOrThrow 가
      // CfBizException(존재하지 않는 파일) → GlobalExceptionHandler 가 400 으로 응답하는 걸 확인하면
      // 라우팅은 살아있는 것(자원이 없을 뿐).
      { url: `https://22400.${HOST}/api/cdn/serve/file/__ping__`, note: '바이너리 서빙 라우팅 확인(존재하지 않는 fileId → 400 이 정상) (HTTPS 서브도메인)', expect: 400 },
      { url: `http://${HOST}:22400/api/cdn/serve/file/__ping__`, note: '바이너리 서빙 라우팅 확인(존재하지 않는 fileId → 400 이 정상) (HTTP 포트)', expect: 400 },
    ],
  },

  // ── ecFeBo(22000) — 정적 파일(FO/BO 화면)만 서빙. ──
  // 게이트웨이는 정적 리소스 전부를 자기 root(/usr/share/nginx/html)로도 서빙하므로(ecFeBo 배포
  // 폴더 그대로 재사용) index.html/bo.html/에셋 전부 게이트웨이 경유로도 확인 가능.
  ecFeBo: {
    label: '프론트 정적서버(ecFeBo, 22000)',
    urls: [
      { url: `https://22000.${HOST}/index.html`, note: '사용자(FO) 메인 화면 (HTTPS 서브도메인 — 정식 경로, 로그인 필요 화면은 이쪽 필수)' },
      { url: `http://${HOST}:22000/index.html`, note: '사용자(FO) 메인 화면 (HTTP 포트 — 디버깅 전용)' },
      { url: `http://${GW}/index.html`, note: '사용자(FO) 메인 화면 (게이트웨이 경유, HTTP)' },
      { url: `https://${GW_HTTPS}/index.html`, note: '사용자(FO) 메인 화면 (게이트웨이 경유, HTTPS)' },

      { url: `https://22000.${HOST}/bo.html`, note: '관리자(BO) 메인 화면 (HTTPS 서브도메인 — 로그인 필요)' },
      { url: `http://${HOST}:22000/bo.html`, note: '관리자(BO) 메인 화면 (HTTP 포트 — 디버깅 전용, crypto.subtle 없어 로그인 불가)' },
      { url: `http://${GW}/bo.html`, note: '관리자(BO) 메인 화면 (게이트웨이 경유, HTTP)' },
      { url: `https://${GW_HTTPS}/bo.html`, note: '관리자(BO) 메인 화면 (게이트웨이 경유, HTTPS — 로그인 가능)' },

      { url: `https://22000.${HOST}/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인 (HTTPS 서브도메인)' },
      { url: `http://${HOST}:22000/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인 (HTTP 포트)' },
    ],
  },

  // ── ecGateway(22099) — 테스트 전용 게이트웨이. ecBeBo/ecBeCdn/ecFeBo 가 이 NAS에 이미 떠
  //    있어야 502 없이 통과한다(운영 경로 아님, apps/ecGateway/docker-compose.yml 상단 주석 참조).
  //    게이트웨이 자체는 HTTP(22099)/HTTPS(22099.illeesam...) 둘 다 등록 완료(2026-09-06). ──
  ecGateway: {
    label: '테스트 게이트웨이(ecGateway, 22099)',
    urls: [
      { url: `http://${GW}/index.html`, note: '사용자(FO) 메인 화면(게이트웨이, HTTP)' },
      { url: `https://${GW_HTTPS}/index.html`, note: '사용자(FO) 메인 화면(게이트웨이, HTTPS)' },
      { url: `http://${GW}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이, HTTP)' },
      { url: `https://${GW_HTTPS}/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이, HTTPS)' },
      { url: `http://${GW}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 API(게이트웨이→ecBeBo, HTTP)' },
      { url: `https://${GW_HTTPS}/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 API(게이트웨이→ecBeBo, HTTPS)' },
      { url: `http://${GW}/admin-tools/index.html`, note: 'ecBeBo 로그뷰어(게이트웨이 rewrite 경유, HTTP)' },
      { url: `http://${GW}/cdn-admin/index.html`, note: 'ecBeCdn 관리화면(게이트웨이 rewrite 경유, HTTP)' },
      // 2026-09-06 2차 정리: /api/cdn/ 하나로 통합(예전 /api/auth/·/cf/ 개별 location 폐기).
      { url: `http://${GW}/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'ecBeCdn cf_client API(게이트웨이 경유, /api/cdn/ 통합 확인, HTTP)' },
    ],
  },
};

module.exports = { HOST, services };
