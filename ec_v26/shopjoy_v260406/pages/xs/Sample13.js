/* ShopJoy - Sample13: 전시영역 소스 보기 */
window.XsSample13 = {
  name: 'XsSample13',
  components: { 'category-select-modal': window.CategorySelectModal },
  setup() {
    const { ref, reactive, computed } = Vue;

    const today = new Date().toISOString().slice(0, 10);
    const previewDate   = ref(today);
    const previewTime   = ref(new Date().toTimeString().slice(0, 5));
    const showAreaDrop  = ref(false);
    const selectedAreas = reactive(new Set());
    const copied        = ref(false);
    const copiedPanel   = ref(null);

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

    const WIDGET_LABELS = {
      image_banner:'이미지 배너', product_slider:'상품 슬라이더', product:'상품',
      cond_product:'조건상품',   chart_bar:'차트(Bar)',          chart_line:'차트(Line)',
      chart_pie:'차트(Pie)',     text_banner:'텍스트 배너',      info_card:'정보카드',
      popup:'팝업',              file:'파일',                    file_list:'파일목록',
      coupon:'쿠폰',             html_editor:'HTML 에디터',      event_banner:'이벤트',
      cache_banner:'캐시',       widget_embed:'위젯',
    };
    const wLabel = (t) => WIDGET_LABELS[t] || t || '-';

    const WIDGET_ICONS = {
      image_banner:'🖼', product_slider:'🛍', product:'📦',
      cond_product:'🔍', chart_bar:'📊', chart_line:'📈',
      chart_pie:'🥧', text_banner:'📝', info_card:'ℹ',
      popup:'💬', file:'📎', file_list:'📁',
      coupon:'🎟', html_editor:'</>', event_banner:'🎉',
      cache_banner:'💰', widget_embed:'🧩',
    };
    const wIcon = (t) => WIDGET_ICONS[t] || '◻';

    const filteredAreas = computed(() =>
      allAreas.value.filter(a => selectedAreas.size === 0 || selectedAreas.has(a.codeValue))
    );

    /* 영역별 패널 목록 */
    const panelsByArea = computed(() =>
      filteredAreas.value.map(area => {
        const panels = ((window.adminData || {}).displays || [])
          .filter(p => p.area === area.codeValue && panelFilter(p))
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        return { area, panels };
      })
    );

    /* 패널 단건 소스 */
    const panelSource = (panel) => {
      const rows = panel.rows || [];
      const attrs = [
        `  area="${panel.area}"`,
        `  panelId="${String(panel.dispId).padStart(4,'0')}"`,
        `  status="${panel.status}"`,
        `  condition="${panel.condition || '항상 표시'}"`,
        panel.authRequired ? `  authRequired` : null,
        panel.authGrade    ? `  authGrade="${panel.authGrade}"` : null,
      ].filter(Boolean).join('\n');
      if (rows.length === 0) {
        return `<DispPanel\n${attrs}>\n\n  <!-- 위젯 없음 -->\n\n</DispPanel>`;
      }
      const widgetLines = rows.map((w, i) =>
        `  // 위젯${i + 1}: ${wLabel(w.widgetType)}${w.widgetNm ? ` (${w.widgetNm})` : ''}\n  <DispWidget widgetType="${w.widgetType}" />`
      ).join('\n\n');
      return `<DispPanel\n${attrs}>\n\n${widgetLines}\n\n</DispPanel>`;
    };

    /* 전체 소스 복사 */
    const sourceText = computed(() => {
      const parts = [];
      panelsByArea.value.forEach(({ area, panels }) => {
        parts.push(`<!-- ===== ${area.codeValue} ${area.codeLabel} (${panels.length}개) ===== -->`);
        panels.forEach(p => { parts.push(panelSource(p)); });
        parts.push('');
      });
      return parts.join('\n\n');
    });

    const copySource = () => {
      navigator.clipboard?.writeText(sourceText.value).then(() => {
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
      });
    };

    const copyPanel = (panel) => {
      navigator.clipboard?.writeText(panelSource(panel)).then(() => {
        copiedPanel.value = panel.dispId;
        setTimeout(() => { copiedPanel.value = null; }, 2000);
      });
    };

    /* 구문 강조 HTML 생성 (v-html용) */
    const panelSourceHtml = (panel) => {
      const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return panelSource(panel).split('\n').map(line => {
        const el = esc(line);
        let color = '#e6edf3';
        if (/^(&lt;DispPanel|&lt;\/DispPanel)/.test(el)) color = '#79c0ff';
        else if (/^\s+\/\//.test(line))                  color = '#8b949e';
        else if (el.includes('&lt;DispWidget'))           color = '#f6ad55';
        else if (el.includes('&lt;!--'))                  color = '#8b949e';
        else if (/^  [a-z]/.test(line))                  color = '#d2a8ff';
        return `<span style="color:${color};">${el}</span>`;
      }).join('\n');
    };

    /* 화면영역 드롭다운 */
    const areaBtnLabel = computed(() => selectedAreas.size === 0 ? '전체 영역' : `${selectedAreas.size}개 선택`);
    const toggleArea    = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };
    const selectAllAreas = () => { allAreas.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas  = () => { selectedAreas.clear(); };
    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

    return {
      previewDate, previewTime, showAreaDrop,
      selectedAreas, allAreas, areaBtnLabel,
      toggleArea, selectAllAreas, clearAllAreas, resetDate,
      searchStatus, searchCondition, searchAuthRequired, searchAuthGrade,
      CONDITION_OPTS, AUTH_GRADE_OPTS,
      isLoggedIn, userGrade, userName, accessibleConds,
      showCatModal, selectedCatIds, catBtnLabel, onCatApply, selectedCatNames,
      panelsByArea, panelSource, panelSourceHtml, copied, copiedPanel, copySource, copyPanel,
      wLabel, wIcon,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">

  <!-- 제목 -->
  <div style="display:flex;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
    <div style="font-size:16px;font-weight:700;">
      13. 전시영역 소스 보기
      <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">패널별 DispPanel 소스 코드</span>
    </div>
    <button @click="copySource" style="margin-left:auto;font-size:12px;padding:4px 14px;border:1px solid #ddd;border-radius:6px;cursor:pointer;"
      :style="copied?'background:#e8f5e9;border-color:#a5d6a7;color:#2e7d32;font-weight:600;':'background:#fff;color:#555;'">
      {{ copied ? '✓ 전체 복사됨' : '📋 전체 소스 복사' }}
    </button>
  </div>

  <!-- 필터 바 -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
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
        style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;"
        :style="selectedCatIds.size>0?'border-color:#8e44ad;color:#8e44ad;font-weight:600;':''">
        📂 {{ catBtnLabel }}
      </button>

      <!-- 화면영역 멀티선택 -->
      <div style="position:relative;">
        <button @click="showAreaDrop=!showAreaDrop"
          style="font-size:12px;padding:4px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:6px;"
          :style="selectedAreas.size>0?'border-color:#e8587a;color:#e8587a;font-weight:600;':''">
          <span>🗂 {{ areaBtnLabel }}</span>
          <span style="font-size:10px;">{{ showAreaDrop ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showAreaDrop" @click="showAreaDrop=false" style="position:fixed;inset:0;z-index:99;"></div>
        <div v-if="showAreaDrop" style="position:absolute;left:0;top:calc(100% + 4px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:220px;max-height:300px;overflow-y:auto;padding:8px 0;">
          <div style="display:flex;gap:6px;padding:6px 12px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="selectAllAreas" style="font-size:11px;padding:2px 8px;border:1px solid #1565c0;border-radius:6px;background:#e3f2fd;color:#1565c0;cursor:pointer;">전체선택</button>
            <button @click.stop="clearAllAreas"  style="font-size:11px;padding:2px 8px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#888;cursor:pointer;">전체해제</button>
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

    <!-- 카테고리 선택 현황 -->
    <div v-if="selectedCatIds.size>0" style="margin-top:6px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span style="font-size:11px;color:#8e44ad;font-weight:600;">📂 카테고리 필터:</span>
      <span v-for="nm in selectedCatNames" :key="nm"
        style="font-size:11px;background:#f3e5f5;color:#8e44ad;border-radius:8px;padding:2px 8px;">{{ nm }}</span>
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

  <!-- 영역별 패널+소스 목록 -->
  <div v-if="panelsByArea.length===0" style="text-align:center;padding:48px;color:#ccc;font-size:13px;">
    조건에 맞는 영역/패널이 없습니다.
  </div>

  <div v-for="{ area, panels } in panelsByArea" :key="area.codeValue" style="margin-bottom:14px;">

    <!-- 영역 헤더 -->
    <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#1e3a5f;color:#fff;border-radius:6px 6px 0 0;">
      <span style="font-size:10px;background:rgba(255,255,255,.18);border-radius:4px;padding:2px 8px;font-family:monospace;letter-spacing:.5px;">{{ area.codeValue }}</span>
      <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
      <span style="margin-left:auto;font-size:11px;background:rgba(255,255,255,.15);border-radius:8px;padding:2px 9px;">패널 {{ panels.length }}개</span>
    </div>

    <!-- 패널 없음 -->
    <div v-if="panels.length===0"
      style="padding:18px;text-align:center;font-size:12px;color:#bbb;background:#f9f9f9;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;">
      해당 조건의 패널이 없습니다.
    </div>

    <!-- 패널별 카드 (좌: 패널정보 | 중앙: 위젯 콘텐츠 | 우: 소스) -->
    <div v-for="(panel, pi) in panels" :key="panel.dispId"
      style="display:flex;flex-wrap:wrap;border:1px solid #e0e0e0;border-top:none;"
      :style="pi===panels.length-1?'border-radius:0 0 6px 6px;overflow:hidden;':''">

      <!-- 좌: 패널 정보 -->
      <div style="width:155px;flex-shrink:0;padding:10px 12px;background:#fafafa;border-right:1px solid #e8e8e8;">
        <div style="font-size:9px;background:#e8f0fe;color:#1a73e8;border-radius:3px;padding:1px 5px;display:inline-block;margin-bottom:5px;font-weight:600;">DispPanel</div>
        <code style="display:block;font-size:10px;color:#888;margin-bottom:4px;">#{{ String(panel.dispId).padStart(4,'0') }}</code>
        <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-bottom:6px;line-height:1.4;word-break:keep-all;">{{ panel.name }}</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px;">
          <span style="font-size:9px;border-radius:6px;padding:1px 6px;"
            :style="panel.status==='활성'?'background:#e8f5e9;color:#2e7d32;':'background:#f5f5f5;color:#999;'">{{ panel.status }}</span>
          <span style="font-size:9px;background:#e3f2fd;color:#1565c0;border-radius:6px;padding:1px 6px;">{{ panel.condition || '항상 표시' }}</span>
          <span v-if="panel.authRequired" style="font-size:9px;background:#fce4ec;color:#c62828;border-radius:6px;padding:1px 6px;">인증</span>
          <span v-if="panel.authGrade" style="font-size:9px;background:#f3e5f5;color:#6a1b9a;border-radius:6px;padding:1px 6px;">{{ panel.authGrade }}↑</span>
        </div>
        <div v-if="panel.dispStartDate||panel.dispEndDate" style="font-size:9px;color:#aaa;margin-top:4px;">
          📅 {{ panel.dispStartDate||'∞' }} ~ {{ panel.dispEndDate||'∞' }}
        </div>
        <div style="font-size:9px;color:#bbb;margin-top:6px;">위젯 {{ (panel.rows||[]).length }}개</div>
      </div>

      <!-- 중앙: 위젯 콘텐츠 미리보기 -->
      <div style="flex:1;min-width:0;background:#fff;border-right:1px solid #e8e8e8;">
        <div v-if="!panel.rows||panel.rows.length===0"
          style="padding:24px;text-align:center;font-size:12px;color:#ccc;">(위젯 없음)</div>
        <div v-for="(w, wi) in (panel.rows||[])" :key="wi"
          style="border-bottom:1px solid #f0f0f0;padding:10px 14px;">
          <!-- 위젯 헤더 -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <span style="font-size:10px;color:#bbb;">위젯{{ wi+1 }}</span>
            <span style="font-size:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:3px;padding:1px 5px;white-space:nowrap;">{{ wIcon(w.widgetType) }} {{ wLabel(w.widgetType) }}</span>
            <span v-if="w.widgetNm" style="font-size:11px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ w.widgetNm }}</span>
          </div>
          <!-- 위젯 콘텐츠 렌더링 -->
          <div v-if="w.widgetType==='image_banner'"
            style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;padding:22px 14px;text-align:center;color:#fff;">
            <div style="font-size:26px;">🖼</div>
            <div style="font-size:13px;font-weight:700;margin-top:5px;">{{ w.widgetNm }}</div>
            <div v-if="w.clickTarget" style="font-size:10px;opacity:.8;margin-top:3px;">→ {{ w.clickTarget }}</div>
          </div>
          <div v-else-if="w.widgetType==='product_slider'">
            <div style="display:flex;gap:6px;overflow:hidden;">
              <div v-for="n in 4" :key="n" style="flex:0 0 90px;border:1px solid #ececec;border-radius:6px;overflow:hidden;">
                <div style="height:60px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);display:flex;align-items:center;justify-content:center;font-size:20px;">📦</div>
                <div style="padding:5px 6px;"><div style="font-size:9px;color:#555;">상품명</div><div style="font-size:11px;font-weight:700;color:#e8587a;">₩00,000</div></div>
              </div>
            </div>
          </div>
          <div v-else-if="w.widgetType==='product'" style="display:flex;gap:10px;align-items:center;">
            <div style="width:70px;height:70px;background:linear-gradient(135deg,#f0f0f0,#e4e4e4);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">📦</div>
            <div><div style="font-size:10px;color:#aaa;">단품 상품</div><div style="font-size:13px;font-weight:700;">상품명</div><div style="font-size:14px;font-weight:800;color:#e8587a;">₩00,000</div></div>
          </div>
          <div v-else-if="w.widgetType==='cond_product'">
            <div v-for="n in 2" :key="n" style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f5;">
              <div style="width:36px;height:36px;background:#f0f0f0;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:16px;">📦</div>
              <div><div style="font-size:11px;color:#444;">상품명 {{ n }}</div><div style="font-size:11px;font-weight:700;color:#e8587a;">₩00,000</div></div>
            </div>
          </div>
          <div v-else-if="w.widgetType==='chart_bar'">
            <div style="display:flex;align-items:flex-end;gap:4px;height:70px;border-bottom:1px solid #eee;">
              <div v-for="(h,ci) in [55,78,42,88,65,92,70]" :key="ci" style="flex:1;border-radius:3px 3px 0 0;" :style="'height:'+h+'%;background:linear-gradient(180deg,#667eea,#764ba2);'"></div>
            </div>
            <div style="display:flex;justify-content:space-around;margin-top:3px;">
              <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" style="font-size:9px;color:#aaa;">{{ d }}</span>
            </div>
          </div>
          <div v-else-if="w.widgetType==='chart_line'">
            <svg viewBox="0 0 240 70" style="width:100%;height:70px;">
              <polyline points="0,55 34,38 68,48 102,16 136,28 170,10 204,20 240,14" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linejoin="round"/>
              <polyline points="0,55 34,38 68,48 102,16 136,28 170,10 204,20 240,14 240,70 0,70" fill="#667eea" opacity=".1"/>
            </svg>
          </div>
          <div v-else-if="w.widgetType==='chart_pie'" style="display:flex;align-items:center;gap:12px;">
            <svg viewBox="0 0 100 100" style="width:70px;height:70px;flex-shrink:0;">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#667eea" stroke-width="24" stroke-dasharray="72 28" stroke-dashoffset="25"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f6ad55" stroke-width="24" stroke-dasharray="17 83" stroke-dashoffset="-47"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#68d391" stroke-width="24" stroke-dasharray="11 89" stroke-dashoffset="-64"/>
            </svg>
            <div style="font-size:10px;"><div style="margin-bottom:3px;"><span style="display:inline-block;width:7px;height:7px;background:#667eea;border-radius:50%;margin-right:4px;"></span>카테고리A 72%</div><div style="margin-bottom:3px;"><span style="display:inline-block;width:7px;height:7px;background:#f6ad55;border-radius:50%;margin-right:4px;"></span>카테고리B 17%</div><div><span style="display:inline-block;width:7px;height:7px;background:#68d391;border-radius:50%;margin-right:4px;"></span>기타 11%</div></div>
          </div>
          <div v-else-if="w.widgetType==='text_banner'"
            style="background:#f8f9fa;border-left:4px solid #667eea;border-radius:0 8px 8px 0;padding:12px 14px;">
            <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:4px;">{{ w.widgetNm }}</div>
            <div style="font-size:11px;color:#666;line-height:1.7;">텍스트 배너 컨텐츠가 이 영역에 표시됩니다.</div>
          </div>
          <div v-else-if="w.widgetType==='info_card'"
            style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;">ℹ</div>
            <div><div style="font-size:12px;font-weight:700;color:#1565c0;">{{ w.widgetNm }}</div><div style="font-size:11px;color:#1976d2;">정보 카드 컨텐츠 영역입니다.</div></div>
          </div>
          <div v-else-if="w.widgetType==='popup'"
            style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
            <div style="background:#f5f5f5;padding:6px 10px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;">
              <span style="font-size:10px;font-weight:700;color:#555;">팝업</span><span style="color:#aaa;">×</span>
            </div>
            <div style="padding:16px;text-align:center;"><div style="font-size:22px;margin-bottom:5px;">💬</div><div style="font-size:12px;font-weight:700;">{{ w.widgetNm }}</div></div>
          </div>
          <div v-else-if="w.widgetType==='file'"
            style="display:flex;align-items:center;gap:10px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:12px;">
            <span style="font-size:24px;">📎</span>
            <div><div style="font-size:12px;font-weight:700;">{{ w.widgetNm }}</div><div style="font-size:10px;color:#999;">파일 다운로드</div></div>
          </div>
          <div v-else-if="w.widgetType==='file_list'">
            <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0f0f0;">
              <span style="font-size:16px;">📁</span><span style="font-size:11px;color:#555;flex:1;">파일명_{{ n }}.pdf</span><span style="font-size:10px;color:#aaa;">1.{{ n }}MB</span>
            </div>
          </div>
          <div v-else-if="w.widgetType==='coupon'"
            style="border:2px dashed #e8587a;border-radius:8px;padding:14px;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#fff5f7,#fce4ec);">
            <div style="font-size:28px;">🎟</div>
            <div style="flex:1;"><div style="font-size:13px;font-weight:800;color:#c2185b;">{{ w.widgetNm }}</div><div style="font-size:10px;color:#e8587a;">쿠폰 발급 이벤트</div></div>
            <div style="background:#e8587a;color:#fff;border-radius:6px;padding:8px 12px;font-size:11px;font-weight:700;white-space:nowrap;">쿠폰 받기</div>
          </div>
          <div v-else-if="w.widgetType==='html_editor'"
            style="background:#1e1e2e;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;color:#a9b7c6;line-height:1.8;">
            <span style="color:#cc7832;">&lt;div&gt;</span><br>
            <span style="padding-left:14px;">&nbsp;&nbsp;HTML 컨텐츠 영역 ({{ w.widgetNm }})</span><br>
            <span style="color:#cc7832;">&lt;/div&gt;</span>
          </div>
          <div v-else-if="w.widgetType==='event_banner'"
            style="background:linear-gradient(135deg,#f093fb,#f5576c);border-radius:8px;padding:18px;text-align:center;color:#fff;">
            <div style="font-size:22px;margin-bottom:6px;">🎉</div>
            <div style="font-size:14px;font-weight:800;">{{ w.widgetNm }}</div>
          </div>
          <div v-else-if="w.widgetType==='cache_banner'"
            style="background:linear-gradient(135deg,#f6d365,#fda085);border-radius:8px;padding:14px;display:flex;align-items:center;gap:12px;color:#fff;">
            <div style="font-size:28px;">💰</div>
            <div><div style="font-size:11px;opacity:.85;">적립금 / 캐시</div><div style="font-size:18px;font-weight:800;">+0,000P</div></div>
          </div>
          <div v-else-if="w.widgetType==='widget_embed'"
            style="border:2px dashed #a0aec0;border-radius:8px;padding:18px;text-align:center;background:#f7fafc;">
            <div style="font-size:22px;margin-bottom:5px;">🧩</div>
            <div style="font-size:12px;font-weight:700;color:#4a5568;">{{ w.widgetNm }}</div>
            <div style="font-size:10px;color:#a0aec0;">외부 위젯 임베드</div>
          </div>
          <div v-else style="background:#f5f5f5;border-radius:8px;padding:14px;text-align:center;color:#888;">
            <div style="font-size:20px;margin-bottom:4px;">{{ wIcon(w.widgetType) }}</div>
            <div style="font-size:11px;">{{ wLabel(w.widgetType) }}</div>
          </div>
        </div>
      </div>

      <!-- 우: 소스 코드 -->
      <div style="width:260px;flex-shrink:0;background:#161b22;position:relative;display:flex;flex-direction:column;">
        <button @click="copyPanel(panel)"
          style="position:absolute;top:6px;right:8px;font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid;cursor:pointer;z-index:1;"
          :style="copiedPanel===panel.dispId?'background:rgba(46,125,50,.35);color:#81c784;border-color:rgba(129,199,132,.4);':'background:rgba(255,255,255,.06);color:#888;border-color:rgba(255,255,255,.12);'">
          {{ copiedPanel===panel.dispId ? '✓ 복사됨' : '📋' }}
        </button>
        <pre style="margin:0;padding:12px 12px 12px 14px;font-family:'Consolas','Menlo',monospace;font-size:11px;line-height:1.75;overflow-x:auto;white-space:pre;flex:1;"
          v-html="panelSourceHtml(panel)"></pre>
      </div>

    </div>
  </div>

</div>

<category-select-modal
  :show="showCatModal"
  :selected-ids="[...selectedCatIds]"
  @close="showCatModal=false"
  @apply="onCatApply"
/>
  `,
};
