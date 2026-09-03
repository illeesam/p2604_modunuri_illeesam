/* CfClientMng.js — cf_client(EcCdnApi 호출 계정) 관리 화면. shell(index.html)의 main 프레임에
 * <cf-client-mng> 로 임베드된다 — bo.html 의 PAGE_COMP_MAP + <component :is> 패턴 축소판.
 * 상단검색 / 중단목록(카드) / 하단상세 3단 구성, 저장·삭제 confirm 필수(프로젝트 정책). */
window.CfClientMng = {
  template: `
    <div>
      <div class="page-title">🔑 cf_client 관리 <span style="font-size:12px;color:#999;font-weight:400;">— EcCdnApi 호출 계정</span></div>

      <!-- ① 검색란 -->
      <div class="card">
        <div class="search-bar">
          <input type="text" class="form-control" v-model="pager.keyword" placeholder="clientId 또는 clientNm 검색" @keyup.enter="onSearch" />
          <button class="btn btn_search" @click="onSearch">조회</button>
          <button class="btn btn_reset" @click="onReset">초기화</button>
          <span style="flex:1"></span>
          <button class="btn btn_new" @click="onNew">+ 신규 계정</button>
        </div>
      </div>

      <!-- ② 목록(카드) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-count">전체 {{ listState.total }}건</span>
        </div>
        <div class="card-grid">
          <div v-for="c in listState.list" :key="c.clientId"
               class="item-card" :class="{ selected: c.clientId === uiState.selectedId }"
               @click="onSelect(c.clientId)">
            <div class="thumb" style="font-size:32px;">🔑</div>
            <div class="body">
              <div class="title">{{ c.clientId }}</div>
              <div class="meta">{{ c.clientNm }}</div>
              <div class="meta">
                <span class="badge" :class="c.useYn === 'Y' ? 'badge-green' : 'badge-gray'">{{ c.useYn === 'Y' ? '사용' : '중지' }}</span>
                &nbsp;{{ fnFmtDate(c.regDate) }}
              </div>
            </div>
          </div>
          <div v-if="listState.list.length === 0" class="empty-hint" style="grid-column:1/-1;">조회된 계정이 없습니다.</div>
        </div>
        <div class="pagination" v-if="listState.totalPage > 1">
          <button :disabled="pager.pageNo <= 1" @click="onSetPage(pager.pageNo - 1)">‹</button>
          <button v-for="p in listState.totalPage" :key="p" :class="{ active: p === pager.pageNo }" @click="onSetPage(p)">{{ p }}</button>
          <button :disabled="pager.pageNo >= listState.totalPage" @click="onSetPage(pager.pageNo + 1)">›</button>
        </div>
      </div>

      <!-- ③ 상세란 -->
      <div class="card detail-panel">
        <div v-if="!uiState.selectedId && !uiState.isNew" class="empty-hint">목록에서 계정을 선택하거나 [+ 신규 계정]을 눌러주세요.</div>
        <div v-else>
          <div class="list-title">{{ uiState.isNew ? '신규 계정 등록' : ('상세 / 수정 — #' + form.clientId) }}</div>
          <div class="form-row">
            <div class="form-group">
              <span class="form-label">clientId</span>
              <input class="form-control" v-model="form.clientId" :disabled="!uiState.isNew" />
            </div>
            <div class="form-group">
              <span class="form-label">clientNm</span>
              <input class="form-control" v-model="form.clientNm" :disabled="cfReadonly" />
            </div>
            <div class="form-group">
              <span class="form-label">사용여부</span>
              <select class="form-control" v-model="form.useYn" :disabled="cfReadonly">
                <option value="Y">사용(Y)</option>
                <option value="N">중지(N)</option>
              </select>
            </div>
            <div class="form-group span-3" v-if="!cfReadonly">
              <span class="form-label">비밀번호 <span style="font-weight:400;color:#999;">{{ uiState.isNew ? '(필수)' : '(변경할 때만 입력, 비워두면 기존 비밀번호 유지)' }}</span></span>
              <input class="form-control" type="password" v-model="form.clientPwd" autocomplete="new-password" />
            </div>
          </div>
          <div class="form-actions">
            <template v-if="cfReadonly">
              <button class="btn btn_edit" @click="onSwitchEdit">수정</button>
              <button class="btn btn_delete" @click="onDelete">삭제</button>
              <button class="btn btn_close" @click="onCloseDetail">닫기</button>
            </template>
            <template v-else>
              <button class="btn btn_save" @click="onSave">저장</button>
              <button v-if="!uiState.isNew" class="btn btn_cancel" @click="onCancelEdit">취소</button>
              <button class="btn btn_close" @click="onCloseDetail">닫기</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref, reactive, computed, onMounted } = Vue;

    // 1) ref/reactive
    const pager = reactive({ pageNo: 1, pageSize: 20, keyword: '' });
    const listState = reactive({ list: [], total: 0, totalPage: 0 });
    const uiState = reactive({ selectedId: null, mode: null, isNew: false });
    const form = reactive({ clientId: '', clientNm: '', useYn: 'Y', clientPwd: '' });

    // 2) computed
    const cfReadonly = computed(() => uiState.mode === 'view');

    // 3) 조회
    const fnLoadList = async () => {
      try {
        const qs = new URLSearchParams({ keyword: pager.keyword, pageNo: pager.pageNo, pageSize: pager.pageSize });
        const data = await cfAuth.cfApi('/api/cdn/client/page?' + qs.toString());
        listState.list = data.pageList;
        listState.total = data.pageTotalCount;
        listState.totalPage = data.pageTotalPage;
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    // 4) 이벤트 핸들러(on*) — 조회는 버튼/Enter 클릭 시에만(검색 정책)
    const onSearch = () => { pager.pageNo = 1; fnLoadList(); };
    const onReset = () => { pager.keyword = ''; pager.pageNo = 1; fnLoadList(); };
    const onSetPage = (p) => { pager.pageNo = p; fnLoadList(); };

    const onSelect = async (clientId) => {
      try {
        const data = await cfAuth.cfApi('/api/cdn/client/' + encodeURIComponent(clientId));
        uiState.selectedId = clientId;
        uiState.isNew = false;
        uiState.mode = 'view';
        Object.assign(form, { clientId: data.clientId, clientNm: data.clientNm, useYn: data.useYn, clientPwd: '' });
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const onNew = () => {
      uiState.selectedId = null;
      uiState.isNew = true;
      uiState.mode = 'edit';
      Object.assign(form, { clientId: '', clientNm: '', useYn: 'Y', clientPwd: '' });
    };

    const onSwitchEdit = () => { uiState.mode = 'edit'; };
    const onCancelEdit = () => onSelect(uiState.selectedId);

    const onCloseDetail = () => {
      uiState.selectedId = null;
      uiState.isNew = false;
      uiState.mode = null;
    };

    const onSave = async () => {
      if (!form.clientNm.trim()) return cfAuth.showToast('clientNm 을 입력하세요.', true);
      if (uiState.isNew && (!form.clientId.trim() || !form.clientPwd)) {
        return cfAuth.showToast('신규 등록은 clientId/비밀번호가 필수입니다.', true);
      }
      if (!confirm('저장하시겠습니까?')) return;
      try {
        if (uiState.isNew) {
          await cfAuth.cfApi('/api/cdn/client', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: form.clientId.trim(), clientNm: form.clientNm.trim(), clientPwd: form.clientPwd }),
          });
        } else {
          const body = { clientNm: form.clientNm.trim(), useYn: form.useYn };
          if (form.clientPwd) body.clientPwd = form.clientPwd;
          await cfAuth.cfApi('/api/cdn/client/' + encodeURIComponent(uiState.selectedId), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });
        }
        cfAuth.showToast('저장되었습니다.');
        const savedId = form.clientId;
        uiState.isNew = false;
        await fnLoadList();
        await onSelect(savedId || uiState.selectedId);
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const onDelete = async () => {
      if (!confirm('삭제하시겠습니까? (EcAdminApi 등 이 계정으로 호출하는 서비스가 있으면 연동이 끊깁니다)')) return;
      try {
        await cfAuth.cfApi('/api/cdn/client/' + encodeURIComponent(uiState.selectedId), { method: 'DELETE' });
        cfAuth.showToast('삭제되었습니다.');
        onCloseDetail();
        fnLoadList();
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const fnFmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '-');

    // 5) onMounted — shell 이 로그인 게이트를 이미 통과시킨 뒤에만 이 컴포넌트가 렌더되므로 바로 조회
    onMounted(fnLoadList);

    return {
      pager, listState, uiState, form, cfReadonly,
      onSearch, onReset, onSetPage, onSelect, onNew, onSwitchEdit, onCancelEdit,
      onCloseDetail, onSave, onDelete, fnFmtDate,
    };
  },
};
