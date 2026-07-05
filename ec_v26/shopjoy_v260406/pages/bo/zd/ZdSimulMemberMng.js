/* ZdSimulMemberMng — 회원 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { ref, reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, logPanelHtml, statCardHtml } = window.ZdSimulBase;

  /* ── 도메인 상수 ───────────────────────────────────────── */
  const LAST_NAMES  = '김이박최정강조윤장임한오서신권황안송류전홍'.split('');
  const FIRST_NAMES = ['민준','서연','도윤','서아','시우','지우','지호','하은','은서','준서','수아','지민','채원','윤서','지유','연우','가은','나연','수빈','예린'];
  const DOMAINS     = ['gmail.com','naver.com','kakao.com','daum.net','hotmail.com','yahoo.com','icloud.com','outlook.com'];
  const GRADES      = [
    { cd: 'BASIC',   label: '일반',   badge: 'badge-gray'   },
    { cd: 'SILVER',  label: '실버',   badge: 'badge-blue'   },
    { cd: 'GOLD',    label: '골드',   badge: 'badge-orange' },
    { cd: 'VIP',     label: 'VIP',    badge: 'badge-purple' },
  ];
  const GENDERS     = [{ cd: 'M', label: '남성' }, { cd: 'F', label: '여성' }];
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
        gradeWeights: { BASIC: 50, SILVER: 25, GOLD: 15, VIP: 10 },
        statusOnCreate: 'ACTIVE',
        randomGender: true,
        agentRangeMin: 20,
        agentRangeMax: 45,
        updateType: 'grade',
        emailVerified: true,
        snsLinkYn: false,
        memoOnCreate: false,
      });

      /* ── [02] 공통 엔진 연결 ────────────────────────── */
      const _pickGrade = () => {
        const w = domCfg.gradeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const g of GRADES) { r -= Number(w[g.cd] || 0); if (r <= 0) return g; }
        return GRADES[0];
      };
      const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const _randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

      const simul = useSimulSetup({
        domain: '회원',
        label: '시뮬회원',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 3, intervalVal: 8, intervalUnit: 'sec', durationMin: 3 },
        runFn: async ({ mode, namePrefix, suffix, randInt, pick }) => {
          const ln = pick(LAST_NAMES);
          const fn = pick(FIRST_NAMES);
          if (mode === 'create') {
            const seq     = String(Date.now()).slice(-5);
            const loginId = 'sim_' + seq;
            const grade   = _pickGrade();
            const gender  = domCfg.randomGender ? _pick(GENDERS).cd : 'M';
            const age     = _randInt(domCfg.agentRangeMin, domCfg.agentRangeMax);
            const email   = loginId + '@' + pick(DOMAINS);
            const phone   = '010-' + String(randInt(1000, 9999)) + '-' + String(randInt(1000, 9999));
            const nm      = (namePrefix || '시뮬') + ln + fn;
            const body    = {
              memberNm: nm, loginId, loginPwd: 'Simul1234!',
              memberEmail: email, memberPhone: phone, memberGender: gender,
              gradeCd: grade.cd, memberStatusCd: domCfg.statusOnCreate,
              emailVerifiedYn: domCfg.emailVerified ? 'Y' : 'N',
              snsLinkYn: domCfg.snsLinkYn ? 'Y' : 'N',
              memberMemo: domCfg.memoOnCreate ? '[시뮬] 나이:' + age + '세 등급:' + grade.label : '',
            };
            const res = await boApi.post('/bo/ec/mb/member/save/base', body, coUtil.apiHdr('회원시뮬', '생성'));
            const id  = res?.data?.data?.memberId || res?.data?.data?.id || loginId;
            return { ok: true, desc: '[' + grade.label + '] ' + nm + ' / ' + email, meta: { id, grade: grade.label } };
          } else {
            const list = (await boApiSvc.mbMember.getPage({ pageNo: 1, pageSize: 50, memberStatusCd: 'ACTIVE' })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 ACTIVE 회원 없음' };
            const target = pick(list);
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
            await boApi.put('/bo/ec/mb/member/save/' + target.memberId, body, coUtil.apiHdr('회원시뮬', '수정'));
            return { ok: true, desc: target.memberNm + ' ' + desc, meta: { id: target.memberId } };
          }
        },
      });
      const { cfg, state, logs, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfGradeTotal = computed(() => Object.values(domCfg.gradeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'statusOnCreate', label: '초기 상태', type: 'select',
          options: [{ value: 'ACTIVE', label: '정상' }, { value: 'DORMANT', label: '휴면' }] },
        { key: 'randomGender',   label: '성별 랜덤',        type: 'checkbox' },
        { key: 'emailVerified',  label: '이메일 인증 완료', type: 'checkbox' },
        { key: 'snsLinkYn',      label: 'SNS 연동 표시',    type: 'checkbox' },
        { key: 'agentRangeMin',  label: '연령 최소',        type: 'number', hint: '세' },
        { key: 'agentRangeMax',  label: '연령 최대',        type: 'number', hint: '세' },
        { key: 'memoOnCreate',   label: '메모 자동 생성',   type: 'checkbox' },
      ];
      const updateCfgColumns = [
        { key: 'updateType', label: '수정 유형', type: 'select', options: UPDATE_TYPES },
      ];

      /* ── [05] 반환 ──────────────────────────────────── */
      return {
        cfg, domCfg, state, logs, cfIsRunning, cfSuccessRate,
        cfGradeTotal, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog,
        GRADES, STATUSES_UPD, UPDATE_TYPES,
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
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">👤 회원 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 등급 가중치 (1/3 폭만 차지, 아래 줄) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 등급 가중치</div>
      <div style="margin-top:10px;">
        <div v-for="g in GRADES" :key="g.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span :class="'badge '+g.badge" style="min-width:38px;text-align:center;font-size:11px;">{{ g.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.gradeWeights[g.cd]" style="flex:1;accent-color:#7c3aed;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.gradeWeights[g.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.gradeWeights[g.cd]/cfGradeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="g in GRADES" :key="g.cd" :style="'flex:'+domCfg.gradeWeights[g.cd]+';transition:flex .2s;'+({'BASIC':'background:#94a3b8','SILVER':'background:#3b82f6','GOLD':'background:#f59e0b','VIP':'background:#a855f7'}[g.cd])"></div>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="background:#fef3c7;border-radius:6px;padding:8px 12px;font-size:11px;color:#92400e;margin-top:10px;">
      💡 ACTIVE 상태 회원 50명 중 랜덤 선택 후 수정
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" max-height="320px" style="margin-top:12px;" @clear="onClearLog" />
</div>`,
  };
})();
