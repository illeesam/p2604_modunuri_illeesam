/**
 * 개발도구 — 카카오톡 공유 테스트
 */
window.ZdTestShareKakao = {
  name: 'ZdTestShareKakao',
  props: {
    navigate:  { type: Function, required: true }, // 페이지 이동
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  setup(props) {

    /* ##### [01] 초기 변수 정의 #################################################### */

    const { reactive, onMounted } = Vue;
    const showToast = props.showToast || window.boApp?.showToast || (() => {});

    const cfg = reactive({
      kakaoJsKey: '',
    });

    const form = reactive({
      shareType:   'feed',   // feed | text | scrap
      title:       '테스트 공유',
      description: 'ShopJoy 개발도구에서 카카오톡 공유 테스트 중입니다.',
      imageUrl:    '',
      linkUrl:     window.location.origin,
      buttonTitle: '자세히 보기',
      text:        '카카오톡 공유 테스트 메시지입니다.',
      scrapUrl:    window.location.origin,
    });

    const result = reactive({
      sdkStatus:  '',
      sdkUrl:     '',
      initDetail: '',
      initStatus: '',
      shareResult: null,
      error:      '',
    });

    const uiState = reactive({ sdkLoaded: false, sdkInited: false, loading: false });

    /* ##### [02] 초기 로드 #################################################### */

    onMounted(async () => {
      try {
        const res = await boApiSvc.syProp?.getList?.({
          propKeys: 'app.ext-sdk.kakao-js-key',
        }, '카카오톡 공유 테스트', '키 조회');
        const list = res?.data?.data || [];
        const pickVal = (key) => {
          const rows = list.filter(p => p.propKey === key && p.propValue);
          const pref = rows.find(p => /local|dev/.test(p.propProfile || '')) || rows[0];
          return pref?.propValue || '';
        };
        cfg.kakaoJsKey = pickVal('app.ext-sdk.kakao-js-key');
      } catch (e) {
        result.error = 'sy_prop 조회 실패: ' + (e.message || e);
      }
      checkSdk();
    });

    /* ##### [03] 헬퍼 함수 #################################################### */

    const checkSdk = () => {
      const ok = !!(window.Kakao);
      uiState.sdkLoaded = ok;
      result.sdkUrl     = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      result.sdkStatus  = ok ? '✅ Kakao SDK 로드됨' : '❌ Kakao SDK 없음';
      if (ok) {
        const inited = window.Kakao.isInitialized?.() || false;
        uiState.sdkInited   = inited;
        result.initStatus   = inited ? '✅ 초기화 완료' : '⚠️ 초기화 전 — [SDK 초기화] 클릭';
      }
    };

    const initSdk = () => {
      if (!cfg.kakaoJsKey) { showToast('Kakao JS Key 를 입력하세요.', 'error'); return; }
      if (!window.Kakao)   { showToast('Kakao SDK 가 로드되지 않았습니다. bo.html 에 SDK 로드 확인.', 'error', 0); return; }
      try {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(cfg.kakaoJsKey);
        }
        uiState.sdkInited = window.Kakao.isInitialized();
        result.initStatus = uiState.sdkInited ? '✅ 초기화 완료' : '❌ 초기화 실패';
        result.initDetail = uiState.sdkInited ? ('앱키: ' + cfg.kakaoJsKey) : '';
        showToast(uiState.sdkInited ? 'Kakao SDK 초기화 완료' : 'Kakao SDK 초기화 실패', uiState.sdkInited ? 'success' : 'error');
      } catch (e) {
        result.initDetail = '❌ ' + (e.message || e);
        result.initStatus = '❌ 초기화 오류: ' + (e.message || e);
        showToast('초기화 오류: ' + (e.message || e), 'error', 0);
      }
    };

    const share = () => {
      if (!uiState.sdkInited) { showToast('먼저 SDK 를 초기화하세요.', 'error'); return; }
      result.error       = '';
      result.shareResult = null;
      uiState.loading    = true;
      try {
        if (form.shareType === 'feed') {
          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title:       form.title,
              description: form.description,
              imageUrl:    form.imageUrl || 'https://mud-kage.kakao.com/dn/Q2iNx/btqgeRgV54P/VLyP4yhuJgH1BqFdBZvgO1/kakaolink40_original.png',
              link: {
                mobileWebUrl: form.linkUrl,
                webUrl:       form.linkUrl,
              },
            },
            buttons: [
              {
                title: form.buttonTitle,
                link: {
                  mobileWebUrl: form.linkUrl,
                  webUrl:       form.linkUrl,
                },
              },
            ],
          });
          result.shareResult = { type: 'feed', status: '공유창 열림' };
          showToast('카카오톡 피드 공유창 열림', 'success');
        } else if (form.shareType === 'text') {
          window.Kakao.Share.sendDefault({
            objectType: 'text',
            text:  form.text,
            link: {
              mobileWebUrl: form.linkUrl,
              webUrl:       form.linkUrl,
            },
          });
          result.shareResult = { type: 'text', status: '공유창 열림' };
          showToast('카카오톡 텍스트 공유창 열림', 'success');
        } else if (form.shareType === 'scrap') {
          if (!form.scrapUrl) { showToast('스크랩할 URL 을 입력하세요.', 'error'); uiState.loading = false; return; }
          window.Kakao.Share.sendScrap({
            requestUrl: form.scrapUrl,
          });
          result.shareResult = { type: 'scrap', status: '스크랩 공유창 열림' };
          showToast('카카오톡 스크랩 공유창 열림', 'success');
        }
      } catch (e) {
        result.error = e.message || String(e);
        showToast('공유 오류: ' + result.error, 'error', 0);
      }
      uiState.loading = false;
    };

    const saveKey = async () => {
      if (!cfg.kakaoJsKey) { showToast('Kakao JS Key 를 입력하세요.', 'error'); return; }
      try {
        await boApi.put('/bo/sy/prop/bulk', [
          { propKey: 'app.ext-sdk.kakao-js-key', propValue: cfg.kakaoJsKey },
        ], coUtil.cofApiHdr('카카오톡 공유 테스트', '키 저장'));
        showToast('sy_prop 에 저장되었습니다.', 'success');
      } catch (e) {
        showToast(e.response?.data?.message || e.message || '저장 실패', 'error', 0);
      }
    };

    /* ##### [04] 액션 dispatch #################################################### */

    const handleBtnAction = (cmd) => {
      if (cmd === 'sdk-init') return initSdk();
      if (cmd === 'share')    return share();
      if (cmd === 'key-save') return saveKey();
    };

    return { cfg, form, result, uiState, handleBtnAction };
  },

  template: `
<div>
  <div class="page-title">카카오톡 공유 테스트</div>

  <!-- 키 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">API 키 설정</span></div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Kakao JS Key (JavaScript 키)</label>
          <input class="form-control" v-model="cfg.kakaoJsKey" placeholder="sy_prop: app.ext-sdk.kakao-js-key" style="font-family:monospace" />
        </div>
        <div style="display:flex;align-items:flex-end;padding-bottom:1px;gap:6px">
          <button class="btn btn_save" @click="handleBtnAction('key-save')">sy_prop 저장</button>
          <button class="btn btn_apply" @click="handleBtnAction('sdk-init')">SDK 초기화</button>
        </div>
      </div>
      <div style="font-size:12px;color:#666;padding:6px 8px;background:#f8f9fa;border-radius:4px;line-height:2">
        <div>SDK 상태: <strong>{{ result.sdkStatus || '확인 중…' }}</strong><span v-if="result.sdkUrl" style="margin-left:8px;color:#aaa;font-family:monospace;font-size:11px;">{{ result.sdkUrl }}</span></div>
        <div>초기화 상태: <strong>{{ result.initDetail || result.initStatus || (uiState.sdkInited ? '초기화 완료' : '미초기화') }}</strong></div>
      </div>
    </div>
  </div>

  <!-- 공유 설정 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar">
      <span class="list-title">공유 테스트</span>
      <div style="margin-left:auto">
        <button class="btn btn_send" :disabled="uiState.loading || !uiState.sdkInited" @click="handleBtnAction('share')">
          {{ uiState.loading ? '⏳' : '💬 카카오톡 공유창 열기' }}
        </button>
      </div>
    </div>
    <div style="padding:12px">
      <div class="form-row" style="gap:8px;margin-bottom:8px">
        <div class="form-group" style="flex:0 0 160px">
          <label class="form-label">공유 유형</label>
          <select class="form-control" v-model="form.shareType">
            <option value="feed">피드 (Feed)</option>
            <option value="text">텍스트 (Text)</option>
            <option value="scrap">스크랩 (Scrap)</option>
          </select>
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">링크 URL</label>
          <input class="form-control" v-model="form.linkUrl" placeholder="https://..." style="font-family:monospace;font-size:12px" />
        </div>
      </div>

      <!-- 피드 유형 -->
      <div v-if="form.shareType === 'feed'">
        <div class="form-row" style="gap:8px;margin-bottom:8px">
          <div class="form-group" style="flex:1">
            <label class="form-label">제목</label>
            <input class="form-control" v-model="form.title" placeholder="공유 제목" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">버튼 텍스트</label>
            <input class="form-control" v-model="form.buttonTitle" placeholder="자세히 보기" />
          </div>
        </div>
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">설명</label>
          <input class="form-control" v-model="form.description" placeholder="공유 내용 설명" />
        </div>
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">이미지 URL (비워두면 기본 이미지 사용)</label>
          <input class="form-control" v-model="form.imageUrl" placeholder="https://..." style="font-family:monospace;font-size:12px" />
        </div>
      </div>

      <!-- 텍스트 유형 -->
      <div v-if="form.shareType === 'text'">
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">공유 텍스트</label>
          <textarea class="form-control" v-model="form.text" rows="3" placeholder="공유할 텍스트 내용" style="resize:vertical"></textarea>
        </div>
      </div>

      <!-- 스크랩 유형 -->
      <div v-if="form.shareType === 'scrap'">
        <div class="form-group" style="margin-bottom:8px">
          <label class="form-label">스크랩 URL <span style="color:#e74c3c">*</span></label>
          <input class="form-control" v-model="form.scrapUrl" placeholder="https://스크랩할-페이지-URL" style="font-family:monospace;font-size:12px" />
        </div>
        <div style="padding:8px;background:#fff8e1;border-radius:4px;font-size:12px;color:#92400e">
          ⚠️ 스크랩은 해당 URL 의 Open Graph 메타 태그를 읽어 공유합니다. 카카오 개발자 콘솔에 도메인 등록 필요.
        </div>
      </div>

      <div v-if="result.error" style="padding:8px;background:#fff5f5;border:1px solid #fca5a5;border-radius:4px;font-size:12px;color:#b91c1c;margin-top:8px">{{ result.error }}</div>
      <div v-if="result.shareResult" style="padding:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;font-size:12px;margin-top:8px">
        ✅ {{ result.shareResult.status }}
      </div>
    </div>
  </div>

  <!-- 안내 -->
  <div class="card" style="margin-bottom:12px">
    <div class="toolbar"><span class="list-title">설정 안내</span></div>
    <div style="padding:12px;font-size:12px;line-height:1.8;color:#444">
      <b>1.</b> <a href="https://developers.kakao.com/console/app" target="_blank">Kakao Developers</a> → 앱 → 플랫폼 → Web → 도메인 등록<br>
      <b>2.</b> 등록 도메인: <code>http://127.0.0.1:5501</code> (개발) / 운영 도메인<br>
      <b>3.</b> sy_prop <code>app.ext-sdk.kakao-js-key</code> 에 JavaScript 키 등록 (소셜 로그인과 동일 키)<br>
      <b>4.</b> [SDK 초기화] → 공유 유형 선택 → [카카오톡 공유창 열기]<br><br>
      <b>공유 유형 설명:</b><br>
      &nbsp;&nbsp;• <b>피드</b>: 이미지 + 제목 + 설명 + 링크 버튼이 포함된 카드형 메시지<br>
      &nbsp;&nbsp;• <b>텍스트</b>: 텍스트 + 링크 버튼만 포함된 단순 메시지<br>
      &nbsp;&nbsp;• <b>스크랩</b>: 외부 URL 의 Open Graph 메타데이터를 읽어 자동 생성<br><br>
      <b>SDK:</b> bo.html 에 Kakao SDK 2.x 가 이미 로드됩니다.<br>
      <code>Kakao.Share.sendDefault()</code> — Kakao SDK 2.x 공유 API (v1의 Kakao.Link 폐기)
    </div>
  </div>

  <bo-zd-sy-prop-grid prop-key-prefixes="app.ext-sdk.kakao" default-prop-key-filter="app.ext-sdk.kakao-js-key" />
</div>`,
};
