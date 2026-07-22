/* ShopJoy Admin - App모니터대시보드 (ECharts 기반, API 트랜잭션 실시간 모니터링)
 * DashboardBoEc01 의 X-View 실시간 트랜잭션 히트맵을 이식 + APM 성격 차트 추가
 * (호출량 Top / 응답시간 추이 / 상태 분포)
 */
window.DashboardBoAppMonitor = {
  name: 'DashboardBoAppMonitor',
  props: {
    navigate: { type: Function, required: true },
  },
  setup() {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted } = Vue;

    const uiState = reactive({
      infoPanel: null, /* { title, optJson, dataJson, top, left } */
    });

    /* 기간 선택 옵션 (호출량 Top10 / 응답시간 Top10 공용 정의, 각자 독립 선택값 보유) */
    const RANGE_OPTS = [
      { value: 10   * 60 * 1000, label: '10분' },
      { value: 30   * 60 * 1000, label: '30분' },
      { value: 60   * 60 * 1000, label: '1시간' },
      { value: 2*60 * 60 * 1000, label: '2시간' },
      { value: 6*60 * 60 * 1000, label: '6시간' },
      { value: 12*60* 60 * 1000, label: '12시간' },
      { value: 24*60* 60 * 1000, label: '1일' },
      { value: 48*60* 60 * 1000, label: '2일' },
    ];
    const MAX_RANGE_MS = RANGE_OPTS[RANGE_OPTS.length - 1].value;
    const topUrlRange = ref(RANGE_OPTS[0].value);
    const rtTopRange  = ref(RANGE_OPTS[0].value);
    const cfTopUrlRangeLabel = computed(() => RANGE_OPTS.find(o => o.value === topUrlRange.value)?.label || '');
    const cfRtTopRangeLabel  = computed(() => RANGE_OPTS.find(o => o.value === rtTopRange.value)?.label  || '');

    const WIDGET_SRC = {
      XVIEW: { compId:'(없음)', chartType:'scatter + brush (X-View 히트맵)', url:'(로컬 목업 — 실시간 생성)', dataKey:'xviewData', fields:'t(timestamp ms) / rt(응답시간ms) / err(boolean)', desc:'브라우저 로컬에서 800개 랜덤 포인트 생성. 2초마다 새 포인트 추가. 실제 구현 시 APM 에이전트 데이터 연동 필요.',
        tag:'<co-echart\n  :option="cfOptXview"\n  height="360px"\n  @brush-selected="onXviewBrush"\n/>',
        attrs:[{k:':option',v:'cfOptXview',d:'scatter series — 정상(파랑)/에러(빨강), brush toolbox 포함'},{k:'height',v:'"360px"',d:'드릴다운 영역 포함 높이'},{k:'@brush-selected',v:'onXviewBrush',d:'브러시 선택 시 드릴다운 테이블 갱신 emit 핸들러'}] },
      TOPURL:   { compId:'(없음)', chartType:'bar (수평 막대)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'url / uiNm / cmdNm 별 호출건수 집계 (선택 기간)', desc:'선택한 기간(10분~2일) 트랜잭션을 URL 기준 집계해 호출량 상위 10개를 표시.',
        tag:'<co-echart\n  :option="cfOptTopUrl"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOptTopUrl',d:'bar horizontal — url 별 count 내림차순 Top10, topUrlRange 기간 필터'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      RTTOP:    { compId:'(없음)', chartType:'bar (수평 막대, 4단계 색상)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'url 별 평균 응답시간(ms) 집계 (선택 기간)', desc:'선택한 기간(10분~2일) 트랜잭션을 URL 기준 평균 응답시간 집계해 상위 10개 표시. 쾌적(<500ms)/일반(<1500ms)/경고(<3000ms)/위험(≥3000ms) 4단계 색상.',
        tag:'<co-echart\n  :option="cfOptRtTop"\n  height="260px"\n/>',
        attrs:[{k:':option',v:'cfOptRtTop',d:'bar horizontal — url 별 평균 응답시간 내림차순 Top10, rtTopRange 기간 필터, itemStyle.color 콜백으로 4단계 색상'},{k:'height',v:'"260px"',d:'캔버스 높이'}] },
      RTTREND:  { compId:'(없음)', chartType:'line (10초 버킷 평균/최대 응답시간)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'t(10초 버킷) / avgRt / maxRt', desc:'10초 단위로 평균·최대 응답시간을 집계한 추이선.',
        tag:'<co-echart\n  :option="cfOptRtTrend"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOptRtTrend',d:'line 2 series — 평균/최대 응답시간'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
      STATUSPIE:{ compId:'(없음)', chartType:'pie (파이 차트)', url:'(로컬 목업 — xviewData 집계)', dataKey:'xviewData', fields:'상태별(정상/느림/오류) 비중', desc:'최근 10분 트랜잭션의 상태 분포.',
        tag:'<co-echart\n  :option="cfOptStatusPie"\n  height="220px"\n/>',
        attrs:[{k:':option',v:'cfOptStatusPie',d:'pie series — 정상/느림/오류 3종 색상'},{k:'height',v:'"220px"',d:'캔버스 높이'}] },
    };

    /* 위젯 정보 팝오버 열기
     * optGetter  : () => ECharts option 반환 함수 (없으면 null)
     * rawOverride: 원시 데이터로 사용할 배열
     * srcKey     : WIDGET_SRC 키
     */
    const fnOpenInfo = (e, title, optGetter, rawOverride, srcKey) => {
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
      const src = srcKey ? WIDGET_SRC[srcKey] : null;
      uiState.infoPanel = {
        title,
        optJson:  optObj      ? JSON.stringify(optObj,      null, 2) : '(없음)',
        dataJson: rawOverride ? JSON.stringify(rawOverride, null, 2) : '(없음)',
        src, apiParams: null,
        tab: 'opt',
        top:  rect.bottom + scrollY + 6,
        left: Math.min(rect.left  + scrollX, window.innerWidth - 560),
      };
    };

    /* 팝오버 탭 전환 */
    const fnInfoTab = (t) => { if (uiState.infoPanel) uiState.infoPanel.tab = t; };

    const _onDocClick = () => { uiState.infoPanel = null; };

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'info-close')        { uiState.infoPanel = null; return; }
      if (cmd === 'infoTab-set')       { fnInfoTab(param); return; }
      if (cmd === 'clipboard-copy')    { if (param) navigator.clipboard.writeText(param); return; }
      console.warn('[handleBtnAction] unknown cmd:', cmd);
    };

    /* ##### [03] X-View 히트맵 목업 데이터 ######################################## */

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
    const _buildPoint = (t) => {
      const rt = Math.random() < 0.75
        ? Math.random() * 500
        : Math.random() < 0.7
          ? 500 + Math.random() * 2500
          : 3000 + Math.random() * 5000;
      const err = rt > 5000 && Math.random() < 0.3;
      const src = XVIEW_URLS[Math.floor(Math.random() * XVIEW_URLS.length)];
      return { t, rt: Math.round(rt), err, url: src.url, uiNm: src.uiNm, cmdNm: src.cmdNm };
    };

    /* X-View 히트맵(최근 10분)은 밀도 800포인트 유지 + 기간선택(최대 2일)용 저밀도 포인트를 추가 생성 */
    const buildXviewData = () => {
      const now = Date.now();
      const pts = [];
      for (let i = 0; i < 800; i++) pts.push(_buildPoint(now - Math.random() * 10 * 60 * 1000));
      for (let i = 0; i < 2000; i++) pts.push(_buildPoint(now - Math.random() * MAX_RANGE_MS));
      return pts;
    };

    const xviewData = ref(buildXviewData());
    let xviewTimer  = null;
    const cfXviewSample = computed(() => xviewData.value.slice(0, 10));

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
          /* series 를 scatter 1개로 단순화(경고선은 markLine 으로 이동)하고 seriesIndex:0 명시.
           * 예전엔 line(경고선) 시리즈 + scatter(large:true) 조합이라 ECharts 5.6.0 brush 의
           * overallReset 내부에서 TypeError(undefined.push) 발생 → brushSelected 미발생. */
          seriesIndex: 0,
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
        /* brush 는 scatter 단일 시리즈(index 0)만 대상. 경고선(500/3000ms)은 별도 line 시리즈
         * 대신 scatter 의 markLine 으로 그려 series 배열을 1개로 유지 → brush overallReset 오류 회피.
         * large:true 도 제거(brush 선택 index 집계와 상충). */
        series: [
          {
            type:'scatter', data: pts,
            symbolSize: 4,
            encode: { x:0, y:1, itemName:0 },
            markLine: {
              symbol: 'none', silent: true,
              label: { show: false },
              data: [
                { yAxis: 500,  lineStyle:{ type:'dashed', color:'#f59e0b', width:1.5 } },
                { yAxis: 3000, lineStyle:{ type:'dashed', color:'#ef4444', width:1.5 } },
              ],
            },
          },
        ],
      };
    });

    /* fnXviewChartReady — 차트 준비 시 Box Select(브러시 rect) 기본 활성화 */
    const fnXviewChartReady = (chart) => {
      chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: 'rect', brushMode: 'single' } });
    };

    /* postMessage 로 넘길 팝업 origin (window.pageUrl 결과 기준) — 수신측 검증용 */
    const XVIEW_POP_ORIGIN = window.location.origin;
    let xviewPopupWin = null;

    /* 팝업이 로드 완료 후 'xview-ready' 를 보내오면 그 시점에 실 데이터를 postMessage 로 전달
     * (window.open URL 에는 아무 데이터도 싣지 않으므로 선택 건수 제한이 없음) */
    const _onXviewPopupMsg = (e) => {
      if (e.origin !== XVIEW_POP_ORIGIN || !e.data || e.data.type !== 'xview-ready') return;
      if (!xviewPopupWin || e.source !== xviewPopupWin) return;
      xviewPopupWin.postMessage({ type: 'xview-data', rows: xviewPendingRows }, XVIEW_POP_ORIGIN);
    };
    let xviewPendingRows = [];

    const onXviewBrush = (params) => {
      /* brushSelected payload 구조: params.batch[0].selected[0].dataIndex 에
       * 선택된 scatter 포인트의 데이터 인덱스 배열이 담김. (params.areas 아님) */
      const batch = params.batch && params.batch[0];
      if (!batch) return;
      const sel = batch.selected && batch.selected[0];
      const idxList = sel && sel.dataIndex;
      if (!idxList || !idxList.length) return;
      const selected = idxList
        .map(i => xviewData.value[i])
        .filter(Boolean)
        .map(p => {
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
        })
        .sort((a,b) => b.rt - a.rt);
      if (!selected.length) return;
      xviewPendingRows = selected;
      xviewPopupWin = window.open(
        window.pageUrl('bo-dash-appMon-xviewReal-boxlist-pop.html'),
        'xviewBoxList', 'width=1040,height=680,resizable=yes,scrollbars=yes',
      );
    };

    /* ── 호출량 Top10 (URL 집계, 선택 기간 필터) option ─────────────────────────── */
    const cfOptTopUrl = computed(() => {
      const from = Date.now() - topUrlRange.value;
      const cnt = {};
      xviewData.value.forEach(p => { if (p.t >= from) cnt[p.url] = (cnt[p.url] || 0) + 1; });
      const top = Object.entries(cnt).sort((a,b) => b[1]-a[1]).slice(0, 10).reverse();
      return {
        tooltip: { trigger:'axis', axisPointer:{ type:'shadow' } },
        grid: { top:8, right:24, bottom:24, left:170 },
        xAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        yAxis: { type:'category', data: top.map(t => t[0]), axisLabel:{ fontSize:9.5, color:'#666', fontFamily:'monospace' } },
        series: [{ type:'bar', data: top.map(t => t[1]), itemStyle:{ color:'#6366f1', borderRadius:[0,4,4,0] }, barMaxWidth: 16 }],
      };
    });

    /* 평균 응답시간 등급 색상 — 쾌적 <500ms / 일반 <1500ms / 경고 <3000ms / 위험 ≥3000ms */
    const RT_GRADES = [
      { max: 500,  label:'쾌적', color:'#3b82f6' },
      { max: 1500, label:'일반', color:'#10b981' },
      { max: 3000, label:'경고', color:'#f59e0b' },
      { max: Infinity, label:'위험', color:'#ef4444' },
    ];
    const fnRtGrade = (rt) => RT_GRADES.find(g => rt < g.max) || RT_GRADES[RT_GRADES.length - 1];

    /* ── 응답시간 Top10 (URL별 평균 응답시간, 선택 기간 필터) option ─────────────────────────── */
    const cfOptRtTop = computed(() => {
      const from = Date.now() - rtTopRange.value;
      const sums = {};
      xviewData.value.forEach(p => {
        if (p.t < from) return;
        if (!sums[p.url]) sums[p.url] = { sum: 0, cnt: 0 };
        sums[p.url].sum += p.rt;
        sums[p.url].cnt += 1;
      });
      const top = Object.entries(sums)
        .map(([url, v]) => [url, Math.round(v.sum / v.cnt)])
        .sort((a,b) => b[1]-a[1]).slice(0, 10).reverse();
      return {
        tooltip: {
          trigger:'axis', axisPointer:{ type:'shadow' },
          formatter: p => { const d = p[0]; return d.name + '<br/>평균 응답시간: <b>' + d.value + 'ms</b> (' + fnRtGrade(d.value).label + ')'; },
        },
        grid: { top:8, right:24, bottom:24, left:170 },
        xAxis: { type:'value', name:'ms', nameTextStyle:{ fontSize:10, color:'#888' }, axisLabel:{ fontSize:10, color:'#888' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        yAxis: { type:'category', data: top.map(t => t[0]), axisLabel:{ fontSize:9.5, color:'#666', fontFamily:'monospace' } },
        series: [{
          type:'bar', data: top.map(t => t[1]),
          itemStyle: { color: p => fnRtGrade(p.value).color, borderRadius:[0,4,4,0] },
          barMaxWidth: 16,
        }],
      };
    });

    /* ── 응답시간 추이(10초 버킷 평균/최대) option ─────────────────────────── */
    const cfOptRtTrend = computed(() => {
      const now = Date.now();
      const bucketMs = 10 * 1000;
      const from = now - 10 * 60 * 1000;
      const buckets = {};
      xviewData.value.forEach(p => {
        const b = Math.floor(p.t / bucketMs) * bucketMs;
        if (!buckets[b]) buckets[b] = [];
        buckets[b].push(p.rt);
      });
      const keys = Object.keys(buckets).map(Number).sort((a,b) => a-b);
      const avgData = keys.map(k => [k, Math.round(buckets[k].reduce((s,v)=>s+v,0) / buckets[k].length)]);
      const maxData = keys.map(k => [k, Math.max(...buckets[k])]);
      return {
        tooltip: { trigger:'axis' },
        legend: { data:['평균','최대'], top:0, textStyle:{ fontSize:10 } },
        grid: { top:28, right:24, bottom:28, left:56 },
        xAxis: {
          type:'time', min: from, max: now,
          axisLabel: { fontSize:10, color:'#888', formatter: v => { const d = new Date(v); return d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0'); } },
          splitLine: { show:false },
        },
        yAxis: { type:'value', axisLabel:{ fontSize:10, color:'#888', formatter: v => v+'ms' }, splitLine:{ lineStyle:{ color:'#f0f0f0' } } },
        series: [
          { name:'평균', type:'line', data: avgData, smooth:true, showSymbol:false, lineStyle:{ color:'#3b82f6', width:2 } },
          { name:'최대', type:'line', data: maxData, smooth:true, showSymbol:false, lineStyle:{ color:'#ef4444', width:1.5, type:'dashed' } },
        ],
      };
    });

    /* ── 상태 분포 파이 option ─────────────────────────── */
    const cfOptStatusPie = computed(() => {
      let ok = 0, slow = 0, err = 0;
      xviewData.value.forEach(p => {
        if (p.err || p.rt > 3000) err++;
        else if (p.rt > 500) slow++;
        else ok++;
      });
      return {
        tooltip: { trigger:'item', formatter: p => p.name + ': ' + p.value + '건 (' + p.percent + '%)' },
        legend: { orient:'vertical', right:8, top:'center', textStyle:{ fontSize:10 } },
        series: [{
          type:'pie', radius:['40%','68%'], center:['38%','50%'],
          data: [
            { name:'정상', value: ok,   itemStyle:{ color:'#3b82f6' } },
            { name:'느림', value: slow, itemStyle:{ color:'#f59e0b' } },
            { name:'오류', value: err,  itemStyle:{ color:'#ef4444' } },
          ],
          label:{ show:false },
          emphasis:{ label:{ show:true, fontSize:11 } },
        }],
      };
    });


    const attrsGridColumns = [
      { key: 'k', label: '속성', style: 'width:38%;', cellStyle: 'color:#7dd3fc;font-size:10.5px;white-space:nowrap;font-weight:700;' },
      { key: 'v', label: '값',   style: 'width:28%;', cellStyle: 'color:#fbbf24;font-size:10.5px;white-space:nowrap;' },
      { key: 'd', label: '설명', cellStyle: 'color:#cdd6f4;font-size:10.5px;' },
    ];

    /* ##### [04] 라이프사이클 #################################################### */

    onMounted(() => {
      document.addEventListener('click', _onDocClick);
      window.addEventListener('message', _onXviewPopupMsg);
      xviewTimer = setInterval(() => {
        const now = Date.now();
        xviewData.value = [...xviewData.value.filter(p => p.t > now - MAX_RANGE_MS), _buildPoint(now)];
      }, 2000);
    });

    onUnmounted(() => {
      if (xviewTimer) clearInterval(xviewTimer);
      document.removeEventListener('click', _onDocClick);
      window.removeEventListener('message', _onXviewPopupMsg);
    });

    /* ##### [05] return (템플릿 노출) ############################################## */

    return {
      uiState, attrsGridColumns, cfXviewSample,
      RANGE_OPTS, topUrlRange, rtTopRange, cfTopUrlRangeLabel, cfRtTopRangeLabel,
      cfOptXview, cfOptTopUrl, cfOptRtTop, cfOptRtTrend, cfOptStatusPie,
      onXviewBrush, fnXviewChartReady, fnOpenInfo, fnInfoTab,
      handleBtnAction,
    };
  },
  template: /* html */`
<bo-page title="App모니터대시보드"
  desc-summary="API 트랜잭션 응답시간·호출량·에러율을 실시간으로 모니터링합니다.">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

    <!-- 1) X-View 실시간 히트맵 -->
    <bo-container card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'X-View 히트맵',()=>cfOptXview,cfXviewSample,'XVIEW')" title="위젯 정보">🔥</button>
        X-View 실시간 트랜잭션 히트맵
        <span style="font-size:10px;font-weight:400;color:#10b981;background:#f0fdf4;padding:2px 8px;border-radius:10px;border:1px solid #bbf7d0;">● LIVE</span>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">박스 드래그 → 트랜잭션 목록 새창</span>
        <span style="font-size:10px;color:#888;">━ ━ 500ms 경고 &amp; ━ ━ 3000ms 오류</span>
      </div>
      <co-echart :option="cfOptXview" height="360px" @brush-selected="onXviewBrush" @ready="fnXviewChartReady" />
    </bo-container>

    <!-- 2) 호출량 Top10 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'API 호출량 Top10',()=>cfOptTopUrl,null,'TOPURL')" title="위젯 정보">📊</button>
        API 호출량 Top10
        <select v-model="topUrlRange" class="form-control" style="width:auto;font-size:11px;padding:2px 6px;height:24px;">
          <option v-for="o in RANGE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">최근 {{ cfTopUrlRangeLabel }}</span>
      </div>
      <co-echart :option="cfOptTopUrl" height="260px" />
    </bo-container>

    <!-- 3) 응답시간 Top10 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'API 응답시간 Top10',()=>cfOptRtTop,null,'RTTOP')" title="위젯 정보">⏱</button>
        API 응답시간 Top10
        <select v-model="rtTopRange" class="form-control" style="width:auto;font-size:11px;padding:2px 6px;height:24px;">
          <option v-for="o in RANGE_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <span style="flex:1;"></span>
        <span style="font-size:10px;color:#888;">최근 {{ cfRtTopRangeLabel }}</span>
        <span style="font-size:10px;color:#888;">🔵 쾌적 &lt;500ms · 🟢 일반 &lt;1500ms · 🟠 경고 &lt;3000ms · 🔴 위험 ≥3000ms</span>
      </div>
      <co-echart :option="cfOptRtTop" height="260px" />
    </bo-container>

    <!-- 4) 상태 분포 -->
    <bo-container card-style="padding:14px;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'트랜잭션 상태 분포',()=>cfOptStatusPie,null,'STATUSPIE')" title="위젯 정보">🟢</button>
        트랜잭션 상태 분포 (최근 10분)
      </div>
      <co-echart :option="cfOptStatusPie" height="220px" />
    </bo-container>

    <!-- 5) 응답시간 추이 -->
    <bo-container card-style="padding:14px;" style="grid-column:1/-1;">
      <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <button class="dash-info-btn" @click.stop="fnOpenInfo($event,'응답시간 추이',()=>cfOptRtTrend,null,'RTTREND')" title="위젯 정보">⏱</button>
        응답시간 추이 (10초 버킷 평균/최대)
      </div>
      <co-echart :option="cfOptRtTrend" height="220px" />
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
          <!-- 차트 유형 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">차트 유형</div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:#fff0f4;border:1px solid #fecdd3;border-radius:6px;padding:5px 12px;color:#e8587a;font-size:11px;font-weight:700;">
              📊 {{ uiState.infoPanel.src.chartType }}
            </div>
          </div>
          <!-- 데이터 필드 -->
          <div>
            <div style="font-size:10px;font-weight:700;color:#888;letter-spacing:0.5px;margin-bottom:6px;text-transform:uppercase;">데이터 필드</div>
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
        <pre :style="{margin:0,padding:'12px 14px',fontSize:'10.5px',lineHeight:'1.55',maxHeight:'360px',overflowY:'auto',overflowX:'auto',background:'#1e1e2e',color:'#cdd6f4',whiteSpace:'pre',tabSize:2}">{{ uiState.infoPanel.tab==='opt' ? uiState.infoPanel.optJson : uiState.infoPanel.dataJson }}</pre>
        <button @click="handleBtnAction('clipboard-copy', uiState.infoPanel.tab==='opt'?uiState.infoPanel.optJson:uiState.infoPanel.dataJson)"
          title="클립보드 복사"
          style="position:absolute;top:8px;right:10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#aaa;border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;">
          📋 복사
        </button>
      </div>
    </div>
  </teleport>

</bo-page>

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
