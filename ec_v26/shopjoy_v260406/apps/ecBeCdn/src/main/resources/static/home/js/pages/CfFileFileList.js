/* CfFileFileList.js — storage-root 아래 "실제 디스크 폴더 구조"를 좌측 트리로, 선택한 폴더의
 * 직계 파일을 우측 목록으로 훑어보는 화면. shell(index.html)의 main 프레임에
 * <cf-file-file-list> 로 임베드된다. 업로드 폼은 없음(조회/보기/삭제 전용 — 첨부는
 * CfFileMng.js 의 cf_file 관리 화면에서).
 *
 * 2026-09-06 개선(요청사항: "하단 페이징 이상하네 / 그리드보기 카드보기 있으면 좋겠어"):
 *  - 페이징 버그수정: <button> 들을 .pagination(3열 grid: 좌/가운데/우) 바로 아래 직계 자식으로
 *    뒀던 게 원인 — grid-template-columns:1fr auto 1fr 라 버튼 하나하나가 그 3칸에 순서대로
 *    배치되면서 "‹ 1 2" / "3 ›" 처럼 엉뚱하게 줄바꿈됐다. CfFileMng.js 가 이미 쓰는 <bo-pager>
 *    (자체가 .pager-left/.pager/.pager-right 3칸 구조를 올바르게 채움)로 교체.
 *  - 카드보기/그리드보기 토글 추가 — 그리드보기는 CfFileMng.js 의 fileGridColumns(<bo-grid>)를
 *    그대로 재사용(썸네일/원본파일명/유형/용량/등록일시/보기·삭제).
 *
 * 2026-09-06 2차 개선(요청사항: "좌측 트리정보 2번째 이미지 경로부터 보여야될텐데" / "실제
 * 폴더정보를 트리로 만들어주면 좋겠는데") — 좌측 트리를 cf_file.reg_date 기반 가상 연/월/일
 * 트리(/api/cdn/file/folders)에서 storage-root 의 "실제 디스크 폴더"(/api/cdn/storage/tree,
 * CfStorageBrowseController)로 전환. File Station 에서 보이던 attach/common/
 * CONTACT_CONTENT_ATTACH/prod 같은 레거시 폴더도 그대로 노출되고, 그 안의 파일은 cf_file
 * 로 추적되지 않아도(tracked:false) 목록에 보이고 미리보기/삭제가 된다(단, 삭제는 디스크에서만
 * 지워짐 — DB 행이 없으므로). 트리 깊이가 가변적이라(예: prod/img/shop/banner 4단) 재귀
 * 컴포넌트 대신 평탄화(fnFlattenTree)해서 렌더한다(Vue 재귀 컴포넌트보다 단순 — 이 화면의
 * 다른 fn* 직접호출 스타일과도 일관).
 */
window.CfFileFileList = {
  setup() {
    const { reactive, onMounted } = Vue;

    // 1) ref/reactive — pager 는 요청(pageNo/pageSize)+응답(pageTotalCount/pageTotalPage) 필드를
    // 한 reactive 객체에 함께 담아 <bo-pager :pager="pager"> 에 그대로 넘긴다(CfFileMng.js 와 동일 관례).
    const pager = reactive({ pageNo: 1, pageSize: 12, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [12, 24, 48, 96] });
    const treeState = reactive({ nodes: [] });
    const listState = reactive({ list: [] });
    const uiState = reactive({ selectedFolder: '', expanded: {}, viewMode: 'card' });

    const MEDIA_ICON = { IMAGE: '🖼️', VIDEO: '🎬', FILE: '📄' };

    // 2) fn* 순수 유틸
    const fnMediaIcon = (t) => MEDIA_ICON[t] || '📄';
    const fnPosterUrl = (f) => f.thumbnailUrl || '';
    // v-if 속성값 안에 && 를 직접 쓰면 Vue 런타임 컴파일러가 크래시하므로(프로젝트 표준 §0-A) 헬퍼로 감싼다.
    const fnShowPlayBadge = (f) => f.mediaTypeCd === 'VIDEO' && !!fnPosterUrl(f);
    const fnThumbStyle = (f) => {
      if (f.mediaTypeCd === 'IMAGE') return { backgroundImage: `url('${f.thumbnailUrl || f.url}')` };
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
    const fnTotalCount = () => treeState.nodes.reduce((sum, n) => sum + n.count, 0);
    // 트리 깊이가 가변적이라(레거시 폴더는 얕고, prod/img/shop/banner 처럼 깊은 것도 있음) 재귀
    // 대신 펼쳐진 노드만 평탄화해서 depth 와 함께 반환 — 템플릿은 단순 v-for 한 번으로 끝난다.
    const fnFlattenTree = () => {
      const out = [];
      const walk = (nodes, depth) => {
        for (const n of nodes) {
          out.push({ id: n.id, label: n.label, count: n.count, hasChildren: n.children.length > 0, depth });
          if (uiState.expanded[n.id] && n.children.length) walk(n.children, depth + 1);
        }
      };
      walk(treeState.nodes, 0);
      return out;
    };

    // CfFileMng.js 의 fileGridColumns 를 그대로 재사용(그리드보기 전용) — 필드명만 실제 디스크
    // 응답(RealFileEntry: name/size/lastModified)에 맞춰 변경.
    const fileGridColumns = [
      { key: 'thumb', label: '', slot: true, width: '64px' },
      { key: 'name', label: '파일명', slot: true },
      { key: 'mediaTypeCd', label: '유형', badge: (r) => fnBadgeClass(r.mediaTypeCd) },
      { key: 'tracked', label: '관리대상', fmt: (r) => (r.tracked ? 'cf_file' : '(미추적)') },
      { key: 'size', label: '용량', align: 'right', fmt: (r) => fnFmtSize(r.size) },
      { key: 'lastModified', label: '수정일시', fmt: (r) => fnFmtDate(r.lastModified) },
      { key: 'actions', label: '', slot: true, width: '120px' },
    ];

    // 3) 조회
    const fnLoadTree = async () => {
      try {
        treeState.nodes = await cfAuth.cfApi('/api/cdn/storage/tree');
      } catch (e) { cfAuth.showToast(e.message, true); }
    };
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({ folder: uiState.selectedFolder, pageNo: pager.pageNo, pageSize: pager.pageSize });
        const data = await cfAuth.cfApi('/api/cdn/storage/list?' + qs.toString());
        listState.list = data.pageList;
        pager.pageTotalCount = data.pageTotalCount;
        pager.pageTotalPage = data.pageTotalPage;
      } catch (e) { cfAuth.showToast(e.message, true); }
    };

    // 4) 이벤트 핸들러(on*)
    const onToggle = (id) => { uiState.expanded[id] = !uiState.expanded[id]; };
    // 폴더 행 클릭 — 하위가 있으면 펼침/접힘도 같이 토글하고, 그 폴더의 직계 파일을 로드한다.
    const onSelectFolder = (node) => {
      if (node.hasChildren) uiState.expanded[node.id] = !uiState.expanded[node.id];
      uiState.selectedFolder = node.id;
      pager.pageNo = 1;
      fnLoadList();
    };
    const onSelectAll = () => { uiState.selectedFolder = ''; pager.pageNo = 1; fnLoadList(); };
    const onSetPage = (p) => { pager.pageNo = p; fnLoadList(); };
    const onSizeChange = () => { pager.pageNo = 1; fnLoadList(); };
    const onSetViewMode = (m) => { uiState.viewMode = m; };

    const onView = (f) => {
      window.open(f.url, '_blank');
    };

    const onDelete = async (f) => {
      const warn = f.tracked
        ? '삭제하시겠습니까? (원본/썸네일/프레임 이미지가 모두 삭제됩니다)'
        : '삭제하시겠습니까? (cf_file 로 관리되지 않는 파일 — 디스크에서만 지워지며 되돌릴 수 없습니다)';
      if (!confirm(warn)) return;
      try {
        await cfAuth.cfApi('/api/cdn/storage/file?path=' + encodeURIComponent(f.relPath), { method: 'DELETE' });
        cfAuth.showToast('삭제되었습니다.');
        await Promise.all([fnLoadTree(), fnLoadList()]);
      } catch (e) { cfAuth.showToast(e.message, true); }
    };

    // 5) onMounted — initPage 로 진입 시퀀스를 한 곳에 모은다(SyContactDtl.js 패턴).
    const initPage = async () => {
      await fnLoadTree();
      // 최상단 폴더 하나는 기본 펼침(첫 진입 시 바로 뭔가 보이게)
      if (treeState.nodes.length) uiState.expanded[treeState.nodes[0].id] = true;
      await fnLoadList();
    };
    onMounted(initPage);

    return {
      pager, treeState, listState, uiState, fileGridColumns,
      fnMediaIcon, fnPosterUrl, fnShowPlayBadge, fnThumbStyle, fnBadgeClass, fnFmtSize, fnFmtDate,
      fnTotalCount, fnFlattenTree,
      onToggle, onSelectFolder, onSelectAll, onSetPage, onSizeChange, onSetViewMode, onView, onDelete,
    };
  },
  template: `
    <div>
      <div class="page-title">🗂️ 파일 폴더뷰 <span style="font-size:12px;color:#999;font-weight:400;">— storage-root 실제 폴더 구조 탐색</span></div>

      <div style="display:grid;grid-template-columns:260px 1fr;gap:12px;align-items:start;">
        <!-- 좌측: 실제 디스크 폴더트리 -->
        <div class="card" style="max-height:640px;overflow-y:auto;">
          <div class="list-title" style="margin-bottom:8px;">📁 실제 폴더(storage-root 기준)</div>
          <div class="folder-item" :class="{ active: !uiState.selectedFolder }" @click="onSelectAll">
            📦 전체(루트) <span class="meta">({{ fnTotalCount() }})</span>
          </div>
          <div v-for="n in fnFlattenTree()" :key="n.id"
               class="folder-item" :class="{ active: uiState.selectedFolder === n.id }"
               :style="{ paddingLeft: (12 + n.depth * 14) + 'px' }"
               @click="onSelectFolder(n)">
            {{ n.hasChildren ? (uiState.expanded[n.id] ? '📂' : '📁') : '📄' }} {{ n.label }} <span class="meta">({{ n.count }})</span>
          </div>
          <div v-if="treeState.nodes.length === 0" class="empty-hint">storage-root 아래 폴더가 없습니다.</div>
        </div>

        <!-- 우측: 목록(카드보기/그리드보기 토글) -->
        <div class="card">
          <div class="list-toolbar">
            <span class="list-title">{{ uiState.selectedFolder ? ('📅 ' + uiState.selectedFolder) : '📦 전체(루트 직계 파일)' }}</span>
            <span class="list-count">전체 {{ pager.pageTotalCount }}건</span>
            <span style="flex:1"></span>
            <div class="view-mode-toggle">
              <button class="btn btn-xs" :class="uiState.viewMode === 'card' ? 'btn_confirm' : 'btn_cancel'" @click="onSetViewMode('card')">🗃️ 카드보기</button>
              <button class="btn btn-xs" :class="uiState.viewMode === 'grid' ? 'btn_confirm' : 'btn_cancel'" @click="onSetViewMode('grid')">📋 그리드보기</button>
            </div>
          </div>

          <!-- 카드보기 -->
          <div v-if="uiState.viewMode === 'card'" class="card-grid">
            <div v-for="f in listState.list" :key="f.relPath" class="item-card" @click="onView(f)">
              <div class="thumb" :style="fnThumbStyle(f)">
                <span v-if="fnShowPlayBadge(f)" class="play-badge">▶</span>
                <span v-else-if="f.mediaTypeCd !== 'IMAGE'">{{ fnMediaIcon(f.mediaTypeCd) }}</span>
              </div>
              <div class="body">
                <div class="title" :title="f.name">{{ f.name }}</div>
                <div class="meta">
                  <span class="badge" :class="fnBadgeClass(f.mediaTypeCd)">{{ f.mediaTypeCd }}</span>
                  &nbsp;{{ fnFmtSize(f.size) }}
                  <span v-if="!f.tracked" class="badge badge-gray" title="cf_file 로 관리되지 않는 파일">미추적</span>
                </div>
                <div class="meta">{{ fnFmtDate(f.lastModified) }}</div>
              </div>
              <div class="actions">
                <a href="#" @click.stop.prevent="onView(f)">🔍 보기</a>
                <a href="#" style="color:#e53935;" @click.stop.prevent="onDelete(f)">삭제</a>
              </div>
            </div>
            <div v-if="listState.list.length === 0" class="empty-hint" style="grid-column:1/-1;">이 폴더에 파일이 없습니다.</div>
          </div>

          <!-- 그리드보기 -->
          <bo-grid v-else :columns="fileGridColumns" :rows="listState.list" row-key="relPath"
            :page-no="pager.pageNo" :page-size="pager.pageSize" empty-text="이 폴더에 파일이 없습니다.">
            <template #cell-thumb="{ row }">
              <div class="thumb" :style="fnThumbStyle(row)" style="width:56px;height:56px;border-radius:6px;cursor:pointer;" @click="onView(row)">
                <span v-if="fnShowPlayBadge(row)" class="play-badge">▶</span>
                <span v-else-if="row.mediaTypeCd !== 'IMAGE'">{{ fnMediaIcon(row.mediaTypeCd) }}</span>
              </div>
            </template>
            <template #cell-name="{ row }">
              <a href="#" class="title-link" :title="row.name" @click.prevent="onView(row)">{{ row.name }}</a>
            </template>
            <template #cell-actions="{ row }">
              <a href="#" @click.stop.prevent="onView(row)">🔍 보기</a>
              &nbsp;<a href="#" style="color:#e53935;" @click.stop.prevent="onDelete(row)">삭제</a>
            </template>
          </bo-grid>

          <bo-pager :pager="pager" :on-set-page="onSetPage" :on-size-change="onSizeChange" />
        </div>
      </div>
    </div>
  `,
};
