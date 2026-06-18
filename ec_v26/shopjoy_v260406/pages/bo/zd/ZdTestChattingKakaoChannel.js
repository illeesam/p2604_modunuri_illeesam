/**
 * 개발도구 — 카카오 채널(플러스친구) 메시지 테스트
 */
window.ZdTestChattingKakaoChannel = {
  name: 'ZdTestChattingKakaoChannel',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      channelId:     '',   // 카카오 채널 공개 ID (@ 포함)
      bizMsgApiKey:  '',   // 비즈메시지 API Key
      senderKey:     '',   // 알림톡 발신 프로필 키
      from:          '',   // 발신 전화번호
    });

    const form = reactive({
      msgType:     'alimtalk',  // alimtalk | friendtalk | channel_add
      toPhone:     '',
      templateCode:'',
      variables:   '{"name":"홍길동","orderNo":"ORD20260619001","amount":"150,000"}',
      content:     '',
    });

    const result = reactive({
      status:   '',
      response: null,
      error:    '',
      logs:     [],
    });

    const uiState = reactive({ loading: false });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.kakao.channel-id,app.kakao.biz-msg-api-key,app.kakao.sender-key,app.kakao.from',
        });
        (res?.data?.data || []).forEach(p => {
          if (p.propKey === 'app.kakao.channel-id')      cfg.channelId    = p.propVal || '';
          if (p.propKey === 'app.kakao.biz-msg-api-key') cfg.bizMsgApiKey = p.propVal || '';
          if (p.propKey === 'app.kakao.sender-key')      cfg.senderKey    = p.propVal || '';
          if (p.propKey === 'app.kakao.from')            cfg.from         = p.propVal || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addLog = (msg, type = 'info') => {
      result.logs.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.logs.length > 20) result.logs.pop();
    };

    const send = async () => {
      if (form.msgType !== 'channel_add' && !form.toPhone) { showToast('수신 번호를 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ 발송 중…';
      result.error    = '';
      result.response = null;
      let varsObj = {};
      try { varsObj = JSON.parse(form.variables || '{}'); } catch (e) { /* 무시 */ }
      addLog('[' + form.msgType + '] 발송 요청 → ' + (form.toPhone || form.templateCode));
      try {
        const res = await boApi.post('/bo/sy/test/kakao/channel', {
          msgType:      form.msgType,
          toPhone:      form.toPhone,
          templateCode: form.templateCode,
          variables:    varsObj,
          content:      form.content,
        }, coUtil.apiHdr('카카오채널 테스트', '발송'));
        result.response = res.data?.data || res.data;
        result.status   = '✅ 발송 완료';
        addLog('✅ 완료', 'success');
        showToast('발송 완료', 'success');
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '발송 실패';
        result.status = '❌ 발송 실패';
        addLog('❌ ' + result.error, 'error');
        showToast(result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const saveKey = async () => {
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.kakao.channel-id',      propVal: cfg.channelId },
          { propKey: 'app.kakao.biz-msg-api-key', propVal: cfg.bizMsgApiKey },
          { propKey: 'app.kakao.sender-key',      propVal: cfg.senderKey },
          { propKey: 'app.kakao.from',            propVal: cfg.from },
        ], coUtil.apiHdr('카카오채널 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'send')     return send();
      if (cmd === 'key-save') return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">카카오 채널(알림톡/친구톡) 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">카카오 비즈메시지 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">채널 공개 ID</label>
          <input class="form-control" v-model="cfg.channelId" placeholder="@shopjoy" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">발신 번호 (사전 등록)</label>
          <input class="form-control" v-model="cfg.from" placeholder="0212345678" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">비즈메시지 API Key</label>
          <input class="form-control" type="password" v-model="cfg.bizMsgApiKey" placeholder="sy_prop: app.kakao.biz-msg-api-key" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">발신 프로필 키 (Sender Key)</label>
          <input class="form-control" type="password" v-model="cfg.senderKey" placeholder="sy_prop: app.kakao.sender-key" />
        </div>
      </div>
      <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
    </div>
  </div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">메시지 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '💬 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">메시지 유형</label>
          <select class="form-control" v-model="form.msgType">
            <option value="alimtalk">알림톡 (Alimtalk)</option>
            <option value="friendtalk">친구톡 (Friendtalk)</option>
            <option value="channel_add">채널 추가 요청</option>
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">수신 번호 <span style="color:#e74c3c" v-if="form.msgType!=='channel_add'">*</span></label>
          <input class="form-control" v-model="form.toPhone" placeholder="01012345678" :disabled="form.msgType==='channel_add'" />
        </div>
      </div>
      <div v-if="form.msgType==='alimtalk'" class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">템플릿 코드 <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="form.templateCode" placeholder="ORDER_CONFIRM_01" style="font-family:monospace" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">변수 (JSON)</label>
          <input class="form-control" v-model="form.variables" style="font-family:monospace;font-size:12px" />
        </div>
      </div>
      <div v-if="form.msgType==='friendtalk'" class="form-group" style="margin-bottom:8px">
        <label class="form-label">메시지 내용 <span style="color:#e74c3c">*</span></label>
        <textarea class="form-control" v-model="form.content" rows="3" placeholder="친구톡 내용을 입력하세요. (최대 1000자)" style="resize:vertical"></textarea>
      </div>
      <div v-if="form.msgType==='channel_add'" style="padding:8px;background:#f0f4ff;border-radius:4px;font-size:12px;color:#444">
        채널 추가 요청 메시지를 발송합니다. 채널 ID: <b>{{ cfg.channelId || '(미설정)' }}</b>
      </div>
      <div v-if="result.status" style="margin-top:8px;font-size:13px;font-weight:600">{{ result.status }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px">{{ result.error }}</div>
      <div v-if="result.response" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        <pre style="margin:0">{{ JSON.stringify(result.response, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- 이력 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">발송 이력 (최근 20건)</span></div>
    <div style="padding:12px">
      <div v-if="!result.logs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">발송 이력 없음</div>
      <div v-for="log in result.logs" :key="log.time" style="display:flex;gap:8px;font-size:12px;padding:4px 0;border-bottom:1px solid #f0f0f0">
        <span style="color:#999;white-space:nowrap">{{ log.time }}</span>
        <span :style="log.type==='error'?'color:#b91c1c':log.type==='success'?'color:#15803d':''">{{ log.msg }}</span>
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> 카카오 비즈니스 채널 개설 → 카카오 비즈메시지 파트너사 등록<br>
      <b>2.</b> 알림톡 발신 프로필 등록 → Sender Key 발급<br>
      <b>3.</b> 알림톡 템플릿 등록 → 검수 완료 후 사용 가능<br>
      <b>4.</b> 비즈메시지 API Key 발급 (파트너사 포털)<br><br>
      <b>백엔드 API:</b> <code>POST /api/bo/sy/test/kakao/channel</code><br>
      → <code>CmKakaoSendService</code> 경유 (알림톡/친구톡/채널추가 분기)
    </div>
  </div>
</div>`,
};
