/* ShopJoy Admin - 사업자사용자 (sy_biz_user) */
window.SyBizUserMng = {
  name: 'SyBizUserMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const ad = props.adminData || window.adminData;

    /* 좌측 사용자역할 트리 (sy_path biz_cd = 'sy_biz#'+bizId) — 검색 선택된 사업자별 동적 */
    const selectedPath = ref(null);
    const expanded = reactive(new Set([null]));
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedPath.value = id; };
    /* sy_role 데이터의 모든 권한 트리 노출 (루트 권한별 그룹 포함) */
    const tree = computed(() => {
      const roles = ad.roles || [];
      const childrenOf = (pid) => roles
        .filter(r => r.parentId === pid)
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ pathId: r.roleCode, path: r.roleCode, name: r.roleNm, pathLabel: r.roleNm, children: childrenOf(r.roleId), count: 0 }));
      const kids = childrenOf(null);
      return { pathId: null, path: null, name: '전체', pathLabel: '전체', children: kids, count: kids.length };
    });
    const expandAll = () => { expanded.add(null); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    Vue.onMounted(() => { expanded.clear(); expanded.add(null); });
    /* 사업자 표시경로 트리 필터는 사용 안 함 — 검색 사업자가 우선 */
    const allowedBizIds = computed(() => null);

    /* 검색 입력 vs 적용된 조건 분리 (검색 버튼 클릭 시 applied 갱신) */
    const ROLES = [
      ['REP',        '대표자'],
      ['MGT',        '경영담당자'],
      ['SITE_ADMIN', '사이트관리자'],
      ['SITE_OPER',  '사이트운영자'],
      ['STAFF',      '일반'],
    ];
    const STATUS = [['ACTIVE','활성'],['LEFT','퇴직'],['SUSPENDED','중지']];
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];

    const bizMap = computed(() => Object.fromEntries((ad.bizs || []).map(b => [b.bizId, b])));
    const bizNm = (bizId) => (bizMap.value[bizId] || {}).bizNm || '#'+bizId;
    const bizVendorType = (bizId) => (bizMap.value[bizId] || {}).vendorTypeCd || '';
    const bizPathLabel = (bizId) => window.adminUtil.getPathLabel((bizMap.value[bizId] || {}).pathId) || '';
    const bizSummary = (bizId) => {
      const b = bizMap.value[bizId];
      if (!b) return '';
      const vt = (VENDOR_TYPES.find(v=>v[0]===b.vendorTypeCd) || [,b.vendorTypeCd])[1];
      return '[' + vt + '] ' + b.bizNm;
    };

    /* 검색 입력 (사용자가 변경) */
    const searchBizId = ref(null);
    /* 적용된 조건 (검색 버튼으로 갱신) */
    const applied = reactive({ bizId: null });

    const onSearch = () => {
      if (searchBizId.value == null) {
        if (window.adminToast) window.adminToast('사업자를 먼저 선택해주세요.', 'warning');
        return;
      }
      applied.bizId = searchBizId.value;
      pager.page = 1;
    };
    const onReset = () => {
      searchBizId.value = null;
      applied.bizId = null;
      pager.page = 1;
    };

    /* 사업자 선택 모달 */
    const bizPickOpen = ref(false);
    const openBizPick = () => { bizPickOpen.value = true; };
    const closeBizPick = () => { bizPickOpen.value = false; };
    const onBizPicked = (b) => { searchBizId.value = b.bizId; };

    const filtered = computed(() => (ad.bizUsers || []).filter(u => {
      if (applied.bizId == null) return false; /* 사업자 미선택 시 빈 목록 */
      if (u.bizId !== applied.bizId) return false;
      if (selectedPath.value != null && u.roleCd !== selectedPath.value) return false;
      return true;
    }));

    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [10, 20, 50, 100];
    const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pager.size)));
    const pageNums = computed(() => { const c=pager.page,l=totalPages.value; const s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage = n => { if(n>=1 && n<=totalPages.value) pager.page = n; };
    const onSizeChange = () => { pager.page = 1; };
    const pagedRows = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));
    Vue.watch(selectedPath, () => pager.page = 1);

    const roleBadge = (r) => ({ REP:'badge-pink', MGT:'badge-purple', SITE_ADMIN:'badge-blue', SITE_OPER:'badge-teal', STAFF:'badge-gray' }[r] || 'badge-gray');
    const roleLabel = (r) => ({ REP:'대표자', MGT:'경영담당자', SITE_ADMIN:'사이트관리자', SITE_OPER:'사이트운영자', STAFF:'일반' }[r] || r);
    const statusBadge = (s) => ({ ACTIVE:'badge-green', LEFT:'badge-gray', SUSPENDED:'badge-orange' }[s] || 'badge-gray');
    const statusLabel = (s) => ({ ACTIVE:'활성', LEFT:'퇴직', SUSPENDED:'중지' }[s] || s);
    const vendorTypeLabel = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd) || [,cd])[1];
    const vendorTypeBadge = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');

    /* 역할 선택 트리 (폼 내부) */
    const roleTreeOpen = ref(false);
    const roleTreeExpanded = reactive(new Set());
    const formBizVendorType = computed(() => bizVendorType(formData.bizId));
    const formAllowedRootCode = computed(() =>
      formBizVendorType.value === 'SALES'    ? 'SITE_MGR_ROOT' :
      formBizVendorType.value === 'DELIVERY' ? 'DLIV_ROOT' : null
    );
    const formRoleTree = computed(() => {
      const roles = ad.roles || [];
      const allowedRootCode = formAllowedRootCode.value;
      const buildBranch = (pid, allowed) => roles
        .filter(r => r.parentId === pid)
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => {
          const isAllowedRoot = r.parentId === null && r.roleCode === allowedRootCode;
          const branchAllowed = allowed || isAllowedRoot;
          return { roleId: r.roleId, roleCode: r.roleCode, roleNm: r.roleNm,
                   isRoot: r.parentId === null, allowed: branchAllowed && r.parentId !== null,
                   children: buildBranch(r.roleId, branchAllowed) };
        });
      return buildBranch(null, false);
    });
    const toggleRoleNode = (id) => { if (roleTreeExpanded.has(id)) roleTreeExpanded.delete(id); else roleTreeExpanded.add(id); };
    const pickRole = (n) => { if (!n.allowed) return; formData.roleCd = n.roleCode; roleTreeOpen.value = false; };
    const roleNmByCode = (code) => {
      const roles = ad.roles || [];
      const m = Object.fromEntries(roles.map(x => [x.roleId, x]));
      let cur = roles.find(x => x.roleCode === code);
      if (!cur) return code;
      const seg = [];
      while (cur) { seg.unshift(cur.roleNm); cur = cur.parentId ? m[cur.parentId] : null; }
      return seg.join(' > ');
    };
    Vue.watch(() => formData.bizId, () => {
      roleTreeExpanded.clear();
      const root = (ad.roles || []).find(r => r.roleCode === formAllowedRootCode.value);
      if (root) roleTreeExpanded.add(root.roleId);
    });

    /* 인라인 폼 */
    const formMode = ref('');
    const formData = reactive({});
    const blank = () => ({ bizUserId: null, bizId: null, userId: null, memberNm: '',
      positionCd: '', roleCd: 'STAFF', deptNm: '', phone: '', mobile: '', email: '', birthDate: '',
      isMain: 'N', authYn: 'N', joinDate: '', leaveDate: '', statusCd: 'ACTIVE', remark: '' });
    const openNew = () => {
      const bid = applied.bizId != null ? applied.bizId : searchBizId.value;
      if (bid == null) {
        if (window.adminToast) window.adminToast('사업자를 먼저 선택해주세요.', 'warning');
        return;
      }
      if (applied.bizId == null) { applied.bizId = bid; pager.page = 1; }
      Object.assign(formData, blank());
      formData.bizId = bid;
      formData.joinDate = new Date().toISOString().slice(0,10);
      formMode.value = 'new';
    };
    const openEdit = (u) => { Object.assign(formData, u); formMode.value = 'edit'; };
    const closeForm = () => { formMode.value = ''; };
    const saveForm = () => {
      if (!formData.bizId) {
        if (window.adminToast) window.adminToast('사업자가 필요합니다.', 'error');
        return;
      }
      if (!formData.memberNm || !formData.mobile || !formData.email || !formData.birthDate) {
        if (window.adminToast) window.adminToast('이름/휴대전화/이메일/생년월일은 필수입니다.', 'error');
        return;
      }
      if (formMode.value === 'new') {
        const newId = ((ad.bizUsers || []).reduce((m,x) => Math.max(m, x.bizUserId), 0) || 0) + 1;
        ad.bizUsers.push({ ...formData, bizUserId: newId });
        if (window.adminToast) window.adminToast('등록되었습니다.', 'success');
      } else {
        const idx = (ad.bizUsers || []).findIndex(u => u.bizUserId === formData.bizUserId);
        if (idx >= 0) ad.bizUsers[idx] = { ...formData };
        if (window.adminToast) window.adminToast('수정 완료', 'success');
      }
      closeForm();
    };
    const deleteRow = async (u) => {
      const ok = window.adminConfirm
        ? await window.adminConfirm({ title: '삭제', message: u.memberNm + ' 사용자를 삭제하시겠습니까?' })
        : confirm(u.memberNm + ' 사용자를 삭제하시겠습니까?');
      if (!ok) return;
      const idx = (ad.bizUsers || []).findIndex(x => x.bizUserId === u.bizUserId);
      if (idx >= 0) ad.bizUsers.splice(idx, 1);
      if (formMode.value === 'edit' && formData.bizUserId === u.bizUserId) closeForm();
      if (window.adminToast) window.adminToast('삭제되었습니다.', 'success');
    };

    return {
      selectedPath, expanded, toggleNode, selectNode, expandAll, collapseAll, tree,
      ROLES, STATUS, VENDOR_TYPES,
      searchBizId, applied, onSearch, onReset, bizSummary,
      bizPickOpen, openBizPick, closeBizPick, onBizPicked,
      filtered, pagedRows, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange,
      bizs: computed(() => ad.bizs || []), bizNm, bizVendorType, bizPathLabel,
      roleBadge, roleLabel, statusBadge, statusLabel, vendorTypeLabel, vendorTypeBadge,
      formMode, formData, openNew, openEdit, closeForm, saveForm, deleteRow,
      roleTreeOpen, roleTreeExpanded, formRoleTree, toggleRoleNode, pickRole, roleNmByCode, formAllowedRootCode,
      sendJoinMail: () => {
        if (!formData.email) { window.adminToast && window.adminToast('이메일을 입력해주세요.', 'warning'); return; }
        window.adminToast && window.adminToast(formData.email + ' 로 회원가입 메일을 보냈습니다.', 'success');
      },
      sendPwResetMail: () => {
        if (!formData.email) { window.adminToast && window.adminToast('이메일을 입력해주세요.', 'warning'); return; }
        window.adminToast && window.adminToast(formData.email + ' 로 비밀번호 초기화 메일을 보냈습니다.', 'success');
      },
    };
  },
  template: /* html */`
<div class="admin-wrap">
  <div class="page-title">업체사용자</div>

  <div class="card">
    <div class="search-bar">
      <span class="search-label">사업자 <span style="color:#e8587a;font-size:10px;">필수</span></span>
      <div :style="{display:'flex',alignItems:'center',gap:'8px',flex:1,maxWidth:'480px',padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',background:'#f5f5f7',color:searchBizId!=null?'#374151':'#9ca3af',fontWeight:searchBizId!=null?600:400,fontSize:'12px'}">
        <span style="flex:1;">{{ searchBizId != null ? bizSummary(searchBizId) : '사업자 선택...' }}</span>
        <button type="button" @click="openBizPick" title="사업자 선택"
          :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}">🔍</button>
      </div>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 사용자역할</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:65vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ filtered.length }}건</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-blue btn-sm" @click="openNew">+ 신규</button>
          </div>
        </div>
        <table class="admin-table">
          <thead><tr>
            <th>표시경로</th><th>업체유형</th><th>사업자</th><th>이름</th><th>직위</th><th>역할</th><th>부서</th><th>휴대전화</th><th>이메일</th><th>대표</th><th>권한</th><th>상태</th><th style="text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="pagedRows.length===0"><td colspan="13" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="u in pagedRows" :key="u.bizUserId">
              <td><span style="font-family:monospace;font-size:11.5px;color:#374151;">{{ bizPathLabel(u.bizId) || '-' }}</span></td>
              <td><span class="badge" :class="vendorTypeBadge(bizVendorType(u.bizId))" style="font-size:10px;">{{ vendorTypeLabel(bizVendorType(u.bizId)) }}</span></td>
              <td style="font-weight:600;color:#2563eb;">{{ bizNm(u.bizId) }}</td>
              <td>{{ u.memberNm }}</td>
              <td style="font-size:11.5px;">{{ u.positionCd }}</td>
              <td><span class="badge" :class="roleBadge(u.roleCd)" style="font-size:10px;">{{ roleLabel(u.roleCd) }}</span></td>
              <td style="font-size:11.5px;color:#666;">{{ u.deptNm }}</td>
              <td style="font-size:11.5px;">{{ u.mobile }}</td>
              <td style="font-size:11.5px;color:#0369a1;">{{ u.email }}</td>
              <td style="text-align:center;"><span v-if="u.isMain==='Y'" style="color:#e8587a;font-weight:700;">★</span></td>
              <td style="text-align:center;"><span v-if="u.authYn==='Y'" style="color:#16a34a;font-weight:700;">✓</span></td>
              <td><span class="badge" :class="statusBadge(u.statusCd)" style="font-size:10px;">{{ statusLabel(u.statusCd) }}</span></td>
              <td style="text-align:right;white-space:nowrap;">
                <button class="btn btn-primary btn-xs" @click="openEdit(u)">수정</button>
                <button class="btn btn-danger btn-xs" style="margin-left:4px;" @click="deleteRow(u)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
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

      <div v-if="formMode" class="card" style="margin-top:16px;border:2px solid #e8587a;">
        <div class="toolbar">
          <span class="list-title">
            <span style="color:#e8587a;">{{ formMode==='new' ? '+ 신규 사업자사용자' : '✏ 사업자사용자 수정' }}</span>
            <span v-if="formMode==='edit'" style="margin-left:8px;font-size:11px;color:#888;">#{{ formData.bizUserId }}</span>
          </span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-blue btn-sm" @click="sendJoinMail">✉ 회원가입메일보내기</button>
            <button class="btn btn-blue btn-sm" @click="sendPwResetMail">🔑 비밀번호초기화메일보내기</button>
            <button class="btn btn-secondary btn-sm" @click="closeForm">취소</button>
            <button class="btn btn-primary btn-sm" @click="saveForm">저장</button>
          </div>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div class="form-group"><label class="form-label">사업자</label>
            <input class="form-control" :value="formData.bizId != null ? bizSummary(formData.bizId) : ''" readonly disabled
              style="background:#f3f4f6;color:#374151;cursor:not-allowed;" />
          </div>
          <div class="form-group"><label class="form-label">이름 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.memberNm" />
          </div>
          <div class="form-group"><label class="form-label">직위</label>
            <input class="form-control" v-model="formData.positionCd" />
          </div>
          <div class="form-group" style="position:relative;"><label class="form-label">역할</label>
            <div class="form-control" @click="roleTreeOpen=!roleTreeOpen"
              style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
              <span :style="{color: formData.roleCd ? '#374151' : '#9ca3af'}">{{ formData.roleCd ? roleNmByCode(formData.roleCd) : '역할 선택...' }}</span>
              <span style="color:#9ca3af;font-size:10px;">{{ roleTreeOpen ? '▲' : '▼' }}</span>
            </div>
            <div v-if="roleTreeOpen"
              style="position:absolute;top:100%;left:0;right:0;z-index:30;margin-top:4px;max-height:320px;overflow:auto;background:#fff;border:1px solid #d1d5db;border-radius:6px;box-shadow:0 8px 20px rgba(0,0,0,0.12);padding:6px;">
              <div v-if="!formAllowedRootCode" style="padding:8px;font-size:11px;color:#dc2626;">선택한 사업자의 업체유형(판매/배송)이 없어 역할을 선택할 수 없습니다.</div>
              <template v-for="root in formRoleTree" :key="root.roleId">
                <div :style="{padding:'4px 6px',fontWeight:700,fontSize:'12px',color: root.roleCode===formAllowedRootCode ? '#e8587a' : '#cbd5e1',display:'flex',alignItems:'center',gap:'4px',cursor:'pointer'}"
                  @click="toggleRoleNode(root.roleId)">
                  <span style="width:10px;font-size:9px;">{{ roleTreeExpanded.has(root.roleId) ? '▼' : '▶' }}</span>
                  <span>📁 {{ root.roleNm }}</span>
                </div>
                <div v-if="roleTreeExpanded.has(root.roleId)" style="padding-left:18px;">
                  <div v-for="ch in root.children" :key="ch.roleId"
                    @click="pickRole(ch)"
                    :style="{padding:'4px 6px',fontSize:'12px',cursor: ch.allowed ? 'pointer' : 'not-allowed',color: ch.allowed ? (formData.roleCd===ch.roleCode ? '#e8587a' : '#374151') : '#cbd5e1',background: formData.roleCd===ch.roleCode ? '#fff0f4' : 'transparent',borderRadius:'4px',fontWeight: formData.roleCd===ch.roleCode ? 700 : 400}">
                    • {{ ch.roleNm }}
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div class="form-group"><label class="form-label">부서</label>
            <input class="form-control" v-model="formData.deptNm" />
          </div>
          <div class="form-group"><label class="form-label">상태</label>
            <select class="form-control" v-model="formData.statusCd">
              <option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">전화</label>
            <input class="form-control" v-model="formData.phone" />
          </div>
          <div class="form-group"><label class="form-label">휴대전화 <span class="req" style="color:#e8587a;">*</span></label>
            <input class="form-control" v-model="formData.mobile" />
          </div>
          <div class="form-group"><label class="form-label">이메일 <span class="req" style="color:#e8587a;">*</span></label>
            <input class="form-control" v-model="formData.email" />
          </div>
          <div class="form-group"><label class="form-label">생년월일 <span class="req" style="color:#e8587a;">*</span></label>
            <input class="form-control" type="date" v-model="formData.birthDate" />
          </div>
          <div class="form-group"><label class="form-label">대표 담당자</label>
            <select class="form-control" v-model="formData.isMain">
              <option value="N">아니오</option><option value="Y">예</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">관리권한</label>
            <select class="form-control" v-model="formData.authYn">
              <option value="N">아니오</option><option value="Y">예</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">등록일</label>
            <input class="form-control" type="date" v-model="formData.joinDate" />
          </div>
          <div class="form-group"><label class="form-label">퇴직일</label>
            <input class="form-control" type="date" v-model="formData.leaveDate" />
          </div>
          <div class="form-group" style="grid-column:span 2;"><label class="form-label">비고</label>
            <input class="form-control" v-model="formData.remark" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <biz-pick-modal v-if="bizPickOpen" title="사업자 선택"
    @select="onBizPicked" @close="closeBizPick" />
</div>
`,
};
