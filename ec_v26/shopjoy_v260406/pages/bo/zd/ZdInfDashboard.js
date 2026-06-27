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
      { key: 'channelCode', label: '코드',          width: '110px', mono: true },
      { key: 'category',    label: '분류',           width: '80px' },
      { key: 'channel',     label: '채널 / 서비스',  width: '130px' },
      { key: 'beStat',      label: 'BE 설정',        width: '190px', align: 'center' },
      { key: 'feStat',      label: 'FE 설정',        width: '120px', align: 'center' },
      { key: '_test',       label: '테스트',         width: '90px',  align: 'center' },
      { key: 'testResult',  label: '연동결과',       width: '150px', align: 'center' },
      { key: 'testMsg',     label: '테스트 결과',    width: '180px' },
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
        channelCode: 'SOCIAL_GOOGLE',
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
        channelCode: 'SOCIAL_KAKAO',
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
        channelCode: 'SOCIAL_NAVER',
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
        channelCode: 'PAY_TOSS',
        category: '결제', channel: '토스페이먼츠', feKey: 'tossClientKey', beKey: 'app.ext-sdk.toss-client-key',
        remark: 'FE:클라이언트키 / BE:시크릿키(app.pay.toss.secret-key)', testFn: 'toss',
        desc: '토스페이먼츠 결제 연동에 사용합니다. 토스페이먼츠 개발자 센터에서 클라이언트 키(FE)와 시크릿 키(BE)를 발급받으세요.',
        guideUrl: 'https://developers.tosspayments.com/',
        guideLabel: '토스페이먼츠 개발자센터',
        feDesc: 'FE에서 결제창 초기화 시 사용하는 클라이언트 키 (test_gck_docs_* 또는 live_ck_* 접두어)',
        feFile: 'sy_prop:app.ext-sdk.toss-client-key',
        beDesc: 'BE에서 결제 승인/취소 API 호출 시 HTTP Basic Auth 비밀번호로 사용하는 시크릿 키',
        beFile: 'sy_prop:app.pay.toss.secret-key',
        dbTable: 'od_pay, od_pay_method, od_refund',
      },
      /* ── 지도 ── */
      {
        channelCode: 'MAP_KAKAO',
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
        channelCode: 'MAP_NAVER',
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
        channelCode: 'MAP_GOOGLE',
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
        channelCode: 'MAIL_SMTP',
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
        channelCode: 'MSG_SMS',
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
        channelCode: 'PUSH_FCM',
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
        channelCode: 'PUSH_APNS',
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
        channelCode: 'KAKAO_ALIM',
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
        channelCode: 'KAKAO_SHARE',
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
        channelCode: 'AI_CHATBOT',
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

    /* 이력 패널 상태 */
    const histState = reactive({
      show: false, channelKey: '', channelLabel: '', logs: [], loading: false,
      pageNo: 1, pageSize: 5, total: 0,
    });

    const _buildRows = () => {
      rows.length = 0;
      _META.forEach((m) => {
        const feVal = _feKey(m.feKey);
        const beVal = m.beKey ? (_beCache[m.beKey] ?? null) : null;
        const key = m.testFn || m.feKey || m.beKey || '-';
        rows.push({
          channelCode:   m.channelCode || key.toUpperCase(),
          category:      m.category,
          channel:       m.channel,
          keyName:       key,
          feStat:        m.feKey ? _statOf(feVal) : '-',
          beStat:        m.beKey ? _statOf(beVal)  : '-',
          feRawVal:      feVal ? String(feVal).slice(0, 6) + '••••••' : null,
          beRawVal:      beVal ? String(beVal).slice(0, 6) + '••••••' : null,
          testResult:    '-',
          testMsg:       '',
          lastTestDate:  null,
          lastTestOk:    null,
          remark:        m.remark,
          _testFn:       m.testFn,
          _testing:      false,
          _desc:         m.desc,
          _guideUrl:     m.guideUrl,
          _guideLabel:   m.guideLabel,
          _feKey:        m.feKey,
          _beKey:        m.beKey,
          _feDesc:       m.feDesc,
          _feFile:       m.feFile ? m.feFile.replace('propKey', m.feKey || '') : null,
          _beDesc:       m.beDesc,
          _beFile:       m.beFile  || null,
          _dbTable:      m.dbTable || null,
        });
      });
    };

    /* 페이지 로드 시 채널별 최신 이력 1건씩 가져와 연동결과 열 초기화 */
    const _fetchLatestResults = async () => {
      try {
        const res = await boApi.get('/bo/sy/ext-test-log/latest',
          coUtil.cofApiHdr('연동설정대시보드', '최신이력조회'));
        const list = res.data?.data || [];
        const map = {};
        list.forEach((lg) => { map[lg.channelKey] = lg; });
        rows.forEach((row) => {
          const lg = map[row.keyName];
          if (lg) {
            row.lastTestDate = lg.regDate;
            row.lastTestOk   = lg.testResult === 'SUCCESS';
          }
        });
      } catch (_) { /* 무시 */ }
    };

    const fnFmtDatetime = (iso) => {
      if (!iso) return '-';
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    };

    /* 이력 셀 표시 헬퍼 */

    /* JSON 문자열 → [{k, v}, ...] 배열 (중첩 없이 1단계만) */
    const fnParseKv = (str) => {
      if (!str) return null;
      try {
        const obj = JSON.parse(str);
        if (typeof obj !== 'object' || obj === null) return null;
        return Object.entries(obj).map(([k, v]) => ({
          k,
          v: (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v == null ? '' : v),
        }));
      } catch (_) { return null; }
    };

    /* 계정정보: [{k,v}] 배열 반환 */
    const fnFmtAccount = (lg) => {
      if (lg.testAccount) {
        const kv = fnParseKv(lg.testAccount);
        if (kv) return kv;
        return [{ k: '대상', v: lg.testAccount }];
      }
      /* 구형 데이터: testMsg에서 [요청]{...}[결과] 추출 */
      if (lg.testMsg && lg.testMsg.startsWith('[요청]')) {
        try {
          const m = lg.testMsg.match(/^\[요청\]\s*(\{[\s\S]*?\})\s*\[결과\]/);
          if (m) {
            const obj = JSON.parse(m[1]);
            const acc = [];
            if (obj.toEmail)     acc.push({ k: 'toEmail',  v: obj.toEmail });
            if (obj.toPhone)     acc.push({ k: 'toPhone',  v: obj.toPhone });
            if (obj.deviceToken) acc.push({ k: 'deviceToken', v: obj.deviceToken.slice(0, 20) + '…' });
            if (obj.targetValue) acc.push({ k: 'target',   v: (obj.targetType || '') + ':' + obj.targetValue });
            return acc.length ? acc : null;
          }
        } catch (_) {}
      }
      return null;
    };

    /* 요청내용: [{k,v}] 배열 반환 */
    const fnFmtReq = (lg) => {
      if (lg.testReqBody) {
        const kv = fnParseKv(lg.testReqBody);
        if (kv) return kv;
        return [{ k: '내용', v: lg.testReqBody }];
      }
      if (lg.testMsg && lg.testMsg.startsWith('[요청]')) {
        try {
          const m = lg.testMsg.match(/^\[요청\]\s*(\{[\s\S]*?\})\s*\[결과\]/);
          if (m) {
            const kv = fnParseKv(m[1]);
            return kv || [{ k: '내용', v: m[1] }];
          }
        } catch (_) {}
      }
      return null;
    };

    /* 응답내용: 문자열 반환 */
    const fnFmtResp = (lg) => {
      if (!lg.testMsg) return null;
      if (lg.testMsg.startsWith('[요청]')) {
        const idx = lg.testMsg.indexOf('[결과]');
        return idx >= 0 ? lg.testMsg.slice(idx + 4).trim() : lg.testMsg;
      }
      return lg.testMsg;
    };

    const _loadHist = async () => {
      if (!histState.channelKey) return;
      histState.loading = true;
      try {
        const res = await boApi.get('/bo/sy/ext-test-log/list', {
          params: { channelKey: histState.channelKey, pageNo: histState.pageNo, pageSize: histState.pageSize },
          ...coUtil.cofApiHdr('연동설정대시보드', '이력조회'),
        });
        const d = res.data?.data || {};
        histState.logs  = d.pageList || (Array.isArray(d) ? d : []);
        histState.total = d.pageTotalCount ?? histState.logs.length;
      } catch (_) { histState.logs = []; histState.total = 0; }
      finally { histState.loading = false; }
    };

    const handleHistOpen = async (row) => {
      histState.show         = true;
      histState.channelKey   = row.keyName;
      histState.channelLabel = row.channel;
      histState.pageNo       = 1;
      histState.logs         = [];
      histState.total        = 0;
      await _loadHist();
    };

    const handleHistClose = () => { histState.show = false; };

    const handleHistPage = async (n) => { histState.pageNo = n; await _loadHist(); };

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

    /*
     * 채널별 테스트 맵
     * method: 'key-check' — BE/FE 키 설정 여부로만 판정 (실제 API 호출 없음)
     * method: 'post'/'get' — 실제 API 호출
     * checkBeKey / checkFeKey — key-check 시 확인할 BE/FE 키 이름
     */
    const _TEST_MAP = {
      google:     { method: 'key-check', label: 'Google OAuth',  checkBeKey: 'app.ext-sdk.google-client-id', checkFeKey: 'googleClientId' },
      kakao:      { method: 'key-check', label: 'Kakao OAuth',   checkBeKey: 'app.ext-sdk.kakao-js-key',    checkFeKey: 'kakaoJsKey' },
      naver:      { method: 'key-check', label: 'Naver OAuth',   checkBeKey: 'app.ext-sdk.naver-client-id', checkFeKey: 'naverClientId' },
      toss:       { method: 'key-check', label: '토스 결제',     checkBeKey: 'app.pay.toss.secret-key',     checkFeKey: 'tossClientKey' },
      kakaoMap:   { method: 'key-check', label: 'Kakao 지도',    checkBeKey: 'app.ext-sdk.kakao-map-js-key',checkFeKey: 'kakaoMapJsKey' },
      naverMap:   { method: 'key-check', label: 'Naver 지도',    checkBeKey: 'app.ext-sdk.naver-map-client-id', checkFeKey: 'naverMapClientId' },
      googleMap:  { method: 'key-check', label: 'Google 지도',   checkBeKey: 'app.ext-sdk.google-map-api-key',  checkFeKey: 'googleMapApiKey' },
      kakaoShare: { method: 'key-check', label: '카카오톡 공유', checkBeKey: 'app.ext-sdk.kakao-js-key',    checkFeKey: 'kakaoJsKey' },
      smtp:       { method: 'post', url: '/co/ext/mail-send/send',      label: 'SMTP',
                    body: { toEmail: 'test@example.com', toName: '테스트', subject: '[ShopJoy] 연동 테스트', body: '연동 설정 대시보드 테스트 발송' } },
      sms:        { method: 'post', url: '/co/ext/sms-send/send',       label: 'SMS',
                    body: { toPhone: '01000000000', message: '[ShopJoy] SMS 연동 테스트' } },
      fcm:        { method: 'post', url: '/co/ext/push-fcm-send/send',  label: 'FCM',
                    body: { targetType: 'topic', targetValue: 'test_ping', title: '[ShopJoy] FCM 테스트', body: '연동 확인' } },
      apns:       { method: 'post', url: '/co/ext/push-apns-send/send', label: 'APNs',
                    body: { deviceToken: 'TEST_TOKEN', title: '[ShopJoy] APNs 테스트', body: '연동 확인' } },
      kakaoAlim:  { method: 'post', url: '/co/ext/kakao-send/send',     label: '카카오 알림톡',
                    body: { msgType: 'alimtalk', toPhone: '01000000000', templateCode: 'TEST_TMPL', variables: {} } },
      ai:         { method: 'post', url: '/co/ext/ai-chat/chat',        label: 'AI 챗봇',
                    body: { provider: 'openai', message: '연동 테스트: 안녕하세요' } },
    };

    const handleTest = async (row) => {
      if (row._testing) return;
      const meta = _TEST_MAP[row._testFn];
      if (!meta) { row.testResult = '실패'; row.testMsg = '테스트 미정의'; return; }
      row._testing = true; row.testResult = '-'; row.testMsg = '확인 중...';

      let ok = false;
      let msg = '';
      let reqBody = null;

      try {
        if (meta.method === 'key-check') {
          /* 실제 키 설정 여부로 판정 */
          const beOk = !meta.checkBeKey || !!_beCache[meta.checkBeKey];
          const feOk = !meta.checkFeKey || !!_feKey(meta.checkFeKey);
          const msgs = [];
          if (meta.checkBeKey) msgs.push('BE(' + meta.checkBeKey + '): ' + (beOk ? '설정됨' : '미설정'));
          if (meta.checkFeKey) msgs.push('FE(' + meta.checkFeKey + '): ' + (feOk ? '설정됨' : '미설정'));
          ok  = (meta.checkBeKey ? beOk : true) && (meta.checkFeKey ? feOk : true);
          msg = msgs.join(' / ');
        } else {
          let res;
          if (meta.method === 'post') {
            reqBody = meta.body || {};
            res = await boApi.post(meta.url, reqBody, coUtil.cofApiHdr('연동설정대시보드', meta.label + ' 테스트'));
          } else {
            res = await boApi.get(meta.url, coUtil.cofApiHdr('연동설정대시보드', meta.label + ' 테스트'));
          }
          ok  = res.data?.success !== false;
          msg = res.data?.data?.message || res.data?.message || (ok ? '정상' : '오류');
        }
        row.testResult = ok ? '성공' : '실패';
        row.testMsg    = msg;
      } catch (e) {
        ok  = false;
        msg = e.response?.data?.message || e.message || '연결 실패';
        row.testResult = '실패';
        row.testMsg    = msg;
      } finally {
        row._testing = false;
      }

      /* 이력 저장 */
      try {
        const now = new Date().toISOString();
        row.lastTestDate = now;
        row.lastTestOk   = ok;

        /* 계정정보: 채널별로 수신자/대상 정보 추출 */
        let testAccount = null;
        if (reqBody) {
          if (reqBody.toEmail)     testAccount = reqBody.toEmail;
          else if (reqBody.toPhone)  testAccount = reqBody.toPhone;
          else if (reqBody.deviceToken) testAccount = reqBody.deviceToken.slice(0, 40) + (reqBody.deviceToken.length > 40 ? '…' : '');
          else if (reqBody.targetValue) testAccount = reqBody.targetType + ':' + reqBody.targetValue;
        }

        /* 요청 내용: body JSON (key-check는 checkBeKey/checkFeKey 정보) */
        let testReqBody = null;
        if (meta.method === 'key-check') {
          const parts = [];
          if (meta.checkBeKey) parts.push('BE:' + meta.checkBeKey);
          if (meta.checkFeKey) parts.push('FE:' + meta.checkFeKey);
          testReqBody = parts.join(' / ');
        } else if (reqBody && Object.keys(reqBody).length) {
          testReqBody = JSON.stringify(reqBody, null, 0).slice(0, 2000);
        }

        await boApi.post('/bo/sy/ext-test-log/save', {
          siteId:       window.boApp?.siteId || 'SITE000001',
          channelKey:   row.keyName,
          channelLabel: row.channel,
          testResult:   ok ? 'SUCCESS' : 'FAIL',
          testMsg:      msg.slice(0, 2000),
          testUrl:      meta.url || null,
          testReqBody:  testReqBody,
          testAccount:  testAccount,
        }, coUtil.cofApiHdr('연동설정대시보드', '이력저장'));

        /* 테스트 완료 후 해당 채널 이력 패널 자동 열기/갱신 */
        histState.show         = true;
        histState.channelKey   = row.keyName;
        histState.channelLabel = row.channel;
        histState.pageNo       = 1;
        await _loadHist();
      } catch (_) { /* 이력 저장 실패는 조용히 무시 */ }
    };

    /* ##### [06] 이벤트 핸들러 ##################################################### */

    const handleRefresh = async () => {
      loading.value = true;
      await _fetchBeSettings();
      _buildRows();
      loading.value = false;
      _fetchLatestResults();
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
      _fetchLatestResults();
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

    return {
      codes, loading,
      baseGridColumns, rows,
      histState, fnFmtDatetime, fnFmtAccount, fnFmtReq, fnFmtResp,
      handleHistOpen, handleHistClose, handleHistPage,
      handleTest, handleRefresh, handleTestAll, _fetchLatestResults,
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
  <bo-page title="연동설정 대시보드" desc-summary="외부 서비스 연동 키 설정 현황 및 테스트. 행 클릭 시 하단에 이력을 표시합니다.">
    <bo-container>
      <bo-grid
        :columns="baseGridColumns"
        :rows="rows"
        :loading="loading"
        list-title="연동 채널 목록"
        empty-text="연동 설정 항목이 없습니다."
        table-max-height="300px"
      >
        <template #toolbar-actions>
          <button class="btn btn_reset" @click="handleRefresh">새로고침</button>
          <button class="btn btn_search" @click="handleTestAll">전체 테스트</button>
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

        <!-- 테스트 + 이력조회 버튼 -->
        <template #cell-_test="{ row }">
          <td style="text-align:center;padding:4px 6px;" @click.stop>
            <button class="btn btn-xs" style="display:block;width:72px;margin:0 auto 4px;"
              :disabled="row._testing"
              :style="row._testing ? 'opacity:.5' : ''"
              @click="handleTest(row)">
              {{ row._testing ? '확인중…' : '테스트' }}
            </button>
            <button class="btn btn-xs" style="display:block;width:72px;margin:0 auto;"
              :style="histState.show &amp;&amp; histState.channelKey === row.keyName ? 'background:#6366f1;color:#fff;border-color:#6366f1;' : ''"
              @click="handleHistOpen(row)">
              이력조회
            </button>
          </td>
        </template>

        <!-- 연동결과: 마지막 테스트 일시 + 결과 -->
        <template #cell-testResult="{ row }">
          <td style="text-align:center;padding:4px 6px;">
            <div v-if="row.lastTestDate" style="font-size:11px;line-height:1.5;">
              <div style="color:#6b7280;font-size:10px;">{{ fnFmtDatetime(row.lastTestDate) }}</div>
              <span v-if="row.lastTestOk" style="color:#059669;font-weight:600;">✅ 성공</span>
              <span v-else style="color:#dc2626;font-weight:600;">❌ 실패</span>
            </div>
            <span v-else style="color:#ccc;font-size:13px;">-</span>
          </td>
        </template>
      </bo-grid>
    </bo-container>

    <!-- 이력 목록 패널 -->
    <bo-container v-if="histState.show"
      :title="'테스트 이력 — ' + histState.channelLabel"
      :count-text="histState.total + '건'">
      <template #toolbar-actions>
        <button class="btn btn_close" @click="handleHistClose">닫기</button>
      </template>
      <div v-if="histState.loading" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">조회 중...</div>
      <div v-else-if="!histState.logs.length" style="padding:20px;text-align:center;color:#aaa;font-size:13px;">이력이 없습니다.</div>
      <template v-else>
        <div style="overflow-x:auto;">
          <table class="bo-table" style="width:100%;min-width:960px;table-layout:fixed;">
            <colgroup>
              <col style="width:36px;">
              <col style="width:138px;">
              <col style="width:56px;">
              <col style="width:170px;">
              <col style="width:150px;">
              <col style="width:30%;">
              <col>
            </colgroup>
            <thead>
              <tr>
                <th style="text-align:center;">번호</th>
                <th style="text-align:center;">일시</th>
                <th style="text-align:center;">결과</th>
                <th>URL</th>
                <th>계정정보</th>
                <th>요청내용</th>
                <th>응답내용</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(lg, li) in histState.logs" :key="lg.logId">
                <td style="text-align:center;color:#aaa;vertical-align:top;padding-top:8px;">{{ histState.total - (histState.pageNo - 1) * histState.pageSize - li }}</td>
                <td style="text-align:center;white-space:nowrap;color:#6b7280;font-size:11px;vertical-align:top;padding-top:8px;">{{ fnFmtDatetime(lg.regDate) }}</td>
                <td style="text-align:center;vertical-align:top;padding-top:8px;">
                  <span v-if="lg.testResult === 'SUCCESS'" class="badge badge-green">성공</span>
                  <span v-else class="badge badge-red">실패</span>
                </td>
                <td style="font-family:monospace;font-size:10px;color:#0284c7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:top;padding-top:8px;" :title="lg.testUrl">{{ lg.testUrl || '-' }}</td>
                <td style="vertical-align:top;padding:6px 8px;">
                  <template v-if="fnFmtAccount(lg)">
                    <div v-for="(item, ii) in fnFmtAccount(lg)" :key="ii"
                      style="font-size:11px;line-height:1.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      <span style="color:#9ca3af;font-size:10px;">{{ item.k }}:</span>
                      <span style="font-family:monospace;color:#1e40af;margin-left:3px;">{{ item.v }}</span>
                    </div>
                  </template>
                  <span v-else style="color:#d1d5db;font-size:11px;">-</span>
                </td>
                <td style="vertical-align:top;padding:6px 8px;">
                  <template v-if="fnFmtReq(lg)">
                    <div v-for="(item, ri) in fnFmtReq(lg)" :key="ri"
                      style="font-size:11px;line-height:1.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      <span style="color:#9ca3af;font-size:10px;">{{ item.k }}:</span>
                      <span style="font-family:monospace;color:#374151;margin-left:3px;">{{ item.v }}</span>
                    </div>
                  </template>
                  <span v-else style="color:#d1d5db;font-size:11px;">-</span>
                </td>
                <td style="vertical-align:top;padding:6px 8px;">
                  <span v-if="fnFmtResp(lg)"
                    style="font-size:11px;color:#374151;white-space:pre-wrap;word-break:break-all;line-height:1.7;">{{ fnFmtResp(lg) }}</span>
                  <span v-else style="color:#d1d5db;font-size:11px;">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- 페이징 -->
        <div style="display:flex;justify-content:center;gap:4px;padding:10px 0 2px;">
          <button class="btn btn-xs" :disabled="histState.pageNo <= 1" @click="handleHistPage(histState.pageNo - 1)">‹</button>
          <span style="font-size:12px;color:#6b7280;padding:0 8px;line-height:26px;">
            {{ histState.pageNo }} / {{ Math.max(1, Math.ceil(histState.total / histState.pageSize)) }}
          </span>
          <button class="btn btn-xs" :disabled="histState.pageNo >= Math.ceil(histState.total / histState.pageSize)" @click="handleHistPage(histState.pageNo + 1)">›</button>
        </div>
      </template>
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

    <bo-container title="참고자료 · 계정정보">
      <style>
        .ref-svc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:14px; padding:4px 0; }
        .ref-svc-card { border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
        .ref-svc-head { padding:8px 14px; display:flex; align-items:center; gap:8px; font-weight:700; font-size:13px; }
        .ref-svc-body { padding:10px 14px; font-size:12px; line-height:1.9; }
        .ref-sub { background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:8px 12px; margin:6px 0; }
        .ref-sub-title { font-weight:700; font-size:11px; color:#374151; margin-bottom:4px; }
        .ref-kv { display:flex; gap:6px; align-items:flex-start; flex-wrap:wrap; margin:1px 0; }
        .ref-lbl { color:#9ca3af; font-size:11px; white-space:nowrap; min-width:80px; }
        .ref-key { font-family:monospace; font-size:11px; padding:1px 6px; border-radius:3px; word-break:break-all; }
        .ref-key.green  { background:#d1fae5; color:#065f46; }
        .ref-key.blue   { background:#dbeafe; color:#1e40af; }
        .ref-key.purple { background:#ede9fe; color:#5b21b6; }
        .ref-key.yellow { background:#fef3c7; color:#92400e; }
        .ref-key.red    { background:#fee2e2; color:#991b1b; font-size:15px; letter-spacing:3px; font-weight:700; }
        .ref-key.gray   { background:#f3f4f6; color:#374151; }
        .ref-link { color:#2563eb; text-decoration:none; font-size:11px; }
        .ref-link:hover { text-decoration:underline; }
        .ref-badge { font-size:10px; font-weight:700; padding:1px 6px; border-radius:3px; }
        .ref-urls { font-size:10px; color:#6b7280; margin-top:2px; }
      </style>

      <div class="ref-svc-grid">

        <!-- ① YouTube 강좌 -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#fef2f2;">
            <span class="ref-badge" style="background:#dc2626;color:#fff;">YT</span>
            YouTube 참고 강좌
          </div>
          <div class="ref-svc-body">
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=Aa6oqanyOHY" target="_blank">소셜로그인 구현 원리 (네이버/카카오/깃헙)</a></div>
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=Aa6oqanyOHY" target="_blank">카카오 로그인 설정 및 준비</a></div>
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=NrMUyA47gdU" target="_blank">네이버 소셜 로그인 구현</a></div>
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=olnJzoa4A68" target="_blank">Google OAuth 구글 소셜 로그인</a></div>
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=HtwLMwzTG5c" target="_blank">토스페이먼츠 5분 결제 연동</a></div>
            <div><a class="ref-link" href="https://www.youtube.com/watch?v=Sedf9uO7W4E" target="_blank">스프링 SMTP / 구글 앱 비밀번호 신청</a></div>
          </div>
        </div>

        <!-- ② Kakao -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#fefce8;">
            <span class="ref-badge" style="background:#ca8a04;color:#fff;">KA</span>
            Kakao &nbsp;<a class="ref-link" href="https://developers.kakao.com/console/app" target="_blank">developers console</a>
          </div>
          <div class="ref-svc-body">

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_netlify &nbsp;<span style="color:#9ca3af;font-weight:400;">ID: 1429368</span></div>
              <div class="ref-kv"><span class="ref-lbl">REST API 키</span><span class="ref-key green">44074b1c358f60292145b3068460f37d</span></div>
              <div class="ref-kv"><span class="ref-lbl">JavaScript 키</span><span class="ref-key blue">797a116c08880d3865a89cf4f70b91f5</span></div>
              <div class="ref-kv"><span class="ref-lbl">네이티브 앱 키</span><span class="ref-key purple">96e57663db167a8e7a78345c9d0cf9d2</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(로그인)</span><span class="ref-key yellow">1gV3lHvBP6KNju9P5E6I4TbchWByfPIh</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(비즈)</span><span class="ref-key yellow">ZyuNrjSOp2yilmTv9MSxDlXRdwPFXDTB</span></div>
              <div class="ref-urls">Redirect: /login/oauth2/code/kakao (netlify / synology:3000 / 127.0.0.1:3000)</div>
            </div>

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_synology &nbsp;<span style="color:#9ca3af;font-weight:400;">ID: 1491354</span></div>
              <div class="ref-kv"><span class="ref-lbl">REST API 키</span><span class="ref-key green">63d491e61a4caacf2fc90ee252f2d644</span></div>
              <div class="ref-kv"><span class="ref-lbl">JavaScript 키</span><span class="ref-key blue">a2990e41aa57c3a4ad1fe97a210938d7</span></div>
              <div class="ref-kv"><span class="ref-lbl">네이티브 앱 키</span><span class="ref-key purple">4f43ddc38e22c79280d18595a31ff27b</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(로그인)</span><span class="ref-key yellow">7gxUHEectTM7qYSDmhnXUJc3ZE1ymqRO</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(비즈)</span><span class="ref-key yellow">Q6d7uCUnJBXCXQ2qINFWt2wSZ0sEzpB2</span></div>
            </div>

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_localhost &nbsp;<span style="color:#9ca3af;font-weight:400;">ID: 1491909</span></div>
              <div class="ref-kv"><span class="ref-lbl">REST API 키</span><span class="ref-key green">2e8671b1cc341f7d4d92724a2d4eee2c</span></div>
              <div class="ref-kv"><span class="ref-lbl">JavaScript 키</span><span class="ref-key blue">2e8671b1cc341f7d4d92724a2d4eee2c</span></div>
              <div class="ref-kv"><span class="ref-lbl">네이티브 앱 키</span><span class="ref-key purple">4f43ddc38e22c79280d18595a31ff27b</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(로그인)</span><span class="ref-key yellow">7gxUHEectTM7qYSDmhnXUJc3ZE1ymqRO</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿(비즈)</span><span class="ref-key yellow">Q6d7uCUnJBXCXQ2qINFWt2wSZ0sEzpB2</span></div>
            </div>

          </div>
        </div>

        <!-- ③ Naver -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#f0fdf4;">
            <span class="ref-badge" style="background:#16a34a;color:#fff;">NV</span>
            Naver &nbsp;<a class="ref-link" href="https://developers.naver.com/apps/#/myapps/K0Xy5CSEtyzRrHnDbf75/overview" target="_blank">developers console</a>
          </div>
          <div class="ref-svc-body">

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_netlify</div>
              <div class="ref-kv"><span class="ref-lbl">Client ID</span><span class="ref-key green">r6RWBr2qMOCZbGPFALrA</span></div>
              <div class="ref-kv"><span class="ref-lbl">Client Secret</span><span class="ref-key yellow">c_V0sjmlR5</span></div>
              <div class="ref-urls">Callback: http://127.0.0.1:3000/oauth/callback/naver</div>
            </div>

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_synology</div>
              <div class="ref-kv"><span class="ref-lbl">Client ID</span><span class="ref-key green">jWtLT9SUfE2JWEji2XGq</span></div>
              <div class="ref-kv"><span class="ref-lbl">Client Secret</span><span class="ref-key yellow">QOX2GZO1uk</span></div>
              <div class="ref-urls">Callback: http://127.0.0.1:3000/oauth/callback/naver</div>
            </div>

            <div class="ref-sub">
              <div class="ref-sub-title">illeesam_localhost</div>
              <div class="ref-kv"><span class="ref-lbl">Client ID</span><span class="ref-key green">01sBNJ_R7mdQDl5_d3AM</span></div>
              <div class="ref-kv"><span class="ref-lbl">Client Secret</span><span class="ref-key yellow">c5cSSSZCaF</span></div>
              <div class="ref-urls">Callback: http://127.0.0.1:3000/oauth/callback/naver</div>
            </div>

          </div>
        </div>

        <!-- ④ Google -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#eff6ff;">
            <span class="ref-badge" style="background:#2563eb;color:#fff;">GO</span>
            Google &nbsp;<a class="ref-link" href="https://developers.google.com/?hl=ko" target="_blank">developers</a>
            &nbsp;/&nbsp;<a class="ref-link" href="https://console.cloud.google.com/apis/credentials" target="_blank">cloud console</a>
          </div>
          <div class="ref-svc-body">
            <div class="ref-sub">
              <div class="ref-kv"><span class="ref-lbl">계정</span><span class="ref-key blue">illeesam4@gmail.com</span></div>
              <div style="margin-top:6px;font-size:11px;color:#6b7280;">
                <a class="ref-link" href="https://developer.android.com/distribute/console?hl=ko" target="_blank">Google Play Console</a>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑤ Toss -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#f5f3ff;">
            <span class="ref-badge" style="background:#7c3aed;color:#fff;">TP</span>
            토스페이먼츠 &nbsp;<a class="ref-link" href="https://developers.tosspayments.com/" target="_blank">개발자센터</a>
            &nbsp;/&nbsp;<a class="ref-link" href="https://developers.tosspayments.com/sandbox" target="_blank">sandbox</a>
          </div>
          <div class="ref-svc-body">
            <div class="ref-sub">
              <div class="ref-sub-title">문서용 테스트 키</div>
              <div class="ref-kv"><span class="ref-lbl">클라이언트 키</span><span class="ref-key green">test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm</span></div>
              <div class="ref-kv"><span class="ref-lbl">시크릿 키</span><span class="ref-key yellow">test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6</span></div>
              <div class="ref-urls">
                <a class="ref-link" href="https://docs.tosspayments.com/guides/v2/payment-widget/integration" target="_blank">결제 연동하기 가이드</a>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑥ SMTP / Gmail -->
        <div class="ref-svc-card">
          <div class="ref-svc-head" style="background:#fef2f2;">
            <span class="ref-badge" style="background:#dc2626;color:#fff;">ML</span>
            SMTP / Gmail &nbsp;<a class="ref-link" href="https://myaccount.google.com/apppasswords" target="_blank">앱 비밀번호 발급</a>
          </div>
          <div class="ref-svc-body">
            <div class="ref-sub">
              <div class="ref-kv"><span class="ref-lbl">계정</span><span class="ref-key blue">illeesam4@gmail.com</span></div>
              <div class="ref-kv"><span class="ref-lbl">비밀번호</span><span class="ref-key red">sxxx5xx4x!</span></div>
              <div class="ref-kv"><span class="ref-lbl">앱 이름</span><span class="ref-key gray">illeesam4app</span></div>
              <div class="ref-kv"><span class="ref-lbl">앱 비밀번호</span><span class="ref-key yellow">wqji ylpf pcwt vhnh</span></div>
              <div class="ref-urls">2단계 인증 활성화 필수 · 구글 계정관리에서 앱 비밀번호 생성</div>
            </div>
          </div>
        </div>

      </div>
    </bo-container>

  </bo-page>
</div>
`,
};
