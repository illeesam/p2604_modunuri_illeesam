/* ShopJoy Admin - 채팅 칸반 보드 */
window.CmChattKanban = {
  name: 'CmChattKanban',
  props: {
    navigate: { type: Function, required: true }, // 페이지 이동
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    const showToast   = window.boApp.showToast;
    const showConfirm = window.boApp.showConfirm;

    /* ── 칸반 컬럼 정의 ── */
    const KANBAN_COLS = [
      { key: 'OPEN',    label: '대기중',   icon: '🟡', color: '#f59e0b', bg: '#fffbeb', border: '#fbbf24' },
      { key: 'PENDING', label: '상담중',   icon: '🟢', color: '#10b981', bg: '#f0fdf4', border: '#34d399' },
      { key: 'CLOSED',  label: '종료',     icon: '⚫', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
    ];

    const codes   = reactive({ chatt_statuses: [], date_range_opts: [] });
    const rooms   = reactive([]);          // 전체 채팅룸 목록
    const flashSet = reactive(new Set());  // 반짝 중인 채팅룸 ID 집합
    const uiState = reactive({
      loading: false, isPageCodeLoad: false,
      activeChatId: null,                 // 현재 활성 탭 채팅룸 ID
    });

    /* 검색 조건 */
    const _initSearch = () => ({
      searchValue: '',
      chattStatusCd: '',
      dateStart: `${new Date().getFullYear() - 1}-01-01`,
      dateEnd:   `${new Date().getFullYear()}-12-31`,
    });
    const searchParam = reactive(_initSearch());

    /* ── 하단 채팅 탭 목록 ──
       openTabs: 참여한 채팅룸들 (각각 독립 메시지/입력 상태 유지)
       { chattId, subject, memberNm, chattStatusCd, messages:[], replyText:'', pollTimer, pollLastId, msgBoxRef, unread }
    */
    const openTabs = reactive([]);   // 열린 채팅 탭 목록
    const msgBoxRefs = reactive({}); // { chattId: el }
    let kanbanTimer  = null;

    /* ── 카드 펼침 상태 & 드래그 상태 ── */
    const expanded  = reactive({});  // { [chattId]: true/false } — Set 대신 객체(Vue 감지 안정)
    const dragState = reactive({ draggingId: null, overCol: null });

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'search-list')    { return handleSearchRooms(); }
      if (cmd === 'search-reset')   { Object.assign(searchParam, _initSearch()); return handleSearchRooms(); }
      if (cmd === 'tab-send')       { return sendReply(param.id); }
      if (cmd === 'tab-close-chat') { return closeActiveChat(param.id); }
      if (cmd === 'tab-close')      { return closeTab(param.id); }
      if (cmd === 'tab-select')     { return selectTab(param.id); }
      if (cmd === 'card-toggle')    { return fnToggleCard(param.id); }
      if (cmd === 'attach-add')     { return fnAttachAdd(param.id, param.event); }
      if (cmd === 'attach-remove')  { return fnAttachRemove(param.id, param.fi); }
      /* drag */
      if (cmd === 'drag-start')     { dragState.draggingId = param.id; return; }
      if (cmd === 'drag-end')       { dragState.draggingId = null; dragState.overCol = null; return; }
      if (cmd === 'drag-over-col')  { dragState.overCol = param.col; return; }
      if (cmd === 'drag-drop-col')  { return fnDropToCol(param.col); }
    };

    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'kanban-cellClick') {
        if (colKey === 'btn_join') { return openChat(row.chattId); }
      }
    };

    /* ##### [04] 내장 사용 함수 #################################################### */

    /* handleSearchRooms — 전체 채팅룸 목록 조회 */
    const handleSearchRooms = async () => {
      uiState.loading = true;
      try {
        const params = { pageSize: 200, pageNo: 1, ...coUtil.cofOmitEmpty(searchParam) };
        if (params.searchValue && !params.searchType) { params.searchType = 'memberNm,subject'; }
        const res  = await boApiSvc.cmChatt.getPage(params, '채팅칸반', '목록조회');
        const list = res.data?.data?.pageList || [];
        /* 신규 메시지(미읽음) 감지 → flash */
        list.forEach(r => {
          const prev = rooms.find(x => x.chattId === r.chattId);
          if (prev && r.memberUnreadCnt > (prev.memberUnreadCnt || 0)) { triggerFlash(r.chattId); }
        });
        rooms.splice(0, rooms.length, ...list);
        /* 신규 카드는 기본 펼침 상태 */
        list.forEach(r => { if (expanded[r.chattId] === undefined) { expanded[r.chattId] = true; } });
      } catch (err) {
        console.error('[kanban-load]', err);
      } finally {
        uiState.loading = false;
      }
    };

    /* triggerFlash — 5초간 반짝 애니메이션 */
    const triggerFlash = (id) => {
      flashSet.add(id);
      setTimeout(() => { flashSet.delete(id); }, 5000);
    };

    /* _getTab — ID로 탭 조회 */
    const _getTab = (id) => openTabs.find(t => t.chattId === id);

    /* openChat — 하단 탭에 채팅룸 열기 */
    const openChat = async (id) => {
      /* 이미 열려있으면 그 탭으로 포커스만 */
      if (_getTab(id)) { selectTab(id); return; }
      /* 새 탭 생성 */
      const tab = reactive({
        chattId: id, subject: '로딩 중...', memberNm: '', chattStatusCd: 'OPEN',
        messages: [], replyText: '', pollTimer: null, pollLastId: null, unread: 0,
        _pendingFiles: [],
      });
      openTabs.push(tab);
      selectTab(id);
      try {
        const r1 = await boApiSvc.cmChatt.getById(id, '채팅칸반', '상세');
        const info = r1.data?.data || {};
        tab.subject = info.subject || '(제목없음)';
        /* memberNm: members 배열 중 MEMBER 타입의 refNm, 없으면 칸반 카드에서 복사 */
        const memberEntry = (info.members || []).find(m => m.memberTypeCd === 'MEMBER');
        const roomCard = rooms.find(x => x.chattId === id);
        tab.memberNm = memberEntry?.refNm || roomCard?.memberNm || '';
        tab.chattStatusCd = info.chattStatusCd || 'OPEN';
        const r2 = await boApiSvc.cmChatt.getMessages(id, {}, '채팅칸반', '메시지');
        const msgs = Array.isArray(r2.data?.data) ? r2.data.data : [];
        tab.messages.push(...msgs);
        if (msgs.length) { tab.pollLastId = msgs[msgs.length - 1].chattMsgId; }
        scrollToBottom(id);
        if (roomCard) { roomCard.memberUnreadCnt = 0; }
        if (tab.chattStatusCd === 'OPEN' || tab.chattStatusCd === 'PENDING') { fnStartPoll(tab); }
      } catch (err) {
        showToast('채팅 정보를 불러오지 못했습니다.', 'error');
        closeTab(id);
      }
    };

    /* selectTab — 탭 선택 */
    const selectTab = (id) => { uiState.activeChatId = id; nextTick(() => scrollToBottom(id)); };

    /* closeTab — 탭 닫기 */
    const closeTab = (id) => {
      const tab = _getTab(id);
      if (tab && tab.pollTimer) { clearInterval(tab.pollTimer); tab.pollTimer = null; }
      const idx = openTabs.findIndex(t => t.chattId === id);
      if (idx >= 0) { openTabs.splice(idx, 1); }
      if (uiState.activeChatId === id) {
        uiState.activeChatId = openTabs.length ? openTabs[Math.max(0, idx - 1)].chattId : null;
      }
    };

    /* sendReply — 메시지 전송 (탭별) */
    const sendReply = async (id) => {
      const tab = _getTab(id);
      if (!tab) { return; }
      const text = tab.replyText.trim();
      if (!text) { return; }
      const tempMsg = { chattMsgId: '_tmp_' + Date.now(), senderTypeCd: 'ADMIN', msgText: text, sendDate: new Date().toISOString(), _pending: true };
      tab.messages.push(tempMsg);
      tab.replyText = '';
      scrollToBottom(id);
      try {
        const res = await boApiSvc.cmChatt.sendMsg(id, { msgText: text, senderTypeCd: 'ADMIN' }, '채팅칸반', '전송');
        const saved = res.data?.data;
        if (saved) { tempMsg.chattMsgId = saved.chattMsgId; tempMsg.sendDate = saved.sendDate; tab.pollLastId = saved.chattMsgId; }
        tempMsg._pending = false;
      } catch (err) {
        tempMsg._error = true; tempMsg._pending = false;
        showToast(err.response?.data?.message || '전송 실패', 'error');
      }
    };

    /* closeActiveChat — 채팅 종료 (탭별) */
    const closeActiveChat = async (id) => {
      const tab = _getTab(id);
      if (!tab) { return; }
      const ok = await showConfirm('채팅 종료', '채팅을 종료하시겠습니까?');
      if (!ok) { return; }
      try {
        await boApiSvc.cmChatt.updateStatus(id, { statusCd: 'CLOSED' }, '채팅칸반', '채팅종료');
        tab.chattStatusCd = 'CLOSED';
        if (tab.pollTimer) { clearInterval(tab.pollTimer); tab.pollTimer = null; }
        tab.messages.push({ chattMsgId: '_sys_' + Date.now(), senderTypeCd: 'SYSTEM', msgText: '채팅이 종료되었습니다.', sendDate: new Date().toISOString() });
        scrollToBottom(id);
        showToast('채팅이 종료되었습니다.');
        handleSearchRooms();
      } catch (err) {
        showToast(err.response?.data?.message || '종료 처리 실패', 'error');
      }
    };

    /* fnStartPoll — 탭별 신규 메시지 폴링 (3초) */
    const fnStartPoll = (tab) => {
      if (tab.pollTimer) { return; }
      tab.pollTimer = setInterval(async () => {
        try {
          const params = tab.pollLastId ? { afterMsgId: tab.pollLastId } : {};
          const res = await boApiSvc.cmChatt.getMessages(tab.chattId, params, '채팅칸반', '폴링');
          const newMsgs = res.data?.data || [];
          if (newMsgs.length) {
            tab.messages.push(...newMsgs);
            tab.pollLastId = newMsgs[newMsgs.length - 1].chattMsgId;
            triggerFlash(tab.chattId);
            /* 활성 탭이면 즉시 스크롤, 아니면 unread 카운트 */
            if (uiState.activeChatId === tab.chattId) { scrollToBottom(tab.chattId); }
            else { tab.unread++; }
          }
        } catch (_) {}
      }, 3000);
    };

    /* fnStartKanbanPoll — 칸반 목록 자동 갱신 (10초) */
    const fnStartKanbanPoll = () => { kanbanTimer = setInterval(() => handleSearchRooms(), 10000); };
    const fnStopKanbanPoll  = () => { if (kanbanTimer) { clearInterval(kanbanTimer); kanbanTimer = null; } };

    /* scrollToBottom — 메시지 박스 하단 스크롤 */
    const scrollToBottom = (id) => {
      nextTick(() => { const el = msgBoxRefs[id]; if (el) { el.scrollTop = el.scrollHeight; } });
    };

    /* fnLoadCodes */
    const fnLoadCodes = () => {
      const s = window.sfGetBoCodeStore();
      codes.chatt_statuses   = s.sgGetGrpCodes('CHATT_STATUS');
      codes.date_range_opts  = s.sgGetGrpCodes('DATE_RANGE_OPT');
      uiState.isPageCodeLoad = true;
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    onMounted(() => {
      if (isAppReady.value) { fnLoadCodes(); }
      handleSearchRooms();
      fnStartKanbanPoll();
    });
    onUnmounted(() => {
      openTabs.forEach(t => { if (t.pollTimer) { clearInterval(t.pollTimer); } });
      fnStopKanbanPoll();
    });

    /* ##### [05] 사용자 함수 #################################################### */

    /* fnToggleCard — 카드 내용란 펼침/접힘 */
    const fnToggleCard = (id) => { expanded[id] = !expanded[id]; };

    /* fnDropToCol — 드래그된 카드를 다른 컬럼(상태)으로 이동 */
    const fnDropToCol = async (targetColKey) => {
      const id = dragState.draggingId;
      dragState.draggingId = null;
      dragState.overCol = null;
      if (!id || !targetColKey) { return; }
      const room = rooms.find(r => r.chattId === id);
      if (!room || room.chattStatusCd === targetColKey) { return; }
      /* CLOSED → 다른 컬럼 이동 방지 */
      if (room.chattStatusCd === 'CLOSED') { showToast('종료된 채팅은 이동할 수 없습니다.', 'error'); return; }
      /* CLOSED로 이동하면 종료 확인 */
      if (targetColKey === 'CLOSED') {
        const ok = await showConfirm('채팅 종료', '이 채팅을 종료 처리하시겠습니까?');
        if (!ok) { return; }
      }
      const prevStatus = room.chattStatusCd;
      room.chattStatusCd = targetColKey; // 낙관적 업데이트
      try {
        await boApiSvc.cmChatt.updateStatus(id, { statusCd: targetColKey }, '채팅칸반', '상태변경');
        /* 열린 탭에 있으면 탭 상태도 갱신 */
        const tab = openTabs.find(t => t.chattId === id);
        if (tab) {
          tab.chattStatusCd = targetColKey;
          if (targetColKey === 'CLOSED' && tab.pollTimer) { clearInterval(tab.pollTimer); tab.pollTimer = null; }
        }
        showToast('상태가 변경되었습니다.');
      } catch (err) {
        room.chattStatusCd = prevStatus; // 롤백
        showToast(err.response?.data?.message || '상태 변경 실패', 'error');
      }
    };

    /* cfRoomsByCol — 컬럼별 채팅룸 필터 */
    const cfRoomsByCol = (colKey) => rooms.filter(r => {
      const s = r.chattStatusCd || '';
      if (colKey === 'OPEN')    { return s === 'OPEN'; }
      if (colKey === 'PENDING') { return s === 'PENDING' || s === '진행중'; }
      if (colKey === 'CLOSED')  { return s === 'CLOSED' || s === '종료'; }
      return false;
    });

    /* fnTabActive — 탭이 진행중인지 */
    const fnTabActive = (tab) => { const s = tab.chattStatusCd; return s === 'OPEN' || s === 'PENDING' || s === '진행중'; };

    /* fnUnread — 칸반 카드 미읽음 배지 */
    const fnUnread = (room) => room.memberUnreadCnt > 0 ? room.memberUnreadCnt : 0;

    /* fnIsFlashing — 반짝 여부 */
    const fnIsFlashing = (id) => flashSet.has(id);

    /* fnIsActive — 선택된 칸반 카드 여부 (열린 탭에 있으면 표시) */
    const fnIsActive = (id) => !!_getTab(id);

    /* fnMsgTime — 메시지 시간 표시 */
    const fnMsgTime = (v) => v ? String(v).slice(11, 16) : '';

    /* fnRoomMemberNm — 채팅룸 회원 이름 (members[0].refNm 기준) */
    const fnRoomMemberNm = (room) => {
      if (!room) return '(미확인)';
      const m = room.members ? room.members.find(x => x.memberTypeCd === 'MEMBER') || room.members[0] : null;
      return (m ? m.refNm : '') || '(미확인)';
    };

    /* fnRoomTime — 채팅룸 시간 표시 */
    const fnRoomTime = (room) => {
      const d = room.lastMsgDate || room.regDate || '';
      return d ? String(d).replace('T', ' ').slice(0, 16) : '';
    };

    /* fnSetMsgBoxRef — template :ref 콜백 */
    const fnSetMsgBoxRef = (id, el) => { if (el) { msgBoxRefs[id] = el; } else { delete msgBoxRefs[id]; } };

    /* fnAttachAdd — 파일 선택 시 탭의 _pendingFiles에 추가 */
    const fnAttachAdd = (id, event) => {
      const tab = openTabs.find(t => t.chattId === id);
      if (!tab) return;
      if (!tab._pendingFiles) { tab._pendingFiles = []; }
      const files = Array.from(event.target.files || []);
      files.forEach(file => {
        const entry = { file, name: file.name, preview: null };
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = e => { entry.preview = e.target.result; };
          reader.readAsDataURL(file);
        }
        tab._pendingFiles.push(entry);
      });
      event.target.value = '';
    };

    /* fnAttachRemove — 첨부 미리보기에서 제거 */
    const fnAttachRemove = (id, fi) => {
      const tab = openTabs.find(t => t.chattId === id);
      if (!tab || !tab._pendingFiles) return;
      tab._pendingFiles.splice(fi, 1);
    };

    /* ##### [06] return ######################################################### */

    return {
      KANBAN_COLS, codes, rooms, uiState, searchParam, openTabs, flashSet,
      expanded, dragState,
      handleBtnAction, handleGridCellAction,
      cfRoomsByCol, fnTabActive,
      fnUnread, fnIsFlashing, fnIsActive, fnMsgTime, fnRoomTime, fnRoomMemberNm,
      fnSetMsgBoxRef, openChat, selectTab,
      fnAttachAdd, fnAttachRemove,
    };
  },
  template: /* html */`
<div data-chk="1" style="display:flex;flex-direction:column;height:calc(100vh - 94px);overflow:hidden;background:#f1f5f9;">

  <!-- ===== [A] 상단: 칸반 보드 영역 (전체 높이의 약 40%) ===== -->
  <div style="flex:0 0 40%;display:flex;flex-direction:column;min-height:0;">
    <!-- 타이틀 + 검색바 -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#fff;border-bottom:1px solid #e5e7eb;flex-shrink:0;flex-wrap:wrap;">
      <span style="font-size:15px;font-weight:800;color:#1a1a2e;margin-right:4px;">💬 채팅 칸반 보드</span>
      <input v-model="searchParam.searchValue" placeholder="회원명 · 제목 검색"
        style="height:30px;width:150px;border:1px solid #d1d5db;border-radius:6px;padding:0 8px;font-size:12px;outline:none;"
        @keyup.enter="handleBtnAction('search-list')" />
      <select v-model="searchParam.chattStatusCd"
        style="height:30px;width:88px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;background:#fff;outline:none;">
        <option value="">상태 전체</option>
        <option v-for="c in codes.chatt_statuses" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input type="date" v-model="searchParam.dateStart"
        style="height:30px;width:126px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;outline:none;" />
      <span style="color:#bbb;font-size:11px;">~</span>
      <input type="date" v-model="searchParam.dateEnd"
        style="height:30px;width:126px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;outline:none;" />
      <button class="btn btn_search" style="height:30px;font-size:12px;" @click="handleBtnAction('search-list')">조회</button>
      <button class="btn btn_reset"  style="height:30px;font-size:12px;" @click="handleBtnAction('search-reset')">초기화</button>
    </div>
    <!-- 칸반 3열: 각 컬럼이 독립 스크롤 -->
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:8px 12px;overflow-y:auto;min-height:0;">
      <div v-for="col in KANBAN_COLS" :key="col.key"
        :style="'display:flex;flex-direction:column;border-radius:10px;border:2px solid '+(dragState.overCol===col.key ? col.color : col.border)+';transition:border-color .15s;min-height:100%;'"
        @dragover.prevent="handleBtnAction('drag-over-col', {col: col.key})"
        @dragleave="handleBtnAction('drag-over-col', {col: null})"
        @drop.prevent="handleBtnAction('drag-drop-col', {col: col.key})">
        <!-- 컬럼 헤더 -->
        <div :style="'display:flex;align-items:center;gap:5px;padding:8px 12px;font-size:12px;font-weight:800;flex-shrink:0;border-radius:8px 8px 0 0;background:'+col.bg+';color:'+col.color+';border-bottom:2px solid '+col.border+';'">
          <span style="font-size:14px;">{{ col.icon }}</span>
          <span>{{ col.label }}</span>
          <span :style="'margin-left:auto;font-size:10px;background:rgba(0,0,0,.1);border-radius:8px;padding:1px 7px;'">
            {{ cfRoomsByCol(col.key).length }}
          </span>
        </div>
        <!-- 카드 목록 (컬럼 내 세로 펼침 — 스크롤 없이 늘어남) -->
        <div :style="'flex:1;padding:6px;display:flex;flex-direction:column;gap:5px;background:'+(dragState.overCol===col.key ? col.bg+'99' : col.bg+'44')+';border-radius:0 0 8px 8px;transition:background .15s;'">
          <div v-if="cfRoomsByCol(col.key).length===0"
            style="text-align:center;color:#9ca3af;font-size:11px;padding:16px 0;">채팅 없음</div>

          <!-- ===== 채팅룸 카드 (헤더 + 내용란) ===== -->
          <div v-for="room in cfRoomsByCol(col.key)" :key="room.chattId"
            :class="fnIsFlashing(room.chattId) ? 'chk-flash' : ''"
            :style="'background:#fff;border-radius:8px;border:1.5px solid '+(fnIsActive(room.chattId)?'#e8587a':'#e5e7eb')+';overflow:hidden;box-shadow:'+(dragState.draggingId===room.chattId?'0 8px 24px rgba(0,0,0,.22)':'0 1px 3px rgba(0,0,0,.06)')+';opacity:'+(dragState.draggingId===room.chattId?'.55':'1')+';'">

            <!-- ── 카드 헤더 (드래그 전용 핸들) ── -->
            <div
              draggable="true"
              @dragstart.stop="handleBtnAction('drag-start', {id: room.chattId})"
              @dragend.stop="handleBtnAction('drag-end', {})"
              :style="'display:flex;align-items:center;gap:5px;padding:7px 10px;cursor:grab;user-select:none;background:'+(dragState.draggingId===room.chattId?col.bg:'#fafafa')+';border-bottom:1px solid #f0f0f0;'">
              <span style="font-size:14px;color:#c4c4c4;flex-shrink:0;letter-spacing:1px;">⠿</span>
              <span :style="'font-size:10px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:'+col.bg+';border:1px solid '+col.border+';flex-shrink:0;'">👤</span>
              <span style="font-size:11px;font-weight:700;color:#1f2937;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ fnRoomMemberNm(room) }}</span>
              <span v-if="fnUnread(room)" style="background:#ef4444;color:#fff;border-radius:10px;padding:0 5px;font-size:9px;font-weight:700;flex-shrink:0;">{{ fnUnread(room) }}</span>
              <span @click.stop="handleBtnAction('card-toggle', {id: room.chattId})"
                :style="'font-size:11px;color:#aaa;cursor:pointer;flex-shrink:0;display:inline-block;transition:transform .2s;transform:'+(expanded[room.chattId]?'rotate(180deg)':'rotate(0deg)')+';'">▼</span>
            </div>

            <!-- ── 카드 내용란 (▼ 클릭으로 토글) ── -->
            <div v-if="expanded[room.chattId]"
              style="padding:8px 10px 10px;background:#fff;">
              <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:4px;line-height:1.4;word-break:break-all;">{{ room.subject || '(제목없음)' }}</div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:10px;color:#9ca3af;">🕐 {{ fnRoomTime(room) }}</span>
                <span v-if="room.memberUnreadCnt > 0" style="font-size:10px;color:#ef4444;font-weight:600;">미읽음 {{ room.memberUnreadCnt }}</span>
              </div>
              <button @click.stop="openChat(room.chattId)"
                style="width:100%;background:#e8587a;color:#fff;border:none;border-radius:5px;padding:5px 0;font-size:11px;font-weight:700;cursor:pointer;">
                💬 참여
              </button>
            </div>
          </div>
          <!-- ===== /카드 끝 ===== -->

        </div>
      </div>
    </div>
  </div>

  <!-- ===== [B] 구분선 ===== -->
  <div style="flex-shrink:0;height:6px;background:linear-gradient(to bottom,#e5e7eb,#f1f5f9);border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"></div>

  <!-- ===== [C] 하단: 채팅 상담 탭 영역 ===== -->
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;background:#fff;">
    <!-- 탭 헤더 바 -->
    <div style="display:flex;align-items:stretch;background:linear-gradient(to right,#fff0f4,#fff8fb);border-bottom:1px solid #f3e0e8;flex-shrink:0;overflow-x:auto;min-height:36px;">
      <!-- 고정 레이블 -->
      <div style="display:flex;align-items:center;padding:0 14px;font-size:12px;font-weight:800;color:#9f2946;white-space:nowrap;border-right:1px solid #f3e0e8;flex-shrink:0;">
        💬 채팅 상담
      </div>
      <!-- 탭 없을 때 안내 -->
      <div v-if="openTabs.length===0"
        style="display:flex;align-items:center;padding:0 16px;font-size:12px;color:#bbb;">
        칸반에서 [▶ 참여] 버튼을 클릭하면 탭이 열립니다
      </div>
      <!-- 채팅 탭 목록 -->
      <div v-for="tab in openTabs" :key="tab.chattId"
        :style="'display:flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;border-right:1px solid #f3e0e8;font-size:12px;flex-shrink:0;border-bottom:2px solid '+(uiState.activeChatId===tab.chattId?'#e8587a':'transparent')+';background:'+(uiState.activeChatId===tab.chattId?'#fff':'transparent')+';'"
        @click="handleBtnAction('tab-select', {id: tab.chattId})">
        <span :style="'font-size:10px;color:'+(tab.chattStatusCd==='CLOSED'?'#9ca3af':'#10b981')+';'">{{ tab.chattStatusCd==='CLOSED' ? '⚫' : '🟢' }}</span>
        <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151;">{{ tab.subject }}</span>
        <span v-if="tab.unread" style="background:#ef4444;color:#fff;border-radius:10px;padding:0 5px;font-size:10px;font-weight:700;">{{ tab.unread }}</span>
        <button @click.stop="handleBtnAction('tab-close', {id: tab.chattId})"
          style="background:none;border:none;cursor:pointer;font-size:15px;color:#bbb;padding:0 2px;line-height:1;">×</button>
      </div>
    </div>

    <!-- 탭 없을 때 빈 화면 -->
    <div v-if="openTabs.length===0"
      style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#bbb;gap:12px;">
      <span style="font-size:40px;opacity:.2;">💬</span>
      <span style="font-size:13px;">참여한 채팅이 없습니다</span>
    </div>

    <!-- 탭 컨텐츠 (flex:1 고정, 비활성은 position:absolute+visibility:hidden으로 숨김) -->
    <div v-for="tab in openTabs" :key="tab.chattId + '_body'"
      :style="uiState.activeChatId===tab.chattId ? 'flex:1;display:flex;overflow:hidden;min-height:0;' : 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden;'">

      <!-- ─── 좌: 메시지 + 입력창 (flex-col) ─── -->
      <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;min-width:0;">

        <!-- 메시지 목록 -->
        <div style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;background:#f8f9fb;"
          :ref="el => fnSetMsgBoxRef(tab.chattId, el)">
          <template v-for="msg in tab.messages" :key="msg.chattMsgId">
            <!-- 시스템 메시지 -->
            <div v-if="msg.senderTypeCd==='SYSTEM'"
              style="text-align:center;font-size:11px;color:#9ca3af;background:#eff2f5;border-radius:6px;padding:3px 14px;margin:0 30px;">
              {{ msg.msgText }}
            </div>
            <!-- 회원 메시지 (좌측) -->
            <div v-else-if="msg.senderTypeCd==='MEMBER'" style="display:flex;gap:8px;align-items:flex-end;">
              <div style="width:28px;height:28px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">👤</div>
              <div style="max-width:65%;">
                <div style="font-size:10px;color:#888;margin-bottom:2px;">{{ tab.memberNm }}</div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0 10px 10px 10px;padding:8px 12px;font-size:13px;line-height:1.6;word-break:break-word;">{{ msg.msgText }}</div>
                <!-- 첨부 이미지 -->
                <div v-if="msg.attachFiles &amp;&amp; msg.attachFiles.length" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;">
                  <a v-for="f in msg.attachFiles" :key="f.attachId" :href="f.attachUrl" target="_blank"
                    style="display:block;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;">
                    <img v-if="f.thumbUrl" :src="f.thumbUrl" style="width:100%;height:100%;object-fit:cover;" />
                    <span v-else style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;background:#f3f4f6;">📎</span>
                  </a>
                </div>
                <div style="font-size:10px;color:#bbb;margin-top:3px;">{{ fnMsgTime(msg.sendDate) }}</div>
              </div>
            </div>
            <!-- 상담사 메시지 (우측) -->
            <div v-else style="display:flex;flex-direction:row-reverse;gap:8px;align-items:flex-end;">
              <div style="width:28px;height:28px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">💁</div>
              <div style="max-width:65%;">
                <div style="font-size:10px;color:#888;margin-bottom:2px;text-align:right;">상담사</div>
                <div :style="'background:#e8587a;color:#fff;border-radius:10px 0 10px 10px;padding:8px 12px;font-size:13px;line-height:1.6;word-break:break-word;'+(msg._error?'opacity:.6;':'')">{{ msg.msgText }}</div>
                <!-- 첨부 이미지 -->
                <div v-if="msg.attachFiles &amp;&amp; msg.attachFiles.length" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;justify-content:flex-end;">
                  <a v-for="f in msg.attachFiles" :key="f.attachId" :href="f.attachUrl" target="_blank"
                    style="display:block;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid #fda4af;">
                    <img v-if="f.thumbUrl" :src="f.thumbUrl" style="width:100%;height:100%;object-fit:cover;" />
                    <span v-else style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;background:#fce7f3;">📎</span>
                  </a>
                </div>
                <div style="font-size:10px;color:#bbb;margin-top:3px;text-align:right;">
                  <span v-if="msg._pending" style="color:#aaa;">전송 중...</span>
                  <span v-else-if="msg._error" style="color:#f87171;">실패</span>
                  <span v-else>{{ fnMsgTime(msg.sendDate) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-if="tab.messages.length===0"
            style="text-align:center;color:#aaa;padding:40px 0;font-size:12px;">메시지가 없습니다.</div>
        </div>

        <!-- ─── 입력 영역 (메시지 목록 하단 고정) ─── -->
        <div style="flex-shrink:0;border-top:1px solid #f1f5f9;background:#fff;">
          <!-- 종료된 채팅 안내 -->
          <div v-if="!fnTabActive(tab)"
            style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#f9fafb;">
            <span style="font-size:12px;color:#9ca3af;">● 종료된 채팅입니다.</span>
            <button class="btn btn_close" style="font-size:11px;" @click="handleBtnAction('tab-close', {id: tab.chattId})">탭 닫기</button>
          </div>
          <!-- 진행 중 입력창 -->
          <div v-if="fnTabActive(tab)" style="display:flex;flex-direction:column;">
            <!-- 첨부 미리보기 -->
            <div v-if="tab._pendingFiles &amp;&amp; tab._pendingFiles.length"
              style="display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px 0;border-top:1px solid #f1f5f9;background:#fafafa;">
              <div v-for="(f, fi) in tab._pendingFiles" :key="fi"
                style="position:relative;width:60px;height:60px;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;">
                <img v-if="f.preview" :src="f.preview" style="width:100%;height:100%;object-fit:cover;" />
                <span v-else style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;background:#f3f4f6;">📎</span>
                <button @click="handleBtnAction('attach-remove', {id: tab.chattId, fi})"
                  style="position:absolute;top:1px;right:1px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:16px;height:16px;font-size:11px;line-height:1;cursor:pointer;padding:0;">×</button>
              </div>
            </div>
            <!-- textarea + 버튼 행 -->
            <div style="display:flex;align-items:flex-end;gap:0;padding:0;">
              <textarea v-model="tab.replyText" rows="3"
                placeholder="메시지를 입력하세요... (Enter: 전송 / Shift+Enter: 줄바꿈)"
                style="flex:1;resize:none;font-size:13px;line-height:1.5;padding:10px 12px;border:none;outline:none;background:#fff;font-family:inherit;"
                @keydown.enter.exact.prevent="handleBtnAction('tab-send', {id: tab.chattId})">
              </textarea>
              <!-- 우측 버튼 세로 스택 -->
              <div style="display:flex;flex-direction:column;gap:4px;padding:8px 10px;align-items:center;border-left:1px solid #f1f5f9;flex-shrink:0;">
                <!-- 첨부 버튼 -->
                <label :for="'attach-' + tab.chattId"
                  style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:#f3f4f6;cursor:pointer;font-size:18px;border:1px solid #e5e7eb;"
                  title="파일 첨부">📎
                  <input :id="'attach-' + tab.chattId" type="file" multiple accept="image/*,application/pdf"
                    style="display:none;"
                    @change="handleBtnAction('attach-add', {id: tab.chattId, event: $event})" />
                </label>
                <!-- 전송 버튼 -->
                <button @click="handleBtnAction('tab-send', {id: tab.chattId})"
                  style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:#e8587a;color:#fff;border:none;cursor:pointer;font-size:18px;"
                  title="전송 (Enter)">➤</button>
              </div>
            </div>
            <!-- 하단 액션 바 -->
            <div style="display:flex;align-items:center;justify-content:flex-end;padding:4px 10px 6px;gap:6px;border-top:1px solid #f9f0f3;">
              <span style="font-size:11px;color:#bbb;flex:1;">Shift+Enter: 줄바꿈</span>
              <button class="btn btn_cancel" style="font-size:11px;padding:3px 10px;"
                @click="handleBtnAction('tab-close-chat', {id: tab.chattId})">채팅 종료</button>
              <button class="btn btn_close" style="font-size:11px;padding:3px 10px;"
                @click="handleBtnAction('tab-close', {id: tab.chattId})">탭 닫기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── 우: 채팅룸 정보 사이드 패널 ─── -->
      <div style="width:220px;flex-shrink:0;border-left:1px solid #f1f5f9;display:flex;flex-direction:column;background:#fff;overflow-y:auto;">
        <div style="padding:14px 14px 10px;border-bottom:1px solid #f9f0f3;">
          <div style="font-size:13px;font-weight:700;color:#1f2937;margin-bottom:5px;word-break:break-all;">{{ tab.subject }}</div>
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <span style="font-size:12px;color:#555;">👤 {{ tab.memberNm || '(미확인)' }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            <span class="badge" :class="fnTabActive(tab) ? 'badge-green' : 'badge-gray'" style="font-size:10px;">{{ fnTabActive(tab) ? '진행중' : '종료' }}</span>
            <span v-if="fnTabActive(tab)" style="font-size:10px;color:#15803d;font-weight:700;">● LIVE</span>
          </div>
        </div>
        <div style="padding:10px 14px;font-size:11px;color:#9ca3af;line-height:1.8;">
          <div>채팅 ID: <span style="color:#6b7280;font-family:monospace;">{{ tab.chattId }}</span></div>
          <div>상태: <span style="color:#6b7280;">{{ tab.chattStatusCd }}</span></div>
        </div>
      </div>
    </div>
  </div>

</div>
`,
};
