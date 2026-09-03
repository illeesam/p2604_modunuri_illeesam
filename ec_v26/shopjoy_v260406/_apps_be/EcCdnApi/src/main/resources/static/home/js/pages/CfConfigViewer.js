/* CfConfigViewer.js — application.yml 설정정보 조회 화면(요청사항). 인증없이 누구나 조회
 * 가능(/api/cdn/** permitAll). 서버가 화이트리스트로 골라 내려준 항목만 표시하며, 시크릿
 * (JWT/DB 비밀번호)은 서버측에서 이미 REDACTED 로 마스킹된 채로 온다(CfConfigController 참조).
 */
window.CfConfigViewer = {
  setup() {
    const { reactive, onMounted } = Vue;

    // 1) ref/reactive
    const uiState = reactive({ loading: false });
    const configMap = reactive({ entries: [] });

    // 2) fn* 순수 유틸
    const fnIsRedacted = (v) => typeof v === 'string' && v.includes('REDACTED');

    // 3) 조회
    const fnLoad = async () => {
      uiState.loading = true;
      try {
        const data = await cfAuth.cfApi('/api/cdn/config/info');
        configMap.entries = Object.entries(data);
      } catch (e) {
        cfAuth.showToast(e.message, true);
      } finally {
        uiState.loading = false;
      }
    };

    // 4) 이벤트 핸들러(on*)
    const onRefresh = () => fnLoad();

    // 5) onMounted
    const initPage = async () => { await fnLoad(); };
    onMounted(initPage);

    return { uiState, configMap, fnIsRedacted, onRefresh };
  },
  template: `
    <div>
      <div class="page-title">⚙️ 설정정보 <span style="font-size:12px;color:#999;font-weight:400;">— application.yml 주요 값(인증 불필요, 시크릿은 마스킹)</span></div>

      <div class="card">
        <div class="search-bar">
          <span style="flex:1;font-size:12px;color:#999;">서버가 화이트리스트로 골라 내려주는 항목만 표시합니다 — JWT 시크릿/DB 비밀번호는 절대 노출되지 않습니다.</span>
          <button class="btn btn_search" :disabled="uiState.loading" @click="onRefresh">{{ uiState.loading ? '조회 중...' : '새로고침' }}</button>
        </div>
      </div>

      <div class="card">
        <table class="kv-table">
          <tbody>
            <tr v-for="[k, v] in configMap.entries" :key="k">
              <th>{{ k }}</th>
              <td :class="fnIsRedacted(v) ? 'redacted' : ''">{{ v == null ? '-' : v }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};
