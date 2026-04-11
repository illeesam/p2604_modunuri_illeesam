/* ShopJoy Admin - 전시영역미리보기 (3탭: 미리보기 · 구조선택 · 소스) */
window.DispAreaPreview = {
  name: 'DispAreaPreview',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
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
    const searchStatus       = ref('활성');
    const searchCondition    = ref('');
    const searchAuthRequired = ref('');
    const searchAuthGrade    = ref('');
    const CONDITION_OPTS   = ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'];
    const AUTH_GRADE_OPTS  = ['일반', '우수', 'VIP'];

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
      (props.adminData.codes || [])
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
      if (searchCondition.value && (p.condition || '항상 표시') !== searchCondition.value) return false;
      if (searchAuthRequired.value === 'Y' && !p.authRequired) return false;
      if (searchAuthRequired.value === 'N' && p.authRequired) return false;
      if (searchAuthGrade.value && p.authGrade !== searchAuthGrade.value) return false;
      return true;
    };

    /* ── Tab1: 영역별 필터 패널 ── */
    const panelsForArea = (areaCode) =>
      (props.adminData.displays || [])
        .filter(p => p.area === areaCode && panelFilter(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const totalPanels = computed(() =>
      (props.adminData.displays || []).filter(p => panelFilter(p)).length
    );
    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

    /* ─────────────────────────────────────────
       Tab2: 구조선택 + 선택 미리보기
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
        const panels = (props.adminData.displays || [])
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

    const sourceLines = computed(() => {
      const lines = [];
      const areas = allAreaListRaw.value.filter(a =>
        selectedAreas.size === 0 || selectedAreas.has(a.codeValue)
      );
      areas.forEach((area, ai) => {
        const panels = (props.adminData.displays || [])
          .filter(p => p.area === area.codeValue && panelFilter(p))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        if (ai > 0) lines.push({ type: 'blank', text: '' });
        lines.push({ type: 'area-open', text: `<DispArea area="${area.codeValue}" areaLabel="${area.codeLabel}">` });
        if (panels.length === 0) {
          lines.push({ type: 'comment', text: `  <!-- 해당 날짜 활성 패널 없음 -->` });
        } else {
          panels.forEach(p => {
            const types = panelWidgetTypes(p);
            lines.push({ type: 'blank', text: '' });
            lines.push({ type: 'comment', text: `  <!-- #${String(p.dispId).padStart(4,'0')} ${p.name} | ${p.status} | ${p.condition || '항상 표시'} -->` });
            if (types.length === 0) {
              lines.push({ type: 'widget', text: `  <!-- (위젯 없음) -->` });
            } else {
              types.forEach(wt => {
                lines.push({ type: 'widget', text: `  <DispWidget widgetType="${wt}" />`, wt });
              });
            }
          });
          lines.push({ type: 'blank', text: '' });
        }
        lines.push({ type: 'area-close', text: `</DispArea>` });
      });
      return lines;
    });

    const sourceText = computed(() => sourceLines.value.map(l => l.text).join('\n'));

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

    return {
      today, siteNm,
      mainTab, switchTab,
      previewDate, viewMode, showDesc, showAreaDrop,
      selectedAreas, allAreaListRaw, areaList,
      previewTime,
      searchStatus, searchCondition, searchAuthRequired, searchAuthGrade,
      CONDITION_OPTS, AUTH_GRADE_OPTS,
      toggleArea, selectAllAreas, clearAllAreas, areaBtnLabel,
      panelsForArea, totalPanels, resetDate, isDateInRange,
      /* Tab2 */
      structAreaList, expandedAreas, toggleAreaExpand,
      checkedPanelIds, togglePanelCheck, checkAllPanels, clearCheckedPanels,
      checkAreaPanels, isAreaAllChecked,
      checkedCount,
      panelWidgetTypes, isPanelAllChecked,
      checkedWidgetKeys, toggleWidgetCheck, checkAllWidgets, clearCheckedWidgets, checkedWidgetCount, checkedWidgetList,
      /* Tab3 */
      sourceLines, sourceText, sourceCopied, copySource,
      wLabel, wIcon,
    };
  },
  template: /* html */`
<div>
  <!-- ── 페이지 제목 ── -->
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      전시영역미리보기
      <span style="font-size:13px;font-weight:400;color:#888;">화면영역별 전시패널 분석 및 미리보기</span>
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

      <!-- 노출조건 -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">노출조건</span>
        <select v-model="searchCondition" class="form-control" style="width:120px;margin:0;font-size:12px;">
          <option value="">전체</option>
          <option v-for="c in CONDITION_OPTS" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <!-- 인증필요 -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">인증필요</span>
        <select v-model="searchAuthRequired" class="form-control" style="width:80px;margin:0;font-size:12px;">
          <option value="">전체</option>
          <option value="Y">필요</option>
          <option value="N">불필요</option>
        </select>
      </div>

      <!-- 등급제한 -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">등급제한</span>
        <select v-model="searchAuthGrade" class="form-control" style="width:90px;margin:0;font-size:12px;">
          <option value="">전체</option>
          <option v-for="g in AUTH_GRADE_OPTS" :key="g" :value="g">{{ g }}↑</option>
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
      <span v-if="searchCondition" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:10px;padding:2px 10px;">{{ searchCondition }}</span>
      <span v-if="searchAuthRequired==='Y'" style="font-size:12px;background:#fff3e0;color:#e65100;border-radius:10px;padding:2px 10px;">인증 필요</span>
      <span v-if="searchAuthRequired==='N'" style="font-size:12px;background:#fce4ec;color:#c62828;border-radius:10px;padding:2px 10px;">인증 불필요</span>
      <span v-if="searchAuthGrade" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:10px;padding:2px 10px;">등급: {{ searchAuthGrade }}↑</span>
      <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:10px;padding:2px 10px;margin-left:auto;">패널 {{ totalPanels }}개 해당</span>
    </div>
  </div>

  <!-- ── 탭 헤더 ── -->
  <div style="display:flex;border:1px solid #e0e0e0;border-top:none;background:#f5f5f5;">
    <button @click="switchTab('preview')"
      style="flex:1;padding:10px 0;font-size:13px;font-weight:600;border:none;border-right:1px solid #e0e0e0;cursor:pointer;transition:all .15s;"
      :style="mainTab==='preview' ? 'background:#fff;color:#e8587a;border-bottom:3px solid #e8587a;' : 'background:transparent;color:#888;border-bottom:3px solid transparent;'">
      🖼 미리보기
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
       Tab1: 미리보기
  ═══════════════════════════════════════ -->
  <div v-if="mainTab==='preview'">
    <div v-if="!previewDate" style="text-align:center;padding:40px;color:#e8587a;font-size:14px;">기준 날짜를 선택해주세요.</div>
    <div v-else>
      <div v-for="area in areaList" :key="area.codeValue" style="margin-bottom:4px;">
        <disp-area
          :area="area.codeValue"
          :area-label="area.codeLabel"
          :panels="panelsForArea(area.codeValue)"
          :mode="viewMode"
          :show-desc="showDesc"
        />
      </div>
      <div v-if="areaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:14px;">등록된 화면영역이 없습니다.</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════
       Tab2: 구조 선택 미리보기
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
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;cursor:pointer;"
            @click="toggleAreaExpand(area.codeValue)">
            <!-- 영역 전체 체크 -->
            <div @click.stop="checkAreaPanels(area)" style="width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;"
              :style="isAreaAllChecked(area) ? 'border-color:#f6ad55;background:#f6ad55;' : 'border-color:rgba(255,255,255,.5);background:transparent;'">
              <span v-if="isAreaAllChecked(area)" style="color:#333;font-size:11px;line-height:1;">✓</span>
            </div>
            <span style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 5px;flex-shrink:0;">DispArea</span>
            <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:4px;">{{ area.codeValue }}</code>
            <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
            <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ area.panels.length }}개</span>
            <span style="font-size:11px;opacity:.5;">{{ expandedAreas.has(area.codeValue) ? '▲' : '▼' }}</span>
          </div>

          <!-- 패널 목록 -->
          <div v-show="expandedAreas.has(area.codeValue)">
            <div v-if="area.panels.length===0" style="padding:14px 20px;font-size:12px;color:#bbb;">해당 날짜 활성 패널 없음</div>

            <div v-for="(p, pi) in area.panels" :key="p.dispId"
              @click="togglePanelCheck(p)"
              style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;cursor:pointer;border-top:1px solid #f0f0f0;transition:background .1s;"
              :style="checkedPanelIds.has(p.dispId) ? 'background:#fff8e1;' : ''"
              @mouseenter="$event.currentTarget.style.background=checkedPanelIds.has(p.dispId)?'#fff3cd':'#f9f9f9'"
              @mouseleave="$event.currentTarget.style.background=checkedPanelIds.has(p.dispId)?'#fff8e1':''"
              :style="checkedPanelIds.has(p.dispId) ? 'background:#fff8e1;' : ''"

              <!-- 체크박스 (full=패널+위젯 모두, partial=패널만) -->
              <div style="margin-top:2px;width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                :style="isPanelAllChecked(p) ? 'border-color:#f59e0b;background:#f59e0b;' : checkedPanelIds.has(p.dispId) ? 'border-color:#f59e0b;background:#fde68a;' : 'border-color:#ccc;background:#fff;'">
                <span v-if="isPanelAllChecked(p)" style="color:#fff;font-size:11px;line-height:1;">✓</span>
                <span v-else-if="checkedPanelIds.has(p.dispId)" style="color:#f59e0b;font-size:11px;font-weight:900;line-height:1;">−</span>
              </div>

              <!-- 패널 정보 -->
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">
                  <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;line-height:16px;">DispPanel</span>
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
                    <span style="font-size:9px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 3px;flex-shrink:0;">DispWidget</span>
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

      <!-- 우: 위젯 컨텐츠 미리보기 -->
      <div style="flex:6;min-width:0;max-height:80vh;overflow-y:auto;">
        <div class="card" style="padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;">
          <span style="font-size:13px;font-weight:700;color:#333;">🧩 위젯 컨텐츠 미리보기</span>
          <span style="font-size:11px;color:#aaa;">{{ checkedWidgetCount }}개 선택됨</span>
        </div>

        <div v-if="checkedWidgetCount===0"
          style="border:2px dashed #e0e0e0;border-radius:8px;padding:50px;text-align:center;color:#bbb;font-size:13px;">
          좌측 트리에서 위젯을 선택하면<br>컨텐츠 미리보기가 표시됩니다.
        </div>

        <div v-else>
          <div v-for="(w, i) in checkedWidgetList" :key="i" class="card" style="padding:12px 14px;margin-bottom:8px;overflow:hidden;">
            <!-- 위젯 헤더 -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5f5f5;flex-wrap:wrap;">
              <span style="font-size:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:1px 5px;white-space:nowrap;">{{ wIcon(w.widgetType) }} {{ wLabel(w.widgetType) }}</span>
              <span style="font-size:12px;font-weight:700;color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
              <span style="font-size:10px;padding:1px 6px;border-radius:8px;"
                :style="w.status==='활성'?'background:#e8f5e9;color:#2e7d32;':'background:#f5f5f5;color:#999;'">{{ w.status||'활성' }}</span>
              <span style="font-size:10px;color:#bbb;">{{ w._area }} › {{ w._panelNm }}</span>
            </div>

            <!-- image_banner -->
            <div v-if="w.widgetType==='image_banner'"
              style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;padding:28px 16px;text-align:center;color:#fff;display:flex;flex-direction:column;align-items:center;gap:8px;">
              <div style="font-size:32px;">🖼</div>
              <div style="font-size:14px;font-weight:700;letter-spacing:.3px;">{{ w.widgetNm }}</div>
              <div v-if="w.clickTarget" style="font-size:11px;opacity:.8;background:rgba(255,255,255,.2);border-radius:10px;padding:3px 12px;">→ {{ w.clickTarget }}</div>
            </div>

            <!-- product_slider -->
            <div v-else-if="w.widgetType==='product_slider'">
              <div style="display:flex;gap:8px;overflow:hidden;">
                <div v-for="n in 4" :key="n" style="flex:0 0 110px;border:1px solid #ececec;border-radius:8px;overflow:hidden;">
                  <div style="height:80px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);display:flex;align-items:center;justify-content:center;font-size:26px;">📦</div>
                  <div style="padding:7px 8px;">
                    <div style="font-size:10px;color:#555;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">상품명</div>
                    <div style="font-size:12px;font-weight:700;color:#e8587a;">₩00,000</div>
                  </div>
                </div>
              </div>
              <div v-if="w.clickTarget" style="font-size:10px;color:#aaa;margin-top:6px;text-align:right;">더보기 → {{ w.clickTarget }}</div>
            </div>

            <!-- product (단품) -->
            <div v-else-if="w.widgetType==='product'" style="display:flex;gap:12px;align-items:flex-start;padding:4px 0;">
              <div style="flex:0 0 88px;height:88px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:30px;">📦</div>
              <div style="flex:1;">
                <div style="font-size:11px;color:#aaa;margin-bottom:3px;">단품 상품</div>
                <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:5px;">상품명</div>
                <div style="font-size:15px;font-weight:800;color:#e8587a;margin-bottom:6px;">₩00,000</div>
                <div v-if="w.clickTarget" style="font-size:10px;color:#999;">→ {{ w.clickTarget }}</div>
              </div>
            </div>

            <!-- cond_product (조건상품) -->
            <div v-else-if="w.widgetType==='cond_product'">
              <div style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 9px;margin-bottom:8px;display:inline-block;">🔍 조건 필터</div>
              <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:1px solid #f5f5f5;">
                <div style="width:40px;height:40px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>
                <div style="flex:1;">
                  <div style="font-size:11px;color:#444;margin-bottom:2px;">상품명 {{ n }}</div>
                  <div style="font-size:12px;font-weight:700;color:#e8587a;">₩00,000</div>
                </div>
              </div>
            </div>

            <!-- chart_bar -->
            <div v-else-if="w.widgetType==='chart_bar'">
              <div style="display:flex;align-items:flex-end;gap:5px;height:90px;padding:0 4px;border-bottom:1px solid #eee;">
                <div v-for="(h, ci) in [55,78,42,88,65,92,70]" :key="ci"
                  style="flex:1;border-radius:4px 4px 0 0;"
                  :style="'height:' + h + '%;background:linear-gradient(180deg,#667eea,#764ba2);'"></div>
              </div>
              <div style="display:flex;justify-content:space-around;margin-top:4px;">
                <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" style="font-size:9px;color:#aaa;">{{ d }}</span>
              </div>
            </div>

            <!-- chart_line -->
            <div v-else-if="w.widgetType==='chart_line'">
              <svg viewBox="0 0 240 90" style="width:100%;height:90px;overflow:visible;">
                <polyline points="0,70 34,50 68,62 102,22 136,38 170,14 204,28 240,20"
                  fill="none" stroke="#667eea" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                <polyline points="0,70 34,50 68,62 102,22 136,38 170,14 204,28 240,20 240,90 0,90"
                  fill="#667eea" opacity=".1"/>
              </svg>
            </div>

            <!-- chart_pie -->
            <div v-else-if="w.widgetType==='chart_pie'" style="display:flex;align-items:center;gap:16px;">
              <svg viewBox="0 0 100 100" style="width:90px;height:90px;flex-shrink:0;">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#667eea" stroke-width="24" stroke-dasharray="72 28" stroke-dashoffset="25"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f6ad55" stroke-width="24" stroke-dasharray="17 83" stroke-dashoffset="-47"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#68d391" stroke-width="24" stroke-dasharray="11 89" stroke-dashoffset="-64"/>
              </svg>
              <div>
                <div v-for="(item,idx) in [['카테고리A','#667eea','72%'],['카테고리B','#f6ad55','17%'],['기타','#68d391','11%']]" :key="idx"
                  style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                  <div style="width:9px;height:9px;border-radius:50%;flex-shrink:0;" :style="'background:' + item[1] + ';'"></div>
                  <span style="font-size:11px;color:#555;">{{ item[0] }}</span>
                  <span style="font-size:11px;font-weight:700;color:#333;margin-left:auto;">{{ item[2] }}</span>
                </div>
              </div>
            </div>

            <!-- text_banner -->
            <div v-else-if="w.widgetType==='text_banner'"
              style="background:#f8f9fa;border-left:4px solid #667eea;border-radius:0 8px 8px 0;padding:14px 16px;">
              <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:5px;">{{ w.widgetNm }}</div>
              <div style="font-size:12px;color:#666;line-height:1.7;">텍스트 배너 컨텐츠가 이 영역에 표시됩니다.</div>
            </div>

            <!-- info_card -->
            <div v-else-if="w.widgetType==='info_card'"
              style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:8px;padding:18px;display:flex;align-items:center;gap:14px;">
              <div style="font-size:36px;">ℹ</div>
              <div>
                <div style="font-size:13px;font-weight:700;color:#1565c0;margin-bottom:4px;">{{ w.widgetNm }}</div>
                <div style="font-size:11px;color:#1976d2;line-height:1.6;">정보 카드 컨텐츠 영역입니다.</div>
              </div>
            </div>

            <!-- popup -->
            <div v-else-if="w.widgetType==='popup'"
              style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08);">
              <div style="background:#f5f5f5;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e0e0;">
                <span style="font-size:11px;font-weight:700;color:#555;">팝업</span>
                <span style="font-size:16px;color:#aaa;">×</span>
              </div>
              <div style="padding:22px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">💬</div>
                <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:4px;">{{ w.widgetNm }}</div>
                <div v-if="w.clickTarget" style="font-size:11px;color:#888;">→ {{ w.clickTarget }}</div>
              </div>
            </div>

            <!-- file -->
            <div v-else-if="w.widgetType==='file'"
              style="display:flex;align-items:center;gap:12px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:14px 16px;">
              <span style="font-size:30px;">📎</span>
              <div>
                <div style="font-size:12px;font-weight:700;color:#333;">{{ w.widgetNm }}</div>
                <div style="font-size:10px;color:#999;margin-top:2px;">파일 다운로드</div>
              </div>
            </div>

            <!-- file_list -->
            <div v-else-if="w.widgetType==='file_list'">
              <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-size:18px;">📁</span>
                <span style="font-size:11px;color:#555;flex:1;">파일명_{{ n }}.pdf</span>
                <span style="font-size:10px;color:#aaa;">1.{{ n }}MB</span>
              </div>
            </div>

            <!-- coupon -->
            <div v-else-if="w.widgetType==='coupon'"
              style="border:2px dashed #e8587a;border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
              <div style="font-size:36px;">🎟</div>
              <div style="flex:1;">
                <div style="font-size:14px;font-weight:800;color:#c2185b;margin-bottom:3px;">{{ w.widgetNm }}</div>
                <div style="font-size:11px;color:#e8587a;">쿠폰 발급 이벤트</div>
              </div>
              <div style="background:#e8587a;color:#fff;border-radius:8px;padding:10px 14px;font-size:12px;font-weight:700;white-space:nowrap;">쿠폰 받기</div>
            </div>

            <!-- html_editor -->
            <div v-else-if="w.widgetType==='html_editor'"
              style="background:#1e1e2e;border-radius:8px;padding:14px;font-family:monospace;font-size:11px;color:#a9b7c6;line-height:1.8;">
              <span style="color:#cc7832;">&lt;div </span><span style="color:#6a8759;">class=</span><span style="color:#6a9955;">"widget"</span><span style="color:#cc7832;">&gt;</span><br>
              <span style="padding-left:14px;">  <!-- {{ w.widgetNm }} --><br></span>
              <span style="padding-left:14px;color:#a9b7c6;">  HTML 컨텐츠 영역</span><br>
              <span style="color:#cc7832;">&lt;/div&gt;</span>
            </div>

            <!-- event_banner -->
            <div v-else-if="w.widgetType==='event_banner'"
              style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:8px;padding:22px;text-align:center;color:#fff;">
              <div style="font-size:26px;margin-bottom:8px;">🎉</div>
              <div style="font-size:15px;font-weight:800;letter-spacing:.5px;margin-bottom:5px;">{{ w.widgetNm }}</div>
              <div v-if="w.clickTarget" style="font-size:11px;opacity:.85;background:rgba(255,255,255,.2);border-radius:10px;padding:3px 12px;display:inline-block;">→ {{ w.clickTarget }}</div>
            </div>

            <!-- cache_banner (적립금) -->
            <div v-else-if="w.widgetType==='cache_banner'"
              style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:8px;padding:18px;display:flex;align-items:center;gap:14px;color:#fff;">
              <div style="font-size:36px;">💰</div>
              <div>
                <div style="font-size:12px;opacity:.85;margin-bottom:3px;">적립금 / 캐시</div>
                <div style="font-size:20px;font-weight:800;">+0,000P</div>
              </div>
            </div>

            <!-- widget_embed -->
            <div v-else-if="w.widgetType==='widget_embed'"
              style="border:2px dashed #a0aec0;border-radius:8px;padding:22px;text-align:center;background:#f7fafc;">
              <div style="font-size:28px;margin-bottom:8px;">🧩</div>
              <div style="font-size:13px;font-weight:700;color:#4a5568;margin-bottom:3px;">{{ w.widgetNm }}</div>
              <div style="font-size:10px;color:#a0aec0;">외부 위젯 임베드 영역</div>
            </div>

            <!-- fallback -->
            <div v-else style="background:#f5f5f5;border-radius:8px;padding:18px;text-align:center;color:#888;">
              <div style="font-size:24px;margin-bottom:5px;">{{ wIcon(w.widgetType) }}</div>
              <div style="font-size:12px;">{{ wLabel(w.widgetType) }}</div>
            </div>

            <!-- 클릭 액션 -->
            <div v-if="w.clickAction && w.clickAction!=='none'" style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;">
              <span style="background:#e3f2fd;color:#1565c0;border-radius:3px;padding:1px 7px;white-space:nowrap;">{{ w.clickAction }}</span>
              <span style="color:#777;word-break:break-all;">{{ w.clickTarget }}</span>
            </div>
          </div>
        </div>
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
          <span style="font-size:11px;color:#718096;">Area → Widget 구조 (날짜 기준 활성 패널)</span>
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
        <div v-else style="font-family:monospace;font-size:12px;line-height:1.8;">
          <div v-for="(line, i) in sourceLines" :key="i"
            :style="line.type==='blank' ? 'height:0.6em;' : 'white-space:pre;'">
            <span v-if="line.type==='area-open'" style="color:#63b3ed;font-weight:700;">{{ line.text }}</span>
            <span v-else-if="line.type==='area-close'" style="color:#63b3ed;font-weight:700;">{{ line.text }}</span>
            <span v-else-if="line.type==='comment'" style="color:#718096;">{{ line.text }}</span>
            <span v-else-if="line.type==='widget'">
              <span style="color:#cdd9e5;">{{ '  ' }}</span>
              <span style="color:#f6ad55;font-weight:600;">&lt;DispWidget</span>
              <span style="color:#b5cea8;"> widgetType=</span>
              <span style="color:#ce9178;">"{{ line.wt }}"</span>
              <span style="color:#f6ad55;font-weight:600;"> /&gt;</span>
              <span style="color:#718096;">  &lt;!-- {{ wIcon(line.wt) }} {{ wLabel(line.wt) }} --&gt;</span>
            </span>
            <span v-else style="color:#cdd9e5;">{{ line.text }}</span>
          </div>
        </div>
      </div>

      <!-- 소스 푸터: 범례 -->
      <div style="background:#161622;padding:10px 20px;border-top:1px solid #3a3a5c;display:flex;gap:16px;flex-wrap:wrap;">
        <span style="font-size:11px;color:#63b3ed;">■ DispArea</span>
        <span style="font-size:11px;color:#f6ad55;">■ DispWidget</span>
        <span style="font-size:11px;color:#718096;">■ 주석 (패널 정보)</span>
        <span style="font-size:11px;color:#aaa;margin-left:auto;">📅 {{ previewDate }} 기준 활성 패널</span>
      </div>
    </div>
  </div>

</div>
`
};
