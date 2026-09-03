/* CfFileMng.js — cf_file(업로드 파일/이미지/동영상) 관리 화면. shell(index.html)의 main 프레임에
 * <cf-file-mng> 로 임베드된다. 상단검색+첨부 / 중단목록(카드, 동영상은 썸네일을 바탕이미지로) /
 * 하단상세 3단 구성. 리소스는 window.open 으로 보기, 동영상은 별도 팝업(cf-video-popup.html). */
window.CfFileMng = {
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

      <!-- ② 목록(카드) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-count">전체 {{ listState.total }}건</span>
        </div>
        <div class="card-grid">
          <div v-for="f in listState.list" :key="f.fileId"
               class="item-card" :class="{ selected: f.fileId === uiState.selectedId }"
               @click="onSelect(f.fileId)">
            <div class="thumb" :style="fnThumbStyle(f)">
              <span v-if="f.mediaTypeCd === 'VIDEO' && fnPosterUrl(f)" class="play-badge">▶</span>
              <span v-else-if="f.mediaTypeCd !== 'IMAGE'">{{ fnMediaIcon(f.mediaTypeCd) }}</span>
            </div>
            <div class="body">
              <div class="title" :title="f.origFileNm">{{ f.origFileNm }}</div>
              <div class="meta">
                <span class="badge" :class="fnBadgeClass(f.mediaTypeCd)">{{ f.mediaTypeCd }}</span>
                &nbsp;{{ fnFmtSize(f.fileSize) }}
              </div>
              <div class="meta">{{ fnFmtDate(f.regDate) }}</div>
            </div>
            <div class="actions">
              <a href="#" @click.stop.prevent="onView(f)">{{ f.mediaTypeCd === 'VIDEO' ? '▶ 재생' : '🔍 보기' }}</a>
              <a href="#" style="color:#e53935;" @click.stop.prevent="onDelete(f.fileId)">삭제</a>
            </div>
          </div>
          <div v-if="listState.list.length === 0" class="empty-hint" style="grid-column:1/-1;">조회된 파일이 없습니다.</div>
        </div>
        <div class="pagination" v-if="listState.totalPage > 1">
          <button :disabled="pager.pageNo <= 1" @click="onSetPage(pager.pageNo - 1)">‹</button>
          <button v-for="p in listState.totalPage" :key="p" :class="{ active: p === pager.pageNo }" @click="onSetPage(p)">{{ p }}</button>
          <button :disabled="pager.pageNo >= listState.totalPage" @click="onSetPage(pager.pageNo + 1)">›</button>
        </div>
      </div>

      <!-- ③ 상세란 -->
      <div class="card detail-panel">
        <div v-if="!uiState.selectedId" class="empty-hint">목록에서 파일을 선택하거나 위에서 새 파일을 첨부하세요.</div>
        <div v-else>
          <div class="list-title">상세 — #{{ detail.fileId }}</div>
          <div class="form-row">
            <div class="form-group span-3">
              <span class="form-label">미리보기</span>
              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <img v-if="detail.mediaTypeCd === 'IMAGE'" :src="detail.thumbnailUrl || detail.fileUrl" style="max-width:220px;max-height:160px;border-radius:8px;border:1px solid #eee;" />
                <img v-else-if="detail.mediaTypeCd === 'VIDEO' && fnPosterUrl(detail)" :src="fnPosterUrl(detail)" style="max-width:220px;max-height:160px;border-radius:8px;border:1px solid #eee;" />
                <button class="btn btn_select btn-sm" @click="onView(detail)">{{ detail.mediaTypeCd === 'VIDEO' ? '▶ 동영상 재생' : '🔍 원본 보기(새창)' }}</button>
                <button v-if="detail.thumbnailUrl" class="btn btn_cancel btn-sm" @click="fnOpenWindow(detail.thumbnailUrl)">썸네일 보기(새창)</button>
              </div>
            </div>
            <div class="form-group"><span class="form-label">fileId</span><input class="form-control" :value="detail.fileId" disabled /></div>
            <div class="form-group span-2"><span class="form-label">원본 파일명</span><input class="form-control" :value="detail.origFileNm" disabled /></div>
            <div class="form-group"><span class="form-label">미디어 유형</span><input class="form-control" :value="detail.mediaTypeCd" disabled /></div>
            <div class="form-group"><span class="form-label">용량</span><input class="form-control" :value="fnFmtSize(detail.fileSize)" disabled /></div>
            <div class="form-group"><span class="form-label">Content-Type</span><input class="form-control" :value="detail.contentType" disabled /></div>
            <div class="form-group"><span class="form-label">업로더</span><input class="form-control" :value="detail.uploaderClientId" disabled /></div>
            <div class="form-group"><span class="form-label">등록일시</span><input class="form-control" :value="fnFmtDate(detail.regDate)" disabled /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn_delete" @click="onDelete(detail.fileId)">삭제</button>
            <button class="btn btn_close" @click="onCloseDetail">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref, reactive, onMounted } = Vue;

    // 1) ref/reactive
    const pager = reactive({ pageNo: 1, pageSize: 12, keyword: '', mediaTypeCd: '' });
    const listState = reactive({ list: [], total: 0, totalPage: 0 });
    const uiState = reactive({ selectedId: null });
    const detail = reactive({});
    const uploadState = reactive({ busy: false, thumbnail: false });
    const uploadFileEl = ref(null);

    const MEDIA_ICON = { IMAGE: '🖼️', VIDEO: '🎬', FILE: '📄' };

    // 2) fn* 순수 유틸
    const fnMediaIcon = (t) => MEDIA_ICON[t] || '📄';
    const fnPosterUrl = (f) => f.thumbnailUrl || f.frameUrl || '';
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

    // 3) 조회
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({
          keyword: pager.keyword, mediaTypeCd: pager.mediaTypeCd, pageNo: pager.pageNo, pageSize: pager.pageSize,
        });
        const data = await cfAuth.cfApi('/api/cdn/file/page?' + qs.toString());
        listState.list = data.pageList;
        listState.total = data.pageTotalCount;
        listState.totalPage = data.pageTotalPage;
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 4) 이벤트 핸들러(on*)
    const onSearch = () => { pager.pageNo = 1; fnLoadList(); };
    const onReset = () => { pager.keyword = ''; pager.mediaTypeCd = ''; pager.pageNo = 1; fnLoadList(); };
    const onSetPage = (p) => { pager.pageNo = p; fnLoadList(); };

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

    // 5) onMounted
    onMounted(fnLoadList);

    return {
      pager, listState, uiState, detail, uploadState, uploadFileEl,
      fnMediaIcon, fnPosterUrl, fnThumbStyle, fnBadgeClass, fnFmtSize, fnFmtDate, fnOpenWindow,
      onSearch, onReset, onSetPage, onSelect, onCloseDetail, onView, onUpload, onDelete,
    };
  },
};
