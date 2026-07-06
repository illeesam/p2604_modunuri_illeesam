/* ZdSimulProdMng — 상품 시뮬레이터 (bo-form-area / bo-grid 활용) */
(function () {
  const { reactive, computed, ref, onMounted } = Vue;
  const { useSimulSetup, makeLogCols, makeBaseCfgColumns, makeRangeCol, makeRangeHandlers, rangeSlotTemplate } = window.ZdSimulBase;

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
        useOptImg: true,
        fixedCategoryId: '',
        opt1CountMin: 2,
        opt1CountMax: 3,
        opt2CountMin: 2,
        opt2CountMax: 3,
        updateAction: 'status',
        updateStatus: 'SOLDOUT',
        priceChangeRateMin: -20,
        priceChangeRateMax: 20,
        stockAddMin: -50,
        stockAddMax: 200,
      });

      /* 카테고리 목록 (onMounted 로드) */
      const categories = ref([]);

      /* ── [02] 공통 엔진 ──────────────────────────────── */
      const _pickType = () => {
        const w = domCfg.saleTypeWeights;
        const total = Object.values(w).reduce((a, b) => a + Number(b), 0);
        let r = Math.random() * total;
        for (const t of SALE_TYPES) { r -= Number(w[t.cd] || 0); if (r <= 0) return t; }
        return SALE_TYPES[0];
      };
      const _round = (n) => Math.round(n / (domCfg.priceRoundUnit || 100)) * (domCfg.priceRoundUnit || 100);

      /* 옵션 풀 (opt1CountMin~Max 범위로 슬라이스) */
      const OPT1_POOL = ['레드', '화이트', '블랙', '네이비', '그린', '옐로우', '퍼플', '그레이'];
      const OPT2_POOL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      /* 옵션1 색상에 대응하는 hex 팔레트 */
      const OPT1_COLORS = {
        '레드': '#e74c3c', '화이트': '#f5f5f5', '블랙': '#2c2c2c',
        '네이비': '#1a3a5c', '그린': '#27ae60', '옐로우': '#f1c40f',
        '퍼플': '#8e44ad', '그레이': '#7f8c8d',
      };

      /* Canvas로 단색 PNG Blob 생성 (400×400) */
      const _makeColorBlob = (hex) => new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, 400, 400);
        /* 색상명 라벨 */
        ctx.fillStyle = (hex === '#f5f5f5') ? '#555' : '#fff';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hex, 200, 200);
        canvas.toBlob(resolve, 'image/png');
      });

      /* opt 이미지 업로드 — 색상 배열 기준 Promise.all */
      const _uploadOptImgs = async (opt1List) => {
        const results = [];
        for (const nm of opt1List) {
          const hex  = OPT1_COLORS[nm] || '#cccccc';
          const blob = await _makeColorBlob(hex);
          const fd   = new FormData();
          fd.append('file', blob, 'opt_' + nm + '.png');
          try {
            const r = await coApiSvc.cmUpload.uploadOne(fd, '상품시뮬', '옵션이미지');
            const url = r?.data?.data?.cdnImgUrl || r?.data?.data?.attachUrl || '';
            results.push({ nm, url });
          } catch (e) {
            results.push({ nm, url: '' });
          }
        }
        return results;
      };

      const simul = useSimulSetup({
        domain: '상품',
        label: '시뮬상품',
        defaultCfg: { mode: 'create', countMin: 1, countMax: 1, intervalVal: 30, intervalUnit: 'sec', durationMin: 10 },
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
            const isOption  = type.cd === 'OPTION';
            /* 카테고리 결정: 고정 지정 > 랜덤 배정 */
            let categoryId = '';
            if (domCfg.fixedCategoryId) {
              categoryId = domCfg.fixedCategoryId;
            } else if (categories.value.length) {
              categoryId = pick(categories.value).categoryId;
            }
            const body = {
              prodNm, salePrice, costPrice, stockQty: isOption ? 0 : stock,
              prodSaleTypeCd: type.cd, prodStatusCd: domCfg.createStatus,
              adCopyYn: domCfg.useAdCopy ? 'Y' : 'N',
              adCopy: domCfg.useAdCopy ? pick(AD_COPIES) : '',
              ...(categoryId                ? { categoryId }                              : {}),
              ...(defaults.value.siteId     ? { siteId:     defaults.value.siteId }     : {}),
              ...(defaults.value.dlivTmpltId ? { dlivTmpltId: defaults.value.dlivTmpltId } : {}),
            };
            /* 옵션형: opt1/opt2 count range 기준 슬라이스 */
            let opt1List = null, opt2List = null;
            if (isOption) {
              const o1cnt = randInt(domCfg.opt1CountMin, domCfg.opt1CountMax);
              const o2cnt = randInt(domCfg.opt2CountMin, domCfg.opt2CountMax);
              opt1List = OPT1_POOL.slice(0, Math.min(o1cnt, OPT1_POOL.length));
              opt2List = OPT2_POOL.slice(0, Math.min(o2cnt, OPT2_POOL.length));
              body.optGroups = [
                { grpNm: '색상', level: 1, inputTypeCd: 'SELECT', sortOrd: 1,
                  items: opt1List.map((nm, i) => ({ nm, val: 'COL_' + nm.toUpperCase(), sortOrd: i + 1, useYn: 'Y' })) },
                { grpNm: '사이즈', level: 2, inputTypeCd: 'SELECT', sortOrd: 2,
                  items: opt2List.map((nm, i) => ({ nm, val: 'SIZ_' + nm, sortOrd: i + 1, useYn: 'Y' })) },
              ];
              /* 옵션별 이미지 업로드 */
              if (domCfg.useOptImg) {
                const imgResults = await _uploadOptImgs(opt1List);
                body.prodImgs = imgResults
                  .filter(r => r.url)
                  .map((r, i) => ({
                    cdnImgUrl: r.url,
                    optItemId1: 'COL_' + r.nm.toUpperCase(),
                    isMain: i === 0 ? 'Y' : 'N',
                    sortOrd: i + 1,
                  }));
              }
            }
            const res = await boApi.post('/bo/zd/simul/prod/create', body, coUtil.cofApiHdr('상품시뮬', '생성'));
            const prodId  = res?.data?.data?.prodId || null;

            const id = prodId || '-';
            if (!window._zdSimulStats['상품']) window._zdSimulStats['상품'] = { totalPrice: 0, count: 0, byType: {}, byStatus: {} };
            const st = window._zdSimulStats['상품'];
            st.count++; st.totalPrice += salePrice;
            st.byType[type.cd]  = (st.byType[type.cd] || 0) + 1;
            st.byStatus[domCfg.createStatus] = (st.byStatus[domCfg.createStatus] || 0) + 1;
            const optNote = isOption
              ? ' +옵션(' + (opt1List ? opt1List.length : 0) + 'x' + (opt2List ? opt2List.length : 0) + ')' + (domCfg.useOptImg ? '+이미지' : '')
              : '';
            return { ok: true, desc: '[' + type.label + '] ' + prodNm + ' ' + salePrice.toLocaleString('ko-KR') + '원' + optNote, meta: { id, type: type.label, salePrice } };
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
            await boApi.post('/bo/zd/simul/prod/update', { prodId: target.prodId, ...body }, coUtil.cofApiHdr('상품시뮬', '수정'));
            return { ok: true, desc: target.prodNm + ' — ' + desc, meta: { id: target.prodId } };
          }
        },
      });
      const { cfg, state, logs, logPager, cfIsRunning, cfSuccessRate, onStart, onStop, onRunOnce, onClearLog, onSetLogPage } = simul;

      /* ── [03] Defaults + 카테고리 로드 ──────────────── */
      const defaults = ref({ siteId: '', dlivTmpltId: '', dlivTmpltNm: '' });
      onMounted(async () => {
        try {
          const r = await boApi.post('/bo/zd/simul/prod/defaults', {}, coUtil.cofApiHdr('상품시뮬', 'defaults'));
          if (r?.data?.data) Object.assign(defaults.value, r.data.data);
        } catch (e) { /* defaults 실패 시 백엔드가 자동 처리 */ }
        try {
          const cr = await boApiSvc.pdCategory.getList({ useYn: 'Y', pageSize: 300 }, '상품시뮬', '카테고리조회');
          const raw = cr?.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.pageList || raw?.list || []);
          /* 트리 순서로 정렬: depth1 → depth2 → depth3, parent 기준 그룹화 */
          const byParent = {};
          list.forEach(c => {
            const pid = c.parentCategoryId || '__root__';
            if (!byParent[pid]) byParent[pid] = [];
            byParent[pid].push(c);
          });
          const sorted = [];
          const nameMap = {};
          list.forEach(c => { nameMap[c.categoryId] = c.categoryNm; });
          const walk = (pid, ancestors) => {
            (byParent[pid] || []).sort((a, b) => (a.sortOrd || 0) - (b.sortOrd || 0)).forEach(c => {
              const path = [...ancestors, c.categoryNm];
              sorted.push({ ...c, _fullPath: path.join(' > ') });
              walk(c.categoryId, path);
            });
          };
          walk('__root__', []);
          categories.value = sorted;
        } catch (e) { /* 카테고리 로드 실패 무시 */ }
      });

      /* ── [04] Computed ──────────────────────────────── */
      const cfTypeTotal = computed(() => Object.values(domCfg.saleTypeWeights).reduce((a, b) => a + Number(b), 0) || 1);

      /* ── [05] 컬럼 정의 ─────────────────────────────── */
      const logCols = makeLogCols();
      const baseCfgColumns = makeBaseCfgColumns();
      const createCfgColumns = [
        makeRangeCol('priceMin', 'priceMax', '가격 범위', 5000, 500000, '원'),
        makeRangeCol('costRateMin', 'costRateMax', '원가율 범위', 0, 100, '%'),
        makeRangeCol('stockMin',    'stockMax',    '재고 범위',   0, 999, '개'),
        { key: 'priceRoundUnit', label: '가격 단위',     type: 'select',
          options: [{ value: 100, label: '100원' }, { value: 500, label: '500원' }, { value: 1000, label: '1,000원' }] },
        { key: 'createStatus',   label: '초기 판매상태', type: 'select', options: PROD_STATUSES },
        { key: 'useAdCopy',      label: '광고문구 자동 생성', type: 'checkbox', checkedValue: true, uncheckedValue: false },
        { key: 'useOptImg',      label: '옵션별 이미지 자동 업로드', type: 'checkbox',
          checkedValue: true, uncheckedValue: false, hint: '옵션1 색상별 단색 이미지 생성 후 첨부' },
        makeRangeCol('opt1CountMin', 'opt1CountMax', '옵션1 항목 수', 1, 8, '개',
          { hint: '색상 (레드~그레이 풀)' }),
        makeRangeCol('opt2CountMin', 'opt2CountMax', '옵션2 항목 수', 1, 6, '개',
          { hint: '사이즈 (XS~XXL 풀)' }),
        { key: 'fixedCategoryId', label: '카테고리 선택', type: 'slot', name: 'catPick' },
      ];
      const updateCfgColumns = [
        { key: 'updateAction',  label: '수정 액션', type: 'select', options: UPDATE_ACTIONS },
        { key: 'updateStatus',  label: '변경 상태', type: 'select', options: PROD_STATUSES,
          visible: (f) => f.updateAction === 'status' },
        makeRangeCol('priceChangeRateMin', 'priceChangeRateMax', '가격 변동률 범위', -50, 50, '%',
          { visible: (f) => f.updateAction === 'price' }),
        makeRangeCol('stockAddMin', 'stockAddMax', '재고 증감 범위', -200, 500, '개',
          { visible: (f) => f.updateAction === 'stock' }),
      ];

      const rangeHandlers = makeRangeHandlers(domCfg, [
        { minKey: 'priceMin',           maxKey: 'priceMax'           },
        { minKey: 'costRateMin',        maxKey: 'costRateMax'        },
        { minKey: 'stockMin',           maxKey: 'stockMax'           },
        { minKey: 'opt1CountMin',       maxKey: 'opt1CountMax'       },
        { minKey: 'opt2CountMin',       maxKey: 'opt2CountMax'       },
        { minKey: 'priceChangeRateMin', maxKey: 'priceChangeRateMax' },
        { minKey: 'stockAddMin',        maxKey: 'stockAddMax'        },
      ]);

      return {
        cfg, domCfg, state, logs, logPager, cfIsRunning, cfSuccessRate,
        defaults, cfTypeTotal, categories, logCols, baseCfgColumns, createCfgColumns, updateCfgColumns,
        onStart, onStop, onRunOnce, onClearLog, onSetLogPage,
        ...rangeHandlers,
        SALE_TYPES, PROD_STATUSES, UPDATE_ACTIONS, OPT1_POOL, OPT2_POOL, OPT1_COLORS,
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
    <bo-form-area :columns="createCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('priceMin','priceMax',5000,500000,'원')}
      ${rangeSlotTemplate('costRateMin','costRateMax',0,100,'%')}
      ${rangeSlotTemplate('stockMin','stockMax',0,999,'개')}
      ${rangeSlotTemplate('opt1CountMin','opt1CountMax',1,8,'개')}
      ${rangeSlotTemplate('opt2CountMin','opt2CountMax',1,6,'개')}
      <template #catPick>
        <select v-model="domCfg.fixedCategoryId" class="form-control" style="width:100%;font-size:12px;">
          <option value="">— 랜덤 배정</option>
          <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">{{ c._fullPath }}</option>
          <option v-if="!categories.length" disabled value="">카테고리 로딩 중...</option>
        </select>
      </template>
    </bo-form-area>

    <!-- 옵션 풀 프리뷰 -->
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;display:flex;flex-direction:column;gap:6px;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:11px;color:#64748b;font-weight:600;min-width:80px;">옵션1 색상 풀</span>
        <template v-for="(nm, i) in OPT1_POOL" :key="nm">
          <span :style="'display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;font-size:11px;border:1px solid #e2e8f0;' + (i < domCfg.opt1CountMax ? '' : 'opacity:0.3;')">
            <span :style="'display:inline-block;width:10px;height:10px;border-radius:50%;background:' + OPT1_COLORS[nm] + ';border:1px solid #ccc;'"></span>
            {{ nm }}
            <span v-if="i < domCfg.opt1CountMin" style="color:#059669;font-size:9px;">●</span>
            <span v-else-if="i < domCfg.opt1CountMax" style="color:#d97706;font-size:9px;">○</span>
          </span>
        </template>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:11px;color:#64748b;font-weight:600;min-width:80px;">옵션2 사이즈 풀</span>
        <template v-for="(nm, i) in OPT2_POOL" :key="nm">
          <span :style="'display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;font-size:11px;border:1px solid #e2e8f0;' + (i < domCfg.opt2CountMax ? '' : 'opacity:0.3;')">
            {{ nm }}
            <span v-if="i < domCfg.opt2CountMin" style="color:#059669;font-size:9px;">●</span>
            <span v-else-if="i < domCfg.opt2CountMax" style="color:#d97706;font-size:9px;">○</span>
          </span>
        </template>
      </div>
      <div style="font-size:10px;color:#94a3b8;">● 확정 포함 ○ 가능 범위 ∙ 흐린 항목은 범위 초과</div>
    </div>
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
    <bo-form-area :columns="updateCfgColumns" :form="domCfg" :show-actions="false" :cols="3" style="margin-top:10px;">
      ${rangeSlotTemplate('priceChangeRateMin','priceChangeRateMax',-50,50,'%')}
      ${rangeSlotTemplate('stockAddMin','stockAddMax',-200,500,'개')}
    </bo-form-area>
  </div>

  <!-- 실행 로그 -->
  <zd-simul-log-panel :logs="logs" :log-cols="logCols" :pager="logPager" max-height="320px" style="margin-top:12px;" @clear="onClearLog" @set-page="onSetLogPage" />
</div>`,
  };
})();
