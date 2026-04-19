/* ShopJoy Admin - 배치 실행이력 */
window.SyBatchHist = {
  name: 'SyBatchHist',
  props: ['adminData'],
  setup(props) {
    const { ref, reactive, computed } = Vue;

    const searchBatchId = ref('');
    const searchStatus  = ref('');
    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];

    const batchOptions = computed(() =>
      props.adminData.batches.map(b => ({ batchId: b.batchId, label: b.batchNm }))
    );

    const filtered = computed(() => {
      const logs = [...(props.adminData.batchLogs || [])];
      logs.sort((a, b) => (b.runAt > a.runAt ? 1 : -1));
      return logs.filter(l => {
        if (searchBatchId.value && l.batchId !== Number(searchBatchId.value)) return false;
        if (searchStatus.value && l.runStatus !== searchStatus.value) return false;
        return true;
      });
    });

    const total      = computed(() => filtered.value.length);
    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pager.size)));
    const pageList   = computed(() => filtered.value.slice((pager.page - 1) * pager.size, pager.page * pager.size));
    const pageNums   = computed(() => {
      const c = pager.page, l = totalPages.value;
      const s = Math.max(1, c - 2), e = Math.min(l, s + 4);
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    });
    const setPage      = n => { if (n >= 1 && n <= totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const onFilter     = () => { pager.page = 1; };

    /* ── 메시지 상세 토글 ── */
    const expandedId = ref(null);
    const toggleExpand = (logId) => {
      expandedId.value = expandedId.value === logId ? null : logId;
    };

    const runBadge = s => ({ '성공': 'badge-green', '실패': 'badge-red', '실행중': 'badge-blue', '대기': 'badge-gray' }[s] || 'badge-gray');

    const fmtDuration = (sec) => {
      if (!sec && sec !== 0) return '-';
      if (sec < 60) return `${sec}초`;
      return `${Math.floor(sec / 60)}분 ${sec % 60}초`;
    };

    return {
      searchBatchId, searchStatus, batchOptions,
      filtered, total, totalPages, pageList, pageNums, pager, PAGE_SIZES,
      setPage, onSizeChange, onFilter,
      expandedId, toggleExpand,
      runBadge, fmtDuration,
    };
  },
  template: /* html */`
<div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:0 0 10px;border-bottom:2px solid #f0f0f0;margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:#555;">
      <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
      배치 실행이력
      <span class="list-count" style="margin-left:4px;">{{ total }}건</span>
    </div>
    <div style="display:flex;gap:6px;align-items:center;">
      <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:160px;" v-model="searchBatchId" @change="onFilter">
        <option value="">배치 전체</option>
        <option v-for="b in batchOptions" :key="b.batchId" :value="b.batchId">{{ b.label }}</option>
      </select>
      <select class="form-control" style="height:30px;font-size:12px;padding:2px 6px;width:90px;" v-model="searchStatus" @change="onFilter">
        <option value="">상태 전체</option>
        <option>성공</option><option>실패</option><option>실행중</option><option>대기</option>
      </select>
    </div>
  </div>

  <table class="admin-table" style="font-size:12px;">
    <thead>
      <tr>
        <th style="width:46px;">로그ID</th>
        <th style="min-width:120px;">배치명</th>
        <th style="min-width:150px;">배치코드</th>
        <th style="width:128px;">실행일시</th>
        <th style="width:66px;text-align:center;">소요시간</th>
        <th style="width:66px;text-align:center;">결과</th>
        <th>메시지</th>
        <th style="width:32px;"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="pageList.length===0">
        <td colspan="8" style="text-align:center;color:#aaa;padding:24px;">실행이력이 없습니다.</td>
      </tr>

      <template v-for="log in pageList" :key="log.logId">
        <!-- 데이터 행 -->
        <tr :style="log.runStatus==='실패' ? 'background:#fff5f5;' : log.runStatus==='실행중' ? 'background:#f0f8ff;' : ''">
          <td style="color:#aaa;">{{ log.logId }}</td>
          <td style="font-weight:500;">{{ log.batchNm }}</td>
          <td><code style="font-size:11px;background:#f5f5f5;padding:1px 5px;border-radius:3px;">{{ log.batchCode }}</code></td>
          <td style="color:#555;font-family:monospace;font-size:11px;">{{ log.runAt }}</td>
          <td style="text-align:center;color:#666;">{{ fmtDuration(log.duration) }}</td>
          <td style="text-align:center;"><span class="badge badge-xs" :class="runBadge(log.runStatus)">{{ log.runStatus }}</span></td>
          <td style="font-size:11px;max-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            :style="log.runStatus==='실패' ? 'color:#dc2626;' : 'color:#555;'">
            {{ log.message }}
          </td>
          <td style="text-align:center;padding:0 4px;">
            <button
              @click="toggleExpand(log.logId)"
              :title="expandedId===log.logId ? '접기' : '상세 펼치기'"
              style="background:none;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;padding:2px 5px;font-size:11px;color:#888;line-height:1;transition:all .15s;"
              :style="expandedId===log.logId ? 'background:#f0f8ff;border-color:#2563eb;color:#2563eb;' : ''">
              {{ expandedId===log.logId ? '▲' : '▼' }}
            </button>
          </td>
        </tr>

        <!-- 상세 펼침 행 -->
        <tr v-if="expandedId===log.logId"
          :style="log.runStatus==='실패' ? 'background:#fff0f0;' : 'background:#f8faff;'">
          <td colspan="8" style="padding:0;">
            <div style="padding:12px 16px 14px;border-top:1px dashed #e0e0e0;">
              <!-- 요약 메타 -->
              <div style="display:flex;gap:24px;margin-bottom:10px;flex-wrap:wrap;">
                <div>
                  <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">배치명</span>
                  <span style="font-size:12px;font-weight:600;color:#333;">{{ log.batchNm }}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">배치코드</span>
                  <code style="font-size:12px;color:#2563eb;">{{ log.batchCode }}</code>
                </div>
                <div>
                  <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">실행일시</span>
                  <span style="font-size:12px;font-family:monospace;color:#555;">{{ log.runAt }}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">소요시간</span>
                  <span style="font-size:12px;color:#555;">{{ fmtDuration(log.duration) }}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:#aaa;display:block;margin-bottom:2px;">실행결과</span>
                  <span class="badge badge-xs" :class="runBadge(log.runStatus)">{{ log.runStatus }}</span>
                </div>
              </div>
              <!-- 메시지 전체 -->
              <div style="font-size:11px;font-weight:600;color:#888;margin-bottom:4px;">메시지</div>
              <div style="font-size:12px;padding:8px 12px;border-radius:5px;line-height:1.7;white-space:pre-wrap;word-break:break-all;"
                :style="log.runStatus==='실패'
                  ? 'background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-family:monospace;'
                  : 'background:#f1f5f9;border:1px solid #e2e8f0;color:#374151;'">{{ log.message }}</div>
              <!-- 상세 내용 (detail 있을 때만) -->
              <template v-if="log.detail">
                <div style="font-size:11px;font-weight:600;color:#888;margin:10px 0 4px;">상세 내용</div>
                <pre style="margin:0;font-size:11px;padding:10px 12px;border-radius:5px;white-space:pre-wrap;word-break:break-all;line-height:1.65;font-family:monospace;"
                  :style="log.runStatus==='실패'
                    ? 'background:#1e1e1e;color:#f87171;border:1px solid #7f1d1d;'
                    : 'background:#1e1e1e;color:#86efac;border:1px solid #14532d;'">{{ log.detail }}</pre>
              </template>
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>

  <div class="pagination" style="margin-top:4px;">
    <div></div>
    <div class="pager">
      <button :disabled="pager.page===1" @click="setPage(1)">«</button>
      <button :disabled="pager.page===1" @click="setPage(pager.page-1)">‹</button>
      <button v-for="n in pageNums" :key="n" :class="{active:pager.page===n}" @click="setPage(n)">{{ n }}</button>
      <button :disabled="pager.page===totalPages" @click="setPage(pager.page+1)">›</button>
      <button :disabled="pager.page===totalPages" @click="setPage(totalPages)">»</button>
    </div>
    <div class="pager-right">
      <select class="size-select" v-model.number="pager.size" @change="onSizeChange">
        <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}개</option>
      </select>
    </div>
  </div>
</div>
`,
};
