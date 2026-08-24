/* ShopJoy FO 모듈 - 소스젠 생성이력 조회 (프로젝트 경계를 넘어 생성이력만 모아보는 화면)
   "?view=hist" 로 진입. 개별 프로젝트 안의 이력은 상세화면 하단에서도 볼 수 있지만,
   여기서는 전체 프로젝트의 생성이력을 한 곳에서 검색/다운로드한다. */
window.MdSgGenHistListPage = {
  name: 'MdSgGenHistListPage',
  props: {
    showToast: { type: Function, default: () => {} },                      // 토스트 알림
    showConfirm: { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { reactive, ref, onMounted } = Vue;

    const searchParam = reactive({ searchValue: '', projectId: '' });
    const pager = reactive({ pageNo: 1, pageSize: 20, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [20, 50, 100] });
    const rows = reactive([]);
    const loading = ref(false);

    /* fnLoad — 검색어/페이지 기준 생성이력 조회 */
    const fnLoad = async () => {
      loading.value = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize };
        if (searchParam.searchValue) params.searchValue = searchParam.searchValue;
        if (searchParam.projectId) params.projectId = searchParam.projectId;
        const res = await mdSgApiSvc.genHist.getPage(params, '소스젠이력', '조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        pager.pageTotalCount = d.pageTotalCount || 0;
        pager.pageTotalPage = d.pageTotalPage || 1;
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '이력 조회 중 오류가 발생했습니다.'), 'error', 0);
      } finally {
        loading.value = false;
      }
    };

    /* onSearch — [조회] 버튼/Enter 입력 시에만 재조회(입력 즉시 반응 금지 정책) */
    const onSearch = () => { pager.pageNo = 1; fnLoad(); };
    const onSetPage = (n) => { pager.pageNo = n; fnLoad(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoad(); };

    /* onChangeView — 목록/이력 화면 전환 (모듈은 해시라우터가 없어 전체 페이지 이동) */
    const onChangeView = (v) => {
      if (v === 'list') location.href = 'mdSgSourcegen.html?view=list';
    };
    const onOpenProject = (h) => {
      if (!h.projectId) return;
      location.href = 'mdSgSourcegen.html?view=editor&projectId=' + encodeURIComponent(h.projectId);
    };

    const onDelete = async (h) => {
      if (!await props.showConfirm('이력 삭제', `${h.zipFileNm} 이력을 삭제하시겠습니까?`)) return;
      try {
        await mdSgApiSvc.genHist.remove(h.sourcegenHistId, '소스젠이력', '삭제');
        await fnLoad();
        props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        props.showToast(coUtil.cofErrMsg(err, '삭제 중 오류가 발생했습니다.'), 'error', 0);
      }
    };

    /* ##### [05] 컬럼정의 ####################
       그리드 컬럼은 fo-grid 가 헤더·번호·빈목록·정렬까지 처리한다(원시 <table> 제거). */
    const baseGridColumns = [
      { key: 'genDate',     label: '생성일시', align: 'center', fmt: (v) => coUtil.cofYmdHm(v) || '-' },
      { key: 'projectNm',   label: '프로젝트명', cellClass: 'sg-hist-link',
        cellTitle: (v) => '프로젝트 열기: ' + (v || ''), fmt: (v) => v || '(삭제된 프로젝트)' },
      { key: 'zipFileNm',   label: '파일명', cellClass: 'sg-list-mono' },
      { key: 'basePackage', label: 'Base Package', cellClass: 'sg-list-mono', fmt: (v) => v || '-' },
      { key: 'ddlCount',    label: '테이블', align: 'center', fmt: (v) => v || 0 },
      { key: 'fileCount',   label: '파일수', align: 'center', fmt: (v) => v || 0 },
      { key: 'zipFileSize', label: '크기', align: 'right', fmt: (v) => coUtil.cofFileSize(v) },
      { key: 'genMemo',     label: '메모', fmt: (v) => v || '-' },
      { key: 'regUserNm',   label: '작성자', fmt: (v, r) => v || r.memberNm || '알 수 없음' },
      /* type:'actions' — 관리 버튼모음도 별도 배열로 분리하지 않고 baseGridColumns 항목 하나로 선언(#row-actions 슬롯 대체, 2026-08-25).
         다운로드는 href 지정 시 <a> 로 렌더된다(zipUrl 없는 행은 visible 로 감춤). */
      { type: 'actions', actions: [
        { label: '다운로드', cls: 'btn btn_detail', href: (row) => row.zipUrl, visible: (row) => !!row.zipUrl },
        { label: '삭제',     cls: 'btn btn_delete',  onClick: (row) => onDelete(row) },
      ] },
    ];

    /* onCellClick — 프로젝트명 셀 클릭 시 해당 프로젝트 열기 (그리드 셀클릭 라우터 표준) */
    const onCellClick = (cmd, colKey, row) => {
      if (colKey === 'projectNm') { onOpenProject(row); }
    };

    onMounted(() => {
      /* 상세화면에서 "이 프로젝트의 이력만" 넘어온 경우 projectId 로 필터 */
      const qs = new URLSearchParams(location.search);
      const pid = qs.get('projectId');
      if (pid) searchParam.projectId = pid;
      fnLoad();
    });

    return { baseGridColumns, searchParam, pager, rows, loading, onSearch, onSetPage, onSizeChange,
      onChangeView, onOpenProject, onDelete, onCellClick };
  },
  template: /* html */`
<div class="sg-page">
  <div class="sg-hero">
    <div class="sg-hero-eyebrow">SOURCE GENERATOR</div>
    <h1 class="sg-hero-title">📎 소스젠 생성이력</h1>
    <div class="sg-hero-sub">생성한 소스 ZIP 이 첨부로 보관된 내역입니다 — 언제든 다시 내려받을 수 있습니다</div>
  </div>

  <div class="sg-list-head">
    <div class="sg-search-bar">
      <input v-model="searchParam.searchValue" @keyup.enter="onSearch"
        placeholder="프로젝트명, 파일명, 메모, 패키지, 작성자로 검색" class="form-control sg-search-input" />
      <button class="btn btn_search" @click="onSearch" :disabled="loading">조회</button>
    </div>
    <div style="display:flex;align-items:center;gap:10px;">
      <select class="sg-view-select" :value="'hist'" @change="onChangeView($event.target.value)" title="화면 전환">
        <option value="list">📋 목록</option>
        <option value="hist">📎 이력</option>
      </select>
    </div>
  </div>

  <div class="sg-list-count">
    총 {{ pager.pageTotalCount }}개
    <span v-if="searchParam.projectId" class="sg-badge sg-badge-mono" style="margin-left:6px;">
      #{{ searchParam.projectId }} 이력만
    </span>
  </div>

  <fo-grid :columns="baseGridColumns" :rows="rows" row-key="sourcegenHistId" :loading="loading"
    list-title="생성이력" bare min-width="1100px"
    empty-text="보관된 생성이력이 없습니다. 프로젝트 상세에서 [소스 생성] 후 [생성결과 보관] 을 누르면 여기에 쌓입니다."
    @cell-click="onCellClick" />
  <fo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</div>
`,
};
