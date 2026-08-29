/* manifest.js — "개발도구" 마이크로 도메인의 유일한 진입점 (2레벨 — 대메뉴 하나 = 폴더 하나).
 * document.currentScript.src 기반 자기 경로 해석 방식, 지연로드 방식(loadModule+
 * _domainReady)은 bo-ap-home/manifest.js 주석 참조.
 *
/* shopjoy_v260406(실제 프로덕션)의 pages/bo/zd/ 중 개발도구 관련 화면(+ pages/bo/sy/
 * SyPostman.js — 실제 좌측메뉴에서도 'api' 소그룹으로 devtools 대메뉴에 포함됨)을
 * 그대로 복사해왔다(2026-08-29, 원본은 전혀 수정하지 않음). 실제 좌측 메뉴 구조
 * (lib/app/boAppMenuData.js 의 LEFT_MENUS.devtools)를 그대로 따르되, 소그룹이 8개나
 * 되고 각 소그룹이 1~4개 화면뿐이라 3레벨로 쪼개면 폴더만 계속 늘어난다 — 이 대메뉴는
 * 화면 파일 전부를 이 manifest.js 하나가 담당한다("2레벨" 정책).
 *
 * 2026-08-29(같은 날 후속 재구조화): "형상관리 단위(git 레포)"와 "지연로드
 * 단위"를 분리하는 다른 도메인들(bo-ec-mb 등)과 일관되게, 원래 별도 레포였던
 * `bo-zd-devtools`/`bo-zd-simul`을 `bo-zd/` 레포 하나로 합쳤다(사용자 지시) — 이
 * manifest.js는 `bo-zd/devtools/manifest.js`로 한 단계 더 들어왔을 뿐, 대메뉴
 * bo-devtools/bo-simul 은 여전히 서로 다른 메뉴이고 지연로드 단위(레포 안의
 * manifest.js 파일 단위)도 그대로다 — 형제 `bo-zd/simul/manifest.js` 참고. */
(function () {
  const R = window.MFE_REGISTRY;
  const base = document.currentScript.src.replace(/manifest\.js(\?.*)?$/, '');

  const scripts = [
    R.loadModule(base + 'pages/bo/zd/devtools/SyPostman.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdInfDashboard.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdStore.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdLocalStorage.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestSnsLoginKakao.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestSnsLoginGoogle.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestSnsLoginNaver.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPayTossWidget.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPayTossBrandpay.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPayKakaopay.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPayNaverpay.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestMapKakao.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestMapNaver.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestMapGoogle.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestMailSmtp.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestSms.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPushAlimFcm.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestPushAlimApns.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestAiChatbot.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestChattingKakaoChannel.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestShareKakao.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestChattingWebSocket.js'),
    R.loadModule(base + 'pages/bo/zd/devtools/ZdTestAppMsgSendReceiv.js'),
  ];

  Promise.all(scripts).then(function (results) {
    const screens = [
      { id: 'zd-devtools-syPostman', label: 'postman', group: 'api', comp: results[0].default },
      { id: 'zd-devtools-zdInfDashboard', label: '연동설정대시보드', group: '스토어', comp: results[1].default },
      { id: 'zd-devtools-zdStore', label: 'store정보관리', group: '스토어', comp: results[2].default },
      { id: 'zd-devtools-zdLocalStorage', label: 'localstorage정보관리', group: '스토어', comp: results[3].default },
      { id: 'zd-devtools-zdTestSnsLoginKakao', label: '카카오 로그인 테스트', group: '소셜 로그인', comp: results[4].default },
      { id: 'zd-devtools-zdTestSnsLoginGoogle', label: '구글 로그인 테스트', group: '소셜 로그인', comp: results[5].default },
      { id: 'zd-devtools-zdTestSnsLoginNaver', label: '네이버 로그인 테스트', group: '소셜 로그인', comp: results[6].default },
      { id: 'zd-devtools-zdTestPayTossWidget', label: '토스 결제위젯 테스트', group: '결제', comp: results[7].default },
      { id: 'zd-devtools-zdTestPayTossBrandpay', label: '토스 브랜드페이 테스트', group: '결제', comp: results[8].default },
      { id: 'zd-devtools-zdTestPayKakaopay', label: '카카오페이 결제 테스트', group: '결제', comp: results[9].default },
      { id: 'zd-devtools-zdTestPayNaverpay', label: '네이버페이 결제 테스트', group: '결제', comp: results[10].default },
      { id: 'zd-devtools-zdTestMapKakao', label: '카카오 지도 테스트', group: '지도', comp: results[11].default },
      { id: 'zd-devtools-zdTestMapNaver', label: '네이버 지도 테스트', group: '지도', comp: results[12].default },
      { id: 'zd-devtools-zdTestMapGoogle', label: '구글 지도 테스트', group: '지도', comp: results[13].default },
      { id: 'zd-devtools-zdTestMailSmtp', label: 'SMTP 메일 테스트', group: '메일 / SMS / 푸시 알림', comp: results[14].default },
      { id: 'zd-devtools-zdTestSms', label: 'SMS 테스트', group: '메일 / SMS / 푸시 알림', comp: results[15].default },
      { id: 'zd-devtools-zdTestPushAlimFcm', label: 'FCM 푸시 테스트', group: '메일 / SMS / 푸시 알림', comp: results[16].default },
      { id: 'zd-devtools-zdTestPushAlimApns', label: 'APNs 푸시 테스트', group: '메일 / SMS / 푸시 알림', comp: results[17].default },
      { id: 'zd-devtools-zdTestAiChatbot', label: 'AI 챗봇 테스트', group: '채팅 / AI', comp: results[18].default },
      { id: 'zd-devtools-zdTestChattingKakaoChannel', label: '카카오채널 메시지 테스트', group: '채팅 / AI', comp: results[19].default },
      { id: 'zd-devtools-zdTestShareKakao', label: '카카오톡 공유 테스트', group: '채팅 / AI', comp: results[20].default },
      { id: 'zd-devtools-zdTestChattingWebSocket', label: 'WebSocket 채팅 테스트', group: '채팅 / AI', comp: results[21].default },
      { id: 'zd-devtools-zdTestAppMsgSendReceiv', label: 'Android/iOS 메시지 발송&수신', group: '앱 메시지', comp: results[22].default },
    ];
    R.register('bo-devtools', screens);
    R._domainReady(base);
  }).catch(function (err) {
    console.error('[bo-zd/devtools manifest] 로드 실패:', err);
  });
})();
