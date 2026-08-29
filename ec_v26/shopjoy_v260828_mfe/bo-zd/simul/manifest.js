/* manifest.js — "시뮬레이션" 마이크로 도메인의 유일한 진입점.
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
 * shopjoy_v260406(실제 프로덕션)의 pages/bo/zd/ 시뮬레이션 관련 파일을 그대로
 * 복사해왔다(2026-08-29, 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조
 * (lib/app/boAppMenuData.js 의 LEFT_MENUS.simul)의 7개 그룹(회원/상품·주문/
 * 프로모션/전시·이벤트/정산·재무/알림/이력)을 이 폴더 하나가 전부 담당한다 —
 * 대메뉴 하나 = manifest.js 하나인 "2레벨 분할 정책"(개발도구/시뮬레이션 2개
 * 대메뉴 공통, bo-zd/devtools 참조 — 모듈은 소그룹이 2개뿐이라 2026-08-29 이후
 * bo-md/cb/bo-md/sg 로 표준 3레벨 재분리됨). 이 파일 자체는 원래 별도 레포
 * `bo-zd-simul`이었다가, 같은 날 후속 재구조화로 형상관리 단위를 `bo-zd/` 하나로
 * 합치면서 `bo-zd/simul/manifest.js`로 한 단계 더 들어왔다(형제
 * `bo-zd/devtools/manifest.js` 참고, 지연로드 단위는 그대로 유지).
 *
 * ES 모듈 진짜 의존관계(공유 라이브러리):
 *   - ZdSimulBase.js   : 시뮬레이션 공통 엔진(useSimulSetup 등). 화면 파일들이
 *     `import ZdSimulBase from './ZdSimulBase.js'` 로 직접 import — 브라우저가
 *     각 화면의 동적 import() 시 자동으로 같이 로드하므로 여기서 별도
 *     loadModule() 할 필요 없음.
 *   - ZdSimulComps.js  : ZdSimulControlPanel/ZdSimulLogPanel/ZdPreviewTable/
 *     ZdSimulPreviewModal 4개 컴포넌트를 named export. 화면 템플릿이
 *     <zd-simul-control-panel> 처럼 태그로 쓰므로 registerComponents 로 전역
 *     등록 필요 — 그래서 이것만 명시적으로 loadModule() 한다.
 *
 * zdSimulNoti* 6개 메뉴(카카오/SMS/메일/채팅/공지/오류)는 실제로 컴포넌트 1개
 * (ZdSimulNotiMng, mode prop 기본값 'mail')를 갈아끼워 쓴다. 이 데모에서는
 * 셸/레지스트리 스키마를 바꾸지 않기 위해 5개의 얇은 래퍼 파일(ZdSimulNotiKakao/
 * Sms/Chat/Notice/Error.js)을 두어 각자 mode 기본값만 override 한다 — 로직/
 * 템플릿 중복 없음(원본 컴포넌트를 import 해서 spread 할 뿐).
 *
 * ZdSimulPromoMng.js 는 원본에서도 LEFT_MENUS.simul 에 없고 다른 파일에서
 * 참조도 없는 죽은 코드라 복제하지 않았다(2026-08-29 확인). */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');
  const P = base + 'pages/bo/zd/simul/';

  const scripts = [
    R.loadModule(P + 'ZdSimulMemberMng.js'),   // 0
    R.loadModule(P + 'ZdSimulUserMng.js'),     // 1
    R.loadModule(P + 'ZdSimulVendorMng.js'),   // 2
    R.loadModule(P + 'ZdSimulProdMng.js'),     // 3
    R.loadModule(P + 'ZdSimulOrderMng.js'),    // 4
    R.loadModule(P + 'ZdSimulClaimMng.js'),    // 5
    R.loadModule(P + 'ZdSimulKanbanMng.js'),   // 6
    R.loadModule(P + 'ZdSimulCouponMng.js'),   // 7
    R.loadModule(P + 'ZdSimulDiscntMng.js'),   // 8
    R.loadModule(P + 'ZdSimulSaveMng.js'),     // 9
    R.loadModule(P + 'ZdSimulPlanMng.js'),     // 10
    R.loadModule(P + 'ZdSimulEventMng.js'),    // 11
    R.loadModule(P + 'ZdSimulSettleMng.js'),   // 12
    R.loadModule(P + 'ZdSimulVoucherMng.js'),  // 13
    R.loadModule(P + 'ZdSimulNotiKakao.js'),   // 14
    R.loadModule(P + 'ZdSimulNotiSms.js'),     // 15
    R.loadModule(P + 'ZdSimulNotiMng.js'),     // 16 (mode='mail' 기본)
    R.loadModule(P + 'ZdSimulNotiChat.js'),    // 17
    R.loadModule(P + 'ZdSimulNotiNotice.js'),  // 18
    R.loadModule(P + 'ZdSimulNotiError.js'),   // 19
    R.loadModule(P + 'ZdSimulLogMng.js'),      // 20
    R.loadModule(P + 'ZdSimulComps.js'),       // 21 (named export 4개 — 전역 컴포넌트)
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'zd-simul-zdSimulMemberMng',  label: '회원시뮬',           group: '회원',       comp: results[0].default },
      { id: 'zd-simul-zdSimulUserMng',    label: '사용자시뮬',         group: '회원',       comp: results[1].default },
      { id: 'zd-simul-zdSimulVendorMng',  label: '업체시뮬',           group: '회원',       comp: results[2].default },
      { id: 'zd-simul-zdSimulProdMng',    label: '상품시뮬',           group: '상품/주문',  comp: results[3].default },
      { id: 'zd-simul-zdSimulOrderMng',   label: '주문시뮬',           group: '상품/주문',  comp: results[4].default },
      { id: 'zd-simul-zdSimulClaimMng',   label: '클레임시뮬',         group: '상품/주문',  comp: results[5].default },
      { id: 'zd-simul-zdSimulKanbanMng',  label: '주문칸반시뮬',       group: '상품/주문',  comp: results[6].default },
      { id: 'zd-simul-zdSimulCouponMng',  label: '쿠폰시뮬',           group: '프로모션',   comp: results[7].default },
      { id: 'zd-simul-zdSimulDiscntMng',  label: '할인시뮬',           group: '프로모션',   comp: results[8].default },
      { id: 'zd-simul-zdSimulSaveMng',    label: '적립금시뮬',         group: '프로모션',   comp: results[9].default },
      { id: 'zd-simul-zdSimulPlanMng',    label: '기획전시뮬',         group: '전시/이벤트', comp: results[10].default },
      { id: 'zd-simul-zdSimulEventMng',   label: '이벤트시뮬',         group: '전시/이벤트', comp: results[11].default },
      { id: 'zd-simul-zdSimulSettleMng',  label: '정산시뮬',           group: '정산/재무',   comp: results[12].default },
      { id: 'zd-simul-zdSimulVoucherMng', label: '전표시뮬',           group: '정산/재무',   comp: results[13].default },
      { id: 'zd-simul-zdSimulNotiKakao',  label: '메시지전송(알림톡)', group: '알림',       comp: results[14].default },
      { id: 'zd-simul-zdSimulNotiSms',    label: '메시지전송(SMS)',    group: '알림',       comp: results[15].default },
      { id: 'zd-simul-zdSimulNotiMail',   label: '메시지전송(메일)',   group: '알림',       comp: results[16].default },
      { id: 'zd-simul-zdSimulNotiChat',   label: '메시지전송(채팅)',   group: '알림',       comp: results[17].default },
      { id: 'zd-simul-zdSimulNotiNotice', label: '공지사항생성',       group: '알림',       comp: results[18].default },
      { id: 'zd-simul-zdSimulNotiError',  label: '오류정보생성',       group: '알림',       comp: results[19].default },
      { id: 'zd-simul-zdSimulLogMng',     label: '시뮬로그',           group: '이력',       comp: results[20].default },
    ];
    const innerComps = [
      { tag: 'ZdSimulControlPanel', comp: results[21].ZdSimulControlPanel },
      { tag: 'ZdSimulLogPanel',     comp: results[21].ZdSimulLogPanel },
      { tag: 'ZdPreviewTable',      comp: results[21].ZdPreviewTable },
      { tag: 'ZdSimulPreviewModal', comp: results[21].ZdSimulPreviewModal },
    ];
    R.register('bo-simul', screens);
    R.registerComponents(innerComps);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-zd/simul manifest] 로드 실패:', err);
  });
})();
