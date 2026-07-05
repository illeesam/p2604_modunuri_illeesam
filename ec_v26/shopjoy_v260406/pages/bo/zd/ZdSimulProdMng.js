/* ZdSimulProdMng — 상품 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns } = window.ZdSimulBase;

  const SALE_TYPES = [
    { cd: 'NORMAL', label: '단품',    badge: 'badge-blue'   },
    { cd: 'OPTION', label: '옵션형',  badge: 'badge-purple' },
    { cd: 'SET',    label: '세트',    badge: 'badge-orange' },
    { cd: 'BUNDLE', label: '묶음',    badge: 'badge-green'  },
  ];
  const PROD_STATUSES = [
    { value: 'SELLING',     label: '판매중'   },
    { value: 'SOLDOUT',     label: '품절'     },
    { value: 'PAUSE',       label: '판매중지' },
    { value: 'READY',       label: '판매준비' },
    { value: 'DISCONTINUED',label: '단종'     },
  ];
  const UPDATE_ACTIONS = [
    { value: 'status', label: '상태 변경' },
    { value: 'price',  label: '가격 조정' },
    { value: 'stock',  label: '재고 조정' },
    { value: 'name',   label: '상품명 변경' },
    { value: 'adcopy', label: '광고문구 갱신' },
  ];
  const AD_COPIES = [
    '한정 수량! 지금 바로 구매하세요',
    '오늘만 이 가격! 놓치지 마세요',
    '베스트셀러 상품, 품절 전 서두르세요',
    '고객 만족도 1위! 믿고 사는 제품',
    '특가 이벤트 진행 중',
    '시즌 한정 특별 할인',
    '신상품 출시 기념 특가',
    '리뷰 1000개 돌파! 검증된 품질',
  ];
  const PROD_PREFIXES = ['프리미엄','스페셜','에코','프로','울트라','스마트','베이직','럭셔리','클래식','미니'];
  const PROD_NAMES = ['무선 이어폰','텀블러','노트북 파우치','가죽 지갑','실리콘 케이스','캔버스 토트백','스테인리스 컵','스포츠 양말','코튼 후드티','LED 스탠드'];

  window.ZdSimulProdMng = {
    name: 'ZdSimulProdMng',
    props: {
      navigate:    { type: Function, required: true },
      showToast:   { type: Function, default: () => {} },
      showConfirm: { type: Function, default: () => Promise.resolve(true) },
    },
    setup(props) {
      /* ── [01] 도메인 설정 ────────────────────────────── */
      const domCfg = reactive({
        priceMin: 5000,
        priceMax: 500000,
        costRateMin: 40,
        costRateMax: 70,
        stockMin: 0,
        stockMax: 999,
        priceRoundUnit: 100,
        saleTypeWeights: { NORMAL: 60, OPTION: 25, SET: 10, BUNDLE: 5 },
        createStatus: 'SELLING',
        useAdCopy: true,
        randomCategory: false,
        updateAction: 'status',
        updateStatus: 'SOLDOUT',
        priceChangeRateMin: -20,
        priceChangeRateMax: 20,
        stockAddMin: -50,
        stockAddMax: 200,
      });

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        const w = domCfg.saleTypeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of SALE_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return SALE_TYPES[0];
      };
      const _round = (n) => Math.round(n / (domCfg.priceRoundUnit || 100)) * (domCfg.priceRoundUnit || 100);

      const simul = useSimulSetup({
        domain: '상품',
        label: '시뮬상품',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 2, intervalVal: 10, intervalUnit: 'sec', durationMin: 3 },
        runFn: async ({ mode, namePrefix, suffix, randInt, randF, pick }) => {
          if (mode === 'create') {
            const type      = _pickType();
            const salePrice = _round(randInt(domCfg.priceMin, domCfg.priceMax));
            const costRate  = randInt(domCfg.costRateMin, domCfg.costRateMax);
            const costPrice = _round(salePrice * costRate / 100);
            const stock     = randInt(domCfg.stockMin, domCfg.stockMax);
            const pfix      = pick(PROD_PREFIXES);
            const pnm       = pick(PROD_NAMES);
            const prodNm    = (namePrefix || '') + pfix + ' ' + pnm + (suffix ? ' ' + suffix : '');
            const body = {
              prodNm, salePrice, costPrice, stockQty: stock,
              prodSaleTypeCd: type.cd, prodStatusCd: domCfg.createStatus,
              adCopyYn: domCfg.useAdCopy ? 'Y' : 'N',
              adCopy: domCfg.useAdCopy ? pick(AD_COPIES) : '',
            };
            const res = await boApi.post('/bo/ec/pd/prod/save/base', body, coUtil.apiHdr('상품시뮬', '생성'));
            const id  = res?.data?.data?.prodId || res?.data?.data?.id || '-';
            if (!window._zdSimulStats['상품']) window._zdSimulStats['상품'] = { totalPrice: 0, count: 0, byType: {}, byStatus: {} };
            const st = window._zdSimulStats['상품'];
            st.count++; st.totalPrice += salePrice;
            st.byType[type.cd]  = (st.byType[type.cd] || 0) + 1;
            st.byStatus[domCfg.createStatus] = (st.byStatus[domCfg.createStatus] || 0) + 1;
            return { ok: true, desc: '[' + type.label + '] ' + prodNm + ' ' + salePrice.toLocaleString('ko-KR') + '원', meta: { id, type: type.label, salePrice } };
          } else {
            const list = (await boApiSvc.pdProd.getPage({ pageNo: 1, pageSize: 50, prodStatusCd: 'SELLING' })).data?.data?.pageList || [];
            if (!list.length) return { ok: false, reason: '수정할 판매중 상품 없음' };
            const target = pick(list);
            const action  = domCfg.updateAction;
            let body = {}, desc = '';
            if (action === 'status') {
              body.prodStatusCd = domCfg.updateStatus; desc = '상태→' + domCfg.updateStatus;
            } else if (action === 'price') {
              const rate = randInt(domCfg.priceChangeRateMin, domCfg.priceChangeRateMax);
              const newPrice = _round(Math.max(1000, (target.salePrice || 10000) * (1 + rate / 100)));
              body.salePrice = newPrice; desc = '가격 ' + (rate >= 0 ? '+' : '') + rate + '% → ' + newPrice.toLocaleString() + '원';
            } else if (action === 'stock') {
              const add = randInt(domCfg.stockAddMin, domCfg.stockAddMax);
              body.stockQty = Math.max(0, (target.stockQty || 0) + add);
              desc = '재고 ' + (add >= 0 ? '+' : '') + add + ' → ' + body.stockQty;
            } else if (action === 'name') {
              body.prodNm = target.prodNm + ' [리뉴얼]'; desc = '상품명 변경';
            } else {
              body.adCopy = pick(AD_COPIES); desc = '광고문구 갱신';
            }
            await boApi.put('/bo/ec/pd/prod/save/' + target.prodId, body, coUtil.apiHdr('상품시뮬', '수정'));
            return { ok: true, desc: target.prodNm + ' — ' + desc, meta: { id: target.prodId } };
          }
        },
      });
      const { cfg, state, logs, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog } = simul;

      /* ── [03] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.saleTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [04] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        { key: 'priceMin',       label: '가격 최소',     type: 'number', hint: '원' },
        { key: 'priceMax',       label: '가격 최대',     type: 'number', hint: '원' },
        { key: 'costRateMin',    label: '원가율 최소',   type: 'number', hint: '%' },
        { key: 'costRateMax',    label: '원가율 최대',   type: 'number', hint: '%' },
        { key: 'stockMin',       label: '재고 최소',     type: 'number', hint: '개' },
        { key: 'stockMax',       label: '재고 최대',     type: 'number', hint: '개' },
        { key: 'priceRoundUnit', label: '가격 단위',     type: 'select',
          options: [{ value: 100, label: '100원' }, { value: 500, label: '500원' }, { value: 1000, label: '1,000원' }] },
        { key: 'createStatus',   label: '초기 판매상태', type: 'select', options: PROD_STATUSES },
        { key: 'useAdCopy',      label: '광고문구 자동 생성', type: 'checkbox' },
        { key: 'randomCategory', label: '카테고리 자동 배정', type: 'checkbox' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction',        label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus',        label: '변경 상태', type: 'select', options: PROD_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        { key: 'priceChangeRateMin',  label: '가격 변동률 최소', type: 'number', hint: '%',
          visible: (f) => f.updateAction === 'price' },
        { key: 'priceChangeRateMax',  label: '가격 변동률 최대', type: 'number', hint: '%',
          visible: (f) => f.updateAction === 'price' },
        { key: 'stockAddMin',  label: '재고 증감 최소', type: 'number', hint: '개',
          visible: (f) => f.updateAction === 'stock' },
        { key: 'stockAddMax',  label: '재고 증감 최대', type: 'number', hint: '개',
          visible: (f) => f.updateAction === 'stock' },
      ];

      return {
        cfg, domCfg, state, logs, cfIsRunning, cfSuccessRate,
        cfTypeTotal, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog,
        SALE_TYPES, PROD_STATUSES, UPDATE_ACTIONS,
      };
    },

    template: `
<div class="zd-simul">
  <div class="page-title">📦 상품 시뮬레이터</div>

  <!-- 실행 제어 -->
  <zd-simul-control-panel
    :cfg="cfg" :state="state" :base-cfg-columns="baseCfgColumns"
    :cf-is-running="cfIsRunning" :cf-success-rate="cfSuccessRate"
    accent-color="linear-gradient(90deg,#059669,#34d399)"
    accent-active="background:#ecfdf5;border:1.5px solid #059669;color:#065f46;"
    @start="onStart" @stop="onStop" @run-once="onRunOnce" />

  <!-- 생성 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='create'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">📦 상품 생성 옵션</div>
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 판매유형 가중치 (1/3 폭, 아래 줄) -->
  <div v-if="cfg.mode==='create'" style="margin-top:12px;display:grid;grid-template-columns:1fr 2fr;gap:12px;">
    <div class="card" style="padding:14px 16px;">
      <div class="list-title">📊 판매유형 가중치</div>
      <div style="margin-top:10px;">
        <div v-for="t in SALE_TYPES" :key="t.cd" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span :class="'badge '+t.badge" style="min-width:42px;text-align:center;font-size:11px;">{{ t.label }}</span>
          <input type="range" min="0" max="100" v-model.number="domCfg.saleTypeWeights[t.cd]" style="flex:1;accent-color:#059669;" />
          <input type="number" min="0" max="100" v-model.number="domCfg.saleTypeWeights[t.cd]" style="width:40px;text-align:center;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;padding:2px;" />
          <span style="font-size:10px;color:#94a3b8;min-width:28px;">{{ Math.round(domCfg.saleTypeWeights[t.cd]/cfTypeTotal*100) }}%</span>
        </div>
      </div>
    </div>
    <div></div>
  </div>

  <!-- 수정 옵션 (전체 폭) -->
  <div v-if="cfg.mode==='update'" class="card" style="padding:14px 16px;margin-top:12px;">
    <div class="list-title">✏ 상품 수정 옵션</div>
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;" />
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" max-height="320px" style="margin-top:12px;" @clear="onClearLog" />
</div>`,
  };
})();
