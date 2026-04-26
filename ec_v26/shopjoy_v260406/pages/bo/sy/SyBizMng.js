/* ShopJoy Admin - 사업자 (sy_biz) */
window.SyBizMng = {
  name: 'SyBizMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;
    const bizs = reactive([]);
    const uiState = reactive({ loading: false, error: null, isPageCodeLoad: false, selectedPath: null, formMode: ''});
    const codes = reactive({ vendor_status: [] });

    // onMounted에서 API 로드
    const handleFetchData = async (searchType = 'DEFAULT') => {
      uiState.loading = true;
      try {
        const res = await window.boApi.get('/bo/sy/biz/page', {
          params: {
            pageNo: pager.pageNo, pageSize: pager.pageSize,
            ...Object.fromEntries(Object.entries(searchParam).filter(([, v]) => v !== '' && v !== null && v !== undefined))
          }
        });
        const data = res.data?.data;
        bizs.splice(0, bizs.length, ...(data?.list || []));
        pager.pageTotalCount = data?.pageTotalCount || bizs.length;
        pager.pageTotalPage = data?.pageTotalPage || Math.ceil(pager.pageTotalCount / pager.pageSize) || 1;
        Object.assign(pager.pageCond, data?.pageCond || pager.pageCond);
      } catch (err) {
        console.error('[catch-info]', err);
        uiState.error = err.message;
        if (props.showToast) props.showToast('SyBiz 로드 실패', 'error');
      } finally {
        uiState.loading = false;
      }
    };
    /* 좌측 표시경로 트리 */
        const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { uiState.selectedPath = id; };
    const cfTree = computed(() => window.boCmUtil.buildPathTree('sy_biz'));
    const expandAll = () => { const walk = (n) => { expanded.add(n.pathId); n.children.forEach(walk); }; walk(cfTree.value); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => {
      if (isAppReady.value) fnLoadCodes();
      handleFetchData('DEFAULT');
      const initSet = window.boCmUtil.collectExpandedToDepth(cfTree.value, 2);
      expanded.clear(); initSet.forEach(v => expanded.add(v));
    });

    const isAppReady = computed(() => {
      const initStore = window.useBoAppInitStore?.();
      const codeStore = window.getBoCodeStore?.();
      return !initStore?.svIsLoading && codeStore?.svCodes?.length > 0 && !uiState.isPageCodeLoad;
    });

    const fnLoadCodes = async () => {
      try {
        const codeStore = window.getBoCodeStore?.();
        if (!codeStore?.snGetGrpCodes) return;
        codes.vendor_status = await codeStore.snGetGrpCodes('VENDOR_STATUS') || [];
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };

    watch(isAppReady, (newVal) => {
      if (newVal) {
        fnLoadCodes();
      }
    });
    const cfAllowedPathIds = computed(() => uiState.selectedPath == null ? null : window.boCmUtil.getPathDescendants('sy_biz', uiState.selectedPath));

    /* 검색 */
    const searchParam = reactive({ kw: '', statusFlt: '', vendorTypeFlt: '' });
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['CS','콜센터업체'],['SITE','사이트운영업체'],['PROG','유지보수업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];
    const STATUS = [['ACTIVE','운영중'],['SUSPENDED','중지'],['TERMINATED','종료']];
    const BIZ_CLASS = ['법인','개인','면세','간이','공공'];

    /* 페이징 */
const pager = reactive({ pageNo: 1, pageSize: 10, pageTotalCount: 0, pageTotalPage: 1, pageSizes: [5, 10, 20, 30, 50, 100, 200, 500], pageCond: {} });
    const cfPageNums = computed(() => { const c=pager.pageNo,l=pager.pageTotalPage; const s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage = n => { if(n>=1 && n<=pager.pageTotalPage) { pager.pageNo = n; handleFetchData('PAGE_CLICK'); } };
    const onSizeChange = () => { pager.pageNo = 1; handleFetchData('DEFAULT'); };
    watch(() => uiState.selectedPath, () => { pager.pageNo = 1; handleFetchData('DEFAULT'); });

    const onSearch = () => { pager.pageNo = 1; handleFetchData('DEFAULT'); };
    const onReset = () => {
      searchParam.kw = '';
      searchParam.statusFlt = '';
      searchParam.vendorTypeFlt = '';
      uiState.selectedPath = null;
      onSearch();
    };

    const pathLabel = (id) => window.boCmUtil.getPathLabel(id) || (id == null ? '' : '#'+id);
    const fnVendorTypeLabel = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd) || [,cd])[1];
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
      bizId: null, bizNo: '', bizNm: '', bizNmEn: '', ceoNm: '',
      vendorTypeCd: 'SALES', bizClassCd: '법인', bizType: '', bizItem: '',
      pathId: null, zipCode: '', addr: '', addrDetail: '',
      phone: '', fax: '', email: '', homepage: '',
      bankNm: '', bankAccount: '', bankHolder: '',
      openDate: '', contractDate: '', statusCd: 'ACTIVE', remark: '',
    });
    const openNew = () => { Object.assign(formData, blankForm()); uiState.formMode = 'new'; };
    const openEdit = (b) => { Object.assign(formData, b); uiState.formMode = 'edit'; };
    const closeForm = () => { uiState.formMode = ''; };
    const handleSaveForm = async () => {
      if (!formData.bizNo || !formData.bizNm) {
        if (window.boToast) window.boToast('사업자번호와 상호는 필수입니다.', 'error');
        return;
      }
      if (uiState.formMode === 'new') {
        const newId = (bizs.reduce((m,x) => Math.max(m, x.bizId || 0), 0) || 0) + 1;
        bizs.push({ ...formData, bizId: newId });
        if (window.boToast) window.boToast('신규 업체가 등록되었습니다.', 'success');
      } else {
        const idx = bizs.findIndex(b => b.bizId === formData.bizId);
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

    return { bizs, uiState, codes, expanded, toggleNode, selectNode, expandAll, collapseAll, cfTree,
      searchParam, STATUS, BIZ_CLASS, VENDOR_TYPES,
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
        <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
      </select>
      <select class="form-control" v-model="searchParam.statusFlt" style="width:120px;">
        <option value="">상태 전체</option>
        <option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 표시경로</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="cfTree" :expanded="expanded" :selected="uiState.selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
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
            <th style="min-width:120px;">표시경로</th>
            <th>업체유형</th><th>역할구분</th><th>사업자번호</th><th>상호</th><th>대표자</th><th>구분</th><th>업태/종목</th><th>전화</th><th>상태</th><th>등록일</th><th style="text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="bizs.length===0"><td colspan="12" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="b in bizs" :key="b.bizId">
              <td><span style="font-family:monospace;font-size:11.5px;color:#374151;">{{ pathLabel(b.pathId) || '-' }}</span></td>
              <td><span class="badge" :class="fnVendorTypeBadge(b.vendorTypeCd)" style="font-size:10px;">{{ fnVendorTypeLabel(b.vendorTypeCd) }}</span></td>
              <td><span :style="{background:fnRoleCatColor(b.vendorTypeCd),color:'#fff',fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'9px'}">{{ fnRoleCatLabel(b.vendorTypeCd) }}</span></td>
              <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ b.bizNo }}</code></td>
              <td style="font-weight:600;">{{ b.bizNm }}</td>
              <td>{{ b.ceoNm }}</td>
              <td><span class="badge badge-blue" style="font-size:10px;">{{ b.bizClassCd }}</span></td>
              <td style="font-size:11.5px;color:#666;">{{ b.bizType }} / {{ b.bizItem }}</td>
              <td style="font-size:11.5px;">{{ b.phone }}</td>
              <td><span class="badge" :class="fnStatusBadge(b.statusCd)" style="font-size:10px;">{{ fnStatusLabel(b.statusCd) }}</span></td>
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

      <!-- 인라인 신규/수정 폼 -->
      <div v-if="uiState.formMode" class="card" style="margin-top:16px;border:2px solid #e8587a;">
        <div class="toolbar">
          <span class="list-title">
            <span style="color:#e8587a;">{{ uiState.formMode==='new' ? '+ 신규 업체' : '✏ 업체 수정' }}</span>
            <span v-if="uiState.formMode==='edit'" style="margin-left:8px;font-size:11px;color:#888;">#{{ formData.bizId }}</span>
          </span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" @click="closeForm">취소</button>
            <button class="btn btn-primary btn-sm" @click="handleSaveForm">저장</button>
          </div>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div class="form-group"><label class="form-label">업체유형 <span class="req">*</span></label>
            <select class="form-control" v-model="formData.vendorTypeCd">
              <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">역할구분</label>
            <div class="form-control" style="background:#f9fafb;display:flex;align-items:center;">
              <span :style="{background:fnRoleCatColor(formData.vendorTypeCd),color:'#fff',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'10px'}">{{ fnRoleCatLabel(formData.vendorTypeCd) }}</span>
              <span style="margin-left:8px;font-size:11px;color:#9ca3af;">(업체유형에 따라 자동)</span>
            </div>
          </div>
          <div class="form-group"><label class="form-label">사업자번호 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.bizNo" placeholder="123-45-67890" />
          </div>
          <div class="form-group"><label class="form-label">사업자구분</label>
            <select class="form-control" v-model="formData.bizClassCd">
              <option v-for="c in BIZ_CLASS" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">상호 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.bizNm" />
          </div>
          <div class="form-group"><label class="form-label">영문상호</label>
            <input class="form-control" v-model="formData.bizNmEn" />
          </div>
          <div class="form-group"><label class="form-label">대표자</label>
            <input class="form-control" v-model="formData.ceoNm" />
          </div>
          <div class="form-group"><label class="form-label">업태</label>
            <input class="form-control" v-model="formData.bizType" />
          </div>
          <div class="form-group"><label class="form-label">종목</label>
            <input class="form-control" v-model="formData.bizItem" />
          </div>
          <div class="form-group"><label class="form-label">표시경로</label>
            <div :style="{padding:'7px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:'#f5f5f7',color:formData.pathId!=null?'#374151':'#9ca3af',display:'flex',alignItems:'center',gap:'8px',fontFamily:'monospace'}">
              <span style="flex:1;">{{ pathLabel(formData.pathId) || '경로 선택...' }}</span>
              <button type="button" @click="openPathPick" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}">🔍</button>
            </div>
          </div>
          <div class="form-group"><label class="form-label">우편번호</label>
            <input class="form-control" v-model="formData.zipCode" />
          </div>
          <div class="form-group" style="grid-column:span 2;"><label class="form-label">주소</label>
            <input class="form-control" v-model="formData.addr" />
          </div>
          <div class="form-group" style="grid-column:span 3;"><label class="form-label">상세주소</label>
            <input class="form-control" v-model="formData.addrDetail" />
          </div>
          <div class="form-group"><label class="form-label">전화</label>
            <input class="form-control" v-model="formData.phone" />
          </div>
          <div class="form-group"><label class="form-label">팩스</label>
            <input class="form-control" v-model="formData.fax" />
          </div>
          <div class="form-group"><label class="form-label">이메일</label>
            <input class="form-control" v-model="formData.email" />
          </div>
          <div class="form-group"><label class="form-label">홈페이지</label>
            <input class="form-control" v-model="formData.homepage" />
          </div>
          <div class="form-group"><label class="form-label">은행</label>
            <input class="form-control" v-model="formData.bankNm" />
          </div>
          <div class="form-group"><label class="form-label">계좌번호</label>
            <input class="form-control" v-model="formData.bankAccount" />
          </div>
          <div class="form-group"><label class="form-label">예금주</label>
            <input class="form-control" v-model="formData.bankHolder" />
          </div>
          <div class="form-group"><label class="form-label">개업일</label>
            <input class="form-control" type="date" v-model="formData.openDate" />
          </div>
          <div class="form-group"><label class="form-label">계약일</label>
            <input class="form-control" type="date" v-model="formData.contractDate" />
          </div>
          <div class="form-group"><label class="form-label">상태</label>
            <select class="form-control" v-model="formData.statusCd">
              <option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:span 3;"><label class="form-label">비고</label>
            <input class="form-control" v-model="formData.remark" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <path-pick-modal v-if="pathPickModal && pathPickModal.show" biz-cd="sy_biz"
    :value="formData.pathId" title="업체 표시경로 선택"
    @select="onPathPicked" @close="closePathPick" />
</div>
`,
};
