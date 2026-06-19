/**
 * 개발도구 — 카카오 소셜 로그인 테스트
 */
window.ZdTestSnsLoginKakao = {
  name: 'ZdTestSnsLoginKakao',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { ref, reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      kakaoJsKey:       '',
      naverClientId:    '',
      naverCallbackUrl: '',
    });

    const result = reactive({
      sdkStatus:   '',
      loginStatus: '',
      userInfo:    null,
      rawResponse: '',
      error:       '',
    });

    const uiState = reactive({
      loading:    false,
      sdkLoaded:  false,
      loggedIn:   false,
    });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      // sy_prop 에서 키 조회
      try {
        const res = await boApiSvc.syProp?.getList?.({ propKeys: 'ext.sdk.kakaoJsKey,ext.sdk.naverClientId,ext.sdk.naverCallbackUrl' }, '카카오 소셜 로그인 테스트', '키 조회');
        const list = res?.data?.data || [];
        list.forEach(p => {
          if (p.propKey === 'ext.sdk.kakaoJsKey')       cfg.kakaoJsKey       = p.propValue || '';
          if (p.propKey === 'ext.sdk.naverClientId')     cfg.naverClientId    = p.propValue || '';
          if (p.propKey === 'ext.sdk.naverCallbackUrl')  cfg.naverCallbackUrl = p.propValue || '';
        });
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdkStatus();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdkStatus = () => {
      const kakaoOk = !!(window.Kakao && window.Kakao.isInitialized?.());
      uiState.sdkLoaded = kakaoOk;
      result.sdkStatus  = kakaoOk
        ? '✅ Kakao SDK 로드됨 (초기화 완료)'
        : (window.Kakao ? '⚠ Kakao SDK 로드됨 (미초기화)' : '❌ Kakao SDK 없음');
    };

    const initKakaoSdk = () => {
      if (!cfg.kakaoJsKey) { showToast('JS Key 를 입력하세요.', 'error'); return; }
      try {
        if (!window.Kakao) throw new Error('Kakao SDK 스크립트가 로드되지 않았습니다.');
        if (!window.Kakao.isInitialized()) window.Kakao.init(cfg.kakaoJsKey);
        uiState.sdkLoaded = true;
        result.sdkStatus  = '✅ Kakao SDK 초기화 완료 (JS Key: ' + cfg.kakaoJsKey.substring(0, 8) + '…)';
        showToast('Kakao SDK 초기화 완료', 'success');
      } catch (e) {
        result.error = e.message;
        showToast('초기화 실패: ' + e.message, 'error', 0);
      }
    };

    const testLogin = () => {
      if (!uiState.sdkLoaded) { showToast('SDK 초기화 먼저 하세요.', 'error'); return; }
      uiState.loading    = true;
      result.loginStatus = '⏳ 로그인 팝업 요청 중…';
      result.error       = '';
      result.userInfo    = null;
      window.Kakao.Auth.login({
        success: (authObj) => {
          result.rawResponse = JSON.stringify(authObj, null, 2);
          // 사용자 정보 조회
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (res) => {
              result.userInfo    = res;
              result.loginStatus = '✅ 로그인 성공';
              uiState.loggedIn   = true;
              uiState.loading    = false;
              showToast('카카오 로그인 성공', 'success');
            },
            fail: (err) => {
              result.error       = JSON.stringify(err);
              result.loginStatus = '⚠ 토큰 발급 성공 / 사용자 정보 조회 실패';
              uiState.loading    = false;
            },
          });
        },
        fail: (err) => {
          result.error       = JSON.stringify(err, null, 2);
          result.loginStatus = '❌ 로그인 실패';
          uiState.loading    = false;
          showToast('카카오 로그인 실패', 'error', 0);
        },
      });
    };

    const testLogout = () => {
      if (!uiState.loggedIn) { showToast('로그인 상태가 아닙니다.', 'error'); return; }
      window.Kakao.Auth.logout(() => {
        result.loginStatus = '⊘ 로그아웃 완료';
        result.userInfo    = null;
        uiState.loggedIn   = false;
        showToast('카카오 로그아웃 완료', 'success');
      });
    };

    const saveKey = async () => {
      if (!cfg.kakaoJsKey) { showToast('JS Key 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'ext.sdk.kakaoJsKey', propValue: cfg.kakaoJsKey },
        ], coUtil.apiHdr('카카오 SDK 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-init')    return initKakaoSdk();
      if (cmd === 'login-test')  return testLogin();
      if (cmd === 'logout-test') return testLogout();
      if (cmd === 'key-save')    return saveKey();
    };

    return { cfg, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">카카오 소셜 로그인 테스트</div>

  <!-- 설정 정보 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 / 키 확인</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Kakao JS Key <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="cfg.kakaoJsKey" placeholder="sy_prop: ext.sdk.kakaoJsKey" />
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;padding-bottom:1px">
          <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
          <button class="btn btn_apply" @click="handleBtnAction('sdk-init')">SDK 초기화</button>
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px">
        SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong>
      </div>
    </div>
  </div>

  <!-- 로그인 테스트 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">로그인 / 로그아웃 테스트</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button class="btn btn_confirm" :disabled="uiState.loading || !uiState.sdkLoaded" @click="handleBtnAction('login-test')">
          {{ uiState.loading ? '⏳ 처리 중…' : '카카오 로그인 팝업' }}
        </button>
        <button class="btn btn_cancel" :disabled="!uiState.loggedIn" @click="handleBtnAction('logout-test')">로그아웃</button>
      </div>
    </div>
    <div style="padding:12px">
      <div v-if="result.loginStatus" style="margin-bottom:8px;font-size:13px;font-weight:600">{{ result.loginStatus }}</div>
      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;white-space:pre-wrap;margin-bottom:8px">{{ result.error }}</div>
      <!-- 사용자 정보 -->
      <div v-if="result.userInfo" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px">
        <div style="font-weight:600;margin-bottom:6px;color:#15803d">✅ 사용자 정보</div>
        <table style="font-size:12px;border-collapse:collapse;width:100%">
          <tr><td style="padding:2px 8px;color:#555;width:120px">ID</td><td>{{ result.userInfo.id }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">닉네임</td><td>{{ result.userInfo.properties?.nickname }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">이메일</td><td>{{ result.userInfo.kakao_account?.email }}</td></tr>
          <tr><td style="padding:2px 8px;color:#555">프로필 이미지</td><td>
            <img v-if="result.userInfo.properties?.profile_image" :src="result.userInfo.properties.profile_image" style="width:40px;height:40px;border-radius:50%;vertical-align:middle;margin-right:6px" />
            {{ result.userInfo.properties?.profile_image ? '' : '(없음)' }}
          </td></tr>
        </table>
      </div>
      <!-- raw response -->
      <div v-if="result.rawResponse" style="margin-top:8px">
        <div style="font-size:11px;color:#888;margin-bottom:4px">Raw Token Response</div>
        <pre style="background:#1e1e1e;color:#d4d4d4;padding:10px;border-radius:6px;font-size:11px;overflow:auto;max-height:160px">{{ result.rawResponse }}</pre>
      </div>
    </div>
  </div>

  <!-- 연동 흐름 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">연동 흐름</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> sy_prop <code>ext.sdk.kakaoJsKey</code> 에 카카오 앱 JS 키 등록<br>
      <b>2.</b> 카카오 개발자 콘솔 → 앱 → 플랫폼 → Web 사이트 도메인 등록 (<code>http://127.0.0.1:5501</code>)<br>
      <b>3.</b> 동의 항목 → profile, account_email 활성화<br>
      <b>4.</b> SDK 초기화 → 로그인 팝업 → 사용자 정보 확인<br>
      <b>5.</b> 실제 로그인은 <code>POST /api/co/fo-auth/social-login</code> (백엔드 토큰 검증) 로 연결
    </div>
  </div>

  <bo-zd-yml-grid />
  <bo-zd-sy-prop-grid prop-key-prefixes="ext.sdk.kakaoJsKey" default-prop-key-filter="ext.sdk.kakao" />
</div>`,
};
