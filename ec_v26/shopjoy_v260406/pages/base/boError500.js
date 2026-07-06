/* BO - 500 Server Error */
window.boError500 = {
  name: 'BoError500',
  props: ['navigate', 'message'],
  computed: {
    cfParsed() {
      if (!this.message) return null;
      const lines = this.message.split('\n');
      const mainLine  = lines[0] || '';
      /* "METHOD URL STATUS" 또는 "[BO API] 필수 헤더 누락... \n\nMethod: ...\nURL: ..." 패턴 파싱 */
      let method = '', url = '', status = '', detail = '';
      /* 첫 줄이 "GET /bo/... 500" 형식인지 확인 */
      const m1 = mainLine.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s*(\d*)(.*)$/i);
      if (m1) {
        method = m1[1].toUpperCase();
        url    = m1[2];
        status = m1[3] || '';
        detail = lines.slice(1).join('\n').trim();
      } else {
        /* 멀티라인 "Method: ...\nURL: ..." 형식 */
        lines.forEach(l => {
          const mM = l.match(/^Method:\s*(.+)$/i);
          const mU = l.match(/^URL:\s*(.+)$/i);
          if (mM) method = mM[1].trim();
          if (mU) url    = mU[1].trim();
        });
        detail = lines.filter(l => !/^(Method:|URL:)/i.test(l)).join('\n').trim();
      }
      return { method, url, status, detail: detail || this.message };
    },
  },
  methods: {
    onReload() { window.location.reload(); },
  },
  template: /* html */`
<div>
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
    <div style="font-size:80px;margin-bottom:16px;">💥</div>
    <div style="font-size:48px;font-weight:800;color:#1a1a2e;letter-spacing:-1px;">500</div>
    <div style="font-size:18px;font-weight:600;color:#555;margin-top:8px;">서버 오류가 발생했습니다</div>
    <div style="font-size:13px;color:#999;margin-top:12px;max-width:520px;">
      잠시 후 다시 시도해 주세요. 문제가 지속되면 시스템 관리자에게 문의 바랍니다.
    </div>

    <!-- 에러 상세 박스 -->
    <div v-if="message" style="margin-top:16px;max-width:760px;width:100%;text-align:left;">
      <!-- Method + URL 강조 행 -->
      <div v-if="cfParsed &amp;&amp; (cfParsed.method || cfParsed.url)"
        style="display:flex;align-items:center;gap:8px;background:#1e1e2e;color:#cdd6f4;padding:10px 14px;border-radius:8px 8px 0 0;font-family:monospace;font-size:13px;flex-wrap:wrap;">
        <span v-if="cfParsed.method"
          style="background:#f38ba8;color:#1e1e2e;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px;">
          {{ cfParsed.method }}
        </span>
        <span style="flex:1;word-break:break-all;color:#89dceb;">{{ cfParsed.url }}</span>
        <span v-if="cfParsed.status"
          style="background:#fab387;color:#1e1e2e;padding:2px 8px;border-radius:4px;font-weight:700;font-size:12px;">
          {{ cfParsed.status }}
        </span>
      </div>
      <!-- 에러 메시지 본문 -->
      <div style="font-size:12px;color:#c62828;background:#fff5f5;padding:10px 14px;border-radius:0 0 8px 8px;border:1px solid #fca5a5;border-top:none;font-family:monospace;white-space:pre-wrap;word-break:break-all;">{{ cfParsed ? cfParsed.detail : message }}</div>
    </div>

    <div style="display:flex;gap:10px;margin-top:28px;">
      <button @click="onReload"
        style="padding:12px 28px;font-size:14px;font-weight:600;background:#6a1b9a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
        새로고침
      </button>
      <button @click="navigate('dashboard')"
        style="padding:12px 28px;font-size:14px;font-weight:600;background:#fff;color:#444;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
        대시보드로
      </button>
    </div>
  </div>
</div>
`,
};
