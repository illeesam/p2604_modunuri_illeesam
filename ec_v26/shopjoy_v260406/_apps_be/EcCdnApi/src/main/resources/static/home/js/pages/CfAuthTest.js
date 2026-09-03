/* CfAuthTest.js — 인증(로그인/재발급/강제폐기) 테스트 화면. shell(index.html)의 main 프레임에
 * <cf-auth-test> 로 임베드된다.
 *
 * 요청사항 반영:
 *  - id/pwd 로 토큰요청, 만료시 재발급 — 하단에 요청/응답 원문을 textarea 로 누적 기록
 *  - "대상 URL" + "연동호출 시뮬레이션" 체크박스 — 체크하면 EcAdminApi(CfCdnApiClient)가 실제로
 *    하는 것과 같은 패턴(주기적으로 accessToken 재발급)을 반복한다. X-Caller-System 헤더로
 *    "어느 시스템이 호출했는지"도 같이 보낸다(마이크로서비스 환경 대비, cf_token/cf_token_hist 기록).
 *  - 토큰발급 정보 테이블(cf_token, refreshToken 포함) — 강제 폐기 버튼 포함
 *  - 토큰발급 이력 테이블(cf_token_hist) — 사유/계정정보 스냅샷 표시
 */
window.CfAuthTest = {
  setup() {
    const { reactive, onMounted, onBeforeUnmount } = Vue;

    // 1) ref/reactive
    const form = reactive({ id: 'admin', pwd: '', callerSystem: 'AuthTestPage', targetUrl: '' });
    const uiState = reactive({ hasToken: false, simulate: false, reqLog: '', resLog: '' });
    const tokenState = reactive({ list: [], total: 0 });
    const histState = reactive({ list: [], total: 0 });
    let simulateTimer = null;
    let lastAccessToken = null;

    // 2) fn* 순수 유틸
    const fnFmtDate = (s) => (s ? String(s).replace('T', ' ').slice(0, 19) : '-');
    const fnActionBadge = (cd) => (cd === 'NEW' ? 'badge-green' : cd === 'REFRESH' ? 'badge-blue' : 'badge-gray');
    const fnBaseUrl = () => (form.targetUrl && form.targetUrl.trim() ? form.targetUrl.trim().replace(/\/$/, '') : '');
    const fnNowTag = () => new Date().toLocaleTimeString('ko-KR', { hour12: false });

    // bo-grid 컬럼 정의(요청사항 — <bo-grid 적극적용) — tokenId 컬럼만 강제폐기 버튼이 필요해 slot:true.
    const tokenGridColumns = [
      { key: 'tokenId', label: 'tokenId(강제폐기)', slot: true, width: '170px' },
      { key: 'clientId', label: 'clientId' },
      { key: 'reason', label: '사유' },
      { key: 'requesterSystemNm', label: '시스템' },
      { key: 'issuedIp', label: 'IP' },
      { key: 'accessTokenExp', label: 'accessToken 만료', fmt: (r) => fnFmtDate(r.accessTokenExp) + ' (' + r.accessTokenTtlSec + '초)' },
      { key: 'refreshTokenExp', label: 'refreshToken 만료', fmt: (r) => fnFmtDate(r.refreshTokenExp) + ' (' + r.refreshTokenTtlSec + '초)' },
      { key: 'regBy', label: '등록자/등록일', fmt: (r) => (r.regBy || '-') + ' / ' + fnFmtDate(r.regDate) },
      { key: 'updBy', label: '수정자/수정일', fmt: (r) => (r.updBy || '-') + ' / ' + fnFmtDate(r.updDate) },
    ];
    const histGridColumns = [
      { key: 'histId', label: 'histId' },
      { key: 'clientId', label: 'clientId' },
      { key: 'actionCd', label: '구분', badge: (r) => fnActionBadge(r.actionCd) },
      { key: 'resultCd', label: '결과', badge: (r) => (r.resultCd === 'FAIL' ? 'badge-red' : 'badge-green') },
      { key: 'resultMsg', label: '결과내용', fmt: (r) => r.resultMsg || '-' },
      { key: 'reason', label: '사유', fmt: (r) => r.reason || '-' },
      { key: 'clientNm', label: '계정정보(NEW 스냅샷)', fmt: (r) => r.clientNm || '-' },
      { key: 'refreshToken', label: 'refreshToken', fmt: (r) => (r.refreshToken ? r.refreshToken.slice(0, 16) + '...' : '-') },
      { key: 'accessTokenExp', label: 'accessToken 만료', fmt: (r) => fnFmtDate(r.accessTokenExp) },
      { key: 'refreshTokenExp', label: 'refreshToken 만료', fmt: (r) => fnFmtDate(r.refreshTokenExp) },
      { key: 'requesterSystemNm', label: '시스템' },
      { key: 'issuedIp', label: 'IP' },
      { key: 'regDate', label: '발생일시', fmt: (r) => fnFmtDate(r.regDate) },
    ];

    function fnAppendLog(label, reqObj, resObj) {
      const ts = fnNowTag();
      uiState.reqLog += `[${ts}] ${label}\n${JSON.stringify(reqObj, null, 2)}\n\n`;
      uiState.resLog += `[${ts}] ${label}\n${JSON.stringify(resObj, null, 2)}\n\n`;
    }

    // 3) 조회(토큰목록/이력)
    const fnLoadTokenList = async () => {
      try {
        const data = await cfAuth.cfApi('/api/cdn/auth/token/page?pageNo=1&pageSize=20');
        tokenState.list = data.pageList;
        tokenState.total = data.pageTotalCount;
      } catch (e) { cfAuth.showToast(e.message, true); }
    };
    const fnLoadHistList = async () => {
      try {
        const data = await cfAuth.cfApi('/api/cdn/auth/token-hist/page?pageNo=1&pageSize=20');
        histState.list = data.pageList;
        histState.total = data.pageTotalCount;
      } catch (e) { cfAuth.showToast(e.message, true); }
    };
    const fnRefreshTables = () => Promise.all([fnLoadTokenList(), fnLoadHistList()]);

    // 4) 이벤트 핸들러(on*)
    const onLogin = async () => {
      if (!form.id.trim() || !form.pwd) return cfAuth.showToast('아이디/비밀번호를 입력하세요.', true);
      const url = fnBaseUrl() + '/api/auth/login';
      const reqBody = { id: form.id.trim(), pwd: form.pwd };
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Caller-System': form.callerSystem || 'AuthTestPage' },
          body: JSON.stringify(reqBody),
        });
        const body = await res.json().catch(() => ({}));
        fnAppendLog('POST ' + url, { headers: { 'X-Caller-System': form.callerSystem }, body: reqBody }, body);
        if (!res.ok || body.ok === false) throw new Error(body.message || ('HTTP ' + res.status));
        lastAccessToken = body.data.accessToken;
        uiState.hasToken = true;
        cfAuth.showToast('토큰 발급 성공(expiresIn=' + body.data.expiresIn + '초)');
        await fnRefreshTables();
        if (uiState.simulate) fnStartSimulate();
      } catch (e) {
        cfAuth.showToast(e.message, true);
        await fnLoadHistList(); // 실패도 cf_token_hist 에 FAIL 로 남으므로(요청사항) 이력표 갱신
      }
    };

    const onRefresh = async () => {
      if (!lastAccessToken) return cfAuth.showToast('먼저 토큰을 요청(로그인)하세요.', true);
      const url = fnBaseUrl() + '/api/auth/refresh';
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + lastAccessToken, 'X-Caller-System': form.callerSystem || 'AuthTestPage' },
        });
        const body = await res.json().catch(() => ({}));
        fnAppendLog('POST ' + url + ' (재발급)',
          { headers: { Authorization: 'Bearer ' + lastAccessToken.slice(0, 16) + '...', 'X-Caller-System': form.callerSystem } }, body);
        if (!res.ok || body.ok === false) throw new Error(body.message || ('HTTP ' + res.status));
        lastAccessToken = body.data.accessToken;
        cfAuth.showToast('재발급 성공');
        await fnRefreshTables();
      } catch (e) {
        cfAuth.showToast(e.message, true);
        uiState.hasToken = false;
        fnStopSimulate();
        await fnLoadHistList(); // 실패도 cf_token_hist 에 FAIL 로 남으므로(요청사항) 이력표 갱신
      }
    };

    const onRevoke = async (tokenId) => {
      if (!confirm('이 토큰을 강제 폐기하시겠습니까? (해당 refreshToken 으로는 더 이상 재발급이 안 됩니다)')) return;
      try {
        await cfAuth.cfApi('/api/cdn/auth/token/' + encodeURIComponent(tokenId) + '?reason=' + encodeURIComponent('관리자 강제 폐기(테스트 화면)'), { method: 'DELETE' });
        cfAuth.showToast('폐기되었습니다.');
        await fnRefreshTables();
      } catch (e) {
        cfAuth.showToast(e.message, true);
      }
    };

    const onClearLog = () => { uiState.reqLog = ''; uiState.resLog = ''; };

    const onToggleSimulate = () => {
      if (uiState.simulate && lastAccessToken) fnStartSimulate();
      else fnStopSimulate();
    };

    function fnStartSimulate() {
      fnStopSimulate();
      // 요청사항: 연동호출이면 EcAdminApi 처럼 "루틴으로" 호출 — accessToken(30초)보다 여유 있게 20초마다.
      simulateTimer = setInterval(onRefresh, 20000);
    }
    function fnStopSimulate() {
      if (simulateTimer) { clearInterval(simulateTimer); simulateTimer = null; }
    }

    // 5) onMounted / onBeforeUnmount — initPage 로 진입 시퀀스를 한 곳에 모은다(SyContactDtl.js 패턴).
    const initPage = async () => {
      await fnRefreshTables();
    };
    onMounted(initPage);
    onBeforeUnmount(fnStopSimulate);

    return {
      form, uiState, tokenState, histState,
      tokenGridColumns, histGridColumns,
      fnFmtDate, fnActionBadge,
      onLogin, onRefresh, onRevoke, onClearLog, onToggleSimulate,
    };
  },
  template: `
    <div>
      <div class="page-title">🔐 인증 테스트 <span style="font-size:12px;color:#999;font-weight:400;">— 로그인/재발급/강제폐기</span></div>

      <!-- ① 요청 폼 -->
      <div class="card">
        <div class="form-row">
          <div class="form-group"><span class="form-label">아이디</span><input class="form-control" v-model="form.id" /></div>
          <div class="form-group"><span class="form-label">비밀번호</span><input class="form-control" type="password" v-model="form.pwd" /></div>
          <div class="form-group"><span class="form-label">시스템 이름 (X-Caller-System)</span><input class="form-control" v-model="form.callerSystem" placeholder="예: EcAdminApi" /></div>
          <div class="form-group span-3">
            <span class="form-label">대상 URL(비우면 이 화면과 같은 서버)</span>
            <input class="form-control" v-model="form.targetUrl" placeholder="예: http://illeesam.synology.me:21090 (EcAdminApi 서버가 여러 대면 각각 넣어서 테스트 가능)" />
          </div>
        </div>
        <div class="search-bar">
          <label style="display:flex;align-items:center;gap:4px;font-size:12px;">
            <input type="checkbox" v-model="uiState.simulate" @change="onToggleSimulate" />
            연동호출 시뮬레이션(체크 시 EcAdminApi 방식 — accessToken 발급 직후부터 20초마다 자동 재발급 반복)
          </label>
          <span style="flex:1"></span>
          <button class="btn btn_confirm" @click="onLogin">토큰 요청(로그인)</button>
          <button class="btn btn_select" :disabled="!uiState.hasToken" @click="onRefresh">수동 재발급</button>
          <button class="btn btn_reset" @click="onClearLog">로그 지우기</button>
        </div>
        <div v-if="uiState.simulate" style="font-size:12px;color:#1a73e8;margin-top:6px;">
          ▶ 연동호출 시뮬레이션 진행 중 — accessToken 이 발급돼 있으면 20초마다 자동으로 재발급 요청을 보냅니다.
        </div>
      </div>

      <!-- ② 발급된 토큰 목록(cf_token) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-title">🎫 발급된 토큰 목록(cf_token)</span>
          <span class="list-count">전체 {{ tokenState.total }}건</span>
        </div>
        <bo-grid :columns="tokenGridColumns" :rows="tokenState.list" row-key="tokenId" empty-text="발급된 토큰이 없습니다.">
          <template #cell-tokenId="{ row }">
            <button class="btn btn_delete btn-xs" @click="onRevoke(row.tokenId)">강제폐기</button>
            &nbsp;{{ row.tokenId }}
          </template>
        </bo-grid>
      </div>

      <!-- ③ 토큰 발급 이력(cf_token_hist) -->
      <div class="card">
        <div class="list-toolbar">
          <span class="list-title">📜 토큰 발급 이력(cf_token_hist)</span>
          <span class="list-count">전체 {{ histState.total }}건</span>
        </div>
        <bo-grid :columns="histGridColumns" :rows="histState.list" row-key="histId" empty-text="이력이 없습니다." />
      </div>

      <!-- ④ 요청/응답 로그(하단, 요청사항) -->
      <div class="card">
        <div class="form-row">
          <div class="form-group span-3">
            <span class="form-label">요청 데이터</span>
            <textarea class="form-control" rows="10" readonly :value="uiState.reqLog" style="font-family:monospace;font-size:12px;white-space:pre;"></textarea>
          </div>
          <div class="form-group span-3">
            <span class="form-label">응답 데이터</span>
            <textarea class="form-control" rows="10" readonly :value="uiState.resLog" style="font-family:monospace;font-size:12px;white-space:pre;"></textarea>
          </div>
        </div>
      </div>
    </div>
  `,
};
