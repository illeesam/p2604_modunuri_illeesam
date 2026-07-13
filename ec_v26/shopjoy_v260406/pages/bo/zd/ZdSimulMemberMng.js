/* ZdSimulMemberMng — 회원 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { ref, reactive, computed, onMounted } = Vue;

  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, logPanelHtml, statCardHtml } = window.ZdSimulBase;

  /* ── 도메인 상수 ───────────────────────────────────────── */
  const LAST_NAMES  = '김이박최정강조윤장임한오서신권황안송류전홍'.split('');
  const FIRST_NAMES = ['민준','서연','도윤','서아','시우','지우','지호','하은','은서','준서','수아','지민','채원','윤서','지유','연우','가은','나연','수빈','예린'];
  const DOMAINS     = ['gmail.com','naver.com','kakao.com','daum.net','hotmail.com','yahoo.com','icloud.com','outlook.com'];
  const GRADES      = [
    { cd: 'BASIC',   label: '일반',   badge: 'badge-gray',   color: '#94a3b8' },
    { cd: 'SILVER',  label: '실버',   badge: 'badge-blue',   color: '#3b82f6' },
    { cd: 'GOLD',    label: '골드',   badge: 'badge-orange', color: '#f59e0b' },
    { cd: 'VIP',     label: 'VIP',    badge: 'badge-purple', color: '#a855f7' },
  ];
  const GENDERS     = [{ cd: 'M', label: '남성', color: '#60a5fa' }, { cd: 'F', label: '여성', color: '#f472b6' }];
  const COUNTRIES   = [
    { cd: 'KR', label: '한국',   icon: '🇰🇷', color: '#3b82f6' },
    { cd: 'CN', label: '중국',   icon: '🇨🇳', color: '#ef4444' },
    { cd: 'JP', label: '일본',   icon: '🇯🇵', color: '#f97316' },
    { cd: 'US', label: '영어권', icon: '🇺🇸', color: '#8b5cf6' },
    { cd: 'FR', label: '프랑스', icon: '🇫🇷', color: '#06b6d4' },
    { cd: 'IN', label: '인도',   icon: '🇮🇳', color: '#f59e0b' },
  ];
  const AGE_GROUPS  = [
    { cd: '10', label: '10대', color: '#f472b6' },
    { cd: '20', label: '20대', color: '#a78bfa' },
    { cd: '30', label: '30대', color: '#60a5fa' },
    { cd: '40', label: '40대', color: '#34d399' },
    { cd: '50', label: '50대', color: '#fbbf24' },
    { cd: '60', label: '60대+', color: '#94a3b8' },
  ];
  const CHANNELS    = [
    { cd: 'SEARCH',   label: '검색유입', icon: '🔍', color: '#3b82f6' },
    { cd: 'SNS',      label: 'SNS광고',  icon: '📱', color: '#a855f7' },
    { cd: 'REFERRAL', label: '추천인',   icon: '👥', color: '#22c55e' },
    { cd: 'DIRECT',   label: '직접접속', icon: '🌐', color: '#f59e0b' },
    { cd: 'EMAIL',    label: '이메일',   icon: '📧', color: '#06b6d4' },
    { cd: 'APP',      label: '앱설치',   icon: '📲', color: '#f97316' },
  ];
  const BUY_TYPES   = [
    { cd: 'IMPULSIVE', label: '충동구매형',   icon: '⚡', color: '#ef4444' },
    { cd: 'COMPARE',   label: '비교탐색형',   icon: '🔎', color: '#3b82f6' },
    { cd: 'LOYAL',     label: '단골재구매형', icon: '❤️', color: '#a855f7' },
    { cd: 'PRICE',     label: '가격민감형',   icon: '💰', color: '#22c55e' },
    { cd: 'PREMIUM',   label: '프리미엄선호', icon: '👑', color: '#f59e0b' },
  ];
  const SNS_TYPES = [
    { cd: 'NONE',    label: '일반가입',   color: '#94a3b8', icon: '📧' },
    { cd: 'GOOGLE',  label: 'Google',     color: '#ef4444', icon: '🔴' },
    { cd: 'KAKAO',   label: 'Kakao',      color: '#f59e0b', icon: '🟡' },
    { cd: 'NAVER',   label: 'Naver',      color: '#22c55e', icon: '🟢' },
  ];
  const EMP_TYPES = [
    { cd: 'NONE',  label: '일반고객',  color: '#94a3b8' },
    { cd: 'STAFF', label: '직원',      color: '#3b82f6' },
    { cd: 'PARTNER', label: '협력직원', color: '#a855f7' },
  ];
  const STATUSES_UPD = [
    { cd: 'ACTIVE',    label: '정상'   },
    { cd: 'SUSPENDED', label: '정지'   },
    { cd: 'DORMANT',   label: '휴면'   },
  ];
  const UPDATE_TYPES = [
    { value: 'grade',  label: '등급 변경' },
    { value: 'status', label: '상태 변경' },
    { value: 'phone',  label: '전화번호 갱신' },
    { value: 'memo',   label: '메모 업데이트' },
  ];

  window.ZdSimulMemberMng = {
    name: 'ZdSimulMemberMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        fixedGrade: '__weighted__',
        gradeWeights: { BASIC: 50, SILVER: 25, GOLD: 15, VIP: 10 },
        fixedDomain: '__weighted__',
        domainWeights: { 'gmail.com': 35, 'naver.com': 30, 'kakao.com': 15, 'daum.net': 8, 'hotmail.com': 5, 'yahoo.com': 3, 'icloud.com': 2, 'outlook.com': 2 },
        /* 성별 가중치 */
        fixedGender: '__weighted__',
        genderWeights: { M: 48, F: 52 },
        /* 연령대 가중치 */
        fixedAgeGroup: '__weighted__',
        ageGroupWeights: { '10': 5, '20': 35, '30': 30, '40': 20, '50': 8, '60': 2 },
        /* 국가 가중치 */
        fixedCountry: '__weighted__',
        countryWeights: { KR: 70, CN: 10, JP: 8, US: 6, FR: 3, IN: 3 },
        /* 유입채널 가중치 */
        fixedChannel: '__weighted__',
        channelWeights: { SEARCH: 35, SNS: 25, REFERRAL: 15, DIRECT: 15, EMAIL: 5, APP: 5 },
        /* 구매성향 가중치 */
        fixedBuyType: '__weighted__',
        buyTypeWeights: { IMPULSIVE: 30, COMPARE: 25, LOYAL: 20, PRICE: 15, PREMIUM: 10 },
        fixedEmpType: '__weighted__',
        empTypeWeights: { NONE: 85, STAFF: 12, PARTNER: 3 },
        fixedSnsType: '__weighted__',
        snsTypeWeights: { NONE: 50, GOOGLE: 25, KAKAO: 15, NAVER: 10 },
        statusOnCreate: 'ACTIVE',
        loginPwd: '1111',
        randomGender: true,
        agentRangeMin: 20,
        agentRangeMax: 45,
        updateType: 'grade',
        emailVerified: true,
        snsLinkYn: false,
        memoOnCreate: false,
        /* 수정 모드 고정 대상 */
        fixedMemberId: '',
        fixedMemberNm: '',
      });

      /* ── [02] 공통 엔진 연결 ────────────────────────── */
      const _pickWeighted = (items, weights, keyFn) => {
        const total = Object.values(weights).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const item of items) {
          const key = keyFn ? keyFn(item) : (item.cd || item.value || item);
          r -= Number(weights[key] || 0);
          if (r <= 0) return item;
        }
        return items[0];
      };

      const _pickDomain = () => {
        if (domCfg.fixedDomain && domCfg.fixedDomain !== '__weighted__') return domCfg.fixedDomain;
        return _pickWeighted(DOMAINS, domCfg.domainWeights, d => d);
      };
      const _pickGrade = () => {
        if (domCfg.fixedGrade && domCfg.fixedGrade !== '__weighted__')
          return GRADES.find(g => g.cd === domCfg.fixedGrade) || GRADES[0];
        return _pickWeighted(GRADES, domCfg.gradeWeights);
      };
      const _pickGender = () => {
        if (domCfg.fixedGender && domCfg.fixedGender !== '__weighted__') return domCfg.fixedGender;
        return _pickWeighted(GENDERS, domCfg.genderWeights).cd;
      };
      const _pickAgeGroup = () => {
        if (domCfg.fixedAgeGroup && domCfg.fixedAgeGroup !== '__weighted__') return domCfg.fixedAgeGroup;
        return _pickWeighted(AGE_GROUPS, domCfg.ageGroupWeights).cd;
      };
      const _pickCountry = () => {
        if (domCfg.fixedCountry && domCfg.fixedCountry !== '__weighted__') return domCfg.fixedCountry;
        return _pickWeighted(COUNTRIES, domCfg.countryWeights).cd;
      };
      const _pickChannel = () => {
        if (domCfg.fixedChannel && domCfg.fixedChannel !== '__weighted__') return domCfg.fixedChannel;
        return _pickWeighted(CHANNELS, domCfg.channelWeights).cd;
      };
      const _pickBuyType = () => {
        if (domCfg.fixedBuyType && domCfg.fixedBuyType !== '__weighted__') return domCfg.fixedBuyType;
        return _pickWeighted(BUY_TYPES, domCfg.buyTypeWeights).cd;
      };
      const _pickEmpType = () => {
        if (domCfg.fixedEmpType && domCfg.fixedEmpType !== '__weighted__') return domCfg.fixedEmpType;
        return _pickWeighted(EMP_TYPES, domCfg.empTypeWeights).cd;
      };
      const _pickSnsType = () => {
        if (domCfg.fixedSnsType && domCfg.fixedSnsType !== '__weighted__') return domCfg.fixedSnsType;
        return _pickWeighted(SNS_TYPES, domCfg.snsTypeWeights).cd;
      };
      /* 연령대 cd → 실제 나이 */
      const _ageFromGroup = (grpCd) => {
        const base = parseInt(grpCd, 10);
        const min = base, max = base === 60 ? 75 : base + 9;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const _randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

      const simul = useSimulSetup({
        domain: '회원',
        uiNm: '회원 시뮬레이터',
        label: '시뮬회원',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, simulYn, suffix, randInt, pick }) => {
          const ln = pick(LAST_NAMES);
          const fn = pick(FIRST_NAMES);
          if (mode === 'create') {
            const seq      = String(Date.now()).slice(-5);
            const loginId  = 'sim_' + seq;
            const grade    = _pickGrade();
            const gender   = _pickGender();
            const ageGrp   = _pickAgeGroup();
            const age      = _ageFromGroup(ageGrp);
            const country  = _pickCountry();
            const channel  = _pickChannel();
            const buyType  = _pickBuyType();
            const empType  = _pickEmpType();
            const snsType  = _pickSnsType();
            const email    = loginId + '@' + _pickDomain();
            const phone    = '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999));
            const nm       = (namePrefix || '시뮬') + ln + fn;
            const empLabel = EMP_TYPES.find(e => e.cd === empType)?.label || empType;
            const snsLabel = SNS_TYPES.find(s => s.cd === snsType)?.label || snsType;
            const memoArr  = ['나이:' + age + '세', '등급:' + grade.label, '국가:' + country, '채널:' + channel, '성향:' + buyType, '직원:' + empLabel, 'SNS:' + snsLabel];
            const body     = {
              memberNm: nm, loginId, loginPwd: domCfg.loginPwd || '1111',
              memberEmail: email, memberPhone: phone, memberGender: gender,
              gradeCd: grade.cd, memberStatusCd: domCfg.statusOnCreate,
              emailVerifiedYn: domCfg.emailVerified ? 'Y' : 'N',
              snsLinkYn: snsType !== 'NONE' ? 'Y' : (domCfg.snsLinkYn ? 'Y' : 'N'),
              snsProvider: snsType !== 'NONE' ? snsType.toLowerCase() : null,
              empTypeCd: empType,
              memberMemo: domCfg.memoOnCreate ? '[시뮬] ' + memoArr.join(' / ') : '',
              siteId: memberDefaults.value.siteId || null,
              memberGradeId: memberDefaults.value.memberGradeId || null,
              simulYn: simulYn || 'Y',
            };
            const res = await boApi.post('/bo/zd/simul/member/create', body, coUtil.cofApiHdr('회원시뮬', '생성'));
            const id  = res?.data?.data?.memberId || loginId;
            const genderLabel = gender === 'M' ? '남' : '여';
            return { ok: true, desc: '[' + grade.label + '/' + genderLabel + '/' + age + '세] ' + nm + ' / ' + email, meta: { id, grade: grade.label, params: body } };
          } else {
            let target;
            if (domCfg.fixedMemberId) {
              target = { memberId: domCfg.fixedMemberId, memberNm: domCfg.fixedMemberNm };
            } else {
              const list = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 ACTIVE 회원 없음' };
              target = pick(list);
            }
            const type   = domCfg.updateType;
            let body = {}, desc = '';
            if (type === 'grade') {
              const g = _pickGrade(); body.gradeCd = g.cd; desc = '등급→' + g.label;
            } else if (type === 'status') {
              const s = _pick(STATUSES_UPD); body.memberStatusCd = s.cd; desc = '상태→' + s.label;
            } else if (type === 'phone') {
              body.memberPhone = '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999));
              desc = '전화번호 변경';
            } else {
              body.memberMemo = '[시뮬수정] ' + new Date().toLocaleTimeString('ko-KR');
              desc = '메모 업데이트';
            }
            const updateBody = { memberId: target.memberId, ...body };
            await boApi.post('/bo/zd/simul/member/update', updateBody, coUtil.cofApiHdr('회원시뮬', '수정'));
            return { ok: true, desc: target.memberNm + ' ' + desc, meta: { id: target.memberId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── picker 모달 ──────────────────────────────── */
      const memberPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });

      const _loadMemberPicker = async () => {
        memberPicker.loading = true;
        try {
          const res = await boApiSvc.mbMember.getPage({
            pageNo: 1, pageSize: 20, memberStatusCd: 'ACTIVE',
            ...(memberPicker.searchValue ? { searchValue: memberPicker.searchValue, searchType: 'memberId,memberNm,loginId' } : {}),
          });
          memberPicker.rows = res.data?.data?.pageList || [];
        } catch (_) { memberPicker.rows = []; }
        memberPicker.loading = false;
      };
      const onOpenMemberPicker = async () => {
        memberPicker.show = true;
        memberPicker.searchValue = '';
        await _loadMemberPicker();
      };
      const onSelectMember = (row) => {
        domCfg.fixedMemberId = row.memberId;
        const nm = row.memberNm || row.loginId || row.memberId;
        domCfg.fixedMemberNm = window.ZdSimulBase?._sanitize ? window.ZdSimulBase._sanitize(nm) : nm;
        memberPicker.show = false;
      };

      /* ── [03] Defaults from ZdSimulController ──────── */
      const memberDefaults = ref({ siteId: '', memberGradeId: '', gradeNm: '' });
      onMounted(async () => {
        try {
          const r = await boApi.post('/bo/zd/simul/member/defaults', {}, coUtil.cofApiHdr('회원시뮬', 'defaults'));
          if (r?.data?.data) Object.assign(memberDefaults.value, r.data.data);
        } catch (e) { /* defaults 실패 시 무시 */ }
      });

      /* ── [04] Computed ──────────────────────────────── */
      const cfGradeTotal    = computed(() => Object.values(domCfg.gradeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfDomainTotal   = computed(() => Object.values(domCfg.domainWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfGenderTotal   = computed(() => Object.values(domCfg.genderWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfAgeGroupTotal = computed(() => Object.values(domCfg.ageGroupWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfCountryTotal  = computed(() => Object.values(domCfg.countryWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfChannelTotal  = computed(() => Object.values(domCfg.channelWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfBuyTypeTotal  = computed(() => Object.values(domCfg.buyTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfEmpTypeTotal  = computed(() => Object.values(domCfg.empTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);
      const cfSnsTypeTotal  = computed(() => Object.values(domCfg.snsTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [05] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'statusOnCreate', label: '초기 상태', type: 'select',
          options: [{ value: 'ACTIVE', label: '정상' }, { value: 'DORMANT', label: '휴면' }] },
        { key: 'loginPwd',       label: '비밀번호',          type: 'text', placeholder: 'bypass 비밀번호 (기본: 1111)', mono: true },
        { key: 'emailVerified', label: '이메일 인증 완료', type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        { key: 'snsLinkYn',     label: 'SNS 연동 표시',    type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
        { key: 'memoOnCreate',  label: '메모 자동 생성',   type: 'select',
          options: [{ value: true, label: '예' }, { value: false, label: '아니오' }] },
      ];
      const updateCfgColumns = [
        { key: 'updateType', label: '수정 유형', type: 'select', options: UPDATE_TYPES },
      ];

      /* ── [05] 반환 ──────────────────────────────────── */
      const onAgeMinChange = () => { if (domCfg.agentRangeMin >= domCfg.agentRangeMax) domCfg.agentRangeMin = domCfg.agentRangeMax - 1; };
      const onAgeMaxChange = () => { if (domCfg.agentRangeMax <= domCfg.agentRangeMin) domCfg.agentRangeMax = domCfg.agentRangeMin + 1; };

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        memberDefaults, cfGradeTotal, cfDomainTotal, cfGenderTotal, cfAgeGroupTotal, cfCountryTotal, cfChannelTotal, cfBuyTypeTotal, cfEmpTypeTotal, cfSnsTypeTotal,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onPreview, onPreviewCreate, onClearLog, onSetLogPage, onSearchLog, logSearch,
        onAgeMinChange, onAgeMaxChange,
        GRADES, DOMAINS, GENDERS, AGE_GROUPS, COUNTRIES, CHANNELS, BUY_TYPES, EMP_TYPES, SNS_TYPES, STATUSES_UPD, UPDATE_TYPES,
        /* picker */
        memberPicker, onOpenMemberPicker, onSelectMember, _loadMemberPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">👥 회원 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#7c3aed,#a855f7)"
    accent-active="background:#ede9fe;border:1.5px solid #7c3aed;color:#6d28d9;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" @preview="onPreview" @preview-create="onPreviewCreate" />

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">👤 회원 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 가중치 카드 행 (행1: 등급 / 이메일도메인 / 성별) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 등급 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 등급 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedGrade" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="g in GRADES" :key="g.cd" :value="g.cd">{{ g.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedGrade === '__weighted__'">
        <div v-for="g in GRADES" :key="g.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+g.color+';flex-shrink:0;display:inline-block;'"></span>
          <span :class="'badge '+g.badge" style="min-width:38px;text-align:center;font-size:11px;">{{ g.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.gradeWeights[g.cd]" :style="'flex:1;accent-color:'+g.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.gradeWeights[g.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.gradeWeights[g.cd]/cfGradeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="g in GRADES" :key="g.cd" :style="'flex:'+domCfg.gradeWeights[g.cd]+';transition:flex .2s;background:'+g.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 이메일 도메인 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📧 이메일 도메인 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedDomain" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="">-- 없음 --</option>
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="d in DOMAINS" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedDomain === '__weighted__'">
        <div v-for="(d, di) in DOMAINS" :key="d" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:hsl('+(di*37)+',65%,55%);flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:10px;color:#475569;min-width:78px;white-space:nowrap;">{{ d }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.domainWeights[d]" :style="'flex:1;accent-color:hsl('+(di*37)+',65%,55%);'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.domainWeights[d]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.domainWeights[d]/cfDomainTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="d in DOMAINS" :key="d" :style="'flex:'+domCfg.domainWeights[d]+';transition:flex .2s;background:hsl('+(DOMAINS.indexOf(d)*37)+',65%,55%);'"></div>
        </div>
      </div>
    </div>
    <!-- 성별 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">⚧ 성별 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedGender" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="g in GENDERS" :key="g.cd" :value="g.cd">{{ g.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedGender === '__weighted__'">
        <div v-for="g in GENDERS" :key="g.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+g.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:12px;min-width:20px;">{{ g.cd === 'M' ? '♂' : '♀' }}</span>
          <span style="font-size:11px;color:#475569;min-width:24px;">{{ g.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.genderWeights[g.cd]" :style="'flex:1;accent-color:'+g.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.genderWeights[g.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.genderWeights[g.cd]/cfGenderTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div :style="'flex:'+domCfg.genderWeights.M+';transition:flex .2s;background:#60a5fa;'"></div>
          <div :style="'flex:'+domCfg.genderWeights.F+';transition:flex .2s;background:#f472b6;'"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 가중치 카드 행2: 연령대 / 국가 / 유입채널 -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 연령대 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🎂 연령대 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedAgeGroup" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="a in AGE_GROUPS" :key="a.cd" :value="a.cd">{{ a.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedAgeGroup === '__weighted__'">
        <div v-for="a in AGE_GROUPS" :key="a.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+a.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#475569;min-width:28px;">{{ a.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.ageGroupWeights[a.cd]" :style="'flex:1;accent-color:'+a.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.ageGroupWeights[a.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.ageGroupWeights[a.cd]/cfAgeGroupTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="a in AGE_GROUPS" :key="a.cd" :style="'flex:'+domCfg.ageGroupWeights[a.cd]+';transition:flex .2s;background:'+a.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 국가 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🌏 국가 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedCountry" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="c in COUNTRIES" :key="c.cd" :value="c.cd">{{ c.icon }} {{ c.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedCountry === '__weighted__'">
        <div v-for="c in COUNTRIES" :key="c.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:12px;min-width:18px;">{{ c.icon }}</span>
          <span style="font-size:11px;color:#475569;min-width:38px;">{{ c.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.countryWeights[c.cd]" :style="'flex:1;accent-color:'+c.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.countryWeights[c.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.countryWeights[c.cd]/cfCountryTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="c in COUNTRIES" :key="c.cd" :style="'flex:'+domCfg.countryWeights[c.cd]+';transition:flex .2s;background:'+c.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 유입채널 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📡 유입채널 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedChannel" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="ch in CHANNELS" :key="ch.cd" :value="ch.cd">{{ ch.icon }} {{ ch.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedChannel === '__weighted__'">
        <div v-for="ch in CHANNELS" :key="ch.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:12px;min-width:16px;">{{ ch.icon }}</span>
          <span style="font-size:10px;color:#475569;min-width:44px;white-space:nowrap;">{{ ch.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.channelWeights[ch.cd]" :style="'flex:1;accent-color:'+ch.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.channelWeights[ch.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.channelWeights[ch.cd]/cfChannelTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="ch in CHANNELS" :key="ch.cd" :style="'flex:'+domCfg.channelWeights[ch.cd]+';transition:flex .2s;background:'+ch.color+';'"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 가중치 카드 행3: 구매성향 / 직원여부 / SNS가입 -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <!-- 구매성향 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🛒 구매성향 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedBuyType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="b in BUY_TYPES" :key="b.cd" :value="b.cd">{{ b.icon }} {{ b.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedBuyType === '__weighted__'">
        <div v-for="b in BUY_TYPES" :key="b.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:12px;min-width:18px;">{{ b.icon }}</span>
          <span style="font-size:10px;color:#475569;min-width:60px;white-space:nowrap;">{{ b.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.buyTypeWeights[b.cd]" :style="'flex:1;accent-color:'+b.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.buyTypeWeights[b.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.buyTypeWeights[b.cd]/cfBuyTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="b in BUY_TYPES" :key="b.cd" :style="'flex:'+domCfg.buyTypeWeights[b.cd]+';transition:flex .2s;background:'+b.color+';'"></div>
        </div>
      </div>
    </div>
    <!-- 직원여부 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🏢 직원여부 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedEmpType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="e in EMP_TYPES" :key="e.cd" :value="e.cd">{{ e.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedEmpType === '__weighted__'">
        <div v-for="e in EMP_TYPES" :key="e.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+e.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#475569;min-width:56px;white-space:nowrap;">{{ e.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.empTypeWeights[e.cd]" :style="'flex:1;accent-color:'+e.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.empTypeWeights[e.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.empTypeWeights[e.cd]/cfEmpTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="e in EMP_TYPES" :key="e.cd" :style="'flex:'+domCfg.empTypeWeights[e.cd]+';transition:flex .2s;background:'+e.color+';'"></div>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px;">💡 직원 전용 쿠폰/할인 마케팅 시나리오에 활용</div>
      </div>
    </div>
    <!-- SNS 가입 가중치 -->
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🔗 SNS 가입 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedSnsType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="s in SNS_TYPES" :key="s.cd" :value="s.cd">{{ s.icon }} {{ s.label }}</option>
        </select>
      </div>
      <div v-show="domCfg.fixedSnsType === '__weighted__'">
        <div v-for="s in SNS_TYPES" :key="s.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:12px;min-width:16px;">{{ s.icon }}</span>
          <span style="font-size:11px;color:#475569;min-width:48px;white-space:nowrap;">{{ s.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.snsTypeWeights[s.cd]" :style="'flex:1;accent-color:'+s.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.snsTypeWeights[s.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.snsTypeWeights[s.cd]/cfSnsTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="s in SNS_TYPES" :key="s.cd" :style="'flex:'+domCfg.snsTypeWeights[s.cd]+';transition:flex .2s;background:'+s.color+';'"></div>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px;">💡 NONE 이외 선택 시 snsLinkYn=Y 자동 설정</div>
      </div>
    </div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <!-- 수정 대상 회원 지정 -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">🎯 수정 대상 회원 지정</div>
      <div style="display:flex;gap:6px;align-items:center;max-width:400px;">
        <input type="text" :value="domCfg.fixedMemberNm || domCfg.fixedMemberId || ''" readonly
          placeholder="랜덤 (ACTIVE 회원 50명 중)"
          style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
          @click="onOpenMemberPicker" />
        <button v-if="domCfg.fixedMemberId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
          @click="domCfg.fixedMemberId='';domCfg.fixedMemberNm=''">✕</button>
        <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenMemberPicker">선택</button>
      </div>
      <div v-if="domCfg.fixedMemberId" style="font-size:10px;color:#6366f1;margin-top:3px;font-family:monospace;">{{ domCfg.fixedMemberId }}</div>
      <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">💡 미지정 시 ACTIVE 상태 회원 50명 중 랜덤 선택</div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch" @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 회원 picker 모달 (수정 모드) -->
  <bo-modal :show="memberPicker.show" title="수정할 회원 선택" @close="memberPicker.show=false" box-width="600px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="memberPicker.searchValue" placeholder="이름 / 이메일 / ID 검색" @keyup.enter="_loadMemberPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadMemberPicker">조회</button>
      </div>
      <div v-if="memberPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>ID</th>
          <th>이름</th>
          <th>이메일</th>
          <th>상태</th>
          <th style="width:60px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!memberPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in memberPicker.rows" :key="r.memberId" style="cursor:pointer;" @click="onSelectMember(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.memberId }}</td>
            <td>{{ r.memberNm }}</td>
            <td style="font-size:11px;color:#64748b;">{{ r.loginId }}</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.memberStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>

</div>`,
  };
})();
