/* ShopJoy Admin - EC 종합 대시보드 (ECharts 기반, 14개월 현황 + X-View 히트맵) */
window.DashboardBoEc03 = {
  name: 'DashboardBoEc03',
  props: {
    navigate: { type: Function, required: true },
  },
  setup() {

    /* ##### [01] 초기 변수 정의 ################################################## */

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;
    const fmt      = coUtil.cofFmt;
    const toYmd    = coUtil.cofToYmd;
    const addMonths   = coUtil.cofAddMonths;
    const endOfMonth  = coUtil.cofEndOfMonth;

    const today    = new Date();
    const endDef   = toYmd(endOfMonth(today));
    const startDef = toYmd(new Date(addMonths(today, -13).getFullYear(), addMonths(today, -13).getMonth(), 1));

    const CHANNELS     = boConsts.DASHBOARD_CHANNELS.map(c => c.codeLabel);
    const AGES         = boConsts.DASHBOARD_AGES.map(c => c.codeLabel);
    const GENDERS      = boConsts.DASHBOARD_GENDERS.map(c => c.codeLabel);
    const MEMBER_TYPES = boConsts.DASHBOARD_MEMBER_TYPES.map(c => c.codeLabel);
    const CATEGORIES   = boConsts.DASHBOARD_CATEGORIES.map(c => c.codeLabel);
    const CHANNEL_COLORS = boConsts.DASHBOARD_CHANNEL_COLORS;

    const filters = reactive({
      startDt: startDef, endDt: endDef,
      channels: [...CHANNELS], ages: [...AGES],
      genders: [...GENDERS], memberTypes: [...MEMBER_TYPES], categories: [...CATEGORIES],
    });

    const uiState = reactive({
      filterExpand: false, activeTab: 'sales', tabMode: '4col', loading: false,
      xviewDrillRows: [], xviewDrillVisible: false,
      infoPanel: null, /* { title, optJson, dataJson, top, left } */
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
      { key:'sales',       label:'월별 매출',       icon:'💰' },
      { key:'member',      label:'가입/탈퇴',        icon:'👥' },
      { key:'click',       label:'상품상세 클릭',    icon:'🖱' },
      { key:'order',       label:'주문완료',         icon:'📋' },
      { key:'channel',     label:'판매채널별 매출',  icon:'📺' },
      { key:'kpi',         label:'핵심지표',         icon:'🎯' },
      { key:'topProducts', label:'상품 TOP 7',       icon:'📦' },
      { key:'channelMix',  label:'채널 비중',        icon:'📱' },
      { key:'deviceMix',   label:'디바이스 비중',    icon:'💻' },
      { key:'timeMix',     label:'시간대 비중',      icon:'⏰' },
      { key:'region',      label:'지역별',           icon:'🗺' },
      { key:'hourly',      label:'시간대 추이',      icon:'⏱' },
      { key:'radar',       label:'영업지표',         icon:'⚡' },
      { key:'economy',     label:'경제 수준별',      icon:'💼' },
      { key:'shipping',    label:'배송 조건',        icon:'🚚' },
      { key:'xview',       label:'X-View',           icon:'🔥' },
    ];

    const VIEW_MODES = [
      { key:'tab',  icon:'📑', label:'탭' },
      { key:'1col', icon:'▭',  label:'1열' },
      { key:'2col', icon:'▭▭', label:'2열' },
      { key:'3col', icon:'▭▭▭', label:'3열' },
      { key:'4col', icon:'▭▭▭▭', label:'4열' },
    ];

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'filters-search')            return onSearch();
      if (cmd === 'filters-reset')             return onReset();
      if (cmd === 'stats-excel')               return doExcelDownload();
      if (cmd === 'filters-toggleExpand')      { uiState.filterExpand = !uiState.filterExpand; return; }
      if (cmd === 'filters-toggleAll')         return toggleAll(param.key, param.all);
      if (cmd === 'filters-toggle')            return toggle(filters[param.key], param.v);
      if (cmd === 'xview-drill-close')         { uiState.xviewDrillVisible = false; return; }
      if (cmd === 'info-close')                { uiState.infoPanel = null; return; }
      if (cmd === 'infoTab-set')               { if (uiState.infoPanel) uiState.infoPanel.tab = param; return; }
      if (cmd === 'clipboard-copy')            { if (param) navigator.clipboard.writeText(param); return; }
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

    /* 위젯 소스정보 메타 — compId별 API/파라미터/차트 설명 */
    const WIDGET_SRC = {
      COMP0101: { compId:'COMP0101', chartType:'bar (세로 막대)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0101', fields:'col1Nm(월라벨) / col1Num(매출액)', desc:'월별 매출 합계. 14개월 기간 기준 집계.',
        tag:'<co-echart\n  :option="cfOpt0101"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOpt0101',d:'ECharts option computed — series/xAxis/yAxis 포함'},{k:'height',v:'"260px"',d:'캔버스 높이 (고정값)'}] },
      COMP0102: { compId:'COMP0102', chartType:'bar grouped (그룹 막대)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0102', fields:'col1Nm(월) / col1Num(가입) / col2Nm(월) / col2Num(탈퇴)', desc:'월별 고객 가입·탈퇴 병렬 표시.',
        tag:'<co-echart\n  :option="cfOpt0102"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOpt0102',d:'가입(파랑)/탈퇴(빨강) grouped bar series'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      COMP0103: { compId:'COMP0103', chartType:'line + area (면적 꺾은선)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0103', fields:'col1Nm(월) / col1Num(클릭수)', desc:'상품상세 페이지 월별 클릭 횟수.',
        tag:'<co-echart\n  :option="cfOpt0103"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOpt0103',d:'areaStyle 그라데이션 line 시리즈'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      COMP0104: { compId:'COMP0104', chartType:'line + area (면적 꺾은선)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0104', fields:'col1Nm(월) / col1Num(주문건수)', desc:'월별 주문완료 건수.',
        tag:'<co-echart\n  :option="cfOpt0104"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOpt0104',d:'areaStyle 그라데이션 line 시리즈'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      COMP0201: { compId:'COMP0201', chartType:'line multi (채널별 꺾은선)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0201', fields:'col1Nm(채널명) / col2Nm(월) / col2Num(채널매출)', desc:'12개 판매채널별 월별 매출 추이.',
        tag:'<co-echart\n  :option="cfOpt0201"\n  height="300px"\n/>',
        attrs:[{k:':option',v:'cfOpt0201',d:'채널별 12개 line series, CHANNEL_COLORS 매핑'},{k:'height',v:'"300px"',d:'멀티라인 가독성 확보 높이'}] },
      COMP0202: { compId:'COMP0202', chartType:'KPI 카드 (차트 없음)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0202', fields:'col1Num(총매출) / col2Num(구매수량) / col3Num(마진율%) / col4Num(평균결제액)', desc:'기간 내 핵심 KPI 단일 집계값.',
        tag:'<div class="kpi-grid">\n  <div v-for="k in cfKpi">\n    {{ k.label }}: {{ k.value }}\n  </div>\n</div>',
        attrs:[{k:'cfKpi',v:'computed',d:'info0202[0] 의 col1~4Num 을 라벨+값 배열로 변환'}] },
      COMP0203: { compId:'COMP0203', chartType:'bar horizontal (가로 막대)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0203', fields:'col1Nm(상품명) / col1Num(매출액)', desc:'상품별 매출 TOP 7 랭킹.',
        tag:'<co-echart\n  :option="cfOpt0203"\n  height="240px"\n/>',
        attrs:[{k:':option',v:'cfOpt0203',d:'yAxis category(상품명역순) + xAxis value 가로 막대'},{k:'height',v:'"240px"',d:'7행 기준 높이'}] },
      COMP0204: { compId:'COMP0204', chartType:'pie (파이 차트)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0204', fields:'col1Nm(채널명) / col1Num(비중%)', desc:'채널별 매출 구성 비중.',
        tag:'<co-echart\n  :option="cfOpt0204"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0204',d:'pie series, radius:["35%","65%"] 도넛형'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0301: { compId:'COMP0301', chartType:'pie (파이 차트)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0301', fields:'col1Nm(디바이스) / col1Num(비중%)', desc:'Mobile·Desktop·Tablet 접속 비중.',
        tag:'<co-echart\n  :option="cfOpt0301"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0301',d:'pie series — Mobile/Desktop/Tablet 3색'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0302: { compId:'COMP0302', chartType:'pie (파이 차트)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0302', fields:'col1Nm(시간대) / col1Num(비중%)', desc:'아침·점심·저녁·야간 시간대별 비중.',
        tag:'<co-echart\n  :option="cfOpt0302"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0302',d:'pie series — 시간대 4구간 색상'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0303: { compId:'COMP0303', chartType:'bar horizontal (가로 막대)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0303', fields:'col1Nm(지역명) / col1Num(매출액)', desc:'시도별 매출 순위.',
        tag:'<co-echart\n  :option="cfOpt0303"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0303',d:'yAxis category(지역명역순) + xAxis value'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0304: { compId:'COMP0304', chartType:'line (꺾은선)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0304', fields:'col1Nm(시각 00~23) / col1Num(주문건수)', desc:'24시간 시간대별 주문 분포.',
        tag:'<co-echart\n  :option="cfOpt0304"\n  height="180px"\n/>',
        attrs:[{k:':option',v:'cfOpt0304',d:'xAxis 0~23시 24포인트 line'},{k:'height',v:'"180px"',d:'좁은 카드 기준 높이'}] },
      COMP0401: { compId:'COMP0401', chartType:'radar (레이더 차트)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0401', fields:'col1Nm(지표명) / col1Num(점수 0~100)', desc:'매출성장·고객만족·재구매율·신규고객·마진율·채널확장 6개 지표.',
        tag:'<co-echart\n  :option="cfOpt0401"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0401',d:'radar indicator 6축 + areaStyle 반투명'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0402: { compId:'COMP0402', chartType:'bar stacked (누적 막대)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0402', fields:'col1Nm(월) / col1Num(고소득) / col2Num(중간) / col3Num(저소득)', desc:'월별 소득수준 3단계 누적 매출.',
        tag:'<co-echart\n  :option="cfOpt0402"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0402',d:'stack:"total" bar 3 series — 고소득/중간/저소득'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      COMP0403: { compId:'COMP0403', chartType:'pie (파이 차트)', url:'POST /api/bo/ec/cm/dashboard/data', dataKey:'info0403', fields:'col1Nm(배송유형) / col1Num(비중%)', desc:'무료·유료·조건부무료·새벽배송 비중.',
        tag:'<co-echart\n  :option="cfOpt0403"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOpt0403',d:'pie series — 배송유형 4종 색상'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      XVIEW:    { compId:'(없음)', chartType:'scatter + brush (X-View 히트맵)', url:'(로컬 목업 — 실시간 생성)', dataKey:'xviewData', fields:'t(timestamp ms) / rt(응답시간ms) / err(boolean)', desc:'브라우저 로컬에서 800개 랜덤 포인트 생성. 10초마다 새 포인트 추가. 실제 구현 시 APM 에이전트 데이터 연동 필요.',
        tag:'<co-echart\n  :option="cfOptXview"\n  height="360px"\n  @brush-selected="onXviewBrush"\n/>',
        attrs:[{k:':option',v:'cfOptXview',d:'scatter series — 정상(파랑)/에러(빨강), brush toolbox 포함'},{k:'height',v:'"360px"',d:'드릴다운 영역 포함 높이'},{k:'@brush-selected',v:'onXviewBrush',d:'브러시 선택 시 드릴다운 테이블 갱신 emit 핸들러'}] },
    };

    /* 공통 API 요청 파라미터 */
    const fnBuildApiParams = (compId) => ({
      compId,
      uiNm: 'DashboardBoEc03',
      startYmd: (filters.startDt || '').replace(/-/g, ''),
      endYmd:   (filters.endDt   || '').replace(/-/g, ''),
    });

    /* 위젯 정보 팝오버 열기
     * optGetter  : () => ECharts option 반환 함수 (없으면 null)
     * dataKey    : dash[dataKey] 배열을 원시 데이터로 사용 (없으면 null)
     * rawOverride: dash 바깥의 데이터를 직접 전달 (없으면 undefined)
     * srcKey     : WIDGET_SRC 키 (없으면 null)
     */
    const fnOpenInfo = (e, title, optGetter, dataKey, rawOverride, srcKey) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollY = window.scrollY || 0;
      const scrollX = window.scrollX || 0;
      if (uiState.infoPanel && uiState.infoPanel.title === title) {
        uiState.infoPanel = null;
        return;
      }
      let optObj = null;
      try {
        if (optGetter) {
          const got = optGetter();
          optObj = (got !== null && typeof got === 'object' && 'value' in got) ? got.value : got;
        }
      } catch (_) {}
      const rawData = rawOverride !== undefined ? rawOverride : (dataKey ? dash[dataKey] : null);
      const src = srcKey ? WIDGET_SRC[srcKey] : null;
      const apiParams = src && src.compId !== '(없음)' ? fnBuildApiParams(src.compId) : null;
      uiState.infoPanel = {
        title,
        optJson:  optObj   ? JSON.stringify(optObj,  null, 2) : '(없음)',
        dataJson: rawData  ? JSON.stringify(rawData, null, 2) : '(없음)',
        src, apiParams,
        tab: 'opt',
        top:  rect.bottom + scrollY + 6,
        left: Math.min(rect.left  + scrollX, window.innerWidth - 560),
      };
    };

    /* X-View 전용 팝오버 열기 */
    const fnOpenXviewInfo = (e) => {
      fnOpenInfo(e, 'X-View 히트맵', () => cfOptXview, null, xviewData.value.slice(0, 10), 'XVIEW');
    };

    /* 팝오버 탭 전환 */
    const fnInfoTab = (t) => { if (uiState.infoPanel) uiState.infoPanel.tab = t; };

    /* 외부 클릭 시 팝오버 닫기 */
    const _onDocClick = () => { uiState.infoPanel = null; };

    /* ##### [04] 내장 사용 함수 #################################################### */

    const MOCK_YMD  = ['20250501','20250601','20250701','20250801','20250901','20251001','20251101','20251201','20260101','20260201','20260301','20260401','20260501','20260601'];
    const MOCK_LBL  = ['25-05','25-06','25-07','25-08','25-09','25-10','25-11','25-12','26-01','26-02','26-03','26-04','26-05','26-06'];
    const MOCK_SALES  = [98200000,112500000,134700000,128300000,119600000,142000000,155800000,187400000,141200000,128700000,138900000,151200000,172800000,140372550];
    const MOCK_JOIN   = [312,428,387,465,398,512,488,621,401,356,419,487,552,370];
    const MOCK_LEAVE  = [87,102,94,118,109,131,125,153,111,98,107,128,142,95];
    const MOCK_CLICK  = [28400,33200,41100,38700,35900,44200,47600,59300,42100,37800,41500,46900,53200,40772];
    const MOCK_ORDER  = [1820,2150,2690,2530,2380,2870,3020,3810,2740,2490,2680,3010,3420,2540];
    const MOCK_CH_CODES = ['자사몰','네이버 스마트스토어','쿠팡','11번가','G마켓','Auction','GS샵','TMON','위메프','롯데온','홈앤쇼핑','현대H몰'];
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
      r.info0202 = [{ col1Nm:'총 매출현황', col1Num:1951772550, col2Nm:'총 구매수량', col2Num:30033, col3Nm:'평균 마진율', col3Num:7.7, col4Nm:'평균 결제금액', col4Num:64988 }];
      r.info0203 = [
        { col1Nm:'울 블렌드 코트',       col1Num:59500000 },
        { col1Nm:'글로벌 미디 드레스',   col1Num:42300000 },
        { col1Nm:'슬림핏 데님 진',       col1Num:38900000 },
        { col1Nm:'카고 와이드 팬츠',     col1Num:31200000 },
        { col1Nm:'캐시미어 니트 스웨터', col1Num:27500000 },
        { col1Nm:'오버사이즈 코트',      col1Num:24100000 },
        { col1Nm:'스트라이프 티셔츠',    col1Num:19800000 },
      ];
      r.info0204 = [
        { col1Nm:'자사몰', col1Num:48 }, { col1Nm:'네이버 스마트스토어', col1Num:22 },
        { col1Nm:'쿠팡', col1Num:14 }, { col1Nm:'11번가', col1Num:9 },
        { col1Nm:'G마켓', col1Num:4 }, { col1Nm:'Auction', col1Num:2 }, { col1Nm:'기타', col1Num:1 },
      ];
      r.info0301 = [{ col1Nm:'Mobile', col1Num:58 }, { col1Nm:'Desktop', col1Num:32 }, { col1Nm:'Tablet', col1Num:10 }];
      r.info0302 = [{ col1Nm:'아침 (06-12)', col1Num:15 }, { col1Nm:'점심 (12-18)', col1Num:22 }, { col1Nm:'저녁 (18-24)', col1Num:38 }, { col1Nm:'야간 (00-06)', col1Num:25 }];
      r.info0303 = [
        { col1Nm:'서울', col1Num:58000000 }, { col1Nm:'경기', col1Num:42000000 },
        { col1Nm:'부산', col1Num:21000000 }, { col1Nm:'인천', col1Num:16000000 },
        { col1Nm:'대구', col1Num:12000000 }, { col1Nm:'광주', col1Num:9000000 },
        { col1Nm:'대전', col1Num:8500000 },  { col1Nm:'기타', col1Num:6000000 },
      ];
      const hourly = [42,28,19,14,11,13,21,38,65,89,102,118,135,128,119,124,138,156,187,212,198,176,143,87];
      r.info0304 = hourly.map((v,i) => ({ col1Nm: String(i).padStart(2,'0'), col1Num: v }));
      r.info0401 = [
        { col1Nm:'매출성장', col1Num:78 }, { col1Nm:'고객만족', col1Num:82 },
        { col1Nm:'재구매율', col1Num:65 }, { col1Nm:'신규고객', col1Num:55 },
        { col1Nm:'마진율',   col1Num:42 }, { col1Nm:'채널확장', col1Num:70 },
      ];
      const high = [42,47,52,49.5,46,55,58,71,51,47,53,57,62,40].map(v => v * 1000000);
      const mid  = [55,61,67,64,59,72,75,92,66,61,69,74,81,52].map(v => v * 1000000);
      const low  = [21.5,24,26.8,25.7,23.7,28.3,29.4,35.6,26.1,23.9,26.2,29.5,31.8,20.97].map(v => v * 1000000);
      r.info0402 = MOCK_YMD.map((d,i) => ({ col1Nm: MOCK_LBL[i], col1Num: high[i], col2Num: mid[i], col3Num: low[i] }));
      r.info0403 = [{ col1Nm:'무료배송', col1Num:48 }, { col1Nm:'유료배송', col1Num:27 }, { col1Nm:'조건부무료', col1Num:18 }, { col1Nm:'새벽배송', col1Num:7 }];
      return r;
    };

    /* X-View 히트맵 목업 데이터 */
    const XVIEW_URLS = [
      { url:'/bo/ec/mb/member/page',        uiNm:'회원관리',     cmdNm:'목록조회' },
      { url:'/bo/ec/pd/prod/page',           uiNm:'상품관리',     cmdNm:'목록조회' },
      { url:'/bo/ec/od/order/page',          uiNm:'주문관리',     cmdNm:'목록조회' },
      { url:'/bo/ec/od/claim/page',          uiNm:'클레임관리',   cmdNm:'목록조회' },
      { url:'/bo/ec/pm/coupon/page',         uiNm:'쿠폰관리',     cmdNm:'목록조회' },
      { url:'/bo/ec/cm/dashboard/data',      uiNm:'대시보드',     cmdNm:'조회' },
      { url:'/bo/sy/user/page',              uiNm:'사용자관리',   cmdNm:'목록조회' },
      { url:'/bo/sy/code/list',              uiNm:'코드관리',     cmdNm:'코드목록' },
      { url:'/bo/ec/pd/prod/save/base',      uiNm:'상품관리',     cmdNm:'저장' },
      { url:'/bo/ec/od/order/save/base',     uiNm:'주문관리',     cmdNm:'저장' },
      { url:'/bo/ec/mb/member/save/base',    uiNm:'회원관리',     cmdNm:'저장' },
      { url:'/bo/ec/dp/ui/list',             uiNm:'전시관리',     cmdNm:'목록조회' },
      { url:'/bo/ec/pm/event/page',          uiNm:'이벤트관리',   cmdNm:'목록조회' },
      { url:'/co/sy/code/grp-codes',         uiNm:'공통',         cmdNm:'코드조회' },
      { url:'/bo/sy/menu/list',              uiNm:'메뉴관리',     cmdNm:'목록조회' },
    ];
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
        const src = XVIEW_URLS[Math.floor(Math.random() * XVIEW_URLS.length)];
        pts.push({ t, rt: Math.round(rt), err, url: src.url, uiNm: src.uiNm, cmdNm: src.cmdNm });
      }
      return pts;
    };

    const xviewData = ref(buildXviewData());
    let xviewTimer  = null;

    /* ##### [03] 데이터 로드 ##################################################### */

    const loadDashboard = async () => {
      uiState.loading = true;
      try {
        const startYmd = (filters.startDt || '').replace(/-/g, '');
        const endYmd   = (filters.endDt   || '').replace(/-/g, '');
        const items = COMP_IDS.map(compId => ({ compId, uiNm: 'DashboardBoEc03', startYmd, endYmd }));
        const res = await boApiSvc.cmDashboard.getData(items, '대시보드', '조회');
        const d = res.data?.data || {};
        Object.keys(dash).forEach(k => { dash[k] = d[k] || []; });
      } catch (err) {
        console.error('[대시보드 조회 오류]', err);
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
      const rows = [['월','매출','가입','탈퇴','클릭','주문완료']];
      labels.forEach((m, i) => {
        rows.push([m, dash.info0101[i]?.col1Num||0, dash.info0102[i]?.col1Num||0, dash.info0102[i]?.col2Num||0, dash.info0103[i]?.col1Num||0, dash.info0104[i]?.col1Num||0]);
      });
      const csv  = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = coUtil.cofBuildExportFilename('대시보드.csv'); a.click();
      URL.revokeObjectURL(url);
    };

    /* ##### [05] ECharts option 빌더 ############################################# */

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

    /* COMP0101 월별 매출 - 막대 */
    const cfOpt0101 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>매출: ' + fmt(p[0].value) + '원' },
      grid: baseGrid,
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      series: [{
        type:'bar', data: cfMonthlySales.value, barMaxWidth: 36,
        itemStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'#e8587a'},{offset:1,color:'#ff8aa5'}] }, borderRadius:[4,4,0,0] },
        emphasis: { itemStyle: { color:'#c73060' } },
      }],
    }));

    /* COMP0102 가입/탈퇴 - 그룹 막대 */
    const cfOpt0102 = computed(() => ({
      tooltip: { trigger:'axis' },
      legend: { top:4, right:8, textStyle:{ fontSize:10 } },
      grid: { ...baseGrid, top:44 },
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [
        { name:'가입', type:'bar', data: cfMonthlyJoin.value,  barMaxWidth:20, itemStyle:{ color:'#3b82f6', borderRadius:[3,3,0,0] } },
        { name:'탈퇴', type:'bar', data: cfMonthlyLeave.value, barMaxWidth:20, itemStyle:{ color:'#ef4444', borderRadius:[3,3,0,0] } },
      ],
    }));

    /* COMP0103 상품 클릭 - 면적 꺾은선 */
    const cfOpt0103 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>클릭: ' + fmt(p[0].value) + '회' },
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

    /* COMP0104 주문완료 - 막대 */
    const cfOpt0104 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + '<br/>주문: ' + fmt(p[0].value) + '건' },
      grid: baseGrid,
      xAxis: { type:'category', data: cfMonthLabels.value, axisLabel:{ fontSize:10, color:'#888' } },
      yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' } },
      series: [{
        type:'bar', data: cfMonthlyOrders.value, barMaxWidth:36,
        itemStyle:{ color:{ type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'#7b1fa2'},{offset:1,color:'#a855f7'}] }, borderRadius:[4,4,0,0] },
      }],
    }));

    /* COMP0201 채널별 매출 - 멀티 꺾은선 */
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

    /* COMP0203 TOP 7 - 수평 막대 */
    const topProducts = computed(() => dash.info0203.map(r => ({ name:r.col1Nm||'', value:r.col1Num||0 })));

    const cfOpt0203 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].name + ': ' + fmt(p[0].value) + '원' },
      grid: { top:8, right:80, bottom:8, left:130 },
      xAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => (v/1000000).toFixed(0)+'M' } },
      yAxis: { type:'category', data: topProducts.value.map(p => p.name).reverse(), axisLabel:{ fontSize:10, color:'#555' } },
      series: [{
        type:'bar', data: topProducts.value.map(p => p.value).reverse(), barMaxWidth:18,
        itemStyle:{ color:{ type:'linear',x:0,y:0,x2:1,y2:0, colorStops:[{offset:0,color:'#7b1fa2'},{offset:1,color:'#e8587a'}] }, borderRadius:[0,4,4,0] },
        label:{ show:true, position:'right', formatter: p => fmt(p.value)+'원', fontSize:10, color:'#555' },
      }],
    }));

    /* COMP0204 채널 도넛 */
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

    /* COMP0301 디바이스 도넛 */
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

    /* COMP0302 시간대 도넛 */
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

    /* COMP0303 지역별 수평 막대 */
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

    /* COMP0304 시간대 추이 꺾은선 */
    const hourlyTrend = computed(() => dash.info0304.map(r => r.col1Num || 0));

    const cfOpt0304 = computed(() => ({
      tooltip: { trigger:'axis', formatter: p => p[0].axisValue + '시: ' + p[0].value + '건' },
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

    /* COMP0401 레이더 */
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
        data:[{ value: radarValues.value.map(v => v.value), name:'영업지표',
          areaStyle:{ color:'rgba(232,88,122,0.2)' },
          lineStyle:{ color:'#e8587a', width:2 },
          itemStyle:{ color:'#e8587a' },
        }],
      }],
    }));

    /* COMP0402 경제 수준별 면적 꺾은선 */
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
        { name:'상위', type:'line', data: economySales.value.high,   smooth:true, symbolSize:4, lineStyle:{ color:'#7b1fa2' }, itemStyle:{ color:'#7b1fa2' }, areaStyle:{ color:'rgba(123,31,162,0.15)' } },
        { name:'중위', type:'line', data: economySales.value.middle, smooth:true, symbolSize:4, lineStyle:{ color:'#3b82f6' }, itemStyle:{ color:'#3b82f6' }, areaStyle:{ color:'rgba(59,130,246,0.12)' } },
        { name:'하위', type:'line', data: economySales.value.low,    smooth:true, symbolSize:4, lineStyle:{ color:'#10b981' }, itemStyle:{ color:'#10b981' }, areaStyle:{ color:'rgba(16,185,129,0.10)' } },
      ],
    }));

    /* COMP0403 배송 조건 도넛 */
    const shippingTypes = computed(() => {
      const COLORS = ['#10b981','#9ca3af','#3b82f6','#f59e0b'];
      return dash.info0403.map((r,i) => ({ name:r.col1Nm||'', value:r.col1Num||0, itemStyle:{ color:COLORS[i%COLORS.length] } }));
    });

    const cfOpt0403 = computed(() => ({
      tooltip: { trigger:'item', formatter: p => p.name + '배송: ' + p.value + '%' },
      legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
      series: [{
        type:'pie', radius:['40%','68%'], center:['38%','50%'],
        data: shippingTypes.value,
        label:{ show:false },
        emphasis:{ label:{ show:true, fontSize:11 } },
      }],
    }));

    /* ── X-View 히트맵 option ─────────────────────────── */
    const cfOptXview = computed(() => {
      const now  = Date.now();
      const from = now - 10 * 60 * 1000;
      const pts  = xviewData.value.map(p => [p.t, p.rt, p.err ? 2 : p.rt > 3000 ? 2 : p.rt > 500 ? 1 : 0, p.url||'', p.uiNm||'', p.cmdNm||'']);

      return {
        tooltip: {
          trigger: 'item',
          formatter: p => {
            const d   = new Date(p.data[0]);
            const hms = d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
            const lbl = ['정상','느림','오류'][p.data[2]] || '';
            const url   = p.data[3] || '';
            const uiNm  = p.data[4] || '';
            const cmdNm = p.data[5] || '';
            return hms + '<br/>응답시간: <b>' + p.data[1].toFixed(0) + 'ms</b><br/>상태: ' + lbl
              + (url   ? '<br/><span style="color:#7dd3fc;font-family:monospace;font-size:11px;">' + url + '</span>' : '')
              + (uiNm  ? '<br/><span style="color:#c4b5fd;">X-UI-Nm: <b>' + uiNm + '</b></span>' : '')
              + (cmdNm ? ' &nbsp;<span style="color:#6ee7b7;">X-Cmd-Nm: <b>' + cmdNm + '</b></span>' : '');
          },
        },
        toolbox: {
          feature: { dataZoom:{ yAxisIndex:'none', title:{ zoom:'범위 드래그', back:'초기화' } }, restore:{ title:'초기화' } },
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
          type: 'value', name: '응답시간(ms)', nameTextStyle:{ fontSize:10, color:'#888' },
          min: 0,
          axisLabel: { fontSize:10, color:'#888', formatter: v => v + 'ms' },
          splitLine: { lineStyle:{ color:'#f0f0f0' } },
        },
        visualMap: {
          show: true, type:'piecewise', categories: [0,1,2], dimension: 2,
          pieces: [
            { value:0, label:'정상 (<500ms)',    color:'#3b82f6' },
            { value:1, label:'느림 (<3000ms)',   color:'#f59e0b' },
            { value:2, label:'오류 / 매우 느림', color:'#ef4444' },
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
          status: p.err ? '오류' : p.rt > 3000 ? '매우 느림' : p.rt > 500 ? '느림' : '정상',
          statusColor: p.err ? '#ef4444' : p.rt > 3000 ? '#ef4444' : p.rt > 500 ? '#f59e0b' : '#10b981',
          url: p.url || '',
          uiNm: p.uiNm || '',
          cmdNm: p.cmdNm || '',
        };
      }).sort((a,b) => b.rt - a.rt);
      uiState.xviewDrillVisible = true;
    };

    /* ##### [06] 라이프사이클 #################################################### */

    onMounted(() => {
      document.addEventListener('click', _onDocClick);
      loadDashboard();
      xviewTimer = setInterval(() => {
        const now = Date.now();
        const rt  = Math.random() < 0.75 ? Math.random()*500 : Math.random()<0.7 ? 500+Math.random()*2500 : 3000+Math.random()*5000;
        const err = rt > 5000 && Math.random() < 0.3;
        const src = XVIEW_URLS[Math.floor(Math.random() * XVIEW_URLS.length)];
        xviewData.value = [...xviewData.value.filter(p => p.t > now - 10*60*1000), { t:now, rt:Math.round(rt), err, url:src.url, uiNm:src.uiNm, cmdNm:src.cmdNm }];
      }, 2000);
    });

    onUnmounted(() => {
      if (xviewTimer) clearInterval(xviewTimer);
      document.removeEventListener('click', _onDocClick);
    });

    const xviewDrillColumns = [
      { key: 'time',   label: '시각',   style: 'width:72px;', cellStyle: 'white-space:nowrap;' },
      { key: 'rt',     label: '응답시간', style: 'width:88px;', align: 'right',
        fmt: v => v + 'ms', cellStyle: 'font-weight:700;' },
      { key: 'status', label: '상태',   style: 'width:76px;', align: 'center',
        badge: row => ({ text: row.status, style: `background:${row.statusColor};color:#fff;font-size:10px;` }) },
      { key: 'url',    label: 'URL',    cellStyle: 'font-family:monospace;font-size:10.5px;color:#3b82f6;white-space:nowrap;' },
      { key: 'uiNm',  label: 'X-UI-Nm',  style: 'width:90px;', cellStyle: 'font-size:10.5px;color:#6366f1;white-space:nowrap;' },
      { key: 'cmdNm', label: 'X-Cmd-Nm', style: 'width:90px;', cellStyle: 'font-size:10.5px;color:#10b981;white-space:nowrap;' },
    ];

    const attrsGridColumns = [
      { key: 'k', label: '속성', style: 'width:38%;', cellStyle: 'color:#7dd3fc;font-size:10.5px;white-space:nowrap;font-weight:700;' },
      { key: 'v', label: '값',   style: 'width:28%;', cellStyle: 'color:#fbbf24;font-size:10.5px;white-space:nowrap;' },
      { key: 'd', label: '설명', cellStyle: 'color:#9ca3af;font-size:10px;' },
    ];

    return {
      uiState, filters, dash,
      handleBtnAction, handleSelectAction,
      cfBaseGridColumns, showPanel, isSel, xviewDrillColumns, attrsGridColumns,
      TABS, VIEW_MODES, CHANNELS, AGES, GENDERS, MEMBER_TYPES, CATEGORIES,
      fmt, pct,
      cfMonthLabels, cfTotalSales, cfTotalQtyComp, marginRate, cfAvgOrderValue,
      cfOpt0101, cfOpt0102, cfOpt0103, cfOpt0104,
      cfOpt0201, cfOpt0203, cfOpt0204,
      cfOpt0301, cfOpt0302, cfOpt0303, cfOpt0304,
      cfOpt0401, cfOpt0402, cfOpt0403,
      cfOptXview, onXviewBrush,
      fnOpenInfo, fnOpenXviewInfo, fnInfoTab, fnBuildApiParams,
    };
  },

  template: `
<div :class="(uiState.tabMode==='3col'||uiState.tabMode==='4col') ? 'dash-wide' : 'bo-wrap'">

  <!-- 헤더 -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%);border-radius:10px;color:#fff;">
    <div style="width:6px;height:24px;background:#e8587a;border-radius:3px;"></div>
    <span style="font-size:17px;font-weight:800;letter-spacing:-0.5px;">온라인 쇼핑몰 매출 및 판매현황</span>
    <span style="flex:1;"></span>
    <span style="font-size:11px;color:#aaa;">14개월 기준 · {{ cfMonthLabels.length > 0 ? (cfMonthLabels[0] + ' ~ ' + cfMonthLabels[cfMonthLabels.length-1]) : '-' }}</span>
  </div>

  <!-- 필터 -->
  <bo-container card-style="padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:#666;width:74px;">조회기간</span>
      <input type="date" v-model="filters.startDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <span style="color:#999;">~</span>
      <input type="date" v-model="filters.endDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <button class="btn_filter_toggle" @click="handleBtnAction('filters-toggleExpand')" style="font-size:11px;padding:4px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fafbfc;color:#555;">
        {{ uiState.filterExpand ? '▲ 상세필터 접기' : '▼ 상세필터 펼치기' }}
      </button>
      <span style="flex:1;"></span>
      <button class="btn btn_search"  @click="handleBtnAction('filters-search')" style="font-size:11px;">🔍 검색</button>
      <button class="btn btn_excel"   @click="handleBtnAction('stats-excel')" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;">📥 엑셀다운로드</button>
      <button class="btn btn_reset"   @click="handleBtnAction('filters-reset')" style="font-size:11px;">🔄 초기화</button>
    </div>
    <div v-if="uiState.filterExpand" style="display:flex;flex-direction:column;gap:8px;border-top:1px dashed #eee;padding-top:10px;">
      <div v-for="grp in [{key:'channels',label:'판매채널',all:CHANNELS},{key:'ages',label:'나이대',all:AGES},{key:'genders',label:'성별',all:GENDERS},{key:'memberTypes',label:'회원유형',all:MEMBER_TYPES},{key:'categories',label:'카테고리',all:CATEGORIES}]" :key="grp.key" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#666;width:74px;">{{ grp.label }}</span>
        <button @click="handleBtnAction('filters-toggleAll',{key:grp.key,all:grp.all})"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',background:filters[grp.key].length===grp.all.length?'#1a1a2e':'#fff',color:filters[grp.key].length===grp.all.length?'#fff':'#555',borderColor:filters[grp.key].length===grp.all.length?'#1a1a2e':'#ddd'}">전체</button>
        <button v-for="v in grp.all" :key="v" @click="handleBtnAction('filters-toggle',{key:grp.key,v})"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',background:isSel(filters[grp.key],v)?'#fff0f4':'#fafbfc',color:isSel(filters[grp.key],v)?'#e8587a':'#888',borderColor:isSel(filters[grp.key],v)?'#e8587a':'#e5e7eb',fontWeight:isSel(filters[grp.key],v)?700:400}">{{ v }}</button>
      </div>
    </div>
  </bo-container>

  <!-- 탭 바 + 뷰모드 -->
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
      <button v-for="vm in VIEW_MODES" :key="vm.key" @click="handleSelectAction('tabMode-set',vm.key)" :title="vm.label+'로 보기'"
        :style="{fontSize:'11px',padding:'4px 8px',borderRadius:'5px',border:'none',cursor:'pointer',minWidth:'34px',background:uiState.tabMode===vm.key?'#fff0f4':'transparent',color:uiState.tabMode===vm.key?'#e8587a':'#888',fontWeight:uiState.tabMode===vm.key?700:400}">
        {{ vm.icon }}
      </button>
    </div>
  </div>

  <!-- 차트 그리드 -->
  <div :style="{display:'grid',gridTemplateColumns:cfBaseGridColumns,gap:'12px'}">

    <!-- 1) 월별 매출 막대 -->
    <bo-container v-show="showPanel('sales')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'월별 매출현황',()=>cfOpt0101,'info0101',undefined,'COMP0101')" title="위젯 정보">💰</button>
        월별 매출현황 (14개월)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;font-weight:500;">총 {{ fmt(dash.info0101.reduce((a,r)=>a+(r.col1Num||0),0)) }}원</span>
      </div>
      <co-echart :option="cfOpt0101" height="260px" />
    </bo-container>

    <!-- 2) 가입/탈퇴 -->
    <bo-container v-show="showPanel('member')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'가입/탈퇴 현황',()=>cfOpt0102,'info0102',undefined,'COMP0102')" title="위젯 정보">👥</button>
        월별 고객 가입/탈퇴자 현황 (14개월)
      </div>
      <co-echart :option="cfOpt0102" height="260px" />
    </bo-container>

    <!-- 3) 상품 클릭 -->
    <bo-container v-show="showPanel('click')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'상품상세 클릭',()=>cfOpt0103,'info0103',undefined,'COMP0103')" title="위젯 정보">🖱</button>
        월별 상품상세 클릭 현황 (14개월)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;">총 {{ fmt(dash.info0103.reduce((a,r)=>a+(r.col1Num||0),0)) }}회</span>
      </div>
      <co-echart :option="cfOpt0103" height="260px" />
    </bo-container>

    <!-- 4) 주문완료 -->
    <bo-container v-show="showPanel('order')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'주문완료 현황',()=>cfOpt0104,'info0104',undefined,'COMP0104')" title="위젯 정보">📋</button>
        월별 주문완료 현황 (14개월)
        <span style="flex:1;"></span>
        <span style="font-size:11px;color:#888;">총 {{ fmt(dash.info0104.reduce((a,r)=>a+(r.col1Num||0),0)) }}건</span>
      </div>
      <co-echart :option="cfOpt0104" height="260px" />
    </bo-container>

    <!-- 5) 채널별 매출 멀티라인 -->
    <bo-container v-show="showPanel('channel')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'채널별 매출',()=>cfOpt0201,'info0201',undefined,'COMP0201')" title="위젯 정보">📺</button>
        월별 판매채널별 매출현황 (14개월)
      </div>
      <co-echart :option="cfOpt0201" height="300px" />
    </bo-container>

    <!-- 6) 핵심지표 KPI -->
    <bo-container v-show="showPanel('kpi')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'핵심지표 KPI',null,'info0202',undefined,'COMP0202')" title="위젯 정보">🎯</button>
        핵심지표
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        <div v-for="kpi in [
            {label:'전체 매출현황',value:fmt(cfTotalSales),unit:'원',color:'#e8587a',icon:'💰',bg:'#fff0f4'},
            {label:'전체 구매수량',value:fmt(cfTotalQtyComp),unit:'건',color:'#3b82f6',icon:'🛒',bg:'#eff6ff'},
            {label:'평균 마진율',value:pct(marginRate),unit:'',color:'#10b981',icon:'📈',bg:'#f0fdf4'},
            {label:'평균 결제금액',value:fmt(cfAvgOrderValue),unit:'원',color:'#f59e0b',icon:'💳',bg:'#fffbeb'},
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

    <!-- 7) 상품 TOP 7 수평 막대 -->
    <bo-container v-show="showPanel('topProducts')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'상품 TOP 7',()=>cfOpt0203,'info0203',undefined,'COMP0203')" title="위젯 정보">📦</button>
        상품별 매출 TOP 7
      </div>
      <co-echart :option="cfOpt0203" height="240px" />
    </bo-container>

    <!-- 8) 채널 도넛 -->
    <bo-container v-show="showPanel('channelMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'판매 채널별',()=>cfOpt0204,'info0204',undefined,'COMP0204')" title="위젯 정보">📱</button>
        판매 채널별
      </div>
      <co-echart :option="cfOpt0204" height="220px" />
    </bo-container>

    <!-- 9) 디바이스 도넛 -->
    <bo-container v-show="showPanel('deviceMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'디바이스별',()=>cfOpt0301,'info0301',undefined,'COMP0301')" title="위젯 정보">💻</button>
        디바이스별
      </div>
      <co-echart :option="cfOpt0301" height="220px" />
    </bo-container>

    <!-- 10) 시간대 도넛 -->
    <bo-container v-show="showPanel('timeMix')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'시간대별',()=>cfOpt0302,'info0302',undefined,'COMP0302')" title="위젯 정보">⏰</button>
        시간대별
      </div>
      <co-echart :option="cfOpt0302" height="220px" />
    </bo-container>

    <!-- 11) 지역별 수평 막대 -->
    <bo-container v-show="showPanel('region')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'지역별 매출',()=>cfOpt0303,'info0303',undefined,'COMP0303')" title="위젯 정보">🗺</button>
        지역별 매출현황
      </div>
      <co-echart :option="cfOpt0303" height="220px" />
    </bo-container>

    <!-- 12) 시간대 추이 꺾은선 -->
    <bo-container v-show="showPanel('hourly')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'시간대별 주문 추이',()=>cfOpt0304,'info0304',undefined,'COMP0304')" title="위젯 정보">⏱</button>
        시간대별 주문 추이 (24H)
      </div>
      <co-echart :option="cfOpt0304" height="180px" />
    </bo-container>

    <!-- 13) 영업지표 레이더 -->
    <bo-container v-show="showPanel('radar')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'영업 지표',()=>cfOpt0401,'info0401',undefined,'COMP0401')" title="위젯 정보">⚡</button>
        영업 지표 비교
      </div>
      <co-echart :option="cfOpt0401" height="220px" />
    </bo-container>

    <!-- 14) 경제 수준별 면적 -->
    <bo-container v-show="showPanel('economy')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'경제 수준별 매출',()=>cfOpt0402,'info0402',undefined,'COMP0402')" title="위젯 정보">💼</button>
        경제 수준별 매출현황
      </div>
      <co-echart :option="cfOpt0402" height="220px" />
    </bo-container>

    <!-- 15) 배송 조건 도넛 -->
    <bo-container v-show="showPanel('shipping')" card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'배송 조건별 매출',()=>cfOpt0403,'info0403',undefined,'COMP0403')" title="위젯 정보">🚚</button>
        배송 조건별 매출현황
      </div>
      <co-echart :option="cfOpt0403" height="220px" />
    </bo-container>

    <!-- 16) X-View 실시간 히트맵 -->
    <bo-container v-show="showPanel('xview')" card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
        <button class="dash-info-btn" @click.stop="fnOpenXviewInfo($event)" title="위젯 정보">🔥</button>
        X-View 실시간 트랜잭션 히트맵
        <span style="font-size:10px;font-weight:400;color:#10b981;background:#f0fdf4;padding:2px 8px;border-radius:10px;border:1px solid #bbf7d0;">● LIVE</span>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">드래그하여 범위 선택 → 트랜잭션 상세</span>
        <span style="font-size:10px;color:#888;">━ ━ 500ms 경고 &amp; ━ ━ 3000ms 오류</span>
      </div>
      <co-echart :option="cfOptXview" height="360px" @brush-selected="onXviewBrush" />

      <!-- X-View 드릴다운 테이블 -->
      <div v-if="uiState.xviewDrillVisible" style="margin-top:12px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="display:flex;align-items:center;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:12px;font-weight:700;color:#444;">선택 범위 트랜잭션 <span style="color:#e8587a;">{{ uiState.xviewDrillRows.length }}건</span></span>
          <span style="flex:1;"></span>
          <button class="btn btn_close" @click="handleBtnAction('xview-drill-close')" style="font-size:11px;padding:3px 10px;">✕ 닫기</button>
        </div>
        <div style="max-height:260px;overflow-y:auto;overflow-x:auto;">
          <bo-grid bare :columns="xviewDrillColumns" :rows="uiState.xviewDrillRows"
            empty-text="선택 범위에 데이터가 없습니다."
            style="font-size:11px;min-width:640px;" />
        </div>
      </div>
    </bo-container>

  </div>

  <!-- 위젯 정보 팝오버 -->
  <teleport to="body">
    <div v-if="uiState.infoPanel"
      @click.stop
      :style="{position:'absolute',top:uiState.infoPanel.top+'px',left:uiState.infoPanel.left+'px',width:'560px',background:'#fff',borderRadius:'10px',boxShadow:'0 8px 32px rgba(0,0,0,0.18)',border:'1px solid #e5e7eb',zIndex:9999,fontFamily:'monospace',overflow:'hidden'}">
      <!-- 팝오버 헤더 -->
      <div style="display:flex;align-items:center;padding:10px 14px;background:linear-gradient(135deg,#1a1a2e,#2d2d44);color:#fff;gap:8px;">
        <span style="font-size:13px;font-weight:700;">🔍 {{ uiState.infoPanel.title }}</span>
        <span style="flex:1;"></span>
        <button @click="handleBtnAction('info-close')"
          style="background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <!-- 탭 바 (3탭) -->
      <div style="display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;">
        <button @click="handleBtnAction('infoTab-set', 'src')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='src'?'2px solid #10b981':'2px solid transparent',color:uiState.infoPanel.tab==='src'?'#10b981':'#666',background:'transparent'}">
          📝 소스정보
        </button>
        <button @click="handleBtnAction('infoTab-set', 'opt')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='opt'?'2px solid #e8587a':'2px solid transparent',color:uiState.infoPanel.tab==='opt'?'#e8587a':'#666',background:'transparent'}">
          ⚙ ECharts Option
        </button>
        <button @click="handleBtnAction('infoTab-set', 'data')"
          :style="{flex:1,padding:'7px 4px',fontSize:'11px',fontWeight:700,border:'none',cursor:'pointer',borderBottom:uiState.infoPanel.tab==='data'?'2px solid #3b82f6':'2px solid transparent',color:uiState.infoPanel.tab==='data'?'#3b82f6':'#666',background:'transparent'}">
          📊 원시 데이터
        </button>
      </div>
      <!-- 소스정보 탭 본문 -->
      <div v-if="uiState.infoPanel.tab==='src'" style="padding:14px 16px;font-size:11px;line-height:1.7;max-height:400px;overflow-y:auto;background:#fafbfc;display:flex;flex-direction:column;gap:12px;">
        <template v-if="uiState.infoPanel.src">
          <!-- API 섹션 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">API 엔드포인트</div>
            <div style="background:#1e1e2e;color:#7dd3fc;border-radius:6px;padding:8px 12px;font-size:11px;">{{ uiState.infoPanel.src.url }}</div>
          </div>
          <!-- 요청 파라미터 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">요청 파라미터 (현재 필터 기준)</div>
            <div v-if="uiState.infoPanel.apiParams" style="background:#1e1e2e;border-radius:6px;overflow:hidden;">
              <table style="width:100%;border-collapse:collapse;">
                <tr v-for="(v,k) in uiState.infoPanel.apiParams" :key="k">
                  <td style="padding:4px 10px;color:#a78bfa;font-size:10.5px;border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap;width:40%;">{{ k }}</td>
                  <td style="padding:4px 10px;color:#cdd6f4;font-size:10.5px;border-bottom:1px solid rgba(255,255,255,0.06);">{{ v }}</td>
                </tr>
              </table>
            </div>
            <div v-else style="color:#aaa;font-size:11px;padding:6px 0;">(실시간 로컬 생성 — API 미사용)</div>
          </div>
          <!-- 차트 유형 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">차트 유형</div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fff0f4;border:1px solid #fecdd3;border-radius:6px;padding:5px 12px;color:#e8587a;font-size:11px;font-weight:700;">
              📊 {{ uiState.infoPanel.src.chartType }}
            </div>
          </div>
          <!-- 데이터 필드 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">응답 데이터 필드 (data.{{ uiState.infoPanel.src.dataKey }})</div>
            <div style="background:#1e1e2e;color:#86efac;border-radius:6px;padding:8px 12px;font-size:10.5px;line-height:1.8;">{{ uiState.infoPanel.src.fields }}</div>
          </div>
          <!-- 설명 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">위젯 설명</div>
            <div style="background:#f0fdf4;border-left:3px solid #10b981;border-radius:0 6px 6px 0;padding:8px 12px;color:#065f46;font-size:11px;line-height:1.7;font-family:sans-serif;">{{ uiState.infoPanel.src.desc }}</div>
          </div>
          <!-- 템플릿 마크업 -->
          <div v-if="uiState.infoPanel.src.tag">
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">템플릿 마크업</div>
            <div style="background:#1e1e2e;border-radius:6px;overflow:hidden;">
              <pre style="margin:0;padding:10px 14px;font-size:11px;line-height:1.7;color:#e2a7f0;white-space:pre;overflow-x:auto;">{{ uiState.infoPanel.src.tag }}</pre>
            </div>
            <!-- 속성 매핑 테이블 -->
            <div v-if="uiState.infoPanel.src.attrs" style="margin-top:8px;background:#1e1e2e;border-radius:6px;overflow:hidden;">
              <div style="padding:5px 12px;background:rgba(255,255,255,0.05);font-size:9.5px;font-weight:700;color:#888;letter-spacing:0.5px;text-transform:uppercase;">속성 매핑</div>
              <bo-grid bare :columns="attrsGridColumns" :rows="uiState.infoPanel.src.attrs" row-key="k" />
            </div>
          </div>
        </template>
        <div v-else style="color:#aaa;padding:20px;text-align:center;">소스정보가 없습니다.</div>
      </div>
      <!-- ECharts Option / 원시 데이터 탭 본문 -->
      <div v-if="uiState.infoPanel.tab==='opt' || uiState.infoPanel.tab==='data'" style="position:relative;">
        <!-- 원시 데이터 탭일 때 API 정보 헤더 -->
        <div v-if="uiState.infoPanel.tab==='data' &amp;&amp; uiState.infoPanel.src" style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:#f8fafc;border-bottom:1px solid #e5e7eb;font-size:10.5px;">
          <span style="color:#888;">URL</span>
          <span style="color:#3b82f6;font-weight:700;">{{ uiState.infoPanel.src.url }}</span>
          <span style="color:#aaa;margin-left:4px;">→</span>
          <span style="color:#10b981;font-weight:700;">data.{{ uiState.infoPanel.src.dataKey }}</span>
        </div>
        <pre :style="{margin:0,padding:'12px 14px',fontSize:'10.5px',lineHeight:'1.55',maxHeight:'360px',overflowY:'auto',overflowX:'auto',background:'#1e1e2e',color:'#cdd6f4',whiteSpace:'pre',tabSize:2}">{{ uiState.infoPanel.tab==='opt' ? uiState.infoPanel.optJson : uiState.infoPanel.dataJson }}</pre>
        <button @click="handleBtnAction('clipboard-copy', uiState.infoPanel.tab==='opt'?uiState.infoPanel.optJson:uiState.infoPanel.dataJson)"
          title="클립보드 복사"
          style="position:absolute;top:8px;right:10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#aaa;border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;">
          📋 복사
        </button>
      </div>
    </div>
  </teleport>

</div>

<style>
.dash-info-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 0 2px;
  line-height: 1;
  border-radius: 4px;
  transition: transform 0.15s, background 0.15s;
  flex-shrink: 0;
}
.dash-info-btn:hover {
  transform: scale(1.25);
  background: rgba(232,88,122,0.10);
}
.dash-info-btn:active {
  transform: scale(0.95);
}
</style>
`,
};
