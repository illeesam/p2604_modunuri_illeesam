/* CfFileFileList.js — cf_file 을 "좌측 폴더트리(연도>월>일) + 우측 목록" 형태로 훑어보는 화면.
 * shell(index.html)의 main 프레임에 <cf-file-file-list> 로 임베드된다. 업로드 폼은 없음(조회/보기
 * /삭제 전용 — 첨부는 CfFileMng.js 의 cf_file 관리 화면에서). 폴더는 파일이 실제로 저장된
 * 날짜(yyyy/MM/dd, CfStorageService.todayDir() 기준)로 자동 구성 — 별도 폴더 개념 없이
 * 업로드 시점 자동 분류라, 사람이 직접 폴더를 만들거나 옮기는 기능은 없다.
 */
window.CfFileFileList = {
  setup() {
    const { reactive, onMounted } = Vue;

    // 1) ref/reactive
    const pager = reactive({ pageNo: 1, pageSize: 12 });
    const treeState = reactive({ years: [] });
    const listState = reactive({ list: [], total: 0, totalPage: 0 });
    const uiState = reactive({ selectedDay: null, expanded: {} });

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
    const fnMonthLabel = (ym) => ym.slice(5, 7) + '월';
    const fnDayLabel = (ymd) => ymd.slice(8, 10) + '일';
    const fnTotalCount = () => treeState.years.reduce((sum, y) => sum + y.count, 0);

    // 3) 조회
    const fnLoadTree = async () => {
      try {
        treeState.years = await cfAuth.cfApi('/api/cdn/file/folders');
      } catch (e) { cfAuth.showToast(e.message, true); }
    };
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({ pageNo: pager.pageNo, pageSize: pager.pageSize });
        if (uiState.selectedDay) qs.set('folder', uiState.selectedDay);
        const data = await cfAuth.cfApi('/api/cdn/file/page?' + qs.toString());
        listState.list = data.pageList;
        listState.total = data.pageTotalCount;
        listState.totalPage = data.pageTotalPage;
      } catch (e) { cfAuth.showToast(e.message, true); }
    };

    // 4) 이벤트 핸들러(on*)
    const onToggle = (id) => { uiState.expanded[id] = !uiState.expanded[id]; };
    const onSelectDay = (dayId) => { uiState.selectedDay = dayId; pager.pageNo = 1; fnLoadList(); };
    const onSelectAll = () => { uiState.selectedDay = null; pager.pageNo = 1; fnLoadList(); };
    const onSetPage = (p) => { pager.pageNo = p; fnLoadList(); };

    const onView = (f) => {
      if (f.mediaTypeCd === 'VIDEO' && f.streamUrl) {
        const poster = fnPosterUrl(f);
        const url = 'cf-video-popup.html'
          + '?src=' + encodeURIComponent(f.streamUrl)
          + '&poster=' + encodeURIComponent(poster)
          + '&title=' + encodeURIComponent(f.origFileNm || '');
        window.open(url, 'cfVideoPopup', 'width=960,height=620,resizable=yes,scrollbars=no');
      } else {
        window.open(f.fileUrl, '_blank');
      }
    };

    const onDelete = async (fileId) => {
      if (!confirm('삭제하시겠습니까? (원본/썸네일/프레임 이미지가 모두 삭제됩니다)')) return;
      try {
        await cfAuth.cfApi('/api/cdn/file/' + encodeURIComponent(fileId), { method: 'DELETE' });
        cfAuth.showToast('삭제되었습니다.');
        await Promise.all([fnLoadTree(), fnLoadList()]);
      } catch (e) { cfAuth.showToast(e.message, true); }
    };

    // 5) onMounted — initPage 로 진입 시퀀스를 한 곳에 모은다(SyContactDtl.js 패턴).
    const initPage = async () => {
      await fnLoadTree();
      // 최상단 연도 하나는 기본 펼침(첫 진입 시 바로 뭔가 보이게)
      if (treeState.years.length) uiState.expanded[treeState.years[0].id] = true;
      await fnLoadList();
    };
    onMounted(initPage);

    return {
      pager, treeState, listState, uiState,
      fnMediaIcon, fnPosterUrl, fnShowPlayBadge, fnThumbStyle, fnBadgeClass, fnFmtSize, fnFmtDate,
      fnMonthLabel, fnDayLabel, fnTotalCount,
      onToggle, onSelectDay, onSelectAll, onSetPage, onView, onDelete,
    };
  },
  template: `
    <div>
      <div class="page-title">🗂️ 파일 폴더뷰 <span style="font-size:12px;color:#999;font-weight:400;">— 업로드 날짜별 트리 탐색</span></div>

      <div style="display:grid;grid-template-columns:240px 1fr;gap:12px;align-items:start;">
        <!-- 좌측: 폴더트리 -->
        <div class="card" style="max-height:640px;overflow-y:auto;">
          <div class="list-title" style="margin-bottom:8px;">📁 폴더(등록일 기준)</div>
          <div class="folder-item" :class="{ active: !uiState.selectedDay }" @click="onSelectAll">
            📦 전체 <span class="meta">({{ fnTotalCount() }})</span>
          </div>
          <div v-for="y in treeState.years" :key="y.id">
            <div class="folder-item folder-year" @click="onToggle(y.id)">
              {{ uiState.expanded[y.id] ? '📂' : '📁' }} {{ y.label }}년 <span class="meta">({{ y.count }})</span>
            </div>
            <div v-show="uiState.expanded[y.id]" style="padding-left:12px;">
              <div v-for="m in y.children" :key="m.id">
                <div class="folder-item folder-month" @click="onToggle(m.id)">
                  {{ uiState.expanded[m.id] ? '📂' : '📁' }} {{ fnMonthLabel(m.label) }} <span class="meta">({{ m.count }})</span>
                </div>
                <div v-show="uiState.expanded[m.id]" style="padding-left:12px;">
                  <div v-for="d in m.children" :key="d.id"
                       class="folder-item folder-day" :class="{ active: uiState.selectedDay === d.id }"
                       @click="onSelectDay(d.id)">
                    📄 {{ fnDayLabel(d.label) }} <span class="meta">({{ d.count }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="treeState.years.length === 0" class="empty-hint">업로드된 파일이 없습니다.</div>
        </div>

        <!-- 우측: 목록(카드) -->
        <div class="card">
          <div class="list-toolbar">
            <span class="list-title">{{ uiState.selectedDay ? ('📅 ' + uiState.selectedDay) : '📦 전체' }}</span>
            <span class="list-count">전체 {{ listState.total }}건</span>
          </div>
          <div class="card-grid">
            <div v-for="f in listState.list" :key="f.fileId" class="item-card" @click="onView(f)">
              <div class="thumb" :style="fnThumbStyle(f)">
                <span v-if="fnShowPlayBadge(f)" class="play-badge">▶</span>
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
            <div v-if="listState.list.length === 0" class="empty-hint" style="grid-column:1/-1;">이 폴더에 파일이 없습니다.</div>
          </div>
          <div class="pagination" v-if="listState.totalPage > 1">
            <button :disabled="pager.pageNo <= 1" @click="onSetPage(pager.pageNo - 1)">‹</button>
            <button v-for="p in listState.totalPage" :key="p" :class="{ active: p === pager.pageNo }" @click="onSetPage(p)">{{ p }}</button>
            <button :disabled="pager.pageNo >= listState.totalPage" @click="onSetPage(pager.pageNo + 1)">›</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
