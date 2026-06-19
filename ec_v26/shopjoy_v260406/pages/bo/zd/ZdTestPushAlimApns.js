/**
 * 개발도구 — APNs (Apple Push Notification service) 테스트
 */
window.ZdTestPushAlimApns = {
  name: 'ZdTestPushAlimApns',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      keyId:      '',   // APNs Auth Key ID (10자리)
      teamId:     '',   // Apple Team ID (10자리)
      keyFile:    '',   // .p8 키 파일 경로
      bundleId:   '',   // 앱 Bundle ID
      production: false, // true=production / false=sandbox
    });

    const form = reactive({
      deviceToken: '',
      title:       '[ShopJoy] APNs 테스트',
      body:        'APNs 연동이 정상적으로 작동하는지 확인하는 테스트 푸시입니다.',
      badge:       1,
      sound:       'default',
      data:        '{"type":"test","url":"/"}',
    });

    const result = reactive({
      status:    '',
      response:  null,
      error:     '',
      logs:      [],
      tokenLogs: [],
    });

    const uiState = reactive({ loading: false, loadingTokens: false });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.push.apns.key-id,app.push.apns.team-id,app.push.apns.key-file,app.push.apns.bundle-id,app.push.apns.production',
        });
        (res?.data?.data || []).forEach(p => {
          if (p.propKey === 'app.push.apns.key-id')    cfg.keyId      = p.propValue || '';
          if (p.propKey === 'app.push.apns.team-id')   cfg.teamId     = p.propValue || '';
          if (p.propKey === 'app.push.apns.key-file')  cfg.keyFile    = p.propValue || '';
          if (p.propKey === 'app.push.apns.bundle-id') cfg.bundleId   = p.propValue || '';
          if (p.propKey === 'app.push.apns.production') cfg.production = p.propValue === 'true';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const addLog = (msg, type = 'info') => {
      result.logs.unshift({ msg, type, time: new Date().toLocaleTimeString() });
      if (result.logs.length > 30) result.logs.pop();
    };

    const sendPush = async () => {
      if (!form.deviceToken) { showToast('Device Token 을 입력하세요.', 'error'); return; }
      uiState.loading = true;
      result.status   = '⏳ APNs 푸시 발송 중…';
      result.error    = '';
      result.response = null;
      addLog('APNs 발송 요청 → ' + form.deviceToken.substring(0, 20) + '…');
      let dataObj = {};
      try { dataObj = JSON.parse(form.data || '{}'); } catch (e) { /* 무시 */ }
      try {
        const res = await boApi.post('/bo/sy/test/push/apns', {
          deviceToken: form.deviceToken,
          title:       form.title,
          body:        form.body,
          badge:       form.badge,
          sound:       form.sound,
          data:        dataObj,
        }, coUtil.apiHdr('APNs 테스트', '푸시 발송'));
        result.response = res.data?.data || res.data;
        result.status   = '✅ APNs 발송 완료';
        addLog('✅ 발송 완료 (apnsId: ' + (result.response?.apnsId || '-') + ')', 'success');
        showToast('APNs 푸시 발송 완료', 'success');
      } catch (e) {
        result.error  = e.response?.data?.message || e.message || '알 수 없는 오류';
        result.status = '❌ 발송 실패';
        addLog('❌ ' + result.error, 'error');
        showToast('APNs 발송 실패: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const loadIosTokens = async () => {
      uiState.loadingTokens = true;
      try {
        const res = await boApi.get('/bo/sy/test/push/tokens?platform=IOS', coUtil.apiHdr('APNs 테스트', 'iOS 토큰 목록'));
        result.tokenLogs = res.data?.data || [];
      } catch (e) {
        showToast('토큰 목록 조회 실패: ' + (e.response?.data?.message || e.message), 'error', 0);
      }
      uiState.loadingTokens = false;
    };

    const useToken = (token) => {
      form.deviceToken = token;
      showToast('토큰이 입력란에 설정되었습니다.', 'success');
    };

    const saveKey = async () => {
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.push.apns.key-id',     propValue: cfg.keyId },
          { propKey: 'app.push.apns.team-id',    propValue: cfg.teamId },
          { propKey: 'app.push.apns.key-file',   propValue: cfg.keyFile },
          { propKey: 'app.push.apns.bundle-id',  propValue: cfg.bundleId },
          { propKey: 'app.push.apns.production', propValue: String(cfg.production) },
        ], coUtil.apiHdr('APNs 테스트', '설정 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd, param) => {
      if (cmd === 'push-send')     return sendPush();
      if (cmd === 'tokens-load')   return loadIosTokens();
      if (cmd === 'token-use')     return useToken(param);
      if (cmd === 'key-save')      return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">APNs (iOS 푸시 알림) 테스트</div>

  <!-- 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">APNs 설정</span>
      <div style="margin-left:auto">
        <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Key ID (10자리)</label>
          <input class="form-control" v-model="cfg.keyId" placeholder="ABCD1234EF" style="font-family:monospace" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Team ID (10자리)</label>
          <input class="form-control" v-model="cfg.teamId" placeholder="AB12CD34EF" style="font-family:monospace" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Bundle ID</label>
          <input class="form-control" v-model="cfg.bundleId" placeholder="com.shopjoy.app" style="font-family:monospace" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:2">
          <label class="form-label">.p8 Key 파일 경로</label>
          <input class="form-control" v-model="cfg.keyFile" placeholder="/etc/shopjoy/AuthKey_ABCD1234EF.p8" style="font-family:monospace;font-size:12px" />
        </div>
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">환경</label>
          <select class="form-control" v-model="cfg.production">
            <option :value="false">Sandbox (개발)</option>
            <option :value="true">Production (운영)</option>
          </select>
        </div>
      </div>
      <table class="admin-table" style="font-size:12px;margin-top:4px">
        <tbody>
          <tr><td style="width:160px;color:#555">Key ID</td><td><code>{{ cfg.keyId || '(not set)' }}</code></td></tr>
          <tr><td style="color:#555">Team ID</td><td><code>{{ cfg.teamId || '(not set)' }}</code></td></tr>
          <tr><td style="color:#555">Bundle ID</td><td><code>{{ cfg.bundleId || '(not set)' }}</code></td></tr>
          <tr><td style="color:#555">환경</td>
            <td><span :class="cfg.production ? 'badge badge-red' : 'badge badge-blue'">{{ cfg.production ? 'Production' : 'Sandbox' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- 발송 폼 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">푸시 발송</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading" @click="handleBtnAction('push-send')">
          {{ uiState.loading ? '⏳ 발송 중…' : '🍎 테스트 APNs 발송' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-group" style="margin-bottom:8px">
        <label class="form-label">iOS Device Token <span style="color:#e74c3c">*</span></label>
        <input class="form-control" v-model="form.deviceToken" placeholder="a1b2c3d4e5f6…(64자 hex)" style="font-family:monospace;font-size:12px" />
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">제목</label>
          <input class="form-control" v-model="form.title" />
        </div>
        <div class="form-group" style="flex:0 0 80px">
          <label class="form-label">Badge</label>
          <input class="form-control" type="number" v-model="form.badge" min="0" />
        </div>
        <div class="form-group" style="flex:0 0 120px">
          <label class="form-label">Sound</label>
          <input class="form-control" v-model="form.sound" placeholder="default" />
        </div>
      </div>
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">본문</label>
          <textarea class="form-control" v-model="form.body" rows="2" style="resize:vertical"></textarea>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Custom Data (JSON)</label>
          <textarea class="form-control" v-model="form.data" rows="2" style="font-family:monospace;font-size:12px;resize:vertical"></textarea>
        </div>
      </div>
      <div v-if="result.status" style="margin-top:8px;font-size:13px;font-weight:600">{{ result.status }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px;white-space:pre-wrap">{{ result.error }}</div>
      <div v-if="result.response" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        <pre style="margin:0">{{ JSON.stringify(result.response, null, 2) }}</pre>
      </div>
    </div>
  </div>

  <!-- iOS 디바이스 토큰 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">등록된 iOS 디바이스 토큰 (mb_device_token)</span>
      <div style="margin-left:auto">
        <button class="btn btn_search" :disabled="uiState.loadingTokens" @click="handleBtnAction('tokens-load')">
          {{ uiState.loadingTokens ? '⏳' : 'iOS 토큰 목록 조회' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="!result.tokenLogs.length" style="color:#999;font-size:12px;text-align:center;padding:16px">
        [iOS 토큰 목록 조회] 버튼을 클릭하세요
      </div>
      <div v-else style="max-height:280px;overflow-y:auto">
        <table class="admin-table" style="font-size:11px">
          <thead><tr>
            <th style="width:36px">번호</th>
            <th>회원 ID</th>
            <th>토큰 (앞 20자)</th>
            <th>등록일</th>
            <th style="width:60px">사용</th>
          </tr></thead>
          <tbody>
            <tr v-for="(t, idx) in result.tokenLogs" :key="t.deviceTokenId">
              <td style="text-align:center">{{ idx + 1 }}</td>
              <td>{{ t.memberId }}</td>
              <td style="font-family:monospace">{{ (t.fcmToken || t.apnsToken || '').substring(0, 20) }}…</td>
              <td>{{ t.regDate }}</td>
              <td style="text-align:center">
                <button class="btn btn_row_edit" @click="handleBtnAction('token-use', t.fcmToken || t.apnsToken)">선택</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 이력 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">발송 이력 (최근 30건)</span></div>
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
    <div class="toolbar"><span class="list-title">APNs 설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> Apple Developer → Certificates → Keys → New Key → APNs 체크 → 다운로드 (.p8)<br>
      <b>2.</b> Key ID (10자리), Team ID (10자리) 확인<br>
      <b>3.</b> .p8 파일을 서버에 저장 → sy_prop <code>app.push.apns.key-file</code> 에 경로 등록<br>
      <b>4.</b> Bundle ID = Xcode 앱 Bundle Identifier<br>
      <b>5.</b> Sandbox(개발기기) vs Production(App Store 배포) 구분<br><br>
      <b>백엔드 API:</b> <code>POST /api/bo/sy/test/push/apns</code> → <code>CmApnsSendService.sendApns()</code><br>
      라이브러리: <code>com.eatthepath:pushy</code> (Netty 기반 HTTP/2 APNs 클라이언트) 권장
    </div>
  </div>
</div>`,
};
