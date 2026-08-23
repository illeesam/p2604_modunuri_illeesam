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
        props.showToast(err.response?.data?.message || err.message || '이력 조회 중 오류가 발생했습니다.', 'error', 0);
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
        props.showToast(err.response?.data?.message || err.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    const fnFmtDateTime = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-');
    const fnFmtBytes = (n) => {
      if (!n) return '-';
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1024 / 1024).toFixed(2) + ' MB';
    };

    onMounted(() => {
      /* 상세화면에서 "이 프로젝트의 이력만" 넘어온 경우 projectId 로 필터 */
      const qs = new URLSearchParams(location.search);
      const pid = qs.get('projectId');
      if (pid) searchParam.projectId = pid;
      fnLoad();
    });

    return { searchParam, pager, rows, loading, onSearch, onSetPage, onSizeChange,
      onChangeView, onOpenProject, onDelete, fnFmtDateTime, fnFmtBytes };
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

  <div class="sg-list-table-wrap">
    <table class="sg-list-table">
      <thead>
        <tr>
          <th style="width:60px;text-align:center;">번호</th>
          <th style="width:150px;">생성일시</th>
          <th style="width:190px;">프로젝트명</th>
          <th>파일명</th>
          <th style="width:190px;">Base Package</th>
          <th style="width:70px;text-align:center;">테이블</th>
          <th style="width:70px;text-align:center;">파일수</th>
          <th style="width:90px;text-align:right;">크기</th>
          <th style="width:160px;">메모</th>
          <th style="width:110px;">작성자</th>
          <th style="width:150px;text-align:center;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(h, idx) in rows" :key="h.sourcegenHistId">
          <td style="text-align:center;color:var(--text-muted,#999);">{{ (pager.pageNo-1)*pager.pageSize + idx + 1 }}</td>
          <td>{{ fnFmtDateTime(h.genDate) }}</td>
          <td class="sg-list-table-nm sg-hist-link" @click="onOpenProject(h)" :title="'프로젝트 열기: ' + (h.projectNm || '')">
            {{ h.projectNm || '(삭제된 프로젝트)' }}
          </td>
          <td class="sg-list-mono">{{ h.zipFileNm }}</td>
          <td class="sg-list-mono">{{ h.basePackage || '-' }}</td>
          <td style="text-align:center;">{{ h.ddlCount || 0 }}</td>
          <td style="text-align:center;">{{ h.fileCount || 0 }}</td>
          <td style="text-align:right;">{{ fnFmtBytes(h.zipFileSize) }}</td>
          <td>{{ h.genMemo || '-' }}</td>
          <td>{{ h.regUserNm || h.memberNm || '알 수 없음' }}</td>
          <td style="text-align:center;">
            <a v-if="h.zipUrl" :href="h.zipUrl" target="_blank" rel="noopener" class="btn btn_detail">다운로드</a>
            <button class="btn btn_delete" @click="onDelete(h)">삭제</button>
          </td>
        </tr>
        <tr v-if="!loading && !rows.length">
          <td colspan="11" class="sg-empty-hint">
            보관된 생성이력이 없습니다.<br>프로젝트 상세에서 [소스 생성] 후 [생성결과 보관] 을 누르면 여기에 쌓입니다.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <fo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
</div>
`,
};
