/* ShopJoy - Sample12: 전시영역 구조 트리 보기 (Tab2) */
window.XsSample12 = {
  name: 'XsSample12',
  components: { 'category-select-modal': window.CategorySelectModal },
  setup() {
    const { ref, reactive, computed } = Vue;

    const today = new Date().toISOString().slice(0, 10);
    const previewDate = ref(today);
    const previewTime = ref(new Date().toTimeString().slice(0, 5));
    const showAreaDrop  = ref(false);
    const selectedAreas = reactive(new Set());
    const expandedAreas = reactive(new Set());
    const checkedPanels  = reactive(new Set());
    const checkedWidgets = reactive(new Set()); // key: dispId_wi

    /* 카테고리 선택 */
    const showCatModal   = ref(false);
    const selectedCatIds = reactive(new Set());
    const allCats = computed(() => ((window.adminData || {}).categories || []).filter(c => c.status === '활성'));
    const selectedCatNames = computed(() => [...selectedCatIds].map(id => { const c = allCats.value.find(c => c.categoryId === id); return c ? c.categoryNm : ''; }).filter(Boolean));
    const catBtnLabel = computed(() => {
      if (selectedCatIds.size === 0) return '카테고리';
      return selectedCatIds.size <= 2 ? selectedCatNames.value.join(', ') : `${selectedCatIds.size}개`;
    });
    const onCatApply = (ids) => { selectedCatIds.clear(); ids.forEach(id => selectedCatIds.add(id)); };

    /* 현재 사용자 인증 상태 */
    const auth       = window.useFrontAuthStore ? window.useFrontAuthStore() : null;
    const isLoggedIn = auth ? auth.isLoggedIn : false;
    const userGrade  = (auth && auth.user) ? (auth.user.grade  || '일반') : '';
    const userName   = (auth && auth.user) ? (auth.user.userName || auth.user.email || '') : '';

    /* 검색 필터 */
    const searchStatus       = ref('활성');
    const searchCondition    = ref('');
    const searchAuthRequired = ref('');
    const searchAuthGrade    = ref('');
    const CONDITION_OPTS  = ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'];
    const AUTH_GRADE_OPTS = ['일반', '우수', 'VIP'];

    const accessibleConds = computed(() => {
      const c = ['항상 표시'];
      if (!isLoggedIn) { c.push('비로그인 전용'); return c; }
      c.push('로그인 필요');
      if (userGrade === '우수' || userGrade === 'VIP') c.push('로그인+우수');
      if (userGrade === 'VIP') c.push('로그인+VIP');
      return c;
    });

    const WIDGET_LABELS = {
      image_banner:'이미지 배너', product_slider:'상품 슬라이더', product:'상품',
      cond_product:'조건상품',   chart_bar:'차트(Bar)',          chart_line:'차트(Line)',
      chart_pie:'차트(Pie)',     text_banner:'텍스트 배너',      info_card:'정보카드',
      popup:'팝업',              file:'파일',                    file_list:'파일목록',
      coupon:'쿠폰',             html_editor:'HTML 에디터',      event_banner:'이벤트',
      cache_banner:'캐시',       widget_embed:'위젯',
    };
    const WIDGET_ICONS = {
      image_banner:'🖼', product_slider:'🛒', product:'📦',
      cond_product:'🔍', chart_bar:'📊',      chart_line:'📈',
      chart_pie:'🥧',   text_banner:'📝',     info_card:'ℹ',
      popup:'💬',        file:'📎',            file_list:'📁',
      coupon:'🎟',       html_editor:'📄',     event_banner:'🎉',
      cache_banner:'💰', widget_embed:'🧩',
    };
    const wLabel = (t) => WIDGET_LABELS[t] || t || '-';
    const wIcon  = (t) => WIDGET_ICONS[t] || '▪';

    const allAreas = computed(() =>
      ((window.adminData || {}).codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    const isInRange = (panel) => {
      const d = previewDate.value;
      if (!d) return true;
      const dt = `${d} ${previewTime.value || '00:00'}`;
      if (panel.dispStartDate && dt < `${panel.dispStartDate} ${panel.dispStartTime || '00:00'}`) return false;
      if (panel.dispEndDate   && dt > `${panel.dispEndDate}   ${panel.dispEndTime   || '23:59'}`) return false;
      return true;
    };

    const panelFilter = (p) => {
      if (searchStatus.value       && p.status !== searchStatus.value) return false;
      if (!isInRange(p)) return false;
      if (searchCondition.value    && (p.condition || '항상 표시') !== searchCondition.value) return false;
      if (searchAuthRequired.value === 'Y' && !p.authRequired) return false;
      if (searchAuthRequired.value === 'N' &&  p.authRequired) return false;
      if (searchAuthGrade.value    && p.authGrade !== searchAuthGrade.value) return false;
      if (selectedCatIds.size > 0) {
        const names = selectedCatNames.value;
        const hit = names.some(nm => p.name.includes(nm)) ||
                    (p.rows || []).some(w => names.some(nm => (w.widgetNm || '').includes(nm)));
        if (!hit) return false;
      }
      return true;
    };

    /* 영역별 패널 목록 */
    const structAreaList = computed(() => {
      return allAreas.value
        .filter(a => selectedAreas.size === 0 || selectedAreas.has(a.codeValue))
        .map(area => {
          const panels = ((window.adminData || {}).displays || [])
            .filter(p => p.area === area.codeValue && panelFilter(p))
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          return { ...area, panels };
        });
    });

    /* 초기 펼침 */
    const initExpand = () => allAreas.value.forEach(a => expandedAreas.add(a.codeValue));

    /* 영역 토글 */
    const toggleAreaExpand = (code) => {
      if (expandedAreas.has(code)) expandedAreas.delete(code);
      else expandedAreas.add(code);
    };

    /* 패널 체크 */
    const togglePanel = (p) => {
      const id = p.dispId;
      const rows = p.rows || [];
      if (checkedPanels.has(id)) {
        checkedPanels.delete(id);
        rows.forEach((_, wi) => checkedWidgets.delete(`${id}_${wi}`));
      } else {
        checkedPanels.add(id);
        rows.forEach((_, wi) => checkedWidgets.add(`${id}_${wi}`));
      }
    };

    /* 위젯 체크 */
    const toggleWidget = (dispId, wi, e) => {
      if (e) e.stopPropagation();
      const key = `${dispId}_${wi}`;
      if (checkedWidgets.has(key)) checkedWidgets.delete(key);
      else checkedWidgets.add(key);
    };

    /* 전체 선택/해제 */
    const checkAll  = () => { structAreaList.value.forEach(a => a.panels.forEach(p => { checkedPanels.add(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.add(`${p.dispId}_${wi}`)); })); };
    const clearAll  = () => { checkedPanels.clear(); checkedWidgets.clear(); };

    /* 영역 전체 체크 */
    const isAreaAllChecked = (area) =>
      area.panels.length > 0 &&
      area.panels.every(p => checkedPanels.has(p.dispId)) &&
      area.panels.every(p => (p.rows||[]).every((_,wi) => checkedWidgets.has(`${p.dispId}_${wi}`)));

    const checkAreaAll = (area) => {
      if (isAreaAllChecked(area)) {
        area.panels.forEach(p => { checkedPanels.delete(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.delete(`${p.dispId}_${wi}`)); });
      } else {
        area.panels.forEach(p => { checkedPanels.add(p.dispId); (p.rows||[]).forEach((_,wi)=>checkedWidgets.add(`${p.dispId}_${wi}`)); });
      }
    };

    const isPanelAllChecked = (p) =>
      checkedPanels.has(p.dispId) &&
      ((p.rows||[]).length === 0 || (p.rows||[]).every((_,wi) => checkedWidgets.has(`${p.dispId}_${wi}`)));

    /* 선택 위젯 목록 */
    const checkedWidgetList = computed(() => {
      const result = [];
      structAreaList.value.forEach(a =>
        a.panels.forEach(p =>
          (p.rows||[]).forEach((w, wi) => {
            if (checkedWidgets.has(`${p.dispId}_${wi}`))
              result.push({ ...w, _dispId: p.dispId, _panelNm: p.name, _area: a.codeLabel, _wi: wi });
          })
        )
      );
      return result;
    });

    /* 화면영역 드롭다운 */
    const areaBtnLabel = computed(() => selectedAreas.size === 0 ? '전체 영역' : `${selectedAreas.size}개 선택`);
    const toggleArea = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };
    const selectAllAreas = () => { allAreas.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas  = () => { selectedAreas.clear(); };

    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

    /* 초기화 */
    initExpand();

    return {
      previewDate, previewTime, showAreaDrop,
      selectedAreas, allAreas, areaBtnLabel,
      toggleArea, selectAllAreas, clearAllAreas, resetDate,
      searchStatus, searchCondition, searchAuthRequired, searchAuthGrade,
      CONDITION_OPTS, AUTH_GRADE_OPTS,
      isLoggedIn, userGrade, userName, accessibleConds,
      showCatModal, selectedCatIds, catBtnLabel, onCatApply, selectedCatNames,
      structAreaList, expandedAreas, toggleAreaExpand, initExpand,
      checkedPanels, checkedWidgets,
      togglePanel, toggleWidget,
      checkAll, clearAll,
      isAreaAllChecked, checkAreaAll,
      isPanelAllChecked,
      checkedWidgetList,
      wLabel, wIcon,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">

  <!-- 제목 -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    12. 전시영역 구조 트리 보기
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">영역 &gt; 패널 &gt; 위젯 구조 선택</span>
  </div>

  <!-- 필터 바 -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">📅 전시일시</span>
        <input type="date" v-model="previewDate" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <input type="time" v-model="previewTime" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <button @click="resetDate" style="font-size:11px;padding:3px 8px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;color:#555;">현재</button>
      </div>
      <div style="width:1px;height:24px;background:#e0e0e0;"></div>

      <!-- 상태 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">상태</span>
        <select v-model="searchStatus" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:76px;">
          <option value="">전체</option>
          <option value="활성">활성</option>
          <option value="비활성">비활성</option>
        </select>
      </div>
      <!-- 노출조건 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">노출조건</span>
        <select v-model="searchCondition" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:112px;">
          <option value="">전체</option>
          <option v-for="c in CONDITION_OPTS" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <!-- 인증필요 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">인증필요</span>
        <select v-model="searchAuthRequired" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">전체</option>
          <option value="Y">필요</option>
          <option value="N">불필요</option>
        </select>
      </div>
      <!-- 등급제한 -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">등급제한</span>
        <select v-model="searchAuthGrade" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">전체</option>
          <option v-for="g in AUTH_GRADE_OPTS" :key="g" :value="g">{{ g }}↑</option>
        </select>
      </div>

      <!-- 카테고리 -->
      <button @click="showCatModal=true"
        style="font-size:12px;padding:3px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;"
        :style="selectedCatIds.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
        📂 {{ catBtnLabel }}
      </button>

      <!-- 화면영역 멀티선택 -->
      <div style="margin-left:auto;position:relative;">
        <button @click="showAreaDrop=!showAreaDrop"
          style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;"
          :style="selectedAreas.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
          <span>🗂 {{ areaBtnLabel }}</span>
          <span style="font-size:10px;">{{ showAreaDrop ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showAreaDrop" @click="showAreaDrop=false" style="position:fixed;inset:0;z-index:99;"></div>
        <div v-if="showAreaDrop" style="position:absolute;right:0;top:calc(100% + 4px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:220px;max-height:300px;overflow-y:auto;padding:8px 0;">
          <div style="display:flex;gap:6px;padding:6px 12px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="selectAllAreas" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
            <button @click.stop="clearAllAreas" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
          </div>
          <div v-for="a in allAreas" :key="a.codeValue" @click.stop="toggleArea(a.codeValue)"
            style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;"
            :style="selectedAreas.has(a.codeValue)?'background:#fff8f8;':''">
            <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="selectedAreas.has(a.codeValue)?'border-color:#e8587a;background:#e8587a;':'border-color:#ccc;background:#fff;'">
              <span v-if="selectedAreas.has(a.codeValue)" style="color:#fff;font-size:9px;">✓</span>
            </div>
            <code style="font-size:10px;background:#f5f5f5;padding:1px 4px;border-radius:3px;">{{ a.codeValue }}</code>
            <span style="font-size:12px;">{{ a.codeLabel }}</span>
          </div>
          <div style="border-top:1px solid #f0f0f0;padding:6px 12px;">
            <button @click.stop="showAreaDrop=false" style="font-size:11px;width:100%;padding:4px;border:1px solid #e0e0e0;border-radius:5px;background:#f8f8f8;color:#666;cursor:pointer;">닫기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 현재 사용자 정보 -->
    <div style="margin-top:8px;padding:7px 12px;background:#f8f9fa;border-radius:6px;border-left:3px solid #aaa;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:11px;color:#888;font-weight:600;">현재 사용자</span>
      <span v-if="isLoggedIn" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:1px 7px;font-weight:600;">로그인</span>
      <span v-else style="font-size:11px;background:#f5f5f5;color:#999;border-radius:6px;padding:1px 7px;">비로그인</span>
      <span v-if="userName" style="font-size:11px;color:#555;">{{ userName }}</span>
      <span v-if="isLoggedIn && userGrade" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:1px 7px;">등급: {{ userGrade }}</span>
      <span style="font-size:11px;color:#aaa;">접근 가능 조건:</span>
      <span v-for="c in accessibleConds" :key="c" style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:6px;padding:1px 7px;">{{ c }}</span>
    </div>
  </div>

  <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">

    <!-- 좌: 구조 트리 -->
    <div style="flex:3;min-width:280px;">
      <!-- 조작 바 -->
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:8px 12px;margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;font-weight:600;color:#555;">패널</span>
        <button @click="checkAll" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
        <button @click="clearAll" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
        <span style="font-size:11px;color:#aaa;">{{ checkedPanels.size }}개 선택됨</span>
        <span style="width:1px;height:18px;background:#e0e0e0;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:600;color:#555;">위젯</span>
        <span style="font-size:11px;color:#aaa;">{{ checkedWidgets.size }}개 선택됨</span>
        <button @click="initExpand" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#666;cursor:pointer;margin-left:auto;">전체 펼치기</button>
      </div>

      <!-- 트리 -->
      <div v-if="structAreaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:13px;">등록된 영역이 없습니다.</div>

      <div v-for="area in structAreaList" :key="area.codeValue" style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:8px;overflow:hidden;">
        <!-- 영역 헤더 -->
        <div style="display:flex;align-items:center;gap:8px;padding:9px 14px;background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;cursor:pointer;"
          @click="toggleAreaExpand(area.codeValue)">
          <div @click.stop="checkAreaAll(area)" style="width:15px;height:15px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;"
            :style="isAreaAllChecked(area)?'border-color:#f6ad55;background:#f6ad55;':'border-color:rgba(255,255,255,.4);background:transparent;'">
            <span v-if="isAreaAllChecked(area)" style="color:#333;font-size:9px;">✓</span>
          </div>
          <span style="font-size:9px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:3px;padding:1px 5px;">영역</span>
          <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 7px;border-radius:4px;">{{ area.codeValue }}</code>
          <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
          <span style="margin-left:auto;font-size:11px;opacity:.6;">패널 {{ area.panels.length }}개</span>
          <span style="font-size:11px;opacity:.5;">{{ expandedAreas.has(area.codeValue) ? '▲' : '▼' }}</span>
        </div>

        <!-- 패널 목록 -->
        <div v-show="expandedAreas.has(area.codeValue)">
          <div v-if="area.panels.length===0" style="padding:12px 18px;font-size:12px;color:#bbb;">해당 날짜 활성 패널 없음</div>

          <div v-for="(p, pi) in area.panels" :key="p.dispId" @click="togglePanel(p)"
            style="display:flex;align-items:flex-start;gap:8px;padding:8px 14px;cursor:pointer;border-top:1px solid #f0f0f0;transition:background .1s;"
            :style="checkedPanels.has(p.dispId)?'background:#fff8e1;':''">
            <!-- 패널 체크박스 -->
            <div style="margin-top:2px;width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="isPanelAllChecked(p)?'border-color:#f59e0b;background:#f59e0b;':checkedPanels.has(p.dispId)?'border-color:#f59e0b;background:#fde68a;':'border-color:#ccc;background:#fff;'">
              <span v-if="isPanelAllChecked(p)" style="color:#fff;font-size:9px;">✓</span>
              <span v-else-if="checkedPanels.has(p.dispId)" style="color:#f59e0b;font-size:9px;font-weight:900;">−</span>
            </div>

            <div style="flex:1;min-width:0;">
              <!-- 패널 정보 -->
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;flex-wrap:wrap;">
                <span style="font-size:9px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:3px;padding:0 4px;">패널</span>
                <code style="font-size:9px;background:#f5f5f5;padding:1px 4px;border-radius:3px;color:#666;">#{{ String(p.dispId).padStart(4,'0') }}</code>
                <span style="font-size:12px;font-weight:700;color:#222;">{{ p.name }}</span>
                <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 6px;">{{ p.condition || '항상 표시' }}</span>
              </div>
              <!-- 위젯 목록 -->
              <div style="display:flex;flex-direction:column;gap:2px;padding-left:2px;">
                <span v-if="!p.rows || p.rows.length===0" style="font-size:11px;color:#ccc;">(위젯 없음)</span>
                <div v-for="(w, wi) in (p.rows||[])" :key="wi" @click.stop="toggleWidget(p.dispId, wi, $event)"
                  style="display:flex;align-items:center;gap:5px;padding:2px 5px;border-radius:4px;cursor:pointer;transition:background .1s;"
                  :style="checkedWidgets.has(p.dispId + '_' + wi)?'background:#fff3e0;':'background:transparent;'">
                  <div style="width:12px;height:12px;border-radius:3px;border:1.5px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
                    :style="checkedWidgets.has(p.dispId + '_' + wi)?'border-color:#f59e0b;background:#f59e0b;':'border-color:#ccc;background:#fff;'">
                    <span v-if="checkedWidgets.has(p.dispId + '_' + wi)" style="color:#fff;font-size:8px;">✓</span>
                  </div>
                  <span style="font-size:9px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:0 3px;flex-shrink:0;">위젯</span>
                  <span style="font-size:10px;">{{ wIcon(w.widgetType) }}</span>
                  <span style="font-size:11px;color:#e65100;">{{ wLabel(w.widgetType) }}</span>
                  <span v-if="w.widgetNm" style="font-size:10px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 우: 위젯 컨텐츠 미리보기 -->
    <div style="flex:6;min-width:280px;max-height:80vh;overflow-y:auto;">
      <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;">
        <span style="font-size:13px;font-weight:700;color:#333;">🧩 위젯 컨텐츠 미리보기</span>
        <span style="font-size:11px;color:#aaa;">{{ checkedWidgetList.length }}개 선택됨</span>
      </div>

      <div v-if="checkedWidgetList.length===0"
        style="border:2px dashed #e0e0e0;border-radius:8px;padding:50px;text-align:center;color:#bbb;font-size:13px;">
        좌측 트리에서 위젯을 선택하면<br>컨텐츠 미리보기가 표시됩니다.
      </div>

      <div v-else>
        <div v-for="(w, i) in checkedWidgetList" :key="i"
          style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 14px;margin-bottom:8px;overflow:hidden;">
          <!-- 위젯 헤더 -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5f5f5;flex-wrap:wrap;">
            <span style="font-size:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:1px 5px;white-space:nowrap;">{{ wIcon(w.widgetType) }} {{ wLabel(w.widgetType) }}</span>
            <span style="font-size:12px;font-weight:700;color:#222;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
            <span style="font-size:10px;color:#bbb;white-space:nowrap;">{{ w._area }} › {{ w._panelNm }}</span>
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
                  <div style="font-size:10px;color:#555;margin-bottom:2px;">상품명</div>
                  <div style="font-size:12px;font-weight:700;color:#e8587a;">₩00,000</div>
                </div>
              </div>
            </div>
            <div v-if="w.clickTarget" style="font-size:10px;color:#aaa;margin-top:6px;text-align:right;">더보기 → {{ w.clickTarget }}</div>
          </div>

          <!-- product -->
          <div v-else-if="w.widgetType==='product'" style="display:flex;gap:12px;align-items:flex-start;padding:4px 0;">
            <div style="flex:0 0 88px;height:88px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:30px;">📦</div>
            <div style="flex:1;">
              <div style="font-size:11px;color:#aaa;margin-bottom:3px;">단품 상품</div>
              <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:5px;">상품명</div>
              <div style="font-size:15px;font-weight:800;color:#e8587a;">₩00,000</div>
            </div>
          </div>

          <!-- cond_product -->
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
            style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <div style="background:#f5f5f5;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e0e0e0;">
              <span style="font-size:11px;font-weight:700;color:#555;">팝업</span>
              <span style="font-size:16px;color:#aaa;">×</span>
            </div>
            <div style="padding:22px;text-align:center;">
              <div style="font-size:28px;margin-bottom:8px;">💬</div>
              <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:4px;">{{ w.widgetNm }}</div>
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
            <span style="color:#cc7832;">&lt;div&gt;</span><br>
            <span style="padding-left:14px;color:#a9b7c6;">&nbsp;&nbsp;HTML 컨텐츠 영역 ({{ w.widgetNm }})</span><br>
            <span style="color:#cc7832;">&lt;/div&gt;</span>
          </div>

          <!-- event_banner -->
          <div v-else-if="w.widgetType==='event_banner'"
            style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:8px;padding:22px;text-align:center;color:#fff;">
            <div style="font-size:26px;margin-bottom:8px;">🎉</div>
            <div style="font-size:15px;font-weight:800;letter-spacing:.5px;margin-bottom:5px;">{{ w.widgetNm }}</div>
            <div v-if="w.clickTarget" style="font-size:11px;opacity:.85;background:rgba(255,255,255,.2);border-radius:10px;padding:3px 12px;display:inline-block;">→ {{ w.clickTarget }}</div>
          </div>

          <!-- cache_banner -->
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
        </div>
      </div>
    </div>
  </div>

  <!-- 카테고리 선택 모달 -->
  <category-select-modal :show="showCatModal" :selected-ids="[...selectedCatIds]" @close="showCatModal=false" @apply="onCatApply" />

</div>
  `,
};
