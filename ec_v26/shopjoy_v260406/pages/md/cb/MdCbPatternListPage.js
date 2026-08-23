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
    const onOpen = (row) => { location.href = 'mdCbCobanul.html?view=editor&patternId=' + encodeURIComponent(row.patternId); };
    const onNew = () => { location.href = 'mdCbCobanul.html?view=editor'; };

    const fnFmtDate = (d) => (d ? String(d).slice(0, 10) : '-');

    /* fnThumbStyle — 실 사진이 없으므로 도안ID 기반 해시 색상의 그라데이션 썸네일을 대신 사용 */
    const fnThumbStyle = (id) => {
      let h = 0;
      for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
      return 'background:linear-gradient(135deg, hsl(' + h + ',72%,90%), hsl(' + ((h + 40) % 360) + ',68%,80%));';
    };

    onMounted(fnLoad);

    return { searchParam, pager, rows, loading, onSearch, onSetPage, onSizeChange, onOpen, onNew, fnFmtDate, fnThumbStyle,
      viewMode, onSetViewMode };
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

  <!-- 카드형식 -->
  <div v-if="viewMode==='card'" class="cb-card-grid">
    <div v-for="p in rows" :key="p.patternId" class="cb-pattern-card" @click="onOpen(p)">
      <div class="cb-pattern-thumb" :style="p.thumbnailUrl ? '' : fnThumbStyle(p.patternId)">
        <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" class="cb-pattern-thumb-img" />
        <span v-else class="cb-pattern-thumb-icon">🧶</span>
      </div>
      <div class="cb-pattern-card-body">
        <div class="cb-pattern-badges">
          <span class="cb-badge cb-badge-mono">#{{ p.patternId }}</span>
          <span class="cb-badge">{{ p.rowCount }}단 × {{ p.maxStitchCount }}코</span>
        </div>
        <div class="cb-pattern-card-nm">{{ p.patternNm }}</div>
        <div class="cb-pattern-card-meta">
          <span class="cb-pattern-card-author">✍ {{ p.regUserNm || p.memberNm || '알 수 없음' }}</span>
          <span class="cb-pattern-card-date">{{ fnFmtDate(p.regDate) }}</span>
        </div>
        <button class="btn btn_detail cb-card-btn" @click.stop="onOpen(p)">상세보기</button>
      </div>
    </div>
    <div v-if="!loading && !rows.length" class="cb-empty-hint" style="grid-column:1/-1;">검색 결과가 없습니다.</div>
  </div>

  <!-- 일반목록(기본) -->
  <div v-else class="cb-list-table-wrap">
    <table class="cb-list-table">
      <thead>
        <tr>
          <th style="width:60px;text-align:center;">번호</th>
          <th style="width:44px;"></th>
          <th>도안명</th>
          <th style="width:110px;">규격</th>
          <th style="width:120px;">작성자</th>
          <th style="width:100px;">등록일</th>
          <th style="width:28px;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, idx) in rows" :key="p.patternId" @click="onOpen(p)">
          <td style="text-align:center;color:var(--text-muted,#999);">{{ (pager.pageNo-1)*pager.pageSize + idx + 1 }}</td>
          <td>
            <div class="cb-list-thumb" :style="p.thumbnailUrl ? '' : fnThumbStyle(p.patternId)">
              <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" class="cb-list-thumb-img" />
              <span v-else class="cb-list-thumb-icon">🧶</span>
            </div>
          </td>
          <td class="cb-list-table-nm">{{ p.patternNm }}</td>
          <td>{{ p.rowCount }}단 × {{ p.maxStitchCount }}코</td>
          <td>{{ p.regUserNm || p.memberNm || '알 수 없음' }}</td>
          <td>{{ fnFmtDate(p.regDate) }}</td>
          <td class="cb-list-table-arrow">›</td>
        </tr>
        <tr v-if="!loading && !rows.length"><td colspan="7" class="cb-empty-hint">검색 결과가 없습니다.</td></tr>
      </tbody>
    </table>
  </div>

  <fo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</div>
`,
};
