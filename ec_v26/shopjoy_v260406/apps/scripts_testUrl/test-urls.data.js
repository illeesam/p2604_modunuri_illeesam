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
 */
const HOST = 'illeesam.synology.me';

const services = {
  // ── ecBeBo(22300) — 관리자 백엔드 API. 전부 로그인 불필요(공개 라우트만 모음). ──
  ecBeBo: {
    label: '백엔드(EcAdminApi, 22300)',
    urls: [
      { url: `http://${HOST}:22300/actuator/health`, note: '헬스체크' },
      { url: `http://${HOST}:22300/home/index.html`, note: '🪵 로그뷰어(운영 도구, 인증 불필요)' },
      { url: `http://${HOST}:22300/swagger-ui/index.html`, note: 'API 문서(Swagger UI, 로그인 불필요)' },
      { url: `http://${HOST}:22300/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 페이징(로그인 불필요)' },
      { url: `http://${HOST}:22300/api/co/sy/site?pageNo=1&pageSize=1`, note: '사이트 목록(로그인 불필요)' },
      { url: `http://${HOST}:22300/api/co/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄, 인증 불필요)' },
    ],
  },

  // ── ecBeCdn(22400) — CDN 서버(파일 업로드/서빙). 관리화면+API 전부 permitAll. ──
  ecBeCdn: {
    label: 'CDN 서버(EcCdnApi, 22400)',
    urls: [
      { url: `http://${HOST}:22400/actuator/health`, note: '헬스체크' },
      { url: `http://${HOST}:22400/home/index.html`, note: '관리자 화면 기본 진입(cf_file 관리, 로그인 불필요)' },
      { url: `http://${HOST}:22400/home/index.html?page=logViewer`, note: '🪵 로그뷰어(인증 불필요)' },
      { url: `http://${HOST}:22400/home/index.html?page=authTest`, note: '인증 테스트(로그인/재발급/강제폐기)' },
      { url: `http://${HOST}:22400/home/index.html?page=dbTest`, note: 'DB 연결 테스트(임의 접속정보로 SELECT 확인)' },
      { url: `http://${HOST}:22400/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'cf_client 목록 API — 확인용' },
      { url: `http://${HOST}:22400/api/cdn/file/page?pageNo=1&pageSize=1`, note: 'cf_file 목록 API — 확인용' },
      { url: `http://${HOST}:22400/api/cdn/log/tail?file=app&lines=20`, note: '로그 tail API(최근 20줄)' },
      // 2026-09-06: CfAuthController/CfFileServeController/CfStreamController 를 /api/auth,/cf →
      // /api/cdn/auth,/api/cdn/serve 로 통일한 뒤의 실제 경로. file/{fileId} 는 존재하는 fileId 가
      // 있어야 200 이 나므로(동적 값) 여기선 "경로 존재 확인"만 한다 — CfFileService.getOrThrow 가
      // CfBizException(존재하지 않는 파일) → GlobalExceptionHandler 가 400 으로 응답하는 걸 확인하면
      // 라우팅은 살아있는 것(자원이 없을 뿐). ⚠ 아직 배포 전(구코드가 /cf/file/** 로 떠있는 동안)엔
      // 이 항목이 500 으로 실패하는 게 정상 — /api/cdn/serve/** 자체가 아직 없는 경로라서다
      // (NoHandlerFoundException 이 GlobalExceptionHandler 의 catch-all Exception 핸들러에 잡혀
      // 500 으로 응답되는 별개의 기존 이슈 — 진짜 404 가 아니라 500 인 것도 이 부수효과).
      // npm run deploy:dev-synol-ecBeCdn 배포 후 재확인할 것.
      { url: `http://${HOST}:22400/api/cdn/serve/file/__ping__`, note: '바이너리 서빙 라우팅 확인(존재하지 않는 fileId → 400 이 정상)', expect: 400 },
    ],
  },

  // ── ecFeBo(22000) — 정적 파일(FO/BO 화면)만 서빙. ──
  ecFeBo: {
    label: '프론트 정적서버(ecFeBo, 22000)',
    urls: [
      // 2026-09-06: 서브도메인(22000.illeesam.synology.me)용 DSM 리버스프록시+인증서가 아직
      // 준비 안 돼 ERR_TLS_CERT_ALTNAME_INVALID 로 전부 실패하는 상태(실측 확인) — 인증서가
      // illeesam.synology.me 단일 도메인만 커버하고 이 서브도메인은 SAN에 없다. 그 인프라가
      // 준비될 때까지는 실제로 붙는 "호스트:포트" 방식도 같이 둔다(envFoConsts.dev.js/
      // envBoConsts.dev.js 를 이 방식으로 맞춘 것과 동일한 이유). 서브도메인 항목은 인증서
      // 준비되는 대로 다시 통과하는지 보려고 지우지 않고 남겨둔다.
      { url: `https://22000.${HOST}/index.html`, note: '사용자(FO) 메인 화면 (HTTPS 서브도메인 — 인증서 미준비로 현재 실패 예상)' },
      { url: `https://22000.${HOST}/bo.html`, note: '관리자(BO) 메인 화면 (HTTPS 서브도메인 — 인증서 미준비로 현재 실패 예상)' },
      { url: `https://22000.${HOST}/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인 (HTTPS 서브도메인 — 인증서 미준비로 현재 실패 예상)' },
      { url: `http://${HOST}:22000/index.html`, note: '사용자(FO) 메인 화면 (HTTP 포트 방식 — 지금 실제로 붙는 경로)' },
      { url: `http://${HOST}:22000/bo.html`, note: '관리자(BO) 메인 화면 (HTTP 포트 방식 — 지금 실제로 붙는 경로, 로그인 필요)' },
      { url: `http://${HOST}:22000/assets/cdn/pkg/vue/3.4.21/vue.global.prod.js`, note: '로컬 CDN 패키지(Vue) 정적서빙 확인 (HTTP 포트 방식)' },
    ],
  },

  // ── ecGateway(22099) — 테스트 전용 게이트웨이. ecBeBo/ecBeCdn/ecFeBo 가 이 NAS에 이미 떠
  //    있어야 502 없이 통과한다(운영 경로 아님, apps/ecGateway/docker-compose.yml 상단 주석 참조). ──
  ecGateway: {
    label: '테스트 게이트웨이(ecGateway, 22099)',
    urls: [
      { url: `http://${HOST}:22099/index.html`, note: '사용자(FO) 메인 화면(게이트웨이 경유)' },
      { url: `http://${HOST}:22099/bo.html`, note: '관리자(BO) 메인 화면(게이트웨이 경유)' },
      { url: `http://${HOST}:22099/api/co/sy/code/page?pageNo=1&pageSize=1`, note: '공통코드 API(게이트웨이→ecBeBo)' },
      { url: `http://${HOST}:22099/admin-tools/index.html`, note: 'ecBeBo 로그뷰어(게이트웨이 rewrite 경유)' },
      { url: `http://${HOST}:22099/cdn-admin/index.html`, note: 'ecBeCdn 관리화면(게이트웨이 rewrite 경유)' },
      // 2026-09-06 2차 정리: /api/cdn/ 하나로 통합(예전 /api/auth/·/cf/ 개별 location 폐기).
      { url: `http://${HOST}:22099/api/cdn/client/page?pageNo=1&pageSize=1`, note: 'ecBeCdn cf_client API(게이트웨이 경유, /api/cdn/ 통합 확인)' },
    ],
  },
};

module.exports = { HOST, services };
