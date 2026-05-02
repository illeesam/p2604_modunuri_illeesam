/* ShopJoy Admin - 사업자 (sy_biz) */
window.SyBizMng = {
  name: 'SyBizMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const bizs = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, formMode: ''});
    const codes = reactive({
      vendor_status: [],
      vendor_types: [['SALES','판매업체'],['DELIVERY','배송업체'],['CS','콜센터업체'],['SITE','사이트운영업체'],['PROG','유지보수업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']],
      biz_status: [['ACTIVE','운영중'],['SUSPENDED','중지'],['TERMINATED','종료']],
      biz_class: ['법인','개인','면세','간이','공공'],
    });

    /* 검색 */
    const searchParam = reactive({ kw: '', statusFlt: '', vendorTypeFlt: '' });

    /* 페이징 */
    const pager = reactive({ pageType: 'PAGE', pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });

    // ── computed ─────────────────────────────────────────────────────────────

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.sfGetBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

const cfPageNums = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage; const s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });

    // ── watch ────────────────────────────────────────────────────────────────

    watch(isAppReady, (newVal) => { if (newVal) fnLoadCodes(); });
    watch(() => uiState.selectedPath, () => { pager.pageNo = 1; handleSearchList('DEFAULT'); });

    // ── 초기화부 ─────────────────────────────────────────────────────────────

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.sfGetBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.vendor_status = await codeStore.snGetGrpCodes('VENDOR_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleSearchList('DEFAULT');
    });

    // ── 이벤트 함수 모음 ──────────────────────────────────────────────────────

    /* 좌측 표시경로 트리 */
    const selectNode = (id) => { uiState.selectedPath = id; };

    const handleSearchList = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const params = { pageNo: pager.pageNo, pageSize: pager.pageSize, ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined)) };
        if (uiState.selectedPath != null) params.pathId = uiState.selectedPath;
        const res = await boApiSvc.syVendor.getPage(params, '업체관리', '목록조회');
        const data = res.data?.data;
        bizs.splice(0, bizs.length, ...(data?.pageList || []));
        pager.pageTotalCount = data?.pageTotalCount || bizs.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
      } finally {
        uiState.loading = false;
      }
    };

    const setPage = n => { if(n>=1 && n<=pager.pageTotalPage) { pager.pageNo = n; handleSearchList('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };

    const onSearch = () => { pager.pageNo = 1; handleSearchList('DEFAULT'); };
    const onReset = () => {
      searchParam.kw = '';
      searchParam.statusFlt = '';
      searchParam.vendorTypeFlt = '';
      uiState.selectedPath = null;
      onSearch();
    };

    const pathLabel = (id) => boUtil.getPathLabel(id) || (id == null ? '' : '#'+id);
    const fnVendorTypeLabel = (cd) => (codes.vendor_types.find(v=>v[0]===cd) || [,cd])[1];
    const fnVendorTypeBadge = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', CS:'badge-orange', SITE:'badge-purple', PROG:'badge-red', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');
    /* 업체유형 → 역할구분 매핑 */
    const ROLE_CAT_BY_VENDOR = { SALES:['판매업체역할','#16a34a'], DELIVERY:['배송업체역할','#f59e0b'], CS:['콜센터업체역할','#0891b2'], SITE:['사이트운영역할','#7c3aed'], PROG:['유지보수역할','#dc2626'], PARTNER:['사이트역할','#2563eb'], INTERNAL:['사이트역할','#2563eb'] };
    const fnRoleCatLabel = (cd) => (ROLE_CAT_BY_VENDOR[cd] || ['-','#9ca3af'])[0];
    const fnRoleCatColor = (cd) => (ROLE_CAT_BY_VENDOR[cd] || ['-','#9ca3af'])[1];
    const fnStatusBadge = (s) => ({ ACTIVE:'badge-green', SUSPENDED:'badge-orange', TERMINATED:'badge-red' }[s] || 'badge-gray');
    const fnStatusLabel = (s) => ({ ACTIVE:'운영중', SUSPENDED:'중지', TERMINATED:'종료' }[s] || s);

    /* ── 인라인 폼 (신규/수정) ── */
      // '' | 'new' | 'edit'
    const formData = reactive({});
    const blankForm = () => ({
      vendorId: null, corpNo: '', vendorNm: '', vendorNmEn: '', ceoNm: '',
      vendorType: 'SALES', vendorClassCd: '법인', vendorItem: '', vendorItem: '',
      pathId: null, vendorZipCode: '', vendorAddr: '', vendorAddrDetail: '',
      vendorPhone: '', vendorFax: '', vendorEmail: '', vendorHomepage: '',
      vendorBankNm: '', vendorBankAccount: '', vendorBankHolder: '',
      openDate: '', contractDate: '', vendorStatusCd: 'ACTIVE', vendorRemark: '',
    });
    const openNew = () => { Object.assign(formData, blankForm()); uiState.formMode = 'new'; };
    const openEdit = (b) => { Object.assign(formData, b); uiState.formMode = 'edit'; };
    const closeForm = () => { uiState.formMode = ''; };
    const handleSaveForm = async () => {
      if (!formData.corpNo || !formData.vendorNm) {
        if (window.boToast) window.boToast('사업자번호와 업체명은 필수입니다.', 'error');
        return;
      }
      if (uiState.formMode === 'new') {
        const newId = (bizs.reduce((m,x) => Math.max(m, parseInt(x.vendorId||'0')||0), 0) || 0) + 1;
        bizs.push({ ...formData, vendorId: newId.toString() });
        if (window.boToast) window.boToast('신규 업체가 등록되었습니다.', 'success');
      } else {
        const idx = bizs.findIndex(b => b.vendorId === formData.vendorId);
        if (idx >= 0) bizs[idx] = { ...formData };
        if (window.boToast) window.boToast('수정 완료', 'success');
      }
      closeForm();
    };
    /* path 선택 모달 */
    const pathPickModal = reactive({ show: false });
    const openPathPick = () => { pathPickModal.show = true; };
    const closePathPick = () => { pathPickModal.show = false; };
    const onPathPicked = (pathId) => { formData.pathId = pathId; };

    // ── return ───────────────────────────────────────────────────────────────

    return { bizs, uiState, codes, selectNode,
      searchParam,
      pager, cfPageNums, setPage, onSizeChange,
      pathLabel, fnVendorTypeLabel, fnVendorTypeBadge, fnRoleCatLabel, fnRoleCatColor, fnStatusBadge, fnStatusLabel,
      onSearch, onReset,
      formData, openNew, openEdit, closeForm, handleSaveForm,
      pathPickModal, openPathPick, closePathPick, onPathPicked,
    };
  },
  template: /* html */`
<div class="bo-wrap">
  <div class="page-title">업체</div>

  <div class="card">
    <div class="search-bar">
      <input class="form-control" v-model="searchParam.kw" placeholder="사업자번호 / 상호 / 대표자 검색" style="min-width:240px;flex:1;max-width:380px;" />
      <select class="form-control" v-model="searchParam.vendorTypeFlt" style="width:140px;">
        <option value="">업체유형 전체</option>
        <option v-for="v in codes.vendor_types" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
      </select>
      <select class="form-control" v-model="searchParam.statusFlt" style="width:120px;">
        <option value="">상태 전체</option>
        <option v-for="s in codes.biz_status" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:6px;">
        <span class="list-title" style="font-size:13px;">📂 표시경로 <span style="font-size:10px;color:#aaa;font-family:monospace;font-weight:400;">#sy_vendor</span></span>
        <span v-if="uiState.selectedPath != null" @click="selectNode(null)" style="font-size:11px;color:#1677ff;cursor:pointer;">전체보기</span>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <path-tree biz-cd="sy_vendor" :selected="uiState.selectedPath" @select="selectNode" />
      </div>
    </div>

    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>업체목록 <span class="list-count">{{ pager.pageTotalCount }}건</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-blue btn-sm" @click="openNew">+ 신규</button>
          </div>
        </div>
        <table class="bo-table">
          <thead><tr>
            <th style="width:36px;text-align:center;">번호</th>
            <th style="min-width:120px;">표시경로</th>
            <th>업체유형</th><th>역할구분</th><th>사업자번호</th><th>상호</th><th>대표자</th><th>구분</th><th>업태/종목</th><th>전화</th><th>상태</th><th>등록일</th><th style="text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="bizs.length===0"><td colspan="13" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="(b, idx) in bizs" :key="b.vendorId">
              <td style="text-align:center;font-size:11px;color:#999;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
              <td><span style="font-family:monospace;font-size:11.5px;color:#374151;">{{ pathLabel(b.pathId) || '-' }}</span></td>
              <td><span class="badge" :class="fnVendorTypeBadge(b.vendorType)" style="font-size:10px;">{{ fnVendorTypeLabel(b.vendorType) }}</span></td>
              <td><span :style="{background:fnRoleCatColor(b.vendorType),color:'#fff',fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'9px'}">{{ fnRoleCatLabel(b.vendorType) }}</span></td>
              <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ b.corpNo }}</code></td>
              <td style="font-weight:600;">{{ b.vendorNm }}</td>
              <td>{{ b.ceoNm }}</td>
              <td><span class="badge badge-blue" style="font-size:10px;">{{ b.vendorClassCd }}</span></td>
              <td style="font-size:11.5px;color:#666;">{{ b.vendorItem }}</td>
              <td style="font-size:11.5px;">{{ b.vendorPhone }}</td>
              <td><span class="badge" :class="fnStatusBadge(b.vendorStatusCd)" style="font-size:10px;">{{ fnStatusLabel(b.vendorStatusCd) }}</span></td>
              <td style="font-size:11px;color:#888;">{{ (b.contractDate||'').slice(0,10) }}</td>
              <td style="text-align:right;"><button class="btn btn-primary btn-xs" @click="openEdit(b)">수정</button></td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <div></div>
          <div class="pager">
            <button :disabled="pager.pageNo===1" @click="setPage(1)">«</button>
            <button :disabled="pager.pageNo===1" @click="setPage(pager.pageNo-1)">‹</button>
            <button v-for="n in cfPageNums" :key="n" :class="{active:pager.pageNo===n}" @click="setPage(n)">{{ n }}</button>
            <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageNo+1)">›</button>
            <button :disabled="pager.pageNo===pager.pageTotalPage" @click="setPage(pager.pageTotalPage)">»</button>
          </div>
          <div class="pager-right">
            <select class="size-select" v-model.number="pager.pageSize" @change="onSizeChange">
              <option v-for="s in pager.pageSizes" :key="s" :value="s">{{ s }}개</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ── 인라인 신규/수정 폼 ──────────────────────────────────────────────── -->
      <div v-if="uiState.formMode" class="card" style="margin-top:16px;border:2px solid #e8587a;">
        <div class="toolbar">
          <span class="list-title">
            <span style="color:#e8587a;">{{ uiState.formMode==='new' ? '+ 신규 업체' : '✏ 업체 수정' }}</span>
            <span v-if="uiState.formMode==='edit'" style="margin-left:8px;font-size:11px;color:#888;">#{{ formData.vendorId }}</span>
          </span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" @click="closeForm">취소</button>
            <button class="btn btn-primary btn-sm" @click="handleSaveForm">저장</button>
          </div>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div class="form-group"><label class="form-label">업체유형 <span class="req">*</span></label>
            <select class="form-control" v-model="formData.vendorType">
              <option v-for="v in codes.vendor_types" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">역할구분</label>
            <div class="form-control" style="background:#f9fafb;display:flex;align-items:center;">
              <span :style="{background:fnRoleCatColor(formData.vendorType),color:'#fff',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'10px'}">{{ fnRoleCatLabel(formData.vendorType) }}</span>
              <span style="margin-left:8px;font-size:11px;color:#9ca3af;">(업체유형에 따라 자동)</span>
            </div>
          </div>
          <div class="form-group"><label class="form-label">사업자번호 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.corpNo" placeholder="123-45-67890" />
          </div>
          <div class="form-group"><label class="form-label">사업자구분</label>
            <select class="form-control" v-model="formData.vendorClassCd">
              <option v-for="c in codes.biz_class" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">업체명 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.vendorNm" />
          </div>
          <div class="form-group"><label class="form-label">영문업체명</label>
            <input class="form-control" v-model="formData.vendorNmEn" />
          </div>
          <div class="form-group"><label class="form-label">대표자</label>
            <input class="form-control" v-model="formData.ceoNm" />
          </div>
          <div class="form-group"><label class="form-label">업태</label>
            <input class="form-control" v-model="formData.vendorItem" />
          </div>
          <div class="form-group"><label class="form-label">종목</label>
            <input class="form-control" v-model="formData.vendorItem" />
          </div>
          <div class="form-group"><label class="form-label">표시경로</label>
            <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:formData.pathId!=null?'#374151':'#9ca3af',display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
              <span style="flex:1;">{{ pathLabel(formData.pathId) || '경로 선택...' }}</span>
              <button type="button" @click="openPathPick" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}">🔍</button>
            </div>
          </div>
          <div class="form-group"><label class="form-label">우편번호</label>
            <input class="form-control" v-model="formData.vendorZipCode" />
          </div>
          <div class="form-group" style="grid-column:span 2;"><label class="form-label">주소</label>
            <input class="form-control" v-model="formData.vendorAddr" />
          </div>
          <div class="form-group" style="grid-column:span 3;"><label class="form-label">상세주소</label>
            <input class="form-control" v-model="formData.vendorAddrDetail" />
          </div>
          <div class="form-group"><label class="form-label">전화</label>
            <input class="form-control" v-model="formData.vendorPhone" />
          </div>
          <div class="form-group"><label class="form-label">팩스</label>
            <input class="form-control" v-model="formData.vendorFax" />
          </div>
          <div class="form-group"><label class="form-label">이메일</label>
            <input class="form-control" v-model="formData.vendorEmail" />
          </div>
          <div class="form-group"><label class="form-label">홈페이지</label>
            <input class="form-control" v-model="formData.vendorHomepage" />
          </div>
          <div class="form-group"><label class="form-label">은행</label>
            <input class="form-control" v-model="formData.vendorBankNm" />
          </div>
          <div class="form-group"><label class="form-label">계좌번호</label>
            <input class="form-control" v-model="formData.vendorBankAccount" />
          </div>
          <div class="form-group"><label class="form-label">예금주</label>
            <input class="form-control" v-model="formData.vendorBankHolder" />
          </div>
          <div class="form-group"><label class="form-label">개업일</label>
            <input class="form-control" type="date" v-model="formData.openDate" />
          </div>
          <div class="form-group"><label class="form-label">계약일</label>
            <input class="form-control" type="date" v-model="formData.contractDate" />
          </div>
          <div class="form-group"><label class="form-label">상태</label>
            <select class="form-control" v-model="formData.vendorStatusCd">
              <option v-for="s in codes.biz_status" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:span 3;"><label class="form-label">비고</label>
            <input class="form-control" v-model="formData.vendorRemark" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_vendor"
    :value="formData.pathId" title="업체 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
