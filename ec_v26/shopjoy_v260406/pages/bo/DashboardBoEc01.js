/* ShopJoy Admin - EC 종합 대시보드 (월별 14개월 현황) */
window.DashboardBoEc01 = {
  name: 'DashboardBoEc01',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
  },
  setup() {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted } = Vue;
    const fmt = coUtil.cofFmt;
    const toYmd = coUtil.cofToYmd;
    const toYm = coUtil.cofToYm;
    const addMonths = coUtil.cofAddMonths;
    const endOfMonth = coUtil.cofEndOfMonth;
    const maxOf = coUtil.cofMaxOf;
    const linePoints = coUtil.cofLinePoints;
    const areaPath = coUtil.cofAreaPath;

    const today    = new Date();
    const endDef   = toYmd(endOfMonth(today));
    const startDef = toYmd(new Date(addMonths(today, -13).getFullYear(), addMonths(today, -13).getMonth(), 1));

    const CHANNELS = ['자사몰','네이버 스마트스토어','쿠팡','11번가','G마켓','Auction','GS샵','TMON','위메프','롯데온','홈앤쇼핑','현대H몰'];
    const AGES     = ['10대','20대','30대','40대','50대','60대+'];
    const GENDERS  = ['남','여'];
    const MEMBER_TYPES = ['일반','VIP','VVIP','휴면','탈퇴'];
    const CATEGORIES   = ['패션의류','패션잡화','뷰티','가전','식품','가구','리빙','스포츠','도서','기타'];

    const CHANNEL_COLORS = {
      '자사몰':'#e8587a', '네이버 스마트스토어':'#10b981', '쿠팡':'#ef4444', '11번가':'#f97316',
      'G마켓':'#3b82f6', 'Auction':'#6366f1', 'GS샵':'#a855f7', 'TMON':'#e11d48',
      '위메프':'#f59e0b', '롯데온':'#9333ea', '홈앤쇼핑':'#0891b2', '현대H몰':'#c2410c',
    };

    const filters = reactive({
      startDt: startDef,
      endDt:   endDef,
      channels:    [...CHANNELS],
      ages:        [...AGES],
      genders:     [...GENDERS],
      memberTypes: [...MEMBER_TYPES],
      categories:  [...CATEGORIES],
    });

    const uiState = reactive({
      filterExpand: false,
      activeTab: 'sales',
      tabMode: '4col',
      loading: false,
    });

    const COMP_IDS = [
      'COMP0101', 'COMP0102', 'COMP0103', 'COMP0104',
      'COMP0201', 'COMP0202', 'COMP0203', 'COMP0204',
      'COMP0301', 'COMP0302', 'COMP0303', 'COMP0304',
      'COMP0401', 'COMP0402', 'COMP0403',
    ];

    /* API 응답 데이터 — 15개 차트 */
    const dash = reactive({
      info0101: [], info0102: [], info0103: [], info0104: [],
      info0201: [], info0202: [], info0203: [], info0204: [],
      info0301: [], info0302: [], info0303: [], info0304: [],
      info0401: [], info0402: [], info0403: [],
    });

    const TABS = [
      { key: 'sales',       label: '월별 매출',       icon: '💰' },
      { key: 'member',      label: '가입/탈퇴',       icon: '👥' },
      { key: 'click',       label: '상품상세 클릭',   icon: '🖱' },
      { key: 'order',       label: '주문완료',        icon: '📋' },
      { key: 'channel',     label: '판매채널별 매출', icon: '📺' },
      { key: 'kpi',         label: '핵심지표',        icon: '🎯' },
      { key: 'topProducts', label: '상품 TOP 7',      icon: '📦' },
      { key: 'channelMix',  label: '채널 비중',       icon: '📱' },
      { key: 'deviceMix',   label: '디바이스 비중',   icon: '💻' },
      { key: 'timeMix',     label: '시간대 비중',     icon: '⏰' },
      { key: 'region',      label: '지역별',          icon: '🗺' },
      { key: 'hourly',      label: '시간대 추이',     icon: '⏱' },
      { key: 'radar',       label: '영업지표',        icon: '⚡' },
      { key: 'economy',     label: '경제 수준별',     icon: '💼' },
      { key: 'shipping',    label: '배송 조건',       icon: '🚚' },
    ];
    const VIEW_MODES = [
      { key: 'tab',  icon: '📑', label: '탭' },
      { key: '1col', icon: '▭',  label: '1열' },
      { key: '2col', icon: '▭▭', label: '2열' },
      { key: '3col', icon: '▭▭▭', label: '3열' },
      { key: '4col', icon: '▭▭▭▭', label: '4열' },
    ];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'filters-search')        { return onSearch(); }
      else if (cmd === 'filters-reset')    { return onReset(); }
      else if (cmd === 'stats-excel')      { return doExcelDownload(); }
      else if (cmd === 'filters-toggleExpand') { uiState.filterExpand = !uiState.filterExpand; }
      else if (cmd === 'filters-toggleAll')    { return toggleAll(param.key, param.all); }
      else if (cmd === 'filters-toggle')       { return toggle(filters[param.key], param.v); }
      else { console.warn('[handleBtnAction] unknown cmd:', cmd); }
    };

    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'tabs-select')   { if (uiState.tabMode === 'tab') uiState.activeTab = param; }
      else if (cmd === 'tabMode-set') { uiState.tabMode = param; }
      else { console.warn('[handleSelectAction] unknown cmd:', cmd); }
    };

    const toggle    = (list, v) => { const i = list.indexOf(v); if (i >= 0) list.splice(i, 1); else list.push(v); };
    const toggleAll = (key, all) => { filters[key] = filters[key].length === all.length ? [] : [...all]; };
    const isSel     = (list, v) => list.includes(v);

    /* ##### [04] 내장 사용 함수 #################################################### */

    const loadDashboard = async () => {
      uiState.loading = true;
      try {
        const startYmd = (filters.startDt || '').replace(/-/g, '');
        const endYmd   = (filters.endDt   || '').replace(/-/g, '');
        const items = COMP_IDS.map(compId => ({ compId, uiNm: 'DashboardBoEc01', startYmd, endYmd }));
        const res = await boApiSvc.cmDashboard.getData(items, '대시보드', '조회');
        const d = res.data?.data || {};
        Object.keys(dash).forEach(k => { dash[k] = d[k] || []; });
      } catch (err) {
        console.error('[대시보드 조회 오류]', err);
      } finally {
        uiState.loading = false;
      }
    };

    const onSearch = () => loadDashboard();

    const onReset = () => {
      filters.startDt     = startDef;
      filters.endDt       = endDef;
      filters.channels    = [...CHANNELS];
      filters.ages        = [...AGES];
      filters.genders     = [...GENDERS];
      filters.memberTypes = [...MEMBER_TYPES];
      filters.categories  = [...CATEGORIES];
      loadDashboard();
    };

    const doExcelDownload = () => {
      const labels = dash.info0101.map(r => r.col1Nm || '');
      const rows   = [['월','매출','가입','탈퇴','클릭','주문완료']];
      labels.forEach((m, i) => {
        rows.push([
          m,
          dash.info0101[i]?.col1Num || 0,
          dash.info0102[i]?.col1Num || 0,
          dash.info0102[i]?.col2Num || 0,
          dash.info0103[i]?.col1Num || 0,
          dash.info0104[i]?.col1Num || 0,
        ]);
      });
      const csv  = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = coUtil.cofBuildExportFilename('대시보드.csv'); a.click();
      URL.revokeObjectURL(url);
    };

    /* ##### [05] 사용자 함수 (헬퍼 / 렌더) ########################################## */

    const cfBaseGridColumns = computed(() => {
      if (uiState.tabMode === 'tab') return '1fr';
      return 'repeat(' + parseInt(uiState.tabMode) + ',minmax(0,1fr))';
    });

    const showPanel = (key) => uiState.tabMode === 'tab' ? uiState.activeTab === key : true;

    /* 01행: 월별 추이 — col1Nm=월라벨, col1Num=값 */
    const cfMonthLabels   = computed(() => dash.info0101.map(r => r.col1Nm || ''));
    const cfMonthlySales  = computed(() => dash.info0101.map(r => r.col1Num || 0));
    const cfMonthlyJoin   = computed(() => dash.info0102.map(r => r.col1Num || 0));
    const cfMonthlyLeave  = computed(() => dash.info0102.map(r => r.col2Num || 0));
    const cfMonthlyClicks = computed(() => dash.info0103.map(r => r.col1Num || 0));
    const cfMonthlyOrders = computed(() => dash.info0104.map(r => r.col1Num || 0));

    /* 02행: 채널별 매출 — col1Nm=채널, col2Nm=월, col2Num=매출 */
    const cfChannelMonthly = computed(() => {
      const map = {};
      dash.info0201.forEach(r => {
        const ch = r.col1Nm || '';
        if (!map[ch]) map[ch] = { name: ch, color: CHANNEL_COLORS[ch] || '#999', values: {} };
        map[ch].values[r.col2Nm || ''] = r.col2Num || 0;
      });
      const months = cfMonthLabels.value;
      return Object.values(map).map(ch => ({
        name: ch.name, color: ch.color,
        values: months.map(m => ch.values[m] || 0),
      }));
    });

    /* 02행: KPI — info0202[0] 단일행 */
    const cfKpi = computed(() => dash.info0202[0] || {});
    const cfTotalSales    = computed(() => cfKpi.value.col1Num || 0);
    const cfTotalQtyComp  = computed(() => cfKpi.value.col2Num || 0);
    const marginRate      = computed(() => cfKpi.value.col3Num || 0);
    const cfAvgOrderValue = computed(() => cfKpi.value.col4Num || 0);

    /* 02행: TOP7 — col1Nm=상품명, col1Num=매출 */
    const topProducts = computed(() => dash.info0203.map(r => ({ name: r.col1Nm || '', value: r.col1Num || 0 })));

    /* 02행: 채널 비중 */
    const salesByChannel = computed(() => {
      const COLORS = ['#e8587a','#7b1fa2','#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1'];
      return dash.info0204.map((r, i) => ({ label: r.col1Nm || '', value: r.col1Num || 0, color: COLORS[i % COLORS.length] }));
    });

    /* 03행: 디바이스 비중 */
    const salesByDevice = computed(() => {
      const COLORS = ['#3b82f6','#10b981','#f59e0b','#a855f7'];
      return dash.info0301.map((r, i) => ({ label: r.col1Nm || '', value: r.col1Num || 0, color: COLORS[i % COLORS.length] }));
    });

    /* 03행: 시간대 비중 */
    const salesByTime = computed(() => {
      const COLORS = ['#fbbf24','#f97316','#e8587a','#6366f1'];
      return dash.info0302.map((r, i) => ({ label: r.col1Nm || '', value: r.col1Num || 0, color: COLORS[i % COLORS.length] }));
    });

    /* 03행: 지역별 매출 */
    const regionSales = computed(() => dash.info0303.map(r => ({ name: r.col1Nm || '', value: r.col1Num || 0 })));

    /* 03행: 24H 추이 — col1Num 배열 */
    const hourlyTrend = computed(() => dash.info0304.map(r => r.col1Num || 0));

    /* 04행: 레이더 — col1Nm=지표명, col1Num=현재, col2Num=목표 */
    const radarValues = computed(() => dash.info0401.map(r => ({ label: r.col1Nm || '', value: r.col1Num || 0 })));

    const cfRadarPath = computed(() => {
      const cx = 100, cy = 100, R = 70;
      const rv = radarValues.value;
      if (!rv.length) return '';
      return rv.map((v, i) => {
        const a = (i / rv.length) * Math.PI * 2 - Math.PI / 2;
        const r = (v.value / 100) * R;
        return ((cx + r * Math.cos(a)).toFixed(1)) + ',' + ((cy + r * Math.sin(a)).toFixed(1));
      }).join(' ');
    });

    const cfRadarAxes = computed(() => {
      const cx = 100, cy = 100, R = 70;
      const rv = radarValues.value;
      if (!rv.length) return [];
      return rv.map((v, i) => {
        const a = (i / rv.length) * Math.PI * 2 - Math.PI / 2;
        return {
          x2: (cx + R * Math.cos(a)).toFixed(1),
          y2: (cy + R * Math.sin(a)).toFixed(1),
          lx: (cx + (R + 12) * Math.cos(a)).toFixed(1),
          ly: (cy + (R + 12) * Math.sin(a)).toFixed(1),
          label: v.label,
        };
      });
    });

    /* 04행: 경제수준 — col1Nm=월, col1Num=상위, col2Num=중위, col3Num=하위 */
    const economySales = computed(() => ({
      labels: dash.info0402.map(r => r.col1Nm || ''),
      high:   dash.info0402.map(r => r.col1Num || 0),
      middle: dash.info0402.map(r => r.col2Num || 0),
      low:    dash.info0402.map(r => r.col3Num || 0),
    }));

    /* 04행: 배송 조건 */
    const shippingTypes = computed(() => {
      const COLORS = ['#10b981','#9ca3af','#3b82f6','#f59e0b'];
      return dash.info0403.map((r, i) => ({ label: r.col1Nm || '', value: r.col1Num || 0, color: COLORS[i % COLORS.length] }));
    });

    const pct = n => (Math.round(n * 10) / 10).toFixed(1) + '%';

    /* ##### [06] return (템플릿 노출) ############################################## */

    onMounted(() => loadDashboard());

    return {
      uiState, filters,
      handleBtnAction, handleSelectAction,
      cfBaseGridColumns, cfMonthLabels,
      cfMonthlySales, cfMonthlyJoin, cfMonthlyLeave,
      cfMonthlyClicks, cfMonthlyOrders, cfChannelMonthly,
      cfTotalSales, cfTotalQtyComp, marginRate, cfAvgOrderValue,
      cfRadarPath, cfRadarAxes,
      topProducts, salesByChannel, salesByDevice, salesByTime,
      regionSales, hourlyTrend, economySales, shippingTypes,
      TABS, VIEW_MODES, CHANNELS, AGES, GENDERS, MEMBER_TYPES, CATEGORIES,
      fmt, pct, isSel, showPanel,
      linePoints, areaPath, maxOf,
    };
  },

    template: /* html */`
<div :class="(uiState.tabMode==='3col'||uiState.tabMode==='4col') ? 'dash-wide' : 'bo-wrap'">
  <!-- ===== ■. 헤더 ====================================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%);border-radius:10px;color:#fff;">
    <div style="width:6px;height:24px;background:#e8587a;border-radius:3px;">
    </div>
    <span style="font-size:17px;font-weight:800;letter-spacing:-0.5px;">
      온라인 쇼핑몰 매출 및 판매현황
    </span>
    <span style="flex:1;">
    </span>
    <span style="font-size:11px;color:#aaa;">
      14개월 기준 · {{ cfMonthLabels.length > 0 ? (cfMonthLabels[0] + ' ~ ' + cfMonthLabels[cfMonthLabels.length-1]) : '-' }}
    </span>
  </div>
  <!-- ===== □. 본문 영역 =================================================== -->
  <!-- ===== ■. 필터 바: 조회기간 + 상세필터 토글 ==================================== -->
  <!-- ===== ■. 카드 영역 =================================================== -->
  <bo-container card-style="padding:12px 14px;margin-bottom:14px;" body-style="display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:#666;width:74px;">
        조회기간
      </span>
      <input type="date" v-model="filters.startDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <span style="color:#999;">
        ~
      </span>
      <input type="date" v-model="filters.endDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <button class="btn_filter_toggle" @click="handleBtnAction('filters-toggleExpand')"
        style="font-size:11px;padding:4px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fafbfc;color:#555;">
        {{ uiState.filterExpand ? '▲ 상세필터 접기' : '▼ 상세필터 펼치기' }}
      </button>
      <span style="flex:1;">
      </span>
      <button class="btn btn_search" @click="handleBtnAction('filters-search')" style="font-size:11px;">
        🔍 검색
      </button>
      <button class="btn btn_excel" @click="handleBtnAction('stats-excel')" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;">
        📥 엑셀다운로드
      </button>
      <button class="btn btn_reset" @click="handleBtnAction('filters-reset')" style="font-size:11px;">
        🔄 초기화
      </button>
    </div>
    <div v-if="uiState.filterExpand" style="display:flex;flex-direction:column;gap:8px;border-top:1px dashed #eee;padding-top:10px;">
      <div v-for="grp in [
        {key:'channels',    label:'판매채널',  all:CHANNELS},
        {key:'ages',        label:'나이대',    all:AGES},
        {key:'genders',     label:'성별',      all:GENDERS},
        {key:'memberTypes', label:'회원유형',  all:MEMBER_TYPES},
        {key:'categories',  label:'카테고리',  all:CATEGORIES},
        ]" :key="grp.key" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#666;width:74px;">
          {{ grp.label }}
        </span>
        <button @click="handleBtnAction('filters-toggleAll', { key: grp.key, all: grp.all })"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',
          background: filters[grp.key].length===grp.all.length ? '#1a1a2e' : '#fff',
          color:       filters[grp.key].length===grp.all.length ? '#fff'    : '#555',
          borderColor: filters[grp.key].length===grp.all.length ? '#1a1a2e' : '#ddd'}">
          전체
        </button>
        <button v-for="v in grp.all" :key="v" @click="handleBtnAction('filters-toggle', { key: grp.key, v })"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',
          background: isSel(filters[grp.key], v) ? '#fff0f4' : '#fafbfc',
          color:       isSel(filters[grp.key], v) ? '#e8587a' : '#888',
          borderColor: isSel(filters[grp.key], v) ? '#e8587a' : '#e5e7eb',
          fontWeight:  isSel(filters[grp.key], v) ? 700 : 400}">
          {{ v }}
        </button>
      </div>
    </div>
  </bo-container>
  <!-- ===== □. 카드 영역 =================================================== -->
  <!-- ===== ■. 탭 바 + 뷰모드 =============================================== -->
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <div class="tab-nav" style="margin-bottom:0;flex:1;flex-wrap:wrap;">
      <button v-for="t in TABS" :key="t.key" class="tab-btn" :class="{active: uiState.activeTab===t.key ? uiState.tabMode==='tab' : false}" :disabled="uiState.tabMode!=='tab'" @click="handleSelectAction('tabs-select', t.key)" :style="uiState.tabMode!=='tab' ? 'opacity:0.4;cursor:not-allowed;' : ''">
      <span style="margin-right:4px;">
        {{ t.icon }}
      </span>
      {{ t.label }}
    </button>
  </div>
  <div style="display:flex;gap:4px;background:#fff;padding:4px;border:1px solid #eef0f3;border-radius:8px;flex-shrink:0;">
    <button v-for="vm in VIEW_MODES" :key="vm.key" @click="handleSelectAction('tabMode-set', vm.key)"
        :title="vm.label+'로 보기'"
        :style="{fontSize:'11px',padding:'4px 8px',borderRadius:'5px',border:'none',cursor:'pointer',minWidth:'34px',
        background: uiState.tabMode===vm.key ? '#fff0f4' : 'transparent',
        color:       uiState.tabMode===vm.key ? '#e8587a' : '#888',
        fontWeight:  uiState.tabMode===vm.key ? 700 : 400}">
      {{ vm.icon }}
    </button>
  </div>
</div>
<!-- ===== □. 본문 영역 =================================================== -->
<!-- ===== ■. 탭 컨텐츠: 뷰모드에 따라 grid ===================================== -->
<!-- ===== ■. 영역 ====================================================== -->
<div :style="{display:'grid',gridTemplateColumns:cfBaseGridColumns,gap:'12px'}">
  <!-- ===== ■.■. 1) 월별 매출현황 ============================================ -->
  <bo-container v-show="showPanel('sales')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      💰
      <span>
        월별 매출현황 (14개월)
      </span>
      <span style="flex:1;">
      </span>
      <span style="font-size:11px;color:#888;font-weight:500;">
        총 {{ fmt(cfMonthlySales.reduce((a,b)=>a+b,0)) }}원
      </span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradSales" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#e8587a"/>
          <stop offset="100%" stop-color="#ff8aa5"/>
        </lineargradient>
      </defs>
      <g v-for="(v,i) in cfMonthlySales" :key="i">
        <rect :x="20 + i*(760/cfMonthLabels.length)" :y="230 - (v/maxOf(cfMonthlySales))*210"
            :width="760/cfMonthLabels.length - 6" :height="(v/maxOf(cfMonthlySales))*210"
            fill="url(#gradSales)" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in cfMonthLabels" :key="m" style="flex:1;text-align:center;">
        {{ m.slice(2) }}
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 1) 월별 매출현황 ============================================ -->
  <!-- ===== ■.■. 2) 월별 고객 가입/탈퇴 현황 ===================================== -->
  <bo-container v-show="showPanel('member')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      👥
      <!-- ===== ■.■.■.■. 영역 ================================================ -->
      <span>
        월별 고객 가입/탈퇴자 현황 (14개월)
      </span>
      <span style="flex:1;">
      </span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#666;">
        <span style="width:10px;height:10px;background:#3b82f6;border-radius:2px;">
        </span>
        가입 {{ fmt(cfMonthlyJoin.reduce((a,b)=>a+b,0)) }}
      </span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#666;margin-left:10px;">
        <span style="width:10px;height:10px;background:#ef4444;border-radius:2px;">
        </span>
        탈퇴 {{ fmt(cfMonthlyLeave.reduce((a,b)=>a+b,0)) }}
      </span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <g v-for="(v,i) in cfMonthlyJoin" :key="i">
        <rect :x="22 + i*(760/cfMonthLabels.length)" :y="230 - (v/maxOf([...cfMonthlyJoin,...cfMonthlyLeave]))*210"
            :width="(760/cfMonthLabels.length - 8)/2" :height="(v/maxOf([...cfMonthlyJoin,...cfMonthlyLeave]))*210"
            fill="#3b82f6" rx="2" />
        <rect :x="22 + i*(760/cfMonthLabels.length) + (760/cfMonthLabels.length - 8)/2 + 2" :y="230 - (cfMonthlyLeave[i]/maxOf([...cfMonthlyJoin,...cfMonthlyLeave]))*210"
            :width="(760/cfMonthLabels.length - 8)/2" :height="(cfMonthlyLeave[i]/maxOf([...cfMonthlyJoin,...cfMonthlyLeave]))*210"
            fill="#ef4444" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in cfMonthLabels" :key="m" style="flex:1;text-align:center;">
        {{ m.slice(2) }}
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 2) 월별 고객 가입/탈퇴 현황 ===================================== -->
  <!-- ===== ■.■. 3) 월별 상품상세 클릭 현황 ====================================== -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('click')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      🖱
      <span>
        월별 상품상세 클릭 현황 (14개월)
      </span>
      <span style="flex:1;">
      </span>
      <span style="font-size:11px;color:#888;font-weight:500;">
        총 {{ fmt(cfMonthlyClicks.reduce((a,b)=>a+b,0)) }}회
      </span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradClicks" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.02"/>
        </lineargradient>
      </defs>
      <path :d="areaPath(cfMonthlyClicks, 800, 240, 20)" fill="url(#gradClicks)" />
      <polyline :points="linePoints(cfMonthlyClicks, 800, 240, 20)" fill="none" stroke="#10b981" stroke-width="2.5" />
      <template v-for="(v,i) in cfMonthlyClicks" :key="i">
        <circle :cx="20 + (i/(cfMonthlyClicks.length-1))*760" :cy="240-20-(v/maxOf(cfMonthlyClicks))*(240-40)" r="3.5" fill="#10b981" stroke="#fff" stroke-width="1.5"/>
      </template>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in cfMonthLabels" :key="m" style="flex:1;text-align:center;">
        {{ m.slice(2) }}
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 조건부 카드 ================================================ -->
  <!-- ===== ■.■. 4) 월별 주문완료 현황 ========================================= -->
  <bo-container v-show="showPanel('order')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      📋
      <span>
        월별 주문완료 현황 (14개월)
      </span>
      <!-- ===== ■.■.■.■. 영역 ================================================ -->
      <span style="flex:1;">
      </span>
      <span style="font-size:11px;color:#888;font-weight:500;">
        총 {{ fmt(cfMonthlyOrders.reduce((a,b)=>a+b,0)) }}건
      </span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradOrder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7b1fa2"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </lineargradient>
      </defs>
      <g v-for="(v,i) in cfMonthlyOrders" :key="i">
        <rect :x="20 + i*(760/cfMonthLabels.length)" :y="230 - (v/maxOf(cfMonthlyOrders))*210"
            :width="760/cfMonthLabels.length - 6" :height="(v/maxOf(cfMonthlyOrders))*210"
            fill="url(#gradOrder)" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in cfMonthLabels" :key="m" style="flex:1;text-align:center;">
        {{ m.slice(2) }}
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 4) 월별 주문완료 현황 ========================================= -->
  <!-- ===== ■.■. 5) 월별 판매채널별 매출 ======================================== -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('channel')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      📺
      <span>
        월별 판매채널별 매출현황 (14개월)
      </span>
      <span style="flex:1;">
      </span>
      <span style="font-size:11px;color:#888;font-weight:500;">
        {{ cfChannelMonthly.length }}개 채널
      </span>
    </div>
    <svg viewBox="0 0 800 260" style="width:100%;height:260px;">
      <template v-for="(ch, ci) in cfChannelMonthly" :key="ch.name">
        <polyline :points="linePoints(ch.values, 800, 260, 20)" fill="none" :stroke="ch.color" stroke-width="2" opacity="0.85" />
      </template>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin:4px 0 10px;">
      <span v-for="m in cfMonthLabels" :key="m" style="flex:1;text-align:center;">
        {{ m.slice(2) }}
      </span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;">
      <span v-for="ch in cfChannelMonthly" :key="ch.name" style="display:inline-flex;align-items:center;gap:5px;">
        <span :style="{width:'12px',height:'3px',background:ch.color,borderRadius:'2px'}">
        </span>
        <span style="color:#555;">
          {{ ch.name }}
        </span>
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 조건부 카드 ================================================ -->
  <!-- ===== ■.■. 6) 핵심지표 KPI =========================================== -->
  <bo-container v-show="showPanel('kpi')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      🎯 핵심지표
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div v-for="kpi in [
          {label:'전체 매출현황', value:fmt(cfTotalSales), unit:'원', color:'#e8587a', icon:'💰', bg:'#fff0f4'},
          {label:'전체 구매수량', value:fmt(cfTotalQtyComp), unit:'건', color:'#3b82f6', icon:'🛒', bg:'#eff6ff'},
          {label:'평균 마진율',   value:pct(marginRate), unit:'',   color:'#10b981', icon:'📈', bg:'#f0fdf4'},
          {label:'평균 결제금액', value:fmt(cfAvgOrderValue), unit:'원', color:'#f59e0b', icon:'💳', bg:'#fffbeb'},
          ]" :key="kpi.label"
          :style="{background:kpi.bg,border:'1px solid #eef0f3',borderRadius:'8px',padding:'12px',display:'flex',alignItems:'center',gap:'10px'}">
        <div :style="{fontSize:'22px',width:'36px',height:'36px',borderRadius:'8px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}">
          {{ kpi.icon }}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10.5px;color:#666;font-weight:600;">
            {{ kpi.label }}
          </div>
          <div :style="{fontSize:'15px',fontWeight:800,color:kpi.color,marginTop:'2px'}">
            {{ kpi.value }}
            <span style="font-size:10px;margin-left:2px;color:#999;">
              {{ kpi.unit }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </bo-container>
  <!-- ===== □.□. 6) 핵심지표 KPI =========================================== -->
  <!-- ===== ■.■. 7) 상품 TOP 7 =========================================== -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('topProducts')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      📦 상품별 매출 TOP 7
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div v-for="(p,i) in topProducts" :key="p.name" style="display:flex;align-items:center;gap:8px;font-size:11.5px;">
        <span style="width:140px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          {{ i+1 }}. {{ p.name }}
        </span>
        <div style="flex:1;height:12px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
          <div :style="{width:((p.value/topProducts.reduce((m,x)=>Math.max(m,x.value),0))*100)+'%',height:'100%',background:'linear-gradient(90deg,#7b1fa2,#e8587a)'}">
          </div>
        </div>
        <span style="color:#666;font-weight:600;min-width:80px;text-align:right;">
          {{ fmt(p.value) }}원
        </span>
      </div>
    </div>
  </bo-container>
  <!-- ===== □.□. 조건부 카드 ================================================ -->
  <!-- ===== ■.■. 8~10) 도넛 3개 (채널/디바이스/시간대) ============================= -->
  <bo-container v-for="d in [
      {key:'channelMix', title:'📱 판매 채널별',  data:salesByChannel},
      {key:'deviceMix',  title:'💻 디바이스별',   data:salesByDevice},
      {key:'timeMix',    title:'⏰ 시간대별',     data:salesByTime},
      ]" :key="d.key" v-show="showPanel(d.key)" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      {{ d.title }}
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <svg viewBox="0 0 100 100" style="width:100px;height:100px;flex-shrink:0;">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" stroke-width="14"/>
        <template v-for="(s,si) in d.data" :key="si">
          <circle cx="50" cy="50" r="38" fill="none" :stroke="s.color" stroke-width="14"
              :stroke-dasharray="(s.value/100*238.76)+' 238.76'"
              :stroke-dashoffset="-(d.data.slice(0,si).reduce((a,b)=>a+b.value,0)/100*238.76)"
              transform="rotate(-90 50 50)" />
        </template>
      </svg>
      <!-- ===== ■.■.■.■. 영역 ================================================ -->
      <div style="flex:1;display:flex;flex-direction:column;gap:3px;font-size:11px;">
        <div v-for="s in d.data" :key="s.label" style="display:flex;align-items:center;gap:6px;">
          <span :style="{width:'10px',height:'10px',borderRadius:'2px',background:s.color}">
          </span>
          <span style="flex:1;color:#555;">
            {{ s.label }}
          </span>
          <span style="font-weight:700;color:#333;">
            {{ s.value }}%
          </span>
        </div>
      </div>
    </div>
  </bo-container>
  <!-- ===== □.□. 8~10) 도넛 3개 (채널/디바이스/시간대) ============================= -->
  <!-- ===== ■.■. 11) 지역별 =============================================== -->
  <bo-container v-show="showPanel('region')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      🗺 지역별 매출현황
    </div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div v-for="r in regionSales" :key="r.name" style="display:flex;align-items:center;gap:6px;font-size:11px;">
        <span style="width:34px;color:#555;">
          {{ r.name }}
        </span>
        <div style="flex:1;height:14px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
          <div :style="{width:((r.value/regionSales[0].value)*100)+'%',height:'100%',background:'#3b82f6'}">
          </div>
        </div>
        <span style="color:#666;min-width:70px;text-align:right;">
          {{ fmt(r.value) }}
        </span>
      </div>
    </div>
  </bo-container>
  <!-- ===== □.□. 11) 지역별 =============================================== -->
  <!-- ===== ■.■. 12) 시간대 추이 ============================================ -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('hourly')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      ⏱ 시간대별 주문 추이 (24H)
    </div>
    <svg viewBox="0 0 420 140" style="width:100%;height:140px;">
      <polyline :points="linePoints(hourlyTrend, 420, 140, 10)" fill="none" stroke="#10b981" stroke-width="2" />
      <template v-for="(v,i) in hourlyTrend" :key="i">
        <circle :cx="10+(i/(hourlyTrend.length-1))*400" :cy="140-10-(v/Math.max(...hourlyTrend))*120" r="2.5" fill="#10b981" />
      </template>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:4px;">
      <span>
        00
      </span>
      <span>
        06
      </span>
      <span>
        12
      </span>
      <span>
        18
      </span>
      <span>
        23
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 조건부 카드 ================================================ -->
  <!-- ===== ■.■. 13) 영업지표 레이더 ========================================== -->
  <bo-container v-show="showPanel('radar')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      ⚡ 영업 지표 비교
    </div>
    <svg viewBox="0 0 200 200" style="width:100%;height:200px;">
      <polygon points="100,30 160,70 140,150 60,150 40,70" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <polygon points="100,50 145,80 128,140 72,140 55,80" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <polygon points="100,70 130,90 117,130 83,130 70,90" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <line v-for="(a,ai) in cfRadarAxes" :key="ai" x1="100" y1="100" :x2="a.x2" :y2="a.y2" stroke="#e5e7eb" stroke-width="1"/>
      <polygon :points="cfRadarPath" fill="rgba(232,88,122,0.25)" stroke="#e8587a" stroke-width="2"/>
      <text v-for="(a,ai) in cfRadarAxes" :key="'l'+ai" :x="a.lx" :y="a.ly" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#555">
        {{ a.label }}
      </text>
    </svg>
  </bo-container>
  <!-- ===== □.□. 13) 영업지표 레이더 ========================================== -->
  <!-- ===== ■.■. 14) 경제 수준별 ============================================ -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('economy')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      💼 경제 수준별 매출현황
    </div>
    <svg viewBox="0 0 480 160" style="width:100%;height:160px;">
      <path :d="areaPath(economySales.high,   480, 160, 10)" fill="rgba(123,31,162,0.35)" stroke="#7b1fa2" stroke-width="1.5"/>
      <path :d="areaPath(economySales.middle, 480, 160, 10)" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="1.5"/>
      <path :d="areaPath(economySales.low,    480, 160, 10)" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="1.5"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:4px;padding:0 10px;">
      <span v-for="m in economySales.labels" :key="m">
        {{ m }}
      </span>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:10.5px;flex-wrap:wrap;">
      <span style="display:inline-flex;align-items:center;gap:4px;">
        <span style="width:10px;height:10px;background:#7b1fa2;border-radius:2px;">
        </span>
        상위
      </span>
      <span style="display:inline-flex;align-items:center;gap:4px;">
        <span style="width:10px;height:10px;background:#3b82f6;border-radius:2px;">
        </span>
        중위
      </span>
      <span style="display:inline-flex;align-items:center;gap:4px;">
        <span style="width:10px;height:10px;background:#10b981;border-radius:2px;">
        </span>
        하위
      </span>
    </div>
  </bo-container>
  <!-- ===== □.□. 조건부 카드 ================================================ -->
  <!-- ===== ■.■. 15) 배송 조건별 ============================================ -->
  <!-- ===== ■.■. 조건부 카드 ================================================ -->
  <bo-container v-show="showPanel('shipping')" card-style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">
      🚚 배송 조건별 매출현황
    </div>
    <div style="display:flex;gap:14px;align-items:center;padding:8px 0;">
      <svg viewBox="0 0 100 100" style="width:100px;height:100px;flex-shrink:0;">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" stroke-width="14"/>
        <template v-for="(s,si) in shippingTypes" :key="si">
          <circle cx="50" cy="50" r="38" fill="none" :stroke="s.color" stroke-width="14"
              :stroke-dasharray="(s.value/100*238.76)+' 238.76'"
              :stroke-dashoffset="-(shippingTypes.slice(0,si).reduce((a,b)=>a+b.value,0)/100*238.76)"
              transform="rotate(-90 50 50)" />
        </template>
      </svg>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;font-size:12px;">
        <div v-for="s in shippingTypes" :key="s.label" style="display:flex;align-items:center;gap:6px;">
          <span :style="{width:'12px',height:'12px',borderRadius:'2px',background:s.color}">
          </span>
          <span style="flex:1;color:#555;">
            {{ s.label }}배송
          </span>
          <span style="font-weight:800;color:#333;">
            {{ s.value }}%
          </span>
        </div>
      </div>
    </div>
  </bo-container>
</div>
<!-- ===== □.□. 조건부 카드 ================================================ -->
<!-- ===== □. 영역 ====================================================== -->
<!-- ===== ■. /탭 그리드 ================================================== -->
</div>
`,
};
