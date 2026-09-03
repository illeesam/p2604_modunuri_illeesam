/* CfRedisMonitor.js — Redis 모니터링(연결 테스트) 화면(요청사항). EcCdnApi 자체는 Redis 를
 * 쓰지 않으므로 host/port/password/database 를 직접 입력해 그때그때 접속 확인한다(예: 같은
 * NAS 의 EcAdminApi Redis 를 이 화면에서 점검할 때도 사용). 인증없이 누구나 조회 가능.
 */
window.CfRedisMonitor = {
  setup() {
    const { reactive, onMounted } = Vue;

    // 1) ref/reactive
    const form = reactive({ host: 'illeesam.synology.me', port: 6379, password: '', database: 0 });
    const uiState = reactive({ testing: false, tested: false });
    const result = reactive({ ping: '', dbSize: 0, redisVersion: '', role: '', connectedClients: '', usedMemoryHuman: '', uptimeInDays: '', osInfo: '', sampleKeys: [] });
    // appRedis — 이 EcCdnApi 앱 자체(app.redis.*)의 인증 캐시 스위치 상태(요청사항: "redis switch
    // 될수 있게 해줘" — 화면에서 현재 스위치 on/off 를 바로 확인 + 그 설정값으로 접속 테스트).
    const appRedis = reactive({ enabled: false, host: '', port: 6379, database: 0, loaded: false });

    // 3) 조회
    const fnLoadAppRedisConfig = async () => {
      try {
        const data = await cfAuth.cfApi('/api/cdn/redis/config-defaults');
        Object.assign(appRedis, data, { loaded: true });
        if (data.enabled && data.host) {
          form.host = data.host;
          form.port = data.port;
          form.database = data.database;
        }
      } catch (e) { cfAuth.showToast(e.message, true); }
    };

    // 4) 이벤트 핸들러(on*)
    const onUseAppConfig = () => {
      form.host = appRedis.host;
      form.port = appRedis.port;
      form.database = appRedis.database;
    };
    const onTest = async () => {
      if (!form.host.trim()) return cfAuth.showToast('host 를 입력하세요.', true);
      uiState.testing = true;
      uiState.tested = false;
      try {
        const body = { host: form.host.trim(), port: form.port, password: form.password || null, database: form.database };
        const data = await cfAuth.cfApi('/api/cdn/redis/test', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        Object.assign(result, data);
        uiState.tested = true;
        cfAuth.showToast('Redis 연결 성공 (PING=' + data.ping + ')');
      } catch (e) {
        cfAuth.showToast(e.message, true);
      } finally {
        uiState.testing = false;
      }
    };

    // 5) onMounted
    const initPage = async () => { await fnLoadAppRedisConfig(); };
    onMounted(initPage);

    return { form, uiState, result, appRedis, onTest, onUseAppConfig };
  },
  template: `
    <div>
      <div class="page-title">🧰 Redis 모니터링 <span style="font-size:12px;color:#999;font-weight:400;">— 접속정보 입력 후 연결 테스트(인증 불필요)</span></div>

      <!-- ① 이 앱의 인증 캐시 스위치 상태 -->
      <div class="card" v-if="appRedis.loaded">
        <div class="search-bar">
          <span class="badge" :class="appRedis.enabled ? 'badge-green' : 'badge-gray'">
            app.redis.enabled = {{ appRedis.enabled ? 'true(켜짐)' : 'false(꺼짐)' }}
          </span>
          <span style="font-size:12px;color:#999;">
            {{ appRedis.enabled ? ('현재 인증 캐시가 ' + appRedis.host + ':' + appRedis.port + ' 로 연결되어 있습니다.') : 'Redis 인증 캐시가 꺼져 있습니다 — cf_token(DB)만으로 로그인/재발급/강제폐기가 정상 동작합니다.' }}
          </span>
          <span style="flex:1"></span>
          <button v-if="appRedis.enabled" class="btn btn_reset btn-sm" @click="onUseAppConfig">이 설정값으로 채우기</button>
        </div>
      </div>

      <!-- ② 접속정보 입력 -->
      <div class="card">
        <div class="form-row">
          <div class="form-group"><span class="form-label">host</span><input class="form-control" v-model="form.host" /></div>
          <div class="form-group"><span class="form-label">port</span><input class="form-control" type="number" v-model.number="form.port" /></div>
          <div class="form-group"><span class="form-label">password(없으면 비움)</span><input class="form-control" type="password" v-model="form.password" /></div>
          <div class="form-group"><span class="form-label">database(숫자, 기본 0)</span><input class="form-control" type="number" v-model.number="form.database" /></div>
        </div>
        <div class="form-actions">
          <button class="btn btn_confirm" :disabled="uiState.testing" @click="onTest">{{ uiState.testing ? '연결 중...' : '연결 테스트' }}</button>
        </div>
      </div>

      <!-- ② 결과 -->
      <div class="card" v-if="uiState.tested">
        <div style="overflow-x:auto;">
          <table class="kv-table">
            <tbody>
              <tr><th>PING</th><td>{{ result.ping }}</td></tr>
              <tr><th>DB Size(키 개수)</th><td>{{ result.dbSize }}</td></tr>
              <tr><th>Redis 버전</th><td>{{ result.redisVersion }}</td></tr>
              <tr><th>역할(role)</th><td>{{ result.role }}</td></tr>
              <tr><th>연결된 클라이언트 수</th><td>{{ result.connectedClients }}</td></tr>
              <tr><th>사용 메모리</th><td>{{ result.usedMemoryHuman }}</td></tr>
              <tr><th>가동일수</th><td>{{ result.uptimeInDays }}</td></tr>
              <tr><th>OS</th><td>{{ result.osInfo }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="list-toolbar" style="margin-top:10px;">
          <span class="list-title">키 샘플(SCAN, 최대 20개)</span>
        </div>
        <div v-if="result.sampleKeys.length === 0" class="empty-hint">키가 없습니다.</div>
        <ul v-else style="margin:0;padding-left:18px;font-size:12px;font-family:Consolas,Monaco,monospace;">
          <li v-for="k in result.sampleKeys" :key="k">{{ k }}</li>
        </ul>
      </div>
    </div>
  `,
};
