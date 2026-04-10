/* ShopJoy Admin - 전시영역미리보기 (날짜·회원 조건별 미리보기) */
window.DispAreaPreview = {
  name: 'DispAreaPreview',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');

    /* ── 오늘 날짜 ── */
    const today = new Date().toISOString().slice(0, 10);

    /* ── 필터 상태 ── */
    const previewDate  = ref(today);
    const targetMember = ref('nologin');   // nologin | login-normal | login-good | login-vip
    const viewMode     = ref('card');      // card | expand
    const showDesc     = ref(true);        // 설명(areaLabel) 표시 여부
    const showAreaDrop = ref(false);       // 화면영역 드롭다운 열림
    const selectedAreas = reactive(new Set()); // 선택된 영역 코드들 (empty = 전체)

    const MEMBER_OPTS = [
      { value: 'nologin',     label: '비로그인',        isLoggedIn: false, grade: '' },
      { value: 'login-normal',label: '로그인 (일반)',    isLoggedIn: true,  grade: '일반' },
      { value: 'login-good',  label: '로그인 (우수)',    isLoggedIn: true,  grade: '우수' },
      { value: 'login-vip',   label: '로그인 (VIP)',     isLoggedIn: true,  grade: 'VIP' },
    ];

    const memberInfo = computed(() => MEMBER_OPTS.find(m => m.value === targetMember.value) || MEMBER_OPTS[0]);
    const isLoggedIn  = computed(() => memberInfo.value.isLoggedIn);
    const userGrade   = computed(() => memberInfo.value.grade);

    /* ── 화면영역 코드 전체 목록 ── */
    const allAreaListRaw = computed(() =>
      (props.adminData.codes || [])
        .filter(c => c.codeGrp === 'DISP_AREA' && c.useYn === 'Y')
        .sort((a, b) => a.sortOrd - b.sortOrd)
    );

    /* ── 표시할 영역 목록 (selectedAreas 필터) ── */
    const areaList = computed(() => {
      const all = allAreaListRaw.value;
      if (selectedAreas.size === 0) return all;
      return all.filter(c => selectedAreas.has(c.codeValue));
    });

    /* ── 영역 멀티선택 토글 ── */
    const toggleArea = (code) => {
      if (selectedAreas.has(code)) selectedAreas.delete(code);
      else selectedAreas.add(code);
    };
    const selectAllAreas  = () => { allAreaListRaw.value.forEach(a => selectedAreas.add(a.codeValue)); };
    const clearAllAreas   = () => { selectedAreas.clear(); };
    const areaBtnLabel    = computed(() => {
      const sz = selectedAreas.size;
      return sz === 0 ? '전체 영역' : `${sz}개 영역 선택`;
    });

    /* ── 날짜 범위 내 패널 여부 판단 ── */
    const isDateInRange = (panel) => {
      const d = previewDate.value;
      if (!d) return true;
      if (panel.dispStartDate && d < panel.dispStartDate) return false;
      if (panel.dispEndDate   && d > panel.dispEndDate)   return false;
      return true;
    };

    /* ── 영역별 필터된 패널 반환 ── */
    const panelsForArea = (areaCode) =>
      (props.adminData.displays || [])
        .filter(p => p.area === areaCode && p.status === '활성' && isDateInRange(p))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    /* ── 전체 활성 패널 수 ── */
    const totalPanels = computed(() =>
      (props.adminData.displays || []).filter(p => p.status === '활성' && isDateInRange(p)).length
    );

    /* ── 날짜 리셋 ── */
    const resetDate = () => { previewDate.value = today; };

    return {
      previewDate, targetMember, viewMode, showDesc, showAreaDrop, siteName,
      selectedAreas, allAreaListRaw, areaList,
      MEMBER_OPTS, memberInfo, isLoggedIn, userGrade,
      toggleArea, selectAllAreas, clearAllAreas, areaBtnLabel,
      panelsForArea, totalPanels,
      today, resetDate,
    };
  },
  template: /* html */`
<div>
  <div class="page-title" style="display:flex;align-items:center;justify-content:space-between;">
    <div>
      전시영역미리보기
      <span style="font-size:13px;font-weight:400;color:#888;">화면영역별 전시패널 미리보기</span>
    </div>
    <span style="font-size:12px;background:#e8f0fe;color:#1565c0;border:1px solid #bbdefb;border-radius:10px;padding:3px 12px;font-weight:600;">
      🌐 {{ siteName }}
    </span>
  </div>

  <!-- ── 필터 바 ── -->
  <div class="card" style="padding:14px 18px;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">

      <!-- 날짜 (필수) -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:#555;">📅 기준 날짜 <span style="color:#e8587a;">*</span></span>
        <input type="date" v-model="previewDate" class="form-control"
          style="width:150px;margin:0;font-size:13px;" />
        <button @click="resetDate"
          style="font-size:11px;padding:4px 10px;border:1px solid #d0d0d0;border-radius:10px;background:#fff;cursor:pointer;color:#888;">오늘</button>
      </div>

      <div style="width:1px;height:28px;background:#e0e0e0;"></div>

      <!-- 대상 회원 -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:#555;">👤 대상 회원</span>
        <div style="display:flex;gap:4px;">
          <button v-for="m in MEMBER_OPTS" :key="m.value"
            @click="targetMember = m.value"
            style="font-size:11px;padding:4px 10px;border-radius:12px;border:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="targetMember===m.value
              ? 'background:#e8587a;border-color:#e8587a;color:#fff;font-weight:600;'
              : 'background:#fff;color:#666;'">
            {{ m.label }}
          </button>
        </div>
      </div>

      <div style="width:1px;height:28px;background:#e0e0e0;"></div>

      <!-- 보기 모드 -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:12px;font-weight:600;color:#555;">👁 보기</span>
        <div style="display:flex;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
          <button @click="viewMode='card'"
            style="font-size:11px;padding:4px 12px;border:none;cursor:pointer;transition:all .15s;"
            :style="viewMode==='card' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            🖼 카드
          </button>
          <button @click="viewMode='expand'"
            style="font-size:11px;padding:4px 12px;border:none;border-left:1px solid #ddd;cursor:pointer;transition:all .15s;"
            :style="viewMode==='expand' ? 'background:#333;color:#fff;font-weight:600;' : 'background:#fff;color:#666;'">
            ⊞ 펼침
          </button>
        </div>
      </div>

      <div style="width:1px;height:28px;background:#e0e0e0;"></div>

      <!-- 설명보기 토글 -->
      <button @click="showDesc = !showDesc"
        style="font-size:11px;padding:4px 12px;border-radius:10px;border:1px solid #ddd;cursor:pointer;transition:all .15s;"
        :style="showDesc ? 'background:#e3f2fd;border-color:#90caf9;color:#1565c0;' : 'background:#fff;color:#999;'">
        {{ showDesc ? '📋 설명 숨기기' : '📋 설명 보기' }}
      </button>

      <!-- 화면 영역 멀티선택 (오른쪽 끝) -->
      <div style="margin-left:auto;position:relative;">
        <!-- 드롭다운 열기 버튼 -->
        <button @click="showAreaDrop = !showAreaDrop"
          style="font-size:12px;padding:5px 14px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;
                 display:flex;align-items:center;gap:6px;color:#333;min-width:140px;justify-content:space-between;"
          :style="selectedAreas.size > 0 ? 'border-color:#e8587a;color:#e8587a;font-weight:600;' : ''">
          <span>🗂 {{ areaBtnLabel }}</span>
          <span style="font-size:10px;">{{ showAreaDrop ? '▲' : '▼' }}</span>
        </button>

        <!-- 클릭 아웃사이드 오버레이 -->
        <div v-if="showAreaDrop" @click="showAreaDrop=false"
          style="position:fixed;inset:0;z-index:99;"></div>

        <!-- 드롭다운 패널 -->
        <div v-if="showAreaDrop"
          style="position:absolute;right:0;top:calc(100% + 6px);z-index:100;background:#fff;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:240px;max-height:320px;overflow-y:auto;padding:10px 0;">
          <!-- 전체선택/해제 버튼 -->
          <div style="display:flex;gap:8px;padding:8px 14px 6px;border-bottom:1px solid #f0f0f0;">
            <button @click.stop="selectAllAreas"
              style="font-size:11px;padding:3px 10px;border:1px solid #1565c0;border-radius:8px;background:#e3f2fd;color:#1565c0;cursor:pointer;">
              전체선택
            </button>
            <button @click.stop="clearAllAreas"
              style="font-size:11px;padding:3px 10px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#888;cursor:pointer;">
              전체해제
            </button>
            <span style="font-size:10px;color:#aaa;margin-left:auto;align-self:center;">
              {{ selectedAreas.size }}/{{ allAreaListRaw.length }}
            </span>
          </div>
          <!-- 영역 체크박스 목록 -->
          <div v-for="area in allAreaListRaw" :key="area.codeValue"
            @click.stop="toggleArea(area.codeValue)"
            style="display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;transition:background .1s;"
            :style="selectedAreas.has(area.codeValue) ? 'background:#fff8f8;' : ''"
            @mouseenter="$event.currentTarget.style.background = selectedAreas.has(area.codeValue) ? '#fce4ec' : '#f8f8f8'"
            @mouseleave="$event.currentTarget.style.background = selectedAreas.has(area.codeValue) ? '#fff8f8' : ''">
            <div style="width:16px;height:16px;border-radius:4px;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;"
              :style="selectedAreas.has(area.codeValue) ? 'border-color:#e8587a;background:#e8587a;' : 'border-color:#ccc;background:#fff;'">
              <span v-if="selectedAreas.has(area.codeValue)" style="color:#fff;font-size:11px;line-height:1;">✓</span>
            </div>
            <code style="font-size:10px;background:#f5f5f5;padding:1px 5px;border-radius:3px;color:#555;">{{ area.codeValue }}</code>
            <span style="font-size:12px;color:#333;">{{ area.codeLabel }}</span>
          </div>
          <!-- 닫기 -->
          <div style="border-top:1px solid #f0f0f0;padding:8px 14px;">
            <button @click.stop="showAreaDrop=false"
              style="font-size:11px;width:100%;padding:5px;border:1px solid #e0e0e0;border-radius:6px;background:#f8f8f8;color:#666;cursor:pointer;">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택된 영역 배지 -->
    <div v-if="selectedAreas.size > 0" style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:11px;color:#aaa;">선택 영역:</span>
      <span v-for="code in [...selectedAreas]" :key="code"
        style="font-size:11px;background:#fce4ec;color:#c62828;border-radius:10px;padding:2px 8px;display:flex;align-items:center;gap:4px;">
        {{ code }}
        <span @click="toggleArea(code)" style="cursor:pointer;font-weight:700;">×</span>
      </span>
    </div>

    <!-- 조건 요약 배지 -->
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center;"
      :style="selectedAreas.size > 0 ? 'margin-top:6px;' : ''">
      <span style="font-size:11px;color:#aaa;">미리보기 조건:</span>
      <span style="font-size:12px;background:#fff8e1;color:#f57c00;border-radius:10px;padding:2px 10px;">
        📅 {{ previewDate }}
      </span>
      <span style="font-size:12px;border-radius:10px;padding:2px 10px;"
        :style="isLoggedIn ? 'background:#e8f5e9;color:#2e7d32;' : 'background:#fce4ec;color:#c62828;'">
        {{ isLoggedIn ? '🔓 ' + memberInfo.label : '🔒 비로그인' }}
      </span>
      <span v-if="isLoggedIn && userGrade" style="font-size:12px;background:#f3e5f5;color:#6a1b9a;border-radius:10px;padding:2px 10px;">
        등급: {{ userGrade }}
      </span>
      <span style="font-size:12px;background:#e3f2fd;color:#1565c0;border-radius:10px;padding:2px 10px;margin-left:auto;">
        활성 패널 {{ totalPanels }}개 해당
      </span>
    </div>
  </div>

  <!-- ── 영역별 렌더링 ── -->
  <div v-if="!previewDate" style="text-align:center;padding:40px;color:#e8587a;font-size:14px;">
    기준 날짜를 선택해주세요.
  </div>
  <div v-else>
    <div v-for="area in areaList" :key="area.codeValue" style="margin-bottom:4px;">
      <disp-area
        :area="area.codeValue"
        :area-label="area.codeLabel"
        :panels="panelsForArea(area.codeValue)"
        :mode="viewMode"
        :show-desc="showDesc"
        :is-logged-in="isLoggedIn"
        :user-grade="userGrade"
      />
    </div>
    <div v-if="areaList.length===0" style="text-align:center;padding:40px;color:#ccc;font-size:14px;">
      등록된 화면영역이 없습니다.
    </div>
  </div>
</div>
`
};
