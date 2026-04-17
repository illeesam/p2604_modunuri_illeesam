/* ShopJoy Admin - 전시영역미리보기 (3탭: 영역미리보기 · 구조선택 · 소스) */
window.DpDispUiSimul = {
  name: 'DpDispUiSimul',
  props: ['navigate', 'dispDataset', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    /* ── 오늘 날짜 ── */
    const today = new Date().toISOString().slice(0, 10);

    /* ── 메인 탭 ── */
    const mainTab = ref('preview'); // 'preview' | 'struct' | 'source'

    /* ── 공통 필터 ── */
    const previewDate   = ref(today);
    const previewTime   = ref(new Date().toTimeString().slice(0, 5)); // 'HH:MM'
    const viewMode      = ref('card');   // 'list' | 'card' | 'expand'
    const showDesc      = ref(true);
    const showAreaDrop  = ref(false);
    const selectedAreas = reactive(new Set());

    /* ── 패널 검색 필터 ── */
    const searchStatus     = ref('활성');
    const searchVisibility = ref('');
    const VISIBILITY_OPTS  = [
      { value: '', label: '전체' },
      { value: 'PUBLIC',    label: '전체공개' },
      { value: 'MEMBER',    label: '회원공개' },
      { value: 'VERIFIED',  label: '인증회원' },
      { value: 'PREMIUM',   label: '우수회원↑' },
      { value: 'VIP',       label: 'VIP전용' },
      { value: 'INVITED',   label: '초대회원' },
      { value: 'STAFF',     label: '직원' },
      { value: 'EXECUTIVE', label: '임직원' },
    ];

    /* ── 위젯 유형 메타 ── */
    const WIDGET_TYPE_LABELS = {
      'image_banner':'이미지 배너', 'product_slider':'상품 슬라이더', 'product':'상품',
      'cond_product':'조건상품',   'chart_bar':'차트(Bar)',          'chart_line':'차트(Line)',
      'chart_pie':'차트(Pie)',     'text_banner':'텍스트 배너',      'info_card':'정보카드',
      'popup':'팝업',              'file':'파일',                    'file_list':'파일목록',
      'coupon':'쿠폰',             'html_editor':'HTML 에디터',      'event_banner':'이벤트',
      'cache_banner':'캐시',       'widget_embed':'위젯',
    };
    const WIDGET_ICONS = {
      'image_banner':'🖼', 'product_slider':'🛒', 'product':'📦',
      'cond_product':'🔍', 'chart_bar':'📊',      'chart_line':'📈',
      'chart_pie':'🥧',   'text_banner':'📝',     'info_card':'ℹ',
      'popup':'💬',        'file':'📎',            'file_list':'📁',
      'coupon':'🎟',       'html_editor':'📄',     'event_banner':'🎉',
      'cache_banner':'💰', 'widget_embed':'🧩',
    };
    const wLabel = (t) => WIDGET_TYPE_LABELS[t] || t || '-';
    const wIcon  = (t) => WIDGET_ICONS[t] || '▪';

    /* ── 화면영역 코드 ── */
    const allAreaListRaw = computed(() =>
      (props.dispDataset.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const areaList = computed(() => {
      const all = allAreaListRaw.value;
      if (selectedAreas.size === 0) return all;
      return all.filter(c => selectedAreas.has(c.codeValue));
    });

    /* ── 영역 드롭다운 멀티선택 ── */
    const toggleArea     = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };
    const selectAllAreas = () => { allAreaListRaw.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas  = () => { selectedAreas.clear(); };
    const areaBtnLabel   = computed(() => {
      const sz = selectedAreas.size;
      return sz === 0 ? '전체 영역' : `${sz}개 영역 선택`;
    });

    /* ── 날짜+시간 범위 판단 ── */
    const isDateInRange = (panel) => {
      const d = previewDate.value;
      if (!d) return true;
      const t  = previewTime.value || '00:00';
      const dt = `${d} ${t}`;
      if (panel.dispStartDate) {
        const ps = `${panel.dispStartDate} ${panel.dispStartTime || '00:00'}`;
        if (dt < ps) return false;
      }
      if (panel.dispEndDate) {
        const pe = `${panel.dispEndDate} ${panel.dispEndTime || '23:59'}`;
        if (dt > pe) return false;
      }
      return true;
    };

    /* ── 공통 패널 필터 함수 ── */
    const panelFilter = (p) => {
      if (searchStatus.value && p.status !== searchStatus.value) return false;
      if (!isDateInRange(p)) return false;
      if (searchVisibility.value && !window.visibilityUtil.has(p.visibilityTargets, searchVisibility.value)) return false;
      return true;
    };

    /* ── Tab1: 영역별 필터 패널 ── */
    const panelsForArea = (areaCode) =>
      (props.dispDataset.displays || [])
        .filter(p => p.area === areaCode && panelFilter(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const totalPanels = computed(() =>
      (props.dispDataset.displays || []).filter(p => panelFilter(p)).length
    );
    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

    /* ─────────────────────────────────────────
       Tab2: 구조선택 + 선택 영역미리보기
    ───────────────────────────────────────── */
    const checkedPanelIds = reactive(new Set());

    /* 패널의 위젯 타입 목록 */
    const panelWidgetTypes = (p) => {
      if (p.rows && p.rows.length) return p.rows.map(r => r.widgetType);
      return p.widgetType ? [p.widgetType] : [];
    };

    /* 영역별 유효 패널 목록 (날짜·영역 필터 적용) */
    const structAreaList = computed(() =>
      allAreaListRaw.value.map(area => {
        const panels = (props.dispDataset.displays || [])
          .filter(p => p.area === area.codeValue && panelFilter(p))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return { ...area, panels };
      }).filter(a => selectedAreas.size === 0 || selectedAreas.has(a.codeValue))
    );

    /* 영역 펼침 상태 */
    const expandedAreas = reactive(new Set());
    const initExpandedAreas = () => {
      allAreaListRaw.value.forEach(a => expandedAreas.add(a.codeValue));
    };
    const toggleAreaExpand = (code) => {
      if (expandedAreas.has(code)) expandedAreas.delete(code);
      else expandedAreas.add(code);
    };

    /* 패널 체크 토글 — 하위 위젯 포함 cascade */
    const togglePanelCheck = (p) => {
      const id = p.dispId;
      const rows = p.rows || [];
      const panelOn = checkedPanelIds.has(id);
      const allWidgetsOn = rows.length === 0 || rows.every((_, wi) => checkedWidgetKeys.has(id + '_' + wi));
      if (panelOn && allWidgetsOn) {
        checkedPanelIds.delete(id);
        rows.forEach((_, wi) => checkedWidgetKeys.delete(id + '_' + wi));
      } else {
        checkedPanelIds.add(id);
        rows.forEach((_, wi) => checkedWidgetKeys.add(id + '_' + wi));
      }
    };
    const isPanelAllChecked = (p) =>
      checkedPanelIds.has(p.dispId) &&
      ((p.rows || []).length === 0 || (p.rows || []).every((_, wi) => checkedWidgetKeys.has(p.dispId + '_' + wi)));
    const checkAllPanels = () => {
      structAreaList.value.forEach(a => a.panels.forEach(p => {
        checkedPanelIds.add(p.dispId);
        (p.rows || []).forEach((_, wi) => checkedWidgetKeys.add(p.dispId + '_' + wi));
      }));
    };
    const clearCheckedPanels = () => { checkedPanelIds.clear(); checkedWidgetKeys.clear(); };

    /* 영역 단위 전체체크 — 하위 패널·위젯 포함 cascade */
    const checkAreaPanels = (area) => {
      const allPanels = area.panels.every(p => checkedPanelIds.has(p.dispId));
      const allWidgets = area.panels.every(p =>
        (p.rows || []).every((_, wi) => checkedWidgetKeys.has(p.dispId + '_' + wi))
      );
      if (allPanels && allWidgets) {
        area.panels.forEach(p => {
          checkedPanelIds.delete(p.dispId);
          (p.rows || []).forEach((_, wi) => checkedWidgetKeys.delete(p.dispId + '_' + wi));
        });
      } else {
        area.panels.forEach(p => {
          checkedPanelIds.add(p.dispId);
          (p.rows || []).forEach((_, wi) => checkedWidgetKeys.add(p.dispId + '_' + wi));
        });
      }
    };
    const isAreaAllChecked = (area) =>
      area.panels.length > 0 &&
      area.panels.every(p => checkedPanelIds.has(p.dispId)) &&
      area.panels.every(p => (p.rows || []).every((_, wi) => checkedWidgetKeys.has(p.dispId + '_' + wi)));

    const checkedCount = computed(() => checkedPanelIds.size);

    /* ── 위젯 체크 (키: `${dispId}_${wi}`) ── */
    const checkedWidgetKeys = reactive(new Set());

    const toggleWidgetCheck = (dispId, wi, event) => {
      if (event) event.stopPropagation();
      const key = `${dispId}_${wi}`;
      if (checkedWidgetKeys.has(key)) checkedWidgetKeys.delete(key);
      else checkedWidgetKeys.add(key);
    };
    const checkAllWidgets = () => {
      structAreaList.value.forEach(a =>
        a.panels.forEach(p =>
          (p.rows || []).forEach((_, wi) => checkedWidgetKeys.add(`${p.dispId}_${wi}`))
        )
      );
    };
    const clearCheckedWidgets = () => { checkedWidgetKeys.clear(); };
    const checkedWidgetCount = computed(() => checkedWidgetKeys.size);

    /* 선택된 위젯 목록 (패널·영역 정보 포함) */
    const checkedWidgetList = computed(() => {
      const result = [];
      structAreaList.value.forEach(a =>
        a.panels.forEach(p =>
          (p.rows || []).forEach((w, wi) => {
            if (checkedWidgetKeys.has(`${p.dispId}_${wi}`))
              result.push({ ...w, _dispId: p.dispId, _panelNm: p.name, _area: a.codeLabel, _wi: wi });
          })
        )
      );
      return result;
    });

    /* ─────────────────────────────────────────
       Tab3: 소스 구조
    ───────────────────────────────────────── */
    const sourceCopied = ref(false);

    const WIDGET_EXTRA_ATTRS = {
      image_banner:    ['imageUrl','linkUrl','altText'],
      product_slider:  ['productIds','displayCnt','autoPlay'],
      product:         ['productIds','displayCnt'],
      cond_product:    ['condType','condValue','displayCnt'],
      chart_bar:       ['chartTitle','chartLabels','chartValues','chartColor'],
      chart_line:      ['chartTitle','chartLabels','chartValues','chartColor'],
      chart_pie:       ['chartTitle','chartLabels','chartValues'],
      text_banner:     ['textContent','bgColor','textColor','fontSize'],
      info_card:       ['infoTitle','infoBody','infoIcon'],
      popup:           ['popupWidth','popupHeight','popupBg'],
      file:            ['fileUrl','fileLabel','fileSize'],
      file_list:       ['fileIds','maxCount'],
      coupon:          ['couponCode','couponDesc','discountRate'],
      html_editor:     ['htmlContent'],
      event_banner:    ['eventId','eventTitle','eventUrl'],
      cache_banner:    ['cacheAmount','cacheDesc','cacheExpire'],
      widget_embed:    ['embedCode','embedWidth','embedHeight'],
    };

    const sourceLines = computed(() => {
      const lines = [];
      const A = (key, val, real = false) => ({ key, val: String(val), real });
      const areas = allAreaListRaw.value.filter(a =>
        selectedAreas.size === 0 || selectedAreas.has(a.codeValue)
      );

      /* ── 최상단 헤더 주석 ── */
      lines.push({ type:'source-header', htype:'entities', data:{
        area:   selectedAreas.size > 0 ? [...selectedAreas].join(', ') : '',
        panel:  '',
        widget: '',
        lib:    '',
      }});
      lines.push({ type:'source-header', htype:'disp', data:{
        datetime:     `${previewDate.value || '-'} ${previewTime.value || ''}`.trim(),
        status:       searchStatus.value || '전체',
        visibility:   searchVisibility.value ? (VISIBILITY_OPTS.find(o => o.value === searchVisibility.value)?.label || searchVisibility.value) : '전체',
      }});
      lines.push({ type:'source-header', htype:'cond', data:{
        period:   '-',
        category: '-',
        order:    '-',
      }});
      lines.push({ type:'blank' });
      lines.push({ type:'ui-open', level:0 });
      areas.forEach((area, ai) => {
        const panels = (props.dispDataset.displays || [])
          .filter(p => p.area === area.codeValue && panelFilter(p))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        if (ai > 0) lines.push({ type:'blank' });
        /* ── DispX02Area 메타 주석 ── */
        const _areaLayout = area.layoutType === 'dashboard'
          ? 'dashboard'
          : `${area.layoutType || 'grid'}:${area.gridCols || 1}`;
        lines.push({ type:'area-meta', level:1, meta:{
          layout: _areaLayout,
          sortOrd: area.sortOrd != null ? area.sortOrd : '-',
          area: area.codeValue,
        }});
        /* ── <DispX02Area attrs> ── */
        lines.push({ type:'area-open', level:1, attrs:[
          A('area',       area.codeValue,          true),
          A('areaLabel',  area.codeLabel,           true),
          A('layoutType', area.layoutType || 'grid', true),
          A('gridCols',   area.layoutType === 'dashboard' ? '~' : (area.gridCols || 1), area.layoutType !== 'dashboard'),
          A('sortOrd',    '~'),
          A('useYn',      '~'),
        ]});
        if (panels.length === 0) {
          lines.push({ type:'comment', level:2, text:`<!-- 해당 날짜 활성 패널 없음 -->` });
        } else {
          panels.forEach(p => {
            const rows = p.rows || [];
            lines.push({ type:'blank' });
            /* ── 패널 메타 주석 ── */
            const _period = (p.dispStartDate || p.dispEndDate)
              ? `${p.dispStartDate || '∞'}${p.dispStartTime ? ' '+p.dispStartTime : ''} ~ ${p.dispEndDate || '∞'}${p.dispEndTime ? ' '+p.dispEndTime : ''}`
              : '기간없음';
            const _panelLayout = p.layoutType === 'dashboard'
              ? 'dashboard'
              : `${p.layoutType || 'grid'}:${p.gridCols || 1}`;
            lines.push({ type:'panel-meta', level:2, meta:{
              layout: _panelLayout,
              sortOrder: p.sortOrder != null ? p.sortOrder : '-',
              period: _period,
              status: p.status || '-',
              condition: p.condition || '항상 표시',
              authRequired: p.authRequired ? '필요' : '불필요',
              authGrade: (p.authRequired && p.authGrade) ? p.authGrade + ' 이상' : '-',
            }});
            /* ── <DispX03Panel attrs> ── */
            lines.push({ type:'panel-open', level:2, attrs:[
              A('id',            '#'+String(p.dispId).padStart(4,'0'), true),
              A('name',          p.name,                               true),
              A('status',        p.status,                             true),
              A('layoutType',    p.layoutType || 'grid',               true),
              A('gridCols',      p.layoutType === 'dashboard' ? '~' : (p.gridCols || 1), p.layoutType !== 'dashboard'),
              A('condition',     p.condition || '항상 표시',             true),
              A('authRequired',  p.authRequired  || '~', !!p.authRequired),
              A('authGrade',     p.authGrade     || '~', !!p.authGrade),
              A('dispStartDate', p.dispStartDate || '~', !!p.dispStartDate),
              A('dispStartTime', p.dispStartTime || '~', !!p.dispStartTime),
              A('dispEndDate',   p.dispEndDate   || '~', !!p.dispEndDate),
              A('dispEndTime',   p.dispEndTime   || '~', !!p.dispEndTime),
              A('sortOrder',     p.sortOrder != null ? p.sortOrder : '~', p.sortOrder != null),
            ]});
            if (rows.length === 0) {
              lines.push({ type:'comment', level:3, text:`<!-- (위젯 없음) -->` });
            } else {
              rows.forEach(w => {
                /* ── <DispX04Widget attrs /> ── */
                lines.push({ type:'widget', level:3, attrs:[
                  A('widgetType', w.widgetType,        true),
                  A('widgetNm',   w.widgetNm || '~',   !!w.widgetNm),
                  A('condition',  w.condition || '~',  !!w.condition),
                  A('sortOrder',  '~'),
                  ...(WIDGET_EXTRA_ATTRS[w.widgetType] || []).map(k => A(k,'~')),
                ]});
              });
            }
            lines.push({ type:'panel-close', level:2 });
          });
          lines.push({ type:'blank' });
        }
        lines.push({ type:'area-close', level:1 });
      });
      lines.push({ type:'ui-close', level:0 });
      return lines;
    });

    const sourceText = computed(() => {
      const fa = (attrs) => attrs.map(a => `${a.key}="${a.val}"`).join(' ');
      const ind = (n) => '  '.repeat(n);
      return sourceLines.value.map(l => {
        if (l.type === 'blank')        return '';
        if (l.type === 'ui-open')      return `<DispX01Ui>`;
        if (l.type === 'ui-close')     return `</DispX01Ui>`;
        if (l.type === 'area-open')    return `${ind(l.level)}<DispX02Area ${fa(l.attrs)}>`;
        if (l.type === 'source-header') {
          if (l.htype === 'entities') return `<!-- 전시개체 : 전시영역s: ${l.data.area||'-'}, 전시패널s: ${l.data.panel||'-'}, 전시위젯s: ${l.data.widget||'-'}, 위젯Libs: ${l.data.lib||'-'} -->`;
          if (l.htype === 'disp')     return `<!-- disp조건 : 전시일시 : ${l.data.datetime}  |  상태 : ${l.data.status}  |  노출조건 : ${l.data.condition}  |  인증필요 : ${l.data.authRequired}  |  등급제한 : ${l.data.authGrade} -->`;
          if (l.htype === 'cond')     return `<!-- cond조건 : 조회기간 : ${l.data.period},  카테고리 : ${l.data.category},  주문 : ${l.data.order} -->`;
          return '';
        }
        if (l.type === 'area-meta')    return `${ind(l.level)}<!-- 표시형식:${l.meta.layout}, 정렬:${l.meta.sortOrd}, area="${l.meta.area}" -->`;
        if (l.type === 'panel-meta')   return `${ind(l.level)}<!-- 표시형식:${l.meta.layout}, 정렬:${l.meta.sortOrder}, 기간: ${l.meta.period}  |  상태: ${l.meta.status}  |  노출조건: ${l.meta.condition}  |  인증필요: ${l.meta.authRequired}  |  등급제한: ${l.meta.authGrade} -->`;
        if (l.type === 'panel-open')   return `${ind(l.level)}<DispX03Panel ${fa(l.attrs)}>`;
        if (l.type === 'widget')       return `${ind(l.level)}<DispX04Widget ${fa(l.attrs)} />`;
        if (l.type === 'panel-close')  return `${ind(l.level)}</DispX03Panel>`;
        if (l.type === 'area-close')   return `${ind(l.level)}</DispX02Area>`;
        if (l.type === 'comment')      return `${ind(l.level||0)}${l.text}`;
        return '';
      }).join('\n');
    });

    const copySource = () => {
      navigator.clipboard?.writeText(sourceText.value).then(() => {
        sourceCopied.value = true;
        setTimeout(() => { sourceCopied.value = false; }, 2000);
      });
    };

    /* 탭 전환 시 초기화 */
    const switchTab = (tab) => {
      mainTab.value = tab;
      if (tab === 'struct') initExpandedAreas();
    };

    /* ─────────────────────────────────────────
       구조 탭 우측 그리드 (드래그-드롭 + span)
    ───────────────────────────────────────── */
    /* ── 캔버스 레이아웃 설정 ── */
    const structLayoutType = ref('grid');   // 'grid' | 'dashboard'
    const structColCount   = ref(1);        // 1 ~ 32
    const sMakeInit = (cols) => Array(cols * 2).fill(null);
    const structSlots = reactive([...sMakeInit(1)]);
    const structCurrentSlots = computed(() => structSlots);
    const structAutoExpand = () => {
      const cols = structColCount.value;
      if (structSlots.slice(structSlots.length - cols).some(Boolean))
        for (let i = 0; i < cols; i++) structSlots.push(null);
    };
    const structGridCols = computed(() => {
      const n = structColCount.value;
      if (n <= 1) return 'repeat(1,1fr)';
      if (n === 2) return 'repeat(auto-fill,minmax(max(calc(50% - 5px),260px),1fr))';
      if (n === 3) return 'repeat(auto-fill,minmax(max(calc(33.333% - 6px),190px),1fr))';
      if (n === 4) return 'repeat(auto-fill,minmax(max(calc(25% - 6px),220px),1fr))';
      return `repeat(${n},1fr)`;
    });
    /* 영역 설정을 캔버스에 적용 */
    const applyAreaLayout = (area) => {
      const lt = area.layoutType || 'grid';
      const gc = area.gridCols   || 1;
      structLayoutType.value = lt;
      if (lt === 'grid') {
        structColCount.value = gc;
        structSlots.splice(0, structSlots.length, ...sMakeInit(gc));
      }
    };

    /* ── 뷰포트 모드 (grid 탭 전용) ── */
    const structViewport = ref('desktop');
    const structShowReal = ref(false);
    const STRUCT_VIEWPORT = {
      desktop: { label:'🖥 PC',     width: null   },
      tablet:  { label:'📟 태블릿', width:'768px' },
      mobile:  { label:'📱 모바일', width:'375px' },
    };

    /* ── dashboard 자유배치 ── */
    const structDashItems = reactive([]);
    const structDashDragOver = ref(false);
    const onStructDashDragOver  = (e) => { e.preventDefault(); structDashDragOver.value = true; };
    const onStructDashDragLeave = () => { structDashDragOver.value = false; };
    const onStructDashDrop = (e) => {
      e.preventDefault(); structDashDragOver.value = false;
      const widgets = window._dragAreaWidgets;
      if (!widgets) return;
      window._dragAreaWidgets = null;
      if (widgets.length > 40) {
        props.showToast(`위젯이 ${widgets.length}개로 40개를 초과합니다. 배치할 수 없습니다.`, 'error');
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const SNAP = 20;
      let bx = Math.max(0, Math.round((e.clientX - rect.left - 120) / SNAP) * SNAP);
      let by = Math.max(0, Math.round((e.clientY - rect.top  - 20)  / SNAP) * SNAP);
      const COLS = 3, W = 240, H = 180, GAP = 10;
      widgets.forEach((w, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        structDashItems.push({ id: Date.now() + i, slot: { ...w },
          x: bx + col*(W+GAP), y: by + row*(H+GAP), w: W, h: H });
      });
    };
    const startStructDashMove = (e, item) => {
      e.preventDefault();
      const ox = e.clientX - item.x, oy = e.clientY - item.y;
      const mv = (me) => { item.x = Math.max(0, me.clientX - ox); item.y = Math.max(0, me.clientY - oy); };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    };
    const startStructDashResize = (e, item) => {
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sy = e.clientY, sw = item.w, sh = item.h;
      const mv = (me) => { item.w = Math.max(160, sw + (me.clientX - sx)); item.h = Math.max(100, sh + (me.clientY - sy)); };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    };
    const removeStructDashItem = (id) => {
      const i = structDashItems.findIndex(d => d.id === id);
      if (i >= 0) structDashItems.splice(i, 1);
    };

    /* ── span 팝업 ── */
    const structSpanPopupIdx = ref(-1);
    const toggleStructSpanPopup = (e, idx) => {
      e.stopPropagation();
      structSpanPopupIdx.value = structSpanPopupIdx.value === idx ? -1 : idx;
    };
    const closeStructSpanPopup = () => { structSpanPopupIdx.value = -1; };

    const structDragOverIdx = ref(-1);
    const onStructDragOver  = (e, idx) => { e.preventDefault(); structDragOverIdx.value = idx; };
    const onStructDragLeave = () => { structDragOverIdx.value = -1; };
    const onStructDrop = (e, idx) => {
      e.preventDefault(); structDragOverIdx.value = -1;
      const widgets = window._dragAreaWidgets;
      if (!widgets) return;
      window._dragAreaWidgets = null;
      if (widgets.length > 40) {
        props.showToast(`위젯이 ${widgets.length}개로 40개를 초과합니다. 배치할 수 없습니다.`, 'error');
        return;
      }
      const cols = structColCount.value;
      let placed = 0, i = idx;
      while (placed < widgets.length) {
        if (i >= structSlots.length) for (let c = 0; c < cols; c++) structSlots.push(null);
        if (!structSlots[i]) { structSlots.splice(i, 1, { ...widgets[placed], colSpan:1, rowSpan:1 }); placed++; }
        i++;
      }
      structAutoExpand();
    };
    const removeStructSlot = (idx) => { structSlots.splice(idx, 1, null); };
    const setStructSpan = (idx, axis, delta) => {
      const slot = structSlots[idx]; if (!slot) return;
      const maxCol = structColCount.value;
      if (axis === 'col') slot.colSpan = Math.max(1, Math.min(maxCol, (slot.colSpan||1) + delta));
      if (axis === 'row') slot.rowSpan = Math.max(1, Math.min(4,      (slot.rowSpan||1) + delta));
    };
    const structPlacedCount = computed(() => structSlots.filter(Boolean).length);
    const resetStructGrid = () => {
      structSlots.splice(0, structSlots.length, ...sMakeInit(structColCount.value));
    };

    /* ── 노드 드래그 (영역 / 패널) ── */
    const onAreaDragStart = (e, area) => {
      const widgets = area.panels.flatMap(p =>
        (p.rows || []).map(w => ({ ...w, _panelNm: p.name, _area: area.codeLabel })));
      window._dragAreaWidgets = widgets;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', 'area:' + widgets.length);
    };
    const onPanelDragStart = (e, p, areaLabel) => {
      const widgets = (p.rows || []).map(w => ({ ...w, _panelNm: p.name, _area: areaLabel }));
      window._dragAreaWidgets = widgets;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', 'panel:' + widgets.length);
    };
    const onAreaDragEnd = () => { window._dragAreaWidgets = null; };

    /* ── Ui미리보기 레이어 ── */
    const dispUiLayerOpen = ref(true);
    const dispUiModalOpen = ref(false);
    const dispUiAreaErr   = ref(false);

    /* 독립적인 조회 폼 (메인 필터와 별개) */
    const dispUiForm = Vue.reactive({
      areas: [], date: '', time: '', status: '',
      condition: '', authRequired: '', authGrade: '',
      siteId: '', siteNm: '', memberId: '', memberNm: '',
    });

    /* 보기옵션 (기본 전체 체크) */
    const dispUiViewOpts = Vue.reactive({ content: true, struct: true, source: true });

    /* 사이트 모달 */
    const dispUiSiteModalOpen = ref(false);
    const dispUiSiteSearch    = ref('');
    const dispUiSiteList = computed(() => {
      const kw = dispUiSiteSearch.value.trim().toLowerCase();
      return (props.dispDataset.sites || []).filter(s =>
        !kw || s.siteNm.toLowerCase().includes(kw) || (s.domain||'').toLowerCase().includes(kw)
      );
    });
    const selectDispUiSite = (site) => {
      dispUiForm.siteId = String(site.siteId);
      dispUiForm.siteNm = site.siteNm;
      dispUiSiteModalOpen.value = false;
    };

    /* 회원 모달 */
    const dispUiMemberModalOpen = ref(false);
    const dispUiMemberSearch    = ref('');
    const dispUiMemberList = computed(() => {
      const kw = dispUiMemberSearch.value.trim().toLowerCase();
      return (props.dispDataset.members || []).filter(m =>
        !kw || (m.memberNm||'').toLowerCase().includes(kw) || (m.email||'').toLowerCase().includes(kw)
      ).slice(0, 30);
    });
    const selectDispUiMember = (m) => {
      dispUiForm.memberId = String(m.userId);
      dispUiForm.memberNm = m.memberNm || m.email;
      dispUiMemberModalOpen.value = false;
    };

    /* 초기화 */
    const resetDispUiForm = () => {
      dispUiForm.areas       = [];
      dispUiForm.date        = '';
      dispUiForm.time        = '';
      dispUiForm.status      = '';
      dispUiForm.visibility  = '';
      dispUiForm.siteId      = '';
      dispUiForm.siteNm      = '';
      dispUiForm.memberId    = '';
      dispUiForm.memberNm    = '';
      dispUiViewOpts.content = true;
      dispUiViewOpts.struct  = true;
      dispUiViewOpts.source  = true;
    };

    /* DispUi 영역 드롭다운 (메인 필터와 동일한 UX) */
    const dispUiAreaDrop = ref(false);
    const dispUiAreaBtnLabel = computed(() => {
      const sz = dispUiForm.areas.length;
      return sz === 0 ? '전체 영역' : `${sz}개 영역 선택`;
    });
    const dispUiToggleArea = (code) => {
      const i = dispUiForm.areas.indexOf(code);
      if (i !== -1) dispUiForm.areas.splice(i, 1);
      else dispUiForm.areas.push(code);
      dispUiAreaErr.value = false;
    };
    const dispUiSelectAllAreas = () => {
      allAreaListRaw.value.forEach(a => {
        if (!dispUiForm.areas.includes(a.codeValue)) dispUiForm.areas.push(a.codeValue);
      });
      dispUiAreaErr.value = false;
    };
    const dispUiClearAllAreas = () => { dispUiForm.areas.splice(0); };

    /* 레이어 열기 – 처음 열 때 현재 필터값 복사 */
    const openDispUiLayer = () => {
      if (!dispUiLayerOpen.value) {
        dispUiForm.areas        = [...selectedAreas];
        dispUiForm.date         = previewDate.value;
        dispUiForm.time         = previewTime.value;
        dispUiForm.status       = searchStatus.value;
        dispUiForm.visibility   = searchVisibility.value;
        const cf   = window.adminCommonFilter || {};
        const site = (props.dispDataset.sites || []).find(s => s.siteId === cf.siteId);
        dispUiForm.siteId   = cf.siteId ? String(cf.siteId) : '';
        dispUiForm.siteNm   = site?.siteNm || '';
        dispUiForm.memberId = '';
        dispUiForm.memberNm = '';
        dispUiSiteSearch.value   = '';
        dispUiMemberSearch.value = '';
        dispUiAreaDrop.value = false;
      }
      dispUiLayerOpen.value = !dispUiLayerOpen.value;
    };

    const dispUiParamObj = computed(() => {
      const viewOpts = ['content','struct','source'].filter(k => dispUiViewOpts[k]).join(',');
      return {
        areas:        [...dispUiForm.areas],
        date:         dispUiForm.date,
        time:         dispUiForm.time,
        status:       dispUiForm.status,
        visibilityTargets: dispUiForm.visibility ? '^' + dispUiForm.visibility + '^' : '',
        siteId:       dispUiForm.siteId,
        memberId:     dispUiForm.memberId,
        viewOpts,
      };
    });

    /* 모달 탭 목록 */
    const dispUiModalTabs = computed(() =>
      [{ key:'content', label:'내용보기' }, { key:'struct', label:'구조보기' }, { key:'source', label:'소스보기' }]
        .filter(t => dispUiViewOpts[t.key])
    );

    const _validateDispUi = () => {
      if (dispUiForm.areas.length === 0) { dispUiAreaErr.value = true; return false; }
      dispUiAreaErr.value = false;
      return true;
    };

    const openDispUiModal = () => {
      if (!_validateDispUi()) return;
      dispUiModalOpen.value = true;
      /* 레이어 닫지 않음 */
    };

    const dispUiSourceText = computed(() => ''); /* DispUi 컴포넌트 내부 처리 */

    /* ── DispX02Area props ── */
    const filterParams = computed(() => ({
      status:       searchStatus.value,
      visibilityTargets: searchVisibility.value ? '^' + searchVisibility.value + '^' : '',
      date:         previewDate.value,
      time:         previewTime.value,
      isLoggedIn:   false,
      userGrade:    '',
    }));
    const dispOpt = computed(() => ({ layout: viewMode.value, showBadges: true, mode: viewMode.value, showDesc: showDesc.value }));
    const areaInfo = (code) =>
      (props.dispDataset.codes || []).find(c => c.codeGrp === 'DISP_AREA' && c.codeValue === code);

    const DISP_UI_OTHER_PAGES = [
      '/index.html#page=dispUiPage',
      '/index.html#page=dispUi01',
      '/index.html#page=dispUi02',
      '/index.html#page=dispUi03',
      '/index.html#page=dispUi04',
      '/index.html#page=dispUi05',
      '/index.html#page=dispUi06',
      '/disp-front-ui.html#page=dispUiPage',
      '/disp-front-ui.html#page=dispUi01',
      '/disp-front-ui.html#page=dispUi02',
      '/disp-front-ui.html#page=dispUi03',
      '/disp-front-ui.html#page=dispUi04',
      '/disp-front-ui.html#page=dispUi05',
      '/disp-front-ui.html#page=dispUi06',
      '/disp-admin-ui.html#page=dispUiPage',
      '/disp-admin-ui.html#page=dispUi01',
      '/disp-admin-ui.html#page=dispUi02',
      '/disp-admin-ui.html#page=dispUi03',
      '/disp-admin-ui.html#page=dispUi04',
      '/disp-admin-ui.html#page=dispUi05',
      '/disp-admin-ui.html#page=dispUi06',
    ];
    const otherMenuOpen = ref(false);
    const openDispUiOther = () => { otherMenuOpen.value = !otherMenuOpen.value; };
    const closeOtherMenu = () => { otherMenuOpen.value = false; };
    const pickOtherPage = (url) => {
      const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
      window.open(
        base + url,
        '_blank', 'width=1440,height=900,scrollbars=yes,resizable=yes'
      );
      otherMenuOpen.value = false;
    };

    const openDispUiPopup = (scope) => {
      if (!_validateDispUi()) return;
      const p = dispUiParamObj.value;
      const qs = new URLSearchParams({
        areas:        p.areas.join(','),
        date:         p.date,
        time:         p.time,
        status:       p.status,
        condition:    p.condition,
        authRequired: p.authRequired,
        authGrade:    p.authGrade,
        siteId:       p.siteId,
        memberId:     p.memberId,
        viewOpts:     p.viewOpts,
      }).toString();
      const file = scope === 'admin' ? 'disp-admin-ui.html' : 'disp-front-ui.html';
      window.open(
        `${window.pageUrl(file)}?${qs}`,
        '_blank', 'width=1440,height=900,scrollbars=yes,resizable=yes'
      );
      /* 레이어 닫지 않음 */
    };

    return {
      today, siteNm, dispDataset: props.dispDataset,
      mainTab, switchTab,
      previewDate, viewMode, showDesc, showAreaDrop,
      selectedAreas, allAreaListRaw, areaList,
      previewTime,
      searchStatus, searchVisibility,
      VISIBILITY_OPTS,
      toggleArea, selectAllAreas, clearAllAreas, areaBtnLabel,
      panelsForArea, totalPanels, resetDate, isDateInRange,
      filterParams, dispOpt, areaInfo,
      /* Tab2 */
      structAreaList, expandedAreas, toggleAreaExpand,
      checkedPanelIds, togglePanelCheck, checkAllPanels, clearCheckedPanels,
      checkAreaPanels, isAreaAllChecked,
      checkedCount,
      panelWidgetTypes, isPanelAllChecked,
      checkedWidgetKeys, toggleWidgetCheck, checkAllWidgets, clearCheckedWidgets, checkedWidgetCount, checkedWidgetList,
      /* Tab2 그리드 */
      structLayoutType, structColCount, structSlots, structCurrentSlots, structGridCols,
      structViewport, STRUCT_VIEWPORT, structShowReal,
      applyAreaLayout,
      structDragOverIdx, onStructDragOver, onStructDragLeave, onStructDrop,
      removeStructSlot, setStructSpan, structPlacedCount, resetStructGrid,
      structSpanPopupIdx, toggleStructSpanPopup, closeStructSpanPopup,
      structDashItems, structDashDragOver,
      onStructDashDragOver, onStructDashDragLeave, onStructDashDrop,
      startStructDashMove, startStructDashResize, removeStructDashItem,
      onAreaDragStart, onPanelDragStart, onAreaDragEnd,
      /* Tab3 */
      sourceLines, sourceText, sourceCopied, copySource,
      wLabel, wIcon,
      /* Ui미리보기 */
      dispUiLayerOpen, dispUiModalOpen, dispUiAreaErr,
      dispUiAreaDrop, dispUiAreaBtnLabel, dispUiToggleArea, dispUiSelectAllAreas, dispUiClearAllAreas,
      dispUiForm,
      dispUiViewOpts, dispUiParamObj,
      dispUiModalTabs, dispUiSourceText,
      dispUiSiteModalOpen, dispUiSiteSearch, dispUiSiteList, selectDispUiSite,
      dispUiMemberModalOpen, dispUiMemberSearch, dispUiMemberList, selectDispUiMember,
      openDispUiLayer, openDispUiModal, openDispUiPopup, openDispUiOther, resetDispUiForm,
      DISP_UI_OTHER_PAGES, otherMenuOpen, closeOtherMenu, pickOtherPage,
    };
  },
  template: /* html */`
<div>
  <!-- ── 페이지 제목 ── -->
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      전시UI시뮬레이션
      <span style="font-size:13px;font-weight:400;color:#888;">화면영역별 전시패널 분석 및 영역미리보기</span>
    </div>
    <span style="font-size:12px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:10px;padding:3px 12px;font-weight:600;">
      🌐 {{ siteNm }}
    </span>
  </div>

  <!-- ── 공통 필터 바 ── -->
  <div class="card" style="padding:14px 18px;margin-bottom:0;border-radius:8px 8px 0 0;border-bottom:none;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">

      <!-- 전시일시 -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:#555;">📅 전시일시</span>
        <input type="date" v-model="previewDate" class="form-control" style="width:148px;margin:0;font-size:13px;" />
        <input type="time" v-model="previewTime" class="form-control" style="width:145px;margin:0;font-size:13px;" />
        <button @click="resetDate" style="font-size:11px;padding:4px 10px;border:1px solid #d0d0d0;border-radius:10px;background:#fff;cursor:pointer;color:#555;white-space:nowrap;">🕐 현재</button>
      </div>
      <div style="width:1px;height:28px;background:#e0e0e0;"></div>

      <!-- 상태 -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">상태</span>
        <select v-model="searchStatus" class="form-control" style="width:90px;margin:0;font-size:12px;">
          <option value="">전체</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
        </select>
      </div>

      <!-- 공개대상 -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">공개대상</span>
        <select v-model="searchVisibility" class="form-control" style="width:100px;margin:0;font-size:12px;">
          <option v-for="o in VISIBILITY_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
      <div style="width:1px;height:28px;background:#e0e0e0;"></div>

      <!-- 보기모드 (Tab1에서만 활성) -->
      <div style="display:flex;align-items:center;gap:6px;" :style="mainTab!=='preview' ? 'opacity:.4;pointer-events:none;' : ''">
        <span style="font-size:12px;font-weight:600;color:#555;">보기</span>
        <div style="display:flex;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
          <button @click="viewMode='list'" style="font-size:11px;padding:4px 11px;border:none;cursor:pointer;transition:all .15s;"
            :style="viewMode==='list' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">☰ 패널리스트목록형식</button>
          <button @click="viewMode='card'" style="font-size:11px;padding:4px 11px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="viewMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">🖼 패널목록카드형식</button>
          <button @click="viewMode='expand'" style="font-size:11px;padding:4px 11px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="viewMode==='expand' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">⊞ 패널-위젯 상세보기</button>
          <button @click="viewMode='area_detail'" style="font-size:11px;padding:4px 11px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="viewMode==='area_detail' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">⊟ 영역-위젯 상세보기</button>
        </div>
      </div>
      <div style="width:1px;height:28px;background:#e0e0e0;" :style="mainTab!=='preview' ? 'opacity:.4;' : ''"></div>

      <!-- 설명보기 (Tab1에서만) -->
      <button v-if="mainTab==='preview'" @click="showDesc=!showDesc"
        style="font-size:11px;padding:4px 12px;border-radius:10px;border:1px solid #ddd;cursor:pointer;transition:all .15s;"
        :style="showDesc ? 'background:#e3f2fd;border-color:#90caf9;color:#1565c0;' : 'background:#fff;color:#999;'">
        {{ showDesc ? '📋 설명 숨기기' : '📋 설명 보기' }}
      </button>

      <!-- 화면 영역 멀티선택 (오른쪽) -->
      <div style="margin-left:auto;position:relative;">
        <button @click="showAreaDrop=!showAreaDrop"
          style="font-size:12px;padding:5px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;color:#333;min-width:140px;justify-content:space-between;"
          :style="selectedAreas.size>0 ? 'border-color:#e8587a;color:#e8587a;font-weight:600;' : ''">
          <span>🗂 {{ areaBtnLabel }}</span>
          <span style="font-size:10px;">{{ showAreaDrop ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showAreaDrop" @click="showAreaDrop=false" style="position:fixed;inset:0;z-index:99;"></div>
        <div v-if="showAreaDrop" style="position:absolute;right:0;top:calc(100% + 6px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:240px;max-height:320px;overflow-y:auto;padding:10px 0;">
          <div style="display:flex;gap:8px;padding:8px 14px 6px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="selectAllAreas" style="font-size:11px;padding:3px 10px;border:1px solid #1565c0;border-radius:8px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
            <button @click.stop="clearAllAreas" style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
            <span style="font-size:10px;color:#aaa;margin-left:auto;align-self:center;">{{ selectedAreas.size }}/{{ allAreaListRaw.length }}</span>
          </div>
          <div v-for="area in allAreaListRaw" :key="area.codeValue" @click.stop="toggleArea(area.codeValue)"
            style="display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;"
            :style="selectedAreas.has(area.codeValue) ? 'background:#fff8f8;' : ''">
            <div style="width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="selectedAreas.has(area.codeValue) ? 'border-color:#e8587a;background:#e8587a;' : 'border-color:#ccc;background:#fff;'">
              <span v-if="selectedAreas.has(area.codeValue)" style="color:#fff;font-size:11px;line-height:1;">✓</span>
            </div>
            <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#555;">{{ area.codeValue }}</code>
            <span style="font-size:12px;color:#333;">{{ area.codeLabel }}</span>
          </div>
          <div style="border-top:1px solid #f0f0f0;padding:8px 14px;">
            <button @click.stop="showAreaDrop=false" style="font-size:11px;width:100%;padding:5px;border:1px solid #e0e0e0;border-radius:6px;background:#f8f8f8;color:#666;cursor:pointer;">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택 영역 배지 -->
    <div v-if="selectedAreas.size>0" style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:11px;color:#aaa;">선택 영역:</span>
      <span v-for="code in [...selectedAreas]" :key="code"
        style="font-size:11px;background:#fce4ec;color:#c62828;border-radius:10px;padding:2px 8px;display:flex;align-items:center;gap:4px;">
        {{ code }}<span @click="toggleArea(code)" style="cursor:pointer;font-weight:700;">×</span>
      </span>
    </div>

    <!-- 조건 요약 -->
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center;" :style="selectedAreas.size>0?'margin-top:6px;':''">
      <span style="font-size:11px;color:#aaa;">조회 조건:</span>
      <span style="font-size:12px;background:#fff8e1;color:#f57c00;border-radius:10px;padding:2px 10px;">📅 {{ previewDate }} {{ previewTime }}</span>
      <span v-if="searchStatus" style="font-size:12px;background:#e8f5e9;color:#2e7d32;border-radius:10px;padding:2px 10px;">상태: {{ searchStatus }}</span>
      <span v-if="searchVisibility" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:10px;padding:2px 10px;">공개: {{ VISIBILITY_OPTS.find(o => o.value === searchVisibility)?.label }}</span>
      <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
        <button @click="openDispUiLayer"
          style="font-size:11px;padding:3px 10px;border-radius:10px;cursor:pointer;font-weight:600;border:1px solid #b39ddb;white-space:nowrap;transition:all .15s;"
          :style="dispUiLayerOpen?'background:#ede7f6;color:#4a148c;':'background:#f3e5f5;color:#6a1b9a;'">
          🖥 DispUi미리보기
        </button>
        <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:10px;padding:2px 10px;">패널 {{ totalPanels }}개 해당</span>
      </div>
    </div>

    <!-- Ui미리보기 파라미터 레이어 -->
    <div v-if="dispUiLayerOpen"
      style="margin-top:8px;background:#faf8ff;border:1px solid #b39ddb;border-radius:10px;padding:14px 18px;">
      <div style="font-size:12px;font-weight:700;color:#4a148c;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
        🖥 DispUi미리보기 조회조건
        <button @click="resetDispUiForm"
          style="font-size:11px;padding:2px 10px;border-radius:6px;border:1px solid #ce93d8;background:#f3e5f5;color:#7b1fa2;cursor:pointer;font-weight:500;margin-left:4px;">
          초기화
        </button>
      </div>

      <!-- ① 전시영역 (필수) — 메인 필터와 동일한 드롭다운 방식 -->
      <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:600;color:#555;white-space:nowrap;">
          전시영역
          <span style="font-size:10px;background:#fce4ec;color:#c62828;border-radius:4px;padding:1px 5px;margin-left:4px;">필수</span>
        </span>
        <!-- 드롭다운 버튼 -->
        <div style="position:relative;">
          <button @click="dispUiAreaDrop=!dispUiAreaDrop"
            style="font-size:12px;padding:5px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;color:#333;min-width:140px;justify-content:space-between;"
            :style="dispUiForm.areas.length>0 ? 'border-color:#e8587a;color:#e8587a;font-weight:600;' : ''">
            <span>🗂 {{ dispUiAreaBtnLabel }}</span>
            <span style="font-size:10px;">{{ dispUiAreaDrop ? '▲' : '▼' }}</span>
          </button>
          <div v-if="dispUiAreaDrop" @click="dispUiAreaDrop=false" style="position:fixed;inset:0;z-index:99;"></div>
          <div v-if="dispUiAreaDrop" style="position:absolute;left:0;top:calc(100% + 6px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:240px;max-height:280px;overflow-y:auto;padding:10px 0;">
            <div style="display:flex;gap:8px;padding:8px 14px 6px;border-bottom:1px solid #f0f0f0;">
              <button @click.stop="dispUiSelectAllAreas" style="font-size:11px;padding:3px 10px;border:1px solid #1565c0;border-radius:8px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
              <button @click.stop="dispUiClearAllAreas" style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
              <span style="font-size:10px;color:#aaa;margin-left:auto;align-self:center;">{{ dispUiForm.areas.length }}/{{ allAreaListRaw.length }}</span>
            </div>
            <div v-for="area in allAreaListRaw" :key="area.codeValue" @click.stop="dispUiToggleArea(area.codeValue)"
              style="display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;"
              :style="dispUiForm.areas.includes(area.codeValue) ? 'background:#fff8f8;' : ''">
              <div style="width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                :style="dispUiForm.areas.includes(area.codeValue) ? 'border-color:#e8587a;background:#e8587a;' : 'border-color:#ccc;background:#fff;'">
                <span v-if="dispUiForm.areas.includes(area.codeValue)" style="color:#fff;font-size:11px;line-height:1;">✓</span>
              </div>
              <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#555;">{{ area.codeValue }}</code>
              <span style="font-size:12px;color:#333;">{{ area.codeLabel }}</span>
            </div>
            <div style="border-top:1px solid #f0f0f0;padding:8px 14px;">
              <button @click.stop="dispUiAreaDrop=false" style="font-size:11px;width:100%;padding:5px;border:1px solid #e0e0e0;border-radius:6px;background:#f8f8f8;color:#666;cursor:pointer;">닫기</button>
            </div>
          </div>
        </div>
        <!-- 선택된 영역 태그 -->
        <span v-for="code in dispUiForm.areas" :key="code"
          style="font-size:11px;background:#fce4ec;color:#c62828;border-radius:10px;padding:2px 8px;display:flex;align-items:center;gap:4px;">
          {{ code }}<span @click="dispUiToggleArea(code)" style="cursor:pointer;font-weight:700;">×</span>
        </span>
        <span v-if="dispUiAreaErr" style="font-size:11px;color:#e8587a;">⚠ 1개 이상 선택하세요</span>
      </div>

      <!-- ② 조건 행 1: 전시일시 · 상태 · 노출조건 · 인증필요 · 등급제한 -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;padding:8px 10px;background:#fff;border-radius:8px;border:1px solid #ece8f8;">
        <span class="search-label" style="font-size:11px;">전시일시</span>
        <input type="date" v-model="dispUiForm.date"
          style="font-size:11px;padding:3px 7px;border:1px solid #d0d0d0;border-radius:6px;width:130px;" />
        <input type="time" v-model="dispUiForm.time"
          style="font-size:11px;padding:3px 7px;border:1px solid #d0d0d0;border-radius:6px;width:90px;" />
        <div style="width:1px;height:20px;background:#e0e0e0;margin:0 2px;"></div>
        <span class="search-label" style="font-size:11px;">상태</span>
        <select v-model="dispUiForm.status"
          style="font-size:11px;padding:3px 7px;border:1px solid #d0d0d0;border-radius:6px;">
          <option value="">전체</option><option>활성</option><option>비활성</option>
        </select>
        <div style="width:1px;height:20px;background:#e0e0e0;margin:0 2px;"></div>
        <span class="search-label" style="font-size:11px;">공개대상</span>
        <select v-model="dispUiForm.visibility"
          style="font-size:11px;padding:3px 7px;border:1px solid #d0d0d0;border-radius:6px;">
          <option v-for="o in VISIBILITY_OPTS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>

      <!-- ③ 조건 행 2: 사이트 · 회원 -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:8px 10px;background:#fff;border-radius:8px;border:1px solid #ece8f8;">
        <!-- 사이트 -->
        <span class="search-label" style="font-size:11px;">사이트</span>
        <div style="display:flex;align-items:center;gap:5px;">
          <span v-if="dispUiForm.siteNm"
            style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:2px 8px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            {{ dispUiForm.siteNm }}
          </span>
          <span v-else style="font-size:11px;color:#bbb;">미선택</span>
          <button @click="dispUiSiteModalOpen=true;dispUiSiteSearch=''"
            style="font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;cursor:pointer;">
            📋 선택
          </button>
          <button v-if="dispUiForm.siteId" @click="dispUiForm.siteId='';dispUiForm.siteNm=''"
            style="font-size:10px;padding:2px 6px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#999;cursor:pointer;">×</button>
        </div>
        <div style="width:1px;height:20px;background:#e0e0e0;margin:0 4px;"></div>
        <!-- 회원 -->
        <span class="search-label" style="font-size:11px;">회원</span>
        <div style="display:flex;align-items:center;gap:5px;">
          <span v-if="dispUiForm.memberNm"
            style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:2px 8px;">
            {{ dispUiForm.memberNm }}
          </span>
          <span v-else style="font-size:11px;color:#bbb;">미선택 (비로그인)</span>
          <button @click="dispUiMemberModalOpen=true;dispUiMemberSearch=''"
            style="font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;cursor:pointer;">
            👤 선택
          </button>
          <button v-if="dispUiForm.memberId" @click="dispUiForm.memberId='';dispUiForm.memberNm=''"
            style="font-size:10px;padding:2px 6px;border-radius:6px;border:1px solid #ddd;background:#fff;color:#999;cursor:pointer;">×</button>
        </div>
      </div>

      <!-- 보기옵션 -->
      <div style="padding:8px 0;border-top:1px solid #e8e0f8;margin-top:4px;">
        <div style="font-size:11px;font-weight:700;color:#6a1b9a;margin-bottom:6px;">📑 보기옵션 <span style="font-weight:400;color:#aaa;">— 없으면 내용보기만 탭없이 표시</span></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:4px 10px;border-radius:8px;background:#fff;border:1px solid #e0e0e0;"
            :style="dispUiViewOpts.content?'border-color:#90caf9;background:#e3f2fd;color:#1565c0;':''">
            <input type="checkbox" v-model="dispUiViewOpts.content" /> 내용보기
          </label>
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:4px 10px;border-radius:8px;background:#fff;border:1px solid #e0e0e0;"
            :style="dispUiViewOpts.struct?'border-color:#a5d6a7;background:#e8f5e9;color:#2e7d32;':''">
            <input type="checkbox" v-model="dispUiViewOpts.struct" /> 구조보기
          </label>
          <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;padding:4px 10px;border-radius:8px;background:#fff;border:1px solid #e0e0e0;"
            :style="dispUiViewOpts.source?'border-color:#b39ddb;background:#ede7f6;color:#4a148c;':''">
            <input type="checkbox" v-model="dispUiViewOpts.source" /> 소스보기
          </label>
        </div>
      </div>

      <!-- 실행 버튼 -->
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid #e8e0f8;">
        <button @click="dispUiLayerOpen=false"
          style="font-size:12px;padding:5px 14px;border-radius:8px;border:1px solid #ddd;background:#fff;cursor:pointer;color:#888;">
          닫기
        </button>
        <button @click="openDispUiModal"
          style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;cursor:pointer;font-weight:600;">
          🗔 모달오픈
        </button>
        <button @click="openDispUiPopup('front')"
          style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #bae6fd;background:#e0f2fe;color:#0369a1;cursor:pointer;font-weight:600;">
          🔗 사용자 팝업
        </button>
        <button @click="openDispUiPopup('admin')"
          style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #f5e8de;background:#fef3eb;color:#c2410c;cursor:pointer;font-weight:600;">
          🔗 관리자 팝업
        </button>
        <div style="position:relative;">
          <button @click="openDispUiOther"
            style="font-size:12px;padding:5px 16px;border-radius:8px;border:1px solid #90caf9;background:#e3f2fd;color:#1565c0;cursor:pointer;font-weight:600;">
            🌐 기타오픈 <span style="font-size:10px;margin-left:2px;">▾</span>
          </button>
          <!-- 드롭다운 layer -->
          <div v-if="otherMenuOpen" style="position:fixed;inset:0;z-index:4999;" @click="closeOtherMenu"></div>
          <div v-if="otherMenuOpen" @click.stop
            style="position:absolute;top:calc(100% + 4px);right:0;z-index:5000;background:#fff;border:1px solid #d0d7de;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,0.15);min-width:320px;padding:6px;max-height:400px;overflow-y:auto;">
            <div style="font-size:10px;color:#888;padding:6px 10px;border-bottom:1px solid #f0f0f0;margin-bottom:4px;">오픈할 페이지를 선택하세요</div>
            <button v-for="(u, i) in DISP_UI_OTHER_PAGES" :key="u"
              @click="pickOtherPage(u)"
              style="display:block;width:100%;text-align:left;padding:7px 10px;font-size:11px;border:none;background:transparent;cursor:pointer;border-radius:6px;font-family:monospace;color:#333;"
              @mouseenter="$event.currentTarget.style.background='#e3f2fd'"
              @mouseleave="$event.currentTarget.style.background='transparent'">
              <span style="color:#1565c0;font-weight:700;margin-right:6px;">{{ i+1 }}.</span>{{ u }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- DispUi 모달 -->
  <disp-ui-modal
    :show="dispUiModalOpen"
    :params="dispUiParamObj"
    :disp-dataset="dispDataset" :disp-opt="dispOpt"
    title="DispUi미리보기"
    @close="dispUiModalOpen=false"
    @open-popup="(scope) => { openDispUiPopup(scope || 'front'); dispUiModalOpen=false; }"
  />

  <!-- DispUi 사이트 선택 모달 -->
  <div v-if="dispUiSiteModalOpen"
    @click.self="dispUiSiteModalOpen=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:10000;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:12px;width:520px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 16px 56px rgba(0,0,0,0.36);">
      <!-- 헤더 -->
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:700;color:#1565c0;">🌐 사이트 선택</span>
        <button @click="dispUiSiteModalOpen=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;line-height:1;padding:0;">×</button>
      </div>
      <!-- 검색 -->
      <div style="padding:10px 18px;border-bottom:1px solid #f0f0f0;">
        <input v-model="dispUiSiteSearch" type="text" placeholder="사이트명 또는 도메인 검색..."
          style="width:100%;font-size:12px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:7px;outline:none;" />
      </div>
      <!-- 목록 -->
      <div style="overflow-y:auto;flex:1;padding:6px 0;">
        <div v-if="dispUiSiteList.length===0" style="text-align:center;padding:30px;color:#bbb;font-size:13px;">검색 결과 없음</div>
        <div v-for="site in dispUiSiteList" :key="site.siteId"
          @click="selectDispUiSite(site)"
          style="display:flex;align-items:center;gap:10px;padding:9px 18px;cursor:pointer;border-bottom:1px solid #fafafa;"
          onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background=''">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#1565c0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ site.siteNm }}</div>
            <div style="font-size:11px;color:#888;margin-top:1px;">{{ site.domain || '-' }}</div>
          </div>
          <span v-if="site.siteType" style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:5px;padding:1px 6px;flex-shrink:0;">{{ site.siteType }}</span>
          <span :style="String(site.siteId)===dispUiForm.siteId?'color:#1565c0;font-weight:700;':'color:#ccc;'">✓</span>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:10px 18px;border-top:1px solid #eee;display:flex;justify-content:flex-end;">
        <button @click="dispUiSiteModalOpen=false" class="btn btn-secondary btn-sm">닫기</button>
      </div>
    </div>
  </div>

  <!-- DispUi 회원 선택 모달 -->
  <div v-if="dispUiMemberModalOpen"
    @click.self="dispUiMemberModalOpen=false"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.52);z-index:10000;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:12px;width:520px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 16px 56px rgba(0,0,0,0.36);">
      <!-- 헤더 -->
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:700;color:#1565c0;">👤 회원 선택</span>
        <button @click="dispUiMemberModalOpen=false" style="background:none;border:none;font-size:20px;cursor:pointer;color:#aaa;line-height:1;padding:0;">×</button>
      </div>
      <!-- 검색 -->
      <div style="padding:10px 18px;border-bottom:1px solid #f0f0f0;">
        <input v-model="dispUiMemberSearch" type="text" placeholder="이름 또는 이메일 검색..."
          style="width:100%;font-size:12px;padding:6px 10px;border:1px solid #d0d0d0;border-radius:7px;outline:none;" />
      </div>
      <!-- 목록 -->
      <div style="overflow-y:auto;flex:1;padding:6px 0;">
        <div v-if="dispUiMemberList.length===0" style="text-align:center;padding:30px;color:#bbb;font-size:13px;">검색 결과 없음</div>
        <div v-for="m in dispUiMemberList" :key="m.userId"
          @click="selectDispUiMember(m)"
          style="display:flex;align-items:center;gap:10px;padding:9px 18px;cursor:pointer;border-bottom:1px solid #fafafa;"
          onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background=''">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#1565c0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.memberNm || m.email }}</div>
            <div style="font-size:11px;color:#888;margin-top:1px;">{{ m.email }}</div>
          </div>
          <span v-if="m.grade" style="font-size:10px;background:#f3e5f5;color:#6a1b9a;border-radius:5px;padding:1px 6px;flex-shrink:0;">{{ m.grade }}</span>
          <span :style="String(m.userId)===dispUiForm.memberId?'color:#1565c0;font-weight:700;':'color:#ccc;'">✓</span>
        </div>
      </div>
      <!-- 푸터 -->
      <div style="padding:10px 18px;border-top:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <button v-if="dispUiForm.memberId" @click="dispUiForm.memberId='';dispUiForm.memberNm='';dispUiMemberModalOpen=false;"
          style="font-size:11px;padding:4px 12px;border:1px solid #ddd;border-radius:7px;background:#fff;color:#888;cursor:pointer;">
          비로그인으로 초기화
        </button>
        <span v-else></span>
        <button @click="dispUiMemberModalOpen=false" class="btn btn-secondary btn-sm">닫기</button>
      </div>
    </div>
  </div>

  <!-- ── 탭 헤더 ── -->
  <div style="display:flex;border:1px solid #e0e0e0;border-top:none;background:#f5f5f5;">
    <button @click="switchTab('preview')"
      style="flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;border-right:1px solid #e0e0e0;cursor:pointer;transition:all .15s;"
      :style="mainTab==='preview' ? 'background:#fff;color:#e8587a;border-bottom:3px solid #e8587a;' : 'background:transparent;color:#888;border-bottom:3px solid transparent;'">
      🖼 영역미리보기
    </button>
    <button @click="switchTab('struct')"
      style="flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;border-right:1px solid #e0e0e0;cursor:pointer;transition:all .15s;"
      :style="mainTab==='struct' ? 'background:#fff;color:#e8587a;border-bottom:3px solid #e8587a;' : 'background:transparent;color:#888;border-bottom:3px solid transparent;'">
      🌲 영역-위젯 구조 보기
    </button>
    <button @click="switchTab('source')"
      style="flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all .15s;"
      :style="mainTab==='source' ? 'background:#fff;color:#e8587a;border-bottom:3px solid #e8587a;' : 'background:transparent;color:#888;border-bottom:3px solid transparent;'">
      &lt;/&gt; 영역-위젯 소스보기
    </button>
  </div>

  <!-- ═══════════════════════════════════════
       Tab1: 영역미리보기
  ═══════════════════════════════════════ -->
  <div v-if="mainTab==='preview'">
    <div v-if="!previewDate" style="text-align:center;padding:40px;color:#e8587a;font-size:14px;">기준 날짜를 선택해주세요.</div>
    <div v-else>
      <div v-for="area in areaList" :key="area.codeValue" style="margin-bottom:4px;">
        <disp-x02-area
          :params="filterParams"
          :disp-dataset="dispDataset"
          :disp-opt="dispOpt"
          :area-item="{ code: area.codeValue, label: area.codeLabel, info: areaInfo(area.codeValue), panels: panelsForArea(area.codeValue) }"
        />
      </div>
      <div v-if="areaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:14px;">등록된 화면영역이 없습니다.</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════
       Tab2: 구조 선택 영역미리보기
  ═══════════════════════════════════════ -->
  <div v-else-if="mainTab==='struct'" style="margin-top:4px;">
    <div style="display:flex;gap:12px;align-items:stretch;">

      <!-- 좌: 구조 트리 -->
      <div style="flex:4;min-width:0;">
        <!-- 트리 조작 바 -->
        <div class="card" style="padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:600;color:#555;">패널 선택</span>
          <button @click="checkAllPanels" style="font-size:11px;padding:3px 10px;border:1px solid #1565c0;border-radius:8px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
          <button @click="clearCheckedPanels" style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
          <span style="font-size:11px;color:#aaa;">{{ checkedCount }}개 선택됨</span>
          <span style="width:1px;height:20px;background:#e0e0e0;display:inline-block;"></span>
          <span style="font-size:12px;font-weight:600;color:#555;">위젯 선택</span>
          <button @click="checkAllWidgets" style="font-size:11px;padding:3px 10px;border:1px solid #e65100;border-radius:8px;background:#fff3e0;color:#e65100;cursor:pointer;">전체선택</button>
          <button @click="clearCheckedWidgets" style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
          <span style="font-size:11px;color:#aaa;">{{ checkedWidgetCount }}개 선택됨</span>
        </div>

        <!-- 트리 -->
        <div v-if="structAreaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">등록된 영역이 없습니다.</div>

        <div v-for="area in structAreaList" :key="area.codeValue" class="card" style="padding:0;margin-bottom:8px;overflow:hidden;">
          <!-- 영역 헤더 -->
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;cursor:grab;user-select:none;"
            draggable="true"
            @dragstart="onAreaDragStart($event, area)"
            @dragend="onAreaDragEnd"
            @click="toggleAreaExpand(area.codeValue)">
            <!-- 영역 전체 체크 -->
            <div @click.stop="checkAreaPanels(area)" style="width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;"
              :style="isAreaAllChecked(area) ? 'border-color:#f6ad55;background:#f6ad55;' : 'border-color:rgba(255,255,255,.5);background:transparent;'">
              <span v-if="isAreaAllChecked(area)" style="color:#333;font-size:11px;line-height:1;">✓</span>
            </div>
            <span style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 5px;flex-shrink:0;">DispX02Area</span>
            <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:4px;">{{ area.codeValue }}</code>
            <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
            <!-- 레이아웃 배지 -->
            <span style="font-size:10px;padding:1px 6px;border-radius:8px;background:rgba(255,255,255,.15);color:#e2e8f0;white-space:nowrap;">
              {{ area.layoutType==='dashboard' ? '🧩 대시보드' : ('🔲 grid ' + (area.gridCols||1) + '열') }}
            </span>
            <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ area.panels.length }}개</span>
            <!-- 캔버스 적용 버튼 -->
            <button @click.stop="applyAreaLayout(area)"
              title="이 영역의 레이아웃을 캔버스에 적용"
              style="font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.15);color:#e2e8f0;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;"
              onmouseover="this.style.background='rgba(255,255,255,.3)'" onmouseout="this.style.background='rgba(255,255,255,.15)'">
              ⚡ 적용
            </button>
            <span style="font-size:11px;opacity:.5;">{{ expandedAreas.has(area.codeValue) ? '▲' : '▼' }}</span>
          </div>

          <!-- 패널 목록 -->
          <div v-show="expandedAreas.has(area.codeValue)">
            <div v-if="area.panels.length===0" style="padding:14px 20px;font-size:12px;color:#bbb;">해당 날짜 활성 패널 없음</div>

            <div v-for="(p, pi) in area.panels" :key="p.dispId"
              draggable="true"
              @dragstart="onPanelDragStart($event, p, area.codeLabel)"
              @dragend="onAreaDragEnd"
              @click="togglePanelCheck(p)"
              style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;cursor:grab;user-select:none;border-top:1px solid #f0f0f0;transition:background .1s;"
              :style="checkedPanelIds.has(p.dispId) ? 'background:#fff8e1;' : ''">
              <!-- 체크박스 (full=패널+위젯 모두, partial=패널만) -->
              <div style="margin-top:2px;width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                :style="isPanelAllChecked(p) ? 'border-color:#f59e0b;background:#f59e0b;' : checkedPanelIds.has(p.dispId) ? 'border-color:#f59e0b;background:#fde68a;' : 'border-color:#ccc;background:#fff;'">
                <span v-if="isPanelAllChecked(p)" style="color:#fff;font-size:11px;line-height:1;">✓</span>
                <span v-else-if="checkedPanelIds.has(p.dispId)" style="color:#f59e0b;font-size:11px;font-weight:900;line-height:1;">−</span>
              </div>

              <!-- 패널 정보 -->
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">
                  <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;line-height:16px;">DispX03Panel</span>
                  <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#555;">#{{ String(p.dispId).padStart(4,'0') }}</code>
                  <span style="font-size:13px;font-weight:700;color:#222;">{{ p.name }}</span>
                  <span style="font-size:10px;padding:1px 7px;border-radius:8px;" :style="p.status==='활성'?'background:#e8f5e9;color:#2e7d32;':'background:#f5f5f5;color:#999;'">{{ p.status }}</span>
                  <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">{{ p.condition || '항상 표시' }}</span>
                </div>
                <!-- 위젯 목록 -->
                <div style="display:flex;flex-direction:column;gap:2px;padding-left:2px;">
                  <div v-for="(w, wi) in (p.rows || [])" :key="wi"
                    @click.stop="toggleWidgetCheck(p.dispId, wi, $event)"
                    style="display:flex;align-items:center;gap:5px;padding:2px 5px;border-radius:4px;cursor:pointer;transition:background .1s;"
                    :style="checkedWidgetKeys.has(p.dispId + '_' + wi) ? 'background:#fff3e0;' : 'background:transparent;'">
                    <div style="width:13px;height:13px;border-radius:3px;border:1.5px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                      :style="checkedWidgetKeys.has(p.dispId + '_' + wi) ? 'border-color:#f59e0b;background:#f59e0b;' : 'border-color:#ccc;background:#fff;'">
                      <span v-if="checkedWidgetKeys.has(p.dispId + '_' + wi)" style="color:#fff;font-size:9px;line-height:1;">✓</span>
                    </div>
                    <span style="font-size:9px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 3px;flex-shrink:0;">DispX04Widget</span>
                    <span style="font-size:10px;">{{ wIcon(w.widgetType) }}</span>
                    <span style="font-size:11px;color:#e65100;">{{ wLabel(w.widgetType) }}</span>
                    <span v-if="w.widgetNm" style="font-size:10px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
                  </div>
                  <span v-if="!p.rows || p.rows.length===0" style="font-size:11px;color:#ccc;">(위젯 없음)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 우: 위젯 컨텐츠 그리드 위젯미리보기 -->
      <div style="flex:6;min-width:0;display:flex;flex-direction:column;max-height:80vh;">
        <!-- 캔버스 컨트롤 바 -->
        <div style="display:flex;align-items:center;gap:6px;background:#f8f9fa;border:1px solid #e8e8e8;border-radius:8px 8px 0 0;flex-shrink:0;padding:6px 10px;flex-wrap:wrap;">
          <!-- 표시방식 토글 -->
          <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">
            <button @click="structLayoutType='grid'"
              style="font-size:11px;padding:3px 10px;border:none;cursor:pointer;transition:all .15s;"
              :style="structLayoutType==='grid' ? 'background:#1d4ed8;color:#fff;font-weight:600;' : 'background:#fff;color:#6b7280;'">
              🔲 그리드
            </button>
            <button @click="structLayoutType='dashboard'"
              style="font-size:11px;padding:3px 10px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
              :style="structLayoutType==='dashboard' ? 'background:#1d4ed8;color:#fff;font-weight:600;' : 'background:#fff;color:#6b7280;'">
              🧩 대시보드
            </button>
          </div>
          <!-- 열수 (grid 전용) -->
          <template v-if="structLayoutType==='grid'">
            <div style="width:1px;height:20px;background:#e5e7eb;"></div>
            <span style="font-size:11px;color:#6b7280;font-weight:600;">열수</span>
            <div style="display:flex;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;">
              <button v-for="n in [1,2,3,4]" :key="n" @click="structColCount=n; resetStructGrid()"
                style="font-size:11px;padding:3px 9px;border:none;border-left:1px solid #d1d5db;cursor:pointer;transition:all .15s;"
                :style="[n===1?'border-left:none;':'', structColCount===n ? 'background:#1d4ed8;color:#fff;font-weight:700;' : 'background:#fff;color:#6b7280;']">
                {{ n }}
              </button>
            </div>
            <input type="number" v-model.number="structColCount" min="1" max="32"
              @change="resetStructGrid()"
              style="width:52px;font-size:12px;padding:3px 6px;border:1px solid #d1d5db;border-radius:6px;text-align:center;" />
            <div style="width:1px;height:20px;background:#e5e7eb;"></div>
            <!-- 실제컨텐츠 -->
            <button @click="structShowReal=!structShowReal"
              style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
              :style="structShowReal ? 'background:#059669;color:#fff;border-color:#059669;' : 'background:#fff;color:#6b7280;'">
              {{ structShowReal ? '✅ 실제컨텐츠' : '👁 실제컨텐츠' }}
            </button>
            <div style="width:1px;height:20px;background:#e5e7eb;"></div>
            <!-- 뷰포트 -->
            <button v-for="(vp, key) in STRUCT_VIEWPORT" :key="key" @click="structViewport=key"
              style="font-size:11px;padding:3px 7px;border-radius:5px;border:1px solid #d1d5db;cursor:pointer;white-space:nowrap;transition:all .15s;"
              :style="structViewport===key ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;' : 'background:#fff;color:#6b7280;'">
              {{ vp.label }}
            </button>
          </template>
          <!-- 우측: 개수 + 초기화 -->
          <div style="margin-left:auto;display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:#555;font-weight:600;">{{ structLayoutType==='dashboard' ? structDashItems.length : structPlacedCount }}개</span>
            <button @click="structLayoutType==='dashboard' ? structDashItems.splice(0) : resetStructGrid()"
              style="font-size:11px;padding:3px 8px;border:1px solid #d0d0d0;border-radius:5px;background:#fff;cursor:pointer;color:#666;">초기화</button>
          </div>
        </div>
        <!-- 그리드 캔버스 -->
        <div @click="closeStructSpanPopup" style="flex:1;overflow-y:auto;padding:12px;background:#f0f2f5;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">

          <!-- ── dashboard 캔버스 ── -->
          <template v-if="structLayoutType==='dashboard'">
            <div
              @dragover="onStructDashDragOver"
              @dragleave="onStructDashDragLeave"
              @drop="onStructDashDrop"
              style="position:relative;min-height:500px;min-width:400px;background:#fff;border-radius:8px;border:2px dashed #e5e7eb;transition:border-color .15s;"
              :style="structDashDragOver ? 'border-color:#1d4ed8;background:#eff6ff;' : ''">
              <div v-if="!structDashItems.length && !structDashDragOver"
                style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#d1d5db;pointer-events:none;">
                <span style="font-size:40px;">🧩</span>
                <span style="font-size:13px;">좌측에서 영역·패널을 드래그하여 배치하세요</span>
              </div>
              <div v-if="structDashDragOver && !structDashItems.length"
                style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#1d4ed8;font-size:14px;font-weight:700;pointer-events:none;">▼ 여기에 배치</div>
              <!-- 배치된 아이템 -->
              <div v-for="item in structDashItems" :key="item.id"
                :style="{ position:'absolute', left:item.x+'px', top:item.y+'px', width:item.w+'px', minHeight:item.h+'px',
                  border:'1px solid #e5e7eb', borderRadius:'8px', background:'#fff',
                  boxShadow:'0 2px 10px rgba(0,0,0,.1)', userSelect:'none', zIndex:1 }">
                <div @mousedown="startStructDashMove($event, item)"
                  style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:#f8f9fa;border-bottom:1px solid #f0f0f0;border-radius:8px 8px 0 0;cursor:move;">
                  <span style="font-size:11px;">{{ wIcon(item.slot.widgetType) }}</span>
                  <span style="font-size:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 4px;white-space:nowrap;">{{ wLabel(item.slot.widgetType) }}</span>
                  <span style="font-size:10px;font-weight:600;color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ item.slot.widgetNm }}</span>
                  <button @click="removeStructDashItem(item.id)"
                    style="flex-shrink:0;width:15px;height:15px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
                </div>
                <div style="padding:8px;font-size:11px;color:#888;">{{ item.slot._panelNm }}</div>
                <!-- 리사이즈 핸들 -->
                <div @mousedown="startStructDashResize($event, item)"
                  style="position:absolute;bottom:0;right:0;width:14px;height:14px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#d1d5db 50%);border-radius:0 0 8px 0;"></div>
              </div>
            </div>
          </template>

          <!-- ── grid 캔버스 ── -->
          <template v-else>
          <!-- 뷰포트 래퍼 -->
          <div :style="{ width: STRUCT_VIEWPORT[structViewport].width || '100%', maxWidth: STRUCT_VIEWPORT[structViewport].width || '100%', margin:'0 auto', transition:'width .3s' }">
          <div v-if="STRUCT_VIEWPORT[structViewport].width"
            style="text-align:center;margin-bottom:6px;font-size:11px;color:#9ca3af;font-weight:600;">
            {{ structViewport==='mobile' ? '📱 375px' : '📟 768px' }}
          </div>
          <div :style="{ border: STRUCT_VIEWPORT[structViewport].width ? '2px solid #d1d5db' : 'none', borderRadius: STRUCT_VIEWPORT[structViewport].width ? '12px' : '0', padding: STRUCT_VIEWPORT[structViewport].width ? '10px' : '0', background:'#fff', boxShadow: STRUCT_VIEWPORT[structViewport].width ? '0 4px 20px rgba(0,0,0,.12)' : 'none' }">
          <div :style="{ display:'grid', gridTemplateColumns:structGridCols, gap:'10px' }">
            <template v-for="(slot, idx) in structCurrentSlots" :key="idx">
            <div v-if="!structShowReal || slot"
              @dragover="onStructDragOver($event, idx)"
              @dragleave="onStructDragLeave"
              @drop="onStructDrop($event, idx)"
              style="border-radius:8px;transition:all .15s;position:relative;"
              :style="[
                structDragOverIdx===idx
                  ? 'border:2px dashed #1d4ed8;background:#eff6ff;min-height:100px;'
                  : slot
                    ? (structShowReal ? 'border:none;background:transparent;min-height:0;' : 'border:1px solid #e5e7eb;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.07);min-height:100px;')
                    : 'border:2px dashed #d1d5db;background:#f9fafb;min-height:60px;',
                slot && (slot.colSpan||1)>1 ? { gridColumn:'span '+slot.colSpan } : {},
                slot && (slot.rowSpan||1)>1 ? { gridRow:'span '+slot.rowSpan } : {},
              ]">
              <!-- 빈 슬롯 -->
              <div v-if="!slot && structDragOverIdx!==idx"
                style="min-height:60px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#d1d5db;padding:10px;">
                <span style="font-size:18px;">+</span>
                <span style="font-size:11px;">드래그하여 추가</span>
              </div>
              <div v-else-if="!slot && structDragOverIdx===idx"
                style="min-height:60px;display:flex;align-items:center;justify-content:center;color:#1d4ed8;font-size:12px;font-weight:700;">▼ 여기에 추가</div>
              <!-- 배치된 위젯 -->
              <template v-else-if="slot">
                <!-- 실제컨텐츠 ON: ×만 -->
                <div v-if="structShowReal" style="position:relative;">
                  <button @click="removeStructSlot(idx)"
                    style="position:absolute;top:4px;right:4px;z-index:5;width:18px;height:18px;border-radius:50%;border:none;background:rgba(0,0,0,.3);color:#fff;cursor:pointer;font-size:11px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
                </div>
                <!-- 헤더 (실제컨텐츠 OFF) -->
                <div v-else style="display:flex;align-items:center;gap:4px;padding:5px 8px 4px;border-bottom:1px solid #f0f0f0;background:#fafafa;border-radius:8px 8px 0 0;">
                  <span style="font-size:11px;">{{ wIcon(slot.widgetType) }}</span>
                  <span style="font-size:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 4px;white-space:nowrap;">{{ wLabel(slot.widgetType) }}</span>
                  <span style="font-size:10px;font-weight:600;color:#333;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ slot.widgetNm }}</span>
                  <!-- ⚙ 설정 아이콘 -->
                  <button @click="toggleStructSpanPopup($event, idx)"
                    :title="'열 ' + (slot.colSpan||1) + ' × 행 ' + (slot.rowSpan||1)"
                    style="flex-shrink:0;width:20px;height:20px;border-radius:4px;border:1px solid #e5e7eb;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s;"
                    :style="structSpanPopupIdx===idx ? 'background:#1d4ed8;color:#fff;border-color:#1d4ed8;' : 'background:#f9fafb;color:#6b7280;'">⚙</button>
                  <button @click="removeStructSlot(idx)"
                    style="flex-shrink:0;width:16px;height:16px;border-radius:50%;border:none;background:#e5e7eb;color:#6b7280;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
                </div>
                <!-- span 팝업 -->
                <div v-if="!structShowReal && structSpanPopupIdx===idx" @click.stop
                  style="position:absolute;top:34px;right:6px;z-index:20;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:12px 14px;min-width:170px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <span style="font-size:11px;font-weight:700;color:#374151;">그리드 스팬 설정</span>
                    <button @click="closeStructSpanPopup" style="border:none;background:none;cursor:pointer;font-size:13px;color:#9ca3af;padding:0;line-height:1;">✕</button>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                    <span style="font-size:11px;color:#6b7280;width:36px;">열 span</span>
                    <button @click="setStructSpan(idx,'col',-1)" :disabled="(slot.colSpan||1)<=1"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(slot.colSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                    <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;">{{ slot.colSpan||1 }}</span>
                    <button @click="setStructSpan(idx,'col',+1)" :disabled="(slot.colSpan||1)>=(STRUCT_GRID_COLS[structGrid]||1)"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(slot.colSpan||1)>=(STRUCT_GRID_COLS[structGrid]||1)?'opacity:.3;cursor:default;':''">+</button>
                    <span style="font-size:10px;color:#9ca3af;">/ {{ STRUCT_GRID_COLS[structGrid]||1 }}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;color:#6b7280;width:36px;">행 span</span>
                    <button @click="setStructSpan(idx,'row',-1)" :disabled="(slot.rowSpan||1)<=1"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(slot.rowSpan||1)<=1?'opacity:.3;cursor:default;':''">−</button>
                    <span style="min-width:28px;text-align:center;font-size:14px;font-weight:700;color:#1d4ed8;">{{ slot.rowSpan||1 }}</span>
                    <button @click="setStructSpan(idx,'row',+1)" :disabled="(slot.rowSpan||1)>=4"
                      style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;"
                      :style="(slot.rowSpan||1)>=4?'opacity:.3;cursor:default;':''">+</button>
                    <span style="font-size:10px;color:#9ca3af;">/ 4</span>
                  </div>
                </div>
                <!-- 위젯미리보기 (기존 렌더링 재사용) -->
                <div :style="structShowReal ? 'padding:0;' : 'padding:10px;'">
                  <div v-if="slot.widgetType==='image_banner'"
                    style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;padding:20px;text-align:center;color:#fff;">
                    <div style="font-size:26px;">🖼</div>
                    <div style="font-size:13px;font-weight:700;margin-top:4px;">{{ slot.widgetNm }}</div>
                    <div v-if="slot.clickTarget" style="font-size:10px;opacity:.8;margin-top:3px;">→ {{ slot.clickTarget }}</div>
                  </div>
                  <div v-else-if="slot.widgetType==='product_slider'||slot.widgetType==='product'">
                    <div style="display:flex;gap:5px;overflow:hidden;">
                      <div v-for="n in 4" :key="n" style="flex:0 0 60px;border:1px solid #eee;border-radius:6px;overflow:hidden;">
                        <div style="height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>
                        <div style="padding:4px;font-size:9px;color:#888;text-align:center;">상품{{ n }}</div>
                      </div>
                    </div>
                  </div>
                  <div v-else-if="slot.widgetType==='chart_bar'">
                    <div style="display:flex;align-items:flex-end;gap:4px;height:70px;">
                      <div v-for="(h,ci) in [55,78,42,88,65,92,70]" :key="ci" style="flex:1;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#667eea,#764ba2);" :style="'height:'+h+'%;'"></div>
                    </div>
                  </div>
                  <div v-else-if="slot.widgetType==='chart_line'">
                    <svg viewBox="0 0 200 70" style="width:100%;height:60px;"><polyline points="0,55 28,40 56,50 84,18 112,30 140,10 168,22 200,15" fill="none" stroke="#667eea" stroke-width="2" stroke-linejoin="round"/></svg>
                  </div>
                  <div v-else-if="slot.widgetType==='text_banner'"
                    style="background:#f8f9fa;border-left:4px solid #667eea;border-radius:0 6px 6px 0;padding:10px 12px;">
                    <div style="font-size:12px;font-weight:700;color:#222;">{{ slot.widgetNm }}</div>
                  </div>
                  <div v-else-if="slot.widgetType==='coupon'"
                    style="border:2px dashed #e8587a;border-radius:8px;padding:10px;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
                    <span style="font-size:26px;">🎟</span>
                    <div style="font-size:12px;font-weight:700;color:#c2185b;">{{ slot.widgetNm }}</div>
                  </div>
                  <div v-else-if="slot.widgetType==='event_banner'"
                    style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:8px;padding:14px;text-align:center;color:#fff;">
                    <div style="font-size:22px;">🎉</div>
                    <div style="font-size:12px;font-weight:700;margin-top:4px;">{{ slot.widgetNm }}</div>
                  </div>
                  <div v-else-if="slot.widgetType==='cache_banner'"
                    style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:8px;padding:12px;display:flex;align-items:center;gap:10px;color:#fff;">
                    <span style="font-size:26px;">💰</span>
                    <div style="font-size:14px;font-weight:800;">+0,000P</div>
                  </div>
                  <div v-else-if="slot.widgetType==='popup'"
                    style="border:1px solid #e0e0e0;border-radius:6px;overflow:hidden;">
                    <div style="background:#f5f5f5;padding:5px 10px;font-size:10px;display:flex;justify-content:space-between;"><span>팝업</span><span>×</span></div>
                    <div style="padding:12px;text-align:center;color:#bbb;font-size:11px;">{{ slot.widgetNm }}</div>
                  </div>
                  <div v-else-if="slot.widgetType==='html_editor'"
                    style="background:#1e1e2e;border-radius:6px;padding:10px;font-size:10px;color:#a9b7c6;font-family:monospace;">
                    &lt;!-- {{ slot.widgetNm }} --&gt;
                  </div>
                  <div v-else
                    style="background:#f5f5f5;border-radius:6px;padding:14px;text-align:center;color:#aaa;">
                    <div style="font-size:22px;">{{ wIcon(slot.widgetType) }}</div>
                    <div style="font-size:11px;margin-top:4px;">{{ slot.widgetNm }}</div>
                  </div>
                  <div v-if="slot._panelNm" style="font-size:9px;color:#aaa;margin-top:6px;">📋 {{ slot._panelNm }}</div>
                </div>
              </template>
            </div>
            </template>
          </div><!-- /grid -->
          <div v-if="structCurrentSlots.every(s=>!s)" style="text-align:center;padding:40px;color:#bbb;font-size:13px;">
            좌측 영역 또는 패널을 드래그하여 배치하세요
          </div>
          </div><!-- /device frame -->
          </div><!-- /viewport wrapper -->
          </template><!-- /grid1~4 -->

        </div><!-- /캔버스 -->
      </div>


    </div>
  </div>

  <!-- ═══════════════════════════════════════
       Tab3: 소스 구조
  ═══════════════════════════════════════ -->
  <div v-else-if="mainTab==='source'" style="margin-top:4px;">
    <div class="card" style="padding:0;overflow:hidden;">

      <!-- 소스 헤더 -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#1e1e2e;border-bottom:1px solid #3a3a5c;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:13px;font-weight:700;color:#63b3ed;">&lt;/&gt; 소스 구조</span>
          <span style="font-size:11px;color:#718096;">DispX01Ui → DispX02Area → DispX03Panel → DispX04Widget</span>
        </div>
        <button @click="copySource"
          style="font-size:11px;padding:4px 12px;border-radius:8px;cursor:pointer;transition:all .15s;"
          :style="sourceCopied ? 'background:#276749;color:#9ae6b4;border:1px solid #276749;' : 'background:#2d2d4e;color:#a0aec0;border:1px solid #3a3a5c;'">
          {{ sourceCopied ? '✓ 복사됨' : '📋 전체 복사' }}
        </button>
      </div>

      <!-- 소스 본문 -->
      <div style="background:#1e1e2e;padding:16px 20px;overflow-x:auto;min-height:400px;max-height:70vh;overflow-y:auto;">
        <div v-if="sourceLines.length===0" style="color:#718096;font-size:13px;text-align:center;padding:40px;">영역 또는 패널 데이터가 없습니다.</div>
        <div v-else style="font-family:monospace;font-size:12px;line-height:1.9;">
          <div v-for="(line, i) in sourceLines" :key="i"
            :style="line.type==='blank'
              ? 'height:0.4em;'
              : 'white-space:nowrap;overflow-x:visible;padding-left:' + (line.level||0)*20 + 'px;'">

            <!-- 소스 최상단 헤더 주석 -->
            <template v-if="line.type==='source-header'">
              <span style="color:#718096;font-style:italic;">
                <span style="color:#4a7a5a;">&lt;!--</span>
                <template v-if="line.htype==='entities'">
                  <span style="color:#7ec8a0;font-weight:600;"> 전시개체</span>
                  <span style="color:#718096;"> : 전시영역s: </span><span style="color:#fbd38d;">{{ line.data.area || '-' }}</span>
                  <span style="color:#718096;">,  전시패널s: </span><span style="color:#fbd38d;">{{ line.data.panel || '-' }}</span>
                  <span style="color:#718096;">,  전시위젯s: </span><span style="color:#fbd38d;">{{ line.data.widget || '-' }}</span>
                  <span style="color:#718096;">,  위젯Libs: </span><span style="color:#fbd38d;">{{ line.data.lib || '-' }}</span>
                </template>
                <template v-else-if="line.htype==='disp'">
                  <span style="color:#90cdf4;font-weight:600;"> disp조건</span>
                  <span style="color:#718096;"> : 전시일시 : </span><span style="color:#b5e4c7;">{{ line.data.datetime }}</span>
                  <span style="color:#4a5568;"> | </span><span style="color:#718096;">상태 : </span><span style="color:#b5e4c7;">{{ line.data.status }}</span>
                  <span style="color:#4a5568;"> | </span><span style="color:#718096;">노출조건 : </span><span style="color:#b5e4c7;">{{ line.data.condition }}</span>
                  <span style="color:#4a5568;"> | </span><span style="color:#718096;">인증필요 : </span><span style="color:#b5e4c7;">{{ line.data.authRequired }}</span>
                  <span style="color:#4a5568;"> | </span><span style="color:#718096;">등급제한 : </span><span style="color:#b5e4c7;">{{ line.data.authGrade }}</span>
                </template>
                <template v-else-if="line.htype==='cond'">
                  <span style="color:#f6ad55;font-weight:600;"> cond조건</span>
                  <span style="color:#718096;"> : 조회기간 : </span><span style="color:#b5e4c7;">{{ line.data.period }}</span>
                  <span style="color:#718096;">,  카테고리 : </span><span style="color:#b5e4c7;">{{ line.data.category }}</span>
                  <span style="color:#718096;">,  주문 : </span><span style="color:#b5e4c7;">{{ line.data.order }}</span>
                </template>
                <span style="color:#4a7a5a;"> --&gt;</span>
              </span>
            </template>

            <!-- DispArea 메타 주석 -->
            <template v-else-if="line.type==='area-meta'">
              <span style="color:#4a7a5a;font-style:italic;">&lt;!--</span>
              <span style="color:#4a7a5a;font-style:italic;">
                표시형식:<span style="color:#7ec8a0;">{{ line.meta.layout }}</span>,
                정렬:<span style="color:#7ec8a0;">{{ line.meta.sortOrd }}</span>,
                area=<span style="color:#7ec8a0;">"{{ line.meta.area }}"</span>
              </span>
              <span style="color:#4a7a5a;font-style:italic;">--&gt;</span>
            </template>

            <!-- <DispX01Ui> / </DispX01Ui> -->
            <template v-else-if="line.type==='ui-open'">
              <span style="color:#b794f4;font-weight:700;">&lt;DispX01Ui&gt;</span>
            </template>
            <template v-else-if="line.type==='ui-close'">
              <span style="color:#b794f4;font-weight:700;">&lt;/DispX01Ui&gt;</span>
            </template>

            <!-- <DispX02Area attr="val" ...> -->
            <template v-else-if="line.type==='area-open'">
              <span style="color:#63b3ed;font-weight:700;">&lt;DispX02Area</span>
              <template v-for="a in line.attrs" :key="a.key">
                <span style="color:#9cdcfe;"> {{ a.key }}</span><span style="color:#cdd9e5;">="</span><span :style="a.real?'color:#ce9178;':'color:#6a737d;font-style:italic;'">{{ a.val }}</span><span style="color:#cdd9e5;">"</span>
              </template>
              <span style="color:#63b3ed;font-weight:700;">&gt;</span>
            </template>

            <!-- 패널 메타 주석 -->
            <template v-else-if="line.type==='panel-meta'">
              <span style="color:#5a9e6f;font-style:italic;">&lt;!--</span>
              <span style="color:#5a9e6f;font-style:italic;">
                표시형식:<span style="color:#b5e4c7;">{{ line.meta.layout }}</span>,
                정렬:<span style="color:#b5e4c7;">{{ line.meta.sortOrder }}</span>,
                기간: <span style="color:#b5e4c7;">{{ line.meta.period }}</span>
                &nbsp;|&nbsp; 상태: <span style="color:#b5e4c7;">{{ line.meta.status }}</span>
                &nbsp;|&nbsp; 노출조건: <span style="color:#b5e4c7;">{{ line.meta.condition }}</span>
                &nbsp;|&nbsp; 인증필요: <span style="color:#b5e4c7;">{{ line.meta.authRequired }}</span>
                &nbsp;|&nbsp; 등급제한: <span style="color:#b5e4c7;">{{ line.meta.authGrade }}</span>
              </span>
              <span style="color:#5a9e6f;font-style:italic;">--&gt;</span>
            </template>

            <!-- <DispX03Panel attr="val" ...> -->
            <template v-else-if="line.type==='panel-open'">
              <span style="color:#68d391;font-weight:700;">&lt;DispX03Panel</span>
              <template v-for="a in line.attrs" :key="a.key">
                <span style="color:#9cdcfe;"> {{ a.key }}</span><span style="color:#cdd9e5;">="</span><span :style="a.real?'color:#ce9178;':'color:#6a737d;font-style:italic;'">{{ a.val }}</span><span style="color:#cdd9e5;">"</span>
              </template>
              <span style="color:#68d391;font-weight:700;">&gt;</span>
            </template>

            <!-- <DispX04Widget attr="val" .../> -->
            <template v-else-if="line.type==='widget'">
              <span style="color:#f6ad55;font-weight:700;">&lt;DispX04Widget</span>
              <template v-for="a in line.attrs" :key="a.key">
                <span style="color:#9cdcfe;"> {{ a.key }}</span><span style="color:#cdd9e5;">="</span><span :style="a.real?'color:#ce9178;':'color:#6a737d;font-style:italic;'">{{ a.val }}</span><span style="color:#cdd9e5;">"</span>
              </template>
              <span style="color:#f6ad55;font-weight:700;"> /&gt;</span>
            </template>

            <!-- </DispX03Panel> -->
            <span v-else-if="line.type==='panel-close'"
              style="color:#68d391;font-weight:700;">&lt;/DispX03Panel&gt;</span>

            <!-- </DispX02Area> -->
            <span v-else-if="line.type==='area-close'"
              style="color:#63b3ed;font-weight:700;">&lt;/DispX02Area&gt;</span>

            <!-- 주석 -->
            <span v-else-if="line.type==='comment'" style="color:#6a737d;">{{ line.text }}</span>

          </div>
        </div>
      </div>

      <!-- 소스 푸터: 범례 -->
      <div style="background:#161622;padding:10px 20px;border-top:1px solid #3a3a5c;display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:#b794f4;">■ DispX01Ui</span>
        <span style="font-size:11px;color:#63b3ed;">■ DispX02Area</span>
        <span style="font-size:11px;color:#68d391;">■ DispX03Panel</span>
        <span style="font-size:11px;color:#f6ad55;">■ DispX04Widget</span>
        <span style="font-size:11px;color:#9cdcfe;">■ 속성명</span>
        <span style="font-size:11px;color:#ce9178;">■ 실제값</span>
        <span style="font-size:11px;color:#6a737d;font-style:italic;">■ 플레이스홀더(~)</span>
        <span style="font-size:11px;color:#aaa;margin-left:auto;">📅 {{ previewDate }} 기준 활성 패널</span>
      </div>
    </div>
  </div>

</div>
`
};
