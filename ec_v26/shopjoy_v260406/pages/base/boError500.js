/* BO - 500 Server Error */
window.boError500 = {
  name: 'BoError500',
  props: ['navigate', 'message', 'errors'],
  data() {
    /* _mountTime — 화면이 뜬 시점을 한 번만 고정. fnRowStyle 이 매번 Date.now() 를 읽으면
       펼치기 클릭 등 재렌더링될 때마다 "최근" 여부가 달라져 강조가 깜빡이므로,
       기준 시각을 여기서 스냅샷 떠서 이후로는 절대 다시 계산하지 않는다. */
    return { showErrorList: false, expandedIds: new Set(), allExpanded: false, _mountTime: Date.now() };
  },
  computed: {
    /* cfErrorList — 최근 4xx/5xx/네트워크 에러 목록 (최신순, 최대 20건은 boAppBase 에서 이미 보장) */
    cfErrorList() {
      return this.errors || [];
    },
    cfErrorColumns() {
      return [
        { key: '_exp', label: '', style: 'width:22px', align: 'center', noEllipsis: true,
          linkToggle: { active: (row) => this.expandedIds.has(row._rid), onClick: (row) => this.toggleRow(row._rid),
            title: '상세보기', activeStyle: 'color:#666;font-size:11px;user-select:none;', baseStyle: 'color:#bbb;font-size:11px;user-select:none;' },
          fmt: (v, row) => this.expandedIds.has(row._rid) ? '▲' : '▼' },
        { key: 'time',   label: '시간',    style: 'width:66px', align: 'center', mono: true, fmt: (v, row) => this.fnFmtTime(row.time) },
        { key: 'status', label: '코드',    style: 'width:50px', align: 'center', badge: (row) => 'badge-orange' },
        { key: 'method', label: 'Method', style: 'width:64px', align: 'center', mono: true },
        { key: 'url',    label: 'URL', mono: true, cellTitle: true },
        { key: 'uiLabel',label: '화면 > 기능', style: 'width:150px', cellTitle: true },
      ];
    },
    cfParsed() {
      if (!this.message) return null;
      const lines = this.message.split('\n');
      const mainLine  = lines[0] || '';
      /* "METHOD URL STATUS  [uiNm > cmdNm]" 또는 멀티라인 형식 파싱 */
      let method = '', url = '', status = '', detail = '', uiNm = '', cmdNm = '';
      /* 첫 줄: "GET /bo/... 500  [uiNm > cmdNm]" */
      const m1 = mainLine.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(\S+)\s*(\d*)\s*(?:\[([^\]>]*)(?:>\s*([^\]]*))?\])?(.*)$/i);
      if (m1) {
        method = m1[1].toUpperCase();
        url    = m1[2];
        status = m1[3] || '';
        uiNm   = (m1[4] || '').trim();
        cmdNm  = (m1[5] || '').trim();
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
      /* 헤더 누락 에러인 경우 detail에서 x-ui-nm / x-cmd-nm 값 추출 시도 */
      if (!uiNm && !cmdNm && detail) {
        /* "[BO API] 필수 헤더 누락: X-UI-Nm, X-Cmd-Nm" → 누락 헤더명을 표시 */
        const mMissing = detail.match(/필수 헤더 누락[:\s]+(.+)/i);
        if (mMissing) {
          uiNm  = '(누락)';
          cmdNm = mMissing[1].trim();
        }
      }
      return { method, url, status, uiNm, cmdNm, detail: detail || this.message };
    },
  },
  methods: {
    onReload() { window.location.reload(); },
    fnFmtTime(t) {
      const d = t instanceof Date ? t : new Date(t);
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    },
    toggleRow(rid) {
      if (this.expandedIds.has(rid)) { this.expandedIds.delete(rid); } else { this.expandedIds.add(rid); }
    },
    isRowExpanded(row) { return this.expandedIds.has(row._rid); },
    toggleExpandAll() {
      if (this.allExpanded) { this.expandedIds.clear(); this.allExpanded = false; }
      else { this.cfErrorList.forEach((row) => this.expandedIds.add(row._rid)); this.allExpanded = true; }
    },
    /* fnRowStyle — 화면 로드 시점(_mountTime) 기준 10초 이내 발생한 오류만 bold 로 강조.
       Date.now() 를 직접 쓰면 펼치기 클릭 등으로 재렌더링될 때마다 기준 시각이 흘러가
       강조 여부가 바뀌므로, 반드시 마운트 시점에 고정된 _mountTime 과 비교한다. */
    fnRowStyle(row) {
      const t = row.time instanceof Date ? row.time : new Date(row.time);
      return (this._mountTime - t.getTime() <= 10000) ? 'font-weight:700;' : '';
    },
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
      <!-- x-ui-nm / x-cmd-nm 헤더 정보 행 -->
      <div v-if="cfParsed &amp;&amp; (cfParsed.uiNm || cfParsed.cmdNm)"
        style="display:flex;align-items:center;gap:6px;background:#2a2a3e;padding:6px 14px;border-top:1px solid #444466;font-family:monospace;font-size:11px;flex-wrap:wrap;">
        <span style="color:#94a3b8;font-size:10px;">x-ui-nm:</span>
        <span style="color:#e879f9;font-weight:700;">{{ cfParsed.uiNm || '-' }}</span>
        <span style="color:#64748b;margin:0 6px;">|</span>
        <span style="color:#94a3b8;font-size:10px;">x-cmd-nm:</span>
        <span style="color:#38bdf8;font-weight:700;">{{ cfParsed.cmdNm || '-' }}</span>
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

    <!-- 최근 4xx/5xx/네트워크 오류 목록 — 2건 이상일 때만(백엔드 다운 등으로 동시 실패) 접힌 상태로 노출 -->
    <div v-if="cfErrorList.length > 1" style="margin-top:20px;max-width:900px;width:100%;text-align:left;">
      <div style="display:flex;align-items:center;gap:10px;">
        <button @click="showErrorList = !showErrorList"
          style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:12px;color:#888;padding:4px 0;">
          <span>{{ showErrorList ? '▲' : '▼' }}</span>
          <span>최근 서버 오류 {{ cfErrorList.length }}건 {{ showErrorList ? '접기' : '보기' }}</span>
        </button>
        <button v-if="showErrorList" class="btn btn-secondary btn-xs" @click="toggleExpandAll">
          {{ allExpanded ? '전체닫기' : '전체펼치기' }}
        </button>
      </div>
      <bo-grid v-if="showErrorList" bare
        :columns="cfErrorColumns" :rows="cfErrorList" row-key="_rid"
        :row-style="fnRowStyle" :is-expanded="isRowExpanded">
        <template #row-expand="{ row, colspan }">
          <td :colspan="colspan" style="background:#fff5f5;padding:8px 14px;font-family:monospace;font-size:11px;color:#c62828;white-space:pre-wrap;word-break:break-all;">
            {{ row.message || '(메시지 없음)' }}
          </td>
        </template>
      </bo-grid>
    </div>
  </div>
</div>
`,
};
