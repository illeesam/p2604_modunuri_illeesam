/* ShopJoy - Sample11: 전시영역 미리보기 (Tab1 미리보기) */
window.XsSample11 = {
  name: 'XsSample11',
  components: { 'category-select-modal': window.CategorySelectModal },
  setup() {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, computed, onMounted, watch } = Vue;
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, previewDate: new Date().toISOString().slice(0, 10), tabMode: 'card', showDesc: true, previewTime: new Date().toTimeString().slice(0, 5), showAreaDrop: false, showCatModal: false });
    const codes = reactive({
      active_status_opts: [{value:'활성',label:'활성'},{value:'비활성',label:'비활성'}],
      need_yn_opts:       [{value:'Y',label:'필요'},{value:'N',label:'불필요'}],
      condition_opts:     ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'],
      auth_grade_opts:    ['일반', '우수', 'VIP'],
    });

    const today = new Date().toISOString().slice(0, 10);
    const selectedAreas = reactive(new Set());
    /* 카테고리 선택 */
    const selectedCatIds = reactive(new Set());

    /* 현재 사용자 인증 상태 */
    const auth       = window.useFoAuthStore ? window.useFoAuthStore() : null;
    const isLoggedIn = auth ? auth.sgIsLoggedIn : false;
    const userGrade  = (auth && auth.svAuthUser) ? (auth.svAuthUser.grade  || '일반') : '';
    const userNm     = (auth && auth.svAuthUser) ? (auth.svAuthUser.authNm || auth.svAuthUser.memberNm || auth.svAuthUser.email || '') : '';

    /* searchParam (template 참조용) */
    const searchParam = reactive({ status: '', condition: '', authrequired: '', authgrade: '' });

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

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ XsSample11.js : handleBtnAction -> ', cmd, param);
      // 전시일시 초기화
      if (cmd === 'filter-reset-date') {
        return resetDate();
      // 보기 모드 변경 (list/card/expand)
      } else if (cmd === 'filter-set-tab-mode') {
        uiState.tabMode = param;
      // 설명 토글
      } else if (cmd === 'filter-toggle-desc') {
        uiState.showDesc = !uiState.showDesc;
      // 영역 드롭다운 토글
      } else if (cmd === 'filter-toggle-area-drop') {
        uiState.showAreaDrop = !uiState.showAreaDrop;
      // 영역 드롭다운 닫기
      } else if (cmd === 'filter-close-area-drop') {
        uiState.showAreaDrop = false;
      // 영역 전체선택
      } else if (cmd === 'filter-select-all-areas') {
        return selectAllAreas();
      // 영역 전체해제
      } else if (cmd === 'filter-clear-all-areas') {
        return clearAllAreas();
      // 카테고리 모달 열기
      } else if (cmd === 'categoryModal-open') {
        uiState.showCatModal = true;
      // 카테고리 모달 닫기
      } else if (cmd === 'categoryModal-close') {
        uiState.showCatModal = false;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 행/선택 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ XsSample11.js : handleSelectAction -> ', cmd, param);
      // 영역 토글
      if (cmd === 'areas-toggle') {
        return toggleArea(param);
      // 카테고리 적용
      } else if (cmd === 'categoryModal-apply') {
        return onCatApply(param);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });
    const cfAllCats = computed(() => (window._foCats||[] || []).filter(c => c.status === '활성'));
    const cfSelectedCatNames = computed(() => [...selectedCatIds].map(id => { const c = cfAllCats.value.find(c => c.categoryId === id); return c ? c.categoryNm : ''; }).filter(Boolean));
    const cfCatBtnLabel = computed(() => {
      if (selectedCatIds.size === 0) { return '카테고리'; }
      return selectedCatIds.size <= 2 ? cfSelectedCatNames.value.join(', ') : `${selectedCatIds.size}개`;
    });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* onCatApply — 이벤트 */
    const onCatApply = (ids) => { selectedCatIds.clear(); ids.forEach(id => selectedCatIds.add(id)); };

    /* 현재 사용자가 접근 가능한 조건 목록 */
    const cfAccessibleConds = computed(() => {
      const c = ['항상 표시'];
      if (!isLoggedIn) { c.push('비로그인 전용'); return c; }
      c.push('로그인 필요');
      if (userGrade === '우수' || userGrade === 'VIP') { c.push('로그인+우수'); }
      if (userGrade === 'VIP') { c.push('로그인+VIP'); }
      return c;
    });

    /* fnWLabel — 유틸 */
    const fnWLabel = (t) => WIDGET_LABELS[t] || t || '-';

    /* fnWIcon — 유틸 */
    const fnWIcon  = (t) => WIDGET_ICONS[t] || '▪';
    /* 화면영역 코드 목록 */
    const cfAllAreas = computed(() =>
      window.sfGetBoCodeStore()?.codes||[]
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );
    const cfAreaList = computed(() => {
      if (selectedAreas.size === 0) { return cfAllAreas.value; }
      return cfAllAreas.value.filter(c => selectedAreas.has(c.codeValue));
    });

    /* toggleArea — 영역 토글 */
    const toggleArea     = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };

    /* selectAllAreas — 선택 */
    const selectAllAreas = () => { cfAllAreas.value.forEach(a => selectedAreas.add(a.codeValue)); };

    /* clearAllAreas — 비우기 */
    const clearAllAreas  = () => { selectedAreas.clear(); };
    const cfAreaBtnLabel   = computed(() => selectedAreas.size === 0 ? '전체 영역' : `${selectedAreas.size}개 선택`);

    /* resetDate — 초기화 */
    const resetDate = () => {
      uiState.previewDate = today;
      uiState.previewTime = new Date().toTimeString().slice(0, 5);
    };

    /* isInRange — 여부 확인 */
    const isInRange = (panel) => {
      const d = uiState.previewDate;
      if (!d) { return true; }
      const dt = `${d}T${uiState.previewTime || '00:00'}`;
      /* _norm — _norm */
      const _norm = v => String(v || '').replace(' ', 'T').slice(0, 16);
      if (panel.dispStartDt && dt < _norm(panel.dispStartDt)) { return false; }
      if (panel.dispEndDt   && dt > _norm(panel.dispEndDt)) { return false; }
      return true;
    };

    /* panelFilter — 패널 필터 */
    const panelFilter = (p) => {
      if (searchParam.status       && p.status !== searchParam.status) { return false; }
      if (!isInRange(p)) { return false; }
      if (searchParam.condition    && (p.condition || '항상 표시') !== searchParam.condition) { return false; }
      if (searchParam.authrequired === 'Y' && !p.authRequired) { return false; }
      if (searchParam.authrequired === 'N' &&  p.authRequired) { return false; }
      if (searchParam.authgrade    && p.authGrade !== searchParam.authgrade) { return false; }
      if (selectedCatIds.size > 0) {
        const names = cfSelectedCatNames.value;
        const hit = names.some(nm => p.name.includes(nm)) ||
                    (p.rows || []).some(w => names.some(nm => (w.widgetNm || '').includes(nm)));
        if (!hit) { return false; }
      }
      return true;
    };

    /* panelsForArea — panels For 영역 */
    const panelsForArea = (areaCode) =>
      []
        .filter(p => p.area === areaCode && panelFilter(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const cfTotalPanels = computed(() =>
      cfAreaList.value.reduce((sum, a) => sum + panelsForArea(a.codeValue).length, 0)
    );

    // ===== return (템플릿 노출) ===============================================

    return {
      uiState, codes, searchParam,                                     // 상태 / 데이터
      handleBtnAction, handleSelectAction,                              // dispatch
      // ===== 영역 / 카테고리 ==================================================
      selectedAreas, cfAllAreas, cfAreaList, cfAreaBtnLabel,
      selectedCatIds, cfCatBtnLabel, cfSelectedCatNames,
      // ===== 사용자 / 패널 ====================================================
      isLoggedIn, userGrade, userNm, cfAccessibleConds,
      panelsForArea, cfTotalPanels,
      fnWLabel, fnWIcon,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">
  <!-- ===== ■. 제목 ====================================================== -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    11. 전시영역 미리보기
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">
      화면영역별 활성 패널 목록
    </span>
  </div>
  <!-- ===== □. 제목 ====================================================== -->
  <!-- ===== ■. 필터 바 ==================================================== -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <!-- ===== ■.■.■. 전시일시 ================================================ -->
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:12px;font-weight:600;color:#555;">
          📅 전시일시
        </span>
        <input type="date" v-model="uiState.previewDate" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <input type="time" v-model="uiState.previewTime" style="font-size:12px;padding:3px 6px;border:1px solid #ddd;border-radius:4px;" />
        <button @click="handleBtnAction('filter-reset-date')" style="font-size:11px;padding:3px 8px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;color:#555;">
          현재
        </button>
      </div>
      <div style="width:1px;height:24px;background:#e0e0e0;">
      </div>
      <!-- ===== ■.■.■. 상태 ================================================== -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">
          상태
        </span>
        <select v-model="searchParam.status" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:76px;">
          <option value="">
            전체
          </option>
          <option v-for="o in codes.active_status_opts" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>
      <!-- ===== ■.■.■. 노출조건 ================================================ -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">
          노출조건
        </span>
        <select v-model="searchParam.condition" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:112px;">
          <option value="">
            전체
          </option>
          <option v-for="c in codes.condition_opts" :key="c" :value="c">
            {{ c }}
          </option>
        </select>
      </div>
      <!-- ===== ■.■.■. 인증필요 ================================================ -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">
          인증필요
        </span>
        <select v-model="searchParam.authrequired" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">
            전체
          </option>
          <option v-for="o in codes.need_yn_opts" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </div>
      <!-- ===== ■.■.■. 등급제한 ================================================ -->
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:12px;font-weight:600;color:#555;">
          등급제한
        </span>
        <select v-model="searchParam.authgrade" style="font-size:12px;padding:3px 5px;border:1px solid #ddd;border-radius:4px;width:72px;">
          <option value="">
            전체
          </option>
          <option v-for="g in codes.auth_grade_opts" :key="g" :value="g">
            {{ g }}↑
          </option>
        </select>
      </div>
      <!-- ===== ■.■.■. 카테고리 ================================================ -->
      <button @click="handleBtnAction('categoryModal-open')"
        style="font-size:12px;padding:3px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:4px;"
        :style="selectedCatIds.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
        📂 {{ cfCatBtnLabel }}
      </button>
      <div style="width:1px;height:24px;background:#e0e0e0;">
      </div>
      <!-- ===== ■.■.■. 보기 모드 =============================================== -->
      <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <button @click="handleBtnAction('filter-set-tab-mode', 'list')" style="font-size:11px;padding:3px 10px;border:none;cursor:pointer;" :style="uiState.tabMode==='list'?'background:#333;color:#fff;':'background:#fff;color:#666;'">
          ☰ 리스트
        </button>
        <button @click="handleBtnAction('filter-set-tab-mode', 'card')" style="font-size:11px;padding:3px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;" :style="uiState.tabMode==='card'?'background:#333;color:#fff;':'background:#fff;color:#666;'">
          🖼 카드
        </button>
        <button @click="handleBtnAction('filter-set-tab-mode', 'expand')" style="font-size:11px;padding:3px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;" :style="uiState.tabMode==='expand'?'background:#333;color:#fff;':'background:#fff;color:#666;'">
          ⊞ 상세
        </button>
      </div>
      <!-- ===== ■.■.■. 설명 토글 =============================================== -->
      <button @click="handleBtnAction('filter-toggle-desc')" style="font-size:11px;padding:3px 10px;border-radius:8px;border:1px solid #ddd;cursor:pointer;"
        :style="uiState.showDesc?'background:#e3f2fd;border-color:#90caf9;color:#1565c0;':'background:#fff;color:#999;'">
        {{ uiState.showDesc ? '📋 설명 숨기기' : '📋 설명 보기' }}
      </button>
      <!-- ===== ■.■.■. 화면영역 멀티선택 =========================================== -->
      <div style="margin-left:auto;position:relative;">
        <button @click="handleBtnAction('filter-toggle-area-drop')"
          style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;"
          :style="selectedAreas.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
          <span>
            🗂 {{ cfAreaBtnLabel }}
          </span>
          <span style="font-size:10px;">
            {{ uiState.showAreaDrop ? '▲' : '▼' }}
          </span>
        </button>
        <div v-if="uiState.showAreaDrop" @click="handleBtnAction('filter-close-area-drop')" style="position:fixed;inset:0;z-index:99;">
        </div>
        <div v-if="uiState.showAreaDrop" style="position:absolute;right:0;top:calc(100% + 4px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:220px;max-height:300px;overflow-y:auto;padding:8px 0;">
          <div style="display:flex;gap:6px;padding:6px 12px 6px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="handleBtnAction('filter-select-all-areas')" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">
              전체선택
            </button>
            <button @click.stop="handleBtnAction('filter-clear-all-areas')" style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">
              전체해제
            </button>
          </div>
          <div v-for="a in cfAllAreas" :key="a.codeValue" @click.stop="handleSelectAction('areas-toggle', a.codeValue)"
            style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;"
            :style="selectedAreas.has(a.codeValue)?'background:#fff8f8;':''">
            <div style="width:14px;height:14px;border-radius:3px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="selectedAreas.has(a.codeValue)?'border-color:#e8587a;background:#e8587a;':'border-color:#ccc;background:#fff;'">
              <span v-if="selectedAreas.has(a.codeValue)" style="color:#fff;font-size:9px;">
                ✓
              </span>
            </div>
            <code style="font-size:10px;background:#f5f5f5;padding:1px 4px;border-radius:3px;">{{ a.codeValue }}</code>
              <span style="font-size:12px;">
                {{ a.codeLabel }}
              </span>
            </div>
            <div style="border-top:1px solid #f0f0f0;padding:6px 12px;">
              <button @click.stop="handleBtnAction('filter-close-area-drop')" style="font-size:11px;width:100%;padding:4px;border:1px solid #e0e0e0;border-radius:5px;background:#f8f8f8;color:#666;cursor:pointer;">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- ===== ■.■. 조회 조건 요약 ============================================== -->
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:#aaa;">
          조회 조건:
        </span>
        <span style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:8px;padding:2px 8px;">
          📅 {{ uiState.previewDate }} {{ uiState.previewTime }}
        </span>
        <span v-if="searchParam.status" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 8px;">
          상태: {{ searchParam.status }}
        </span>
        <span v-if="searchParam.condition" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;">
          {{ searchParam.condition }}
        </span>
        <span v-if="searchParam.authrequired==='Y'" style="font-size:11px;background:#fff3e0;color:#e65100;border-radius:8px;padding:2px 8px;">
          인증 필요
        </span>
        <span v-if="searchParam.authrequired==='N'" style="font-size:11px;background:#fce4ec;color:#c62828;border-radius:8px;padding:2px 8px;">
          인증 불필요
        </span>
        <span v-if="searchParam.authgrade" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;">
          등급: {{ searchParam.authgrade }}↑
        </span>
        <template v-for="nm in cfSelectedCatNames" :key="nm">
          <span style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 8px;">
            📂 {{ nm }}
          </span>
        </template>
        <span style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 8px;margin-left:auto;">
          총 {{ cfTotalPanels }}개 패널
        </span>
      </div>
      <!-- ===== □.□. 조회 조건 요약 ============================================== -->
      <!-- ===== ■.■. 현재 사용자 정보 ============================================= -->
      <div style="margin-top:8px;padding:7px 12px;background:#f8f9fa;border-radius:6px;border-left:3px solid #aaa;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;color:#888;font-weight:600;">
          현재 사용자
        </span>
        <span v-if="isLoggedIn" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:1px 7px;font-weight:600;">
          로그인
        </span>
        <span v-else style="font-size:11px;background:#f5f5f5;color:#999;border-radius:6px;padding:1px 7px;">
          비로그인
        </span>
        <span v-if="userNm" style="font-size:11px;color:#555;">
          {{ userNm }}
        </span>
        <span v-if="isLoggedIn && userGrade" style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:1px 7px;">
        등급: {{ userGrade }}
      </span>
      <span style="font-size:11px;color:#aaa;">
        접근 가능 조건:
      </span>
      <span v-for="c in cfAccessibleConds" :key="c" style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:6px;padding:1px 7px;">
        {{ c }}
      </span>
    </div>
  </div>
  <!-- ===== □.□. 현재 사용자 정보 ============================================= -->
  <!-- ===== □. 필터 바 ==================================================== -->
  <!-- ===== ■. 영역별 패널 목록 =============================================== -->
  <div v-if="cfAreaList.length===0" style="text-align:center;padding:40px;color:#ccc;">
    등록된 화면영역이 없습니다.
  </div>
  <!-- ===== ■. 영역 ====================================================== -->
  <div v-for="area in cfAreaList" :key="area.codeValue" style="margin-bottom:8px;">
    <!-- ===== ■.■. 영역 헤더 ================================================= -->
    <div style="background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;padding:8px 14px;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:8px;">
      <span style="font-size:10px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 6px;">
        영역
      </span>
      <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 7px;border-radius:4px;">{{ area.codeValue }}</code>
        <span style="font-size:13px;font-weight:700;">
          {{ area.codeLabel }}
        </span>
        <span style="margin-left:auto;font-size:11px;opacity:.7;">
          패널 {{ panelsForArea(area.codeValue).length }}개
        </span>
      </div>
      <!-- ===== □.□. 영역 헤더 ================================================= -->
      <!-- ===== ■.■. 패널 없음 ================================================= -->
      <div v-if="panelsForArea(area.codeValue).length===0"
      style="background:#fafafa;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;padding:12px 16px;font-size:12px;color:#bbb;">
        해당 날짜 활성 패널 없음
      </div>
      <!-- ===== □.□. 패널 없음 ================================================= -->
      <!-- ===== ■.■. 리스트 모드 ================================================ -->
      <div v-else-if="uiState.tabMode==='list'" style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
        <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId"
        style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;">
          <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#666;flex-shrink:0;">
          #{{ String(p.dispId).padStart(4,'0') }}
        </code>
            <span style="font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ p.name }}
            </span>
            <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:1px 7px;flex-shrink:0;">
              {{ p.status }}
            </span>
            <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;flex-shrink:0;">
              {{ p.condition || '항상 표시' }}
            </span>
            <span style="font-size:10px;color:#999;flex-shrink:0;">
              위젯 {{ (p.rows||[]).length }}개
            </span>
          </div>
        </div>
        <!-- ===== □.□. 리스트 모드 ================================================ -->
        <!-- ===== ■.■. 카드 모드 ================================================= -->
        <div v-else-if="uiState.tabMode==='card'" style="background:#f9f9f9;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;">
          <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId"
        style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;min-width:180px;flex:1;max-width:260px;">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
              <code style="font-size:9px;background:#f0f0f0;padding:1px 4px;border-radius:3px;color:#777;">
            #{{ String(p.dispId).padStart(4,'0') }}
          </code>
                <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:1px 6px;">
                  {{ p.status }}
                </span>
              </div>
              <div style="font-size:13px;font-weight:700;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ p.name }}
              </div>
              <div v-if="uiState.showDesc && p.description" style="font-size:11px;color:#888;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ p.description }}
            </div>
            <div style="font-size:10px;color:#999;">
              {{ p.condition || '항상 표시' }} · 위젯 {{ (p.rows||[]).length }}개
            </div>
          </div>
        </div>
        <!-- ===== □.□. 카드 모드 ================================================= -->
        <!-- ===== ■.■. 상세(expand) 모드 ========================================= -->
        <div v-else-if="uiState.tabMode==='expand'" style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
          <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId" style="border-bottom:1px solid #f0f0f0;">
            <!-- ===== ■.■.■.■. 패널 행 ============================================== -->
            <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:#fafafa;">
              <code style="font-size:10px;background:#f0f0f0;padding:1px 5px;border-radius:3px;color:#666;">
            #{{ String(p.dispId).padStart(4,'0') }}
          </code>
                <span style="font-size:13px;font-weight:700;flex:1;">
                  {{ p.name }}
                </span>
                <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:1px 7px;">
                  {{ p.status }}
                </span>
                <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">
                  {{ p.condition || '항상 표시' }}
                </span>
              </div>
              <!-- ===== ■.■.■.■. 설명 ================================================ -->
              <div v-if="uiState.showDesc && p.description" style="padding:4px 14px 4px 30px;font-size:11px;color:#888;">
              {{ p.description }}
            </div>
            <!-- ===== ■.■.■.■. 위젯 목록 ============================================= -->
            <div style="padding:4px 14px 8px 30px;display:flex;flex-wrap:wrap;gap:4px;">
              <span v-if="!p.rows || p.rows.length===0" style="font-size:11px;color:#ccc;">
                (위젯 없음)
              </span>
              <span v-for="(w, wi) in (p.rows||[])" :key="wi"
            style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:6px;padding:2px 8px;">
                {{ fnWIcon(w.widgetType) }} {{ fnWLabel(w.widgetType) }}
                <span v-if="w.widgetNm" style="color:#aaa;">
                  · {{ w.widgetNm }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- ===== □.□. 상세(expand) 모드 ========================================= -->
      <!-- ===== □. 영역 ====================================================== -->
      <!-- ===== ■. 카테고리 선택 모달 ============================================== -->
      <category-select-modal :show="uiState.showCatModal" :selected-ids="[...selectedCatIds]" @close="handleBtnAction('categoryModal-close')" @apply="handleSelectAction('categoryModal-apply', $event)" />
    </div>
    <!-- ===== □. 카테고리 선택 모달 ============================================== -->
`,
};
