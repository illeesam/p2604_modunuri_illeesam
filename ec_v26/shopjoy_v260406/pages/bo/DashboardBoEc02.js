/* ShopJoy Admin - EC 醫낇빀 ??쒕낫??(ECharts 湲곕컲, 14媛쒖썡 ?꾪솴 + X-View ?덊듃留? */
window.DashboardBoEc02 = {
  name: 'DashboardBoEc02',
  props: {
    navigate: { type: Function, required: true },
  },
  setup() {

    /* ##### [01] 珥덇린 蹂???뺤쓽 ################################################## */

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;
    const fmt      = coUtil.cofFmt;
    const toYmd    = coUtil.cofToYmd;
    const addMonths   = coUtil.cofAddMonths;
    const endOfMonth  = coUtil.cofEndOfMonth;

    const today    = new Date();
    const endDef   = toYmd(endOfMonth(today));
    const startDef = toYmd(new Date(addMonths(today, -13).getFullYear(), addMonths(today, -13).getMonth(), 1));

    const CHANNELS      = ['?먯궗紐?,'?ㅼ씠踰??ㅻ쭏?몄뒪?좎뼱','荑좏뙜','11踰덇?','G留덉폆','Auction','GS??,'TMON','?꾨찓??,'濡?뜲??,'?덉븻?쇳븨','?꾨?H紐?];
    const AGES          = ['10?','20?','30?','40?','50?','60?+'];
    const GENDERS       = ['??,'??];
    const MEMBER_TYPES  = ['?쇰컲','VIP','VVIP','?대㈃','?덊눜'];
    const CATEGORIES    = ['?⑥뀡?섎쪟','?⑥뀡?≫솕','酉고떚','媛??,'?앺뭹','媛援?,'由щ튃','?ㅽ룷痢?,'?꾩꽌','湲고?'];

    const CHANNEL_COLORS = {
      '?먯궗紐?:'#e8587a','?ㅼ씠踰??ㅻ쭏?몄뒪?좎뼱':'#10b981','荑좏뙜':'#ef4444','11踰덇?':'#f97316',
      'G留덉폆':'#3b82f6','Auction':'#6366f1','GS??:'#a855f7','TMON':'#e11d48',
      '?꾨찓??:'#f59e0b','濡?뜲??:'#9333ea','?덉븻?쇳븨':'#0891b2','?꾨?H紐?:'#c2410c',
    };

    const filters = reactive({
      startDt: startDef, endDt: endDef,
      channels: [...CHANNELS], ages: [...AGES],
      genders: [...GENDERS], memberTypes: [...MEMBER_TYPES], categories: [...CATEGORIES],
    });

    const uiState = reactive({
      filterExpand: false, activeTab: 'sales', tabMode: '4col', loading: false,
      xviewDrillRows: [], xviewDrillVisible: false,
    });

    const COMP_IDS = [
      'COMP0101','COMP0102','COMP0103','COMP0104',
      'COMP0201','COMP0202','COMP0203','COMP0204',
      'COMP0301','COMP0302','COMP0303','COMP0304',
      'COMP0401','COMP0402','COMP0403',
    ];

    const dash = reactive({
      info0101:[], info0102:[], info0103:[], info0104:[],
      info0201:[], info0202:[], info0203:[], info0204:[],
      info0301:[], info0302:[], info0303:[], info0304:[],
      info0401:[], info0402:[], info0403:[],
    });

    const TABS = [
      { key:'sales',       label:'?붾퀎 留ㅼ텧',       icon:'?뮥' },
      { key:'member',      label:'媛???덊눜',        icon:'?뫁' },
      { key:'click',       label:'?곹뭹?곸꽭 ?대┃',    icon:'?뼮' },
      { key:'order',       label:'二쇰Ц?꾨즺',         icon:'?뱥' },
      { key:'channel',     label:'?먮ℓ梨꾨꼸蹂?留ㅼ텧',  icon:'?벟' },
      { key:'kpi',         label:'?듭떖吏??,         icon:'?렞' },
      { key:'topProducts', label:'?곹뭹 TOP 7',       icon:'?벀' },
      { key:'channelMix',  label:'梨꾨꼸 鍮꾩쨷',        icon:'?벑' },
      { key:'deviceMix',   label:'?붾컮?댁뒪 鍮꾩쨷',    icon:'?뮲' },
      { key:'timeMix',     label:'?쒓컙? 鍮꾩쨷',      icon:'?? },
      { key:'region',      label:'吏??퀎',           icon:'?뿺' },
      { key:'hourly',      label:'?쒓컙? 異붿씠',      icon:'?? },
      { key:'radar',       label:'?곸뾽吏??,         icon:'?? },
      { key:'economy',     label:'寃쎌젣 ?섏?蹂?,      icon:'?뮳' },
      { key:'shipping',    label:'諛곗넚 議곌굔',        icon:'?슊' },
      { key:'xview',       label:'X-View',           icon:'?뵦' },
    ];

    const VIEW_MODES = [
      { key:'tab',  icon:'?뱫', label:'?? },
      { key:'1col', icon:'??,  label:'1?? },
      { key:'2col', icon:'??뼪', label:'2?? },
      { key:'3col', icon:'??뼪??, label:'3?? },
      { key:'4col', icon:'??뼪??뼪', label:'4?? },
    ];

    /* ##### [02] ?≪뀡 紐⑥쓬 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'filters-search')            return onSearch();
      if (cmd === 'filters-reset')             return onReset();
      if (cmd === 'stats-excel')               return doExcelDownload();
      if (cmd === 'filters-toggleExpand')      { uiState.filterExpand = !uiState.filterExpand; return; }
      if (cmd === 'filters-toggleAll')         return toggleAll(param.key, param.all);
      if (cmd === 'filters-toggle')            return toggle(filters[param.key], param.v);
      if (cmd === 'xview-drill-close')         { uiState.xviewDrillVisible = false; return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    const handleSelectAction = (cmd, param = {}) => {
      if (cmd === 'tabs-select')  { if (uiState.tabMode === 'tab') uiState.activeTab = param; return; }
      if (cmd === 'tabMode-set')  { uiState.tabMode = param; return; }
      console.warn('[handleSelectAction] unknown cmd:', cmd);
    };

    const toggle    = (list, v) => { const i = list.indexOf(v); if (i >= 0) list.splice(i, 1); else list.push(v); };
    const toggleAll = (key, all) => { filters[key] = filters[key].length === all.length ? [] : [...all]; };
    const isSel     = (list, v) => list.includes(v);

    /* ##### [04] ?댁옣 ?ъ슜 ?⑥닔 #################################################### */

    const MOCK_YMD  = ['20250501','20250601','20250701','20250801','20250901','20251001','20251101','20251201','20260101','20260201','20260301','20260401','20260501','20260601'];
    const MOCK_LBL  = ['25-05','25-06','25-07','25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05','26-06'];
    const MOCK_SALES  = [98200000,112500000,134700000,128300000,119600000,142000000,155800000,187400000,141200000,128700000,138900000,151200000,172800000,140372550];
    const MOCK_JOIN   = [312,428,387,465,398,512,488,621,401,356,419,487,552,370];
    const MOCK_LEAVE  = [87,102,94,118,109,131,125,153,111,98,107,128,142,95];
    const MOCK_CLICK  = [28400,33200,41100,38700,35900,44200,47600,59300,42100,37800,41500,46900,53200,40772];
    const MOCK_ORDER  = [1820,2150,2690,2530,2380,2870,3020,3810,2740,2490,2680,3010,3420,2540];
    const MOCK_CH_CODES = ['?먯궗紐?,'?ㅼ씠踰??ㅻ쭏?몄뒪?좎뼱','荑좏뙜','11踰덇?','G留덉폆','Auction','GS??,'TMON','?꾨찓??,'濡?뜲??,'?덉븻?쇳븨','?꾨?H紐?];
    const MOCK_CH_BASE  = [38,22,14,9,6,4,2,1.5,1.2,1,0.8,0.5];

    const buildMock = () => {
      const r = {};
      r.info0101 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: MOCK_SALES[i] }));
      r.info0102 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: MOCK_JOIN[i], col2Nm: MOCK_LBL[i], col2Num: MOCK_LEAVE[i] }));
      r.info0103 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: MOCK_CLICK[i] }));
      r.info0104 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: MOCK_ORDER[i] }));
      r.info0201 = [];
      MOCK_CH_CODES.forEach((ch, ci) => {
        MOCK_YMD.forEach((d, mi) => {
          r.info0201.push({ col1Nm: ch, col2Nm: MOCK_LBL[mi], col2Num: Math.round(MOCK_SALES[mi] * MOCK_CH_BASE[ci] / 100) });
        });
      });
      r.info0202 = [{ col1Nm:'珥?留ㅼ텧?꾪솴', col1Num:1951772550, col2Nm:'珥?援щℓ?섎웾', col2Num:30033, col3Nm:'?됯퇏 留덉쭊??, col3Num:7.7, col4Nm:'?됯퇏 寃곗젣湲덉븸', col4Num:64988 }];
      r.info0203 = [
        { col1Nm:'??釉붾젋??肄뷀듃',       col1Num:59500000 },
        { col1Nm:'湲濡쒕쾶 誘몃뵒 ?쒕젅??,   col1Num:42300000 },
        { col1Nm:'?щ┝???곕떂 吏?,       col1Num:38900000 },
        { col1Nm:'移닿퀬 ??대뱶 ?ъ툩',     col1Num:31200000 },
        { col1Nm:'罹먯떆誘몄뼱 ?덊듃 ?ㅼ썾??, col1Num:27500000 },
        { col1Nm:'?ㅻ쾭?ъ씠利?肄뷀듃',      col1Num:24100000 },
        { col1Nm:'?ㅽ듃?쇱씠???곗뀛痢?,    col1Num:19800000 },
      ];
      r.info0204 = [
        { col1Nm:'?먯궗紐?, col1Num:48 }, { col1Nm:'?ㅼ씠踰??ㅻ쭏?몄뒪?좎뼱', col1Num:22 },
        { col1Nm:'荑좏뙜', col1Num:14 }, { col1Nm:'11踰덇?', col1Num:9 },
        { col1Nm:'G留덉폆', col1Num:4 }, { col1Nm:'Auction', col1Num:2 }, { col1Nm:'湲고?', col1Num:1 },
      ];
      r.info0301 = [{ col1Nm:'Mobile', col1Num:58 }, { col1Nm:'Desktop', col1Num:32 }, { col1Nm:'Tablet', col1Num:10 }];
      r.info0302 = [{ col1Nm:'?꾩묠 (06-12)', col1Num:15 }, { col1Nm:'?먯떖 (12-18)', col1Num:22 }, { col1Nm:'???(18-24)', col1Num:38 }, { col1Nm:'?쇨컙 (00-06)', col1Num:25 }];
      r.info0303 = [
        { col1Nm:'?쒖슱', col1Num:58000000 }, { col1Nm:'寃쎄린', col1Num:42000000 },
        { col1Nm:'遺??, col1Num:21000000 }, { col1Nm:'?몄쿇', col1Num:16000000 },
        { col1Nm:'?援?, col1Num:12000000 }, { col1Nm:'愿묒＜', col1Num:9000000 },
        { col1Nm:'???, col1Num:8500000 },  { col1Nm:'湲고?', col1Num:6000000 },
      ];
      const hourly = [42,28,19,14,11,13,21,38,65,89,102,118,135,128,119,124,138,156,187,212,198,176,143,87];
      r.info0304 = hourly.map((v,i) => ({ col1Nm: String(i).padStart(2,'0'), col1Num: v }));
      r.info0401 = [
        { col1Nm:'留ㅼ텧?깆옣', col1Num:78 }, { col1Nm:'怨좉컼留뚯”', col1Num:82 },
        { col1Nm:'?ш뎄留ㅼ쑉', col1Num:65 }, { col1Nm:'?좉퇋怨좉컼', col1Num:55 },
        { col1Nm:'留덉쭊??,   col1Num:42 }, { col1Nm:'梨꾨꼸?뺤옣', col1Num:70 },
      ];
      const high = [42,47,52,49.5,46,55,58,71,51,47,53,57,62,40].map(v => v * 1000000);
      const mid  = [55,61,67,64,59,72,75,92,66,61,69,74,81,52].map(v => v * 1000000);
      const low  = [21.5,24,26.8,25.7,23.7,28.3,29.4,35.6,26.1,23.9,26.2,29.5,31.8,20.97].map(v => v * 1000000);
      r.info0402 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: high[i], col2Num: mid[i], col3Num: low[i] }));
      r.info0403 = [{ col1Nm:'臾대즺諛곗넚', col1Num:48 }, { col1Nm:'?좊즺諛곗넚', col1Num:27 }, { col1Nm:'議곌굔遺臾대즺', col1Num:18 }, { col1Nm:'?덈꼍諛곗넚', col1Num:7 }];
      return r;
    };

    /* X-View ?덊듃留?紐⑹뾽 ?곗씠??*/
    const buildXviewData = () => {
      const now = Date.now();
      const pts = [];
      for (let i = 0; i < 800; i++) {
        const t = now - Math.random() * 10 * 60 * 1000;
        const rt = Math.random() < 0.75
          ? Math.random() * 500
          : Math.random() < 0.7
            ? 500 + Math.random() * 2500
            : 3000 + Math.random() * 5000;
        const err = rt > 5000 && Math.random() < 0.3;
        pts.push({ t, rt: Math.round(rt), err });
      }
      return pts;
    };

    const xviewData = ref(buildXviewData());
    let xviewTimer  = null;

    /* ##### [03] ?곗씠??濡쒕뱶 ##################################################### */

    const loadDashboard = async () => {
      uiState.loading = true;
      try {
        const startYmd = (filters.startDt || '').replace(/-/g, '');
        const endYmd   = (filters.endDt   || '').replace(/-/g, '');
        const items = COMP_IDS.map(compId => ({ compId, uiNm: 'DashboardBoEc02', startYmd, endYmd }));
        const res = await boApiSvc.cmDashboard.getData(items, '??쒕낫??, '議고쉶');
        const d = res.data?.data || {};
        Object.keys(dash).forEach(k => { dash[k] = d[k] || []; });
      } catch (err) {
        console.error('[??쒕낫??議고쉶 ?ㅻ쪟]', err);
        const mock = buildMock();
        Object.keys(dash).forEach(k => { dash[k] = mock[k] || []; });
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
      const rows = [['??,'留ㅼ텧','媛??,'?덊눜','?대┃','二쇰Ц?꾨즺']];
      labels.forEach((m, i) => {
        rows.push([m, dash.info0101[i]?.col1Num||0, dash.info0102[i]?.col1Num||0, dash.info0102[i]?.col2Num||0, dash.info0103[i]?.col1Num||0, dash.info0104[i]?.col1Num||0]);
      });
      const csv  = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob(['癤? + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = coUtil.cofBuildExportFilename('??쒕낫??csv'); a.click();
      URL.revokeObjectURL(url);
    };

    /* ##### [05] ECharts option 鍮뚮뜑 ############################################# */

    const cfMonthLabels   = computed(() => dash.info0101.map(r => r.col1Nm || ''));
    const cfMonthlySales  = computed(() => dash.info0101.map(r => r.col1Num || 0));
    const cfMonthlyJoin   = computed(() => dash.info0102.map(r => r.col1Num || 0));
    const cfMonthlyLeave  = computed(() => dash.info0102.map(r => r.col2Num || 0));
    const cfMonthlyClicks = computed(() => dash.info0103.map(r => r.col1Num || 0));
    const cfMonthlyOrders = computed(() => dash.info0104.map(r => r.col1Num || 0));

    const cfKpi           = computed(() => dash.info0202[0] || {});
    const cfTotalSales    = computed(() => cfKpi.value.col1Num || 0);
    const cfTotalQtyComp  = computed(() => cfKpi.value.col2Num || 0);
    const marginRate      = computed(() => cfKpi.value.col3Num || 0);
    const cfAvgOrderValue = computed(() => cfKpi.value.col4Num || 0);
    const pct             = n => (Math.round(n * 10) / 10).toFixed(1) + '%';

    const showPanel = (key) => uiState.tabMode === 'tab' ? uiState.activeTab === key : true;
    const cfBaseGridColumns = computed(() => {
      if (uiState.tabMode === 'tab') return '1fr';
      return 'repeat(' + parseInt(uiState.tabMode) + ',minmax(0,1fr))';
    });

    const baseGrid = { top: 36, right: 16, bottom: 36, left: 60 };

    /* COMP0101 ?붾퀎 留ㅼ텧 - 留됰? */
    const cfOpt0101 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>留ㅼ텧: ' + fmt(p[0].value) + '?? },
      grid: baseGrid,
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      series: [{
        type:'bar', data: cfMonthlySales.value, barMaxWidth: 36,
        itemStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'#e8587a'},{offset:1,color:'#ff8aa5'}] }, borderRadius:[4,4,0,0] },
        emphasis: { itemStyle: { color:'#c73060' } },
      }],
    }));

    /* COMP0102 媛???덊눜 - 洹몃９ 留됰? */
    const cfOpt0102 = computed(() => ({
      tooltip: { trigger:'axis' },
      legend: { top:4, right:8, textStyle:{ fontSize:10 } },
      grid: { ...baseGrid, top:44 },
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [
        { name:'媛??, type:'bar', data: cfMonthlyJoin.value,  barMaxWidth:20, itemStyle:{ color:'#3b82f6', borderRadius:[3,3,0,0] } },
        { name:'?덊눜', type:'bar', data: cfMonthlyLeave.value, barMaxWidth:20, itemStyle:{ color:'#ef4444', borderRadius:[3,3,0,0] } },
      ],
    }));

    /* COMP0103 ?곹뭹 ?대┃ - 硫댁쟻 爰얠???*/
    const cfOpt0103 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>?대┃: ' + fmt(p[0].value) + '?? },
      grid: baseGrid,
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [{
        type:'line', data: cfMonthlyClicks.value, smooth:true, symbol:'circle', symbolSize:5,
        lineStyle:{ color:'#10b981', width:2.5 },
        itemStyle:{ color:'#10b981' },
        areaStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(16,185,129,0.35)'},{offset:1,color:'rgba(16,185,129,0.02)'}] } },
      }],
    }));

    /* COMP0104 二쇰Ц?꾨즺 - 留됰? */
    const cfOpt0104 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>二쇰Ц: ' + fmt(p[0].value) + '嫄? },
      grid: baseGrid,
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [{
        type:'bar', data: cfMonthlyOrders.value, barMaxWidth:36,
        itemStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'#7b1fa2'},{offset:1,color:'#a855f7'}] }, borderRadius:[4,4,0,0] },
      }],
    }));

    /* COMP0201 梨꾨꼸蹂?留ㅼ텧 - 硫??爰얠???*/
    const cfChannelMonthly = computed(() => {
      const map = {};
      dash.info0201.forEach(r => {
        const ch = r.col1Nm || '';
        if (!map[ch]) map[ch] = { name:ch, color: CHANNEL_COLORS[ch]||'#999', values:{} };
        map[ch].values[r.col2Nm || ''] = r.col2Num || 0;
      });
      const months = cfMonthLabels.value;
      return Object.values(map).map(ch => ({ name:ch.name, color:ch.color, values: months.map(m => ch.values[m]||0) }));
    });

    const cfOpt0201 = computed(() => ({
      tooltip: { trigger:'axis' },
      legend: { type:'scroll', bottom:0, textStyle:{ fontSize:9 } },
      grid: { top:36, right:16, bottom:60, left:70 },
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      series: cfChannelMonthly.value.map(ch => ({
        name: ch.name, type:'line', data: ch.values, smooth:true, symbolSize:4,
        lineStyle:{ color:ch.color, width:2 }, itemStyle:{ color:ch.color },
      })),
    }));

    /* COMP0203 TOP 7 - ?섑룊 留됰? */
    const topProducts = computed(() => dash.info0203.map(r => ({ name:r.col1Nm||'', value:r.col1Num||0 })));

    const cfOpt0203 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + ': ' + fmt(p[0].value) + '?? },
      grid: { top:8, right:80, bottom:8, left:130 },
      xAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      yAxis: { type:'category', data: topProducts.value.map(p => p.name).reverse(), axisLabel:{ fontSize:10, color:'#555' } },
      series: [{
        type:'bar', data: topProducts.value.map(p => p.value).reverse(), barMaxWidth:18,
        itemStyle:{ color:{ type:'linear',x:0,y:0,x2:1,y2:0, colorStops:[{offset:0,color:'#7b1fa2'},{offset:1,color:'#e8587a'}] }, borderRadius:[0,4,4,0] },
        label:{ show:true, position:'right', formatter: p => fmt(p.value)+'??, fontSize:10, color:'#555' },
      }],
    }));

    /* COMP0204 梨꾨꼸 ?꾨꽋 */
    const salesByChannel = computed(() => {
      const COLORS = ['#e8587a','#7b1fa2','#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1'];
      return dash.info0204.map((r,i) => ({ name:r.col1Nm||'', value:r.col1Num||0, itemStyle:{ color:COLORS[i%COLORS.length] } }));
    });

    const cfOpt0204 = computed(() => ({
      tooltip: { trigger:'item', formatter: p => p.name + ': ' + p.value + '%' },
      legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
      series: [{
        type:'pie', radius:['40%','68%'], center:['38%','50%'],
        data: salesByChannel.value,
        label:{ show:false },
        emphasis:{ label:{ show:true, fontSize:12, fontWeight:'bold' } },
      }],
    }));

    /* COMP0301 ?붾컮?댁뒪 ?꾨꽋 */
    const salesByDevice = computed(() => {
      const COLORS = ['#3b82f6','#10b981','#f59e0b'];
      return dash.info0301.map((r,i) => ({ name:r.col1Nm||'', value:r.col1Num||0, itemStyle:{ color:COLORS[i%COLORS.length] } }));
    });

    const cfOpt0301 = computed(() => ({
      tooltip: { trigger:'item', formatter: p => p.name + ': ' + p.value + '%' },
      legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
      series: [{
        type:'pie', radius:['40%','68%'], center:['38%','50%'],
        data: salesByDevice.value,
        label:{ show:false },
        emphasis:{ label:{ show:true, fontSize:11, fontWeight:'bold' } },
      }],
    }));

    /* COMP0302 ?쒓컙? ?꾨꽋 */
    const salesByTime = computed(() => {
      const COLORS = ['#fbbf24','#f97316','#e8587a','#6366f1'];
      return dash.info0302.map((r,i) => ({ name:r.col1Nm||'', value:r.col1Num||0, itemStyle:{ color:COLORS[i%COLORS.length] } }));
    });

    const cfOpt0302 = computed(() => ({
      tooltip: { trigger:'item', formatter: p => p.name + ': ' + p.value + '%' },
      legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:9 } },
      series: [{
        type:'pie', radius:['40%','68%'], center:['38%','50%'],
        data: salesByTime.value,
        label:{ show:false },
        emphasis:{ label:{ show:true, fontSize:11 } },
      }],
    }));

    /* COMP0303 吏??퀎 ?섑룊 留됰? */
    const regionSales = computed(() => dash.info0303.map(r => ({ name:r.col1Nm||'', value:r.col1Num||0 })));

    const cfOpt0303 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + ': ' + fmt(p[0].value) },
      grid: { top:8, right:60, bottom:8, left:50 },
      xAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      yAxis: { type:'category', data: regionSales.value.map(r => r.name).reverse(), axisLabel:{ fontSize:10, color:'#555' } },
      series: [{
        type:'bar', data: regionSales.value.map(r => r.value).reverse(), barMaxWidth:16,
        itemStyle:{ color:'#3b82f6', borderRadius:[0,4,4,0] },
        label:{ show:true, position:'right', formatter: p => fmt(p.value), fontSize:10, color:'#555' },
      }],
    }));

    /* COMP0304 ?쒓컙? 異붿씠 爰얠???*/
    const hourlyTrend = computed(() => dash.info0304.map(r => r.col1Num || 0));

    const cfOpt0304 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].axisValue + '?? ' + p[0].value + '嫄? },
      grid: { top:20, right:16, bottom:28, left:44 },
      xAxis: { type:'category', data: Array.from({length:24}, (_,i) => String(i).padStart(2,'0')), axisLabel:{ fontSize:10, color:'#888', interval:5 } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [{
        type:'line', data: hourlyTrend.value, smooth:true, symbol:'circle', symbolSize:4,
        lineStyle:{ color:'#10b981', width:2 },
        itemStyle:{ color:'#10b981' },
        areaStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(16,185,129,0.3)'},{offset:1,color:'rgba(16,185,129,0.02)'}] } },
      }],
    }));

    /* COMP0401 ?덉씠??*/
    const radarValues = computed(() => dash.info0401.map(r => ({ label:r.col1Nm||'', value:r.col1Num||0 })));

    const cfOpt0401 = computed(() => ({
      tooltip: { trigger:'item' },
      radar: {
        indicator: radarValues.value.map(v => ({ name:v.label, max:100 })),
        center:['50%','52%'], radius:'68%',
        axisName:{ fontSize:11, color:'#555' },
        splitArea:{ areaStyle:{ color:['rgba(232,88,122,0.04)','rgba(232,88,122,0.08)'] } },
        splitLine:{ lineStyle:{ color:'#e5e7eb' } },
      },
      series: [{
        type:'radar',
        data:[{ value: radarValues.value.map(v => v.value), name:'?곸뾽吏??,
          areaStyle:{ color:'rgba(232,88,122,0.2)' },
          lineStyle:{ color:'#e8587a', width:2 },
          itemStyle:{ color:'#e8587a' },
        }],
      }],
    }));

    /* COMP0402 寃쎌젣 ?섏?蹂?硫댁쟻 爰얠???*/
    const economySales = computed(() => ({
      labels: dash.info0402.map(r => r.col1Nm||''),
      high:   dash.info0402.map(r => r.col1Num||0),
      middle: dash.info0402.map(r => r.col2Num||0),
      low:    dash.info0402.map(r => r.col3Num||0),
    }));

    const cfOpt0402 = computed(() => ({
      tooltip: { trigger:'axis' },
      legend: { top:4, right:8, textStyle:{ fontSize:10 } },
      grid: { ...baseGrid, top:44 },
      xAxis: { type:'category', data: economySales.value.labels, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      series: [
        { name:'?곸쐞', type:'line', data: economySales.value.high,   smooth:true, symbolSize:4, lineStyle:{ color:'#7b1fa2' }, itemStyle:{ color:'#7b1fa2' }, areaStyle:{ color:'rgba(123,31,162,0.15)' } },
        { name:'以묒쐞', type:'line', data: economySales.value.middle, smooth:true, symbolSize:4, lineStyle:{ color:'#3b82f6' }, itemStyle:{ color:'#3b82f6' }, areaStyle:{ color:'rgba(59,130,246,0.12)' } },
        { name:'?섏쐞', type:'line', data: economySales.value.low,    smooth:true, symbolSize:4, lineStyle:{ color:'#10b981' }, itemStyle:{ color:'#10b981' }, areaStyle:{ color:'rgba(16,185,129,0.10)' } },
      ],
    }));

    /* COMP0403 諛곗넚 議곌굔 ?꾨꽋 */
    const shippingTypes = computed(() => {
      const COLORS = ['#10b981','#9ca3af','#3b82f6','#f59e0b'];
      return dash.info0403.map((r,i) => ({ name:r.col1Nm||'', value:r.col1Num||0, itemStyle:{ color:COLORS[i%COLORS.length] } }));
    });

    const cfOpt0403 = computed(() => ({
      tooltip: { trigger:'item', formatter: p => p.name + '諛곗넚: ' + p.value + '%' },
      legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
      series: [{
        type:'pie', radius:['40%','68%'], center:['38%','50%'],
        data: shippingTypes.value,
        label:{ show:false },
        emphasis:{ label:{ show:true, fontSize:11 } },
      }],
    }));

    /* ?? X-View ?덊듃留?option ??????????????????????????? */
    const cfOptXview = computed(() => {
      const now  = Date.now();
      const from = now - 10 * 60 * 1000;
      const pts  = xviewData.value.map(p => [p.t, p.rt, p.err ? 2 : p.rt > 3000 ? 2 : p.rt > 500 ? 1 : 0]);

      return {
        tooltip: {
          trigger: 'item',
          formatter: p => {
            const d   = new Date(p.data[0]);
            const hms = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
            const lbl = ['?뺤긽','?먮┝','?ㅻ쪟'][p.data[2]] || '';
            return hms + '<br/>?묐떟?쒓컙: <b>' + p.data[1].toFixed(0) + 'ms</b><br/>?곹깭: ' + lbl;
          },
        },
        toolbox: {
          feature: { dataZoom:{ yAxisIndex:'none', title:{ zoom:'踰붿쐞 ?쒕옒洹?, back:'珥덇린?? } }, restore:{ title:'珥덇린?? } },
          right: 16, top: 6,
        },
        brush: {
          toolbox: ['rect','clear'],
          xAxisIndex: 0,
          throttleType: 'debounce', throttleDelay: 300,
        },
        grid: { top:48, right:24, bottom:48, left:64 },
        xAxis: {
          type: 'time', min: from, max: now,
          axisLabel: {
            fontSize: 10, color: '#888',
            formatter: v => { const d = new Date(v); return d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0'); },
          },
          splitLine: { lineStyle:{ color:'#f0f0f0' } },
        },
        yAxis: {
          type: 'value', name: '?묐떟?쒓컙(ms)', nameTextStyle:{ fontSize:10, color:'#888' },
          min: 0,
          axisLabel: { fontSize:10, color:'#888', formatter: v => v + 'ms' },
          splitLine: { lineStyle:{ color:'#f0f0f0' } },
        },
        visualMap: {
          show: true, type:'piecewise', categories: [0,1,2], dimension: 2,
          pieces: [
            { value:0, label:'?뺤긽 (<500ms)',    color:'#3b82f6' },
            { value:1, label:'?먮┝ (<3000ms)',   color:'#f59e0b' },
            { value:2, label:'?ㅻ쪟 / 留ㅼ슦 ?먮┝', color:'#ef4444' },
          ],
          right: 16, bottom: 48, textStyle:{ fontSize:10 },
        },
        series: [
          { type:'line', data:[[from,500],[now,500]],   lineStyle:{ type:'dashed',color:'#f59e0b',width:1.5 }, symbol:'none', tooltip:{ show:false }, z:5 },
          { type:'line', data:[[from,3000],[now,3000]], lineStyle:{ type:'dashed',color:'#ef4444',width:1.5 }, symbol:'none', tooltip:{ show:false }, z:5 },
          {
            type:'scatter', data: pts,
            symbolSize: 4, large: true, largeThreshold: 200,
            encode: { x:0, y:1, itemName:0 },
          },
        ],
      };
    });

    const onXviewBrush = (params) => {
      if (!params.areas || !params.areas.length) return;
      const area = params.areas[0];
      if (!area.coordRange || !area.coordRange[0]) return;
      const [tFrom, tTo] = area.coordRange[0];
      const [rtFrom, rtTo] = area.coordRange[1] || [0, 99999];
      const selected = xviewData.value.filter(p => p.t >= tFrom && p.t <= tTo && p.rt >= rtFrom && p.rt <= rtTo);
      uiState.xviewDrillRows = selected.map(p => {
        const d = new Date(p.t);
        return {
          time: d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0'),
          rt: p.rt,
          status: p.err ? '?ㅻ쪟' : p.rt > 3000 ? '留ㅼ슦 ?먮┝' : p.rt > 500 ? '?먮┝' : '?뺤긽',
          statusColor: p.err ? '#ef4444' : p.rt > 3000 ? '#ef4444' : p.rt > 500 ? '#f59e0b' : '#10b981',
        };
      }).sort((a,b) => b.rt - a.rt);
      uiState.xviewDrillVisible = true;
    };

    /* ##### [06] ?쇱씠?꾩궗?댄겢 #################################################### */

    onMounted(() => {
      loadDashboard();
      xviewTimer = setInterval(() => {
        const now = Date.now();
        const rt  = Math.random() < 0.75 ? Math.random()*500 : Math.random()<0.7 ? 500+Math.random()*2500 : 3000+Math.random()*5000;
        const err = rt > 5000 && Math.random() < 0.3;
        xviewData.value = [...xviewData.value.filter(p => p.t > now - 10*60*1000), { t:now, rt:Math.round(rt), err }];
      }, 2000);
    });

    onUnmounted(() => { if (xviewTimer) clearInterval(xviewTimer); });

    return {
      uiState, filters, dash,
      handleBtnAction, handleSelectAction,
      cfBaseGridColumns, showPanel, isSel,
      TABS, VIEW_MODES, CHANNELS, AGES, GENDERS, MEMBER_TYPES, CATEGORIES,
      fmt, pct,
      cfMonthLabels, cfTotalSales, cfTotalQtyComp, marginRate, cfAvgOrderValue,
      cfOpt0101, cfOpt0102, cfOpt0103, cfOpt0104,
      cfOpt0201, cfOpt0203, cfOpt0204,
      cfOpt0301, cfOpt0302, cfOpt0303, cfOpt0304,
      cfOpt0401, cfOpt0402, cfOpt0403,
      cfOptXview, onXviewBrush,
    };
  },

  template: `
<div :class="(uiState.tabMode==='3col'||uiState.tabMode==='4col') ? 'dash-wide' : 'bo-wrap'">

  <!-- ?ㅻ뜑 -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%);border-radius:10px;color:#fff;">
    <div style="width:6px;height:24px;background:#e8587a;border-radius:3px;"></div>
    <span style="font-size:17px;font-weight:800;letter-spacing:-0.5px;">?⑤씪???쇳븨紐?留ㅼ텧 諛??먮ℓ?꾪솴</span>
    <span style="flex:1;"></span>
    <span style="font-size:11px;color:#aaa;">14媛쒖썡 湲곗? 쨌 {{ cfMonthLabels.length > 0 ? (cfMonthLabels[0] + ' ~ ' + cfMonthLabels[cfMonthLabels.length-1]) : '-' }}</span>
  </div>

  <!-- ?꾪꽣 -->
  <bo-container card-style="padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:#666;width:74px;">議고쉶湲곌컙</span>
      <input type="date" v-model="filters.startDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <span style="color:#999;">~</span>
      <input type="date" v-model="filters.endDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <button class="btn_filter_toggle" @click="handleBtnAction('filters-toggleExpand')" style="font-size:11px;padding:4px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fafbfc;color:#555;">
        {{ uiState.filterExpand ? '???곸꽭?꾪꽣 ?묎린' : '???곸꽭?꾪꽣 ?쇱튂湲? }}
      </button>
      <span style="flex:1;"></span>
      <button class="btn btn_search"  @click="handleBtnAction('filters-search')" style="font-size:11px;">?뵇 寃??/button>
      <button class="btn btn_excel"   @click="handleBtnAction('stats-excel')" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;">?뱿 ?묒??ㅼ슫濡쒕뱶</button>
      <button class="btn btn_reset"   @click="handleBtnAction('filters-reset')" style="font-size:11px;">?봽 珥덇린??/button>
    </div>
    <div v-if="uiState.filterExpand" style="display:flex;flex-direction:column;gap:8px;border-top:1px dashed #eee;padding-top:10px;">
      <div v-for="grp in [{key:'channels',label:'?먮ℓ梨꾨꼸',all:CHANNELS},{key:'ages',label:'?섏씠?',all:AGES},{key:'genders',label:'?깅퀎',all:GENDERS},{key:'memberTypes',label:'?뚯썝?좏삎',all:MEMBER_TYPES},{key:'categories',label:'移댄뀒怨좊━',all:CATEGORIES}]" :key="grp.key" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#666;width:74px;">{{ grp.label }}</span>
        <button @click="handleBtnAction('filters-toggleAll',{key:grp.key,all:grp.all})"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',background:filters[grp.key].length===grp.all.length?'#1a1a2e':'#fff',color:filters[grp.key].length===grp.all.length?'#fff':'#555',borderColor:filters[grp.key].length===grp.all.length?'#1a1a2e':'#ddd'}">?꾩껜</button>
        <button v-for="v in grp.all" :key="v" @click="handleBtnAction('filters-toggle',{key:grp.key,v})"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',background:isSel(filters[grp.key],v)?'#fff0f4':'#fafbfc',color:isSel(filters[grp.key],v)?'#e8587a':'#888',borderColor:isSel(filters[grp.key],v)?'#e8587a':'#e5e7eb',fontWeight:isSel(filters[grp.key],v)?700:400}">{{ v }}</button>
      </div>
    </div>
  </bo-container>

  <!-- ??諛?+ 酉곕え??-->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <div class="tab-nav" style="margin-bottom:0;flex:1;flex-wrap:wrap;">
      <button v-for="t in TABS" :key="t.key" class="tab-btn"
        :class="{active: uiState.tabMode==='tab' ? uiState.activeTab===t.key : false}"
        :disabled="uiState.tabMode!=='tab'"
        @click="handleSelectAction('tabs-select', t.key)"
        :style="uiState.tabMode!=='tab' ? 'opacity:0.4;cursor:not-allowed;' : ''">
        <span style="margin-right:4px;">{{ t.icon }}</span>{{ t.label }}
      </button>
    </div>
    <div style="display:flex;gap:4px;background:#fff;padding:4px;border:1px solid #eef0f3;border-radius:8px;flex-shrink:0;">
      <button v-for="vm in VIEW_MODES" :key="vm.key" @click="handleSelectAction('tabMode-set',vm.key)" :title="vm.label+'濡?蹂닿린'"
        :style="{fontSize:'11px',padding:'4px 8px',borderRadius:'5px',border:'none',cursor:'pointer',minWidth:'34px',background:uiState.tabMode===vm.key?'#fff0f4':'transparent',color:uiState.tabMode===vm.key?'#e8587a':'#888',fontWeight:uiState.tabMode===vm.key?700:400}">
        {{ vm.icon }}
      </button>
    </div>
  </div>

  <!-- 李⑦듃 洹몃━??-->
  <div :style="{display:'grid',gridTemplateColumns:cfBaseGridColumns,gap:'12px'}">

    <!-- 1) ?붾퀎 留ㅼ텧 留됰? -->
    <bo-container v-show="showPanel('sales')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        ?뮥 ?붾퀎 留ㅼ텧?꾪솴 (14媛쒖썡)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;font-weight:500;">珥?{{ fmt(dash.info0101.reduce((a,r)=>a+(r.col1Num||0),0)) }}??/span>
      </div>
      <co-echart :option="cfOpt0101" height="260px" />
    </bo-container>

    <!-- 2) 媛???덊눜 -->
    <bo-container v-show="showPanel('member')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?뫁 ?붾퀎 怨좉컼 媛???덊눜???꾪솴 (14媛쒖썡)</div>
      <co-echart :option="cfOpt0102" height="260px" />
    </bo-container>

    <!-- 3) ?곹뭹 ?대┃ -->
    <bo-container v-show="showPanel('click')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        ?뼮 ?붾퀎 ?곹뭹?곸꽭 ?대┃ ?꾪솴 (14媛쒖썡)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;">珥?{{ fmt(dash.info0103.reduce((a,r)=>a+(r.col1Num||0),0)) }}??/span>
      </div>
      <co-echart :option="cfOpt0103" height="260px" />
    </bo-container>

    <!-- 4) 二쇰Ц?꾨즺 -->
    <bo-container v-show="showPanel('order')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        ?뱥 ?붾퀎 二쇰Ц?꾨즺 ?꾪솴 (14媛쒖썡)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;">珥?{{ fmt(dash.info0104.reduce((a,r)=>a+(r.col1Num||0),0)) }}嫄?/span>
      </div>
      <co-echart :option="cfOpt0104" height="260px" />
    </bo-container>

    <!-- 5) 梨꾨꼸蹂?留ㅼ텧 硫?곕씪??-->
    <bo-container v-show="showPanel('channel')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?벟 ?붾퀎 ?먮ℓ梨꾨꼸蹂?留ㅼ텧?꾪솴 (14媛쒖썡)</div>
      <co-echart :option="cfOpt0201" height="300px" />
    </bo-container>

    <!-- 6) ?듭떖吏??KPI -->
    <bo-container v-show="showPanel('kpi')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">?렞 ?듭떖吏??/div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        <div v-for="kpi in [
            {label:'?꾩껜 留ㅼ텧?꾪솴',value:fmt(cfTotalSales),unit:'??,color:'#e8587a',icon:'?뮥',bg:'#fff0f4'},
            {label:'?꾩껜 援щℓ?섎웾',value:fmt(cfTotalQtyComp),unit:'嫄?,color:'#3b82f6',icon:'?썟',bg:'#eff6ff'},
            {label:'?됯퇏 留덉쭊??,value:pct(marginRate),unit:'',color:'#10b981',icon:'?뱢',bg:'#f0fdf4'},
            {label:'?됯퇏 寃곗젣湲덉븸',value:fmt(cfAvgOrderValue),unit:'??,color:'#f59e0b',icon:'?뮩',bg:'#fffbeb'},
          ]" :key="kpi.label"
          :style="{background:kpi.bg,border:'1px solid #eef0f3',borderRadius:'8px',padding:'12px',display:'flex',alignItems:'center',gap:'10px'}">
          <div :style="{fontSize:'22px',width:'36px',height:'36px',borderRadius:'8px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}">{{ kpi.icon }}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:10.5px;color:#666;font-weight:600;">{{ kpi.label }}</div>
            <div :style="{fontSize:'15px',fontWeight:800,color:kpi.color,marginTop:'2px'}">
              {{ kpi.value }}<span style="font-size:10px;margin-left:2px;color:#999;">{{ kpi.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </bo-container>

    <!-- 7) ?곹뭹 TOP 7 ?섑룊 留됰? -->
    <bo-container v-show="showPanel('topProducts')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?벀 ?곹뭹蹂?留ㅼ텧 TOP 7</div>
      <co-echart :option="cfOpt0203" height="240px" />
    </bo-container>

    <!-- 8) 梨꾨꼸 ?꾨꽋 -->
    <bo-container v-show="showPanel('channelMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?벑 ?먮ℓ 梨꾨꼸蹂?/div>
      <co-echart :option="cfOpt0204" height="220px" />
    </bo-container>

    <!-- 9) ?붾컮?댁뒪 ?꾨꽋 -->
    <bo-container v-show="showPanel('deviceMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?뮲 ?붾컮?댁뒪蹂?/div>
      <co-echart :option="cfOpt0301" height="220px" />
    </bo-container>

    <!-- 10) ?쒓컙? ?꾨꽋 -->
    <bo-container v-show="showPanel('timeMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">???쒓컙?蹂?/div>
      <co-echart :option="cfOpt0302" height="220px" />
    </bo-container>

    <!-- 11) 吏??퀎 ?섑룊 留됰? -->
    <bo-container v-show="showPanel('region')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?뿺 吏??퀎 留ㅼ텧?꾪솴</div>
      <co-echart :option="cfOpt0303" height="220px" />
    </bo-container>

    <!-- 12) ?쒓컙? 異붿씠 爰얠???-->
    <bo-container v-show="showPanel('hourly')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">???쒓컙?蹂?二쇰Ц 異붿씠 (24H)</div>
      <co-echart :option="cfOpt0304" height="180px" />
    </bo-container>

    <!-- 13) ?곸뾽吏???덉씠??-->
    <bo-container v-show="showPanel('radar')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">???곸뾽 吏??鍮꾧탳</div>
      <co-echart :option="cfOpt0401" height="220px" />
    </bo-container>

    <!-- 14) 寃쎌젣 ?섏?蹂?硫댁쟻 -->
    <bo-container v-show="showPanel('economy')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?뮳 寃쎌젣 ?섏?蹂?留ㅼ텧?꾪솴</div>
      <co-echart :option="cfOpt0402" height="220px" />
    </bo-container>

    <!-- 15) 諛곗넚 議곌굔 ?꾨꽋 -->
    <bo-container v-show="showPanel('shipping')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;">?슊 諛곗넚 議곌굔蹂?留ㅼ텧?꾪솴</div>
      <co-echart :option="cfOpt0403" height="220px" />
    </bo-container>

    <!-- 16) X-View ?ㅼ떆媛??덊듃留?-->
    <bo-container v-show="showPanel('xview')" card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
        ?뵦 X-View ?ㅼ떆媛??몃옖??뀡 ?덊듃留?        <span style="font-size:10px;font-weight:400;color:#10b981;background:#f0fdf4;padding:2px 8px;border-radius:10px;border:1px solid #bbf7d0;">??LIVE</span>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">?쒕옒洹명븯??踰붿쐞 ?좏깮 ???몃옖??뀡 ?곸꽭</span>
        <span style="font-size:10px;color:#888;">????500ms 寃쎄퀬 &amp; ????3000ms ?ㅻ쪟</span>
      </div>
      <co-echart :option="cfOptXview" height="360px" @brush-selected="onXviewBrush" />

      <!-- X-View ?쒕┫?ㅼ슫 ?뚯씠釉?-->
      <div v-if="uiState.xviewDrillVisible" style="margin-top:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="display:flex;align-items:center;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:12px;font-weight:700;color:#444;">?좏깮 踰붿쐞 ?몃옖??뀡 <span style="color:#e8587a;">{{ uiState.xviewDrillRows.length }}嫄?/span></span>
          <span style="flex:1;"></span>
          <button class="btn btn_close" @click="handleBtnAction('xview-drill-close')" style="font-size:11px;padding:3px 10px;">???リ린</button>
        </div>
        <div style="max-height:220px;overflow-y:auto;">
          <table class="admin-table" style="width:100%;font-size:11px;">
            <thead><tr>
              <th style="width:80px;">?쒓컖</th>
              <th style="width:100px;">?묐떟?쒓컙</th>
              <th style="width:100px;">?곹깭</th>
            </tr></thead>
            <tbody>
              <tr v-for="(row,i) in uiState.xviewDrillRows" :key="i">
                <td>{{ row.time }}</td>
                <td style="font-weight:700;">{{ row.rt }}ms</td>
                <td><span class="badge" :style="{background:row.statusColor,color:'#fff'}">{{ row.status }}</span></td>
              </tr>
              <tr v-if="!uiState.xviewDrillRows.length">
                <td colspan="3" style="text-align:center;color:#aaa;padding:16px;">?좏깮 踰붿쐞???곗씠?곌? ?놁뒿?덈떎.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </bo-container>

  </div>
</div>
`,
};

