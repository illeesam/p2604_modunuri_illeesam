/**
 * 개발도구 — 연동설정 대시보드
 *
 * 외부 서비스 연동 설정 현황을 한 눈에 확인하는 bo-grid 기반 대시보드.
 * 소셜로그인 / 결제 / 지도 / 메일·SMS / 푸시 / 챗봇 / 앱 메시지 등
 * BE 설정 여부 / FE 설정 여부 / 테스트 버튼 / 연동결과 / 테스트 결과 표시.
 */
window.ZdInfDashboard = {
  name: 'ZdInfDashboard',
  props: {
    navigate:  { type: Function, required: true },                       // 페이지 이동
    showToast: { type: Function, default: () => {} },                    // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, ref, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const codes = reactive({});
    const loading = ref(false);

    /* ##### [02] 그리드 컬럼 정의 ################################################### */

    const baseGridColumns = [
      { key: 'category',   label: '분류',       width: '90px' },
      { key: 'channel',    label: '채널 / 서비스', width: '150px' },
      { key: 'keyName',    label: '설정 키',    width: '180px', mono: true },
      {
        key: 'beStat',
        label: 'BE 설정',
        width: '80px',
        align: 'center',
        badge: (row) => row.beStat === '설정됨' ? 'badge-green' : row.beStat === '미설정' ? 'badge-red' : 'badge-gray',
      },
      {
        key: 'feStat',
        label: 'FE 설정',
        width: '80px',
        align: 'center',
        badge: (row) => row.feStat === '설정됨' ? 'badge-green' : row.feStat === '미설정' ? 'badge-red' : 'badge-gray',
      },
      { key: '_test',      label: '테스트',     width: '90px',  align: 'center' },
      {
        key: 'testResult',
        label: '연동결과',
        width: '80px',
        align: 'center',
        badge: (row) => row.testResult === '성공' ? 'badge-green' : row.testResult === '실패' ? 'badge-red' : 'badge-gray',
      },
      { key: 'testMsg',    label: '테스트 결과' },
      { key: 'remark',     label: '비고' },
    ];

    /* ##### [03] 데이터 로드 ######################################################## */

    const rows = reactive([]);

    const _feKey = (name) => {
      if (!name) return null;
      return window.sfGetBoAppStore?.()?.svAppData?.[name] ?? null;
    };

    const _beCache = reactive({});

    const _statOf = (val) => (val ? '설정됨' : '미설정');

    const _META = [
      /* ── 소셜 로그인 ── */
      { category: '소셜로그인', channel: 'Google 로그인',  feKey: 'googleClientId',   beKey: 'oauth.google.client-id',    remark: 'OAuth2 클라이언트 ID',         testFn: 'google' },
      { category: '소셜로그인', channel: 'Kakao 로그인',   feKey: 'kakaoJsKey',        beKey: 'oauth.kakao.client-id',     remark: 'JavaScript 키',                testFn: 'kakao' },
      { category: '소셜로그인', channel: 'Naver 로그인',   feKey: 'naverClientId',     beKey: 'oauth.naver.client-id',     remark: '클라이언트 ID',                testFn: 'naver' },
      /* ── 결제 ── */
      { category: '결제',       channel: '토스페이먼츠',   feKey: 'tossClientKey',     beKey: 'toss.secret-key',           remark: 'FE:클라이언트키 / BE:시크릿키', testFn: 'toss' },
      /* ── 지도 ── */
      { category: '지도',       channel: 'Naver 지도',     feKey: 'naverMapClientId',  beKey: 'naver.map.client-id',       remark: 'NCP 클라이언트 ID',            testFn: 'naverMap' },
      { category: '지도',       channel: 'Google 지도',    feKey: 'googleMapKey',      beKey: 'google.map.api-key',        remark: 'Maps JavaScript API 키',       testFn: 'googleMap' },
      /* ── 메일 ── */
      { category: '메일',       channel: 'SMTP',           feKey: null,                beKey: 'mail.host',                 remark: 'SMTP 호스트',                  testFn: 'smtp' },
      /* ── SMS ── */
      { category: 'SMS',        channel: 'SMS 발송',       feKey: null,                beKey: 'sms.api-key',               remark: 'API 키',                       testFn: 'sms' },
      /* ── 푸시 ── */
      { category: '푸시',       channel: 'FCM',            feKey: 'fcmProjectId',      beKey: 'fcm.project-id',            remark: '프로젝트 ID',                  testFn: 'fcm' },
      { category: '푸시',       channel: 'APNs',           feKey: null,                beKey: 'apns.key-id',               remark: '키 ID',                        testFn: 'apns' },
      /* ── 카카오 ── */
      { category: '카카오',     channel: '알림톡',         feKey: null,                beKey: 'kakao.alimtalk.sender-key', remark: '발신 프로필 키',               testFn: 'kakaoAlim' },
      /* ── AI ── */
      { category: 'AI/챗봇',   channel: 'AI 챗봇',        feKey: null,                beKey: 'ai.chatbot.api-key',        remark: 'API 키',                       testFn: 'ai' },
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
          testResult: '-',
          testMsg:    '',
          remark:     m.remark,
          _testFn:    m.testFn,
          _testing:   false,
        });
      });
    };

    /* ##### [04] BE 설정 조회 ####################################################### */

    const _fetchBeSettings = async () => {
      try {
        const res = await boApi.get('/bo/sy/prop/list', {
          params: { pageSize: 999 },
          ...coUtil.apiHdr('연동설정대시보드', '설정조회'),
        });
        const list = res.data?.data?.pageList || res.data?.data || [];
        list.forEach((p) => { if (p.propKey) _beCache[p.propKey] = p.propValue || ''; });
      } catch (_) { /* BE 조회 실패 — beStat '-' 유지 */ }
    };

    /* ##### [05] 테스트 실행 ####################################################### */

    const _TEST_MAP = {
      google:    { url: '/bo/sy/zd/test/oauth/google',   label: 'Google OAuth' },
      kakao:     { url: '/bo/sy/zd/test/oauth/kakao',    label: 'Kakao OAuth' },
      naver:     { url: '/bo/sy/zd/test/oauth/naver',    label: 'Naver OAuth' },
      toss:      { url: '/bo/sy/zd/test/pay/toss',       label: '토스 결제키' },
      naverMap:  { url: '/bo/sy/zd/test/map/naver',      label: 'Naver 지도' },
      googleMap: { url: '/bo/sy/zd/test/map/google',     label: 'Google 지도' },
      smtp:      { url: '/bo/sy/zd/test/mail/smtp',      label: 'SMTP' },
      sms:       { url: '/bo/sy/zd/test/sms',            label: 'SMS' },
      fcm:       { url: '/bo/sy/zd/test/push/fcm',       label: 'FCM' },
      apns:      { url: '/bo/sy/zd/test/push/apns',      label: 'APNs' },
      kakaoAlim: { url: '/bo/sy/zd/test/kakao/alimtalk', label: '카카오 알림톡' },
      ai:        { url: '/bo/sy/zd/test/ai/chatbot',     label: 'AI 챗봇' },
    };

    const handleTest = async (row) => {
      if (row._testing) return;
      const meta = _TEST_MAP[row._testFn];
      if (!meta) { row.testResult = '실패'; row.testMsg = '테스트 미정의'; return; }
      row._testing = true; row.testResult = '-'; row.testMsg = '확인 중...';
      try {
        const res = await boApi.get(meta.url, coUtil.apiHdr('연동설정대시보드', meta.label + ' 테스트'));
        const ok = res.data?.success !== false;
        row.testResult = ok ? '성공' : '실패';
        row.testMsg    = res.data?.data?.message || res.data?.message || (ok ? '정상' : '오류');
      } catch (e) {
        row.testResult = '실패';
        row.testMsg    = e.response?.data?.message || e.message || '연결 실패';
      } finally {
        row._testing = false;
      }
    };

    /* ##### [06] 이벤트 핸들러 ##################################################### */

    const handleGridCellAction = ({ colKey, row }) => {
      if (colKey === '_test') handleTest(row);
    };

    const handleRefresh = async () => {
      loading.value = true;
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
    });

    /* ##### [08] 리턴 ############################################################## */

    return {
      codes, loading,
      baseGridColumns, rows,
      handleTest, handleRefresh, handleTestAll, handleGridCellAction,
    };
  },

  template: `
<div>
  <div class="page-title">연동설정 대시보드</div>

  <bo-page desc="외부 서비스 연동 키 설정 현황 및 테스트. 테스트 버튼 클릭 시 백엔드 API를 통해 실제 연결을 확인합니다.">
    <bo-container>
      <div class="toolbar">
        <span class="list-title">연동 채널 목록</span>
        <span class="list-count">{{ rows.length }}건</span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button class="btn btn_reset" @click="handleRefresh">새로고침</button>
          <button class="btn btn_search" @click="handleTestAll">전체 테스트</button>
        </div>
      </div>
      <bo-grid
        :columns="baseGridColumns"
        :rows="rows"
        :loading="loading"
        empty-text="연동 설정 항목이 없습니다."
        @cell-click="handleGridCellAction"
      >
        <template #cell-_test="{ row }">
          <button class="btn btn-xs"
            :disabled="row._testing"
            :style="row._testing ? 'opacity:.5' : ''"
            @click.stop="handleTest(row)">
            {{ row._testing ? '확인중…' : '테스트' }}
          </button>
        </template>
      </bo-grid>
    </bo-container>
  </bo-page>
</div>
`,
};
