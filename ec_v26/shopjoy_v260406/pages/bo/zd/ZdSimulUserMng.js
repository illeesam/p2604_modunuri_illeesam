/* ZdSimulUserMng — 관리자 사용자 시뮬레이터 */
(function () {
  const { reactive } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  /* ── 도메인 상수 ──────────────────────────────────────────── */
  const LAST_NAMES  = '김이박최정강조윤장임한오서신권황안송류전'.split('');
  const FIRST_NAMES = ['민준','서연','도윤','지우','시우','준서','수아','지민','채원','윤서','가은','나연','수빈','예린','민서'];
  const DOMAINS     = ['company.com','shopjoy.com','gmail.com','naver.com','kakao.com'];
  const DEPTS       = ['운영팀', '마케팅팀', '개발팀', '고객지원팀', '영업팀', '기획팀'];
  const STATUSES    = [
    { cd: 'ACTIVE',    label: '정상'   },
    { cd: 'INACTIVE',  label: '비활성' },
    { cd: 'SUSPENDED', label: '정지'   },
  ];
  const UPDATE_TYPES = [
    { value: 'status', label: '상태 변경' },
    { value: 'phone',  label: '전화번호 갱신' },
    { value: 'memo',   label: '메모 업데이트' },
  ];

  window.ZdSimulUserMng = {
    name: 'ZdSimulUserMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────────── */
      const domCfg = reactive({
        loginPwd:    '1111',
        emailDomain: '__weighted__',
        domainWeights: { 'company.com': 40, 'shopjoy.com': 30, 'gmail.com': 15, 'naver.com': 10, 'kakao.com': 5 },
        statusOnCreate: 'ACTIVE',
        updateType:   'status',
        fixedUserId:  '',
        fixedUserNm:  '',
      });

      /* ── [02] 공통 엔진 연결 ────────────────────────────── */
      const _pickDomain = (randInt, pick) => {
        if (domCfg.emailDomain !== '__weighted__' && domCfg.emailDomain) return domCfg.emailDomain;
        const w = domCfg.domainWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const d of DOMAINS) { r -= Number(w[d] || 0); if (r <= 0) return d; }
        return DOMAINS[0];
      };

      const simul = useSimulSetup({
        domain: '사용자',
        uiNm: '사용자 시뮬레이터',
        label: '시뮬사용자',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, simulYn, suffix, randInt, pick }) => {
          if (mode === 'create') {
            const seq     = String(Date.now()).slice(-5);
            const ln      = pick(LAST_NAMES);
            const fn      = pick(FIRST_NAMES);
            const nm      = (namePrefix || '시뮬') + ln + fn;
            const loginId = 'simuser_' + seq;
            const email   = loginId + '@' + _pickDomain(randInt, pick);
            const phone   = '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999));
            const dept    = pick(DEPTS);
            const body    = {
              loginId, userNm: nm, userEmail: email, userPhone: phone,
              userStatusCd: domCfg.statusOnCreate,
              loginPwd: domCfg.loginPwd || '1111',
            };
            const res = await boApi.post('/bo/zd/simul/user/create', body, coUtil.cofApiHdr('사용자시뮬', '생성'));
            const id  = res?.data?.data?.userId || loginId;
            return { ok: true, desc: nm + ' / ' + email + ' / ' + dept, meta: { id, params: body } };
          } else {
            let target;
            if (domCfg.fixedUserId) {
              target = { userId: domCfg.fixedUserId, userNm: domCfg.fixedUserNm };
            } else {
              const res = await boApi.get('/bo/sy/user/page', { params: { pageNo: 1, pageSize: 50, userStatusCd: 'ACTIVE' } });
              const list = res?.data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 ACTIVE 사용자 없음' };
              target = pick(list);
            }
            let body = {}, descPart = '';
            if (domCfg.updateType === 'status') {
              const s = pick(STATUSES); body.userStatusCd = s.cd; descPart = '상태→' + s.label;
            } else if (domCfg.updateType === 'phone') {
              body.userPhone = '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999));
              descPart = '전화번호 변경';
            } else {
              body.userMemo = '[시뮬수정] ' + new Date().toLocaleTimeString('ko-KR');
              descPart = '메모 업데이트';
            }
            const updateBody = { userId: target.userId, ...body };
            await boApi.post('/bo/zd/simul/user/update', updateBody, coUtil.cofApiHdr('사용자시뮬', '수정'));
            return { ok: true, desc: (target.userNm || target.userId) + ' ' + descPart, meta: { id: target.userId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'statusOnCreate', label: '초기 상태', type: 'select',
          options: STATUSES.map(s => ({ value: s.cd, label: s.label })) },
        { key: 'loginPwd', label: '초기 비밀번호', type: 'text', placeholder: '기본: 1111', mono: true },
        { key: 'emailDomain', label: '이메일 도메인', type: 'select',
          options: [{ value: '__weighted__', label: '가중치 랜덤' }, ...DOMAINS.map(d => ({ value: d, label: d }))] },
      ];
      const updateCfgColumns = [
        { key: 'updateType', label: '수정 유형', type: 'select', options: UPDATE_TYPES },
      ];

      /* 도메인 가중치 합계 */
      const cfDomainTotal = Vue.computed(() => Object.values(domCfg.domainWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* 수정 대상 picker */
      const userPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const _loadUserPicker = async () => {
        userPicker.loading = true;
        try {
          const res = await boApi.get('/bo/sy/user/page', { params: { pageNo: 1, pageSize: 20,
            ...(userPicker.searchValue ? { searchValue: userPicker.searchValue } : {}) } });
          userPicker.rows = res?.data?.data?.pageList || [];
        } catch (_) { userPicker.rows = []; }
        userPicker.loading = false;
      };
      const onOpenUserPicker = async () => { userPicker.show = true; userPicker.searchValue = ''; await _loadUserPicker(); };
      const onSelectUser = (row) => { domCfg.fixedUserId = row.userId; domCfg.fixedUserNm = row.userNm || row.loginId || row.userId; userPicker.show = false; };

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns, cfDomainTotal,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        STATUSES, DOMAINS, UPDATE_TYPES,
        userPicker, onOpenUserPicker, onSelectUser, _loadUserPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🧑‍💼 사용자 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#0284c7,#38bdf8)"
    accent-active="background:#e0f2fe;border:1.5px solid #0284c7;color:#0369a1;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🧑‍💼 사용자 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <!-- 이메일 도메인 가중치 (가중치 랜덤 선택 시) -->
    <div v-if="domCfg.emailDomain==='__weighted__'" style="margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:10px;">📧 이메일 도메인 가중치</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="d in DOMAINS" :key="d" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:82px;white-space:nowrap;">{{ d }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.domainWeights[d]" style="flex:1;accent-color:#0284c7;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.domainWeights[d]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.domainWeights[d]/cfDomainTotal*100) }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">🎯 수정 대상 사용자 지정</div>
      <div style="display:flex;gap:6px;align-items:center;max-width:400px;">
        <input type="text" :value="domCfg.fixedUserNm || domCfg.fixedUserId || ''" readonly
          placeholder="랜덤 (ACTIVE 사용자 50명 중)"
          style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
          @click="onOpenUserPicker" />
        <button v-if="domCfg.fixedUserId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
          @click="domCfg.fixedUserId='';domCfg.fixedUserNm=''">✕</button>
        <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenUserPicker">선택</button>
      </div>
      <div v-if="domCfg.fixedUserId" style="font-size:10px;color:#0284c7;margin-top:3px;font-family:monospace;">{{ domCfg.fixedUserId }}</div>
      <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">💡 미지정 시 ACTIVE 사용자 중 랜덤 선택</div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 사용자 picker 모달 -->
  <bo-modal :show="userPicker.show" title="수정할 사용자 선택" @close="userPicker.show=false" box-width="560px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="userPicker.searchValue" placeholder="이름 / 이메일 / 로그인ID 검색" @keyup.enter="_loadUserPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadUserPicker">조회</button>
      </div>
      <div v-if="userPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>이름</th>
          <th>로그인ID</th>
          <th>이메일</th>
          <th>상태</th>
          <th style="width:50px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!userPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in userPicker.rows" :key="r.userId" style="cursor:pointer;" @click="onSelectUser(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td>{{ r.userNm }}</td>
            <td style="font-family:monospace;font-size:11px;">{{ r.loginId }}</td>
            <td style="font-size:11px;color:#64748b;">{{ r.userEmail }}</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.userStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();
