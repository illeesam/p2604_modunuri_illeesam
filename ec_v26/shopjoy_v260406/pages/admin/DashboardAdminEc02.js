/* ShopJoy Admin - EC 종합 대시보드 (월별 14개월 현황) */
(function () {
  const { ref, reactive, computed } = Vue;

  const fmt = n => Number(n || 0).toLocaleString('ko-KR');

  /* ── 날짜 유틸 ── */
  const pad = n => String(n).padStart(2, '0');
  const toYmd  = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const toYm   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth()+n); return x; };
  const endOfMonth = d => new Date(d.getFullYear(), d.getMonth()+1, 0);

  /* ── SVG 헬퍼 ── */
  const maxOf = arr => Math.max(1, ...arr);
  const linePoints = (vals, w, h, pad = 10) => {
    const max = maxOf(vals);
    const step = (w - pad * 2) / Math.max(vals.length - 1, 1);
    return vals.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(' ');
  };
  const areaPath = (vals, w, h, pad = 10) => {
    const pts = linePoints(vals, w, h, pad);
    if (!pts) return '';
    const first = pts.split(' ')[0].split(',');
    const last  = pts.split(' ').slice(-1)[0].split(',');
    return `M${first[0]},${h - pad} L${pts.replace(/ /g, ' L')} L${last[0]},${h - pad} Z`;
  };

  window.DashboardAdminEc02 = {
    name: 'DashboardAdminEc02',
    props: ['navigate', 'adminData', 'showToast'],

    setup() {
      /* ── 필터 상태 ── */
      const today   = new Date();
      const endDef  = toYmd(endOfMonth(today));
      const startDef= toYmd(new Date(addMonths(today, -13).getFullYear(), addMonths(today, -13).getMonth(), 1));

      const CHANNELS = ['자사몰','네이버 스마트스토어','쿠팡','11번가','G마켓','Auction','GS샵','TMON','위메프','롯데온','홈앤쇼핑','현대H몰'];
      const AGES     = ['10대','20대','30대','40대','50대','60대+'];
      const GENDERS  = ['남','여'];
      const MEMBER_TYPES = ['일반','VIP','VVIP','휴면','탈퇴'];
      const CATEGORIES = ['패션의류','패션잡화','뷰티','가전','식품','가구','리빙','스포츠','도서','기타'];

      const filters = reactive({
        startDt: startDef,
        endDt:   endDef,
        channels:  [...CHANNELS],
        ages:      [...AGES],
        genders:   [...GENDERS],
        memberTypes: [...MEMBER_TYPES],
        categories:  [...CATEGORIES],
      });

      const toggle = (list, v) => {
        const i = list.indexOf(v);
        if (i >= 0) list.splice(i, 1); else list.push(v);
      };
      const toggleAll = (key, all) => {
        if (filters[key].length === all.length) filters[key] = [];
        else filters[key] = [...all];
      };
      const isSel = (list, v) => list.includes(v);

      const doSearch = () => {
        console.log('[대시보드 검색]', JSON.parse(JSON.stringify(filters)));
      };
      const doExcelDownload = () => {
        const rows = [['월','매출','가입','탈퇴','클릭','주문완료']];
        monthLabels.value.forEach((m, i) => {
          rows.push([m, monthlySales.value[i], monthlyJoin.value[i], monthlyLeave.value[i], monthlyClicks.value[i], monthlyOrders.value[i]]);
        });
        const csv = rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
        const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard_'+filters.startDt+'_'+filters.endDt+'.csv';
        a.click();
        URL.revokeObjectURL(url);
      };
      const resetFilters = () => {
        filters.startDt = startDef;
        filters.endDt   = endDef;
        filters.channels    = [...CHANNELS];
        filters.ages        = [...AGES];
        filters.genders     = [...GENDERS];
        filters.memberTypes = [...MEMBER_TYPES];
        filters.categories  = [...CATEGORIES];
      };

      /* ── UI 상태 ── */
      const filterExpand = ref(false);
      const activeTab    = ref('sales');
      const viewMode     = ref('4col'); // tab | 1col | 2col | 3col | 4col
      const TABS = [
        { key: 'sales',    label: '월별 매출',        icon: '💰' },
        { key: 'member',   label: '가입/탈퇴',        icon: '👥' },
        { key: 'click',    label: '상품상세 클릭',    icon: '🖱' },
        { key: 'order',    label: '주문완료',         icon: '📋' },
        { key: 'channel',  label: '판매채널별 매출',  icon: '📺' },
        { key: 'kpi',        label: '핵심지표',       icon: '🎯' },
        { key: 'topProducts',label: '상품 TOP 7',     icon: '📦' },
        { key: 'channelMix', label: '채널 비중',      icon: '📱' },
        { key: 'deviceMix',  label: '디바이스 비중',  icon: '💻' },
        { key: 'timeMix',    label: '시간대 비중',    icon: '⏰' },
        { key: 'region',     label: '지역별',         icon: '🗺' },
        { key: 'hourly',     label: '시간대 추이',    icon: '⏱' },
        { key: 'radar',      label: '영업지표',       icon: '⚡' },
        { key: 'economy',    label: '경제 수준별',    icon: '💼' },
        { key: 'shipping',   label: '배송 조건',      icon: '🚚' },
      ];
      const VIEW_MODES = [
        { key: 'tab',  icon: '📑', label: '탭' },
        { key: '1col', icon: '▭',  label: '1열' },
        { key: '2col', icon: '▭▭', label: '2열' },
        { key: '3col', icon: '▭▭▭', label: '3열' },
        { key: '4col', icon: '▭▭▭▭', label: '4열' },
      ];
      const gridCols = computed(() => {
        if (viewMode.value === 'tab') return '1fr';
        return 'repeat(' + parseInt(viewMode.value) + ',minmax(0,1fr))';
      });
      const showPanel = (key) => viewMode.value === 'tab' ? activeTab.value === key : true;

      /* ── 보조 대시보드 (원본 KPI 섹션) ── */
      const totalSales    = computed(() => monthlySales.value.reduce((a,b)=>a+b,0));
      const totalQtyComp  = computed(() => monthlyOrders.value.reduce((a,b)=>a+b,0));
      const marginRate    = 7.7;
      const avgOrderValue = computed(() => Math.round(totalSales.value / Math.max(totalQtyComp.value, 1)));

      const topProducts = [
        { name: '오버사이즈 코트', value: 1495000 },
        { name: '슬림핏 데님 진',  value: 2995000 },
        { name: '케이블 니트 스웨터', value: 2450000 },
        { name: '클로럴 미디 드레스', value: 3950000 },
        { name: '카고 와이드 팬츠', value: 2750000 },
        { name: '울 블렌드 롱코트', value: 5950000 },
        { name: '스트라이프 티셔츠', value: 2250000 },
      ];
      const salesByChannel = [
        { label: '온라인',   value: 62, color: '#e8587a' },
        { label: '모바일앱', value: 28, color: '#7b1fa2' },
        { label: '오프라인', value: 10, color: '#d1d5db' },
      ];
      const salesByDevice = [
        { label: 'Mobile',  value: 58, color: '#3b82f6' },
        { label: 'Desktop', value: 32, color: '#10b981' },
        { label: 'Tablet',  value: 10, color: '#f59e0b' },
      ];
      const salesByTime = [
        { label: '아침',  value: 15, color: '#fbbf24' },
        { label: '점심',  value: 22, color: '#f97316' },
        { label: '저녁',  value: 38, color: '#e8587a' },
        { label: '야간',  value: 25, color: '#6366f1' },
      ];
      const regionSales = [
        { name: '서울', value: 58000000 }, { name: '경기', value: 42000000 },
        { name: '부산', value: 21000000 }, { name: '인천', value: 16000000 },
        { name: '대구', value: 12000000 }, { name: '광주', value: 9000000 },
        { name: '기타', value: 6000000 },
      ];
      const hourlyTrend = [12,8,5,4,3,5,10,18,28,35,42,48,52,48,45,50,55,62,68,72,68,55,40,28];
      const radarValues = [
        { label: '매출', value: 85 }, { label: '주문', value: 72 },
        { label: '신규회원', value: 65 }, { label: '재구매', value: 78 },
        { label: '만족도', value: 88 },
      ];
      const radarPath = computed(() => {
        const cx = 100, cy = 100, R = 70;
        return radarValues.map((v, i) => {
          const a = (i / radarValues.length) * Math.PI * 2 - Math.PI / 2;
          const r = (v.value / 100) * R;
          return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        }).join(' ');
      });
      const radarAxes = computed(() => {
        const cx = 100, cy = 100, R = 70;
        return radarValues.map((v, i) => {
          const a = (i / radarValues.length) * Math.PI * 2 - Math.PI / 2;
          return {
            x2: (cx + R * Math.cos(a)).toFixed(1),
            y2: (cy + R * Math.sin(a)).toFixed(1),
            lx: (cx + (R + 12) * Math.cos(a)).toFixed(1),
            ly: (cy + (R + 12) * Math.sin(a)).toFixed(1),
            label: v.label,
          };
        });
      });
      const economySales = {
        labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
        high:   [35,42,38,48,52,58,62,65,68,72,78,82],
        middle: [48,52,55,58,62,65,68,70,72,75,78,80],
        low:    [25,28,30,32,35,38,40,42,45,48,50,52],
      };
      const shippingTypes = [
        { label: '무료', value: 58, color: '#10b981' },
        { label: '유료', value: 42, color: '#9ca3af' },
      ];
      const pct = n => (Math.round(n * 10) / 10).toFixed(1) + '%';

      /* ── 월별 레이블 (14개월) ── */
      const monthLabels = computed(() => {
        const s = new Date(filters.startDt);
        const e = new Date(filters.endDt);
        const months = [];
        let cur = new Date(s.getFullYear(), s.getMonth(), 1);
        while (cur <= e) {
          months.push(toYm(cur));
          cur = addMonths(cur, 1);
        }
        return months.slice(-14);
      });

      /* ── 필터 강도 계수 (0~1) — 필터를 줄일수록 값 감소 ── */
      const filterFactor = computed(() => {
        const ratio = (list, all) => list.length === 0 ? 0 : list.length / all.length;
        return (
          ratio(filters.channels,    CHANNELS) *
          ratio(filters.ages,        AGES) *
          ratio(filters.genders,     GENDERS) *
          ratio(filters.memberTypes, MEMBER_TYPES) *
          ratio(filters.categories,  CATEGORIES)
        );
      });

      /* ── 월별 시드 데이터 (목업) ── */
      const seededBase = (seed, len, min, max) => {
        const arr = [];
        let s = seed;
        for (let i = 0; i < len; i++) {
          s = (s * 9301 + 49297) % 233280;
          arr.push(Math.round(min + (s / 233280) * (max - min) + i * ((max - min) / len) * 0.3));
        }
        return arr;
      };

      /* 1) 월별 매출현황 */
      const monthlySales = computed(() =>
        seededBase(137, monthLabels.value.length, 80000000, 180000000).map(v => Math.round(v * filterFactor.value))
      );
      /* 2) 월별 고객 가입/탈퇴 */
      const monthlyJoin   = computed(() => seededBase(211, monthLabels.value.length, 180, 520).map(v => Math.round(v * filterFactor.value)));
      const monthlyLeave  = computed(() => seededBase(431, monthLabels.value.length, 30, 180).map(v => Math.round(v * filterFactor.value)));
      /* 3) 월별 상품상세 클릭 */
      const monthlyClicks = computed(() => seededBase(719, monthLabels.value.length, 12000, 46000).map(v => Math.round(v * filterFactor.value)));
      /* 4) 월별 주문완료 */
      const monthlyOrders = computed(() => seededBase(983, monthLabels.value.length, 850, 2800).map(v => Math.round(v * filterFactor.value)));

      /* 5) 월별 판매채널별 매출 (선택된 채널만) */
      const CHANNEL_COLORS = {
        '자사몰':'#e8587a', '네이버 스마트스토어':'#10b981', '쿠팡':'#ef4444', '11번가':'#f97316',
        'G마켓':'#3b82f6', 'Auction':'#6366f1', 'GS샵':'#a855f7', 'TMON':'#e11d48',
        '위메프':'#f59e0b', '롯데온':'#9333ea', '홈앤쇼핑':'#0891b2', '현대H몰':'#c2410c',
      };
      const channelMonthly = computed(() => {
        const months = monthLabels.value.length;
        const subFactor =
          (filters.ages.length / AGES.length) *
          (filters.genders.length / GENDERS.length) *
          (filters.memberTypes.length / MEMBER_TYPES.length) *
          (filters.categories.length / CATEGORIES.length);
        return filters.channels.map((ch, i) => ({
          name: ch,
          color: CHANNEL_COLORS[ch] || '#999',
          values: seededBase(97 + i * 31, months, 5000000, 28000000).map(v => Math.round(v * subFactor)),
        }));
      });

      return {
        fmt, pct, filters, CHANNELS, AGES, GENDERS, MEMBER_TYPES, CATEGORIES,
        toggle, toggleAll, isSel, resetFilters, doSearch, doExcelDownload,
        filterExpand, activeTab, TABS, viewMode, VIEW_MODES, gridCols, showPanel,
        monthLabels, monthlySales, monthlyJoin, monthlyLeave, monthlyClicks, monthlyOrders, channelMonthly,
        linePoints, areaPath, maxOf,
        totalSales, totalQtyComp, marginRate, avgOrderValue,
        topProducts, salesByChannel, salesByDevice, salesByTime,
        regionSales, hourlyTrend, radarValues, radarPath, radarAxes,
        economySales, shippingTypes,
      };
    },

    template: /* html */`
<div :class="(viewMode==='3col'||viewMode==='4col') ? 'dash-wide' : 'admin-wrap'">
  <!-- 헤더 -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e 0%,#2d2d44 100%);border-radius:10px;color:#fff;">
    <div style="width:6px;height:24px;background:#e8587a;border-radius:3px;"></div>
    <span style="font-size:17px;font-weight:800;letter-spacing:-0.5px;">온라인 쇼핑몰 매출 및 판매현황</span>
    <span style="flex:1;"></span>
    <span style="font-size:11px;color:#aaa;">14개월 기준 · {{ monthLabels[0] }} ~ {{ monthLabels[monthLabels.length-1] }}</span>
  </div>

  <!-- 필터 바: 조회기간 + 상세필터 토글 -->
  <div class="card" style="padding:12px 14px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:#666;width:74px;">조회기간</span>
      <input type="date" v-model="filters.startDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <span style="color:#999;">~</span>
      <input type="date" v-model="filters.endDt" class="form-control" style="width:150px;height:30px;font-size:12px;">
      <button @click="filterExpand=!filterExpand"
        style="font-size:11px;padding:4px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fafbfc;color:#555;cursor:pointer;">
        {{ filterExpand ? '▲ 상세필터 접기' : '▼ 상세필터 펼치기' }}
      </button>
      <span style="flex:1;"></span>
      <button class="btn btn-sm btn-primary" @click="doSearch" style="font-size:11px;">🔍 검색</button>
      <button class="btn btn-sm" @click="doExcelDownload" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7;">📥 엑셀다운로드</button>
      <button class="btn btn-sm" @click="resetFilters" style="font-size:11px;">🔄 초기화</button>
    </div>
    <div v-if="filterExpand" style="display:flex;flex-direction:column;gap:8px;border-top:1px dashed #eee;padding-top:10px;">
      <div v-for="grp in [
        {key:'channels',    label:'판매채널',  all:CHANNELS},
        {key:'ages',        label:'나이대',    all:AGES},
        {key:'genders',     label:'성별',      all:GENDERS},
        {key:'memberTypes', label:'회원유형',  all:MEMBER_TYPES},
        {key:'categories',  label:'카테고리',  all:CATEGORIES},
      ]" :key="grp.key" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:#666;width:74px;">{{ grp.label }}</span>
        <button @click="toggleAll(grp.key, grp.all)"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',
                   background: filters[grp.key].length===grp.all.length ? '#1a1a2e' : '#fff',
                   color:       filters[grp.key].length===grp.all.length ? '#fff'    : '#555',
                   borderColor: filters[grp.key].length===grp.all.length ? '#1a1a2e' : '#ddd'}">전체</button>
        <button v-for="v in grp.all" :key="v" @click="toggle(filters[grp.key], v)"
          :style="{fontSize:'11px',padding:'3px 10px',borderRadius:'12px',border:'1px solid',cursor:'pointer',
                   background: isSel(filters[grp.key], v) ? '#fff0f4' : '#fafbfc',
                   color:       isSel(filters[grp.key], v) ? '#e8587a' : '#888',
                   borderColor: isSel(filters[grp.key], v) ? '#e8587a' : '#e5e7eb',
                   fontWeight:  isSel(filters[grp.key], v) ? 700 : 400}">{{ v }}</button>
      </div>
    </div>
  </div>

  <!-- 탭 바 + 뷰모드 -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
    <div class="tab-nav" style="margin-bottom:0;flex:1;flex-wrap:wrap;">
      <button v-for="t in TABS" :key="t.key" class="tab-btn"
        :class="{active: activeTab===t.key && viewMode==='tab'}"
        :disabled="viewMode!=='tab'"
        @click="viewMode==='tab' && (activeTab=t.key)"
        :style="viewMode!=='tab' ? 'opacity:0.4;cursor:not-allowed;' : ''">
        <span style="margin-right:4px;">{{ t.icon }}</span>{{ t.label }}
      </button>
    </div>
    <div style="display:flex;gap:4px;background:#fff;padding:4px;border:1px solid #eef0f3;border-radius:8px;flex-shrink:0;">
      <button v-for="vm in VIEW_MODES" :key="vm.key" @click="viewMode=vm.key"
        :title="vm.label+'로 보기'"
        :style="{fontSize:'11px',padding:'4px 8px',borderRadius:'5px',border:'none',cursor:'pointer',minWidth:'34px',
                 background: viewMode===vm.key ? '#fff0f4' : 'transparent',
                 color:       viewMode===vm.key ? '#e8587a' : '#888',
                 fontWeight:  viewMode===vm.key ? 700 : 400}">{{ vm.icon }}</button>
    </div>
  </div>

  <!-- 탭 컨텐츠: 뷰모드에 따라 grid -->
  <div :style="{display:'grid',gridTemplateColumns:gridCols,gap:'12px'}">
  <!-- 1) 월별 매출현황 -->
  <div v-show="showPanel('sales')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      💰 <span>월별 매출현황 (14개월)</span>
      <span style="flex:1;"></span>
      <span style="font-size:11px;color:#888;font-weight:500;">총 {{ fmt(monthlySales.reduce((a,b)=>a+b,0)) }}원</span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradSales" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#e8587a"/><stop offset="100%" stop-color="#ff8aa5"/>
        </linearGradient>
      </defs>
      <g v-for="(v,i) in monthlySales" :key="i">
        <rect :x="20 + i*(760/monthLabels.length)" :y="230 - (v/maxOf(monthlySales))*210"
              :width="760/monthLabels.length - 6" :height="(v/maxOf(monthlySales))*210"
              fill="url(#gradSales)" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in monthLabels" :key="m" style="flex:1;text-align:center;">{{ m.slice(2) }}</span>
    </div>
  </div>

  <!-- 2) 월별 고객 가입/탈퇴 현황 -->
  <div v-show="showPanel('member')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      👥 <span>월별 고객 가입/탈퇴자 현황 (14개월)</span>
      <span style="flex:1;"></span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#666;"><span style="width:10px;height:10px;background:#3b82f6;border-radius:2px;"></span>가입 {{ fmt(monthlyJoin.reduce((a,b)=>a+b,0)) }}</span>
      <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#666;margin-left:10px;"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px;"></span>탈퇴 {{ fmt(monthlyLeave.reduce((a,b)=>a+b,0)) }}</span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <g v-for="(v,i) in monthlyJoin" :key="i">
        <rect :x="22 + i*(760/monthLabels.length)" :y="230 - (v/maxOf([...monthlyJoin,...monthlyLeave]))*210"
              :width="(760/monthLabels.length - 8)/2" :height="(v/maxOf([...monthlyJoin,...monthlyLeave]))*210"
              fill="#3b82f6" rx="2" />
        <rect :x="22 + i*(760/monthLabels.length) + (760/monthLabels.length - 8)/2 + 2" :y="230 - (monthlyLeave[i]/maxOf([...monthlyJoin,...monthlyLeave]))*210"
              :width="(760/monthLabels.length - 8)/2" :height="(monthlyLeave[i]/maxOf([...monthlyJoin,...monthlyLeave]))*210"
              fill="#ef4444" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in monthLabels" :key="m" style="flex:1;text-align:center;">{{ m.slice(2) }}</span>
    </div>
  </div>

  <!-- 3) 월별 상품상세 클릭 현황 -->
  <div v-show="showPanel('click')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      🖱 <span>월별 상품상세 클릭 현황 (14개월)</span>
      <span style="flex:1;"></span>
      <span style="font-size:11px;color:#888;font-weight:500;">총 {{ fmt(monthlyClicks.reduce((a,b)=>a+b,0)) }}회</span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradClicks" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path :d="areaPath(monthlyClicks, 800, 240, 20)" fill="url(#gradClicks)" />
      <polyline :points="linePoints(monthlyClicks, 800, 240, 20)" fill="none" stroke="#10b981" stroke-width="2.5" />
      <template v-for="(v,i) in monthlyClicks" :key="i">
        <circle :cx="20 + (i/(monthlyClicks.length-1))*760" :cy="240-20-(v/maxOf(monthlyClicks))*(240-40)" r="3.5" fill="#10b981" stroke="#fff" stroke-width="1.5"/>
      </template>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in monthLabels" :key="m" style="flex:1;text-align:center;">{{ m.slice(2) }}</span>
    </div>
  </div>

  <!-- 4) 월별 주문완료 현황 -->
  <div v-show="showPanel('order')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      📋 <span>월별 주문완료 현황 (14개월)</span>
      <span style="flex:1;"></span>
      <span style="font-size:11px;color:#888;font-weight:500;">총 {{ fmt(monthlyOrders.reduce((a,b)=>a+b,0)) }}건</span>
    </div>
    <svg viewBox="0 0 800 240" style="width:100%;height:240px;">
      <defs>
        <linearGradient id="gradOrder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#7b1fa2"/><stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <g v-for="(v,i) in monthlyOrders" :key="i">
        <rect :x="20 + i*(760/monthLabels.length)" :y="230 - (v/maxOf(monthlyOrders))*210"
              :width="760/monthLabels.length - 6" :height="(v/maxOf(monthlyOrders))*210"
              fill="url(#gradOrder)" rx="2" />
      </g>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin-top:4px;">
      <span v-for="m in monthLabels" :key="m" style="flex:1;text-align:center;">{{ m.slice(2) }}</span>
    </div>
  </div>

  <!-- 5) 월별 판매채널별 매출 -->
  <div v-show="showPanel('channel')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
      📺 <span>월별 판매채널별 매출현황 (14개월)</span>
      <span style="flex:1;"></span>
      <span style="font-size:11px;color:#888;font-weight:500;">{{ channelMonthly.length }}개 채널</span>
    </div>
    <svg viewBox="0 0 800 260" style="width:100%;height:260px;">
      <template v-for="(ch, ci) in channelMonthly" :key="ch.name">
        <polyline :points="linePoints(ch.values, 800, 260, 20)" fill="none" :stroke="ch.color" stroke-width="2" opacity="0.85" />
      </template>
    </svg>
    <div style="display:flex;font-size:10px;color:#888;margin:4px 0 10px;">
      <span v-for="m in monthLabels" :key="m" style="flex:1;text-align:center;">{{ m.slice(2) }}</span>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;">
      <span v-for="ch in channelMonthly" :key="ch.name" style="display:inline-flex;align-items:center;gap:5px;">
        <span :style="{width:'12px',height:'3px',background:ch.color,borderRadius:'2px'}"></span>
        <span style="color:#555;">{{ ch.name }}</span>
      </span>
    </div>
  </div>

  <!-- 6) 핵심지표 KPI -->
  <div v-show="showPanel('kpi')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">🎯 핵심지표</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <div v-for="kpi in [
        {label:'전체 매출현황', value:fmt(totalSales), unit:'원', color:'#e8587a', icon:'💰', bg:'#fff0f4'},
        {label:'전체 구매수량', value:fmt(totalQtyComp), unit:'건', color:'#3b82f6', icon:'🛒', bg:'#eff6ff'},
        {label:'평균 마진율',   value:pct(marginRate), unit:'',   color:'#10b981', icon:'📈', bg:'#f0fdf4'},
        {label:'평균 결제금액', value:fmt(avgOrderValue), unit:'원', color:'#f59e0b', icon:'💳', bg:'#fffbeb'},
      ]" :key="kpi.label"
        :style="{background:kpi.bg,border:'1px solid #eef0f3',borderRadius:'8px',padding:'12px',display:'flex',alignItems:'center',gap:'10px'}">
        <div :style="{fontSize:'22px',width:'36px',height:'36px',borderRadius:'8px',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}">{{ kpi.icon }}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:10.5px;color:#666;font-weight:600;">{{ kpi.label }}</div>
          <div :style="{fontSize:'15px',fontWeight:800,color:kpi.color,marginTop:'2px'}">{{ kpi.value }}<span style="font-size:10px;margin-left:2px;color:#999;">{{ kpi.unit }}</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 7) 상품 TOP 7 -->
  <div v-show="showPanel('topProducts')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">📦 상품별 매출 TOP 7</div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div v-for="(p,i) in topProducts" :key="p.name" style="display:flex;align-items:center;gap:8px;font-size:11.5px;">
        <span style="width:140px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ i+1 }}. {{ p.name }}</span>
        <div style="flex:1;height:12px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
          <div :style="{width:((p.value/topProducts.reduce((m,x)=>Math.max(m,x.value),0))*100)+'%',height:'100%',background:'linear-gradient(90deg,#7b1fa2,#e8587a)'}"></div>
        </div>
        <span style="color:#666;font-weight:600;min-width:80px;text-align:right;">{{ fmt(p.value) }}원</span>
      </div>
    </div>
  </div>

  <!-- 8~10) 도넛 3개 (채널/디바이스/시간대) -->
  <div v-for="d in [
    {key:'channelMix', title:'📱 판매 채널별',  data:salesByChannel},
    {key:'deviceMix',  title:'💻 디바이스별',   data:salesByDevice},
    {key:'timeMix',    title:'⏰ 시간대별',     data:salesByTime},
  ]" :key="d.key" v-show="showPanel(d.key)" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">{{ d.title }}</div>
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
      <div style="flex:1;display:flex;flex-direction:column;gap:3px;font-size:11px;">
        <div v-for="s in d.data" :key="s.label" style="display:flex;align-items:center;gap:6px;">
          <span :style="{width:'10px',height:'10px',borderRadius:'2px',background:s.color}"></span>
          <span style="flex:1;color:#555;">{{ s.label }}</span>
          <span style="font-weight:700;color:#333;">{{ s.value }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 11) 지역별 -->
  <div v-show="showPanel('region')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">🗺 지역별 매출현황</div>
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div v-for="r in regionSales" :key="r.name" style="display:flex;align-items:center;gap:6px;font-size:11px;">
        <span style="width:34px;color:#555;">{{ r.name }}</span>
        <div style="flex:1;height:14px;background:#f3f4f6;border-radius:3px;overflow:hidden;">
          <div :style="{width:((r.value/regionSales[0].value)*100)+'%',height:'100%',background:'#3b82f6'}"></div>
        </div>
        <span style="color:#666;min-width:70px;text-align:right;">{{ fmt(r.value) }}</span>
      </div>
    </div>
  </div>

  <!-- 12) 시간대 추이 -->
  <div v-show="showPanel('hourly')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">⏱ 시간대별 주문 추이 (24H)</div>
    <svg viewBox="0 0 420 140" style="width:100%;height:140px;">
      <polyline :points="linePoints(hourlyTrend, 420, 140, 10)" fill="none" stroke="#10b981" stroke-width="2" />
      <template v-for="(v,i) in hourlyTrend" :key="i">
        <circle :cx="10+(i/(hourlyTrend.length-1))*400" :cy="140-10-(v/Math.max(...hourlyTrend))*120" r="2.5" fill="#10b981" />
      </template>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:4px;">
      <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
    </div>
  </div>

  <!-- 13) 영업지표 레이더 -->
  <div v-show="showPanel('radar')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">⚡ 영업 지표 비교</div>
    <svg viewBox="0 0 200 200" style="width:100%;height:200px;">
      <polygon points="100,30 160,70 140,150 60,150 40,70" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <polygon points="100,50 145,80 128,140 72,140 55,80" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <polygon points="100,70 130,90 117,130 83,130 70,90" fill="none" stroke="#e5e7eb" stroke-width="1"/>
      <line v-for="(a,ai) in radarAxes" :key="ai" x1="100" y1="100" :x2="a.x2" :y2="a.y2" stroke="#e5e7eb" stroke-width="1"/>
      <polygon :points="radarPath" fill="rgba(232,88,122,0.25)" stroke="#e8587a" stroke-width="2"/>
      <text v-for="(a,ai) in radarAxes" :key="'l'+ai" :x="a.lx" :y="a.ly" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#555">{{ a.label }}</text>
    </svg>
  </div>

  <!-- 14) 경제 수준별 -->
  <div v-show="showPanel('economy')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">💼 경제 수준별 매출현황</div>
    <svg viewBox="0 0 480 160" style="width:100%;height:160px;">
      <path :d="areaPath(economySales.high,   480, 160, 10)" fill="rgba(123,31,162,0.35)" stroke="#7b1fa2" stroke-width="1.5"/>
      <path :d="areaPath(economySales.middle, 480, 160, 10)" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="1.5"/>
      <path :d="areaPath(economySales.low,    480, 160, 10)" fill="rgba(16,185,129,0.18)" stroke="#10b981" stroke-width="1.5"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:4px;padding:0 10px;">
      <span v-for="m in economySales.labels" :key="m">{{ m }}</span>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:10.5px;flex-wrap:wrap;">
      <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#7b1fa2;border-radius:2px;"></span>상위</span>
      <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#3b82f6;border-radius:2px;"></span>중위</span>
      <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#10b981;border-radius:2px;"></span>하위</span>
    </div>
  </div>

  <!-- 15) 배송 조건별 -->
  <div v-show="showPanel('shipping')" class="card" style="padding:14px;">
    <div style="font-size:12px;font-weight:800;color:#444;margin-bottom:10px;">🚚 배송 조건별 매출현황</div>
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
          <span :style="{width:'12px',height:'12px',borderRadius:'2px',background:s.color}"></span>
          <span style="flex:1;color:#555;">{{ s.label }}배송</span>
          <span style="font-weight:800;color:#333;">{{ s.value }}%</span>
        </div>
      </div>
    </div>
  </div>

  </div><!-- /탭 그리드 -->
</div>
`,
  };
})();
