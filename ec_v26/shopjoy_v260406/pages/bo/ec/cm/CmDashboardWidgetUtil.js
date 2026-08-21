/* ShopJoy Admin - 대시보드 항목 공용 렌더 유틸 (window.cmDashWidgetUtil)
 * CmDashboardLayoutMng(항목배치 시뮬레이션) / CmDashboardMyMng(개인화 대시보드) 공용.
 * cm_dashboard_item(chartTypeCd/series[]/optionJson) + cm_dashboard_item_data(rows)
 * 를 받아 ECharts 옵션 또는 KPI 카드 정보를 생성한다.
 * 로드 순서: bo.html 에서 CmDashboardLayoutMng.js / CmDashboardMyMng.js 보다 먼저 로드 필수.
 */
(function (global) {
  'use strict';

  /* 차트 유형 목록 — cm_dashboard_item.chart_type 실사용 값 기준 */
  /* 항목유형 — 무엇을 그리는가. 차트종류(CHART_TYPES)와 범주가 다르다.
     KPI/TABLE 은 차트가 아니므로 chart_type 에 섞지 않는다 (cm_dashboard_item.item_type_cd). */
  const ITEM_TYPES = [
    { value: 'KPI',   label: 'KPI 카드', icon: '🔢' },
    { value: 'CHART', label: '차트',     icon: '📊' },
    { value: 'TABLE', label: '목록',     icon: '📋' },
  ];
  const itemTypeIcon  = (t) => (ITEM_TYPES.find(c => c.value === t) || {}).icon  || '📊';
  const itemTypeLabel = (t) => (ITEM_TYPES.find(c => c.value === t) || {}).label || (t || '-');

  /* 차트종류 — item_type_cd = 'CHART' 일 때만 의미가 있다 */
  const CHART_TYPES = [
    { value: 'bar',        label: '막대',     icon: '📊' },
    { value: 'stackedBar', label: '누적막대', icon: '📶' },  /* 카테고리당 막대 1개, 그 안에 시리즈별 값이 쌓여 분포를 보여준다 */
    { value: 'line',       label: '꺾은선',   icon: '📈' },
    { value: 'pie',        label: '파이',     icon: '🥧' },
    { value: 'radar',      label: '레이더',   icon: '🕸' },
    { value: 'heatmap',    label: '히트맵',   icon: '🔥' },
    { value: 'scatter',    label: '산점도',   icon: '⚡' },
  ];
  const chartTypeIcon  = (t) => (CHART_TYPES.find(c => c.value === t) || {}).icon  || '📊';
  const chartTypeLabel = (t) => (CHART_TYPES.find(c => c.value === t) || {}).label || (t || '-');

  /** 항목유형 정규화 — item_type_cd 가 없는 구 데이터는 chart_type 으로 추정한다 */
  const itemTypeOf = (item) => {
    /* 위젯유형은 widget_type_cd 가 기준이다 (2026-08-21).
       item_type_cd 는 트리 레벨(chart/series/item) 로 의미가 바뀌었으므로 그 값이 오면 무시한다.
       구 데이터가 KPI/CHART/TABLE 을 아직 item_type_cd 에 갖고 있을 때만 폴백으로 쓴다. */
    if (item && item.widgetTypeCd) return item.widgetTypeCd;
    const legacy = (item && item.itemTypeCd) || '';
    if (legacy === 'KPI' || legacy === 'CHART' || legacy === 'TABLE') return legacy;
    const ct = (item && item.chartTypeCd || '').toLowerCase();
    if (ct === 'kpi')   return 'KPI';
    if (ct === 'table') return 'TABLE';
    return 'CHART';
  };

  const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  /* PALETTE 와 같은 순서의 옅은 배경색 — KPI 카드 배경(§어제의 현황 톤과 동일한 파스텔) */
  const PALETTE_BG = ['#f0f0ff', '#f0fdf4', '#fffbeb', '#fff5f5', '#eff6ff', '#f5f0ff', '#fdf2f8', '#f0fdfa', '#fff7ed'];
  /* kpiColorOf(idx) → KPI 카드 순번 기준 {color, bg} 팔레트 매칭 (색상+파스텔 배경 고정 페어) */
  const kpiColorOf = (idx) => ({
    color: PALETTE[(idx || 0) % PALETTE.length],
    bg:    PALETTE_BG[(idx || 0) % PALETTE_BG.length],
  });

  /* DASH_WIDGET_COLORS_01~10 — 차트마다 고를 수 있는 시리즈 색상 팔레트 10종.
     CmDashboardItemMng.js "색상 팔레트" select 가 이 중 하나를 골라 cm_dashboard_item.optionJson
     의 colorPaletteCd 로 저장한다(2026-08-21) — 새 DB 컬럼 없이 기존 옵션 오버라이드 JSON 재사용. */
  const DASH_WIDGET_COLORS_01 = ['#e8587a', '#3b82f6', '#16a34a', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const DASH_WIDGET_COLORS_02 = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7', '#14b8a6', '#f43f5e', '#6366f1'];
  const DASH_WIDGET_COLORS_03 = ['#fca5a5', '#fdba74', '#fde047', '#bef264', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd'];
  const DASH_WIDGET_COLORS_04 = ['#1e3a5f', '#2d4a75', '#3b6cb4', '#5b8bd4', '#7ba3e0', '#9dbde8', '#c1d5f0', '#0f2540'];
  const DASH_WIDGET_COLORS_05 = ['#7c2d12', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#431407'];
  const DASH_WIDGET_COLORS_06 = ['#14532d', '#166534', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#052e16'];
  const DASH_WIDGET_COLORS_07 = ['#581c87', '#7e22ce', '#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#3b0764'];
  const DASH_WIDGET_COLORS_08 = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#475569', '#1e293b'];
  const DASH_WIDGET_COLORS_09 = ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#0f766e', '#0d9488', '#14b8a6'];
  const DASH_WIDGET_COLORS_10 = ['#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#422006'];

  const DASH_WIDGET_COLOR_SETS = {
    DASH_WIDGET_COLORS_01, DASH_WIDGET_COLORS_02, DASH_WIDGET_COLORS_03, DASH_WIDGET_COLORS_04, DASH_WIDGET_COLORS_05,
    DASH_WIDGET_COLORS_06, DASH_WIDGET_COLORS_07, DASH_WIDGET_COLORS_08, DASH_WIDGET_COLORS_09, DASH_WIDGET_COLORS_10,
  };
  /* select 옵션 — 팔레트 코드 + 사람이 알아볼 라벨 */
  const DASH_WIDGET_COLOR_OPTIONS = [
    { value: 'DASH_WIDGET_COLORS_01', label: '01. 기본' },
    { value: 'DASH_WIDGET_COLORS_02', label: '02. 비비드' },
    { value: 'DASH_WIDGET_COLORS_03', label: '03. 파스텔' },
    { value: 'DASH_WIDGET_COLORS_04', label: '04. 블루 모노톤' },
    { value: 'DASH_WIDGET_COLORS_05', label: '05. 오렌지 모노톤' },
    { value: 'DASH_WIDGET_COLORS_06', label: '06. 그린 모노톤' },
    { value: 'DASH_WIDGET_COLORS_07', label: '07. 퍼플 모노톤' },
    { value: 'DASH_WIDGET_COLORS_08', label: '08. 그레이스케일' },
    { value: 'DASH_WIDGET_COLORS_09', label: '09. 레드·틸 대비' },
    { value: 'DASH_WIDGET_COLORS_10', label: '10. 골드·옐로우' },
  ];

  const _fmtYmd = (s) => {
    if (!s || s.length !== 8) return s || '';
    return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
  };
  const _fmtNum = (v) => {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 100000000) return (n / 100000000).toFixed(1) + '억';
    if (Math.abs(n) >= 10000)     return (n / 10000).toFixed(1) + '만';
    return n.toLocaleString();
  };

  /* rows 를 기간(yyyymmdd BETWEEN)으로 클라이언트 필터 — startYmd/endYmd 'YYYYMMDD' 또는 빈값 */
  const filterRows = (rows, startYmd, endYmd) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter(r => {
      const d = r.yyyymmdd || '';
      if (startYmd && d < startYmd) return false;
      if (endYmd && d > endYmd) return false;
      return true;
    });
  };

  /* optionJson(부분 오버라이드) 파싱 — 실패 시 무시. 시리즈는 item.series 배열에서 온다 */
  const _parseJson = (s) => {
    if (!s) return null;
    try { return JSON.parse(s); } catch (_) { return null; }
  };

  /* 데이터 행에서 실제 값이 존재하는 시리즈 번호(1~9) 목록 */
  const _detectSeries = (rows) => {
    const found = [];
    for (let k = 1; k <= 9; k++) {
      const numKey = 'col' + k + 'Num';
      if (rows.some(r => r[numKey] !== null && r[numKey] !== undefined)) found.push(k);
    }
    return found.length ? found : [1];
  };

  /* buildWidget(item, rows) → 렌더 정보
   *   { kind:'realtime' }                          실시간 항목(시뮬 미지원 안내)
   *   { kind:'empty' }                             데이터 없음
   *   { kind:'kpi', value, label, delta }          KPI 숫자 카드
   *   { kind:'chart', option }                     ECharts 옵션
   *   { kind:'table', columns, rows }              목록(표) — 운영 대시보드는 차트보다 목록이 많다
   */
  const buildWidget = (item, rows) => {
    if (item.realtimeYn === 'Y') return { kind: 'realtime' };
    if (!rows || !rows.length) return { kind: 'empty' };

    const itemType  = itemTypeOf(item);
    const type      = item.chartTypeCd || 'bar';
    /* 시리즈 정의는 하위 "행" 에서 온다 (series_json 은 2026-08-21 폐기).
       목록 API 가 item.series = [{cd,name,color}] 로 붙여 준다.
       구형 응답(seriesJson 문자열)도 아직 올 수 있어 폴백을 둔다. */
    const seriesArr = Array.isArray(item.series) ? item.series : (_parseJson(item.seriesJson) || []);
    const optOver   = _parseJson(item.optionJson) || {};
    delete optOver._srcItemId; /* 개인화 대시보드 원본 참조키 — ECharts 옵션 아님 */

    const labels = rows.map(r => r.col1Nm || _fmtYmd(r.yyyymmdd));

    if (itemType === 'TABLE') return _buildTable(item, rows, seriesArr);

    if (itemType === 'KPI') {
      const last = rows[rows.length - 1];
      const prev = rows.length > 1 ? rows[rows.length - 2] : null;
      const value = last.col1Num || 0;
      const delta = prev ? value - (prev.col1Num || 0) : null;
      return { kind: 'kpi', value: _fmtNum(value), label: last.col1Nm || item.itemNm, delta };
    }

    if (type === 'pie') {
      /* 행 각각이 {col1Nm:이름, col1Num:값} — 이름별 합산(중복 이름 대비) */
      const agg = {};
      rows.forEach(r => { const nm = r.col1Nm || '기타'; agg[nm] = (agg[nm] || 0) + (r.col1Num || 0); });
      const data = Object.entries(agg).map(([name, value], i) => ({
        name, value, itemStyle: { color: (seriesArr[i] || {}).color || PALETTE[i % PALETTE.length] },
      }));
      const option = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { show: data.length <= 8, bottom: 0, textStyle: { fontSize: 10 } },
        series: [{ type: 'pie', radius: ['35%', '62%'], center: ['50%', '44%'], data,
          label: { fontSize: 10, formatter: '{b}' } }],
      };
      return { kind: 'chart', option: Object.assign(option, optOver) };
    }

    /* bar / stackedBar / line / heatmap(→bar 대체) / scatter — 시리즈 자동 감지 */
    const seriesNos = _detectSeries(rows);
    const isStacked = type === 'stackedBar';
    const echType   = type === 'line' ? 'line' : type === 'scatter' ? 'scatter' : 'bar';
    const series = seriesNos.map((k, i) => {
      const cfg = seriesArr[i] || {};
      const s = {
        name: cfg.name || ('시리즈' + k),
        type: cfg.type || echType,
        data: rows.map(r => r['col' + k + 'Num'] || 0),
        itemStyle: { color: cfg.color || PALETTE[i % PALETTE.length] },
      };
      if (isStacked) s.stack = 'total';   /* 같은 stack 이름끼리 카테고리당 막대 하나로 쌓인다 */
      if (s.type === 'line') { s.smooth = true; s.symbolSize = 4; }
      if (s.type === 'bar')  { s.barMaxWidth = 18; }
      return s;
    });
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { show: series.length > 1, top: 0, textStyle: { fontSize: 10 } },
      grid: { top: series.length > 1 ? 28 : 12, right: 12, bottom: 22, left: 44 },
      xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 9, color: '#888' } },
      yAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#888', formatter: (v) => _fmtNum(v) },
        splitLine: { lineStyle: { color: '#f0f0f0' } } },
      series,
    };
    return { kind: 'chart', option: Object.assign(option, optOver) };
  };

  /* 목록(표) 위젯 — col1Nm~col6Nm(텍스트) / col1Num~col9Num(숫자) 를 그대로 컬럼으로 쓴다.
     컬럼 정의는 시리즈 배열을 재활용한다(차트의 시리즈와 자리만 같고 의미가 다르다):
       [{ "name":"주문번호", "key":"col1Nm" }, { "name":"금액", "key":"col1Num", "align":"right" }]
     정의가 없으면 값이 들어있는 col* 을 자동 감지해 컬럼을 만든다. */
  const _buildTable = (item, rows, seriesArr) => {
    let columns = (seriesArr || [])
      .filter(c => c && c.key)
      .map(c => ({ label: c.name || c.key, key: c.key,
                   align: c.align || (/Num$/.test(c.key) ? 'right' : 'left') }));

    if (!columns.length) {
      columns = [];
      for (let k = 1; k <= 6; k++) {
        const key = 'col' + k + 'Nm';
        if (rows.some(r => r[key] !== null && r[key] !== undefined && r[key] !== '')) {
          columns.push({ label: '항목' + k, key, align: 'left' });
        }
      }
      for (let k = 1; k <= 9; k++) {
        const key = 'col' + k + 'Num';
        if (rows.some(r => r[key] !== null && r[key] !== undefined)) {
          columns.push({ label: '값' + k, key, align: 'right' });
        }
      }
      if (!columns.length) columns = [{ label: '일자', key: 'yyyymmdd', align: 'left' }];
    }

    /* 숫자는 천단위 구분, 일자(yyyymmdd)는 YYYY-MM-DD 로 — 목록은 원값 가독성이 우선이라
       차트처럼 억/만 단위로 줄이지 않는다. */
    const cells = rows.map(r => columns.map(c => {
      const v = r[c.key];
      if (v === null || v === undefined || v === '') return '-';
      if (c.key === 'yyyymmdd') return _fmtYmd(String(v));
      return /Num$/.test(c.key) ? Number(v).toLocaleString() : String(v);
    }));

    return { kind: 'table', columns, rows: cells };
  };

  global.cmDashWidgetUtil = {
    ITEM_TYPES, itemTypeIcon, itemTypeLabel, itemTypeOf,
    CHART_TYPES, chartTypeIcon, chartTypeLabel,
    filterRows, buildWidget,
    PALETTE, PALETTE_BG, kpiColorOf,
    DASH_WIDGET_COLOR_SETS, DASH_WIDGET_COLOR_OPTIONS,
  };
})(window);
