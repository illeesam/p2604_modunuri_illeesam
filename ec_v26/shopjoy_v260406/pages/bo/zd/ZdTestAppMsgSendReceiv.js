/**
 * 개발도구 — Android / iOS 앱 메시지 발송 & 수신 확인 통합 테스트
 *
 * 채널별 발송:
 *   - FCM  (Android + iOS 크로스플랫폼)
 *   - APNs (iOS 직접)
 *   - 카카오 알림톡 / 친구톡
 *   - SMS
 *   - 인앱 메시지 (WebSocket 브로드캐스트)
 *
 * 수신 확인:
 *   - cmh_push_log 발송 이력 조회 (시뮬레이션 수신 확인)
 *   - mb_device_token 등록 디바이스 목록
 *   - 회원별 발송 이력 타임라인
 */
window.ZdTestAppMsgSendReceiv = {
  name: 'ZdTestAppMsgSendReceiv',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, ref, computed, onMounted, onUnmounted } = Vue;
    const showToast   = props.showToast   || window.boApp?.showToast   || (() => {});
    const showConfirm = props.showConfirm || window.boApp?.showConfirm || (() => Promise.resolve(true));

    const codes = reactive({});

    // 탭
    const tab = ref('send'); // send | devices | history | receive

    // ── 설정 ──────────────────────────────────────────────
    const cfg = reactive({
      fcmProjectId:  '',
      apnsKeyId:     '',
      apnsTeamId:    '',
      apnsBundleId:  '',
      apnsProduction: false,
      smsProvider:   '',
      smsFrom:       '',
      kakaoSenderKey:'',
      kakaoFrom:     '',
    });

    // ── 발송 폼 ───────────────────────────────────────────
    const baseForm = reactive({
      // 대상
      targetMode:    'token',     // token | member | topic | broadcast | phone
      targetValue:   '',
      platform:      'ALL',       // ALL | ANDROID | IOS

      // 채널 (다중 선택)
      chFcm:         true,
      chApns:        false,
      chSms:         false,
      chKakao:       false,
      chInapp:       false,

      // 메시지
      msgType:       'push',      // push | alimtalk | friendtalk | sms | inapp
      title:         '[ShopJoy] 앱 메시지 테스트',
      body:          '앱 메시지 통합 테스트입니다. 정상 수신되면 아래 수신 확인 탭에서 결과를 확인하세요.',
      imageUrl:      '',
      badge:         1,
      sound:         'default',
      data:          '{"type":"test","url":"/"}',
      templateCode:  '',
      templateVars:  '{"name":"테스트","orderId":"ORD001"}',
      kakaoContent:  '',
    });

    // ── 디바이스 토큰 목록 ────────────────────────────────
    const devices = reactive({
      rows:      [],
      selected:  [],
      filter:    { platform: '', memberId: '' },
      pager:     { pageNo: 1, pageSize: 20, pageTotalCount: 0 },
    });

    // ── 발송 이력 ─────────────────────────────────────────
    const hist = reactive({
      rows:         [],
      filter:       { memberId: '', channel: '', dateStart: '', dateEnd: '' },
      pager:        { pageNo: 1, pageSize: 20, pageTotalCount: 0 },
    });

    // ── 실시간 수신 로그 (WebSocket) ───────────────────────
    const recvLog = reactive({
      msgs:       [],
      wsStatus:   '미연결',
      connected:  false,
    });
    let ws = null;

    // ── 결과 ──────────────────────────────────────────────
    const result = reactive({
      loading:       false,
      loadingDev:    false,
      loadingHist:   false,
      batchResult:   null,
      sendLogs:      [],    // 최근 발송 이력 (세션 내)
      error:         '',
    });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: [
            'app.push.fcm.project-id',
            'app.push.apns.key-id','app.push.apns.team-id',
            'app.push.apns.bundle-id','app.push.apns.production',
            'app.sms.provider','app.sms.from',
            'app.kakao.sender-key','app.kakao.from',
          ].join(','),
        });
        (res?.data?.data || []).forEach(p => {
          if (p.propKey === 'app.push.fcm.project-id')  cfg.fcmProjectId   = p.propVal || '';
          if (p.propKey === 'app.push.apns.key-id')     cfg.apnsKeyId      = p.propVal || '';
          if (p.propKey === 'app.push.apns.team-id')    cfg.apnsTeamId     = p.propVal || '';
          if (p.propKey === 'app.push.apns.bundle-id')  cfg.apnsBundleId   = p.propVal || '';
          if (p.propKey === 'app.push.apns.production') cfg.apnsProduction = p.propVal === 'true';
          if (p.propKey === 'app.sms.provider')         cfg.smsProvider    = p.propVal || '';
          if (p.propKey === 'app.sms.from')             cfg.smsFrom        = p.propVal || '';
          if (p.propKey === 'app.kakao.sender-key')     cfg.kakaoSenderKey = p.propVal || '';
          if (p.propKey === 'app.kakao.from')           cfg.kakaoFrom      = p.propVal || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    onUnmounted(() => { wsDisconnect(); });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addSendLog = (channel, target, msg, type = 'info') => {
      result.sendLogs.unshift({ channel, target: (target || '').substring(0, 24), msg, type, time: new Date().toLocaleTimeString() });
      if (result.sendLogs.length > 50) result.sendLogs.pop();
    };

    // ── 채널 배지 색 ──────────────────────────────────────
    const fnChannelBadge = (ch) => {
      const m = { FCM: 'badge-orange', APNS: 'badge-blue', SMS: 'badge-green', KAKAO: 'badge-purple', INAPP: 'badge-gray' };
      return 'badge ' + (m[ch] || 'badge-gray');
    };

    // ── 활성 채널 목록 계산 ───────────────────────────────
    const cfActiveChannels = computed(() => {
      const list = [];
      if (baseForm.chFcm)   list.push('FCM');
      if (baseForm.chApns)  list.push('APNS');
      if (baseForm.chSms)   list.push('SMS');
      if (baseForm.chKakao) list.push('KAKAO');
      if (baseForm.chInapp) list.push('INAPP');
      return list;
    });

    // ── 플랫폼 배지 ───────────────────────────────────────
    const fnPlatformBadge = (p) => {
      if (p === 'ANDROID') return 'badge badge-green';
      if (p === 'IOS')     return 'badge badge-blue';
      return 'badge badge-gray';
    };

    // ── 결과 상태 배지 ────────────────────────────────────
    const fnStatusBadge = (s) => {
      if (s === 'SUCCESS') return 'badge badge-green';
      if (s === 'FAIL')    return 'badge badge-red';
      return 'badge badge-gray';
    };

    // ── 토큰 → 대상 세팅 ─────────────────────────────────
    const useDevice = (row) => {
      baseForm.targetMode  = 'token';
      baseForm.targetValue = row.fcmToken || row.apnsToken || '';
      baseForm.platform    = row.platform || 'ALL';
      if (row.platform === 'IOS') { baseForm.chFcm = false; baseForm.chApns = true; }
      else                        { baseForm.chFcm = true;  baseForm.chApns = false; }
      tab.value = 'send';
      showToast('대상 디바이스가 설정되었습니다.', 'success');
    };

    // ── 회원 ID → 대상 세팅 ──────────────────────────────
    const useMember = (memberId) => {
      baseForm.targetMode  = 'member';
      baseForm.targetValue = memberId;
      baseForm.platform    = 'ALL';
      baseForm.chFcm       = true;
      baseForm.chApns      = true;
      tab.value = 'send';
      showToast('회원 ID [' + memberId + '] 가 대상으로 설정되었습니다.', 'success');
    };

    // ── 발송 ──────────────────────────────────────────────
    const send = async () => {
      if (!cfActiveChannels.value.length) { showToast('발송 채널을 1개 이상 선택하세요.', 'error'); return; }
      if (baseForm.targetMode !== 'broadcast' && !baseForm.targetValue) {
        showToast('발송 대상을 입력하세요.', 'error'); return;
      }
      result.loading  = true;
      result.error    = '';
      result.batchResult = null;
      let dataObj = {};
      try { dataObj = JSON.parse(baseForm.data || '{}'); } catch (e) { /* 무시 */ }
      let varsObj = {};
      try { varsObj = JSON.parse(baseForm.templateVars || '{}'); } catch (e) { /* 무시 */ }

      const targetLabel = baseForm.targetMode === 'broadcast' ? '(전체 브로드캐스트)' : baseForm.targetValue.substring(0, 20) + '…';

      try {
        const res = await boApi.post('/bo/sy/test/app-msg/send', {
          targetMode:    baseForm.targetMode,
          targetValue:   baseForm.targetValue,
          platform:      baseForm.platform,
          channels:      cfActiveChannels.value,
          title:         baseForm.title,
          body:          baseForm.body,
          imageUrl:      baseForm.imageUrl || undefined,
          badge:         baseForm.badge,
          sound:         baseForm.sound,
          data:          dataObj,
          templateCode:  baseForm.templateCode || undefined,
          templateVars:  varsObj,
          kakaoContent:  baseForm.kakaoContent || undefined,
        }, coUtil.apiHdr('앱 메시지 발송 테스트', '발송'));

        result.batchResult = res.data?.data || {};
        const r = result.batchResult;

        // 채널별 결과 로그
        cfActiveChannels.value.forEach(ch => {
          const chRes = r[ch.toLowerCase()] || {};
          const ok = chRes.success !== false;
          addSendLog(ch, targetLabel, ok ? ('✅ ' + (chRes.messageId || chRes.apnsId || chRes.msgId || '발송완료')) : ('❌ ' + (chRes.error || '실패')), ok ? 'success' : 'error');
        });
        showToast('발송 완료 (' + cfActiveChannels.value.join(', ') + ')', 'success');
      } catch (e) {
        result.error = e.response?.data?.message || e.message || '발송 오류';
        addSendLog(cfActiveChannels.value.join('+'), targetLabel, '❌ ' + result.error, 'error');
        showToast(result.error, 'error', 0);
      }
      result.loading = false;
    };

    // ── 디바이스 목록 조회 ────────────────────────────────
    const loadDevices = async () => {
      result.loadingDev = true;
      try {
        const res = await boApi.get('/bo/sy/test/push/tokens', {
          params: {
            platform: devices.filter.platform || undefined,
            memberId: devices.filter.memberId || undefined,
            pageNo:   devices.pager.pageNo,
            pageSize: devices.pager.pageSize,
          },
          ...coUtil.apiHdr('앱 메시지 테스트', '디바이스 목록'),
        });
        const d = res.data?.data || {};
        devices.rows              = d.pageList       || d || [];
        devices.pager.pageTotalCount = d.pageTotalCount || (Array.isArray(d) ? d.length : 0);
      } catch (e) {
        showToast('디바이스 목록 조회 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      result.loadingDev = false;
    };

    // ── 발송 이력 조회 ────────────────────────────────────
    const loadHist = async () => {
      result.loadingHist = true;
      try {
        const res = await boApi.get('/bo/sy/test/app-msg/history', {
          params: {
            memberId:  hist.filter.memberId  || undefined,
            channel:   hist.filter.channel   || undefined,
            dateStart: hist.filter.dateStart || undefined,
            dateEnd:   hist.filter.dateEnd   || undefined,
            pageNo:    hist.pager.pageNo,
            pageSize:  hist.pager.pageSize,
          },
          ...coUtil.apiHdr('앱 메시지 테스트', '발송 이력'),
        });
        const d = res.data?.data || {};
        hist.rows              = d.pageList       || [];
        hist.pager.pageTotalCount = d.pageTotalCount || 0;
      } catch (e) {
        showToast('발송 이력 조회 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      result.loadingHist = false;
    };

    // ── WebSocket 실시간 수신 ─────────────────────────────
    const wsConnect = () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      const url = (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.hostname + ':8080/ws/chat';
      recvLog.wsStatus = '⏳ 연결 중…';
      try {
        ws = new WebSocket(url);
        ws.onopen = () => {
          recvLog.connected = true;
          recvLog.wsStatus  = '✅ 연결됨 (' + url + ')';
          ws.send(JSON.stringify({ type: 'JOIN', roomId: 'DEV_MSG_MONITOR', senderId: 'admin-monitor' }));
          recvLog.msgs.unshift({ ch: 'SYS', body: 'WebSocket 연결됨 — 인앱 메시지 수신 대기 중…', time: new Date().toLocaleTimeString() });
        };
        ws.onmessage = (e) => {
          let data = e.data;
          try { data = JSON.parse(e.data); } catch (_) { /* 무시 */ }
          recvLog.msgs.unshift({
            ch:   (data?.type || 'MSG'),
            body: typeof data === 'string' ? data : JSON.stringify(data),
            time: new Date().toLocaleTimeString(),
          });
          if (recvLog.msgs.length > 100) recvLog.msgs.pop();
        };
        ws.onerror = () => { recvLog.wsStatus = '❌ 연결 오류'; recvLog.connected = false; };
        ws.onclose = (e) => { recvLog.wsStatus = '미연결 (code:' + e.code + ')'; recvLog.connected = false; ws = null; };
      } catch (e) {
        recvLog.wsStatus = '❌ ' + e.message;
      }
    };

    const wsDisconnect = () => {
      if (ws) { ws.close(1000, '모니터 종료'); ws = null; }
    };

    const clearRecvLog = () => { recvLog.msgs = []; };

    // ── 디바이스 선택 토글 ────────────────────────────────
    const toggleSelectDevice = (row) => {
      const idx = devices.selected.findIndex(d => d.deviceTokenId === row.deviceTokenId);
      if (idx >= 0) devices.selected.splice(idx, 1);
      else           devices.selected.push(row);
    };

    const isDeviceSelected = (row) => devices.selected.some(d => d.deviceTokenId === row.deviceTokenId);

    // ── 선택 디바이스 일괄 발송 ───────────────────────────
    const sendToSelected = async () => {
      if (!devices.selected.length) { showToast('디바이스를 선택하세요.', 'error'); return; }
      const ok = await showConfirm('일괄 발송', '선택된 ' + devices.selected.length + '개 디바이스에 발송합니까?');
      if (!ok) return;
      result.loading = true;
      result.error   = '';
      let dataObj = {};
      try { dataObj = JSON.parse(baseForm.data || '{}'); } catch (e) { /* 무시 */ }
      let successCnt = 0, failCnt = 0;
      for (const dev of devices.selected) {
        const token = dev.fcmToken || dev.apnsToken || '';
        const ch = dev.platform === 'IOS' ? 'APNS' : 'FCM';
        try {
          await boApi.post('/bo/sy/test/app-msg/send', {
            targetMode:  'token',
            targetValue: token,
            platform:    dev.platform,
            channels:    [ch],
            title:       baseForm.title,
            body:        baseForm.body,
            data:        dataObj,
          }, coUtil.apiHdr('앱 메시지 테스트', '일괄 발송'));
          addSendLog(ch, token, '✅ 발송완료 → ' + (dev.memberId || '-'), 'success');
          successCnt++;
        } catch (e) {
          addSendLog(ch, token, '❌ ' + (e.response?.data?.message || e.message), 'error');
          failCnt++;
        }
      }
      result.loading = false;
      showToast('일괄 발송 완료: 성공 ' + successCnt + '건 / 실패 ' + failCnt + '건', successCnt > 0 ? 'success' : 'error');
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'send')              return send();
      if (cmd === 'send-to-selected')  return sendToSelected();
      if (cmd === 'devices-load')      return loadDevices();
      if (cmd === 'hist-load')         return loadHist();
      if (cmd === 'device-use')        return useDevice(param);
      if (cmd === 'member-use')        return useMember(param);
      if (cmd === 'device-toggle')     return toggleSelectDevice(param);
      if (cmd === 'ws-connect')        return wsConnect();
      if (cmd === 'ws-disconnect')     return wsDisconnect();
      if (cmd === 'recv-clear')        return clearRecvLog();
      if (cmd === 'tab')               return (tab.value = param);
    };

    return {
      codes, tab, cfg, baseForm, devices, hist, recvLog, result,
      cfActiveChannels, fnChannelBadge, fnPlatformBadge, fnStatusBadge,
      isDeviceSelected, handleBtnAction,
    };
  },

  template: `
<div>
  <div class="page-title">Android / iOS 앱 메시지 발송 &amp; 수신 확인</div>

  <!-- 설정 요약 배너 -->
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    <div class="card" style="flex:1;min-width:160px;padding:10px 14px">
      <div style="font-size:11px;color:#888;margin-bottom:4px">FCM</div>
      <div style="font-size:12px;font-weight:600" :style="cfg.fcmProjectId?'color:#15803d':'color:#b91c1c'">
        {{ cfg.fcmProjectId || '미설정' }}
      </div>
    </div>
    <div class="card" style="flex:1;min-width:160px;padding:10px 14px">
      <div style="font-size:11px;color:#888;margin-bottom:4px">APNs</div>
      <div style="font-size:12px;font-weight:600" :style="cfg.apnsKeyId?'color:#15803d':'color:#b91c1c'">
        {{ cfg.apnsKeyId ? (cfg.apnsKeyId + ' / ' + (cfg.apnsProduction?'Production':'Sandbox')) : '미설정' }}
      </div>
    </div>
    <div class="card" style="flex:1;min-width:160px;padding:10px 14px">
      <div style="font-size:11px;color:#888;margin-bottom:4px">SMS</div>
      <div style="font-size:12px;font-weight:600" :style="cfg.smsProvider?'color:#15803d':'color:#b91c1c'">
        {{ cfg.smsProvider || '미설정' }}
      </div>
    </div>
    <div class="card" style="flex:1;min-width:160px;padding:10px 14px">
      <div style="font-size:11px;color:#888;margin-bottom:4px">카카오</div>
      <div style="font-size:12px;font-weight:600" :style="cfg.kakaoSenderKey?'color:#15803d':'color:#b91c1c'">
        {{ cfg.kakaoSenderKey ? '설정됨' : '미설정' }}
      </div>
    </div>
  </div>

  <!-- 탭 바 -->
  <div style="display:flex;gap:4px;margin-bottom:12px">
    <button v-for="t in [{id:'send',label:'✉️ 메시지 발송'},{id:'devices',label:'📱 디바이스 목록'},{id:'history',label:'📋 발송 이력'},{id:'receive',label:'📡 실시간 수신'}]"
      :key="t.id" class="btn"
      :style="tab===t.id?'background:#2563eb;color:#fff;border-color:#2563eb':'background:#fff;color:#444;border:1px solid #d1d5db'"
      @click="handleBtnAction('tab', t.id)">
      {{ t.label }}
    </button>
  </div>

  <!-- ════════════════════════════════════════════════════
       탭 1: 메시지 발송
  ════════════════════════════════════════════════════ -->
  <div v-if="tab==='send'">

    <!-- 대상 설정 -->
    <div class="card" style="margin-bottom:12px">
      <div class="toolbar"><span class="list-title">발송 대상</span></div>
      <div style="padding:12px">
        <div class="form-row" style="gap:8px;margin-bottom:8px">
          <div class="form-group" style="flex:0 0 180px">
            <label class="form-label">대상 유형</label>
            <select class="form-control" v-model="baseForm.targetMode">
              <option value="token">디바이스 토큰 (단건)</option>
              <option value="member">회원 ID (전체 디바이스)</option>
              <option value="topic">FCM Topic (구독자)</option>
              <option value="broadcast">전체 브로드캐스트</option>
              <option value="phone">전화번호 (SMS/카카오)</option>
            </select>
          </div>
          <div class="form-group" style="flex:1" v-if="baseForm.targetMode !== 'broadcast'">
            <label class="form-label">
              {{ baseForm.targetMode==='token'?'FCM/APNs 토큰':baseForm.targetMode==='member'?'회원 ID':baseForm.targetMode==='topic'?'Topic 명':'전화번호' }}
              <span style="color:#e74c3c">*</span>
            </label>
            <input class="form-control" v-model="baseForm.targetValue"
              :placeholder="baseForm.targetMode==='token'?'eXxxxxxxxx… 또는 iOS hex 64자':baseForm.targetMode==='member'?'MB000001':baseForm.targetMode==='topic'?'all_members':'01012345678'"
              style="font-family:monospace;font-size:12px" />
          </div>
          <div class="form-group" style="flex:0 0 160px" v-if="baseForm.targetMode==='token'">
            <label class="form-label">플랫폼</label>
            <select class="form-control" v-model="baseForm.platform">
              <option value="ALL">자동 감지</option>
              <option value="ANDROID">Android (FCM)</option>
              <option value="IOS">iOS (FCM/APNs)</option>
            </select>
          </div>
        </div>
        <div v-if="baseForm.targetMode==='broadcast'" style="padding:8px;background:#fef9c3;border:1px solid #fde68a;border-radius:4px;font-size:12px;color:#92400e">
          ⚠ 전체 브로드캐스트: 등록된 모든 디바이스에 발송됩니다. 주의하여 사용하세요.
        </div>
      </div>
    </div>

    <!-- 채널 선택 -->
    <div class="card" style="margin-bottom:12px">
      <div class="toolbar"><span class="list-title">발송 채널 (다중 선택)</span></div>
      <div style="padding:12px;display:flex;gap:16px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" v-model="baseForm.chFcm" />
          <span class="badge badge-orange">FCM</span>
          Android + iOS 크로스플랫폼
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" v-model="baseForm.chApns" />
          <span class="badge badge-blue">APNs</span>
          iOS 직접 (p8 키)
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" v-model="baseForm.chSms" />
          <span class="badge badge-green">SMS</span>
          문자 메시지
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" v-model="baseForm.chKakao" />
          <span class="badge badge-purple">카카오</span>
          알림톡 / 친구톡
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
          <input type="checkbox" v-model="baseForm.chInapp" />
          <span class="badge badge-gray">InApp</span>
          WebSocket 인앱 메시지
        </label>
      </div>
      <div style="padding:0 12px 12px;font-size:12px;color:#888">
        활성 채널:
        <span v-if="!cfActiveChannels.length" style="color:#e74c3c">없음 (채널을 1개 이상 선택하세요)</span>
        <span v-for="ch in cfActiveChannels" :key="ch" :class="fnChannelBadge(ch)" style="margin-right:4px">{{ ch }}</span>
      </div>
    </div>

    <!-- 메시지 내용 -->
    <div class="card" style="margin-bottom:12px">
      <div class="toolbar">
        <span class="list-title">메시지 내용</span>
        <div style="margin-left:auto">
          <button class="btn btn_send" :disabled="result.loading || !cfActiveChannels.length" @click="handleBtnAction('send')">
            {{ result.loading ? '⏳ 발송 중…' : '🚀 발송' }}
          </button>
        </div>
      </div>
      <div style="padding:12px">
        <!-- 공통 Push/InApp 내용 -->
        <div v-if="baseForm.chFcm || baseForm.chApns || baseForm.chInapp">
          <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase">Push / 인앱 메시지</div>
          <div class="form-row" style="gap:8px;margin-bottom:8px">
            <div class="form-group" style="flex:1">
              <label class="form-label">제목</label>
              <input class="form-control" v-model="baseForm.title" />
            </div>
            <div class="form-group" style="flex:0 0 80px">
              <label class="form-label">Badge</label>
              <input class="form-control" type="number" v-model="baseForm.badge" min="0" />
            </div>
            <div class="form-group" style="flex:0 0 120px">
              <label class="form-label">Sound</label>
              <input class="form-control" v-model="baseForm.sound" placeholder="default" />
            </div>
          </div>
          <div class="form-row" style="gap:8px;margin-bottom:8px">
            <div class="form-group" style="flex:1">
              <label class="form-label">본문</label>
              <textarea class="form-control" v-model="baseForm.body" rows="2" style="resize:vertical"></textarea>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">이미지 URL (선택)</label>
              <input class="form-control" v-model="baseForm.imageUrl" placeholder="https://…/image.png" />
            </div>
          </div>
          <div class="form-row" style="gap:8px;margin-bottom:8px">
            <div class="form-group" style="flex:1">
              <label class="form-label">Data Payload (JSON)</label>
              <input class="form-control" v-model="baseForm.data" style="font-family:monospace;font-size:12px" placeholder='{"type":"order","orderId":"ORD001"}' />
            </div>
          </div>
        </div>
        <!-- 카카오 알림톡 -->
        <div v-if="baseForm.chKakao" style="margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0">
          <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase">카카오 알림톡 / 친구톡</div>
          <div class="form-row" style="gap:8px;margin-bottom:8px">
            <div class="form-group" style="flex:1">
              <label class="form-label">템플릿 코드 (알림톡)</label>
              <input class="form-control" v-model="baseForm.templateCode" placeholder="ORDER_CONFIRM_01" style="font-family:monospace" />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">템플릿 변수 (JSON)</label>
              <input class="form-control" v-model="baseForm.templateVars" style="font-family:monospace;font-size:12px" />
            </div>
          </div>
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">친구톡 내용 (템플릿 코드 없을 때)</label>
            <textarea class="form-control" v-model="baseForm.kakaoContent" rows="2" placeholder="친구톡 텍스트 메시지 (최대 1000자)" style="resize:vertical"></textarea>
          </div>
        </div>
        <!-- SMS -->
        <div v-if="baseForm.chSms" style="margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0">
          <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase">SMS 메시지</div>
          <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px">
            SMS 내용은 <b>본문(body)</b> 필드를 그대로 사용합니다. 90바이트 초과 시 LMS 자동 전환.
            발신번호: <code>{{ cfg.smsFrom || '(미설정)' }}</code>
          </div>
        </div>
        <!-- 결과 -->
        <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px;white-space:pre-wrap">❌ {{ result.error }}</div>
        <div v-if="result.batchResult" style="margin-top:8px;background:#f8f9fa;border-radius:4px;padding:10px;font-size:12px">
          <div style="font-weight:600;margin-bottom:6px">발송 결과</div>
          <div v-for="(v, k) in result.batchResult" :key="k" style="display:flex;gap:8px;padding:3px 0">
            <span :class="fnChannelBadge(k.toUpperCase())" style="min-width:52px;text-align:center">{{ k.toUpperCase() }}</span>
            <span :style="v.success!==false?'color:#15803d':'color:#b91c1c'">
              {{ v.success !== false ? '✅ ' : '❌ ' }}{{ v.messageId || v.apnsId || v.msgId || v.error || JSON.stringify(v) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 세션 발송 로그 -->
    <div class="card">
      <div class="toolbar">
        <span class="list-title">세션 발송 로그 (최근 50건)</span>
      </div>
      <div style="padding:12px;max-height:240px;overflow-y:auto">
        <div v-if="!result.sendLogs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">발송 후 이력이 표시됩니다</div>
        <div v-for="(log, idx) in result.sendLogs" :key="idx"
          style="display:flex;gap:8px;font-size:12px;padding:4px 0;border-bottom:1px solid #f0f0f0;align-items:flex-start">
          <span style="color:#999;white-space:nowrap">{{ log.time }}</span>
          <span :class="fnChannelBadge(log.channel)" style="white-space:nowrap">{{ log.channel }}</span>
          <span style="color:#aaa;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis">{{ log.target }}</span>
          <span :style="log.type==='error'?'color:#b91c1c':log.type==='success'?'color:#15803d':'color:#444'">{{ log.msg }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════
       탭 2: 디바이스 목록
  ════════════════════════════════════════════════════ -->
  <div v-if="tab==='devices'">
    <div class="card">
      <div class="toolbar">
        <span class="list-title">등록 디바이스 (mb_device_token)</span>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button v-if="devices.selected.length" class="btn btn_send" @click="handleBtnAction('send-to-selected')" :disabled="result.loading">
            {{ result.loading ? '⏳' : ('✉️ 선택 ' + devices.selected.length + '건 발송') }}
          </button>
          <button class="btn btn_search" :disabled="result.loadingDev" @click="handleBtnAction('devices-load')">
            {{ result.loadingDev ? '⏳' : '조회' }}
          </button>
        </div>
      </div>
      <!-- 필터 -->
      <div style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #f0f0f0">
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">플랫폼</label>
          <select class="form-control" v-model="devices.filter.platform">
            <option value="">전체</option>
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;max-width:240px">
          <label class="form-label">회원 ID</label>
          <input class="form-control" v-model="devices.filter.memberId" placeholder="MB000001" />
        </div>
      </div>
      <div style="padding:12px">
        <div v-if="!devices.rows.length" style="color:#999;font-size:12px;text-align:center;padding:24px">
          [조회] 버튼을 클릭하세요
        </div>
        <div v-else style="max-height:480px;overflow-y:auto">
          <table class="admin-table" style="font-size:11px">
            <thead><tr>
              <th style="width:28px"><input type="checkbox" @change="e => e.target.checked ? devices.rows.forEach(r=>devices.selected.push(r)) : (devices.selected=[])"/></th>
              <th style="width:36px">번호</th>
              <th>회원 ID</th>
              <th>플랫폼</th>
              <th>토큰 (앞 32자)</th>
              <th>앱 버전</th>
              <th>등록일</th>
              <th style="width:80px">액션</th>
            </tr></thead>
            <tbody>
              <tr v-for="(row, idx) in devices.rows" :key="row.deviceTokenId" :style="isDeviceSelected(row)?'background:#eff6ff':''">
                <td style="text-align:center">
                  <input type="checkbox" :checked="isDeviceSelected(row)" @change="handleBtnAction('device-toggle', row)" />
                </td>
                <td style="text-align:center">{{ (devices.pager.pageNo-1)*devices.pager.pageSize + idx + 1 }}</td>
                <td>
                  <span class="title-link" @click="handleBtnAction('member-use', row.memberId)">{{ row.memberId }}</span>
                </td>
                <td><span :class="fnPlatformBadge(row.platform)">{{ row.platform }}</span></td>
                <td style="font-family:monospace">{{ (row.fcmToken || row.apnsToken || '').substring(0, 32) }}…</td>
                <td>{{ row.appVersion || '-' }}</td>
                <td>{{ row.regDate }}</td>
                <td style="text-align:center">
                  <button class="btn btn_row_edit" @click="handleBtnAction('device-use', row)">선택</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#888">
          전체 {{ devices.pager.pageTotalCount }}건 | 선택 {{ devices.selected.length }}건
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════
       탭 3: 발송 이력 (cmh_push_log)
  ════════════════════════════════════════════════════ -->
  <div v-if="tab==='history'">
    <div class="card">
      <div class="toolbar">
        <span class="list-title">발송 이력 (cmh_push_log)</span>
        <div style="margin-left:auto">
          <button class="btn btn_search" :disabled="result.loadingHist" @click="handleBtnAction('hist-load')">
            {{ result.loadingHist ? '⏳' : '조회' }}
          </button>
        </div>
      </div>
      <!-- 필터 -->
      <div style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #f0f0f0">
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">채널</label>
          <select class="form-control" v-model="hist.filter.channel">
            <option value="">전체</option>
            <option value="FCM">FCM</option>
            <option value="APNS">APNs</option>
            <option value="SMS">SMS</option>
            <option value="KAKAO">카카오</option>
            <option value="INAPP">InApp</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;max-width:200px">
          <label class="form-label">회원 ID</label>
          <input class="form-control" v-model="hist.filter.memberId" placeholder="MB000001" />
        </div>
        <div class="form-group" style="flex:0 0 140px">
          <label class="form-label">시작일</label>
          <input class="form-control" type="date" v-model="hist.filter.dateStart" />
        </div>
        <div class="form-group" style="flex:0 0 140px">
          <label class="form-label">종료일</label>
          <input class="form-control" type="date" v-model="hist.filter.dateEnd" />
        </div>
      </div>
      <div style="padding:12px">
        <div v-if="!hist.rows.length" style="color:#999;font-size:12px;text-align:center;padding:24px">
          [조회] 버튼을 클릭하세요
        </div>
        <div v-else style="max-height:520px;overflow-y:auto">
          <table class="admin-table" style="font-size:11px">
            <thead><tr>
              <th style="width:36px">번호</th>
              <th>발송일시</th>
              <th>채널</th>
              <th>회원 ID</th>
              <th>제목</th>
              <th>결과</th>
              <th>메시지 ID</th>
              <th>오류</th>
            </tr></thead>
            <tbody>
              <tr v-for="(row, idx) in hist.rows" :key="row.pushLogId || idx">
                <td style="text-align:center">{{ (hist.pager.pageNo-1)*hist.pager.pageSize + idx + 1 }}</td>
                <td style="white-space:nowrap">{{ row.sendDate || row.regDate }}</td>
                <td><span :class="fnChannelBadge(row.channel)">{{ row.channel }}</span></td>
                <td>{{ row.memberId || '-' }}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ row.title }}</td>
                <td><span :class="fnStatusBadge(row.sendStatus || row.status)">{{ row.sendStatus || row.status || '-' }}</span></td>
                <td style="font-family:monospace;font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis">{{ row.messageId || '-' }}</td>
                <td style="color:#b91c1c;font-size:10px;max-width:160px">{{ row.errorMsg || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#888">전체 {{ hist.pager.pageTotalCount }}건</div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════
       탭 4: 실시간 수신 (WebSocket 모니터)
  ════════════════════════════════════════════════════ -->
  <div v-if="tab==='receive'">
    <div class="card" style="margin-bottom:12px">
      <div class="toolbar">
        <span class="list-title">인앱 메시지 실시간 수신 모니터 (WebSocket)</span>
        <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
          <span class="badge" :class="recvLog.connected?'badge-green':'badge-gray'">
            {{ recvLog.connected ? '● 연결됨' : '○ 미연결' }}
          </span>
          <button v-if="!recvLog.connected" class="btn btn_apply" @click="handleBtnAction('ws-connect')">🔌 연결</button>
          <button v-else class="btn btn_cancel" @click="handleBtnAction('ws-disconnect')">연결 해제</button>
          <button class="btn btn_reset" @click="handleBtnAction('recv-clear')">로그 지우기</button>
        </div>
      </div>
      <div style="padding:12px">
        <div style="font-size:12px;color:#666;margin-bottom:8px;padding:6px 8px;background:#f8f9fa;border-radius:4px">
          상태: <strong>{{ recvLog.wsStatus }}</strong>
        </div>
        <div style="height:380px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px;padding:10px;background:#111;font-family:monospace;font-size:12px;display:flex;flex-direction:column;gap:4px">
          <div v-if="!recvLog.msgs.length" style="color:#555;text-align:center;margin:auto">연결 후 인앱 메시지가 여기 실시간으로 표시됩니다</div>
          <div v-for="(m, idx) in recvLog.msgs" :key="idx" style="color:#d1d5db">
            <span style="color:#6b7280">[{{ m.time }}]</span>
            <span style="color:#60a5fa;margin:0 6px">{{ m.ch }}</span>
            {{ m.body }}
          </div>
        </div>
      </div>
    </div>

    <!-- 수신 확인 방법 안내 -->
    <div class="card">
      <div class="toolbar"><span class="list-title">수신 확인 방법</span></div>
      <div style="padding:12px;font-size:12px;line-height:2;color:#444">
        <table class="admin-table" style="font-size:12px">
          <thead><tr>
            <th>채널</th>
            <th>발송 확인 방법</th>
            <th>수신 확인 방법</th>
          </tr></thead>
          <tbody>
            <tr>
              <td><span class="badge badge-orange">FCM</span></td>
              <td>발송 탭 → FCM 체크 → 발송 → 결과 messageId 확인</td>
              <td>실기기: 알림 트레이 확인 / Firebase Console → Messaging → 캠페인 이력</td>
            </tr>
            <tr>
              <td><span class="badge badge-blue">APNs</span></td>
              <td>ZdTestPushAlimApns 에서 단건 발송 후 apnsId 확인</td>
              <td>실 iOS 기기 잠금화면/알림센터 / Apple Developer → 로그</td>
            </tr>
            <tr>
              <td><span class="badge badge-green">SMS</span></td>
              <td>발송 탭 → SMS 체크 → 전화번호 입력 → 발송</td>
              <td>실 수신 번호 문자 앱 확인 / 발송 이력 탭</td>
            </tr>
            <tr>
              <td><span class="badge badge-purple">카카오</span></td>
              <td>발송 탭 → 카카오 체크 → 알림톡 템플릿 코드 입력 → 발송</td>
              <td>카카오톡 앱 알림 / 카카오 비즈메시지 포털 발송 이력</td>
            </tr>
            <tr>
              <td><span class="badge badge-gray">InApp</span></td>
              <td>발송 탭 → InApp 체크 → 발송</td>
              <td>이 탭의 WebSocket 수신 모니터에서 실시간 확인</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:12px;padding:8px;background:#f0f4ff;border-radius:4px">
          <b>📋 발송 이력 탭</b> — <code>cmh_push_log</code> 테이블의 모든 채널 발송 이력을 조회합니다.<br>
          백엔드 엔드포인트: <code>POST /api/bo/sy/test/app-msg/send</code> (통합 발송 오케스트레이터)<br>
          채널별 서비스: <code>CmPushSendService</code> (FCM/APNs) · <code>CmSmsSendService</code> · <code>CmKakaoSendService</code> · WebSocket Broker
        </div>
      </div>
    </div>
  </div>

</div>`,
};
