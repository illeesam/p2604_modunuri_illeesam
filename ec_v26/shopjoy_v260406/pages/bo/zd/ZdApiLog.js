/**
 * API 요청/응답 로그 조회 (개발도구)
 */
window.ZdApiLog = {
  name: 'ZdApiLog',
  props: ['navigate', 'adminData', 'showToast'],
  setup(props) {
    const { ref, reactive, computed, onMounted, onBeforeUnmount } = Vue;

    const apiLogs = reactive([]);
    const maxLogs = 50;
    const filter = reactive({
      method: '',
      status: '',
      url: '',
    });
    const autoScroll = ref(true);

    const filteredLogs = computed(() => {
      return apiLogs.filter(log => {
        if (filter.method && !log.method.includes(filter.method.toUpperCase())) return false;
        if (filter.status && !String(log.status).includes(filter.status)) return false;
        if (filter.url && !log.url.includes(filter.url)) return false;
        return true;
      });
    });

    const addLog = (method, url, status, duration, hasError = false) => {
      const time = new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      apiLogs.unshift({ method, url, status, duration, time, hasError });
      if (apiLogs.length > maxLogs) apiLogs.pop();
    };

    const clearLogs = () => {
      apiLogs.length = 0;
      props.showToast('로그가 초기화되었습니다.', 'success');
    };

    const getStatusColor = (status) => {
      if (status >= 200 && status < 300) return '#10b981';
      if (status >= 300 && status < 400) return '#3b82f6';
      if (status >= 400 && status < 500) return '#f59e0b';
      if (status >= 500) return '#ef4444';
      return '#6b7280';
    };

    const getStatusBg = (status) => {
      if (status >= 200 && status < 300) return '#ecfdf5';
      if (status >= 300 && status < 400) return '#eff6ff';
      if (status >= 400 && status < 500) return '#fffbeb';
      if (status >= 500) return '#fef2f2';
      return '#f3f4f6';
    };

    onMounted(() => {
      // boAPI 요청 추적
      if (window.boApi && window.boApi.raw) {
        const inst = window.boApi.raw;
        const startTime = {};

        inst.interceptors.request.use((cfg) => {
          startTime[cfg.url + cfg.method] = Date.now();
          return cfg;
        });

        inst.interceptors.response.use(
          (res) => {
            const key = res.config.url + res.config.method;
            const duration = Date.now() - (startTime[key] || 0);
            addLog(res.config.method.toUpperCase(), res.config.url, res.status, duration, false);
            delete startTime[key];
            return res;
          },
          (err) => {
            const cfg = err.config || {};
            const key = cfg.url + cfg.method;
            const duration = Date.now() - (startTime[key] || 0);
            const status = err.response?.status || 0;
            addLog(cfg.method.toUpperCase(), cfg.url, status, duration, true);
            delete startTime[key];
            return Promise.reject(err);
          }
        );
      }

      // foAPI 요청 추적
      if (window.foApi && window.foApi.raw) {
        const inst = window.foApi.raw;
        const startTime = {};

        inst.interceptors.request.use((cfg) => {
          startTime[cfg.url + cfg.method] = Date.now();
          return cfg;
        });

        inst.interceptors.response.use(
          (res) => {
            const key = res.config.url + res.config.method;
            const duration = Date.now() - (startTime[key] || 0);
            addLog(res.config.method.toUpperCase(), res.config.url, res.status, duration, false);
            delete startTime[key];
            return res;
          },
          (err) => {
            const cfg = err.config || {};
            const key = cfg.url + cfg.method;
            const duration = Date.now() - (startTime[key] || 0);
            const status = err.response?.status || 0;
            addLog(cfg.method.toUpperCase(), cfg.url, status, duration, true);
            delete startTime[key];
            return Promise.reject(err);
          }
        );
      }
    });

    return {
      apiLogs, filter, clearLogs, filteredLogs, autoScroll, getStatusColor, getStatusBg
    };
  },
  template: `
<div style="display: flex; flex-direction: column; height: 100%;">
  <!-- 제목 + 필터 -->
  <div style="padding: 12px 16px; border-bottom: 2px solid #e5e7eb;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div style="font-weight: 600; font-size: 13px;">📡 API 요청/응답 로그</div>
      <button @click="clearLogs" style="padding: 4px 8px; font-size: 11px; border: none; background: #ef4444; color: white; cursor: pointer; border-radius: 3px; font-weight: 600;">Clear</button>
    </div>

    <!-- 필터 입력 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 12px;">
      <input v-model="filter.method" placeholder="METHOD (GET/POST)" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 11px;">
      <input v-model="filter.status" placeholder="STATUS (200/500)" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 11px;">
      <input v-model="filter.url" placeholder="URL (:3000/api/...)" style="padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px; font-family: monospace; font-size: 11px;">
    </div>
  </div>

  <!-- 로그 테이블 -->
  <div style="flex: 1; overflow-y: auto; border-bottom: 1px solid #e5e7eb;">
    <div v-if="filteredLogs.length === 0" style="padding: 32px 16px; text-align: center; color: #9ca3af; font-size: 12px;">
      API 로그가 없습니다
    </div>

    <div v-for="(log, idx) in filteredLogs" :key="idx" style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 11px; font-family: monospace; background: white;">
      <div style="display: grid; grid-template-columns: 60px 50px 1fr 60px auto; gap: 8px; align-items: center;">
        <!-- 시간 -->
        <div style="color: #6b7280; white-space: nowrap; font-weight: 500;">{{ log.time }}</div>

        <!-- 메서드 -->
        <div :style="{ color: log.method === 'GET' ? '#3b82f6' : log.method === 'POST' ? '#8b5cf6' : log.method === 'PUT' ? '#f59e0b' : '#ef4444', fontWeight: '600', textAlign: 'center' }">
          {{ log.method }}
        </div>

        <!-- URL -->
        <div :style="{ color: log.hasError ? '#ef4444' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }">
          {{ log.url }}
        </div>

        <!-- 상태 -->
        <div :style="{
          background: getStatusBg(log.status),
          color: getStatusColor(log.status),
          padding: '2px 6px',
          borderRadius: '2px',
          fontWeight: '600',
          textAlign: 'center',
          border: '1px solid ' + getStatusColor(log.status)
        }">
          {{ log.status }}
        </div>

        <!-- 소요시간 -->
        <div :style="{ color: '#6b7280', whiteSpace: 'nowrap', fontSize: '10px' }">
          {{ log.duration }}ms
        </div>
      </div>
    </div>
  </div>

  <!-- 통계 -->
  <div style="padding: 8px 12px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
    총 {{ filteredLogs.length }} / {{ apiLogs.length }} 건
  </div>
</div>
  `
};
