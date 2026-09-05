/* ShopJoy FO 모듈 - 코바늘 도안 목록 (검색 + 전체 회원 공개 도안 조회) */
window.MdCbPatternListPage = {
  name: 'MdCbPatternListPage',
  props: {
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {
    const { reactive, ref, onMounted } = Vue;

    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 12, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [12, 24, 48] });
    const rows = reactive([]);
    const loading = ref(false);
    /* viewMode — 일반목록(list, 기본) / 카드형식(card). 마지막 선택을 브라우저에 기억(다른 화면 영향 없음) */
    const viewMode = ref(localStorage.getItem('modu-md-cb-pattern-viewmode') || 'list');
    const onSetViewMode = (m) => { viewMode.value = m; localStorage.setItem('modu-md-cb-pattern-viewmode', m); };

    /* fnLoad — 검색어/페이지 기준 도안 목록 조회(전체 회원 공개, 권한 구분 없음) */
    const fnLoad = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize };
        if (searchParam.searchValue) params.searchValue = searchParam.searchValue;
        const res = await mdCbApiSvc.pattern.getPage(params, '코바늘도안목록', '조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
      } finally {
        loading.value = false;
      }
    };

    /* onSearch — [조회] 버튼/Enter 입력 시에만 재조회(입력 즉시 반응 금지 정책) */
    const onSearch = () => { pager.pageNo = 1; fnLoad(); };
    const onSetPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };

    /* onOpen / onNew — 상세(편집) 화면은 별도 뷰라 쿼리스트링으로 이동한다 */
    const onOpen = (row) => { location.href = 'fo-md-cb-cobanul.html?view=editor&patternId=' + encodeURIComponent(row.patternId); };
    const onNew = () => { location.href = 'fo-md-cb-cobanul.html?view=editor'; };

    const fnFmtDate = (d) => (d ? String(d).slice(0, 10) : '-');

    /* fnThumbStyle — 실 사진이 없으므로 도안ID 기반 해시 색상의 그라데이션 썸네일을 대신 사용 */
    const fnThumbStyle = (id) => {
      let h = 0;
      for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
      return 'background:linear-gradient(135deg, hsl(' + h + ',72%,90%), hsl(' + ((h + 40) % 360) + ',68%,80%));';
    };

    /* fnPatternType — 도안을 3가지로 분류해 배지로 표시.
       원형 도안: roundDescText 가 있으면 (격자보다 우선 — 원형 전용으로 만든 도안).
       배색 도안: 격자 셀에 서로 다른 색이 2가지 이상 쓰였으면(distinctColorCount, 목록 API가 서브쿼리로 계산해서 내려줌).
       기호 도안: 그 외 전부(단색이거나 색 없이 기호만 쓴 격자). */
    const fnPatternType = (p) => {
      if (p.roundDescText && p.roundDescText.trim()) return { icon: '🌀', label: '원형 도안', cls: 'round' };
      if (Number(p.distinctColorCount) >= 2) return { icon: '🎨', label: '배색 도안', cls: 'color' };
      return { icon: '🧩', label: '기호 도안', cls: 'symbol' };
    };

    /* "내 코바늘 도안" 메뉴(?mine=1)로 들어오면 검색어에 내 회원명만 채워서 조회 —
       별도 memberId 필터 API 없이 기존 작성자 검색(searchValue)을 그대로 재사용 */
    onMounted(() => {
      const qs = new URLSearchParams(location.search);
      if (qs.get('mine') === '1') {
        const myNm = window.foAuth?.state?.user?.memberNm;
        if (myNm) searchParam.searchValue = myNm;
      }
      fnLoad();
    });

    /* ##### 컬럼정의 — fo-grid 전환(2026-08-25). 번호/#는 pager 전달 시 자동. */
    const baseGridColumns = [
      { key: '_thumb',   label: '', width: '44px' },
      { key: 'patternNm', label: '도안명' },
      { key: '_size',    label: '규격', width: '110px', fmt: (v, r) => r.rowCount + '단 × ' + r.maxStitchCount + '코' },
      { key: '_author',  label: '작성자', width: '120px', fmt: (v, r) => r.regUserNm || r.memberNm || '알 수 없음' },
      { key: 'regDate',  label: '등록일', width: '100px', fmt: (v) => fnFmtDate(v) },
      { key: '_arrow',   label: '', width: '28px', cellClass: 'cb-list-table-arrow', fmt: () => '›' },
    ];

    return { searchParam, pager, rows, loading, onSearch, onSetPage, onSizeChange, onOpen, onNew, fnFmtDate, fnThumbStyle, fnPatternType,
      viewMode, onSetViewMode, baseGridColumns };
  },
  template: /* html */`
<div class="cb-page">
  <div class="cb-hero">
    <div class="cb-hero-eyebrow">CROCHET PATTERN</div>
    <h1 class="cb-hero-title">🧶 코바늘 도안</h1>
    <div class="cb-hero-sub">기호로 도안을 그리고, 한글 설명까지 자동으로 완성해보세요</div>
  </div>

  <div class="cb-list-head">
    <div class="cb-search-bar">
      <input v-model="searchParam.searchValue" @keyup.enter="onSearch" placeholder="도안명, 설명, 작성자로 검색" class="form-control cb-search-input" />
      <button class="btn btn_search" @click="onSearch" :disabled="loading">조회</button>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="cb-view-toggle">
        <button :class="{active: viewMode==='list'}" title="일반목록" @click="onSetViewMode('list')">☰</button>
        <button :class="{active: viewMode==='card'}" title="카드형식" @click="onSetViewMode('card')">▦</button>
      </div>
      <button class="btn btn_new" @click="onNew">+ 신규 도안</button>
    </div>
  </div>

  <div class="cb-list-count">총 {{ pager.pageTotalCount }}개 도안</div>

  <!-- 카드형식 — fo-grid layout="card" 전환(2026-08-25). 카드 내용은 그대로 #card 슬롯으로,
       컨테이너(반응형 그리드)·로딩·빈상태는 fo-grid 가 담당한다. -->
  <fo-grid v-if="viewMode==='card'" layout="card" card-min-width="240px" card-class="cb-pattern-card"
    :columns="baseGridColumns" :rows="rows" row-key="patternId" bare
    :loading="loading" :row-click="onOpen" empty-text="검색 결과가 없습니다.">
    <template #card="{ row: p }">
      <div class="cb-pattern-thumb" :style="p.thumbnailUrl ? '' : fnThumbStyle(p.patternId)">
        <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" class="cb-pattern-thumb-img" />
        <span v-else class="cb-pattern-thumb-icon">🧶</span>
      </div>
      <div class="cb-pattern-card-body">
        <div class="cb-pattern-badges">
          <span class="cb-badge cb-badge-mono">#{{ p.patternId }}</span>
          <span class="cb-badge">{{ p.rowCount }}단 × {{ p.maxStitchCount }}코</span>
          <span class="cb-badge" :class="'cb-badge-' + fnPatternType(p).cls">{{ fnPatternType(p).icon }} {{ fnPatternType(p).label }}</span>
        </div>
        <div class="cb-pattern-card-nm">{{ p.patternNm }}</div>
        <div class="cb-pattern-card-meta">
          <span class="cb-pattern-card-author">✍ {{ p.regUserNm || p.memberNm || '알 수 없음' }}</span>
          <span class="cb-pattern-card-date">{{ fnFmtDate(p.regDate) }}</span>
        </div>
        <button class="btn btn_detail cb-card-btn" @click.stop="onOpen(p)">상세보기</button>
      </div>
    </template>
  </fo-grid>

  <!-- 일반목록(기본) — fo-grid 전환(2026-08-25). 행 전체 클릭은 row-click, 번호는 pager 로 자동. -->
  <fo-grid v-else :columns="baseGridColumns" :rows="rows" row-key="patternId" :pager="pager"
    bare :row-click="onOpen" empty-text="검색 결과가 없습니다.">
    <template #cell-_thumb="{ row: p }">
      <div class="cb-list-thumb" :style="p.thumbnailUrl ? '' : fnThumbStyle(p.patternId)">
        <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" class="cb-list-thumb-img" />
        <span v-else class="cb-list-thumb-icon">🧶</span>
      </div>
    </template>
    <template #cell-patternNm="{ row: p }">
      <span class="cb-list-table-nm">
        {{ p.patternNm }}
        <span class="cb-badge cb-badge-inline" :class="'cb-badge-' + fnPatternType(p).cls">{{ fnPatternType(p).icon }} {{ fnPatternType(p).label }}</span>
      </span>
    </template>
  </fo-grid>

  <fo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</div>
`,
};
