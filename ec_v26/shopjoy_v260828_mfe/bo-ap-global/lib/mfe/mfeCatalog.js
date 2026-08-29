/* mfeCatalog.js — 지연로드용 "가벼운 목차". 실제 화면 코드는 전혀 안 싣고, 어떤
 * 대메뉴(menuKey)에 어떤 도메인 폴더가 어떤 소그룹(중메뉴, group)으로 기여하는지,
 * 그리고 그 안에 어떤 화면(id/label)이 있는지까지 미리 선언한다(2026-08-28 — 처음엔
 * 그룹명까지만 알았는데, "좌측 메뉴에 화면 이름까지 미리 보이면 좋겠다"는 요청으로
 * 화면 목록도 카탈로그에 포함시켰다). 각 manifest.js 의 register() 호출과 id/label이
 * 겹치는 게 유일한 단점인데, 이게 "메뉴 트리 모양은 미리 알아야 하지만 그 화면의
 * 실제 코드(comp)는 나중에 불러온다"는 지연로드 트리 방식의 근본적인 특성이다 —
 * 실제 사내 관리자 시스템도 메뉴는 DB/설정으로 미리 내려주고 화면 번들만 코드
 * 스플리팅하는 경우가 많다.
 *
 * mfe.html / mfe-*.html 이 이 파일 하나만 부팅 시 로드하면, 나머지 7개 도메인의
 * 실제 코드(화면 파일들)는 사용자가 그 "소그룹(중메뉴)" 이나 그 안의 특정 화면을
 * 처음 클릭할 때 window.MFE_REGISTRY.ensureFolderLoaded() 가 그때 가서 그 폴더
 * 하나만 동적으로 불러온다 — 로드 단위는 여전히 "폴더(소그룹) 하나"다(화면 하나만
 * 콕 집어 로드하진 않는다 — 같은 폴더 안의 화면들은 어차피 한 manifest.js 가
 * 한꺼번에 register() 하므로).
 *
 * 이 파일이 셸(mfe.html)이 아는 유일한 "도메인 목록"이다 — 새 도메인을 추가할 때
 * 손대는 곳이 여기 한 줄로 줄어든다.
 */
/* ══════════════ 새 도메인(마이크로 레포) 추가 시 체크리스트 (2026-08-28) ══════════════
 * 1. 형제 폴더 생성 — `bo-ap-global/`과 같은 레벨(중첩 금지). 예: `pd-brand/`
 * 2. 그 폴더 안에 `manifest.js` 작성 — 기존 7개(예: bo-ec-pd-pd/manifest.js) 그대로 베껴서
 *    시작할 것. 지켜야 할 것:
 *      - `const`만 쓴다(`var`/`let` 금지 — 재할당 없는 값은 항상 const, 프로젝트 컨벤션)
 *      - 불러올 화면 목록은 `scripts` 변수로, `register()`에 넘길 화면 목록은
 *        `screens` 변수로(내부 컴포넌트가 있으면 `innerComps`도) 먼저 선언한 뒤 주입한다
 *        — Promise.all(...)/register(...) 호출부에 리터럴을 인라인으로 쓰지 않는다
 *      - 마지막에 반드시 `R._domainReady(base)` 호출 — 안 하면 그 폴더를 기다리는
 *        `ensureFolderLoaded()` Promise가 영원히 안 풀린다
 *      - `.catch(function (err) { console.error('[폴더명 manifest] 로드 실패:', err); })`
 *        빠뜨리지 말 것 — 화면 파일 하나만 404여도 전체가 조용히 안 뜨는 원인이 됨
 *      - **화면 파일은 `export default` 필수, `window.ComponentName` 금지**
 *        (2026-08-29, 전체 화면 ES 모듈 전환 — `/CLAUDE.md`의 "ES 모듈 전환" 절 참고).
 *        `manifest.js`는 `R.loadScript()` 대신 `R.loadModule()`(동적 `import()`)로
 *        불러오고, `Promise.all(scripts).then(function (results) { ... results[N].default
 *        ... })`처럼 모듈 네임스페이스에서 `.default`를 꺼내 쓴다. 화면이 window 전역을
 *        아예 안 쓰므로, 다른 도메인 폴더와 파일명·컴포넌트명이 우연히 겹쳐도
 *        구조적으로 충돌이 불가능하다(예전엔 window 전역 이름이 겹치면 나중에 로드된
 *        쪽이 조용히 무시됐었다 — 2026-08-28, `bo-ec-cu-ba`/`bo-sy-ba` 둘 다 `CmNoticeDtl`을
 *        쓰게 만들어 직접 재현·확인함)
 *      - 레지스트리 `id`/`name:`은 `bo-{대메뉴}-{소그룹}-{원래이름 첫글자 소문자}`
 *        패턴(예: `PdTagMng`(`bo-ec-pd-pd`) → `'bo-ec-pd-pd-pdTagMng'`) — `id`와 `name:`은
 *        항상 같은 문자열이다. `bo-{대메뉴}-{소그룹}` 부분이 폴더명(`bo-`/순수 정렬용
 *        접두어 제외)에서 기계적으로 나오므로, 다른 도메인과 겹칠지 고민할 필요가 없다
 * 3. 그 폴더 안에 `dev.html` 작성 — 다른 도메인 없이 `../bo-ap-global/`의 공용 런타임 +
 *    자기 `manifest.js` 하나만 정적 로드해서 "이 도메인이 혼자서도 돌아가는지" 확인용.
 *    기존 dev.html(예: bo-sy-ba/dev.html) 그대로 복사 후 스크립트 목록만 자기 화면으로 교체
 * 4. **여기(`mfeCatalog.js`)에 `R.registerCatalog(menuKey, folder, group, screens)` 한
 *    줄 추가** — 이게 셸이 이 새 도메인의 존재를 아는 유일한 지점이다:
 *      - `menuKey` — 기존 대메뉴에 합류(예: 'bo-ec-pd')면 그대로, 완전히 새 대메뉴면
 *        `mfe.html`/`mfe-*.html`의 `mfeBootShell([...])` 호출 배열에도 새 항목 추가 필요
 *      - `group` — 소그룹(중메뉴) 라벨. 기존 대메뉴에 합류할 때 다른 그룹 이름과
 *        겹치지 않게(같은 그룹명이면 좌측 메뉴에서 같은 소그룹으로 섞여 보임)
 *      - `screens` — `[{id, label}, ...]`. **id/label이 `manifest.js`의 `register()`가
 *        넘기는 실제 값과 정확히 같아야 한다** — 안 그러면 로드 전엔 카탈로그 자리표시
 *        이름이 보이다가, 로드 후 실제 항목으로 안 바뀌고 둘 다(자리표시+실제) 보이는
 *        버그가 난다
 *      - 같은 대메뉴 안에서 화면 `id`가 다른 도메인과 겹치면 안 된다(사이드바/탭의
 *        `:key`가 깨짐) — 위의 `bo-{대메뉴}-{소그룹}-{원래이름}` 패턴을 그대로 따르면
 *        자동으로 안 겹친다(예: `bo-ec-cu-ba-cmNoticeMng` vs `cu-co-cmNoticeMng`)
 * 5. `_git_shopjoy-mfe-domain-{도메인명}.txt` 마커 파일 추가 — 다른 도메인 폴더의
 *    파일을 그대로 본떠서, 이 폴더가 실제로는 별도 git 레포라는 걸 문서화(폴더명의
 *    정렬용 접두어는 절대 이 파일 안의 "실제 레포명"에 넣지 않는다)
 * 6. `bo-ap-global/README.md`의 "메뉴 구성" 표에 새 행 추가
 * 7. 수정 끝나면 `node --check` + `&`/`&&` 템플릿 크래시 패턴 스윕(아래 커맨드) —
 *    루트 `CLAUDE.md` "검증 루틴" 참고
 * 이 체크리스트 밖에서 셸(`mfeShell.js`)이나 레지스트리(`mfeRegistry.js`)를 고칠 필요는
 * 없다 — 고쳐야 한다면 그건 "새 도메인 추가"가 아니라 인프라 자체를 바꾸는 작업이다.
 * ════════════════════════════════════════════════════════════════════════════════ */
(function () {
  var R = window.MFE_REGISTRY;

  /* bo-ec-mb — shopjoy_v260406(실제 프로덕션) pages/bo/ec/mb/ 전체를 그대로 복제한
     첫 실사례(2026-08-29). 원본 pageId(mbMemberMng 등)가 이미 프로젝트 전체에서
     유일하므로 `bo-` 한 접두어만 붙인다(id/name/window 전역 전부).
     2026-08-29 재구조화: "형상관리 단위"(git 레포)는 bo-ec-mb/ 하나로 통합했지만,
     "지연로드 단위"는 여전히 소그룹 하나 = manifest.js 하나 — folder 인자가 레포
     루트가 아니라 레포 안의 하위 디렉터리(member/, grade/)를 가리켜도 동일하게
     동작한다. bo-ec-mb/_git_shopjoy-mfe-domain-ec-mb.txt 참고. */
  R.registerCatalog('bo-ec-mb', '../bo-ec-mb/member/', '회원', [
    { id: 'mb-member-mbMemberMng', label: '회원관리' },
  ]);
  R.registerCatalog('bo-ec-mb', '../bo-ec-mb/grade/', '등급·그룹', [
    { id: 'mb-grade-mbMemGradeMng', label: '회원등급관리' },
    { id: 'mb-grade-mbMemGroupMng', label: '회원그룹관리' },
  ]);

  /* bo-module — 실제 좌측메뉴(LEFT_MENUS.module) 2개 소그룹을 2개 레포가 각자
     담당(2026-08-29 분리 — 원래는 bo-md-module 하나가 2레벨 정책으로 코바늘+
     소스젠을 함께 담당했으나, 회원관리(bo-ec-mb-member/bo-ec-mb-grade) 등과 일관성을
     맞추려고 소그룹 하나 = 폴더 하나인 표준 3레벨 정책으로 재분리). */
  R.registerCatalog('bo-module', '../bo-md/cb/', '코바늘', [
    { id: 'md-cb-mdCbPatternMng', label: '도안관리' },
    { id: 'md-cb-mdCbSymbolMng', label: '기호관리' },
    { id: 'md-cb-mdCbYarnMng', label: '실관리' },
  ]);
  R.registerCatalog('bo-module', '../bo-md/sg/', '소스젠', [
    { id: 'md-sg-mdSgProjectMng', label: '프로젝트관리' },
    { id: 'md-sg-mdSgGenHistMng', label: '생성이력관리' },
    { id: 'md-sg-mdSgDownloadHistMng', label: '다운로드이력관리' },
    { id: 'md-sg-mdSgStackMng', label: '언어/스택관리' },
  ]);

  /* bo-devtools — 2레벨 도메인(bo-module 과 동일 정책). SyPostman 은 실제 소스가
     pages/bo/sy/ 에 있지만(pages/bo/devtools/SyPostman.js 로 복제), 실제 좌측메뉴에서
     'api' 소그룹으로 이 대메뉴(개발도구)에 속해서 여기 등록한다. */
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', 'api', [
    { id: 'zd-devtools-syPostman', label: 'postman' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '스토어', [
    { id: 'zd-devtools-zdInfDashboard', label: '연동설정대시보드' },
    { id: 'zd-devtools-zdStore', label: 'store정보관리' },
    { id: 'zd-devtools-zdLocalStorage', label: 'localstorage정보관리' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '소셜 로그인', [
    { id: 'zd-devtools-zdTestSnsLoginKakao', label: '카카오 로그인 테스트' },
    { id: 'zd-devtools-zdTestSnsLoginGoogle', label: '구글 로그인 테스트' },
    { id: 'zd-devtools-zdTestSnsLoginNaver', label: '네이버 로그인 테스트' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '결제', [
    { id: 'zd-devtools-zdTestPayTossWidget', label: '토스 결제위젯 테스트' },
    { id: 'zd-devtools-zdTestPayTossBrandpay', label: '토스 브랜드페이 테스트' },
    { id: 'zd-devtools-zdTestPayKakaopay', label: '카카오페이 결제 테스트' },
    { id: 'zd-devtools-zdTestPayNaverpay', label: '네이버페이 결제 테스트' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '지도', [
    { id: 'zd-devtools-zdTestMapKakao', label: '카카오 지도 테스트' },
    { id: 'zd-devtools-zdTestMapNaver', label: '네이버 지도 테스트' },
    { id: 'zd-devtools-zdTestMapGoogle', label: '구글 지도 테스트' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '메일 / SMS / 푸시 알림', [
    { id: 'zd-devtools-zdTestMailSmtp', label: 'SMTP 메일 테스트' },
    { id: 'zd-devtools-zdTestSms', label: 'SMS 테스트' },
    { id: 'zd-devtools-zdTestPushAlimFcm', label: 'FCM 푸시 테스트' },
    { id: 'zd-devtools-zdTestPushAlimApns', label: 'APNs 푸시 테스트' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '채팅 / AI', [
    { id: 'zd-devtools-zdTestAiChatbot', label: 'AI 챗봇 테스트' },
    { id: 'zd-devtools-zdTestChattingKakaoChannel', label: '카카오채널 메시지 테스트' },
    { id: 'zd-devtools-zdTestShareKakao', label: '카카오톡 공유 테스트' },
    { id: 'zd-devtools-zdTestChattingWebSocket', label: 'WebSocket 채팅 테스트' },
  ]);
  R.registerCatalog('bo-devtools', '../bo-zd/devtools/', '앱 메시지', [
    { id: 'zd-devtools-zdTestAppMsgSendReceiv', label: 'Android/iOS 메시지 발송&수신' },
  ]);

  /* bo-simul — 2레벨 도메인(bo-module/bo-devtools 와 동일 정책). 실제 좌측메뉴 7개
     소그룹(회원/상품·주문/프로모션/전시·이벤트/정산·재무/알림/이력)을 폴더 하나가
     전부 담당한다. zdSimulNoti* 6개는 컴포넌트 1개(mode prop)를 갈아끼워 쓰지만
     이 카탈로그는 각 화면 id 를 그대로 노출한다(manifest.js 가 mode 래퍼로 흡수). */
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '회원', [
    { id: 'zd-simul-zdSimulMemberMng', label: '회원시뮬' },
    { id: 'zd-simul-zdSimulUserMng', label: '사용자시뮬' },
    { id: 'zd-simul-zdSimulVendorMng', label: '업체시뮬' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '상품/주문', [
    { id: 'zd-simul-zdSimulProdMng', label: '상품시뮬' },
    { id: 'zd-simul-zdSimulOrderMng', label: '주문시뮬' },
    { id: 'zd-simul-zdSimulClaimMng', label: '클레임시뮬' },
    { id: 'zd-simul-zdSimulKanbanMng', label: '주문칸반시뮬' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '프로모션', [
    { id: 'zd-simul-zdSimulCouponMng', label: '쿠폰시뮬' },
    { id: 'zd-simul-zdSimulDiscntMng', label: '할인시뮬' },
    { id: 'zd-simul-zdSimulSaveMng', label: '적립금시뮬' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '전시/이벤트', [
    { id: 'zd-simul-zdSimulPlanMng', label: '기획전시뮬' },
    { id: 'zd-simul-zdSimulEventMng', label: '이벤트시뮬' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '정산/재무', [
    { id: 'zd-simul-zdSimulSettleMng', label: '정산시뮬' },
    { id: 'zd-simul-zdSimulVoucherMng', label: '전표시뮬' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '알림', [
    { id: 'zd-simul-zdSimulNotiKakao', label: '메시지전송(알림톡)' },
    { id: 'zd-simul-zdSimulNotiSms', label: '메시지전송(SMS)' },
    { id: 'zd-simul-zdSimulNotiMail', label: '메시지전송(메일)' },
    { id: 'zd-simul-zdSimulNotiChat', label: '메시지전송(채팅)' },
    { id: 'zd-simul-zdSimulNotiNotice', label: '공지사항생성' },
    { id: 'zd-simul-zdSimulNotiError', label: '오류정보생성' },
  ]);
  R.registerCatalog('bo-simul', '../bo-zd/simul/', '이력', [
    { id: 'zd-simul-zdSimulLogMng', label: '시뮬로그' },
  ]);

  R.registerCatalog('bo-home', '../bo-ap-home/home/', null, [
    { id: 'bo-ap-home-dashboardBoEc01', label: 'EC 대시보드 1' },
    { id: 'bo-ap-home-dashboardBoEc02', label: 'EC 대시보드 2' },
  ]);
  /* bo-ec-cm — 원본 소스는 cm 패키지지만 실제 좌측메뉴(LEFT_MENUS_TAIL.home)
     소속이라 같은 대메뉴(bo-home)에 명명된 그룹 2개로 기여한다(bo-ap-home 의
     group:null 항목과 공존). */
  R.registerCatalog('bo-home', '../bo-ec-cm/dashboard/', '대시보드 관리', [
    { id: 'cm-dashboard-cmDashboardMng', label: '대시보드 관리' },
    { id: 'cm-dashboard-cmDashboardItemMng', label: '대시보드 항목관리' },
    { id: 'cm-dashboard-cmDashboardDataMng', label: '대시보드 데이타관리' },
    { id: 'cm-dashboard-cmDashboardLayoutMng', label: '대시보드 항목배치' },
    { id: 'cm-dashboard-cmDashboardSysMenuMng', label: '대시보드 메뉴관리' },
  ]);
  R.registerCatalog('bo-home', '../bo-ec-cm/dashboard/', '사용자 대시보드 관리', [
    { id: 'cm-dashboard-cmDashboardMyMng', label: '사용자 대시보드 관리' },
    { id: 'cm-dashboard-cmDashboardMenuMng', label: '사용자 대시보드 메뉴관리' },
  ]);
  /* bo-ec-pd — 실제 좌측메뉴(LEFT_MENUS.product) 5개 소그룹.
     2026-08-29 재구조화: "형상관리 단위(git 레포)"는 bo-ec-pd/ 하나로 통합했지만,
     "지연로드 단위"는 여전히 소그룹 하나 = manifest.js 하나 — folder 인자가 레포
     루트가 아니라 레포 안의 하위 디렉터리(pd/, cate/, opt/, tmplt/, info/)를
     가리켜도 동일하게 동작한다. bo-ec-pd/_git_shopjoy-mfe-domain-ec-pd.txt 참고. */
  R.registerCatalog('bo-ec-pd', '../bo-ec-pd/pd/', '상품', [
    { id: 'pd-pd-pdProdMng', label: '상품관리' },
    { id: 'pd-pd-pdSingleProdMng', label: '단품상품등록' },
    { id: 'pd-pd-pdOptionProdMng', label: '옵션상품등록' },
    { id: 'pd-pd-pdGroupProdMng', label: '묶음상품등록' },
    { id: 'pd-pd-pdSetProdMng', label: '세트상품등록' },
    { id: 'pd-pd-pdGiftProdMng', label: '사은상품등록' },
  ]);
  R.registerCatalog('bo-ec-pd', '../bo-ec-pd/cate/', '카테고리', [
    { id: 'pd-cate-pdCategoryMng', label: '카테고리관리' },
    { id: 'pd-cate-pdCategoryProdMng', label: '카테고리상품관리' },
  ]);
  R.registerCatalog('bo-ec-pd', '../bo-ec-pd/opt/', '상품옵션관리', [
    { id: 'pd-opt-pdOptCodeMng', label: '상품옵션관리' },
  ]);
  R.registerCatalog('bo-ec-pd', '../bo-ec-pd/tmplt/', '상품템플릿', [
    { id: 'pd-tmplt-pdDlivTmpltMng', label: '배송템플릿관리' },
  ]);
  R.registerCatalog('bo-ec-pd', '../bo-ec-pd/info/', '상품정보관리', [
    { id: 'pd-info-pdReviewMng', label: '상품리뷰관리' },
    { id: 'pd-info-pdQnaMng', label: '상품Q&A관리' },
    { id: 'pd-info-pdRestockNotiMng', label: '재입고알림' },
    { id: 'pd-info-pdTagMng', label: '태그관리' },
  ]);

  /* bo-ec-od — 실제 좌측메뉴(LEFT_MENUS.order)가 소그룹 구분 없는 평평한 목록이라
     bo-ap-home 과 동일하게 폴더 하나가 대메뉴 전체를 담당한다(group: null). */
  R.registerCatalog('bo-ec-od', '../bo-ec-od/order/', null, [
    { id: 'od-order-odOrderItemMng', label: '주문항목관리' },
    { id: 'od-order-odOrderMng', label: '주문관리' },
    { id: 'od-order-odClaimMng', label: '클레임관리' },
    { id: 'od-order-odDlivMng', label: '배송관리' },
    { id: 'od-order-odOrderKanban', label: '주문 칸반보드' },
    { id: 'od-order-odCartMng', label: '장바구니관리' },
  ]);

  /* bo-ec-pm — 실제 좌측메뉴(LEFT_MENUS.promotion) 2개 소그룹을 2개 레포가 각자 담당. */
  R.registerCatalog('bo-ec-pm', '../bo-ec-pm/promo/', '판촉', [
    { id: 'pm-promo-pmCouponMng', label: '쿠폰관리' },
    { id: 'pm-promo-pmCacheMng', label: '캐쉬관리' },
    { id: 'pm-promo-pmDiscntMng', label: '할인관리' },
    { id: 'pm-promo-pmSaveMng', label: '적립금관리' },
    { id: 'pm-promo-pmGiftMng', label: '사은품관리' },
    { id: 'pm-promo-pmVoucherMng', label: '상품권관리' },
  ]);
  R.registerCatalog('bo-ec-pm', '../bo-ec-pm/event/', '이벤트', [
    { id: 'pm-event-pmEventMng', label: '이벤트관리' },
    { id: 'pm-event-pmPlanMng', label: '기획전관리' },
  ]);

  /* bo-ec-dp — 실제 좌측메뉴(LEFT_MENUS.display) 4개 소그룹을 4개 레포가 각자 담당. */
  R.registerCatalog('bo-ec-dp', '../bo-ec-dp/preview/', '미리보기', [
    { id: 'dp-preview-dpDispUiPreview', label: '전시UI미리보기' },
    { id: 'dp-preview-dpDispAreaPreview', label: '전시영역미리보기' },
    { id: 'dp-preview-dpDispPanelPreview', label: '전시패널미리보기' },
    { id: 'dp-preview-dpDispWidgetPreview', label: '전시위젯미리보기' },
    { id: 'dp-preview-dpDispWidgetLibPreview', label: '전시위젯Lib미리보기' },
  ]);
  R.registerCatalog('bo-ec-dp', '../bo-ec-dp/mng/', '전시관리', [
    { id: 'dp-mng-dpDispUiMng', label: '전시UI관리' },
    { id: 'dp-mng-dpDispAreaMng', label: '전시영역관리' },
    { id: 'dp-mng-dpDispPanelMng', label: '전시패널관리' },
  ]);
  R.registerCatalog('bo-ec-dp', '../bo-ec-dp/widget/', '전시위젯관리', [
    { id: 'dp-widget-dpDispWidgetMng', label: '전시위젯관리' },
  ]);
  R.registerCatalog('bo-ec-dp', '../bo-ec-dp/lib/', '전시리소스', [
    { id: 'dp-lib-dpDispWidgetLibMng', label: '전시위젯Lib' },
  ]);

  /* bo-ec-cu — 실제 좌측메뉴(LEFT_MENUS.customer) 전체를 bo-ec-cu-ba(고객+고객센터)/
     bo-ec-cu-co(공통업무) 2개 레포가 담당(2026-08-29 전면 갱신 — 이전엔 "여러 레포가
     같은 화면을 각자 등록해도 안 깨지는지" 확인용 의도적 중복 데모였다. 실제
     프로젝트 전체 복제로 범위가 커지면서 그 검증 목적은 다른 여러 도메인이
     실사례로 이미 증명했다고 보고, 실제 메뉴 내용으로 교체). '고객' 그룹의
     mbCustInfoMng 은 원본 소스가 pages/bo/ec/mb/(mb 패키지)지만 크로스도메인
     단일 화면이라 bo-ec-cu-ba 에 흡수했다(SyPostman→bo-zd/devtools 와 동일 처리
     방식). '고객센터' 그룹의 syContactMng, '공통업무' 그룹의
     syBbmMng/syBbsMng/syExceldownMng 는 원본 소스가 pages/bo/sy/(sy 패키지)라
     sy 도메인 패스에서 같은 방식으로 여기(bo-ec-cu-*)에 흡수한다. */
  R.registerCatalog('bo-ec-cu', '../bo-ec-cu/ba/', '고객', [
    { id: 'cu-ba-mbCustInfoMng', label: '고객종합정보' },
  ]);
  R.registerCatalog('bo-ec-cu', '../bo-ec-cu/ba/', '고객센터', [
    { id: 'cu-ba-syContactMng', label: '문의관리' },
    { id: 'cu-ba-cmChattMng', label: '채팅관리' },
    { id: 'cu-ba-cmChattKanban', label: '채팅칸반보드' },
  ]);
  R.registerCatalog('bo-ec-cu', '../bo-ec-cu/co/', '공통업무', [
    { id: 'cu-co-cmNoticeMng', label: '공지사항관리' },
    { id: 'cu-co-cmFaqMng', label: 'FAQ관리' },
    { id: 'cu-co-cmBlogMng', label: '뉴스&블로그 관리' },
    { id: 'cu-co-syBbmMng', label: '게시판관리' },
    { id: 'cu-co-syBbsMng', label: '게시글관리' },
    { id: 'cu-co-syExceldownMng', label: '엑셀다운로드' },
  ]);

  /* bo-ec-st — 실제 좌측메뉴(LEFT_MENUS.settle) 6개 소그룹을 6개 레포가 각자 담당. */
  R.registerCatalog('bo-ec-st', '../bo-ec-st/base/', '기준정보', [
    { id: 'st-base-stConfigMng', label: '정산기준관리' },
    { id: 'st-base-stDlivFeePolicyMng', label: '배송수수료정책' },
  ]);
  R.registerCatalog('bo-ec-st', '../bo-ec-st/raw/', '수집원장', [
    { id: 'st-raw-stRawMng', label: '정산수집원장' },
  ]);
  R.registerCatalog('bo-ec-st', '../bo-ec-st/adj/', '정산작업', [
    { id: 'st-adj-stSettleAdjMng', label: '정산조정' },
    { id: 'st-adj-stSettleEtcAdjMng', label: '정산기타조정' },
    { id: 'st-adj-stSettleCloseMng', label: '정산마감' },
    { id: 'st-adj-stSettlePayMng', label: '정산지급관리' },
  ]);
  R.registerCatalog('bo-ec-st', '../bo-ec-st/status/', '정산현황', [
    { id: 'st-status-stStatusMng', label: '정산현황' },
  ]);
  R.registerCatalog('bo-ec-st', '../bo-ec-st/recon/', '대사관리', [
    { id: 'st-recon-stReconOrderMng', label: '주문-정산 대사' },
    { id: 'st-recon-stReconPayMng', label: '결제-정산 대사' },
    { id: 'st-recon-stReconClaimMng', label: '클레임-정산 대사' },
    { id: 'st-recon-stReconVendorMng', label: '업체-정산 대사' },
  ]);
  R.registerCatalog('bo-ec-st', '../bo-ec-st/erp/', 'ERP 연동', [
    { id: 'st-erp-stErpGenMng', label: 'ERP 전표생성' },
    { id: 'st-erp-stErpViewMng', label: 'ERP 전표조회' },
    { id: 'st-erp-stErpReconMng', label: 'ERP 전표대사' },
  ]);

  /* bo-sy — 실제 좌측메뉴(LEFT_MENUS.system) 7개 소그룹을 7개 레포가 각자 담당
     (2026-08-29 전면 갱신 — bo-sy-ba/bo-sy-org 는 예전 "파일명 중복 테스트" 데모
     에서 실제 메뉴 내용으로 교체, bo-sy-common/vendor/sys/menu/hist 는 신규 추가).
     '공통기능' 그룹의 cmPopupMng(cm 패키지 소스)은 bo-sy-common 에 흡수. */
  R.registerCatalog('bo-sy', '../bo-sy/ba/', '기준정보', [
    { id: 'sy-ba-sySiteMng', label: '사이트관리' },
    { id: 'sy-ba-syCodeMng', label: '공통코드관리' },
    { id: 'sy-ba-syBrandMng', label: '브랜드관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/common/', '공통기능', [
    { id: 'sy-common-cmPopupMng', label: '공통팝업관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/vendor/', '업체', [
    { id: 'sy-vendor-syVendorMng', label: '업체' },
    { id: 'sy-vendor-syVendorUserMng', label: '업체사용자' },
    { id: 'sy-vendor-syVendorInfoMng', label: '업체정보' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/sys/', '시스템', [
    { id: 'sy-sys-syAttachMng', label: '첨부파일 통합조회' },
    { id: 'sy-sys-syTemplateMng', label: '템플릿관리' },
    { id: 'sy-sys-syBatchMng', label: '배치스케즐관리' },
    { id: 'sy-sys-syAlarmMng', label: '알림관리' },
    { id: 'sy-sys-syPropMng', label: '프로퍼티관리' },
    { id: 'sy-sys-syPathMng', label: '표시경로' },
    { id: 'sy-sys-syI18nMng', label: '다국어관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/org/', '조직', [
    { id: 'sy-org-syUserMng', label: '사용자관리' },
    { id: 'sy-org-syDeptMng', label: '부서관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/menu/', '메뉴', [
    { id: 'sy-menu-syMenuMng', label: '메뉴관리' },
    { id: 'sy-menu-syRoleMng', label: '역할관리' },
  ]);
  R.registerCatalog('bo-sy', '../bo-sy/hist/', '이력조회', [
    { id: 'sy-hist-syMemberLoginHist', label: '회원로그인이력' },
    { id: 'sy-hist-syUserLoginHist', label: '사용자로그인이력' },
    { id: 'sy-hist-syApiLogMng', label: 'API로그조회' },
    { id: 'sy-hist-sySendMsgLog', label: '메시지발송이력' },
  ]);
})();
