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
    /* sy_role 데이터의 모든 권한 트리 노출 (루트 권한별 그룹 포함) + 역할구분 뱃지 */
    const ROOT_BADGE_MAP = { SUPER_ADMIN:['관리자','#7c3aed'], SITE_GROUP:['사이트','#2563eb'],
                              SITE_MGR_ROOT:['판매업체','#16a34a'], DLIV_ROOT:['배송업체','#f59e0b'],
                              CS_ROOT:['콜센터업체','#0891b2'], SITE_OP_ROOT:['사이트운영업체','#7c3aed'], PROG_ROOT:['유지보수업체','#dc2626'] };
    const tree = computed(() => {
      const roles = ad.roles || [];
      const rolesById = Object.fromEntries(roles.map(r => [r.roleId, r]));
      const badgeOf = (role) => {
        let cur = role; while (cur && cur.parentId) cur = rolesById[cur.parentId];
        return cur ? ROOT_BADGE_MAP[cur.roleCode] : null;
      };
      const childrenOf = (pid) => roles
        .filter(r => r.parentId === pid)
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ pathId: r.roleCode, path: r.roleCode, name: r.roleNm, pathLabel: r.roleNm,
                     _raw: r, _badge: badgeOf(r), children: childrenOf(r.roleId), count: 0 }));
      let kids = childrenOf(null);
      const CAT_ROOT_MAP = { SALES: 'SITE_MGR_ROOT', DELIVERY: 'DLIV_ROOT', CS: 'CS_ROOT', SITE: 'SITE_OP_ROOT', PROG: 'PROG_ROOT', ADMIN: 'SUPER_ADMIN' };
      if (treeRoleCat.value && CAT_ROOT_MAP[treeRoleCat.value]) {
        const wantRoot = CAT_ROOT_MAP[treeRoleCat.value];
        kids = kids.filter(k => k._raw && k._raw.roleCode === wantRoot);
      }
      return { pathId: null, path: null, name: '전체', pathLabel: '전체', children: kids, count: roles.length };
    });
    const expandAll = () => { expanded.add(null); (ad.roles || []).forEach(r => expanded.add(r.roleCode)); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    Vue.onMounted(() => { expandAll(); });
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
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['CS','콜센터업체'],['SITE','사이트운영업체'],['PROG','유지보수업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];

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
    const roleCatFilter = ref('');    /* 검색란 역할구분 (사용자 조작) */
    const treeRoleCat  = ref('');     /* 업체행 클릭 시 자동 설정 (트리/사용자 필터용) */
    const bizKw = ref('');
    const bizVendorFlt = ref('');
    const bizStatusFlt = ref('');
    const BIZ_STATUS = [['ACTIVE','운영중'],['SUSPENDED','중지'],['TERMINATED','종료']];
    /* 적용된 조건 (검색 버튼으로 갱신) */
    const applied = reactive({ bizId: null });

    /* 업체목록 (검색 조건 적용) */
    const bizList = computed(() => (ad.bizs || []).filter(b => {
      const kw = bizKw.value.trim().toLowerCase();
      if (kw && !(b.bizNo||'').toLowerCase().includes(kw) && !(b.bizNm||'').toLowerCase().includes(kw) && !(b.ceoNm||'').toLowerCase().includes(kw)) return false;
      if (bizVendorFlt.value && b.vendorTypeCd !== bizVendorFlt.value) return false;
      if (bizStatusFlt.value && b.statusCd !== bizStatusFlt.value) return false;
      if (roleCatFilter.value) {
        const want = roleCatFilter.value;
        const vt = b.vendorTypeCd;
        const matchCat = want === 'SALES' ? vt === 'SALES'
                       : want === 'DELIVERY' ? vt === 'DELIVERY'
                       : want === 'CS' ? vt === 'CS'
                       : want === 'SITE' ? (vt === 'SITE' || vt === 'PARTNER' || vt === 'INTERNAL')
                       : want === 'PROG' ? vt === 'PROG' : true;
        if (!matchCat) return false;
      }
      return true;
    }));
    const bizPager = reactive({ page: 1, size: 5 });
    const bizTotalPages = computed(() => Math.max(1, Math.ceil(bizList.value.length / bizPager.size)));
    const bizPageNums = computed(() => { const c=bizPager.page,l=bizTotalPages.value; const s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const bizPagedRows = computed(() => bizList.value.slice((bizPager.page-1)*bizPager.size, bizPager.page*bizPager.size));
    const setBizPage = n => { if (n>=1 && n<=bizTotalPages.value) bizPager.page = n; };
    const pickBizRow = (b) => {
      applied.bizId = b.bizId;
      treeRoleCat.value = b.vendorTypeCd === 'SALES' ? 'SALES'
                        : b.vendorTypeCd === 'DELIVERY' ? 'DELIVERY'
                        : b.vendorTypeCd === 'CS' ? 'CS'
                        : b.vendorTypeCd === 'SITE' ? 'SITE'
                        : b.vendorTypeCd === 'PROG' ? 'PROG'
                        : (b.vendorTypeCd === 'PARTNER' || b.vendorTypeCd === 'INTERNAL') ? 'SITE' : '';
      if (typeof pager !== 'undefined' && pager) pager.page = 1;
    };
    const bizStatusBadge = (s) => ({ ACTIVE:'badge-green', SUSPENDED:'badge-orange', TERMINATED:'badge-red' }[s] || 'badge-gray');
    const bizStatusLabel = (s) => ({ ACTIVE:'운영중', SUSPENDED:'중지', TERMINATED:'종료' }[s] || s);

    const onSearch = () => {
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
    const onBizPicked = (b) => {
      searchBizId.value = b.bizId;
      applied.bizId = b.bizId;
      pager.page = 1;
    };
    const VENDOR_ROLE_LABEL = { SALES:'판매업체역할', DELIVERY:'배송업체역할', CS:'콜센터업체역할', SITE:'사이트운영역할', PROG:'유지보수역할', PARTNER:'사이트역할', INTERNAL:'사이트역할' };
    const VENDOR_ROLE_COLOR = { SALES:'#16a34a', DELIVERY:'#f59e0b', CS:'#0891b2', SITE:'#7c3aed', PROG:'#dc2626', PARTNER:'#2563eb', INTERNAL:'#2563eb' };
    const searchRoleCatLabel = computed(() => {
      const vt = searchBizId.value != null ? bizVendorType(searchBizId.value) : '';
      return VENDOR_ROLE_LABEL[vt] || '';
    });
    const searchRoleCatColor = computed(() => {
      const vt = searchBizId.value != null ? bizVendorType(searchBizId.value) : '';
      return VENDOR_ROLE_COLOR[vt] || '#9ca3af';
    });

    /* selectedPath(권한코드) 하위 descendants roleCode Set */
    const pathRoleCodes = computed(() => {
      if (selectedPath.value == null) return null;
      const roles = ad.roles || [];
      const root = roles.find(r => r.roleCode === selectedPath.value);
      if (!root) return new Set([selectedPath.value]);
      const ids = new Set([root.roleId]);
      let added = true;
      while (added) {
        added = false;
        roles.forEach(r => { if (ids.has(r.parentId) && !ids.has(r.roleId)) { ids.add(r.roleId); added = true; } });
      }
      return new Set(roles.filter(r => ids.has(r.roleId)).map(r => r.roleCode));
    });
    const filtered = computed(() => (ad.bizUsers || []).filter(u => {
      if (applied.bizId != null && u.bizId !== applied.bizId) return false;
      if (pathRoleCodes.value && !pathRoleCodes.value.has(u.roleCd)) return false;
      if (treeRoleCat.value) {
        const vt = bizVendorType(u.bizId);
        const matchCat = treeRoleCat.value === 'SALES' ? vt === 'SALES'
                       : treeRoleCat.value === 'DELIVERY' ? vt === 'DELIVERY'
                       : treeRoleCat.value === 'CS' ? vt === 'CS'
                       : treeRoleCat.value === 'SITE' ? (vt === 'SITE' || vt === 'PARTNER' || vt === 'INTERNAL')
                       : treeRoleCat.value === 'PROG' ? vt === 'PROG' : true;
        if (!matchCat) return false;
      }
      return true;
    }));

    const pager = reactive({ page: 1, size: 10 });
    const PAGE_SIZES = [5, 10, 20, 30, 50, 100, 200, 500];
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

    /* 역할 선택 모달 */
    const roleModalOpen = ref(false);
    const roleModalTemp = ref(null);
    const roleTreeOpen = ref(false);
    const roleTreeExpanded = reactive(new Set());
    const openRoleModal = () => {
      roleModalTemp.value = formData.roleCd || null;
      const root = (ad.roles || []).find(r => r.roleCode === formAllowedRootCode.value);
      roleTreeExpanded.clear(); if (root) roleTreeExpanded.add(root.roleId);
      roleModalOpen.value = true;
    };
    const closeRoleModal = () => { roleModalOpen.value = false; };
    const confirmRoleModal = () => {
      if (roleModalTemp.value) formData.roleCd = roleModalTemp.value;
      roleModalOpen.value = false;
    };
    const selectedModalRole = computed(() => {
      if (!roleModalTemp.value) return null;
      return (ad.roles || []).find(r => r.roleCode === roleModalTemp.value) || null;
    });
    /* 역할 코드 → 메뉴 기본 권한 매핑 (roleMenus 미등록 시 대체) */
    const ROLE_DEFAULT_PERM = {
      REP:'관리', MGT:'관리', SITE_ADMIN:'쓰기', SITE_OPER:'쓰기', SALES_CALL:'읽기', STAFF:'읽기', SALES_BLOCKED:'차단',
      DLIV_REP:'관리', DLIV_MGT:'관리', DLIV_SITE_ADMIN:'쓰기', DLIV_SITE_OPER:'쓰기', DLIV_CALL:'읽기', DLIV_STAFF:'읽기', DLIV_BLOCKED:'차단',
    };
    const modalMenuList = computed(() => {
      const role = selectedModalRole.value;
      const menus = ad.menus || [];
      const rm = role ? (ad.roleMenus || []).filter(x => x.roleId === role.roleId) : [];
      const permBy = Object.fromEntries(rm.map(x => [x.menuId, x.permLevel]));
      const fallback = role ? (ROLE_DEFAULT_PERM[role.roleCode] || '없음') : '없음';
      const buildMenu = (pid, depth) => menus
        .filter(m => (m.parentId || null) === (pid || null))
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .flatMap(m => [{ ...m, _depth: depth, _perm: permBy[m.menuId] || fallback }, ...buildMenu(m.menuId, depth+1)]);
      return buildMenu(null, 0);
    });
    const permBadgeColor = (p) => ({ '관리':'#f59e0b','쓰기':'#16a34a','읽기':'#2563eb','차단':'#e8587a' }[p] || '#9ca3af');
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
    const pickRoleInModal = (n) => { if (!n.allowed) return; roleModalTemp.value = n.roleCode; };
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
      searchRoleCatLabel, searchRoleCatColor, roleCatFilter, treeRoleCat,
      bizKw, bizVendorFlt, bizStatusFlt, BIZ_STATUS,
      bizList, bizPager, bizTotalPages, bizPageNums, bizPagedRows, setBizPage,
      pickBizRow, bizStatusBadge, bizStatusLabel,
      bizPickOpen, openBizPick, closeBizPick, onBizPicked,
      filtered, pagedRows, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange,
      bizs: computed(() => ad.bizs || []), bizNm, bizVendorType, bizPathLabel,
      roleBadge, roleLabel, statusBadge, statusLabel, vendorTypeLabel, vendorTypeBadge,
      formMode, formData, openNew, openEdit, closeForm, saveForm, deleteRow,
      roleTreeOpen, roleTreeExpanded, formRoleTree, toggleRoleNode, pickRole, roleNmByCode, formAllowedRootCode,
      roleModalOpen, roleModalTemp, openRoleModal, closeRoleModal, confirmRoleModal, pickRoleInModal,
      selectedModalRole, modalMenuList, permBadgeColor,
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
      <span class="search-label">업체</span>
      <div :style="{display:'flex',alignItems:'center',gap:'8px',flex:1,maxWidth:'480px',padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',background:'#f5f5f7',color:searchBizId!=null?'#374151':'#9ca3af',fontWeight:searchBizId!=null?600:400,fontSize:'12px'}">
        <span style="flex:1;">{{ searchBizId != null ? bizSummary(searchBizId) : '업체 선택...' }}</span>
        <button type="button" @click="openBizPick" title="업체 선택"
          :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}">🔍</button>
        <button v-if="searchBizId!=null" type="button" @click="searchBizId=null;applied.bizId=null" title="초기화"
          :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #fca5a5',borderRadius:'50%',fontSize:'11px',color:'#dc2626',padding:'0',fontWeight:700}">✕</button>
      </div>
      <span class="search-label" style="margin-left:16px;">역할구분</span>
      <select class="form-control" v-model="roleCatFilter" style="width:160px;">
        <option value="">전체</option>
        <option value="SALES">판매업체역할</option>
        <option value="DELIVERY">배송업체역할</option>
        <option value="SITE">사이트역할</option>
      </select>
      <input v-model="bizKw" placeholder="사업자번호 / 상호 / 대표자 검색" style="margin-left:12px;min-width:220px;" />
      <select class="form-control" v-model="bizVendorFlt" style="width:140px;">
        <option value="">업체유형 전체</option>
        <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
      </select>
      <select class="form-control" v-model="bizStatusFlt" style="width:120px;">
        <option value="">상태 전체</option>
        <option v-for="s in BIZ_STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
      </select>
      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">검색</button>
        <button class="btn btn-secondary btn-sm" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>업체목록 <span class="list-count">{{ bizList.length }}건</span></span>
    </div>
    <table class="admin-table">
      <thead><tr>
        <th>업체유형</th><th>역할구분</th><th>사업자번호</th><th>상호</th><th>대표자</th><th>전화</th><th>상태</th><th style="text-align:right;">선택</th>
      </tr></thead>
      <tbody>
        <tr v-if="bizPagedRows.length===0"><td colspan="8" style="text-align:center;color:#999;padding:20px;">데이터가 없습니다.</td></tr>
        <tr v-for="b in bizPagedRows" :key="b.bizId"
          :style="{cursor:'pointer',background:searchBizId===b.bizId?'#fff0f4':'transparent'}"
          @click="pickBizRow(b)">
          <td><span class="badge" :class="vendorTypeBadge(b.vendorTypeCd)" style="font-size:10px;">{{ vendorTypeLabel(b.vendorTypeCd) }}</span></td>
          <td>
            <span :style="{background:(b.vendorTypeCd==='SALES'?'#16a34a':b.vendorTypeCd==='DELIVERY'?'#f59e0b':'#2563eb'),color:'#fff',fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'9px'}">
              {{ b.vendorTypeCd==='SALES' ? '판매업체역할' : b.vendorTypeCd==='DELIVERY' ? '배송업체역할' : '사이트역할' }}
            </span>
          </td>
          <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;font-weight:600;">{{ b.bizNo }}</code></td>
          <td style="font-weight:600;">{{ b.bizNm }}</td>
          <td>{{ b.ceoNm }}</td>
          <td style="font-size:11.5px;">{{ b.phone }}</td>
          <td><span class="badge" :class="bizStatusBadge(b.statusCd)" style="font-size:10px;">{{ bizStatusLabel(b.statusCd) }}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-primary btn-xs" @click.stop="pickBizRow(b)">{{ searchBizId===b.bizId ? '선택됨' : '선택' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <div></div>
      <div class="pager">
        <button :disabled="bizPager.page===1" @click="setBizPage(1)">«</button>
        <button :disabled="bizPager.page===1" @click="setBizPage(bizPager.page-1)">‹</button>
        <button v-for="n in bizPageNums" :key="n" :class="{active:bizPager.page===n}" @click="setBizPage(n)">{{ n }}</button>
        <button :disabled="bizPager.page===bizTotalPages" @click="setBizPage(bizPager.page+1)">›</button>
        <button :disabled="bizPager.page===bizTotalPages" @click="setBizPage(bizTotalPages)">»</button>
      </div>
      <div></div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;display:flex;flex-direction:column;min-width:0;height:fit-content;max-height:35vh;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 역할정보</span></div>
      <select disabled :value="treeRoleCat" style="width:100%;padding:4px 6px;font-size:11px;border:1px solid #d1d5db;border-radius:5px;margin-bottom:8px;background:#f5f5f7;color:#6b7280;">
        <option value="">역할구분 전체</option>
        <option value="SALES">판매업체역할</option>
        <option value="DELIVERY">배송업체역할</option>
        <option value="SITE">사이트역할</option>
      </select>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="flex:1;overflow:auto;min-height:0;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <div style="min-width:0;display:flex;flex-direction:column;">
      <div class="card" style="flex:1;display:flex;flex-direction:column;min-height:0;">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ filtered.length }}건</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-blue btn-sm" @click="openNew">+ 신규</button>
          </div>
        </div>
        <div style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch;min-height:0;">
        <table class="admin-table">
          <thead><tr>
            <th>표시경로</th><th>업체유형</th><th>역할구분</th><th>업체</th><th>이름</th><th>직위</th><th>역할</th><th>부서</th><th>휴대전화</th><th>상태</th><th style="text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="pagedRows.length===0"><td colspan="11" style="text-align:center;color:#999;padding:30px;">데이터가 없습니다.</td></tr>
            <tr v-for="u in pagedRows" :key="u.bizUserId">
              <td><span style="font-family:monospace;font-size:11.5px;color:#374151;">{{ bizPathLabel(u.bizId) || '-' }}</span></td>
              <td><span class="badge" :class="vendorTypeBadge(bizVendorType(u.bizId))" style="font-size:10px;">{{ vendorTypeLabel(bizVendorType(u.bizId)) }}</span></td>
              <td>
                <span :style="{background:(bizVendorType(u.bizId)==='SALES'?'#16a34a':bizVendorType(u.bizId)==='DELIVERY'?'#f59e0b':'#2563eb'),color:'#fff',fontSize:'10px',fontWeight:700,padding:'2px 7px',borderRadius:'9px'}">
                  {{ bizVendorType(u.bizId)==='SALES' ? '판매업체역할' : bizVendorType(u.bizId)==='DELIVERY' ? '배송업체역할' : '사이트역할' }}
                </span>
              </td>
              <td style="font-weight:600;color:#2563eb;" title="업체명">{{ bizNm(u.bizId) }}</td>
              <td>{{ u.memberNm }}</td>
              <td style="font-size:11.5px;">{{ u.positionCd }}</td>
              <td><span class="badge" :class="roleBadge(u.roleCd)" style="font-size:10px;">{{ roleLabel(u.roleCd) }}</span></td>
              <td style="font-size:11.5px;color:#666;">{{ u.deptNm }}</td>
              <td style="font-size:11.5px;">{{ u.mobile }}</td>
              <td><span class="badge" :class="statusBadge(u.statusCd)" style="font-size:10px;">{{ statusLabel(u.statusCd) }}</span></td>
              <td style="text-align:right;white-space:nowrap;">
                <button class="btn btn-primary btn-xs" @click="openEdit(u)">수정</button>
                <button class="btn btn-danger btn-xs" style="margin-left:4px;" @click="deleteRow(u)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
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
        <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
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
          <div class="form-group"><label class="form-label">역할</label>
            <div class="form-control" @click="openRoleModal"
              style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span :style="{color: formData.roleCd ? '#374151' : '#9ca3af',flex:1}">{{ formData.roleCd ? roleNmByCode(formData.roleCd) : '역할 선택...' }}</span>
              <span style="color:#6b7280;font-size:11px;">🔍</span>
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

  <!-- 역할 선택 모달 -->
  <div v-if="roleModalOpen" class="modal-overlay" @click.self="closeRoleModal">
    <div style="background:#fff;border-radius:16px;width:min(1000px,95vw);height:min(720px,90vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25);">
      <!-- 헤더 (블루-인디고 그라데이션) -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 22px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 60%,#bfdbfe 100%);border-bottom:1px solid #bfdbfe;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:800;font-size:16px;color:#1f2937;">🎭 역할 선택</span>
          <span v-if="formAllowedRootCode"
            :style="{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'10px',background:'#fff',border:'1px solid #93c5fd',fontWeight:700,fontSize:'11px',color: formAllowedRootCode==='SITE_MGR_ROOT'?'#16a34a':formAllowedRootCode==='DLIV_ROOT'?'#d97706':'#2563eb'}">
            역할구분: {{ formAllowedRootCode==='SITE_MGR_ROOT' ? '판매업체역할' : formAllowedRootCode==='DLIV_ROOT' ? '배송업체역할' : '사이트역할' }}
          </span>
        </div>
        <span @click="closeRoleModal"
          style="cursor:pointer;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:16px;color:#6b7280;transition:all .15s;"
          @mouseover="$event.currentTarget.style.background='#dbeafe';$event.currentTarget.style.color='#2563eb';$event.currentTarget.style.transform='rotate(90deg)'"
          @mouseout="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='#6b7280';$event.currentTarget.style.transform='rotate(0)'">✕</span>
      </div>

      <!-- 본문 2-컬럼 -->
      <div style="display:grid;grid-template-columns:300px 1fr;flex:1;overflow:hidden;background:#fafbfc;">
        <!-- 좌: 역할 트리 -->
        <div style="border-right:1px solid #eef0f3;background:#fff;overflow:auto;">
          <div style="position:sticky;top:0;background:#fff;padding:12px 14px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:700;color:#374151;z-index:1;">📂 역할 트리</div>
          <div style="padding:6px 8px;">
            <div v-if="!formAllowedRootCode" style="padding:10px;font-size:11px;color:#dc2626;background:#fef2f2;border-radius:6px;">선택한 사업자의 업체유형이 없어 역할을 선택할 수 없습니다.</div>
            <template v-for="root in formRoleTree" :key="root.roleId">
              <!-- 루트 노드 (역할구분 뱃지 포함) -->
              <div :style="{padding:'7px 8px',fontWeight:700,fontSize:'12.5px',display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',borderRadius:'6px',marginBottom:'2px',
                color: root.roleCode===formAllowedRootCode ? '#1e40af' : '#cbd5e1'}"
                @click="toggleRoleNode(root.roleId)"
                @mouseover="root.roleCode===formAllowedRootCode && ($event.currentTarget.style.background='#eff6ff')"
                @mouseout="$event.currentTarget.style.background='transparent'">
                <span style="width:12px;font-size:10px;color:#9ca3af;">{{ roleTreeExpanded.has(root.roleId) ? '▾' : '▸' }}</span>
                <span>📁 {{ root.roleNm }}</span>
                <span :style="{marginLeft:'auto',fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'8px',color:'#fff',flexShrink:0,
                  background: root.roleCode==='SUPER_ADMIN'?'#7c3aed':root.roleCode==='SITE_GROUP'?'#2563eb':root.roleCode==='SITE_MGR_ROOT'?'#16a34a':root.roleCode==='DLIV_ROOT'?'#f59e0b':'#9ca3af'}">
                  {{ root.roleCode==='SUPER_ADMIN'?'관리자':root.roleCode==='SITE_GROUP'?'사이트':root.roleCode==='SITE_MGR_ROOT'?'판매업체':root.roleCode==='DLIV_ROOT'?'배송업체':'' }}
                </span>
              </div>
              <!-- 자식 노드 -->
              <div v-if="roleTreeExpanded.has(root.roleId)" style="padding-left:14px;margin-bottom:6px;">
                <div v-for="ch in root.children" :key="ch.roleId"
                  @click="pickRoleInModal(ch)"
                  :style="{padding:'7px 10px',fontSize:'12.5px',cursor: ch.allowed ? 'pointer' : 'not-allowed',
                    color: ch.allowed ? (roleModalTemp===ch.roleCode ? '#fff' : '#374151') : '#d1d5db',
                    background: roleModalTemp===ch.roleCode ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'transparent',
                    borderRadius:'6px',fontWeight: roleModalTemp===ch.roleCode ? 700 : 500,marginBottom:'2px',
                    display:'flex',alignItems:'center',gap:'6px',
                    boxShadow: roleModalTemp===ch.roleCode ? '0 2px 6px rgba(37,99,235,.3)' : 'none',transition:'all .1s'}"
                  @mouseover="ch.allowed && roleModalTemp!==ch.roleCode && ($event.currentTarget.style.background='#eff6ff')"
                  @mouseout="roleModalTemp!==ch.roleCode && ($event.currentTarget.style.background='transparent')">
                  <span :style="{fontSize:'9px',color: roleModalTemp===ch.roleCode ? '#fff' :
                    (root.roleCode==='SUPER_ADMIN'?'#7c3aed':root.roleCode==='SITE_GROUP'?'#2563eb':root.roleCode==='SITE_MGR_ROOT'?'#16a34a':'#f59e0b')}">●</span>
                  <span>{{ ch.roleNm }}</span>
                  <span :style="{marginLeft:'auto',fontSize:'9px',fontWeight:700,padding:'1px 5px',borderRadius:'7px',flexShrink:0,
                    color: roleModalTemp===ch.roleCode ? '#fff' : '#fff',opacity: roleModalTemp===ch.roleCode ? 0.85 : 1,
                    background: root.roleCode==='SUPER_ADMIN'?'#7c3aed':root.roleCode==='SITE_GROUP'?'#2563eb':root.roleCode==='SITE_MGR_ROOT'?'#16a34a':'#f59e0b'}">
                    {{ root.roleCode==='SUPER_ADMIN'?'관리자':root.roleCode==='SITE_GROUP'?'사이트':root.roleCode==='SITE_MGR_ROOT'?'판매업체':'배송업체' }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 우: 메뉴 접근권한 -->
        <div style="overflow:auto;background:#fff;">
          <div style="position:sticky;top:0;background:#fff;padding:12px 16px 8px;border-bottom:1px solid #f3f4f6;z-index:1;">
            <div style="font-size:12px;font-weight:700;color:#374151;">🔐 메뉴 접근권한
              <span v-if="selectedModalRole" style="color:#2563eb;font-weight:700;margin-left:8px;">— {{ selectedModalRole.roleNm }}</span>
            </div>
            <div v-if="selectedModalRole" style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#6b7280;">
              <span>권한레벨:</span>
              <span v-for="p in ['관리','쓰기','읽기','차단']" :key="p" :style="{padding:'1px 6px',borderRadius:'8px',color:'#fff',fontWeight:700,background:permBadgeColor(p)}">{{ p }}</span>
            </div>
          </div>
          <div v-if="!selectedModalRole" style="padding:60px 20px;text-align:center;font-size:13px;color:#9ca3af;">
            <div style="font-size:28px;margin-bottom:8px;">👈</div>
            좌측에서 역할을 선택하세요
          </div>
          <table v-else style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:8px 12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;">메뉴</th>
                <th style="text-align:center;padding:8px 12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;width:80px;">권한</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(m, i) in modalMenuList" :key="m.menuId"
                :style="{background: i%2===0 ? '#fff' : '#fafbfc'}">
                <td :style="{padding:'6px 12px 6px '+(12 + m._depth*16)+'px',color: m.menuType==='폴더' ? '#374151' : '#4b5563',fontWeight: m.menuType==='폴더' ? 700 : 400,borderBottom:'1px solid #f3f4f6'}">
                  <span v-if="m.menuType==='폴더'" style="color:#f59e0b;margin-right:4px;">📁</span>
                  <span v-else style="color:#9ca3af;margin-right:4px;font-size:10px;">·</span>
                  {{ m.menuNm }}
                </td>
                <td style="text-align:center;padding:6px 12px;border-bottom:1px solid #f3f4f6;">
                  <span v-if="m._perm !== '없음'" :style="{background:permBadgeColor(m._perm),color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'9px',fontWeight:700,display:'inline-block'}">{{ m._perm }}</span>
                  <span v-else style="color:#d1d5db;font-size:11px;">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 푸터 -->
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:14px 22px;border-top:1px solid #eef0f3;background:#fafbfc;">
        <div style="font-size:11px;color:#6b7280;">
          <span v-if="roleModalTemp">선택: <b style="color:#2563eb;">{{ roleNmByCode(roleModalTemp) }}</b></span>
          <span v-else style="color:#9ca3af;">역할을 선택해주세요</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" @click="closeRoleModal">취소</button>
          <button class="btn btn-primary btn-sm" @click="confirmRoleModal" :disabled="!roleModalTemp">✔ 선택</button>
        </div>
      </div>
    </div>
  </div>
</div>
`,
};
