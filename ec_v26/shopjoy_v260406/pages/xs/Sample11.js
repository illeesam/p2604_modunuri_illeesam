/* ShopJoy - Sample11: 전시영역 미리보기 (Tab1 미리보기) */
window.XsSample11 = {
  name: 'XsSample11',
  components: { 'category-select-modal': window.CategorySelectModal },
  setup() {
    const { ref, reactive, computed } = Vue;

    const today = new Date().toISOString().slice(0, 10);
    const previewDate = ref(today);
    const previewTime = ref(new Date().toTimeString().slice(0, 5));
    const viewMode    = ref('card');   // 'list' | 'card' | 'expand'
    const showDesc    = ref(true);
    const showAreaDrop = ref(false);
    const selectedAreas = reactive(new Set());

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

    /* 검색 필터 (기본값: 현재 사용자 상태 반영) */
    const searchStatus       = ref('활성');
    const searchCondition    = ref('');
    const searchAuthRequired = ref('');
    const searchAuthGrade    = ref('');
    const CONDITION_OPTS  = ['항상 표시', '로그인 필요', '로그인+VIP', '로그인+우수', '비로그인 전용'];
    const AUTH_GRADE_OPTS = ['일반', '우수', 'VIP'];

    /* 현재 사용자가 접근 가능한 조건 목록 */
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

    /* 화면영역 코드 목록 */
    const allAreas = computed(() =>
      ((window.adminData || {}).codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    const areaList = computed(() => {
      if (selectedAreas.size === 0) return allAreas.value;
      return allAreas.value.filter(c => selectedAreas.has(c.codeValue));
    });

    const toggleArea     = (code) => { if (selectedAreas.has(code)) selectedAreas.delete(code); else selectedAreas.add(code); };
    const selectAllAreas = () => { allAreas.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas  = () => { selectedAreas.clear(); };
    const areaBtnLabel   = computed(() => selectedAreas.size === 0 ? '전체 영역' : `${selectedAreas.size}개 선택`);

    const resetDate = () => {
      previewDate.value = today;
      previewTime.value = new Date().toTimeString().slice(0, 5);
    };

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

    const panelsForArea = (areaCode) =>
      ((window.adminData || {}).displays || [])
        .filter(p => p.area === areaCode && panelFilter(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const totalPanels = computed(() =>
      areaList.value.reduce((sum, a) => sum + panelsForArea(a.codeValue).length, 0)
    );

    return {
      previewDate, previewTime, viewMode, showDesc, showAreaDrop,
      selectedAreas, allAreas, areaList, areaBtnLabel,
      toggleArea, selectAllAreas, clearAllAreas, resetDate,
      searchStatus, searchCondition, searchAuthRequired, searchAuthGrade,
      CONDITION_OPTS, AUTH_GRADE_OPTS,
      isLoggedIn, userGrade, userName, accessibleConds,
      showCatModal, selectedCatIds, catBtnLabel, onCatApply, selectedCatNames,
      panelsForArea, totalPanels,
      wLabel, wIcon,
    };
  },
  template: /* html */`
<div style="padding:clamp(12px,3vw,24px);">

  <!-- 제목 -->
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">
    11. 전시영역 미리보기
    <span style="font-size:12px;font-weight:400;color:#888;margin-left:8px;">화면영역별 활성 패널 목록</span>
  </div>

  <!-- 필터 바 -->
  <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">

      <!-- 전시일시 -->
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
      <div style="width:1px;height:24px;background:#e0e0e0;"></div>

      <!-- 보기 모드 -->
      <div style="display:flex;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
        <button @click="viewMode='list'" style="font-size:11px;padding:3px 10px;border:none;cursor:pointer;" :style="viewMode==='list'?'background:#333;color:#fff;':'background:#fff;color:#666;'">☰ 리스트</button>
        <button @click="viewMode='card'" style="font-size:11px;padding:3px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;" :style="viewMode==='card'?'background:#333;color:#fff;':'background:#fff;color:#666;'">🖼 카드</button>
        <button @click="viewMode='expand'" style="font-size:11px;padding:3px 10px;border:none;border-left:1px solid #ddd;cursor:pointer;" :style="viewMode==='expand'?'background:#333;color:#fff;':'background:#fff;color:#666;'">⊞ 상세</button>
      </div>

      <!-- 설명 토글 -->
      <button @click="showDesc=!showDesc" style="font-size:11px;padding:3px 10px;border-radius:8px;border:1px solid #ddd;cursor:pointer;"
        :style="showDesc?'background:#e3f2fd;border-color:#90caf9;color:#1565c0;':'background:#fff;color:#999;'">
        {{ showDesc ? '📋 설명 숨기기' : '📋 설명 보기' }}
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
          <div style="display:flex;gap:6px;padding:6px 12px 6px;border-bottom:1px solid #f0f0f0;">
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

    <!-- 조회 조건 요약 -->
    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:11px;color:#aaa;">조회 조건:</span>
      <span style="font-size:11px;background:#fff8e1;color:#f57c00;border-radius:8px;padding:2px 8px;">📅 {{ previewDate }} {{ previewTime }}</span>
      <span v-if="searchStatus" style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 8px;">상태: {{ searchStatus }}</span>
      <span v-if="searchCondition" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;">{{ searchCondition }}</span>
      <span v-if="searchAuthRequired==='Y'" style="font-size:11px;background:#fff3e0;color:#e65100;border-radius:8px;padding:2px 8px;">인증 필요</span>
      <span v-if="searchAuthRequired==='N'" style="font-size:11px;background:#fce4ec;color:#c62828;border-radius:8px;padding:2px 8px;">인증 불필요</span>
      <span v-if="searchAuthGrade" style="font-size:11px;background:#f3e5f5;color:#6a1b9a;border-radius:8px;padding:2px 8px;">등급: {{ searchAuthGrade }}↑</span>
      <template v-for="nm in selectedCatNames" :key="nm">
        <span style="font-size:11px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:2px 8px;">📂 {{ nm }}</span>
      </template>
      <span style="font-size:11px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:2px 8px;margin-left:auto;">총 {{ totalPanels }}개 패널</span>
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

  <!-- 영역별 패널 목록 -->
  <div v-if="areaList.length===0" style="text-align:center;padding:40px;color:#ccc;">등록된 화면영역이 없습니다.</div>

  <div v-for="area in areaList" :key="area.codeValue" style="margin-bottom:8px;">
    <!-- 영역 헤더 -->
    <div style="background:linear-gradient(90deg,#2d2d2d,#444);color:#fff;padding:8px 14px;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:8px;">
      <span style="font-size:10px;background:rgba(99,179,237,.35);color:#bee3f8;border:1px solid rgba(99,179,237,.4);border-radius:4px;padding:1px 6px;">영역</span>
      <code style="font-size:11px;background:rgba(255,255,255,.15);padding:2px 7px;border-radius:4px;">{{ area.codeValue }}</code>
      <span style="font-size:13px;font-weight:700;">{{ area.codeLabel }}</span>
      <span style="margin-left:auto;font-size:11px;opacity:.7;">패널 {{ panelsForArea(area.codeValue).length }}개</span>
    </div>

    <!-- 패널 없음 -->
    <div v-if="panelsForArea(area.codeValue).length===0"
      style="background:#fafafa;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;padding:12px 16px;font-size:12px;color:#bbb;">
      해당 날짜 활성 패널 없음
    </div>

    <!-- 리스트 모드 -->
    <div v-else-if="viewMode==='list'" style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
      <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId"
        style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;">
        <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#666;flex-shrink:0;">#{{ String(p.dispId).padStart(4,'0') }}</code>
        <span style="font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.name }}</span>
        <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:1px 7px;flex-shrink:0;">{{ p.status }}</span>
        <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;flex-shrink:0;">{{ p.condition || '항상 표시' }}</span>
        <span style="font-size:10px;color:#999;flex-shrink:0;">위젯 {{ (p.rows||[]).length }}개</span>
      </div>
    </div>

    <!-- 카드 모드 -->
    <div v-else-if="viewMode==='card'" style="background:#f9f9f9;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;">
      <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId"
        style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:10px 12px;min-width:180px;flex:1;max-width:260px;">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;">
          <code style="font-size:9px;background:#f0f0f0;padding:1px 4px;border-radius:3px;color:#777;">#{{ String(p.dispId).padStart(4,'0') }}</code>
          <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:6px;padding:1px 6px;">{{ p.status }}</span>
        </div>
        <div style="font-size:13px;font-weight:700;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.name }}</div>
        <div v-if="showDesc && p.description" style="font-size:11px;color:#888;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.description }}</div>
        <div style="font-size:10px;color:#999;">{{ p.condition || '항상 표시' }} · 위젯 {{ (p.rows||[]).length }}개</div>
      </div>
    </div>

    <!-- 상세(expand) 모드 -->
    <div v-else-if="viewMode==='expand'" style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
      <div v-for="p in panelsForArea(area.codeValue)" :key="p.dispId" style="border-bottom:1px solid #f0f0f0;">
        <!-- 패널 행 -->
        <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;background:#fafafa;">
          <code style="font-size:10px;background:#f0f0f0;padding:1px 5px;border-radius:3px;color:#666;">#{{ String(p.dispId).padStart(4,'0') }}</code>
          <span style="font-size:13px;font-weight:700;flex:1;">{{ p.name }}</span>
          <span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:8px;padding:1px 7px;">{{ p.status }}</span>
          <span style="font-size:10px;background:#e3f2fd;color:#1565c0;border-radius:8px;padding:1px 7px;">{{ p.condition || '항상 표시' }}</span>
        </div>
        <!-- 설명 -->
        <div v-if="showDesc && p.description" style="padding:4px 14px 4px 30px;font-size:11px;color:#888;">{{ p.description }}</div>
        <!-- 위젯 목록 -->
        <div style="padding:4px 14px 8px 30px;display:flex;flex-wrap:wrap;gap:4px;">
          <span v-if="!p.rows || p.rows.length===0" style="font-size:11px;color:#ccc;">(위젯 없음)</span>
          <span v-for="(w, wi) in (p.rows||[])" :key="wi"
            style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:6px;padding:2px 8px;">
            {{ wIcon(w.widgetType) }} {{ wLabel(w.widgetType) }}<span v-if="w.widgetNm" style="color:#aaa;"> · {{ w.widgetNm }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- 카테고리 선택 모달 -->
  <category-select-modal :show="showCatModal" :selected-ids="[...selectedCatIds]" @close="showCatModal=false" @apply="onCatApply" />

</div>
  `,
};
