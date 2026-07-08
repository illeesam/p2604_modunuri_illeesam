/* ZdSimulVoucherMng — ERP 전표 시뮬레이터 */
(function () {
  const { reactive } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  /* ── 도메인 상수 ──────────────────────────────────────────── */
  const VOUCHER_TYPES = [
    { value: 'SETTLE',  label: '정산' },
    { value: 'RETURN',  label: '반품' },
    { value: 'ADJ',     label: '조정' },
    { value: 'PAY',     label: '지급' },
  ];
  const VOUCHER_STATUSES = [
    { value: 'DRAFT',     label: '초안' },
    { value: 'PENDING',   label: '검토중' },
    { value: 'APPROVED',  label: '승인' },
    { value: 'REJECTED',  label: '반려' },
  ];
  const UPDATE_TYPES = [
    { value: 'status', label: '상태 변경' },
    { value: 'amount', label: '금액 조정' },
    { value: 'desc',   label: '설명 수정' },
  ];
  const DESCS = ['1분기 매출 정산', '2분기 운영경비', '광고비 정산', '물류비 정산', '플랫폼 수수료', '반품 처리 비용', '프로모션 비용', '기타 경비'];

  window.ZdSimulVoucherMng = {
    name: 'ZdSimulVoucherMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────────── */
      const domCfg = reactive({
        statusOnCreate: 'DRAFT',
        typeWeights: { SETTLE: 40, RETURN: 20, ADJ: 25, PAY: 15 },
        amtMin:         10000,
        amtMax:         5000000,
        updateType:     'status',
        fixedVoucherId: '',
      });

      /* ── 가중치 기반 유형 선택 ─────────────────────────── */
      const _pickWeightedType = () => {
        const w = domCfg.typeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0) || 1;
        let r = Math.random() * total;
        for (const t of VOUCHER_TYPES) { r -= Number(w[t.value] || 0); if (r <= 0) return t.value; }
        return VOUCHER_TYPES[0].value;
      };

      /* ── 업체 목록 캐시 (전표 생성 시 vendorId 필요) ──── */
      const _vendorCache = reactive({ list: [], loaded: false });
      const _ensureVendors = async () => {
        if (_vendorCache.loaded) return _vendorCache.list;
        try {
          const res = await boApi.get('/bo/sy/vendor/page', { params: { pageNo: 1, pageSize: 100, vendorStatusCd: 'ACTIVE' } });
          _vendorCache.list = res?.data?.data?.pageList || [];
        } catch (_) { _vendorCache.list = []; }
        _vendorCache.loaded = true;
        return _vendorCache.list;
      };

      /* ── [02] 공통 엔진 연결 ────────────────────────────── */
      const simul = useSimulSetup({
        domain: '전표',
        uiNm: 'ERP 전표 시뮬레이터',
        label: '시뮬전표',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 3, intervalVal: 20, intervalUnit: 'sec', durationMin: 5 },
        runFn: async ({ mode, randInt, pick }) => {
          if (mode === 'create') {
            const vendors   = await _ensureVendors();
            const vendor    = vendors.length ? pick(vendors) : null;
            const type      = _pickWeightedType();
            const typeLabel = VOUCHER_TYPES.find(t => t.value === type)?.label || type;
            const desc      = pick(DESCS);
            const amt       = Math.round(randInt(domCfg.amtMin, domCfg.amtMax) / 100) * 100;
            const settleYm  = new Date().toISOString().slice(0, 7).replace('-', '');
            const body      = {
              erpVoucherTypeCd: type,
              erpVoucherStatusCd: domCfg.statusOnCreate,
              erpVoucherDesc: desc,
              voucherDate: new Date().toISOString().slice(0, 10),
              totalDebitAmt: amt,
              totalCreditAmt: amt,
              settleYm,
              ...(vendor ? { vendorId: vendor.vendorId } : {}),
            };
            const res = await boApi.post('/bo/zd/simul/voucher/create', body, coUtil.cofApiHdr('전표시뮬', '생성'));
            const id  = res?.data?.data?.erpVoucherId || '';
            return { ok: true, desc: typeLabel + ' / ' + desc + ' / ' + coUtil.cofWon(amt), meta: { id, params: body } };
          } else {
            let target;
            if (domCfg.fixedVoucherId) {
              target = { erpVoucherId: domCfg.fixedVoucherId };
            } else {
              const res = await boApi.get('/bo/st/erp-voucher/page', { params: { pageNo: 1, pageSize: 50, erpVoucherStatusCd: 'DRAFT' } });
              const list = res?.data?.data?.pageList || [];
              if (!list.length) return { ok: false, reason: '수정할 전표 없음 (DRAFT)' };
              target = pick(list);
            }
            let body = {}, descPart = '';
            if (domCfg.updateType === 'status') {
              const s = pick(VOUCHER_STATUSES); body.erpVoucherStatusCd = s.value; descPart = '상태→' + s.label;
            } else if (domCfg.updateType === 'amount') {
              const amt = Math.round(randInt(domCfg.amtMin, domCfg.amtMax) / 100) * 100;
              body.totalDebitAmt = amt; body.totalCreditAmt = amt; descPart = '금액→' + coUtil.cofWon(amt);
            } else {
              body.erpVoucherDesc = pick(DESCS) + ' [수정]'; descPart = '설명 수정';
            }
            const updateBody = { erpVoucherId: target.erpVoucherId, ...body };
            await boApi.post('/bo/zd/simul/voucher/update', updateBody, coUtil.cofApiHdr('전표시뮬', '수정'));
            return { ok: true, desc: target.erpVoucherId + ' ' + descPart, meta: { id: target.erpVoucherId, params: updateBody } };
          }
        },
      });
      const { cfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
              onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog } = simul;

      /* ── [03] 컬럼 정의 ─────────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'statusOnCreate', label: '초기 상태', type: 'select', options: VOUCHER_STATUSES },
        { key: 'amtMin', label: '금액 최솟값(원)', type: 'number', placeholder: '10000' },
        { key: 'amtMax', label: '금액 최댓값(원)', type: 'number', placeholder: '5000000' },
      ];
      const updateCfgColumns = [
        { key: 'updateType', label: '수정 유형', type: 'select', options: UPDATE_TYPES },
      ];

      const cfTypeTotal = Vue.computed(() => Object.values(domCfg.typeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* 전표 picker */
      const voucherPicker = reactive({ show: false, searchValue: '', rows: [], loading: false });
      const _loadVoucherPicker = async () => {
        voucherPicker.loading = true;
        try {
          const res = await boApi.get('/bo/st/erp-voucher/page', { params: { pageNo: 1, pageSize: 20,
            ...(voucherPicker.searchValue ? { searchValue: voucherPicker.searchValue } : {}) } });
          voucherPicker.rows = res?.data?.data?.pageList || [];
        } catch (_) { voucherPicker.rows = []; }
        voucherPicker.loading = false;
      };
      const onOpenVoucherPicker = async () => { voucherPicker.show = true; voucherPicker.searchValue = ''; await _loadVoucherPicker(); };
      const onSelectVoucher = (row) => { domCfg.fixedVoucherId = row.erpVoucherId; voucherPicker.show = false; };

      const fnVoucherTypeLabel = (v) => VOUCHER_TYPES.find(t => t.value === v)?.label || v || '';

      return {
        cfg, domCfg, state, logs, logPager, logSearch, cfIsRunning, cfSuccessRate,
        logCols, baseCfgColumns, createCfgColumns, updateCfgColumns, cfTypeTotal,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage, onSearchLog,
        VOUCHER_TYPES, VOUCHER_STATUSES, UPDATE_TYPES,
        voucherPicker, onOpenVoucherPicker, onSelectVoucher, _loadVoucherPicker,
        fnVoucherTypeLabel,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">📄 ERP 전표 시뮬레이터</div>

  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#d97706,#fbbf24)"
    accent-active="background:#fffbeb;border:1.5px solid #d97706;color:#b45309;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">📄 전표 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div style="margin-top:10px;font-size:11px;color:#64748b;line-height:1.6;">
      ✅ 정산년월 = 이번달 / 전표일자 = 오늘 / 차변·대변 동일 금액 / 업체 = ACTIVE 목록 중 랜덤
    </div>
    <!-- 전표 유형 가중치 -->
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:10px;">📊 전표 유형 가중치</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 20px;">
        <div v-for="t in VOUCHER_TYPES" :key="t.value" style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:11px;color:#334155;min-width:36px;white-space:nowrap;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.typeWeights[t.value]" style="flex:1;accent-color:#d97706;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.typeWeights[t.value]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:30px;text-align:right;">{{ Math.round(domCfg.typeWeights[t.value]/cfTypeTotal*100) }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 수정 옵션 -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
    <div v-if="domCfg.updateType==='amount'" style="margin-top:8px;">
      <bo-form-area :columns="[
        {key:'amtMin',label:'금액 최솟값(원)',type:'number'},
        {key:'amtMax',label:'금액 최댓값(원)',type:'number'},
      ]" :form="domCfg" :show-actions="false" :cols="3" />
    </div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;">
      <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">🎯 수정 대상 전표 지정</div>
      <div style="display:flex;gap:6px;align-items:center;max-width:400px;">
        <input type="text" :value="domCfg.fixedVoucherId || ''" readonly
          placeholder="랜덤 (DRAFT 전표 50건 중)"
          style="flex:1;height:28px;padding:0 8px;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;color:#334155;cursor:pointer;"
          @click="onOpenVoucherPicker" />
        <button v-if="domCfg.fixedVoucherId" class="btn" style="height:28px;padding:0 7px;font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;"
          @click="domCfg.fixedVoucherId=''">✕</button>
        <button v-else class="btn btn_detail" style="height:28px;padding:0 9px;font-size:11px;" @click="onOpenVoucherPicker">선택</button>
      </div>
      <div v-if="domCfg.fixedVoucherId" style="font-size:10px;color:#d97706;margin-top:3px;font-family:monospace;">{{ domCfg.fixedVoucherId }}</div>
      <div v-else style="font-size:10px;color:#94a3b8;margin-top:3px;">💡 미지정 시 DRAFT 전표 중 랜덤 선택</div>
    </div>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" :log-search="logSearch"
    @search-log="onSearchLog" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />

  <!-- 전표 picker 모달 -->
  <bo-modal :show="voucherPicker.show" title="수정할 전표 선택" @close="voucherPicker.show=false" box-width="580px">
    <div style="padding:12px 0 8px;">
      <div style="display:flex;gap:6px;margin-bottom:10px;">
        <input type="text" v-model="voucherPicker.searchValue" placeholder="전표ID / 설명 검색" @keyup.enter="_loadVoucherPicker"
          style="flex:1;height:32px;padding:0 10px;font-size:12px;border:1px solid #e2e8f0;border-radius:4px;" />
        <button class="btn btn_search" style="height:32px;padding:0 12px;" @click="_loadVoucherPicker">조회</button>
      </div>
      <div v-if="voucherPicker.loading" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">조회 중...</div>
      <table v-else class="admin-table" style="width:100%;font-size:12px;">
        <thead><tr>
          <th style="width:36px;">번호</th>
          <th>전표ID</th>
          <th>유형</th>
          <th>설명</th>
          <th>금액</th>
          <th>상태</th>
          <th style="width:50px;">선택</th>
        </tr></thead>
        <tbody>
          <tr v-if="!voucherPicker.rows.length"><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">조회 결과 없음</td></tr>
          <tr v-for="(r,i) in voucherPicker.rows" :key="r.erpVoucherId" style="cursor:pointer;" @click="onSelectVoucher(r)">
            <td style="text-align:center;">{{ i+1 }}</td>
            <td style="font-family:monospace;font-size:10px;color:#64748b;">{{ r.erpVoucherId }}</td>
            <td style="text-align:center;">{{ fnVoucherTypeLabel(r.erpVoucherTypeCd) }}</td>
            <td style="font-size:11px;color:#334155;">{{ r.erpVoucherDesc }}</td>
            <td style="text-align:right;color:#334155;">{{ (r.totalDebitAmt||0).toLocaleString() }}원</td>
            <td style="text-align:center;"><span class="badge badge-gray" style="font-size:10px;">{{ r.erpVoucherStatusCd }}</span></td>
            <td style="text-align:center;"><button class="btn btn_select" style="font-size:10px;padding:1px 8px;height:22px;">선택</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </bo-modal>
</div>`,
  };
})();
