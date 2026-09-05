/* CfFileMng.js — cf_file(업로드 파일/이미지/동영상) 관리 화면. shell(index.html)의 main 프레임에
 * <cf-file-mng> 로 임베드된다. 상단검색+첨부 / 중단목록(<bo-grid>+<bo-pager>, 썸네일은 슬롯 셀로) /
 * 하단상세(<bo-form-area>) 3단 구성. 리소스는 window.open 으로 보기, 동영상은 별도 팝업(cf-video-popup.html).
 * 2026-09-06: 목록 카드그리드 → <bo-grid>/<bo-pager> 전환(요청사항). pager 는 메인 프로젝트 관례대로
 * 요청(pageNo/pageSize/keyword/mediaTypeCd)+응답(pageTotalCount/pageTotalPage) 필드를 한 reactive
 * 객체에 함께 담아 <bo-pager :pager="pager">에 참조로 그대로 넘긴다. */
window.CfFileMng = {
  setup() {
    const { ref, reactive, onMounted } = Vue;

    // 1) ref/reactive — pager 는 요청(pageNo/pageSize/keyword/mediaTypeCd)+응답(pageTotalCount/
    // pageTotalPage) 필드를 한 reactive 객체에 함께 담아 <bo-pager :pager="pager"> 에 그대로 넘긴다.
    const pager = reactive({
      pageNo: 1, pageSize: 12, keyword: '', mediaTypeCd: '',
      pageTotalCount: 0, pageTotalPage: 1, pageSizes: [12, 24, 48, 96],
    });
    const listState = reactive({ list: [] });
    const uiState = reactive({ selectedId: null });
    const detail = reactive({});
    const uploadState = reactive({ busy: false, thumbnail: false });
    const uploadFileEl = ref(null);

    const MEDIA_ICON = { IMAGE: '🖼️', VIDEO: '🎬', FILE: '📄' };

    // 2) fn* 순수 유틸
    const fnMediaIcon = (t) => MEDIA_ICON[t] || '📄';
    const fnPosterUrl = (f) => f.thumbnailUrl || f.frameUrl || '';
    // v-if 속성값 안에 && 를 직접 쓰면 Vue 런타임 컴파일러가 크래시하므로(프로젝트 표준 §0-A) 헬퍼로 감싼다.
    const fnShowPlayBadge = (f) => f.mediaTypeCd === 'VIDEO' && !!fnPosterUrl(f);
    const fnThumbStyle = (f) => {
      if (f.mediaTypeCd === 'IMAGE') return { backgroundImage: `url('${f.thumbnailUrl || f.fileUrl}')` };
      if (f.mediaTypeCd === 'VIDEO' && fnPosterUrl(f)) return { backgroundImage: `url('${fnPosterUrl(f)}')` };
      return {};
    };
    const fnBadgeClass = (t) => (t === 'IMAGE' ? 'badge-blue' : t === 'VIDEO' ? 'badge-purple' : 'badge-gray');
    const fnFmtSize = (n) => {
      if (n == null) return '-';
      if (n < 1024) return n + 'B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB';
      return (n / 1024 / 1024).toFixed(1) + 'MB';
    };
    const fnFmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '-');
    const fnOpenWindow = (url) => window.open(url, '_blank');

    // bo-form-area 컬럼 정의(요청사항 — <bo-form 적극적용). 미리보기는 이미지/버튼 조합이라 slot.
    const detailFormColumns = [
      { key: 'preview', label: '미리보기', type: 'slot', colSpan: 3 },
      { key: 'fileId', label: 'fileId' },
      { key: 'origFileNm', label: '원본 파일명', colSpan: 2 },
      { key: 'mediaTypeCd', label: '미디어 유형' },
      { key: 'fileSize', label: '용량', fmt: (f) => fnFmtSize(f.fileSize) },
      { key: 'contentType', label: 'Content-Type' },
      { key: 'uploaderClientId', label: '업로더' },
      { key: 'regDate', label: '등록일시', fmt: (f) => fnFmtDate(f.regDate) },
    ];

    // bo-grid 컬럼 정의(요청사항 — <bo-grid 적극적용). thumb/origFileNm/actions 는 클릭 동작 + 조건부
    // 렌더가 필요해 slot:true.
    const fileGridColumns = [
      { key: 'thumb', label: '', slot: true, width: '64px' },
      { key: 'origFileNm', label: '원본 파일명', slot: true },
      { key: 'mediaTypeCd', label: '유형', badge: (r) => fnBadgeClass(r.mediaTypeCd) },
      { key: 'fileSize', label: '용량', align: 'right', fmt: (r) => fnFmtSize(r.fileSize) },
      { key: 'regDate', label: '등록일시', fmt: (r) => fnFmtDate(r.regDate) },
      { key: 'actions', label: '', slot: true, width: '120px' },
    ];

    // 3) 조회
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({
          keyword: pager.keyword, mediaTypeCd: pager.mediaTypeCd, pageNo: pager.pageNo, pageSize: pager.pageSize,
        });
        const data = await cfAuth.cfApi('/api/cdn/file/page?' + qs.toString());
        listState.list = data.pageList;
        pager.pageTotalCount = data.pageTotalCount;
        pager.pageTotalPage = data.pageTotalPage;
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 4) 이벤트 핸들러(on*)
    const onSearch = () => { pager.pageNo = 1; fnLoadList(); };
    const onReset = () => { pager.keyword = ''; pager.mediaTypeCd = ''; pager.pageNo = 1; fnLoadList(); };
    const onSetPage = (p) => { pager.pageNo = p; fnLoadList(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoadList(); };

    const onSelect = async (fileId) => {
      try {
        const data = await cfAuth.cfApi('/api/cdn/file/' + encodeURIComponent(fileId));
        uiState.selectedId = fileId;
        Object.assign(detail, data);
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const onCloseDetail = () => { uiState.selectedId = null; };

    // 요청사항: 리소스 파일은 window.open, 동영상은 전용 팝업(썸네일을 poster 로)
    const onView = (f) => {
      if (f.mediaTypeCd === 'VIDEO' && f.streamUrl) {
        const poster = fnPosterUrl(f);
        const url = 'cf-video-popup.html'
          + '?src=' + encodeURIComponent(f.streamUrl)
          + '&poster=' + encodeURIComponent(poster)
          + '&title=' + encodeURIComponent(f.origFileNm || '');
        window.open(url, 'cfVideoPopup', 'width=960,height=620,resizable=yes,scrollbars=no');
      } else {
        fnOpenWindow(f.fileUrl);
      }
    };

    const onUpload = async () => {
      const file = uploadFileEl.value && uploadFileEl.value.files[0];
      if (!file) return cfAuth.showToast('첨부할 파일을 선택하세요.', true);
      if (!confirm('업로드하시겠습니까?')) return;

      const form = new FormData();
      form.append('file', file);
      form.append('thumbnail', String(uploadState.thumbnail));

      uploadState.busy = true;
      try {
        const res = await cfAuth.cfFetch('/api/cdn/upload', { method: 'POST', body: form });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body.ok === false) throw new Error(body.message || '업로드 실패');
        cfAuth.showToast('업로드 완료: ' + body.data.origFileNm);
        uploadFileEl.value.value = '';
        uploadState.thumbnail = false;
        pager.pageNo = 1;
        await fnLoadList();
        await onSelect(body.data.fileId);
      } catch (e) {
        cfAuth.showToast(e.message, true);
      } finally {
        uploadState.busy = false;
      }
    };

    const onDelete = async (fileId) => {
      if (!confirm('삭제하시겠습니까? (원본/썸네일/프레임 이미지가 모두 삭제됩니다)')) return;
      try {
        await cfAuth.cfApi('/api/cdn/file/' + encodeURIComponent(fileId), { method: 'DELETE' });
        cfAuth.showToast('삭제되었습니다.');
        if (uiState.selectedId === fileId) onCloseDetail();
        fnLoadList();
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 5) onMounted — initPage 로 진입 시퀀스를 한 곳에 모은다(SyContactDtl.js 패턴).
    // 이 화면은 select 옵션이 없어(미디어유형은 정적 <option> 그대로) codes/fnLoadCodes 는 불필요.
    const initPage = async () => {
      await fnLoadList();
    };
    onMounted(initPage);

    return {
      pager, listState, uiState, detail, uploadState, uploadFileEl, detailFormColumns, fileGridColumns,
      fnMediaIcon, fnPosterUrl, fnShowPlayBadge, fnThumbStyle, fnBadgeClass, fnFmtSize, fnFmtDate, fnOpenWindow,
      onSearch, onReset, onSetPage, onSizeChange, onSelect, onCloseDetail, onView, onUpload, onDelete,
    };
  },
  template: `
    <div>
      <div class="page-title">📁 cf_file 관리 <span style="font-size:12px;color:#999;font-weight:400;">— 업로드 파일/이미지/동영상</span></div>

      <!-- ① 검색란 + 첨부(업로드) -->
      <div class="card">
        <div class="search-bar">
          <input type="text" class="form-control" v-model="pager.keyword" placeholder="원본 파일명 검색" @keyup.enter="onSearch" />
          <select class="form-control" v-model="pager.mediaTypeCd">
            <option value="">전체 유형</option>
            <option value="IMAGE">이미지</option>
            <option value="VIDEO">동영상</option>
            <option value="FILE">일반파일</option>
          </select>
          <button class="btn btn_search" @click="onSearch">조회</button>
          <button class="btn btn_reset" @click="onReset">초기화</button>
        </div>
        <div class="upload-box">
          <input type="file" ref="uploadFileEl" />
          <label><input type="checkbox" v-model="uploadState.thumbnail" /> 썸네일 생성(이미지 첨부 시) — 동영상은 항상 첫프레임+썸네일 자동 생성</label>
          <button class="btn btn_new" :disabled="uploadState.busy" @click="onUpload">+ 첨부(업로드)</button>
          <span style="font-size:12px;color:#888;">{{ uploadState.busy ? '업로드 중...' : '' }}</span>
        </div>
      </div>

      <!-- ② 목록(bo-grid + bo-pager) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-count">전체 {{ pager.pageTotalCount }}건</span>
        </div>
        <bo-grid :columns="fileGridColumns" :rows="listState.list" row-key="fileId"
          :page-no="pager.pageNo" :page-size="pager.pageSize" empty-text="조회된 파일이 없습니다.">
          <template #cell-thumb="{ row }">
            <div class="thumb" :style="fnThumbStyle(row)" style="width:56px;height:56px;border-radius:6px;cursor:pointer;" @click="onSelect(row.fileId)">
              <span v-if="fnShowPlayBadge(row)" class="play-badge">▶</span>
              <span v-else-if="row.mediaTypeCd !== 'IMAGE'">{{ fnMediaIcon(row.mediaTypeCd) }}</span>
            </div>
          </template>
          <template #cell-origFileNm="{ row }">
            <a href="#" class="title-link" :title="row.origFileNm" @click.prevent="onSelect(row.fileId)">{{ row.origFileNm }}</a>
          </template>
          <template #cell-actions="{ row }">
            <a href="#" @click.stop.prevent="onView(row)">{{ row.mediaTypeCd === 'VIDEO' ? '▶ 재생' : '🔍 보기' }}</a>
            &nbsp;<a href="#" style="color:#e53935;" @click.stop.prevent="onDelete(row.fileId)">삭제</a>
          </template>
        </bo-grid>
        <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
      </div>

      <!-- ③ 상세란 -->
      <div class="card detail-panel">
        <div v-if="!uiState.selectedId" class="empty-hint">목록에서 파일을 선택하거나 위에서 새 파일을 첨부하세요.</div>
        <div v-else>
          <div class="list-title">상세 — #{{ detail.fileId }}</div>
          <bo-form-area :columns="detailFormColumns" :form="detail" :cols="3" readonly>
            <template #field-preview="{ form }">
              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <img v-if="form.mediaTypeCd === 'IMAGE'" :src="form.thumbnailUrl || form.fileUrl" style="max-width:220px;max-height:160px;border-radius:8px;border:1px solid #eee;" />
                <img v-else-if="form.mediaTypeCd === 'VIDEO' && fnPosterUrl(form)" :src="fnPosterUrl(form)" style="max-width:220px;max-height:160px;border-radius:8px;border:1px solid #eee;" />
                <button class="btn btn_select btn-sm" @click="onView(form)">{{ form.mediaTypeCd === 'VIDEO' ? '▶ 동영상 재생' : '🔍 원본 보기(새창)' }}</button>
                <button v-if="form.thumbnailUrl" class="btn btn_cancel btn-sm" @click="fnOpenWindow(form.thumbnailUrl)">썸네일 보기(새창)</button>
              </div>
            </template>
          </bo-form-area>
          <div class="form-actions">
            <button class="btn btn_delete" @click="onDelete(detail.fileId)">삭제</button>
            <button class="btn btn_close" @click="onCloseDetail">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
