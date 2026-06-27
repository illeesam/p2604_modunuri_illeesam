/* ShopJoy - AppFooter */
window.foAppFooter = {
  name: 'FoAppFooter',
  props: ['config', 'navigate'],
  emits: [],
  setup() {

    // ===== [01] 초기 변수 정의 ==================================================
    const { ref, reactive, onUnmounted } = Vue;
    const uiState = reactive({ menuOpen: false, loading: false, error: '', isPageCodeLoad: false });
    const codes = reactive({});

    /* ===== 채팅 상담 ===== */
    const chatState = reactive({
      open: false,           // 패널 열림 여부
      roomId: null,          // 현재 채팅방 ID
      msgs: [],              // 메시지 목록
      inputText: '',         // 입력 중인 텍스트
      sending: false,        // 전송 중
      loading: false,        // 메시지 로드 중
      unread: 0,             // 미읽음 수 (폴링으로 갱신)
      status: null,          // 채팅방 상태 (PENDING/OPEN/CLOSED)
      needAuth: false,       // 비로그인 → 로그인 유도 상태
      tooltipId: null,       // 현재 tooltip 표시 중인 참여자 ID
    });
    let chatPollTimer = null;
    const chatInputRef = ref(null);

    /* fnChatAuthUser — 현재 로그인 사용자 (foAuthStore) */
    const fnChatAuthUser = () => {
      try { return window.sfGetFoAuthUser ? window.sfGetFoAuthUser() : null; } catch (_) { return null; }
    };
    const fnChatIsLoggedIn = () => {
      try {
        const store = window.sfGetFoAuthStore ? window.sfGetFoAuthStore() : null;
        if (store) { return !!(store.sgIsLoggedIn); }
        return !!(fnChatAuthUser()?.authId);
      } catch (_) { return false; }
    };

    /* CHAT_PARTICIPANTS — 채팅 참여자 정의 (상담사 고정 + 회원 동적) */
    const fnChatParticipants = () => {
      const user = fnChatAuthUser();
      const result = [];
      // 상담사 (고정)
      result.push({ id: '_admin', type: 'ADMIN', icon: '💁', name: '상담사', email: 'cs@shopjoy.com', userType: '상담 직원', dept: '고객센터', phone: '' });
      // 회원
      if (user && user.authId) {
        result.push({
          id: user.memberId || user.authId,
          type: 'MEMBER',
          icon: '👤',
          name: user.memberNm || user.authNm || '회원',
          email: user.email || user.loginId || '',
          userType: '회원',
          dept: user.orgNm || '',
          phone: user.phone || user.mobile || '',
        });
      }
      return result;
    };

    // ===== [02] 액션 모음 (dispatch) ==============================================

    /* handleBtnAction — 버튼 액션 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleBtnAction = (cmd, param = {}) => {
      console.log(' ■■ foAppFooter.js : handleBtnAction -> ', cmd, param);
      // 메뉴 바로가기 모달 토글
      if (cmd === 'linksModal-toggle') {
        return toggleMenu();
      // 메뉴 바로가기 모달 닫기
      } else if (cmd === 'linksModal-close') {
        return closeMenu();
      // 채팅 패널 토글
      } else if (cmd === 'chat-toggle') {
        return toggleChat();
      // 채팅 패널 닫기
      } else if (cmd === 'chat-close') {
        return closeChat();
      // 채팅 메시지 전송
      } else if (cmd === 'chat-send') {
        return sendChatMsg();
      // 채팅 종료 요청
      } else if (cmd === 'chat-end') {
        return endChat();
      // 비회원 로그인 유도 → 로그인 페이지 이동
      } else if (cmd === 'chat-goLogin') {
        chatState.open = false;
        if (typeof window.navigate === 'function') { window.navigate('login'); }
        else { window.location.hash = '#page=login'; }
        return;
      // 참여자 툴팁 토글
      } else if (cmd === 'chat-tooltip') {
        chatState.tooltipId = (chatState.tooltipId === param) ? null : param;
        return;
      // 참여자 툴팁 닫기
      } else if (cmd === 'chat-tooltip-hide') {
        chatState.tooltipId = null;
        return;
      } else {
        console.warn('[handleBtnAction] unknown cmd:', cmd);
      }
    };

    /* handleSelectAction — 메뉴 항목 선택 dispatch (cmd: '{영역명}-기능명'). 5줄 이하 짧은 로직은 인라인 */
    const handleSelectAction = (cmd, param = {}) => {
      console.log(' ■■ foAppFooter.js : handleSelectAction -> ', cmd, param);
      // 메뉴 바로가기 항목 선택 (root + target)
      if (cmd === 'linksModal-go-item') {
        return goItem(param.root, param.target);
      } else {
        console.warn('[handleSelectAction] unknown cmd:', cmd);
      }
    };

    // ===== [04] 내장 사용 함수 (이벤트 핸들러 on* / handle*) ====================

    /* toggleMenu — 토글 */
    const toggleMenu = () => { uiState.menuOpen = !uiState.menuOpen; };

    /* closeMenu — 닫기 */
    const closeMenu  = () => { uiState.menuOpen = false; };

    /* ===== 채팅 함수 ===== */

    /* fnChatScrollBottom — 스크롤 하단 */
    const fnChatScrollBottom = () => {
      const Vue3 = Vue;
      Vue3.nextTick(() => {
        const el = document.getElementById('fo-chat-msgbox');
        if (el) { el.scrollTop = el.scrollHeight; }
      });
    };

    /* fnStartChatPoll — 폴링 시작 (3초마다 새 메시지 확인) */
    const fnStartChatPoll = () => {
      if (chatPollTimer) { return; }
      chatPollTimer = setInterval(async () => {
        if (!chatState.roomId || chatState.roomId === '_local' || !chatState.open) { return; }
        try {
          const lastId = chatState.msgs.length > 0 ? chatState.msgs[chatState.msgs.length - 1].chattMsgId : null;
          const res = await foApiSvc.myChat.getMessages(chatState.roomId, { afterMsgId: lastId }, '채팅상담', '폴링');
          const newMsgs = res.data?.data || [];
          if (newMsgs.length > 0) {
            chatState.msgs.push(...newMsgs);
            fnChatScrollBottom();
          }
        } catch (err) {
          console.warn('[chatPoll]', err.message);
        }
      }, 3000);
    };

    /* fnStopChatPoll — 폴링 중지 */
    const fnStopChatPoll = () => {
      if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
    };

    /* fnLoadOrCreateRoom — 채팅방 로드 또는 생성 */
    const fnLoadOrCreateRoom = async () => {
      chatState.loading = true;
      try {
        // 기존 채팅방 조회 (PENDING/OPEN 상태)
        const res = await foApiSvc.myChat.getList({ activeOnly: 'Y' }, '채팅상담', '방조회');
        const rooms = res.data?.data || [];
        const activeRoom = rooms.find(r => r.chattStatusCd === 'PENDING' || r.chattStatusCd === 'OPEN');
        if (activeRoom) {
          chatState.roomId = activeRoom.chattRoomId;
          chatState.status = activeRoom.chattStatusCd;
          // 메시지 로드
          const msgRes = await foApiSvc.myChat.getMessages(chatState.roomId, {}, '채팅상담', '메시지조회');
          chatState.msgs = msgRes.data?.data || [];
        } else {
          // 신규 채팅방 생성
          const createRes = await foApiSvc.myChat.createRoom({ subject: '채팅 상담 문의' }, '채팅상담', '방생성');
          const newRoom = createRes.data?.data;
          if (newRoom) {
            chatState.roomId = newRoom.chattRoomId;
            chatState.status = 'PENDING';
            chatState.msgs = [];
            // 안내 메시지 (로컬)
            chatState.msgs.push({ chattMsgId: '_welcome', senderCd: 'SYSTEM', msgText: '안녕하세요! 채팅 상담을 시작합니다. 담당자가 곧 연결됩니다.', sendDate: new Date().toISOString() });
          }
        }
      } catch (err) {
        console.warn('[fnLoadOrCreateRoom]', err.message);
        // 미로그인 등 API 실패 시 임시 로컬 모드
        chatState.roomId = '_local';
        chatState.status = 'PENDING';
        chatState.msgs = [{ chattMsgId: '_welcome', senderCd: 'SYSTEM', msgText: '채팅 상담에 오신 것을 환영합니다. 로그인 후 상담을 시작할 수 있습니다.', sendDate: new Date().toISOString() }];
      } finally {
        chatState.loading = false;
        fnChatScrollBottom();
      }
    };

    /* toggleChat — 채팅 패널 토글 */
    const toggleChat = async () => {
      chatState.open = !chatState.open;
      chatState.unread = 0;
      chatState.needAuth = false;
      if (chatState.open) {
        // 비로그인 → 로그인 유도 상태
        if (!fnChatIsLoggedIn()) {
          chatState.needAuth = true;
          return;
        }
        if (!chatState.roomId) { await fnLoadOrCreateRoom(); }
        if (chatState.roomId && chatState.roomId !== '_local') { fnStartChatPoll(); }
        Vue.nextTick(() => { if (chatInputRef.value) { chatInputRef.value.focus(); } });
      } else {
        fnStopChatPoll();
      }
    };

    /* closeChat — 채팅 패널 닫기 */
    const closeChat = () => {
      chatState.open = false;
      fnStopChatPoll();
    };

    /* sendChatMsg — 메시지 전송 */
    const sendChatMsg = async () => {
      const text = chatState.inputText.trim();
      if (!text || chatState.sending) { return; }
      chatState.sending = true;
      // 낙관적 UI — 즉시 노출
      const tempMsg = { chattMsgId: '_tmp_' + Date.now(), senderCd: 'MEMBER', msgText: text, sendDate: new Date().toISOString(), _pending: true };
      chatState.msgs.push(tempMsg);
      chatState.inputText = '';
      fnChatScrollBottom();
      try {
        if (chatState.roomId && chatState.roomId !== '_local') {
          await foApiSvc.myChat.sendMsg(chatState.roomId, { msgText: text }, '채팅상담', '메시지전송');
          tempMsg._pending = false;
        }
      } catch (err) {
        console.warn('[sendChatMsg]', err.message);
        tempMsg._error = true;
        tempMsg._pending = false;
      } finally {
        chatState.sending = false;
      }
    };

    /* endChat — 채팅 종료 */
    const endChat = async () => {
      if (chatState.roomId && chatState.roomId !== '_local') {
        try {
          await foApiSvc.myChat.sendMsg(chatState.roomId, { msgText: '[채팅 종료 요청]', senderCd: 'MEMBER' }, '채팅상담', '종료요청');
        } catch (_) {}
      }
      chatState.msgs.push({ chattMsgId: '_end', senderCd: 'SYSTEM', msgText: '채팅을 종료했습니다. 이용해 주셔서 감사합니다.', sendDate: new Date().toISOString() });
      chatState.status = 'CLOSED';
      chatState.roomId = null;
      fnStopChatPoll();
      fnChatScrollBottom();
    };

    /* onChatKeydown — 채팅 입력 Enter 처리 */
    const onChatKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg(); }
    };

    onUnmounted(() => { fnStopChatPoll(); });
    /* 외부(헤더 등)에서 팝업 오픈 요청 수신 */
    window.addEventListener('open-quick-menu', () => { uiState.menuOpen = true; });

    /* goItem — 이동 */
    const goItem = (root, target) => {
      if (root === 'foOffice') {
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + (target ? '#page=' + target : '');
        if (target && typeof window.navigate === 'function') { window.navigate(target); }
      } else if (root === 'boOffice') {
        window.open((window.pageUrl ? window.pageUrl('bo.html') : 'bo.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'dispFoUi') {
        window.open((window.pageUrl ? window.pageUrl('disp-fo-ui.html') : 'disp-fo-ui.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'dispBoUi') {
        window.open((window.pageUrl ? window.pageUrl('disp-bo-ui.html') : 'disp-bo-ui.html') + (target ? '#page=' + target : ''), '_blank');
      } else if (root === 'foSite') {
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?SITE_NO=' + target;
      } else if (root === 'foOnly') {
        /* target = FO 번호만, index.html 이동 */
        const foSiteId = 'SITE' + String(target).padStart(6, '0');
        try {
          localStorage.setItem('modu-fo-sy-siteNo', target);
          localStorage.setItem('modu-fo-sy-siteId', foSiteId);
        } catch(_){}
        window.location.href = (window.pageUrl ? window.pageUrl('index.html') : 'index.html') + '?SITE_NO=' + target;
      } else if (root === 'boOnly') {
        /* target = BO 번호만, bo.html 새창 오픈 — URL 파라미터로 전달, FO localStorage 접근 금지 */
        const boSiteId = 'SITE' + String(target).padStart(6, '0');
        try {
          localStorage.setItem('modu-bo-sy-siteNo', target);
          localStorage.setItem('modu-bo-sy-siteId', boSiteId);
        } catch(_){}
        window.open((window.pageUrl ? window.pageUrl('bo.html') : 'bo.html') + '?SITE_NO=' + target, '_blank');
      }
      uiState.menuOpen = false;
    };
    const currentFoSiteNo  = window.FO_SITE_NO || '01';
    const currentBoSiteNo = '01'; /* BO site_no — FO localStorage 접근 금지, 기본값 고정 */

    const FO_MENU = [
      { id:'home',       label:'홈',         icon:'🏠' },
      { id:'prodList', label:'상품목록',    icon:'🛍' },
      { id:'cart',       label:'장바구니',    icon:'🛒' },
      { id:'order',      label:'주문하기',    icon:'📋' },
      { id:'like',       label:'찜 목록',     icon:'💝' },
      { id:'event',      label:'이벤트',      icon:'🎉' },
      { id:'blog',       label:'블로그',      icon:'📝' },
      { id:'faq',        label:'FAQ',        icon:'❓' },
      { id:'contact',    label:'고객센터',    icon:'📞' },
      { id:'location',   label:'위치안내',    icon:'📍' },
      { id:'about',      label:'회사소개',    icon:'ℹ' },
      { id:'myOrder',    label:'마이 - 주문',  icon:'📦' },
      { id:'myCoupon',   label:'마이 - 쿠폰',  icon:'🎟' },
      { id:'myCache',    label:'마이 - 캐시',  icon:'💰' },
      { id:'myContact',  label:'마이 - 문의',  icon:'💬' },
    ];
    const BO_MENU = [
      { id:'dashboard',           label:'대시보드',         icon:'📊' },
      { id:'ecMemberMng',         label:'회원관리',         icon:'👥' },
      { id:'ecProdMng',           label:'상품관리',         icon:'📦' },
      { id:'ecOrderMng',          label:'주문관리',         icon:'📋' },
      { id:'ecDispUiMng',         label:'전시UI관리',       icon:'🎨' },
      { id:'ecDispAreaMng',       label:'전시영역관리',     icon:'🗂' },
      { id:'ecDispPanelMng',      label:'전시패널관리',     icon:'🪟' },
      { id:'ecDispWidgetMng',     label:'전시위젯관리',     icon:'🧩' },
      { id:'ecDispWidgetLibMng',  label:'전시위젯Lib',      icon:'📚' },
      { id:'ecDispUiSimul',       label:'전시UI시뮬레이션', icon:'🖼' },
    ];
    const DISP_MENU = [
      { id:'dispUiPage', label:'통합 페이지',  icon:'🌐' },
      { id:'dispUi01',   label:'UI 샘플 01',  icon:'1️⃣' },
      { id:'dispUi02',   label:'UI 샘플 02',  icon:'2️⃣' },
      { id:'dispUi03',   label:'UI 샘플 03',  icon:'3️⃣' },
      { id:'dispUi04',   label:'UI 샘플 04',  icon:'4️⃣' },
      { id:'dispUi05',   label:'UI 샘플 05',  icon:'5️⃣' },
      { id:'dispUi06',   label:'UI 샘플 06',  icon:'6️⃣' },
    ];
    const SITE_MENU = [
      { id:'01',   label:'FO_SITE_NO=01' },
      { id:'02',   label:'FO_SITE_NO=02' },
      { id:'03',   label:'FO_SITE_NO=03' },
      { id:'9999', label:'FO_SITE_NO=9999' },
    ];
    /* toSiteId — → 사이트 Id */
    const toSiteId = (no) => 'SITE' + String(no).padStart(6, '0');
    const SITE_PAIR_MENU = [
      { fo:'01',   bo:'01',   siteId: toSiteId('01')   },
      { fo:'02',   bo:'02',   siteId: toSiteId('02')   },
      { fo:'03',   bo:'03',   siteId: toSiteId('03')   },
      { fo:'9999', bo:'9999', siteId: toSiteId('9999') },
    ];
    // ===== [06] return (템플릿 노출) ==============================================

    return {
      uiState, codes,                                                       // 상태
      handleBtnAction, handleSelectAction,                                  // dispatch
      currentFoSiteNo, currentBoSiteNo,                                     // 사이트번호
      FO_MENU, BO_MENU, DISP_MENU, SITE_MENU, SITE_PAIR_MENU,               // 메뉴 정의
      chatState, chatInputRef, onChatKeydown, fnChatParticipants,            // 채팅
    };
  },
  template: /* html */ `
<footer style="padding:28px 32px;">
  <!-- ===== ■. 본문 영역 =================================================== -->
  <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="92" rx="22" ry="6" fill="#d4a017"/>
        <ellipse cx="30" cy="92" rx="18" ry="4" fill="#e6b422"/>
        <path d="M30 90 Q25 60 35 30" stroke="#b8860b" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M30 90 Q25 60 35 30" stroke="#d4a017" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M35 30 Q55 10 75 18" stroke="#228B22" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q60 15 78 25" stroke="#2d8f2d" stroke-width="2" fill="none"/>
        <path d="M35 30 Q50 5 70 8" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q20 8 5 15" stroke="#228B22" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q15 12 3 22" stroke="#2d8f2d" stroke-width="2" fill="none"/>
        <path d="M35 30 Q25 5 10 5" stroke="#1a7a1a" stroke-width="2.5" fill="none"/>
        <path d="M35 30 Q35 8 40 3" stroke="#228B22" stroke-width="2" fill="none"/>
        <circle cx="40" cy="34" r="5" fill="#8B008B"/>
        <circle cx="48" cy="38" r="5" fill="#dc2626"/>
        <circle cx="44" cy="44" r="5" fill="#2563eb"/>
        <circle cx="35" cy="40" r="4.5" fill="#7c3aed"/>
        <circle cx="52" cy="32" r="4" fill="#dc2626"/>
        <circle cx="50" cy="46" r="4" fill="#2563eb"/>
        <circle cx="38" cy="32" r="1.5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="46" cy="36" r="1.5" fill="rgba(255,255,255,0.4)"/>
        <circle cx="42" cy="42" r="1.5" fill="rgba(255,255,255,0.4)"/>
      </svg>
      <span style="font-weight:700;color:var(--text-secondary);font-size:0.85rem;">
        {{ config.name }}
      </span>
      <span style="color:var(--text-muted);font-size:0.75rem;">
        |
      </span>
      <span style="color:var(--text-muted);font-size:0.8rem;">
        {{ config.address }}
      </span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;position:relative;">
      <!-- ===== ■.■.■. 버튼 영역 =============================================== -->
      <button type="button" @click="handleBtnAction('linksModal-toggle')"
        style="font-size:0.75rem;padding:5px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:6px;">
        🌐 메뉴 바로가기
        <span :style="{fontWeight:800,color: currentFoSiteNo==='03' ? '#7b1fa2' : currentFoSiteNo==='02' ? '#2e7d6b' : currentFoSiteNo==='9999' ? '#888' : '#9f2946'}">
          {{ currentFoSiteNo || '-' }}
        </span>
        <span :style="{fontWeight:800,color: currentBoSiteNo==='03' ? '#7b1fa2' : currentBoSiteNo==='02' ? '#2e7d6b' : currentBoSiteNo==='9999' ? '#888' : '#9f2946'}">
          {{ currentBoSiteNo || '-' }}
        </span>
        <span style="font-size:9px;">
          ▾
        </span>
      </button>
      <!-- ===== ■.■.■. 메뉴 레이어 ============================================== -->
      <div v-if="uiState.menuOpen"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9998;backdrop-filter:blur(2px);"
        @click="handleBtnAction('linksModal-close')">
      </div>
      <div v-if="uiState.menuOpen"
        style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.28);width:920px;max-width:95vw;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;border:1px solid #ffe4ec;"
        @click.stop>
        <!-- ===== ■.■.■.■. 헤더 ================================================ -->
        <div style="padding:14px 18px;border-bottom:1px solid #ffc9d6;background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);display:flex;align-items:center;justify-content:space-between;">
          <div style="font-size:15px;font-weight:800;color:#9f2946;">
            <span style="color:#e8587a;font-size:9px;margin-right:8px;">
              ●
            </span>
            🌐 메뉴 바로가기
          </div>
          <button type="button" @click="handleBtnAction('linksModal-close')"
            style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.6);border:none;color:#9f2946;font-size:13px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;"
            onmouseover="this.style.background='#e8587a';this.style.color='#fff';this.style.transform='rotate(90deg)';"
            onmouseout="this.style.background='rgba(255,255,255,0.6)';this.style.color='#9f2946';this.style.transform='';">
            ✕
          </button>
        </div>
        <!-- ===== ■.■.■.■. 3열 본문 ============================================= -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;padding:18px;overflow:auto;">
          <!-- ===== ■.■.■.■.■. foOffice ======================================== -->
          <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
            <div style="font-size:13px;font-weight:800;color:#1565c0;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e0e8f5;">
              🛍 foOffice
            </div>
            <!-- ===== ■.■.■.■.■.■. 영역 ============================================ -->
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button v-for="m in FO_MENU" :key="m.id" type="button"
                @click="handleSelectAction('linksModal-go-item', { root: 'foOffice', target: m.id })"
                style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:transparent;border:none;border-radius:6px;cursor:pointer;font-size:12.5px;color:#333;text-align:left;transition:all .12s;"
                onmouseover="this.style.background='#fff5f8';this.style.color='#e8587a';"
                onmouseout="this.style.background='transparent';this.style.color='#333';">
                <span style="font-size:14px;width:18px;text-align:center;">
                  {{ m.icon }}
                </span>
                <span>
                  {{ m.label }}
                </span>
              </button>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. boOffice ======================================== -->
          <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
            <div style="font-size:13px;font-weight:800;color:#7b1fa2;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #efe0f5;">
              🔧 boOffice
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <button v-for="m in BO_MENU" :key="m.id" type="button"
                @click="handleSelectAction('linksModal-go-item', { root: 'boOffice', target: m.id })"
                style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:transparent;border:none;border-radius:6px;cursor:pointer;font-size:12.5px;color:#333;text-align:left;transition:all .12s;"
                onmouseover="this.style.background='#f7f0fa';this.style.color='#7b1fa2';"
                onmouseout="this.style.background='transparent';this.style.color='#333';">
                <span style="font-size:14px;width:18px;text-align:center;">
                  {{ m.icon }}
                </span>
                <span>
                  {{ m.label }}
                </span>
              </button>
            </div>
          </div>
          <!-- ===== ■.■.■.■.■. 나머지: FO 사이트번호 + dispUi ========================== -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <!-- ===== ■.■.■.■.■.■. _SITE_NO (FO / BO 분리 링크) ====================== -->
            <!-- ===== ■.■.■.■.■.■. 영역 ============================================ -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:13px;font-weight:800;color:#2e7d6b;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #def0e8;">
                🌈 _SITE_NO
                <span style="font-size:11px;color:#888;font-weight:600;">
                  (FO: {{ currentFoSiteNo }}, BO: {{ currentBoSiteNo }})
                </span>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div v-for="p in SITE_PAIR_MENU" :key="p.fo+'_'+p.bo"
                  style="display:flex;gap:6px;align-items:center;">
                  <!-- ===== ■.■.■.■.■.■.■.■.■. site_id 표시 ============================== -->
                  <span :style="{flexShrink:0,minWidth:'112px',fontSize:'11px',fontFamily:'monospace',fontWeight:700,color: (currentFoSiteNo===p.fo||currentBoSiteNo===p.bo)?'#2e7d6b':'#999'}"
                    :title="'적용 site_id: '+p.siteId">
                    site_id={{ p.siteId }}
                  </span>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. FO 링크 =================================== -->
                  <button type="button" @click="handleSelectAction('linksModal-go-item', { root: 'foOnly', target: p.fo })"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentFoSiteNo===p.fo?'#e0f2ec':'transparent',border:'1px solid '+(currentFoSiteNo===p.fo?'#a3d4be':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontFamily:'monospace',color: currentFoSiteNo===p.fo?'#2e7d6b':'#444',fontWeight: currentFoSiteNo===p.fo?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#e0f2ec';this.style.color='#2e7d6b';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentFoSiteNo===p.fo?'1':'0'"
                    title="index.html로 이동 (같은 창)">
                    <span>
                      {{ currentFoSiteNo===p.fo?'●':'○' }}
                    </span>
                    <span>
                      FO={{ p.fo }}
                    </span>
                  </button>
                  <!-- ===== ■.■.■.■.■.■.■.■.■. BO 링크 (bo.html 새창) ====================== -->
                  <button type="button" @click="handleSelectAction('linksModal-go-item', { root: 'boOnly', target: p.bo })"
                    :style="{flex:1,display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 10px',background: currentBoSiteNo===p.bo?'#f3e5f5':'transparent',border:'1px solid '+(currentBoSiteNo===p.bo?'#ce93d8':'#e5eaea'),borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontFamily:'monospace',color: currentBoSiteNo===p.bo?'#7b1fa2':'#444',fontWeight: currentBoSiteNo===p.bo?700:500,transition:'all .12s'}"
                    onmouseover="this.style.background='#f3e5f5';this.style.color='#7b1fa2';"
                    onmouseout="if(this.dataset.active!=='1'){this.style.background='transparent';this.style.color='#444';}"
                    :data-active="currentBoSiteNo===p.bo?'1':'0'"
                    title="bo.html 새창 오픈">
                    <span>
                      {{ currentBoSiteNo===p.bo?'●':'○' }}
                    </span>
                    <span>
                      BO={{ p.bo }}
                    </span>
                    <span style="margin-left:auto;font-size:10px;color:#aaa;">
                      ↗
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <!-- ===== ■.■.■.■.■.■. dispUi ======================================== -->
            <!-- ===== ■.■.■.■.■.■. 영역 ============================================ -->
            <div style="background:#fafbfc;border:1px solid #eef0f3;border-radius:10px;padding:12px;">
              <div style="font-size:13px;font-weight:800;color:#c2410c;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f5e8de;">
                🖥 dispUi (샘플)
              </div>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <div v-for="m in DISP_MENU" :key="m.id"
                  style="display:flex;align-items:center;gap:6px;padding:4px 6px;">
                  <span style="font-size:14px;width:18px;text-align:center;">
                    {{ m.icon }}
                  </span>
                  <span style="flex:1;font-size:12.5px;color:#333;">
                    {{ m.label }}
                  </span>
                  <button type="button" @click="handleSelectAction('linksModal-go-item', { root: 'dispFoUi', target: m.id })"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;border-radius:5px;cursor:pointer;"
                    title="사용자 미리보기">
                    사용자 ↗
                  </button>
                  <button type="button" @click="handleSelectAction('linksModal-go-item', { root: 'dispBoUi', target: m.id })"
                    style="padding:3px 9px;font-size:11px;font-weight:600;background:#fef3eb;color:#c2410c;border:1px solid #f5e8de;border-radius:5px;cursor:pointer;"
                    title="관리자 미리보기">
                    관리자 ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span style="color:var(--text-muted);font-size:0.75rem;">
        {{ config.tel }}
      </span>
      <span style="color:var(--text-muted);font-size:0.75rem;">
        {{ config.email }}
      </span>
      <span style="color:var(--text-muted);font-size:0.75rem;">
        © 2026 {{ config.name }}
      </span>
    </div>
  </div>
</footer>
<!-- ===== □. 채팅 상담 플로팅 버튼 + 패널 ============================== -->

<!-- 채팅 패널 -->
<div v-if="chatState.open"
  style="position:fixed;right:24px;bottom:90px;z-index:8800;width:340px;height:480px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.22);display:flex;flex-direction:column;overflow:hidden;border:1px solid #ffe4ec;">
  <!-- 패널 헤더 -->
  <div style="background:linear-gradient(135deg,#fff0f4 0%,#ffe4ec 60%,#ffd5e1 100%);border-bottom:1px solid #ffc9d6;">
    <!-- 제목 행 -->
    <div style="padding:12px 14px 8px;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;">💬</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:800;color:#9f2946;">채팅 상담</div>
        <div style="font-size:11px;margin-top:1px;">
          <span v-if="chatState.status==='OPEN'" style="color:#15803d;">● 상담 중</span>
          <span v-else-if="chatState.status==='PENDING'" style="color:#b45309;">● 대기 중</span>
          <span v-else-if="chatState.status==='CLOSED'" style="color:#888;">○ 종료됨</span>
          <span v-else-if="chatState.needAuth" style="color:#6366f1;">● 로그인 필요</span>
          <span v-else style="color:#aaa;">연결 중...</span>
        </div>
      </div>
      <button type="button" @click="handleBtnAction('chat-end')"
        v-if="chatState.status !== 'CLOSED' &amp;&amp; !chatState.needAuth"
        style="font-size:11px;padding:3px 8px;background:rgba(255,255,255,0.6);border:1px solid #ffc9d6;border-radius:5px;color:#9f2946;cursor:pointer;">
        종료
      </button>
      <button type="button" @click="handleBtnAction('chat-close')"
        style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.6);border:none;color:#9f2946;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;"
        onmouseover="this.style.background='#e8587a';this.style.color='#fff';"
        onmouseout="this.style.background='rgba(255,255,255,0.6)';this.style.color='#9f2946';">
        ✕
      </button>
    </div>
    <!-- 참여자 뱃지 행 (로그인 상태일 때만) -->
    <div v-if="!chatState.needAuth" style="padding:0 14px 10px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
      <span style="font-size:10px;color:#b06070;font-weight:600;margin-right:2px;">참여자</span>
      <div v-for="p in fnChatParticipants()" :key="p.id"
        style="position:relative;display:inline-flex;">
        <!-- 뱃지 버튼 -->
        <button type="button"
          @click="handleBtnAction('chat-tooltip', p.id)"
          style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(255,255,255,0.75);border:1px solid #ffc9d6;border-radius:20px;font-size:11px;color:#9f2946;cursor:pointer;font-weight:600;white-space:nowrap;transition:all .12s;"
          onmouseover="this.style.background='#fff';this.style.borderColor='#e8587a';"
          onmouseout="this.style.background='rgba(255,255,255,0.75)';this.style.borderColor='#ffc9d6';">
          <span>{{ p.icon }}</span>
          <span>{{ p.name }}</span>
        </button>
        <!-- 툴팁 -->
        <div v-if="chatState.tooltipId === p.id"
          style="position:absolute;bottom:calc(100% + 6px);left:0;z-index:9900;background:#fff;border:1px solid #ffe4ec;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,0.16);padding:10px 13px;min-width:190px;white-space:nowrap;">
          <!-- 툴팁 닫기 오버레이 -->
          <div style="position:fixed;inset:0;" @click="handleBtnAction('chat-tooltip-hide')"></div>
          <div style="position:relative;z-index:1;">
            <div style="font-size:12px;font-weight:800;color:#9f2946;margin-bottom:7px;padding-bottom:6px;border-bottom:1px solid #ffe4ec;">
              {{ p.icon }} {{ p.name }}
            </div>
            <table style="border-collapse:collapse;width:100%;">
              <tr>
                <td style="font-size:10px;color:#999;padding:2px 6px 2px 0;white-space:nowrap;vertical-align:top;">사용자유형</td>
                <td style="font-size:11px;color:#333;font-weight:600;padding:2px 0;">{{ p.userType || '-' }}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#999;padding:2px 6px 2px 0;white-space:nowrap;vertical-align:top;">이메일</td>
                <td style="font-size:11px;color:#333;padding:2px 0;word-break:break-all;white-space:normal;">{{ p.email || '-' }}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#999;padding:2px 6px 2px 0;white-space:nowrap;vertical-align:top;">소속</td>
                <td style="font-size:11px;color:#333;padding:2px 0;">{{ p.dept || '-' }}</td>
              </tr>
              <tr>
                <td style="font-size:10px;color:#999;padding:2px 6px 2px 0;white-space:nowrap;vertical-align:top;">전화번호</td>
                <td style="font-size:11px;color:#333;padding:2px 0;">{{ p.phone || '-' }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- needAuth: 로그인 유도 화면 -->
  <div v-if="chatState.needAuth"
    style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;gap:16px;background:#fafafa;text-align:center;">
    <div style="font-size:44px;line-height:1;">🔐</div>
    <div style="font-size:14px;font-weight:700;color:#333;line-height:1.5;">
      채팅 상담은 로그인 후 이용 가능합니다.
    </div>
    <div style="font-size:12px;color:#888;line-height:1.6;">
      회원이 아닌 경우<br>
      <strong style="color:#6366f1;">휴대폰 본인인증</strong> 후 이용 가능합니다.
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;width:100%;max-width:200px;">
      <button type="button" @click="handleBtnAction('chat-goLogin')"
        style="padding:10px 0;background:linear-gradient(135deg,#ff8fab,#e8587a);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;width:100%;transition:opacity .15s;"
        onmouseover="this.style.opacity='0.85';"
        onmouseout="this.style.opacity='1';">
        🔑 로그인하기
      </button>
      <button type="button"
        style="padding:10px 0;background:#fff;color:#6366f1;border:1px solid #a5b4fc;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;width:100%;transition:all .15s;"
        onmouseover="this.style.background='#eef2ff';"
        onmouseout="this.style.background='#fff';"
        title="휴대폰 본인인증은 준비 중입니다.">
        📱 본인인증 (준비 중)
      </button>
    </div>
  </div>

  <!-- 메시지 영역 (로그인 후) -->
  <div v-if="!chatState.needAuth" id="fo-chat-msgbox"
    style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#fafafa;">
    <!-- 로딩 -->
    <div v-if="chatState.loading" style="text-align:center;color:#aaa;font-size:12px;padding:20px 0;">
      ⏳ 연결 중...
    </div>
    <!-- 메시지 목록 -->
    <template v-for="m in chatState.msgs" :key="m.chattMsgId">
      <!-- SYSTEM 메시지 -->
      <div v-if="m.senderCd==='SYSTEM'"
        style="text-align:center;font-size:11px;color:#888;background:#f0f0f0;border-radius:8px;padding:5px 10px;margin:0 20px;">
        {{ m.msgText }}
      </div>
      <!-- ADMIN 메시지 (좌측) -->
      <div v-else-if="m.senderCd==='ADMIN'" style="display:flex;align-items:flex-end;gap:6px;">
        <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#ff8fab,#e8587a);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">
          💁
        </div>
        <div style="max-width:75%;">
          <div style="font-size:10px;color:#888;margin-bottom:3px;">상담사</div>
          <div style="background:#fff;border:1px solid #ffe4ec;border-radius:0 10px 10px 10px;padding:8px 10px;font-size:13px;line-height:1.5;color:#333;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            {{ m.msgText }}
          </div>
          <div style="font-size:10px;color:#bbb;margin-top:2px;">
            {{ m.sendDate ? String(m.sendDate).slice(11,16) : '' }}
          </div>
        </div>
      </div>
      <!-- MEMBER 메시지 (우측) -->
      <div v-else style="display:flex;flex-direction:row-reverse;align-items:flex-end;gap:6px;">
        <div style="max-width:75%;">
          <div style="background:linear-gradient(135deg,#ff8fab,#e8587a);border-radius:10px 0 10px 10px;padding:8px 10px;font-size:13px;line-height:1.5;color:#fff;"
            :style="m._error ? 'opacity:0.6;' : ''">
            {{ m.msgText }}
          </div>
          <div style="font-size:10px;color:#bbb;margin-top:2px;text-align:right;">
            <span v-if="m._pending" style="color:#aaa;">전송 중...</span>
            <span v-else-if="m._error" style="color:#f87171;">전송 실패</span>
            <span v-else>{{ m.sendDate ? String(m.sendDate).slice(11,16) : '' }}</span>
          </div>
        </div>
      </div>
    </template>
    <!-- 빈 상태 -->
    <div v-if="!chatState.loading &amp;&amp; chatState.msgs.length===0"
      style="text-align:center;color:#aaa;font-size:12px;padding:30px 0;">
      메시지가 없습니다.<br>아래 입력창으로 문의하세요.
    </div>
  </div>

  <!-- 입력 영역 (로그인 후) -->
  <div v-if="!chatState.needAuth"
    style="padding:10px;border-top:1px solid #ffe4ec;background:#fff;display:flex;gap:6px;align-items:flex-end;">
    <textarea
      ref="chatInputRef"
      v-model="chatState.inputText"
      @keydown="onChatKeydown"
      placeholder="메시지를 입력하세요 (Enter: 전송)"
      :disabled="chatState.sending || chatState.status==='CLOSED'"
      rows="2"
      style="flex:1;resize:none;border:1px solid #ffd5e1;border-radius:8px;padding:8px 10px;font-size:13px;outline:none;line-height:1.4;font-family:inherit;background:#fffafb;"
      onfocus="this.style.borderColor='#e8587a';"
      onblur="this.style.borderColor='#ffd5e1';"></textarea>
    <button type="button"
      @click="handleBtnAction('chat-send')"
      :disabled="!chatState.inputText.trim() || chatState.sending || chatState.status==='CLOSED'"
      style="width:38px;height:38px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff8fab,#e8587a);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;"
      :style="(!chatState.inputText.trim() || chatState.sending || chatState.status==='CLOSED') ? 'opacity:0.4;cursor:not-allowed;' : ''">
      ➤
    </button>
  </div>
</div>

<!-- 채팅 플로팅 버튼 -->
<button type="button"
  @click="handleBtnAction('chat-toggle')"
  style="position:fixed;right:24px;bottom:28px;z-index:8801;width:54px;height:54px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff8fab,#e8587a);color:#fff;font-size:24px;cursor:pointer;box-shadow:0 4px 20px rgba(232,88,122,0.45);display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s;"
  onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 28px rgba(232,88,122,0.6)';"
  onmouseout="this.style.transform='';this.style.boxShadow='0 4px 20px rgba(232,88,122,0.45)';"
  :title="chatState.open ? '채팅 닫기' : '채팅 상담 열기'">
  <!-- 미읽음 뱃지 -->
  <span v-if="chatState.unread > 0 &amp;&amp; !chatState.open"
    style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #fff;">
    {{ chatState.unread > 9 ? '9+' : chatState.unread }}
  </span>
  <span v-if="chatState.open">✕</span>
  <span v-else>💬</span>
</button>
<!-- ===== □. 채팅 상담 =================================================== -->
`,
};
