/* ShopJoy Admin - 대시보드 항목 공용 렌더 유틸 (window.cmDashWidgetUtil)
 * CmDashboardLayoutMng(항목배치 시뮬레이션) / CmDashboardMyMng(개인화 대시보드) 공용.
 * cm_dashboard_item(chartType/seriesJson/optionJson) + cm_dashboard_item_data(rows)
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
    { value: 'bar',     label: '막대',   icon: '📊' },
    { value: 'line',    label: '꺾은선', icon: '📈' },
    { value: 'pie',     label: '파이',   icon: '🥧' },
    { value: 'radar',   label: '레이더', icon: '🕸' },
    { value: 'heatmap', label: '히트맵', icon: '🔥' },
    { value: 'scatter', label: '산점도', icon: '⚡' },
  ];
  const chartTypeIcon  = (t) => (CHART_TYPES.find(c => c.value === t) || {}).icon  || '📊';
  const chartTypeLabel = (t) => (CHART_TYPES.find(c => c.value === t) || {}).label || (t || '-');

  /** 항목유형 정규화 — item_type_cd 가 없는 구 데이터는 chart_type 으로 추정한다 */
  const itemTypeOf = (item) => {
    if (item && item.itemTypeCd) return item.itemTypeCd;
    const ct = (item && item.chartType || '').toLowerCase();
    if (ct === 'kpi')   return 'KPI';
    if (ct === 'table') return 'TABLE';
    return 'CHART';
  };

  const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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

  /* seriesJson([{name,color,type}]) / optionJson(부분 오버라이드) 파싱 — 실패 시 무시 */
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
    const type      = item.chartType || 'bar';
    const seriesArr = _parseJson(item.seriesJson) || [];
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

    /* bar / line / heatmap(→bar 대체) / scatter — 시리즈 자동 감지 */
    const seriesNos = _detectSeries(rows);
    const echType   = type === 'line' ? 'line' : type === 'scatter' ? 'scatter' : 'bar';
    const series = seriesNos.map((k, i) => {
      const cfg = seriesArr[i] || {};
      const s = {
        name: cfg.name || ('시리즈' + k),
        type: cfg.type || echType,
        data: rows.map(r => r['col' + k + 'Num'] || 0),
        itemStyle: { color: cfg.color || PALETTE[i % PALETTE.length] },
      };
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
     컬럼 정의는 seriesJson 을 재활용한다(차트의 시리즈 정의와 자리만 같고 의미가 다르다):
       [{ "name":"주문번호", "key":"col1Nm" }, { "name":"금액", "key":"col1Num", "align":"right" }]
     seriesJson 이 없으면 값이 들어있는 col* 을 자동 감지해 컬럼을 만든다. */
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
  };
})(window);
