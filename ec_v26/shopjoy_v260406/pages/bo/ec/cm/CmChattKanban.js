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
       { chattRoomId, subject, memberNm, chattStatusCd, messages:[], replyText:'', pollTimer, pollLastId, msgBoxRef, unread }
    */
    const openTabs = reactive([]);   // 열린 채팅 탭 목록
    const msgBoxRefs = reactive({}); // { chattRoomId: el }
    let kanbanTimer  = null;

    /* ##### [02] 액션 모음 (dispatch) ############################################## */

    const handleBtnAction = (cmd, param = {}) => {
      if (cmd === 'search-list')    { return handleSearchRooms(); }
      if (cmd === 'search-reset')   { Object.assign(searchParam, _initSearch()); return handleSearchRooms(); }
      if (cmd === 'tab-send')       { return sendReply(param.id); }
      if (cmd === 'tab-close-chat') { return closeActiveChat(param.id); }
      if (cmd === 'tab-close')      { return closeTab(param.id); }
      if (cmd === 'tab-select')     { return selectTab(param.id); }
    };

    const handleGridCellAction = (cmd, colKey, row) => {
      if (cmd === 'kanban-cellClick') {
        if (colKey === 'btn_join') { return openChat(row.chattRoomId); }
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
          const prev = rooms.find(x => x.chattRoomId === r.chattRoomId);
          if (prev && r.memberUnreadCnt > (prev.memberUnreadCnt || 0)) { triggerFlash(r.chattRoomId); }
        });
        rooms.splice(0, rooms.length, ...list);
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
    const _getTab = (id) => openTabs.find(t => t.chattRoomId === id);

    /* openChat — 하단 탭에 채팅룸 열기 */
    const openChat = async (id) => {
      /* 이미 열려있으면 그 탭으로 포커스만 */
      if (_getTab(id)) { selectTab(id); return; }
      /* 새 탭 생성 */
      const tab = reactive({
        chattRoomId: id, subject: '로딩 중...', memberNm: '', chattStatusCd: 'OPEN',
        messages: [], replyText: '', pollTimer: null, pollLastId: null, unread: 0,
      });
      openTabs.push(tab);
      selectTab(id);
      try {
        const r1 = await boApiSvc.cmChatt.getById(id, '채팅칸반', '상세');
        const info = r1.data?.data || {};
        tab.subject = info.subject || '(제목없음)';
        tab.memberNm = info.memberNm || '';
        tab.chattStatusCd = info.chattStatusCd || 'OPEN';
        const r2 = await boApiSvc.cmChatt.getMessages(id, {}, '채팅칸반', '메시지');
        const msgs = r2.data?.data || [];
        tab.messages.push(...msgs);
        if (msgs.length) { tab.pollLastId = msgs[msgs.length - 1].chattMsgId; }
        scrollToBottom(id);
        const room = rooms.find(x => x.chattRoomId === id);
        if (room) { room.memberUnreadCnt = 0; }
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
      const idx = openTabs.findIndex(t => t.chattRoomId === id);
      if (idx >= 0) { openTabs.splice(idx, 1); }
      if (uiState.activeChatId === id) {
        uiState.activeChatId = openTabs.length ? openTabs[Math.max(0, idx - 1)].chattRoomId : null;
      }
    };

    /* sendReply — 메시지 전송 (탭별) */
    const sendReply = async (id) => {
      const tab = _getTab(id);
      if (!tab) { return; }
      const text = tab.replyText.trim();
      if (!text) { return; }
      const tempMsg = { chattMsgId: '_tmp_' + Date.now(), senderCd: 'ADMIN', msgText: text, sendDate: new Date().toISOString(), _pending: true };
      tab.messages.push(tempMsg);
      tab.replyText = '';
      scrollToBottom(id);
      try {
        const res = await boApiSvc.cmChatt.sendMsg(id, { msgText: text, senderCd: 'ADMIN' }, '채팅칸반', '전송');
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
        await boApiSvc.cmChatt.updateStatus(id, { chattStatusCd: 'CLOSED' }, '채팅칸반', '채팅종료');
        tab.chattStatusCd = 'CLOSED';
        if (tab.pollTimer) { clearInterval(tab.pollTimer); tab.pollTimer = null; }
        tab.messages.push({ chattMsgId: '_sys_' + Date.now(), senderCd: 'SYSTEM', msgText: '채팅이 종료되었습니다.', sendDate: new Date().toISOString() });
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
          const res = await boApiSvc.cmChatt.getMessages(tab.chattRoomId, params, '채팅칸반', '폴링');
          const newMsgs = res.data?.data || [];
          if (newMsgs.length) {
            tab.messages.push(...newMsgs);
            tab.pollLastId = newMsgs[newMsgs.length - 1].chattMsgId;
            triggerFlash(tab.chattRoomId);
            /* 활성 탭이면 즉시 스크롤, 아니면 unread 카운트 */
            if (uiState.activeChatId === tab.chattRoomId) { scrollToBottom(tab.chattRoomId); }
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

    /* fnRoomTime — 채팅룸 시간 표시 */
    const fnRoomTime = (room) => {
      const d = room.lastMsgDate || room.regDate || '';
      return d ? String(d).replace('T', ' ').slice(0, 16) : '';
    };

    /* fnSetMsgBoxRef — template :ref 콜백 */
    const fnSetMsgBoxRef = (id, el) => { if (el) { msgBoxRefs[id] = el; } else { delete msgBoxRefs[id]; } };

    /* ##### [06] return ######################################################### */

    return {
      KANBAN_COLS, codes, rooms, uiState, searchParam, openTabs, flashSet,
      handleBtnAction, handleGridCellAction,
      cfRoomsByCol, fnTabActive,
      fnUnread, fnIsFlashing, fnIsActive, fnMsgTime, fnRoomTime,
      fnSetMsgBoxRef, openChat, selectTab,
    };
  },
  template: /* html */`
<div data-chk="1" style="display:flex;flex-direction:column;height:calc(100vh - 94px);overflow:hidden;background:#f1f5f9;">

  <!-- ===== [A] 상단: 칸반 보드 영역 (전체 높이의 약 50%) ===== -->
  <div style="flex:0 0 50%;display:flex;flex-direction:column;overflow:hidden;min-height:0;">
    <!-- 타이틀 + 검색바 -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:#fff;border-bottom:1px solid #e5e7eb;flex-shrink:0;flex-wrap:wrap;">
      <span style="font-size:15px;font-weight:800;color:#1a1a2e;margin-right:4px;">💬 채팅 칸반 보드</span>
      <input v-model="searchParam.searchValue" placeholder="회원명 · 제목 검색"
        style="height:30px;width:150px;border:1px solid #d1d5db;border-radius:6px;padding:0 8px;font-size:12px;outline:none;"
        @keyup.enter="handleBtnAction('search-list')" />
      <select v-model="searchParam.chattStatusCd"
        style="height:30px;width:88px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;background:#fff;outline:none;">
        <option value="">상태 전체</option>
        <option value="OPEN">대기중</option>
        <option value="PENDING">상담중</option>
        <option value="CLOSED">종료</option>
      </select>
      <input type="date" v-model="searchParam.dateStart"
        style="height:30px;width:126px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;outline:none;" />
      <span style="color:#bbb;font-size:11px;">~</span>
      <input type="date" v-model="searchParam.dateEnd"
        style="height:30px;width:126px;border:1px solid #d1d5db;border-radius:6px;padding:0 6px;font-size:12px;outline:none;" />
      <button class="btn btn_search" style="height:30px;font-size:12px;" @click="handleBtnAction('search-list')">조회</button>
      <button class="btn btn_reset"  style="height:30px;font-size:12px;" @click="handleBtnAction('search-reset')">초기화</button>
      <span v-if="uiState.loading" style="font-size:11px;color:#e8587a;">⏳</span>
      <span style="margin-left:auto;font-size:10px;color:#bbb;">🔄 10초 자동갱신</span>
    </div>
    <!-- 칸반 3열 -->
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:8px 12px;overflow:hidden;min-height:0;">
      <div v-for="col in KANBAN_COLS" :key="col.key"
        :style="'display:flex;flex-direction:column;border-radius:10px;overflow:hidden;border:1.5px solid '+col.border+';min-height:0;'">
        <!-- 컬럼 헤더 -->
        <div :style="'display:flex;align-items:center;gap:5px;padding:8px 12px;font-size:12px;font-weight:800;flex-shrink:0;background:'+col.bg+';color:'+col.color+';border-bottom:2px solid '+col.border+';'">
          <span style="font-size:14px;">{{ col.icon }}</span>
          <span>{{ col.label }}</span>
          <span :style="'margin-left:auto;font-size:10px;background:rgba(0,0,0,.1);border-radius:8px;padding:1px 7px;color:'+col.color+';'">
            {{ cfRoomsByCol(col.key).length }}
          </span>
        </div>
        <!-- 카드 목록 (스크롤) -->
        <div :style="'flex:1;overflow-y:auto;padding:6px;display:flex;flex-direction:column;gap:6px;background:'+col.bg+'44;'">
          <div v-if="cfRoomsByCol(col.key).length===0"
            style="text-align:center;color:#9ca3af;font-size:11px;padding:16px 0;">채팅 없음</div>
          <!-- 채팅룸 카드 -->
          <div v-for="room in cfRoomsByCol(col.key)" :key="room.chattRoomId"
            :class="fnIsFlashing(room.chattRoomId) ? 'chk-flash' : ''"
            :style="'background:#fff;border-radius:7px;border:1.5px solid '+(fnIsActive(room.chattRoomId)?'#e8587a':'#e5e7eb')+';padding:7px 10px;cursor:pointer;position:relative;'"
            @click="openChat(room.chattRoomId)">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
              <span :style="'font-size:11px;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:'+col.bg+';border:1px solid '+col.border+';flex-shrink:0;'">👤</span>
              <span style="font-size:11px;font-weight:700;color:#1f2937;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ room.memberNm || '(미확인)' }}</span>
              <span v-if="fnUnread(room)" style="background:#ef4444;color:#fff;border-radius:10px;padding:0 6px;font-size:10px;font-weight:700;flex-shrink:0;">{{ fnUnread(room) }}</span>
              <span v-if="fnIsActive(room.chattRoomId)" style="font-size:9px;color:#e8587a;font-weight:700;flex-shrink:0;">상담중</span>
            </div>
            <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ room.subject || '(제목없음)' }}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:10px;color:#9ca3af;">{{ fnRoomTime(room) }}</span>
              <button @click.stop="openChat(room.chattRoomId)"
                style="background:#e8587a;color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;cursor:pointer;">
                ▶ 참여
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== [B] 구분선 ===== -->
  <div style="flex-shrink:0;height:6px;background:linear-gradient(to bottom,#e5e7eb,#f1f5f9);border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;"></div>

  <!-- ===== [C] 하단: 채팅 상담 탭 영역 ===== -->
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;background:#fff;">
    <!-- 탭 헤더 바 -->
    <div style="display:flex;align-items:stretch;background:linear-gradient(to right,#fff0f4,#fff8fb);border-bottom:1px solid #f3e0e8;flex-shrink:0;overflow-x:auto;min-height:0;">
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
      <div v-for="tab in openTabs" :key="tab.chattRoomId"
        :style="'display:flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;border-right:1px solid #f3e0e8;font-size:12px;flex-shrink:0;border-bottom:2px solid '+(uiState.activeChatId===tab.chattRoomId?'#e8587a':'transparent')+';background:'+(uiState.activeChatId===tab.chattRoomId?'#fff':'transparent')+';'"
        @click="handleBtnAction('tab-select', {id: tab.chattRoomId})">
        <span :style="'font-size:10px;color:'+(tab.chattStatusCd==='CLOSED'?'#9ca3af':'#10b981')+';'">{{ tab.chattStatusCd==='CLOSED' ? '⚫' : '🟢' }}</span>
        <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151;">{{ tab.subject }}</span>
        <span v-if="tab.unread" style="background:#ef4444;color:#fff;border-radius:10px;padding:0 5px;font-size:10px;font-weight:700;">{{ tab.unread }}</span>
        <button @click.stop="handleBtnAction('tab-close', {id: tab.chattRoomId})"
          style="background:none;border:none;cursor:pointer;font-size:13px;color:#bbb;padding:0 2px;line-height:1;">×</button>
      </div>
    </div>

    <!-- 탭 컨텐츠 -->
    <!-- 탭 없을 때 빈 화면 -->
    <div v-if="openTabs.length===0"
      style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#bbb;gap:12px;">
      <span style="font-size:40px;opacity:.2;">💬</span>
      <span style="font-size:13px;">참여한 채팅이 없습니다</span>
    </div>
    <!-- 탭 컨텐츠 (v-show로 모두 마운트, 활성만 표시) -->
    <div v-for="tab in openTabs" :key="tab.chattRoomId + '_body'"
      v-show="uiState.activeChatId===tab.chattRoomId"
      style="flex:1;display:flex;overflow:hidden;min-height:0;">
      <!-- 메시지 목록 -->
      <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f8f9fb;"
        :ref="el => fnSetMsgBoxRef(tab.chattRoomId, el)">
        <template v-for="msg in tab.messages" :key="msg.chattMsgId">
          <div v-if="msg.senderCd==='SYSTEM'"
            style="text-align:center;font-size:11px;color:#9ca3af;background:#eff2f5;border-radius:6px;padding:3px 14px;margin:0 20px;">
            {{ msg.msgText }}
          </div>
          <div v-else-if="msg.senderCd==='MEMBER'" style="display:flex;gap:6px;align-items:flex-end;">
            <div style="width:24px;height:24px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">👤</div>
            <div>
              <div style="font-size:10px;color:#888;margin-bottom:1px;">{{ tab.memberNm }}</div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:0 8px 8px 8px;padding:6px 10px;font-size:13px;line-height:1.5;max-width:260px;word-break:break-word;">{{ msg.msgText }}</div>
              <div style="font-size:10px;color:#bbb;margin-top:2px;">{{ fnMsgTime(msg.sendDate) }}</div>
            </div>
          </div>
          <div v-else style="display:flex;flex-direction:row-reverse;gap:6px;align-items:flex-end;">
            <div style="width:24px;height:24px;border-radius:50%;background:#fce7f3;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">💁</div>
            <div>
              <div style="font-size:10px;color:#888;margin-bottom:1px;text-align:right;">상담사</div>
              <div :style="'background:#e8587a;color:#fff;border-radius:8px 0 8px 8px;padding:6px 10px;font-size:13px;line-height:1.5;max-width:260px;word-break:break-word;'+(msg._error?'opacity:.6;':'')">{{ msg.msgText }}</div>
              <div style="font-size:10px;color:#bbb;margin-top:2px;text-align:right;">
                <span v-if="msg._pending" style="color:#aaa;">전송 중...</span>
                <span v-else-if="msg._error" style="color:#f87171;">실패</span>
                <span v-else>{{ fnMsgTime(msg.sendDate) }}</span>
              </div>
            </div>
          </div>
        </template>
        <div v-if="tab.messages.length===0" style="text-align:center;color:#aaa;padding:20px 0;font-size:12px;">메시지가 없습니다.</div>
      </div>
      <!-- 우측: 입력창 + 액션 -->
      <div style="width:280px;flex-shrink:0;border-left:1px solid #f1f5f9;display:flex;flex-direction:column;background:#fff;">
        <!-- 채팅룸 정보 -->
        <div style="padding:10px 12px;border-bottom:1px solid #f1f5f9;flex-shrink:0;">
          <div style="font-size:12px;font-weight:700;color:#1f2937;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ tab.subject }}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:11px;color:#888;">👤 {{ tab.memberNm }}</span>
            <span class="badge" :class="fnTabActive(tab) ? 'badge-green' : 'badge-gray'" style="font-size:10px;">{{ fnTabActive(tab) ? '진행중' : '종료' }}</span>
            <span v-if="fnTabActive(tab)" style="font-size:10px;color:#15803d;font-weight:700;">● LIVE</span>
          </div>
        </div>
        <!-- 입력창 -->
        <div style="flex:1;display:flex;flex-direction:column;padding:10px 10px;gap:8px;justify-content:flex-end;">
          <div v-if="fnTabActive(tab)" style="display:flex;flex-direction:column;gap:6px;">
            <textarea class="form-control" v-model="tab.replyText" rows="4"
              placeholder="답변 입력..."
              style="resize:none;font-size:13px;width:100%;"
              @keydown.enter.exact.prevent="handleBtnAction('tab-send', {id: tab.chattRoomId})"
              @keydown.shift.enter="null">
            </textarea>
            <button class="btn btn_send" style="width:100%;" @click="handleBtnAction('tab-send', {id: tab.chattRoomId})">전송</button>
          </div>
          <div v-else style="text-align:center;color:#9ca3af;font-size:12px;padding:10px 0;">종료된 채팅입니다.</div>
          <div style="display:flex;gap:5px;justify-content:center;margin-top:4px;">
            <button v-if="fnTabActive(tab)" class="btn btn_cancel" style="font-size:11px;flex:1;" @click="handleBtnAction('tab-close-chat', {id: tab.chattRoomId})">채팅 종료</button>
            <button class="btn btn_close"  style="font-size:11px;flex:1;" @click="handleBtnAction('tab-close', {id: tab.chattRoomId})">탭 닫기</button>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
`,
};
