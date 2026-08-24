/* ShopJoy FO 모듈 - 소스젠 프로젝트 목록 (검색 + 전체 회원 공개 프로젝트 조회) */
window.MdSgProjectListPage = {
  name: 'MdSgProjectListPage',
  props: {
    showToast: { type: Function, default: () => {} },                      // 토스트 알림
    showConfirm: { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { reactive, ref, onMounted } = Vue;

    const searchParam = reactive({ searchValue: '' });
    const pager = reactive({ pageNo: 1, pageSize: 12, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [12, 24, 48] });
    const rows = reactive([]);
    const loading = ref(false);
    /* viewMode — 일반목록(list, 기본) / 카드형식(card). 마지막 선택을 브라우저에 기억(다른 화면 영향 없음) */
    const viewMode = ref(localStorage.getItem('modu-md-sg-project-viewmode') || 'list');
    const onSetViewMode = (m) => { viewMode.value = m; localStorage.setItem('modu-md-sg-project-viewmode', m); };

    /* fnLoad — 검색어/페이지 기준 프로젝트 목록 조회(전체 회원 공개, 권한 구분 없음) */
    const fnLoad = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize };
        if (searchParam.searchValue) params.searchValue = searchParam.searchValue;
        const res = await mdSgApiSvc.project.getPage(params, '소스젠목록', '조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '목록 조회 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        loading.value = false;
      }
    };

    /* onSearch — [조회] 버튼/Enter 입력 시에만 재조회(입력 즉시 반응 금지 정책) */
    const onSearch = () => { pager.pageNo = 1; fnLoad(); };
    const onSetPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };

    /* onOpen / onNew — 상세(편집) 화면은 별도 뷰라 쿼리스트링으로 이동한다 */
    const onOpen = (row) => { location.href = 'mdSgSourcegen.html?view=editor&projectId=' + encodeURIComponent(row.projectId); };
    const onNew = () => { location.href = 'mdSgSourcegen.html?view=editor'; };
    /* onChangeView — 목록/이력 화면 전환 (모듈은 해시라우터가 없어 전체 페이지 이동) */
    const onChangeView = (v) => {
      if (v === 'hist') location.href = 'mdSgSourcegen.html?view=hist';
    };

    const fnFmtDate = (d) => (d ? String(d).slice(0, 10) : '-');
    /* ##### [05] 컬럼정의 #################### */
    const baseGridColumns = [
      { key: '_thumb',      label: '', width: '44px', align: 'center' },
      { key: 'projectNm',   label: '프로젝트명' },
      { key: 'basePackage', label: 'Base Package', width: '220px', cellClass: 'sg-list-mono', fmt: (v) => v || '-' },
      { key: 'dbTypeCd',    label: 'DB', width: '90px', fmt: (v, r) => r.dbTypeCdNm || v || '-' },
      { key: 'ddlCount',    label: '테이블', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'genHistCount', label: '생성이력', width: '80px', align: 'center', fmt: (v) => v || 0 },
      { key: 'lastGenDate', label: '최근 생성', width: '140px', fmt: (v) => coUtil.cofYmdHm(v) || '-' },
      { key: 'regUserNm',   label: '작성자', width: '120px', fmt: (v, r) => v || r.memberNm || '알 수 없음' },
    ];

    /* fnThumbStyle — 프로젝트ID 기반 해시 색상의 그라데이션 썸네일(실 이미지가 없는 도메인) */
    const fnThumbStyle = (id) => {
      let h = 0;
      for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
      return 'background:linear-gradient(135deg, hsl(' + h + ',72%,90%), hsl(' + ((h + 40) % 360) + ',68%,80%));';
    };

    /* fnStatusBadge — 상태 배지 스타일 (작성중=회색 / 생성완료=골드) */
    const fnStatusBadge = (p) => (p.projectStatusCd === 'DONE'
      ? { icon: '✅', label: p.projectStatusCdNm || '생성완료', cls: 'done' }
      : { icon: '✏️', label: p.projectStatusCdNm || '작성중', cls: 'draft' });

    onMounted(() => {
      /* "내 소스젠 프로젝트" 메뉴(?mine=1)로 들어오면 검색어에 내 회원명만 채워서 조회 —
         별도 memberId 필터 API 없이 기존 작성자 검색(searchValue)을 그대로 재사용 */
      const qs = new URLSearchParams(location.search);
      if (qs.get('mine') === '1') {
        const myNm = window.foAuth?.state?.user?.memberNm;
        if (myNm) searchParam.searchValue = myNm;
      }
      fnLoad();
    });

    return {baseGridColumns, searchParam, pager, rows, loading, onSearch, onSetPage, onSizeChange, onOpen, onNew, onChangeView,
      fnFmtDate,  fnThumbStyle, fnStatusBadge, viewMode, onSetViewMode };
  },
  template: /* html */`
<div class="sg-page">
  <div class="sg-hero">
    <div class="sg-hero-eyebrow">SOURCE GENERATOR</div>
    <h1 class="sg-hero-title">⚙️ 소스젠 프로젝트 목록</h1>
    <div class="sg-hero-sub">DDL 을 넣으면 백엔드·프론트·풀스택 소스를 한 번에 생성합니다</div>
  </div>

  <div class="sg-list-head">
    <div class="sg-search-bar">
      <input v-model="searchParam.searchValue" @keyup.enter="onSearch" placeholder="프로젝트명, 설명, 패키지, 작성자로 검색" class="form-control sg-search-input" />
      <button class="btn btn_search" @click="onSearch" :disabled="loading">조회</button>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="sg-view-toggle">
        <button :class="{active: viewMode==='list'}" title="일반목록" @click="onSetViewMode('list')">☰</button>
        <button :class="{active: viewMode==='card'}" title="카드형식" @click="onSetViewMode('card')">▦</button>
      </div>
      <select class="sg-view-select" :value="'list'" @change="onChangeView($event.target.value)" title="화면 전환">
        <option value="list">📋 목록</option>
        <option value="hist">📎 이력</option>
      </select>
      <button class="btn btn_new" @click="onNew">+ 신규 프로젝트</button>
    </div>
  </div>

  <div class="sg-list-count">총 {{ pager.pageTotalCount }}개 프로젝트</div>

  <!-- 카드형식 -->
  <div v-if="viewMode==='card'" class="sg-card-grid">
    <div v-for="p in rows" :key="p.projectId" class="sg-project-card" @click="onOpen(p)">
      <div class="sg-project-thumb" :style="p.thumbnailUrl ? '' : fnThumbStyle(p.projectId)">
        <img v-if="p.thumbnailUrl" :src="p.thumbnailUrl" class="sg-project-thumb-img" />
        <span v-else class="sg-project-thumb-icon">⚙️</span>
      </div>
      <div class="sg-project-card-body">
        <div class="sg-project-badges">
          <span class="sg-badge sg-badge-mono">#{{ p.projectId }}</span>
          <span class="sg-badge">{{ p.ddlCount || 0 }}개 테이블</span>
          <span class="sg-badge" :class="'sg-badge-' + fnStatusBadge(p).cls">{{ fnStatusBadge(p).icon }} {{ fnStatusBadge(p).label }}</span>
        </div>
        <div class="sg-project-card-nm">{{ p.projectNm }}</div>
        <div class="sg-project-card-pkg">{{ p.basePackage || '(패키지 미지정)' }} · {{ p.dbTypeCdNm || p.dbTypeCd }}</div>
        <div class="sg-project-card-meta">
          <span class="sg-project-card-author">✍ {{ p.regUserNm || p.memberNm || '알 수 없음' }}</span>
          <span class="sg-project-card-date">{{ fnFmtDate(p.regDate) }}</span>
        </div>
        <button class="btn btn_detail sg-card-btn" @click.stop="onOpen(p)">상세보기</button>
      </div>
    </div>
    <div v-if="!loading && !rows.length" class="sg-empty-hint" style="grid-column:1/-1;">검색 결과가 없습니다.</div>
  </div>

  <!-- 일반목록(기본) -->
  <div v-else class="sg-list-table-wrap">
    <fo-grid :columns="baseGridColumns" :rows="rows" row-key="projectId" :loading="loading"
      list-title="프로젝트목록" bare min-width="1000px" :row-click="onOpen"
      empty-text="검색 결과가 없습니다.">
      <!-- 썸네일: 이미지 + 없을 때 프로젝트ID 해시 그라데이션 — 단순 fmt 로는 표현 불가라 슬롯 유지 -->
      <template #cell-_thumb="{ row }">
        <div class="sg-list-thumb" :style="row.thumbnailUrl ? '' : fnThumbStyle(row.projectId)">
          <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl" class="sg-list-thumb-img" />
          <span v-else class="sg-list-thumb-icon">⚙️</span>
        </div>
      </template>
      <!-- 프로젝트명 + 상태 배지(아이콘·라벨·색 3요소) -->
      <template #cell-projectNm="{ row }">
        <span class="sg-list-table-nm">{{ row.projectNm }}</span>
        <span class="sg-badge sg-badge-inline" :class="'sg-badge-' + fnStatusBadge(row).cls">
          {{ fnStatusBadge(row).icon }} {{ fnStatusBadge(row).label }}
        </span>
      </template>
    </fo-grid>
  </div>

  <fo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</div>
`,
};
