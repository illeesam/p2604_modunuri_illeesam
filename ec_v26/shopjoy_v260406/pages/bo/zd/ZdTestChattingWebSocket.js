/**
 * 개발도구 — WebSocket 채팅 서버 연결 테스트
 */
window.ZdTestChattingWebSocket = {
  name: 'ZdTestChattingWebSocket',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted, onUnmounted, nextTick } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      wsUrl:   (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.hostname + ':8080/ws/chat',
      roomId:  'TEST_ROOM_001',
      senderId: 'admin-dev-test',
    });

    const form = reactive({ msg: '' });

    const result = reactive({
      connected: false,
      messages:  [],
      status:    '미연결',
      error:     '',
      pingTime:  null,
      pingMs:    null,
    });

    const uiState = reactive({ connecting: false });

    let ws = null;

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(() => {
      // 현재 BO 백엔드 주소 자동 세팅
      cfg.wsUrl = (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.hostname + ':8080/ws/chat';
    });

    onUnmounted(() => { disconnect(); });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addMsg = (msg, type = 'info') => {
      result.messages.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.messages.length > 100) result.messages.pop();
    };

    const scrollBottom = () => {
      nextTick(() => {
        const el = document.getElementById('zd-ws-messages');
        if (el) el.scrollTop = el.scrollHeight;
      });
    };

    const connect = () => {
      if (ws?.readyState === WebSocket.OPEN) { showToast('이미 연결됨', 'success'); return; }
      uiState.connecting = true;
      result.status = '⏳ 연결 중…';
      result.error  = '';
      addMsg('🔌 WebSocket 연결 시도: ' + cfg.wsUrl);
      try {
        ws = new WebSocket(cfg.wsUrl);
        ws.onopen = () => {
          result.connected  = true;
          result.status     = '✅ 연결됨';
          uiState.connecting = false;
          addMsg('✅ 연결 성공 (roomId: ' + cfg.roomId + ')', 'success');
          // join 메시지 전송
          ws.send(JSON.stringify({ type: 'JOIN', roomId: cfg.roomId, senderId: cfg.senderId }));
          showToast('WebSocket 연결 성공', 'success');
          scrollBottom();
        };
        ws.onmessage = (e) => {
          let data = e.data;
          try { data = JSON.parse(e.data); } catch (_) { /* 문자열 그대로 */ }
          if (data?.type === 'PONG' && result.pingTime) {
            result.pingMs   = Date.now() - result.pingTime;
            result.pingTime = null;
            addMsg('🏓 PONG — RTT: ' + result.pingMs + 'ms', 'success');
          } else {
            addMsg('📩 수신: ' + (typeof data === 'string' ? data : JSON.stringify(data)));
          }
          scrollBottom();
        };
        ws.onerror = (e) => {
          result.error  = 'WebSocket 오류 발생';
          result.status = '❌ 오류';
          uiState.connecting = false;
          addMsg('❌ 오류: ' + (e.message || 'connection error'), 'error');
          scrollBottom();
        };
        ws.onclose = (e) => {
          result.connected  = false;
          result.status     = '미연결 (code: ' + e.code + ')';
          uiState.connecting = false;
          addMsg('🔴 연결 종료 (code: ' + e.code + ', reason: ' + (e.reason || '-') + ')', 'error');
          ws = null;
          scrollBottom();
        };
      } catch (e) {
        result.error  = e.message;
        result.status = '❌ 연결 실패';
        uiState.connecting = false;
        addMsg('❌ 연결 실패: ' + e.message, 'error');
      }
    };

    const disconnect = () => {
      if (ws) { ws.close(1000, '테스트 종료'); ws = null; }
    };

    const sendMsg = () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) { showToast('먼저 연결하세요.', 'error'); return; }
      if (!form.msg.trim()) return;
      const payload = JSON.stringify({
        type:     'CHAT',
        roomId:   cfg.roomId,
        senderId: cfg.senderId,
        content:  form.msg.trim(),
      });
      ws.send(payload);
      addMsg('📤 전송: ' + form.msg.trim(), 'sent');
      form.msg = '';
      scrollBottom();
    };

    const sendPing = () => {
      if (!ws || ws.readyState !== WebSocket.OPEN) { showToast('먼저 연결하세요.', 'error'); return; }
      result.pingTime = Date.now();
      ws.send(JSON.stringify({ type: 'PING', senderId: cfg.senderId }));
      addMsg('🏓 PING 전송…');
    };

    const clearLog = () => { result.messages = []; };

    const onKeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'connect')    return connect();
      if (cmd === 'disconnect') return disconnect();
      if (cmd === 'send')       return sendMsg();
      if (cmd === 'ping')       return sendPing();
      if (cmd === 'clear')      return clearLog();
    };

    return { cfg, form, result, uiState, handleBtnAction, onKeydown };
  },

  template: `
<div>
  <div class="page-title">WebSocket 채팅 연결 테스트</div>

  <!-- 연결 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">연결 설정</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
        <span class="badge" :class="result.connected?'badge-green':'badge-gray'">
          {{ result.connected ? '● 연결됨' : '○ 미연결' }}
        </span>
        <button v-if="!result.connected" class="btn btn_apply" :disabled="uiState.connecting" @click="handleBtnAction('connect')">
          {{ uiState.connecting ? '⏳ 연결 중…' : '🔌 연결' }}
        </button>
        <button v-else class="btn btn_cancel" @click="handleBtnAction('disconnect')">연결 해제</button>
        <button class="btn btn_confirm" :disabled="!result.connected" @click="handleBtnAction('ping')">🏓 Ping</button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:2">
          <label class="form-label">WebSocket URL</label>
          <input class="form-control" v-model="cfg.wsUrl" placeholder="ws://localhost:8080/ws/chat" style="font-family:monospace;font-size:12px" :disabled="result.connected" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Room ID</label>
          <input class="form-control" v-model="cfg.roomId" placeholder="ROOM001" :disabled="result.connected" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Sender ID</label>
          <input class="form-control" v-model="cfg.senderId" placeholder="admin-test" :disabled="result.connected" />
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px">
        상태: <strong>{{ result.status }}</strong>
        <span v-if="result.pingMs" style="margin-left:12px;color:#15803d">RTT: {{ result.pingMs }}ms</span>
      </div>
    </div>
  </div>

  <!-- 메시지 로그 + 입력 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">메시지 로그</span>
      <div style="margin-left:auto">
        <button class="btn btn_reset" @click="handleBtnAction('clear')">로그 지우기</button>
      </div>
    </div>
    <div style="padding:12px">
      <div id="zd-ws-messages" style="height:300px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;padding:10px;background:#111;font-family:monospace;font-size:12px;display:flex;flex-direction:column;gap:4px;margin-bottom:8px">
        <div v-if="!result.messages.length" style="color:#666;text-align:center;margin:auto">연결 후 메시지가 여기 표시됩니다</div>
        <div v-for="(m, idx) in [...result.messages].reverse()" :key="idx"
          :style="m.type==='error'?'color:#f87171':m.type==='success'?'color:#4ade80':m.type==='sent'?'color:#60a5fa':'color:#d1d5db'">
          <span style="color:#6b7280">[{{ m.time }}]</span> {{ m.msg }}
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <input class="form-control" v-model="form.msg"
          placeholder="메시지 입력 (Enter: 전송)"
          :disabled="!result.connected"
          @keydown="onKeydown" />
        <button class="btn btn_send" :disabled="!result.connected || !form.msg.trim()" @click="handleBtnAction('send')">전송</button>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>백엔드 WebSocket 엔드포인트:</b> <code>ws://localhost:8080/ws/chat</code><br>
      Spring Boot WebSocket 설정: <code>@EnableWebSocket</code> + <code>WebSocketConfigurer</code><br>
      또는 STOMP: <code>@EnableWebSocketMessageBroker</code> + SockJS 경로 <code>/ws</code><br><br>
      <b>메시지 형식:</b>
      <pre style="background:#f8f9fa;padding:8px;border-radius:4px;font-size:11px;margin-top:4px">{ "type": "JOIN|CHAT|PING|LEAVE", "roomId": "...", "senderId": "...", "content": "..." }</pre>
      <b>채팅 서비스 확인:</b> BO → 고객센터 → 채팅관리 (CmChattMng) 에서 실 채팅 데이터 확인
    </div>
  </div>
</div>`,
};
