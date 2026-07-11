/* ZdSimulVendorMng — 업체 시뮬레이터 */
(function () {
  const { reactive } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  /* ── 도메인 상수 ──────────────────────────────────────────── */
  const VENDOR_TYPES = [
    { value: 'DELIVERY', label: '배송업체',     color: '#3b82f6' },
    { value: 'SALES',    label: '판매업체',     color: '#22c55e' },
    { value: 'SYSTEM',   label: '시스템운영업체', color: '#a855f7' },
  ];
  const VENDOR_STATUSES = [
    { value: 'ACTIVE',      label: '계약중' },
    { value: 'SUSPENDED',   label: '계약정지' },
    { value: 'TERMINATED',  label: '계약종료' },
    { value: 'PENDING',     label: '검토중' },
  ];
  const CEO_NAMES  = ['홍길동','김철수','이영희','박민준','정수연','최민영','강동원','조현아','윤서율','임지연'];
  const COMPANY_SUFFIXES = ['(주)','㈜','유한(주)','㈱'];
  const BIZ_NAMES  = ['패션','글로벌','트레이딩','솔루션','커머스','인터내셔널','마켓','스토어','뷰티','라이프'];
  const UPDATE_TYPES = [
    { value: 'status', label: '상태 변경' },
    { value: 'phone',  label: '전화번호 갱신' },
    { value: 'remark', label: '비고 업데이트' },
  ];

  window.ZdSimulVendorMng = {
    name: 'ZdSimulVendorMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────────── */
      const domCfg = reactive({
        statusOnCreate:  'ACTIVE',
        fixedVendorType: '__weighted__',
        typeWeights:     { DELIVERY: 40, SALES: 40, SYSTEM: 20 },
        updateType:      'status',
        fixedVendorId:   '',
        fixedVendorNm:   '',
      });

      /* ── 가중치 기반 유형 선택 ─────────────────────────── */
      const _pickWeightedType = () => {
        if (domCfg.fixedVendorType && domCfg.fixedVendorType !== '__weighted__') return domCfg.fixedVendorType;
        const w = domCfg.typeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of VENDOR_TYPES) { r -= Number(w[t.value] || 0); if (r <= 0) return t.value; }
        return VENDOR_TYPES[0].value;
      };

      /* ── [02] 공통 엔진 연결 ────────────────────────────── */
      const simul = useSimulSetup({
        domain: '업체',
        uiNm: '업체 시뮬레이터',
        label: '시뮬업체',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
        runFn: async ({ mode, namePrefix, randInt, pick }) => {
          if (mode === 'create') {
            const seq    = String(Date.now()).slice(-5);
            const biz    = pick(BIZ_NAMES);
            const suffix = pick(COMPANY_SUFFIXES);
            const nm     = (namePrefix || '시뮬') + biz + '업체' + suffix;
            const ceo    = pick(CEO_NAMES);
            const type   = _pickWeightedType();
            const typeLabel = VENDOR_TYPES.find(t => t.value === type)?.label || type;
            const phone  = '02-' + String(randInt(100, 999)) + '-' + String(randInt(1000, 9999));
            const corpNo = String(randInt(100, 999)) + '-' + String(randInt(10, 99)) + '-' + String(randInt(10000, 99999));
            const email  = 'vendor' + seq + '@' + biz.toLowerCase() + '.co.kr';
            const body   = {
              vendorNm: nm, ceoNm: ceo, vendorType: type,
              vendorPhone: phone, vendorEmail: email, corpNo: corpNo,
              vendorStatusCd: domCfg.statusOnCreate,
              openDate: new Date().toISOString().slice(0, 10),
              contractDate: new Date().toISOString().slice(0, 10),
            };
            const res = await boApi.post('/bo/zd/simul/vendor/create', body, coUtil.cofApiHdr('업체시뮬', '생성'));
            const id  = res?.data?.data?.vendorId || seq;
            return { ok: true, desc: nm + ' / ' + typeLabel + ' / ' + ceo, meta: { id, params: body } };
          } else {
            let target;
            if (domCfg.fixedVendorId) {
              target = { vendorId: domCfg.fixedVendorId, vendorNm: domCfg.fixedVendorNm };
            } else {
              const res = await boApi.get('/bo/sy/vendor/page', { params: { pageNo: 1, pageSize: 50, vendorStatusCd: 'ACTIVE' } });
              const list = res?.data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 업체 없음 (ACTIVE)' };
              target = pick(list);
            }
            let body = {}, descPart = '';
            if (domCfg.updateType === 'status') {
              const s = pick(VENDOR_STATUSES); body.vendorStatusCd = s.value; descPart = '상태→' + s.label;
            } else if (domCfg.updateType === 'phone') {
              body.vendorPhone = '02-' + String(randInt(100, 999)) + '-' + String(randInt(1000, 9999));
              descPart = '전화번호 변경';
            } else {
              body.vendorRemark = '[시뮬수정] ' + new Date().toLocaleTimeString('ko-KR');
              descPart = '비고 업데이트';
            }
            const updateBody = { vendorId: target.vendorId, ...body };
            await boApi.post('/bo/zd/simul/vendor/update', updateBody, coUtil.cofApiHdr('업체시뮬', '수정'));
            return { ok: true, desc: (target.vendorNm || target.vendorId) + ' ' + descPart, meta: { id: target.vendorId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'statusOnCreate', label: '초기 상태', type: 'select', options: VENDOR_STATUSES },
      ];
      const updateCfgColumns = [
        { key: 'updateType', label: '수정 유형', type: 'select', options: UPDATE_TYPES },
      ];

      const cfTypeTotal = Vue.computed(() => Object.values(domCfg.typeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* 업체 picker */
      const vendorPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const _loadVendorPicker = async () => {
        vendorPicker.loading = true;
        try {
          const res = await boApi.get('/bo/sy/vendor/page', { params: { pageNo: 1, pageSize: 20,
            ...(vendorPicker.searchValue ? { searchValue: vendorPicker.searchValue } : {}) } });
          vendorPicker.rows = res?.data?.data?.pageList || [];
        } catch (_) { vendorPicker.rows = []; }
        vendorPicker.loading = false;
      };
      const onOpenVendorPicker = async () => { vendorPicker.show = true; vendorPicker.searchValue = ''; await _loadVendorPicker(); };
      const onSelectVendor = (row) => { domCfg.fixedVendorId = row.vendorId; domCfg.fixedVendorNm = row.vendorNm || row.vendorId; vendorPicker.show = false; };

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns, cfTypeTotal,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        VENDOR_TYPES, VENDOR_STATUSES, UPDATE_TYPES,
        vendorPicker, onOpenVendorPicker, onSelectVendor, _loadVendorPicker,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">🏢 업체 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#7c3aed,#a78bfa)"
    accent-active="background:#f5f3ff;border:1.5px solid #7c3aed;color:#6d28d9;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">🏢 업체 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:10px;font-size:11px;color:#64748b;line-height:1.6;">
      ✅ 업체명 = <b>시뮬[업종][접미사]</b> / 법인번호 자동생성 / 개업일·계약일 = 오늘
    </div>
  </div>

  <!-- 가중치 패널 -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">🏷 업체 유형 가중치</div>
      <div style="margin-top:8px;margin-bottom:10px;">
        <select v-model="domCfg.fixedVendorType" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:12px;">
          <option value="__weighted__">-- 가중치적용 --</option>
          <option v-for="t in VENDOR_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div style="margin-top:10px;">
        <div v-for="t in VENDOR_TYPES" :key="t.value" style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span :style="'width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0;display:inline-block;'"></span>
          <span style="font-size:11px;color:#334155;min-width:52px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.typeWeights[t.value]" :style="'flex:1;accent-color:'+t.color+';'" />
          <input type="number" min="0" max="100" v-model.number="domCfg.typeWeights[t.value]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;text-align:right;">{{ Math.round(domCfg.typeWeights[t.value]/cfTypeTotal*100) }}%</span>
        </div>
        <div style="height:8px;border-radius:4px;overflow:hidden;display:flex;margin-top:6px;">
          <div v-for="t in VENDOR_TYPES" :key="t.value" :style="'flex:'+domCfg.typeWeights[t.value]+';transition:flex .2s;background:'+t.color+';'"></div>
        </div>
      </div>
    </div>
    <div></div>
    <div></div>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">🎯 수정 대상 업체 지정</div>
      <div style="display:flex;gap:6px;align-items:center;max-width:400px;">
        <input type="text" :value="domCfg.fixedVendorNm || domCfg.fixedVendorId || ''" readonly
          placeholder="랜덤 (ACTIVE 업체 50개 중)"
          style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
          @click="onOpenVendorPicker" />
        <button v-if="domCfg.fixedVendorId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
          @click="domCfg.fixedVendorId='';domCfg.fixedVendorNm=''">✕</button>
        <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenVendorPicker">선택</button>
      </div>
      <div v-if="domCfg.fixedVendorId" style="font-size:10px;color:#7c3aed;margin-top:3px;font-family:monospace;">{{ domCfg.fixedVendorId }}</div>
      <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">💡 미지정 시 ACTIVE 업체 중 랜덤 선택</div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 업체 picker 모달 -->
  <bo-modal :show="vendorPicker.show" title="수정할 업체 선택" @close="vendorPicker.show=false" box-width="560px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="vendorPicker.searchValue" placeholder="업체명 / 대표자명 검색" @keyup.enter="_loadVendorPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadVendorPicker">조회</button>
      </div>
      <div v-if="vendorPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>업체명</th>
          <th>유형</th>
          <th>대표자</th>
          <th>상태</th>
          <th style="width:50px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!vendorPicker.rows.length"><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in vendorPicker.rows" :key="r.vendorId" style="cursor:pointer;" @click="onSelectVendor(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td>{{ r.vendorNm }}</td>
            <td style="text-align:center;font-size:11px;">{{ r.vendorType }}</td>
            <td style="color:#64748b;">{{ r.ceoNm }}</td>
            <td style="text-align:center;"><span class="badge badge-green" style="font-size:10px;">{{ r.vendorStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();
