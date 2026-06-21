/**
 * 개발도구 — 연동설정 대시보드
 *
 * 외부 서비스 연동 설정 현황을 한 눈에 확인하는 bo-grid 기반 대시보드.
 * 소셜로그인 / 결제 / 지도 / 메일·SMS / 푸시 / 챗봇 / 앱 메시지 등
 * BE 설정 여부 / FE 설정 여부 / 테스트 버튼 / 연동결과 / 테스트 결과 표시.
 * 행 클릭 시 상세정보(BE·FE 실제 키 값, 설명, 발급처 링크) 펼침.
 */
window.ZdInfDashboard = {
  name: 'ZdInfDashboard',
  props: {
    navigate:  { type: Function, required: true },                       // 페이지 이동
    showToast: { type: Function, default: () => {} },                    // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, ref, computed, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const codes = reactive({});
    const loading = ref(false);
    const expandedKeys = reactive(new Set()); // 펼쳐진 행의 keyName 집합

    /* ── sy_prop 조회 섹션 ── */
    const PROFILE_OPTIONS_ZD = [
      { value: 'local', label: 'all; local' },
      { value: 'dev',   label: 'all; dev'   },
      { value: 'prod',  label: 'all; prod'  },
    ];
    const propSearch = reactive({ profile: '', profileDisplay: '', propKey: '' });
    const propSearchRows = reactive([]);
    const propSearchTotal = ref(0);
    const propSearchLoading = ref(false);
    const propSort = reactive({ key: 'propKey', dir: 'asc' });

    const fnPropSort = (key) => {
      if (propSort.key === key) propSort.dir = propSort.dir === 'asc' ? 'desc' : 'asc';
      else { propSort.key = key; propSort.dir = 'asc'; }
      propSearchRows.sort((a, b) => {
        const va = (a[key] || '').toString(), vb = (b[key] || '').toString();
        return propSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    };
    const fnSortIcon = (grid, key) => {
      const s = grid === 'prop' ? propSort : ymlSort;
      if (s.key !== key) return ' ⇅';
      return s.dir === 'asc' ? ' ▲' : ' ▼';
    };

    /* ── application.yml 조회 섹션 ── */
    const ymlRows = reactive([]);
    const ymlTotal = ref(0);
    const ymlLoading = ref(false);
    const ymlSort = reactive({ key: '', dir: 'asc' });

    const fnYmlSort = (key) => {
      if (ymlSort.key === key) ymlSort.dir = ymlSort.dir === 'asc' ? 'desc' : 'asc';
      else { ymlSort.key = key; ymlSort.dir = 'asc'; }
      ymlRows.sort((a, b) => {
        const va = (a[key] || '').toString(), vb = (b[key] || '').toString();
        return ymlSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    };
    const ymlSearch = reactive({ searchValue: '' });
    const ymlActiveProfile = ref('');

    const handleYmlSearch = async () => {
      ymlLoading.value = true;
      ymlRows.splice(0);
      try {
        const res = await boApi.get('/bo/sy/app-config/all', coUtil.cofApiHdr('연동설정대시보드', 'yml조회'));
        const d = res.data?.data || {};
        ymlActiveProfile.value = d.activeProfile || '';
        const list = d.items || [];
        const kw = ymlSearch.searchValue.trim().toLowerCase();
        const filtered = kw ? list.filter(r => (r.ymlKey||'').toLowerCase().includes(kw) || (r.ymlValue||'').toLowerCase().includes(kw)) : list;
        ymlRows.push(...filtered);
        ymlTotal.value = filtered.length;
      } catch (e) {
        showToast(e.response?.data?.message || e.message || 'yml 조회 실패', 'error');
      } finally {
        ymlLoading.value = false;
      }
    };

    /* ── yml 테이블 컬럼 리사이즈 ── */
    const ymlColWidths = Vue.reactive({});
    let _yResizeTh = null, _yResizeX = 0, _yResizeW = 0;
    const onYmlResizeStart = (e, key) => {
      e.preventDefault();
      e.stopPropagation();
      _yResizeTh = e.target.closest('th');
      _yResizeX = e.clientX;
      _yResizeW = _yResizeTh.offsetWidth;
      document.body.classList.add('col-resizing');
      const onMove = (ev) => {
        ymlColWidths[key] = Math.max(40, _yResizeW + ev.clientX - _yResizeX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.classList.remove('col-resizing');
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const onPropProfileSelectChange = (e) => {
      const val = e.target.value;
      propSearch.profile = val;
      const opt = PROFILE_OPTIONS_ZD.find(o => o.value === val);
      propSearch.profileDisplay = opt ? opt.label : val;
    };

    const onPropProfileInputChange = (e) => {
      const display = e.target.value;
      propSearch.profileDisplay = display;
      const m = display.match(/^all;\s*(\S+)$/);
      propSearch.profile = m ? m[1] : display;
    };

    const handlePropSearch = async () => {
      propSearchLoading.value = true;
      propSearchRows.splice(0);
      try {
        const params = { pageSize: 200, pageNo: 1, sortKey: 'prop_key', sortDir: 'asc' };
        if (propSearch.profile) params.propProfile = propSearch.profile;
        if (propSearch.propKey)  params.searchValue = propSearch.propKey;
        const res = await boApiSvc.syProp.getPage(params, '연동설정대시보드', 'sy_prop조회');
        const data = res.data?.data || {};
        const list = (data.pageList || []).slice().sort((a, b) => {
          const va = (a[propSort.key] || '').toString(), vb = (b[propSort.key] || '').toString();
          return propSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        propSearchRows.push(...list);
        propSearchTotal.value = data.pageTotalCount || list.length;
      } catch (e) {
        showToast(e.response?.data?.message || e.message || 'sy_prop 조회 실패', 'error');
      } finally {
        propSearchLoading.value = false;
      }
    };



    /* ##### [02] 그리드 컬럼 정의 ################################################### */

    const baseGridColumns = [
      { key: '_expand',    label: '',           width: '32px',  align: 'center' },
      { key: 'category',   label: '분류',       width: '90px' },
      { key: 'channel',    label: '채널 / 서비스', width: '150px' },
      { key: 'keyName',    label: '설정 키',    width: '180px', mono: true },
      { key: 'beStat', label: 'BE 설정', width: '200px', align: 'center' },
      { key: 'feStat', label: 'FE 설정', width: '130px', align: 'center' },
      { key: '_test',      label: '테스트',     width: '90px',  align: 'center' },
      { key: 'testResult', label: '연동결과', width: '60px', align: 'center' },
      { key: 'testMsg',    label: '테스트 결과' },
      { key: 'remark',     label: '비고' },
    ];

    /* ##### [03] 데이터 로드 ######################################################## */

    const rows = reactive([]);

    const _feKey = (name) => {
      if (!name) return null;
      const store = window.sfGetBoAppStore?.();
      if (!store) return null;
      /* boAppStore 필드명: sv + 첫글자대문자 + 나머지 (예: kakaoJsKey → svKakaoJsKey) */
      const svKey = 'sv' + name.charAt(0).toUpperCase() + name.slice(1);
      const val = store[svKey];
      return (val && val !== '' && val !== '-') ? val : null;
    };

    const _beCache = reactive({});

    const _statOf = (val) => (val ? '설정됨' : '미설정');

    const _META = [
      /* ── 소셜 로그인 ── */
      {
        category: '소셜로그인', channel: 'Google 로그인', feKey: 'googleClientId', beKey: 'app.ext-sdk.google-client-id',
        remark: 'OAuth2 클라이언트 ID', testFn: 'google',
        desc: 'Google OAuth 2.0 소셜 로그인에 사용합니다. Google Cloud Console에서 OAuth 클라이언트 ID를 발급받아 등록하세요.',
        guideUrl: 'https://console.cloud.google.com/apis/credentials',
        guideLabel: 'Google Cloud Console',
        feDesc: 'FE에서 Google Sign-In 버튼 초기화에 사용 (window.google.accounts.id.initialize)',
        feFile: 'sy_prop:app.ext-sdk.google-client-id',
        beDesc: 'BE에서 Google 토큰 검증 및 사용자 정보 조회 시 사용',
        beFile: 'sy_prop:app.ext-sdk.google-client-id',
        dbTable: 'mb_member_sns (sns_type=GOOGLE)',
      },
      {
        category: '소셜로그인', channel: 'Kakao 로그인', feKey: 'kakaoJsKey', beKey: 'app.ext-sdk.kakao-js-key',
        remark: 'JavaScript 키', testFn: 'kakao',
        desc: 'Kakao 소셜 로그인에 사용합니다. Kakao Developers에서 앱을 생성하고 JavaScript 키를 발급받으세요.',
        guideUrl: 'https://developers.kakao.com/console/app',
        guideLabel: 'Kakao Developers',
        feDesc: 'FE에서 Kakao.init() 호출 시 사용하는 JavaScript 앱 키 (FE·BE 동일 키)',
        feFile: 'sy_prop:app.ext-sdk.kakao-js-key',
        beDesc: 'BE에서 Kakao 사용자정보 API 호출 시 사용 (JavaScript 키)',
        beFile: 'sy_prop:app.ext-sdk.kakao-js-key',
        dbTable: 'mb_member_sns (sns_type=KAKAO)',
      },
      {
        category: '소셜로그인', channel: 'Naver 로그인', feKey: 'naverClientId', beKey: 'app.ext-sdk.naver-client-id',
        remark: '클라이언트 ID', testFn: 'naver',
        desc: 'Naver 소셜 로그인에 사용합니다. Naver Developers에서 애플리케이션을 등록하고 클라이언트 ID를 발급받으세요.',
        guideUrl: 'https://developers.naver.com/apps',
        guideLabel: 'Naver Developers',
        feDesc: 'FE에서 Naver 로그인 버튼 초기화 시 사용 (naver.LoginWithNaverId)',
        feFile: 'sy_prop:app.ext-sdk.naver-client-id',
        beDesc: 'BE에서 Naver 액세스 토큰 검증 및 사용자 프로필 조회 시 사용',
        beFile: 'sy_prop:app.ext-sdk.naver-client-id',
        dbTable: 'mb_member_sns (sns_type=NAVER)',
      },
      /* ── 결제 ── */
      {
        category: '결제', channel: '토스페이먼츠', feKey: 'tossClientKey', beKey: 'app.ext-sdk.toss-client-key',
        remark: 'FE:클라이언트키 / BE:시크릿키(app.toss.secret-key)', testFn: 'toss',
        desc: '토스페이먼츠 결제 연동에 사용합니다. 토스페이먼츠 개발자 센터에서 클라이언트 키(FE)와 시크릿 키(BE)를 발급받으세요.',
        guideUrl: 'https://developers.tosspayments.com/',
        guideLabel: '토스페이먼츠 개발자센터',
        feDesc: 'FE에서 결제창 초기화 시 사용하는 클라이언트 키 (test_gck_docs_* 또는 live_ck_* 접두어)',
        feFile: 'sy_prop:app.ext-sdk.toss-client-key',
        beDesc: 'BE에서 결제 승인/취소 API 호출 시 HTTP Basic Auth 비밀번호로 사용하는 시크릿 키',
        beFile: 'sy_prop:app.toss.secret-key',
        dbTable: 'od_pay, od_pay_method, od_refund',
      },
      /* ── 지도 ── */
      {
        category: '지도', channel: 'Kakao 지도', feKey: 'kakaoMapJsKey', beKey: 'app.ext-sdk.kakao-map-js-key',
        remark: 'JavaScript 키 (카카오맵)', testFn: 'kakaoMap',
        desc: 'Kakao Maps API 연동에 사용합니다. Kakao Developers에서 앱 > 카카오맵 사용 설정을 ON으로 변경하고 JavaScript 키를 사용하세요.',
        guideUrl: 'https://developers.kakao.com/console/app',
        guideLabel: 'Kakao Developers',
        feDesc: 'FE에서 Kakao.maps 스크립트 로드 시 appkey 파라미터로 사용 (소셜 로그인과 동일 JavaScript 키)',
        feFile: 'sy_prop:app.ext-sdk.kakao-map-js-key',
        beDesc: '현재 BE 서버 사이드 Kakao 지도 API 호출 없음 (FE 전용)',
        beFile: 'sy_prop:app.ext-sdk.kakao-map-js-key',
        dbTable: 'sy_site (site_address 좌표변환 시 사용)',
      },
      {
        category: '지도', channel: 'Naver 지도', feKey: 'naverMapClientId', beKey: 'app.ext-sdk.naver-map-client-id',
        remark: 'NCP 클라이언트 ID', testFn: 'naverMap',
        desc: 'Naver Cloud Platform Maps API 연동에 사용합니다. NCP Console에서 Maps 서비스를 활성화하고 클라이언트 ID를 발급받으세요.',
        guideUrl: 'https://console.ncloud.com/naver-service/application',
        guideLabel: 'Naver Cloud Platform Console',
        feDesc: 'FE 지도 스크립트 로드 시 ncpClientId 파라미터로 사용',
        feFile: 'sy_prop:app.ext-sdk.naver-map-client-id',
        beDesc: 'BE에서 주소 → 좌표 변환(Geocoding) 등 서버 사이드 Maps API 호출 시 사용',
        beFile: 'sy_prop:app.ext-sdk.naver-map-client-id',
        dbTable: 'sy_site (site_address 좌표변환 시 사용)',
      },
      {
        category: '지도', channel: 'Google 지도', feKey: 'googleMapApiKey', beKey: 'app.ext-sdk.google-map-api-key',
        remark: 'Maps JavaScript API 키', testFn: 'googleMap',
        desc: 'Google Maps Platform 연동에 사용합니다. Google Cloud Console에서 Maps JavaScript API와 Geocoding API를 활성화하고 API 키를 발급받으세요.',
        guideUrl: 'https://console.cloud.google.com/google/maps-apis',
        guideLabel: 'Google Maps Platform Console',
        feDesc: 'FE 지도 스크립트 로드 시 key 파라미터로 사용 (Maps JavaScript API)',
        feFile: 'sy_prop:app.ext-sdk.google-map-api-key',
        beDesc: 'BE에서 서버 사이드 Geocoding / Places API 호출 시 사용',
        beFile: 'sy_prop:app.ext-sdk.google-map-api-key',
        dbTable: 'sy_site (site_address 좌표변환 시 사용)',
      },
      /* ── 메일 ── */
      {
        category: '메일', channel: 'SMTP', feKey: null, beKey: 'spring.mail.host',
        remark: 'SMTP 호스트', testFn: 'smtp',
        desc: '이메일 발송에 사용하는 SMTP 서버 설정입니다. Gmail 사용 시 앱 비밀번호를 별도 발급해야 합니다.',
        guideUrl: 'https://myaccount.google.com/apppasswords',
        guideLabel: 'Gmail 앱 비밀번호 발급',
        feDesc: null,
        feFile: null,
        beDesc: 'application.yml의 spring.mail.host / port / username / password 값으로 설정',
        beFile: 'yml:spring.mail.host / port',
        dbTable: 'cmh_push_log (channel=EMAIL)',
      },
      /* ── SMS ── */
      {
        category: 'SMS', channel: 'SMS 발송', feKey: null, beKey: 'app.sms.api-key',
        remark: 'API 키', testFn: 'sms',
        desc: 'SMS 문자 발송 서비스 API 키입니다. 현재 연동된 SMS 공급사의 콘솔에서 API 키를 발급받으세요.',
        guideUrl: null,
        guideLabel: null,
        feDesc: null,
        feFile: null,
        beDesc: 'BE SMS 발송 서비스에서 인증 헤더 또는 파라미터로 사용',
        beFile: 'sy_prop:app.sms.api-key',
        dbTable: 'cmh_push_log (channel=SMS)',
      },
      /* ── 푸시 ── */
      {
        category: '푸시', channel: 'FCM', feKey: 'fcmProjectId', beKey: 'app.push.fcm.project-id',
        remark: '프로젝트 ID', testFn: 'fcm',
        desc: 'Firebase Cloud Messaging(FCM) 푸시 알림 연동에 사용합니다. Firebase Console에서 프로젝트를 생성하고 서비스 계정 키를 다운로드하세요.',
        guideUrl: 'https://console.firebase.google.com/',
        guideLabel: 'Firebase Console',
        feDesc: 'FE Web Push 초기화 시 Firebase 프로젝트 ID로 사용',
        feFile: 'sy_prop:app.push.fcm.project-id',
        beDesc: 'BE에서 FCM v1 API 호출 시 프로젝트 ID (서비스 계정 JSON 파일도 별도 필요)',
        beFile: 'sy_prop:app.push.fcm.project-id',
        dbTable: 'mb_device_token, cmh_push_log (channel=FCM)',
      },
      {
        category: '푸시', channel: 'APNs', feKey: null, beKey: 'app.push.apns.key-id',
        remark: '키 ID', testFn: 'apns',
        desc: 'Apple Push Notification service(APNs) iOS 푸시 알림 연동에 사용합니다. Apple Developer 계정에서 APNs 키를 생성하세요.',
        guideUrl: 'https://developer.apple.com/account/resources/authkeys/list',
        guideLabel: 'Apple Developer 계정',
        feDesc: null,
        feFile: null,
        beDesc: 'BE에서 APNs JWT 토큰 생성 시 사용하는 키 ID (.p8 인증서 파일도 별도 필요)',
        beFile: 'sy_prop:app.push.apns.key-id',
        dbTable: 'mb_device_token, cmh_push_log (channel=APNS)',
      },
      /* ── 카카오 ── */
      {
        category: '카카오', channel: '알림톡', feKey: null, beKey: 'app.kakao.alimtalk.sender-key',
        remark: '발신 프로필 키', testFn: 'kakaoAlim',
        desc: '카카오 알림톡 발송에 사용합니다. 비즈니스 채널을 개설하고 발신 프로필 키를 발급받으세요.',
        guideUrl: 'https://business.kakao.com/',
        guideLabel: '카카오비즈니스',
        feDesc: null,
        feFile: null,
        beDesc: 'BE에서 알림톡 API 호출 시 인증 헤더로 사용하는 발신 프로필 키',
        beFile: 'yml:app.kakao.alimtalk.sender-key',
        dbTable: 'cmh_push_log (channel=KAKAO)',
      },
      /* ── 카카오 공유 ── */
      {
        category: '카카오', channel: '카카오톡 공유', feKey: 'kakaoJsKey', beKey: 'app.ext-sdk.kakao-js-key',
        remark: 'JavaScript 키 (소셜 로그인과 동일)', testFn: 'kakaoShare',
        desc: '카카오톡 공유 기능에 사용합니다. 소셜 로그인과 동일한 JavaScript 키를 사용하며, Kakao Developers 에서 Web 플랫폼에 도메인을 등록해야 합니다.',
        guideUrl: 'https://developers.kakao.com/console/app',
        guideLabel: 'Kakao Developers',
        feDesc: 'FE에서 Kakao.Share.sendDefault() 호출 시 Kakao.init() 에 사용하는 JavaScript 앱 키',
        feFile: 'sy_prop:app.ext-sdk.kakao-js-key',
        beDesc: 'BE 서버 사이드 카카오 공유 API 없음 (FE 전용, Kakao SDK 2.x)',
        beFile: 'sy_prop:app.ext-sdk.kakao-js-key',
        dbTable: '없음 (클라이언트 공유, 서버 저장 없음)',
      },
      /* ── AI ── */
      {
        category: 'AI/챗봇', channel: 'AI 챗봇', feKey: null, beKey: 'app.chat.ai.api-key',
        remark: 'API 키', testFn: 'ai',
        desc: 'AI 챗봇 서비스 연동 API 키입니다. 연동한 AI 서비스(OpenAI / Claude 등) 콘솔에서 API 키를 발급받으세요.',
        guideUrl: null,
        guideLabel: null,
        feDesc: null,
        feFile: null,
        beDesc: 'BE AI 챗봇 서비스에서 API 인증 헤더로 사용',
        beFile: 'sy_prop:app.chat.ai.api-key',
        dbTable: 'cm_chatt_room, cm_chatt_msg',
      },
    ];

    const _buildRows = () => {
      rows.length = 0;
      _META.forEach((m) => {
        const feVal = _feKey(m.feKey);
        const beVal = m.beKey ? (_beCache[m.beKey] ?? null) : null;
        rows.push({
          category:   m.category,
          channel:    m.channel,
          keyName:    m.feKey || m.beKey || '-',
          feStat:     m.feKey ? _statOf(feVal) : '-',
          beStat:     m.beKey ? _statOf(beVal)  : '-',
          feRawVal:   feVal ? String(feVal).slice(0, 6) + '••••••' : null,
          beRawVal:   beVal ? String(beVal).slice(0, 6) + '••••••' : null,
          testResult: '-',
          testMsg:    '',
          remark:     m.remark,
          _testFn:    m.testFn,
          _testing:   false,
          /* 상세 정보 */
          _desc:      m.desc,
          _guideUrl:  m.guideUrl,
          _guideLabel:m.guideLabel,
          _feKey:     m.feKey,
          _beKey:     m.beKey,
          _feDesc:    m.feDesc,
          _feFile:    m.feFile ? m.feFile.replace('propKey', m.feKey || '') : null,
          _beDesc:    m.beDesc,
          _beFile:    m.beFile  || null,
          _dbTable:   m.dbTable || null,
        });
      });
    };

    /* ##### [04] BE 설정 조회 ####################################################### */

    const _fetchBeSettings = async () => {
      try {
        /* app-config/all: BE가 active profile 필터링 후 resolved 값 반환 */
        const r1 = await boApi.get('/bo/sy/app-config/all', coUtil.cofApiHdr('연동설정대시보드', 'yml조회'));
        const ymlList = r1.data?.data?.items || [];
        ymlList.forEach((item) => {
          if (item.ymlKey && item.ymlValue && item.ymlValue !== '(미설정)') {
            _beCache[item.ymlKey] = item.ymlValue;
          }
        });

        /* sy_prop 직접 조회로 보완 — 빈값 덮어쓰기 방지: 이미 채워진 키는 건너뜀 */
        const r2 = await boApi.get('/bo/sy/prop', {
          params: { pageSize: 999 },
          ...coUtil.cofApiHdr('연동설정대시보드', '설정조회'),
        });
        const propList = r2.data?.data || [];
        if (Array.isArray(propList)) {
          propList.forEach((p) => {
            /* 값이 있는 경우만, 기존 채워진 키는 덮어쓰지 않음 */
            if (p.propKey && p.propValue && !_beCache[p.propKey]) {
              _beCache[p.propKey] = p.propValue;
            }
          });
        }
      } catch (_) { /* BE 조회 실패 — beStat '-' 유지 */ }
    };

    /* ##### [05] 테스트 실행 ####################################################### */

    /* 각 채널별 테스트 — POST /co/ext/.../send 또는 GET ping */
    const _TEST_MAP = {
      google:     { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Google OAuth',  note: 'BE 키 조회로 설정 여부 확인' },
      kakao:      { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Kakao OAuth',   note: 'BE 키 조회로 설정 여부 확인' },
      naver:      { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Naver OAuth',   note: 'BE 키 조회로 설정 여부 확인' },
      toss:       { method: 'get',  url: '/bo/sy/app-config/all',          label: '토스 결제키',   note: 'BE 키 조회로 설정 여부 확인' },
      kakaoMap:   { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Kakao 지도',    note: 'BE 키 조회로 설정 여부 확인' },
      naverMap:   { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Naver 지도',    note: 'BE 키 조회로 설정 여부 확인' },
      googleMap:  { method: 'get',  url: '/bo/sy/app-config/all',          label: 'Google 지도',   note: 'BE 키 조회로 설정 여부 확인' },
      smtp:       { method: 'post', url: '/co/ext/mail-send/send',         label: 'SMTP',
                    body: { toEmail: 'test@example.com', toName: '테스트', subject: '[ShopJoy] 연동 테스트', body: '연동 설정 대시보드 테스트 발송' } },
      sms:        { method: 'post', url: '/co/ext/sms-send/send',          label: 'SMS',
                    body: { toPhone: '01000000000', message: '[ShopJoy] SMS 연동 테스트' } },
      fcm:        { method: 'post', url: '/co/ext/push-fcm-send/send',     label: 'FCM',
                    body: { targetType: 'topic', targetValue: 'test_ping', title: '[ShopJoy] FCM 테스트', body: '연동 확인' } },
      apns:       { method: 'post', url: '/co/ext/push-apns-send/send',    label: 'APNs',
                    body: { deviceToken: 'TEST_TOKEN', title: '[ShopJoy] APNs 테스트', body: '연동 확인' } },
      kakaoAlim:  { method: 'post', url: '/co/ext/kakao-send/send',        label: '카카오 알림톡',
                    body: { msgType: 'alimtalk', toPhone: '01000000000', templateCode: 'TEST_TMPL', variables: {} } },
      kakaoShare: { method: 'get',  url: '/bo/sy/app-config/all',          label: '카카오톡 공유', note: 'FE 전용 — BE 키 조회로 확인' },
      ai:         { method: 'post', url: '/co/ext/ai-chat/chat',           label: 'AI 챗봇',
                    body: { provider: 'openai', message: '연동 테스트: 안녕하세요' } },
    };

    const handleTest = async (row) => {
      if (row._testing) return;
      const meta = _TEST_MAP[row._testFn];
      if (!meta) { row.testResult = '실패'; row.testMsg = '테스트 미정의'; return; }
      row._testing = true; row.testResult = '-'; row.testMsg = '확인 중...';
      try {
        let res;
        if (meta.method === 'post') {
          res = await boApi.post(meta.url, meta.body || {}, coUtil.cofApiHdr('연동설정대시보드', meta.label + ' 테스트'));
        } else {
          res = await boApi.get(meta.url, coUtil.cofApiHdr('연동설정대시보드', meta.label + ' 테스트'));
        }
        const ok = res.data?.success !== false;
        row.testResult = ok ? '성공' : '실패';
        row.testMsg    = res.data?.data?.message || res.data?.message || (ok ? (meta.note || '정상') : '오류');
      } catch (e) {
        row.testResult = '실패';
        row.testMsg    = e.response?.data?.message || e.message || '연결 실패';
      } finally {
        row._testing = false;
      }
    };

    /* ##### [06] 이벤트 핸들러 ##################################################### */

    const handleExpandToggle = (row) => {
      if (expandedKeys.has(row.keyName)) expandedKeys.delete(row.keyName);
      else expandedKeys.add(row.keyName);
    };

    const handleExpandAll = () => rows.forEach((r) => expandedKeys.add(r.keyName));
    const handleCollapseAll = () => expandedKeys.clear();

    const handleRefresh = async () => {
      loading.value = true;
      expandedKeys.clear();
      await _fetchBeSettings();
      _buildRows();
      loading.value = false;
      showToast('연동 설정 현황을 새로고침했습니다.', 'success');
    };

    const handleTestAll = async () => {
      for (const row of rows) await handleTest(row);
      showToast('전체 테스트 완료.', 'success');
    };

    /* ##### [07] 라이프사이클 ####################################################### */

    onMounted(async () => {
      loading.value = true;
      await _fetchBeSettings();
      _buildRows();
      loading.value = false;
      handlePropSearch();
      handleYmlSearch();
    });

    /* ── sy_prop 테이블 컬럼 리사이즈 ── */
    const propColWidths = Vue.reactive({});
    let _pResizeTh = null, _pResizeX = 0, _pResizeW = 0;
    const onPropResizeStart = (e, key) => {
      e.preventDefault();
      e.stopPropagation();
      _pResizeTh = e.target.closest('th');
      _pResizeX = e.clientX;
      _pResizeW = _pResizeTh.offsetWidth;
      document.body.classList.add('col-resizing');
      const onMove = (ev) => {
        propColWidths[key] = Math.max(40, _pResizeW + ev.clientX - _pResizeX) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.classList.remove('col-resizing');
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    /* ##### [08] 리턴 ############################################################## */

    const fnIsExpanded = (row) => expandedKeys.has(row.keyName);

    return {
      codes, loading,
      baseGridColumns, rows,
      expandedKeys, fnIsExpanded,
      handleTest, handleRefresh, handleTestAll, handleExpandToggle, handleExpandAll, handleCollapseAll,
      /* sy_prop 조회 */
      PROFILE_OPTIONS_ZD, propSearch, propSearchRows, propSearchTotal, propSearchLoading,
      onPropProfileSelectChange, onPropProfileInputChange, handlePropSearch,
      propColWidths, onPropResizeStart, propSort, fnPropSort, fnSortIcon,
      /* yml 조회 */
      ymlRows, ymlTotal, ymlLoading, ymlSearch, ymlActiveProfile, handleYmlSearch,
      ymlColWidths, onYmlResizeStart, ymlSort, fnYmlSort,
    };
  },

  template: `
<div>
  <bo-page title="연동설정 대시보드" desc-summary="외부 서비스 연동 키 설정 현황 및 테스트. ▼ 클릭으로 상세 정보 확인, 테스트 버튼으로 실제 연결을 검증합니다.">
    <bo-container>
      <bo-grid
        :columns="baseGridColumns"
        :rows="rows"
        :loading="loading"
        :is-expanded="fnIsExpanded"
        list-title="연동 채널 목록"
        empty-text="연동 설정 항목이 없습니다."
      >
        <template #toolbar-actions>
          <button class="btn btn_expand_all" @click="handleExpandAll">전체펼치기</button>
          <button class="btn btn_collapse_all" @click="handleCollapseAll">전체접기</button>
          <button class="btn btn_reset" @click="handleRefresh">새로고침</button>
          <button class="btn btn_search" @click="handleTestAll">전체 테스트</button>
        </template>
        <!-- 펼치기 아이콘 -->
        <template #cell-_expand="{ row }">
          <td style="text-align:center;cursor:pointer;" @click="handleExpandToggle(row)">
            <span style="font-size:11px;color:#aaa;user-select:none;">
              {{ expandedKeys.has(row.keyName) ? '▲' : '▼' }}
            </span>
          </td>
        </template>

        <!-- BE 설정 상태 -->
        <template #cell-beStat="{ row }">
          <td style="text-align:center;vertical-align:middle;padding:5px 8px;">
            <span v-if="row.beStat === '설정됨'" class="badge badge-green">설정됨</span>
            <span v-else-if="row.beStat === '미설정'" class="badge badge-red">미설정</span>
            <span v-else class="badge badge-gray">-</span>
            <div v-if="row._beFile &amp;&amp; row.beStat !== '-'" style="margin-top:4px;font-size:11px;line-height:1.4;word-break:break-all;">
              <span :style="row._beFile.startsWith('yml:') ? 'font-weight:600;color:#0284c7;background:#bae6fd;border-radius:3px;padding:1px 4px;font-family:sans-serif;font-size:10px;' : 'font-weight:600;color:#1e40af;background:#dbeafe;border-radius:3px;padding:1px 4px;font-family:sans-serif;font-size:10px;'">
                {{ row._beFile.startsWith('yml:') ? 'app~.yml' : 'sy_prop' }}
              </span>
              <span style="font-family:monospace;color:#374151;margin-left:3px;">
                {{ row._beFile.replace(/^(yml:|sy_prop:)/, '') }}
              </span>
            </div>
          </td>
        </template>

        <!-- FE 설정 상태 -->
        <template #cell-feStat="{ row }">
          <td style="text-align:center;vertical-align:middle;padding:5px 8px;">
            <span v-if="row.feStat === '설정됨'" class="badge badge-green">설정됨</span>
            <span v-else-if="row.feStat === '미설정'" class="badge badge-red">미설정</span>
            <span v-else class="badge badge-gray">-</span>
            <div v-if="row._feFile &amp;&amp; row.feStat !== '-'" style="margin-top:4px;font-size:11px;line-height:1.4;word-break:break-all;">
              <span :style="row._feFile.startsWith('yml:') ? 'font-weight:600;color:#0284c7;background:#bae6fd;border-radius:3px;padding:1px 4px;font-family:sans-serif;font-size:10px;' : 'font-weight:600;color:#6d28d9;background:#ede9fe;border-radius:3px;padding:1px 4px;font-family:sans-serif;font-size:10px;'">
                {{ row._feFile.startsWith('yml:') ? 'app~.yml' : 'sy_prop' }}
              </span>
              <span style="font-family:monospace;color:#374151;margin-left:3px;">
                {{ row._feFile.replace(/^(yml:|sy_prop:)/, '') }}
              </span>
            </div>
          </td>
        </template>

        <!-- 테스트 버튼 -->
        <template #cell-_test="{ row }">
          <td style="text-align:center;" @click.stop>
            <button class="btn btn-xs"
              :disabled="row._testing"
              :style="row._testing ? 'opacity:.5' : ''"
              @click="handleTest(row)">
              {{ row._testing ? '확인중…' : '테스트' }}
            </button>
          </td>
        </template>

        <!-- 연동결과 아이콘 -->
        <template #cell-testResult="{ row }">
          <td style="text-align:center;">
            <span v-if="row.testResult === '성공'" title="성공" style="font-size:16px;">✅</span>
            <span v-else-if="row.testResult === '실패'" :title="row.testMsg" style="font-size:16px;">❌</span>
            <span v-else style="color:#ccc;font-size:13px;">-</span>
          </td>
        </template>

        <!-- 행 펼침 상세 패널 -->
        <template #row-expand="{ row, colspan }">
          <td :colspan="colspan" style="padding:0;background:#eef2ff;">
          <div style="margin:0 0 2px 0;border-left:4px solid #6366f1;background:#f5f7ff;padding:14px 20px 14px 18px;font-size:12px;box-shadow:inset 0 2px 4px rgba(99,102,241,.06);">
            <!-- 설명 -->
            <div style="margin-bottom:12px;color:#374151;line-height:1.6;">
              {{ row._desc }}
              <a v-if="row._guideUrl"
                :href="row._guideUrl"
                target="_blank"
                style="margin-left:8px;color:#3b82f6;text-decoration:underline;">
                {{ row._guideLabel }} →
              </a>
            </div>
            <!-- 키 정보 테이블 -->
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <colgroup>
                <col style="width:50px">
                <col style="width:200px">
                <col style="width:160px">
                <col>
                <col style="width:110px">
              </colgroup>
              <thead>
                <tr style="background:#e8eaf6;border-bottom:1px solid #c5cae9;">
                  <th style="padding:6px 10px;text-align:left;color:#4a4a7a;font-weight:600;">구분</th>
                  <th style="padding:6px 10px;text-align:left;color:#4a4a7a;font-weight:600;">저장 위치</th>
                  <th style="padding:6px 10px;text-align:left;color:#4a4a7a;font-weight:600;">설정 키</th>
                  <th style="padding:6px 10px;text-align:left;color:#4a4a7a;font-weight:600;">설명</th>
                  <th style="padding:6px 10px;text-align:left;color:#4a4a7a;font-weight:600;">현재 값</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="row._beKey" style="border-bottom:1px solid #e8eaf6;">
                  <td style="padding:7px 10px;color:#2563eb;font-weight:600;">BE</td>
                  <td style="padding:7px 10px;font-family:monospace;font-size:11px;color:#1e40af;">{{ row._beFile || '-' }}</td>
                  <td style="padding:7px 10px;font-family:monospace;color:#374151;">{{ row._beKey }}</td>
                  <td style="padding:7px 10px;color:#6b7280;">{{ row._beDesc }}</td>
                  <td style="padding:7px 10px;">
                    <span v-if="row.beStat === '설정됨'"
                      style="font-family:monospace;color:#059669;background:#ecfdf5;border-radius:4px;padding:2px 6px;">
                      {{ row.beRawVal }}
                    </span>
                    <span v-else style="color:#dc2626;background:#fef2f2;border-radius:4px;padding:2px 6px;">미설정</span>
                  </td>
                </tr>
                <tr v-if="row._feKey">
                  <td style="padding:7px 10px;color:#7c3aed;font-weight:600;">FE</td>
                  <td style="padding:7px 10px;font-size:11px;color:#5c35a0;">{{ row._feFile || '-' }}</td>
                  <td style="padding:7px 10px;font-family:monospace;color:#374151;">{{ row._feKey }}</td>
                  <td style="padding:7px 10px;color:#6b7280;">{{ row._feDesc }}</td>
                  <td style="padding:7px 10px;">
                    <span v-if="row.feStat === '설정됨'"
                      style="font-family:monospace;color:#059669;background:#ecfdf5;border-radius:4px;padding:2px 6px;">
                      {{ row.feRawVal }}
                    </span>
                    <span v-else style="color:#dc2626;background:#fef2f2;border-radius:4px;padding:2px 6px;">미설정</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- 테스트 결과 -->
            <div v-if="row.testResult !== '-'"
              style="margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;"
              :style="row.testResult === '성공'
                ? 'background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;'
                : 'background:#fef2f2;color:#991b1b;border:1px solid #fecaca;'">
              <strong>{{ row.testResult === '성공' ? '✓ 테스트 성공' : '✗ 테스트 실패' }}</strong>
              <span style="margin-left:8px;">{{ row.testMsg }}</span>
            </div>
          </div>
          </td>
        </template>
      </bo-grid>
    </bo-container>

    <bo-container title="sy_prop DB 조회 정보" :count-text="propSearchTotal + '건'">
      <template #toolbar-actions>
        <label class="search-label" style="margin-right:4px;">propProfile</label>
        <select class="form-control" style="width:130px;"
          :value="propSearch.profile"
          @change="onPropProfileSelectChange"
          @keyup.enter="handlePropSearch">
          <option value="">전체 환경</option>
          <option value="local">all; local</option>
          <option value="dev">all; dev</option>
          <option value="prod">all; prod</option>
        </select>
        <input type="text" class="form-control" style="width:100px;font-family:monospace;font-size:12px;margin-left:4px;" placeholder="직접입력"
          :value="propSearch.profileDisplay"
          @input="onPropProfileInputChange"
          @keyup.enter="handlePropSearch" />
        <label class="search-label" style="margin-left:12px;margin-right:4px;">propKey</label>
        <input type="text" class="form-control" style="width:180px;font-family:monospace;font-size:12px;" placeholder="키워드 ; 구분 입력"
          v-model="propSearch.propKey"
          @keyup.enter="handlePropSearch" />
        <button class="btn btn_search" style="margin-left:6px;" @click="handlePropSearch">조회</button>
      </template>
      <div style="overflow-x:auto;border:1px solid #e8e8e8;border-radius:6px;">
        <div style="max-height:210px;overflow-y:auto;">
          <table class="bo-table" style="table-layout:fixed;min-width:800px;width:100%;">
            <colgroup>
              <col style="width:44px;" />
              <col style="width:110px;" />
              <col style="width:28%;" />
              <col style="width:28%;" />
              <col style="width:120px;" />
              <col style="width:50px;" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;' + (propColWidths._no ? 'width:' + propColWidths._no + ';' : '')">번호<div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, '_no')"></div></th>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (propColWidths.profile ? 'width:' + propColWidths.profile + ';' : '')" @click.stop="fnPropSort('propProfile')">propProfile<span style="color:#e06c75;">{{ fnSortIcon('prop','propProfile') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, 'profile')"></div></th>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (propColWidths.propKey ? 'width:' + propColWidths.propKey + ';' : '')" @click.stop="fnPropSort('propKey')">propKey<span style="color:#e06c75;">{{ fnSortIcon('prop','propKey') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, 'propKey')"></div></th>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (propColWidths.propValue ? 'width:' + propColWidths.propValue + ';' : '')" @click.stop="fnPropSort('propValue')">propValue<span style="color:#e06c75;">{{ fnSortIcon('prop','propValue') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, 'propValue')"></div></th>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (propColWidths.propLabel ? 'width:' + propColWidths.propLabel + ';' : '')" @click.stop="fnPropSort('propLabel')">표시명<span style="color:#e06c75;">{{ fnSortIcon('prop','propLabel') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, 'propLabel')"></div></th>
                <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (propColWidths.useYn ? 'width:' + propColWidths.useYn + ';' : '')" @click.stop="fnPropSort('useYn')">useYn<span style="color:#e06c75;">{{ fnSortIcon('prop','useYn') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onPropResizeStart($event, 'useYn')"></div></th>
                <th style="position:sticky;top:0;z-index:3;background:#fafafa;">비고</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="propSearchLoading">
                <td colspan="7" style="text-align:center;padding:16px;color:#aaa;">조회 중...</td>
              </tr>
              <tr v-else-if="!propSearchRows.length">
                <td colspan="7" style="text-align:center;padding:16px;color:#aaa;">데이터가 없습니다.</td>
              </tr>
              <tr v-for="(r, idx) in propSearchRows" :key="r.propId">
                <td style="text-align:center;">{{ idx + 1 }}</td>
                <td style="font-family:monospace;font-size:11px;text-align:center;">{{ r.propProfile }}</td>
                <td style="font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.propKey">{{ r.propKey }}</td>
                <td style="font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.propValue">{{ r.propValue }}</td>
                <td style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.propLabel">{{ r.propLabel }}</td>
                <td style="text-align:center;">
                  <span :class="r.useYn === 'Y' ? 'badge badge-green' : 'badge badge-gray'">{{ r.useYn }}</span>
                </td>
                <td style="font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.propRemark">{{ r.propRemark }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </bo-container>

    <bo-container title="application.yml 조회 정보" :count-text="ymlTotal + '건'">
      <template #toolbar-actions>
        <label class="search-label" style="margin-right:4px;">키워드</label>
        <input type="text" class="form-control" style="width:200px;font-family:monospace;font-size:12px;"
          placeholder="yml 키 / 값 검색"
          v-model="ymlSearch.searchValue"
          @keyup.enter="handleYmlSearch" />
        <button class="btn btn_search" style="margin-left:6px;" @click="handleYmlSearch">조회</button>
      </template>
      <div style="max-height:320px;overflow-y:auto;border:1px solid #e8e8e8;border-radius:6px;">
        <table class="bo-table" style="table-layout:fixed;width:100%;">
          <colgroup>
            <col style="width:70px;" />
            <col style="width:56px;" />
            <col style="width:25%;" />
            <col style="width:60px;" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;' + (ymlColWidths._no ? 'width:' + ymlColWidths._no + ';' : '')">번호<div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onYmlResizeStart($event, '_no')"></div></th>
              <th style="position:sticky;top:0;z-index:3;background:#fafafa;text-align:center;">active</th>
              <th :style="'position:sticky;top:0;z-index:3;background:#fafafa;overflow:visible;cursor:pointer;user-select:none;' + (ymlColWidths.ymlKey ? 'width:' + ymlColWidths.ymlKey + ';' : '')" @click.stop="fnYmlSort('ymlKey')">yml 키<span style="color:#e06c75;">{{ fnSortIcon('yml','ymlKey') }}</span><div style="position:absolute;right:0;top:0;bottom:0;width:5px;cursor:col-resize;z-index:10;" @mousedown.stop="onYmlResizeStart($event, 'ymlKey')"></div></th>
              <th style="position:sticky;top:0;z-index:3;background:#fafafa;text-align:center;cursor:pointer;user-select:none;" @click="fnYmlSort('src')">출처<span style="color:#e06c75;">{{ fnSortIcon('yml','src') }}</span></th>
              <th style="position:sticky;top:0;z-index:3;background:#fafafa;cursor:pointer;user-select:none;" @click="fnYmlSort('ymlValue')">yml 값<span style="color:#e06c75;">{{ fnSortIcon('yml','ymlValue') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ymlLoading">
              <td colspan="5" style="text-align:center;padding:16px;color:#aaa;">조회 중...</td>
            </tr>
            <tr v-else-if="!ymlRows.length">
              <td colspan="5" style="text-align:center;padding:16px;color:#aaa;">데이터가 없습니다.</td>
            </tr>
            <tr v-for="(r, idx) in ymlRows" :key="idx">
              <td style="text-align:center;">{{ idx + 1 }}</td>
              <td style="text-align:center;">
                <span v-if="ymlActiveProfile === 'local'" class="badge badge-green" style="font-size:10px;">local</span>
                <span v-else-if="ymlActiveProfile === 'dev'" class="badge badge-blue" style="font-size:10px;">dev</span>
                <span v-else-if="ymlActiveProfile === 'prod'" class="badge badge-orange" style="font-size:10px;">prod</span>
                <span v-else-if="ymlActiveProfile" class="badge badge-gray" style="font-size:10px;">{{ ymlActiveProfile }}</span>
                <span v-else class="badge badge-gray" style="font-size:10px;">-</span>
              </td>
              <td style="font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.ymlKey">{{ r.ymlKey }}</td>
              <td style="text-align:center;">
                <span v-if="r.source === 'DB'" class="badge badge-green" style="font-size:10px;">DB</span>
                <span v-else-if="r.source === 'YML'" class="badge badge-blue" style="font-size:10px;">YML</span>
                <span v-else class="badge badge-gray" style="font-size:10px;">-</span>
              </td>
              <td style="font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.ymlValue">{{ r.ymlValue }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </bo-container>

    <bo-container>
      <div> ■■■ social 유투브 강좌</div>
      <pre>
- ▪▪▪ 소셜로그인 구현 원리_네이버로그인,카카오로그인,깃헙로그인 원리 : https://www.youtube.com/watch?v=Aa6oqanyOHY&t=26s
- ▪▪▪ 카카오 로그인을 구현하기 위한 설정 및 준비 : https://www.youtube.com/watch?v=Aa6oqanyOHY&t=26s
- ▪▪▪ 네이버 소셜 로그인 구현 :  https://www.youtube.com/watch?v=NrMUyA47gdU
- ▪▪▪ Google OAuth; 구글 소셜 로그인하기 : https://www.youtube.com/watch?v=olnJzoa4A68
- ▪▪▪ 토스페이먼츠 | 5분 만에 결제 연동하기 : https://www.youtube.com/watch?v=HtwLMwzTG5c
- ▪▪▪ 스프링 메일 Sender : 3. 구글 SMTP 신청 : https://www.youtube.com/watch?v=Sedf9uO7W4E
      </pre>
    </bo-container>

    <bo-container>
      <div> ■■■ social kakao</div>
      <pre>
▪ kakao developers > 전체 앱 : https://developers.kakao.com/console/app
-----------------------------------------------------------
▪ 앱 > illeesam_netlify : { ID: 1429368 }
- ▪ 앱 > 플랫폼 키
-- ▪ REST API 키: 44074b1c358f60292145b3068460f37d 
--- ▪ 카카오 로그인 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
---- ▪ 동의항목 : {닉네임:필수동의, 프로필사진:필수동의, 카카오서비스내친구목록:이용중동의}
---- ▪ 접근권한 : {카카오톡 메시지 전송: 선택동의}
--- ▪ 비즈니스 인증 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
--- ▪ 클라이언트 시크릿 > 카카오 로그인 : { 코드: 1gV3lHvBP6KNju9P5E6I4TbchWByfPIh, 활성화:ON }
--- ▪ 클라이언트 시크릿 > 비즈니스 로그인 : { 코드: ZyuNrjSOp2yilmTv9MSxDlXRdwPFXDTB, 활성화:ON }
-- ▪ JavaScript 키: 797a116c08880d3865a89cf4f70b91f5 
--- ▪ JavaScript SDK 도메인 : https://illeesam.synology.me:3000 ▪ https://illeesam.netlify.app ▪ http://127.0.0.1:5501
--- ▪ 카카오 로그인 리다이렉트 URI : https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
-- ▪ 네이티브 앱 키: 96e57663db167a8e7a78345c9d0cf9d2 
- ▪ 앱 > 카카오맵 : {사용설정: ON}
-----------------------------------------------------------
▪ 앱 > illeesam_synology : { ID: 1491354 }
- ▪ 앱 > 플랫폼 키
-- ▪ REST API 키: 63d491e61a4caacf2fc90ee252f2d644 
--- ▪ 카카오 로그인 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
---- ▪ 동의항목 : {닉네임:필수동의, 프로필사진:필수동의, 카카오서비스내친구목록:이용중동의}
---- ▪ 접근권한 : {카카오톡 메시지 전송: 선택동의}
--- ▪ 비즈니스 인증 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
--- ▪ 클라이언트 시크릿 > 카카오 로그인 : { 코드: 7gxUHEectTM7qYSDmhnXUJc3ZE1ymqRO, 활성화:ON }
--- ▪ 클라이언트 시크릿 > 비즈니스 로그인 : { 코드: Q6d7uCUnJBXCXQ2qINFWt2wSZ0sEzpB2, 활성화:ON }
-- ▪ JavaScript 키: a2990e41aa57c3a4ad1fe97a210938d7 
--- ▪ JavaScript SDK 도메인 : https://illeesam.synology.me:3000 ▪ https://illeesam.netlify.app ▪ http://127.0.0.1:5501
--- ▪ 카카오 로그인 리다이렉트 URI : https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
-- ▪ 네이티브 앱 키: 4f43ddc38e22c79280d18595a31ff27b 
- ▪ 앱 > 카카오맵 : {사용설정: ON}
-----------------------------------------------------------
▪ 앱 > illeesam_localhost : { ID: 1491909 }
- ▪ 앱 > 플랫폼 키
-- ▪ REST API 키: 2e8671b1cc341f7d4d92724a2d4eee2c 
--- ▪ 카카오 로그인 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
---- ▪ 동의항목 : {닉네임:필수동의, 프로필사진:필수동의, 카카오서비스내친구목록:이용중동의}
---- ▪ 접근권한 : {카카오톡 메시지 전송: 선택동의}
--- ▪ 비즈니스 인증 리다이렉트 URI: https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
--- ▪ 클라이언트 시크릿 > 카카오 로그인 : { 코드: 7gxUHEectTM7qYSDmhnXUJc3ZE1ymqRO, 활성화:ON }
--- ▪ 클라이언트 시크릿 > 비즈니스 로그인 : { 코드: Q6d7uCUnJBXCXQ2qINFWt2wSZ0sEzpB2, 활성화:ON }
-- ▪ JavaScript 키: 2e8671b1cc341f7d4d92724a2d4eee2c 
--- ▪ JavaScript SDK 도메인 : https://illeesam.synology.me:3000 ▪ https://illeesam.netlify.app ▪ http://127.0.0.1:5501
--- ▪ 카카오 로그인 리다이렉트 URI : https://illeesam.synology.me:3000/login/oauth2/code/kakao ▪ https://illeesam.netlify.app/login/oauth2/code/kakao ▪ http://127.0.0.1:3000/login/oauth2/code/kakao
-- ▪ 네이티브 앱 키: 4f43ddc38e22c79280d18595a31ff27b 
- ▪ 앱 > 카카오맵 : {사용설정: ON}
-----------------------------------------------------------
      </pre>
    </bo-container>

    <bo-container>
      <div> ■■■ social naver</div>
      <pre>
▪ naver developers > application : https://developers.naver.com/apps/#/myapps/K0Xy5CSEtyzRrHnDbf75/overview
-----------------------------------------------------------
▪ 앱 > illeesam_netlify : { Client ID: r6RWBr2qMOCZbGPFALrA, Client Secret : c_V0sjmlR5}
- ▪ API설정 > 사용 API > 네이버 로그인 : { 회원이름: 필수, 연락처 이메일 주소: 필수}
- ▪ API설정 > 로그인 오픈 API > PC웹 > 서비스URL : http://127.0.0.1:5501/bo.html
- ▪ API설정 > 로그인 오픈 API > PC웹 > 네이버로그인 Callback URL : http://127.0.0.1:5501/bo.html ▪ http://127.0.0.1:5501
-----------------------------------------------------------
▪ 앱 > illeesam_synology : { Client ID: jWtLT9SUfE2JWEji2XGq, Client Secret : QOX2GZO1uk}
- ▪ API설정 > 사용 API > 네이버 로그인 : { 회원이름: 필수, 연락처 이메일 주소: 필수}
- ▪ API설정 > 로그인 오픈 API > PC웹 > 서비스URL : http://127.0.0.1:5501/bo.html
- ▪ API설정 > 로그인 오픈 API > PC웹 > 네이버로그인 Callback URL : http://127.0.0.1:5501/bo.html ▪ http://127.0.0.1:5501
-----------------------------------------------------------
▪ 어플리케이션 > illeesam_localhost : { Client ID: 01sBNJ_R7mdQDl5_d3AM, Client Secret : c5cSSSZCaF}
- ▪ API설정 > 사용 API > 네이버 로그인 : { 회원이름: 필수, 연락처 이메일 주소: 필수} 
- ▪ API설정 > 로그인 오픈 API > PC웹 > 서비스URL : http://127.0.0.1:5501/bo.html
- ▪ API설정 > 로그인 오픈 API > PC웹 > 네이버로그인 Callback URL : http://127.0.0.1:5501/bo.html ▪ http://127.0.0.1:5501
-----------------------------------------------------------
      </pre>
    </bo-container>

    <bo-container>
      <div> ■■■ social google</div>
      <pre>
▪ Google 디벨로퍼 https://developers.google.com/?hl=ko
▪ Google Play Console : https://developer.android.com/distribute/console?hl=ko
▪ 계정 : illeesam4@gmail.com

-----------------------------------------------------------
      </pre>
    </bo-container>
  </bo-page>

    <bo-container>
      <div> ■■■ payment : toss</div>
      <pre>
▪ 토스페이먼츠 개발자센터 : https://developers.tosspayments.com/
▪ 토스페이먼츠 개발자센터 > 결제 연동하기 : https://docs.tosspayments.com/guides/v2/payment-widget/integration
- ▪ 토스페이먼츠 개발자센터 > 결제 연동하기 > 문서용 테스트 키 : test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm ▪ test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6
▪ 토스페이먼츠 sandbox : https://developers.tosspayments.com/sandbox
      </pre>
    </bo-container>
  </bo-page>

    <bo-container>
      <div> ■■■ smtp : google</div>
      <pre>
▪ 계정 : illeesam4@gmail.com, 
▪ 구글 계정관리
▪ 2단계인증 활성화
▪ 앱 비밀번호
- ▪ 앱이름 : illeesam4app, 생성된 앱 비밀번호 : wqji ylpf pcwt vhnh
      </pre>
    </bo-container>
  </bo-page>
</div>
`,
};
