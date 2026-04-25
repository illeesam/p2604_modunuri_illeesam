/* ShopJoy Admin - 업체사용자 (sy_vendor_user + sy_vendor_user_role) */
window.SyBizUserMng = {
  name: 'SyBizUserMng',
  props: ['navigate', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed, watch, onMounted } = Vue;

    const vendorUsers = reactive([]);
    const loading = ref(false);

    /* ── 역할 트리 (좌측 패널) ── */
    const selectedPath = ref(null);
    const expanded = reactive(new Set([null]));
    const roles = reactive([]);
    const menus = reactive([]);
    const roleMenus = reactive([]);

    // onMounted에서 역할/메뉴/역할메뉴 API 로드
    const loadData = async () => {
      try {
        const [roleRes, menuRes, roleMenuRes] = await Promise.all([
          window.boApi.get('/bo/sy/role/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/sy/menu/page', { params: { pageNo: 1, pageSize: 10000 } }),
          window.boApi.get('/bo/sy/role-menu/page', { params: { pageNo: 1, pageSize: 10000 } }),
        ]);
        roles.splice(0, roles.length, ...(roleRes.data?.data?.list || []));
        menus.splice(0, menus.length, ...(menuRes.data?.data?.list || []));
        roleMenus.splice(0, roleMenus.length, ...(roleMenuRes.data?.data?.list || []));
      } catch (err) {
        console.warn('[SyBizUserMng] role/menu load failed', err);
      }
    };
    onMounted(() => { loadData(); });

    const ROOT_BADGE_MAP = {
      SUPER_ADMIN:['관리자','#7c3aed'], SITE_GROUP:['사이트','#2563eb'],
      SITE_MGR_ROOT:['판매업체','#16a34a'], DLIV_ROOT:['배송업체','#f59e0b'],
      CS_ROOT:['콜센터업체','#0891b2'], SITE_OP_ROOT:['사이트운영업체','#7c3aed'], PROG_ROOT:['유지보수업체','#dc2626']
    };
    const tree = computed(() => {
      const rolesById = Object.fromEntries(roles.map(r => [r.roleId, r]));
      const badgeOf = (role) => {
        let cur = role;
        while (cur && cur.parentId) cur = rolesById[cur.parentId];
        return cur ? ROOT_BADGE_MAP[cur.roleCode] : null;
      };
      const CAT_ROOT_MAP = { SALES:'SITE_MGR_ROOT', DELIVERY:'DLIV_ROOT', CS:'CS_ROOT', SITE:'SITE_OP_ROOT', PROG:'PROG_ROOT' };
      const childrenOf = (pid) => roles
        .filter(r => r.parentId === pid)
        .sort((a,b) => (a.sortOrd||0) - (b.sortOrd||0))
        .map(r => ({ pathId: r.roleCode, path: r.roleCode, name: r.roleNm, pathLabel: r.roleNm,
                     _raw: r, _badge: badgeOf(r), children: childrenOf(r.roleId) }));
      let kids = childrenOf(null);
      if (treeRoleCat.value && CAT_ROOT_MAP[treeRoleCat.value]) {
        const wantRoot = CAT_ROOT_MAP[treeRoleCat.value];
        kids = kids.filter(k => k._raw && k._raw.roleCode === wantRoot);
      }
      return { pathId: null, path: null, name: '전체', pathLabel: '전체', children: kids };
    });
    const toggleNode = (id) => { if (expanded.has(id)) expanded.delete(id); else expanded.add(id); };
    const selectNode = (id) => { selectedPath.value = id; };
    const expandAll = () => { expanded.add(null); roles.forEach(r => expanded.add(r.roleCode)); };
    const collapseAll = () => { expanded.clear(); expanded.add(null); };
    onMounted(() => { expandAll(); });

    /* ── 업체 목록 (상단 검색/선택) ── */
    const VENDOR_TYPES = [['SALES','판매업체'],['DELIVERY','배송업체'],['CS','콜센터업체'],['SITE','사이트운영업체'],['PROG','유지보수업체'],['PARTNER','제휴사'],['INTERNAL','내부법인']];
    const BIZ_STATUS  = [['ACTIVE','운영중'],['SUSPENDED','중지'],['TERMINATED','종료']];
    const STATUS      = [['ACTIVE','재직'],['LEFT','퇴직'],['SUSPENDED','중지']];

    const vendors = reactive([]);
    const loadDetail = async () => {
      try {
        const res = await window.boApi.get('/bo/sy/vendor/page', { params: { pageNo:1, pageSize:10000 } });
        const list = res.data?.data?.list || [];
        vendors.splice(0, vendors.length, ...list);
      } catch(e) { console.warn('[SyBizUserMng] vendor load failed', e); }
    };
    onMounted(() => { loadDetail(); });

    const vendorMap = computed(() => Object.fromEntries(vendors.map(v => [v.vendorId, v])));
    const vendorNm  = (id) => (vendorMap.value[id] || {}).vendorNm || '#'+id;
    const vendorTypeCd = (id) => (vendorMap.value[id] || {}).vendorTypeCd || '';
    const vendorSummary = (id) => {
      const v = vendorMap.value[id];
      if (!v) return '';
      const vt = (VENDOR_TYPES.find(x=>x[0]===v.vendorTypeCd)||[,'?'])[1];
      return '['+vt+'] '+v.vendorNm;
    };

    const searchVendorId = ref(null);
    const bizKw = ref(''); const bizVendorFlt = ref(''); const bizStatusFlt = ref('');
    const treeRoleCat = ref('');
    const applied = reactive({ vendorId: null });

    const vendorList = computed(() => vendors.filter(v => {
      const kw = bizKw.value.trim().toLowerCase();
      if (kw && !(v.vendorNm||'').toLowerCase().includes(kw) && !(v.bizNo||'').includes(kw)) return false;
      if (bizVendorFlt.value && v.vendorTypeCd !== bizVendorFlt.value) return false;
      return true;
    }));
    const bizPager = reactive({ page:1, size:5 });
    const bizTotalPages = computed(() => Math.max(1, Math.ceil(vendorList.value.length / bizPager.size)));
    const bizPageNums   = computed(() => { const c=bizPager.page,l=bizTotalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const bizPagedRows  = computed(() => vendorList.value.slice((bizPager.page-1)*bizPager.size, bizPager.page*bizPager.size));
    const setBizPage    = n => { if(n>=1&&n<=bizTotalPages.value) bizPager.page=n; };

    const vendorStatusBadge = (s) => ({ ACTIVE:'badge-green', SUSPENDED:'badge-orange', TERMINATED:'badge-red' }[s] || 'badge-gray');
    const vendorStatusLabel = (s) => ({ ACTIVE:'운영중', SUSPENDED:'중지', TERMINATED:'종료' }[s] || s);
    const vendorTypeBadge   = (cd) => ({ SALES:'badge-blue', DELIVERY:'badge-purple', PARTNER:'badge-teal', INTERNAL:'badge-gray' }[cd] || 'badge-gray');
    const vendorTypeLabel   = (cd) => (VENDOR_TYPES.find(v=>v[0]===cd)||[,'?'])[1];
    const statusBadge = (s) => ({ ACTIVE:'badge-green', LEFT:'badge-gray', SUSPENDED:'badge-orange' }[s]||'badge-gray');
    const statusLabel = (s) => ({ ACTIVE:'재직', LEFT:'퇴직', SUSPENDED:'중지' }[s]||s);

    const pickVendorRow = (v) => {
      searchVendorId.value = v.vendorId;
      applied.vendorId = v.vendorId;
      treeRoleCat.value = ({ SALES:'SALES', DELIVERY:'DELIVERY', CS:'CS', SITE:'SITE', PROG:'PROG',
                              PARTNER:'SITE', INTERNAL:'SITE' })[v.vendorTypeCd] || '';
      loadVendorUsers(v.vendorId);
      pager.page = 1;
    };

    const vendorPickOpen = ref(false);
    const onVendorPicked = (v) => { vendorPickOpen.value=false; pickVendorRow(v); };

    /* ── 사용자 목록 API 로드 ── */
    const loadVendorUsers = async (vendorId) => {
      loading.value = true;
      try {
        const res = await window.boApi.get('/base/sy/vendor-user', { params: { vendorId, pageSize:10000 } });
        const list = res.data?.data || [];
        vendorUsers.splice(0, vendorUsers.length, ...list);
      } catch(e) {
        props.showToast('사용자 목록 로드 실패', 'error');
      } finally {
        loading.value = false;
      }
    };

    /* pathRoleCodes: 선택된 역할 코드 하위 descendants */
    const pathRoleCodes = computed(() => {
      if (selectedPath.value == null) return null;
      const root = roles.find(r => r.roleCode === selectedPath.value);
      if (!root) return new Set([selectedPath.value]);
      const ids = new Set([root.roleId]);
      let added = true;
      while (added) { added = false; roles.forEach(r => { if(ids.has(r.parentId)&&!ids.has(r.roleId)){ids.add(r.roleId);added=true;}}); }
      return new Set(roles.filter(r=>ids.has(r.roleId)).map(r=>r.roleCode));
    });

    const filtered = computed(() => vendorUsers.filter(u => {
      if (applied.vendorId != null && u.vendorId !== applied.vendorId) return false;
      return true;
    }));

    const pager = reactive({ page:1, size:10 });
    const PAGE_SIZES = [5,10,20,30,50,100];
    const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pager.size)));
    const pageNums   = computed(() => { const c=pager.page,l=totalPages.value,s=Math.max(1,c-2),e=Math.min(l,s+4); return Array.from({length:e-s+1},(_,i)=>s+i); });
    const setPage    = n => { if(n>=1&&n<=totalPages.value) pager.page=n; };
    const onSizeChange = () => { pager.page=1; };
    const pagedRows  = computed(() => filtered.value.slice((pager.page-1)*pager.size, pager.page*pager.size));

    /* ── 인라인 폼 (사용자 등록/수정) ── */
    const formMode = ref('');
    const formData = reactive({});
    const blank = () => ({
      vendorUserId: null, vendorId: null, userId: null,
      memberNm: '', positionCd: '', vendorUserDeptNm: '', vendorUserPhone: '',
      vendorUserMobile: '', vendorUserEmail: '', birthDate: '',
      isMain: 'N', authYn: 'N', joinDate: '', leaveDate: '',
      vendorUserStatusCd: 'ACTIVE', vendorUserRemark: '',
    });

    const openNew = () => {
      const vid = applied.vendorId || searchVendorId.value;
      if (!vid) { props.showToast('업체를 먼저 선택해주세요.', 'warning'); return; }
      Object.assign(formData, blank());
      formData.vendorId = vid;
      formData.joinDate = new Date().toISOString().slice(0,10);
      formMode.value = 'new';
    };
    const openEdit = (u) => { Object.assign(formData, u); formMode.value = 'edit'; loadUserRoles(u.vendorUserId); };
    const closeForm = () => { formMode.value = ''; userRoles.splice(0); };

    const saveForm = async () => {
      if (!formData.memberNm || !formData.vendorUserMobile || !formData.vendorUserEmail) {
        props.showToast('이름/휴대전화/이메일은 필수입니다.', 'error'); return;
      }
      const ok = await props.showConfirm(formMode.value==='new'?'등록':'저장', formMode.value==='new'?'등록하시겠습니까?':'저장하시겠습니까?');
      if (!ok) return;
      try {
        const res = formMode.value === 'new'
          ? await window.boApi.post('/base/sy/vendor-user', { ...formData })
          : await window.boApi.put(`/base/sy/vendor-user/${formData.vendorUserId}`, { ...formData });
        if (props.setApiRes) props.setApiRes({ ok:true, status:res.status, data:res.data });
        props.showToast(formMode.value==='new'?'등록되었습니다.':'저장되었습니다.', 'success');
        await loadVendorUsers(formData.vendorId);
        if (formMode.value === 'edit') {
          const saved = res.data?.data;
          if (saved) Object.assign(formData, saved);
        } else {
          closeForm();
        }
        formMode.value = formMode.value === 'new' ? '' : 'edit';
      } catch(err) {
        const msg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok:false, status:err.response?.status, data:err.response?.data, message:err.message });
        props.showToast(msg, 'error', 0);
      }
    };

    const deleteRow = async (u) => {
      const ok = await props.showConfirm('삭제', `[${u.memberNm}] 사용자를 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        const res = await window.boApi.delete(`/base/sy/vendor-user/${u.vendorUserId}`);
        if (props.setApiRes) props.setApiRes({ ok:true, status:res.status, data:res.data });
        props.showToast('삭제되었습니다.', 'success');
        await loadVendorUsers(u.vendorId);
        if (formMode.value === 'edit' && formData.vendorUserId === u.vendorUserId) closeForm();
      } catch(err) {
        const msg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok:false, status:err.response?.status, data:err.response?.data, message:err.message });
        props.showToast(msg, 'error', 0);
      }
    };

    /* ── 역할 관리 (sy_vendor_user_role) ── */
    const userRoles = reactive([]);
    const roleLoading = ref(false);

    const loadUserRoles = async (vendorUserId) => {
      if (!vendorUserId) return;
      roleLoading.value = true;
      try {
        const res = await window.boApi.get('/base/sy/vendor-user-role', { params: { userId: vendorUserId } });
        userRoles.splice(0, userRoles.length, ...(res.data?.data || []));
      } catch(e) {
        props.showToast('역할 목록 로드 실패', 'error');
      } finally {
        roleLoading.value = false;
      }
    };

    /* 역할 선택 모달 */
    const roleModalOpen = ref(false);
    const roleModalTemp = ref(null);
    const roleTreeExpanded = reactive(new Set());

    const formAllowedRootCode = computed(() => {
      const vt = vendorTypeCd(formData.vendorId);
      return vt==='SALES'?'SITE_MGR_ROOT': vt==='DELIVERY'?'DLIV_ROOT': null;
    });
    const formRoleTree = computed(() => {
      const allowedRootCode = formAllowedRootCode.value;
      const buildBranch = (pid, allowed) => roles
        .filter(r => r.parentId === pid)
        .sort((a,b) => (a.sortOrd||0)-(b.sortOrd||0))
        .map(r => {
          const isAllowedRoot = r.parentId===null && r.roleCode===allowedRootCode;
          const branchAllowed = allowed || isAllowedRoot;
          return { roleId:r.roleId, roleCode:r.roleCode, roleNm:r.roleNm,
                   isRoot:r.parentId===null, allowed: branchAllowed && r.parentId!==null,
                   children: buildBranch(r.roleId, branchAllowed) };
        });
      return buildBranch(null, false);
    });

    const openRoleModal = () => {
      roleModalTemp.value = null;
      roleTreeExpanded.clear();
      const root = roles.find(r=>r.roleCode===formAllowedRootCode.value);
      if (root) roleTreeExpanded.add(root.roleId);
      roleModalOpen.value = true;
    };
    const closeRoleModal = () => { roleModalOpen.value = false; };
    const toggleRoleNode = (id) => { if(roleTreeExpanded.has(id)) roleTreeExpanded.delete(id); else roleTreeExpanded.add(id); };
    const pickRoleInModal = (n) => { if (!n.allowed) return; roleModalTemp.value = n.roleCode; };

    const roleNmByCode = (code) => {
      const m = Object.fromEntries(roles.map(x=>[x.roleId,x]));
      let cur = roles.find(x=>x.roleCode===code);
      if (!cur) return code;
      const seg = [];
      while (cur) { seg.unshift(cur.roleNm); cur = cur.parentId ? m[cur.parentId] : null; }
      return seg.join(' > ');
    };
    const roleIdByCode = (code) => roles.find(r=>r.roleCode===code)?.roleId || null;

    const confirmRoleModal = async () => {
      if (!roleModalTemp.value) return;
      const rid = roleIdByCode(roleModalTemp.value);
      if (!rid) { props.showToast('역할을 찾을 수 없습니다.', 'error'); return; }
      if (userRoles.some(r=>r.roleId===rid)) {
        props.showToast('이미 부여된 역할입니다.', 'warning');
        closeRoleModal(); return;
      }
      try {
        const res = await window.boApi.post('/base/sy/vendor-user-role', {
          vendorId: formData.vendorId,
          userId: formData.vendorUserId,
          roleId: rid,
        });
        if (props.setApiRes) props.setApiRes({ ok:true, status:res.status, data:res.data });
        props.showToast('역할이 부여되었습니다.', 'success');
        await loadUserRoles(formData.vendorUserId);
      } catch(err) {
        const msg = err.response?.data?.message || err.message || '오류가 발생했습니다.';
        props.showToast(msg, 'error', 0);
      }
      closeRoleModal();
    };

    const deleteRole = async (r) => {
      const ok = await props.showConfirm('역할 삭제', `[${r.roleNm}] 역할을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        const res = await window.boApi.delete(`/base/sy/vendor-user-role/${r.vendorUserRoleId}`);
        if (props.setApiRes) props.setApiRes({ ok:true, status:res.status, data:res.data });
        props.showToast('역할이 삭제되었습니다.', 'success');
        await loadUserRoles(formData.vendorUserId);
      } catch(err) {
        props.showToast(err.response?.data?.message || err.message || '오류가 발생했습니다.', 'error', 0);
      }
    };

    /* 메뉴 권한 미리보기 */
    const ROLE_DEFAULT_PERM = {
      REP:'관리', MGT:'관리', SITE_ADMIN:'쓰기', SITE_OPER:'쓰기', STAFF:'읽기',
      DLIV_REP:'관리', DLIV_MGT:'관리', DLIV_SITE_ADMIN:'쓰기', DLIV_STAFF:'읽기',
    };
    const selectedModalRole = computed(() => {
      if (!roleModalTemp.value) return null;
      return roles.find(r=>r.roleCode===roleModalTemp.value) || null;
    });
    const modalMenuList = computed(() => {
      const role = selectedModalRole.value;
      const rm = role ? roleMenus.filter(x=>x.roleId===role.roleId) : [];
      const permBy = Object.fromEntries(rm.map(x=>[x.menuId, x.permLevel]));
      const fallback = role ? (ROLE_DEFAULT_PERM[role.roleCode]||'없음') : '없음';
      const buildMenu = (pid, depth) => menus
        .filter(m=>(m.parentId||null)===(pid||null))
        .sort((a,b)=>(a.sortOrd||0)-(b.sortOrd||0))
        .flatMap(m=>[{...m,_depth:depth,_perm:permBy[m.menuId]||fallback},...buildMenu(m.menuId,depth+1)]);
      return buildMenu(null, 0);
    });
    const permBadgeColor = (p) => ({관리:'#f59e0b',쓰기:'#16a34a',읽기:'#2563eb',차단:'#e8587a'}[p]||'#9ca3af');

    return {
      loading, roleLoading,
      vendorUsers, vendorMap, vendorNm, vendorTypeCd, vendorSummary,
      vendors, vendorList, bizPager, bizTotalPages, bizPageNums, bizPagedRows, setBizPage,
      searchVendorId, bizKw, bizVendorFlt, bizStatusFlt, BIZ_STATUS, applied,
      pickVendorRow, vendorStatusBadge, vendorStatusLabel, vendorTypeBadge, vendorTypeLabel,
      vendorPickOpen, onVendorPicked, VENDOR_TYPES,
      treeRoleCat, tree, expanded, toggleNode, selectNode, expandAll, collapseAll,
      STATUS, statusBadge, statusLabel,
      filtered, pagedRows, pager, PAGE_SIZES, totalPages, pageNums, setPage, onSizeChange,
      formMode, formData, openNew, openEdit, closeForm, saveForm, deleteRow,
      userRoles, roleModalOpen, roleModalTemp, roleTreeExpanded,
      openRoleModal, closeRoleModal, confirmRoleModal, deleteRole,
      toggleRoleNode, pickRoleInModal, formRoleTree, formAllowedRootCode,
      roleNmByCode, selectedModalRole, modalMenuList, permBadgeColor,
      sendJoinMail: () => {
        if (!formData.vendorUserEmail) { props.showToast('이메일을 입력해주세요.', 'warning'); return; }
        props.showToast(formData.vendorUserEmail + ' 로 회원가입 메일을 보냈습니다.', 'success');
      },
      sendPwResetMail: () => {
        if (!formData.vendorUserEmail) { props.showToast('이메일을 입력해주세요.', 'warning'); return; }
        props.showToast(formData.vendorUserEmail + ' 로 비밀번호 초기화 메일을 보냈습니다.', 'success');
      },
    };
  },
  template: /* html */`
<div>
  <div class="page-title">업체사용자</div>

  <!-- 업체 검색 -->
  <div class="card">
    <div class="search-bar">
      <span class="search-label">업체</span>
      <div :style="{display:'flex',alignItems:'center',gap:'8px',flex:1,maxWidth:'480px',padding:'6px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',background:'#f5f5f7',color:searchVendorId!=null?'#374151':'#9ca3af',fontWeight:searchVendorId!=null?600:400,fontSize:'12px'}">
        <span style="flex:1;">{{ searchVendorId != null ? vendorSummary(searchVendorId) : '업체 선택...' }}</span>
        <button type="button" @click="vendorPickOpen=true" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'24px',height:'24px',background:'#fff',border:'1px solid #d1d5db',borderRadius:'4px',fontSize:'12px',color:'#6b7280',padding:'0'}">🔍</button>
        <button v-if="searchVendorId!=null" type="button" @click="searchVendorId=null;applied.vendorId=null;vendorUsers.splice(0)" :style="{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',width:'22px',height:'22px',background:'#fff',border:'1px solid #fca5a5',borderRadius:'50%',fontSize:'11px',color:'#dc2626',padding:'0',fontWeight:700}">✕</button>
      </div>
      <input v-model="bizKw" placeholder="업체명 / 사업자번호 검색" style="margin-left:12px;min-width:200px;" />
      <select class="form-control" v-model="bizVendorFlt" style="width:140px;">
        <option value="">업체유형 전체</option>
        <option v-for="v in VENDOR_TYPES" :key="v[0]" :value="v[0]">{{ v[1] }}</option>
      </select>
    </div>
  </div>

  <!-- 업체 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>업체목록 <span class="list-count">{{ vendorList.length }}건</span></span>
    </div>
    <table class="bo-table">
      <thead><tr>
        <th>업체유형</th><th>업체명</th><th>사업자번호</th><th>대표자</th><th>전화</th><th style="text-align:right;">선택</th>
      </tr></thead>
      <tbody>
        <tr v-if="bizPagedRows.length===0"><td colspan="6" style="text-align:center;color:#999;padding:20px;">데이터가 없습니다.</td></tr>
        <tr v-for="v in bizPagedRows" :key="v.vendorId"
          :style="{cursor:'pointer',background:searchVendorId===v.vendorId?'#fff0f4':'transparent'}"
          @click="pickVendorRow(v)">
          <td><span class="badge" :class="vendorTypeBadge(v.vendorTypeCd)" style="font-size:10px;">{{ vendorTypeLabel(v.vendorTypeCd) }}</span></td>
          <td style="font-weight:600;">{{ v.vendorNm }}</td>
          <td><code style="font-size:11px;background:#f0f4ff;padding:2px 6px;border-radius:3px;color:#2563eb;">{{ v.bizNo }}</code></td>
          <td>{{ v.ceo }}</td>
          <td style="font-size:11.5px;">{{ v.phone }}</td>
          <td style="text-align:right;">
            <button class="btn btn-primary btn-xs" @click.stop="pickVendorRow(v)">{{ searchVendorId===v.vendorId ? '선택됨' : '선택' }}</button>
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

  <!-- 역할트리 + 사용자목록 -->
  <div style="display:grid;grid-template-columns:17fr 83fr;gap:16px;align-items:flex-start;">
    <div class="card" style="padding:12px;">
      <div class="toolbar" style="margin-bottom:8px;"><span class="list-title" style="font-size:13px;">📂 역할정보</span></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button class="btn btn-sm" @click="expandAll" style="flex:1;font-size:11px;">▼ 전체펼치기</button>
        <button class="btn btn-sm" @click="collapseAll" style="flex:1;font-size:11px;">▶ 전체닫기</button>
      </div>
      <div style="max-height:40vh;overflow:auto;">
        <prop-tree-node :node="tree" :expanded="expanded" :selected="selectedPath" :on-toggle="toggleNode" :on-select="selectNode" :depth="0" />
      </div>
    </div>

    <div>
      <div class="card">
        <div class="toolbar">
          <span class="list-title"><span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>사용자목록 <span class="list-count">{{ filtered.length }}건</span></span>
          <button class="btn btn-blue btn-sm" @click="openNew">+ 신규</button>
        </div>
        <table class="bo-table">
          <thead><tr>
            <th>업체</th><th>이름</th><th>직위</th><th>부서</th><th>휴대전화</th><th>이메일</th><th>상태</th><th>대표담당자</th><th style="text-align:right;">관리</th>
          </tr></thead>
          <tbody>
            <tr v-if="pagedRows.length===0"><td colspan="9" style="text-align:center;color:#999;padding:30px;">{{ searchVendorId == null ? '업체를 선택해주세요.' : '데이터가 없습니다.' }}</td></tr>
            <tr v-for="u in pagedRows" :key="u.vendorUserId" :style="formMode&&formData.vendorUserId===u.vendorUserId?'background:#fff8f9;':''">
              <td style="font-weight:600;color:#2563eb;font-size:12px;">{{ vendorNm(u.vendorId) }}</td>
              <td>{{ u.memberNm }}</td>
              <td style="font-size:11.5px;">{{ u.positionCd }}</td>
              <td style="font-size:11.5px;color:#666;">{{ u.vendorUserDeptNm }}</td>
              <td style="font-size:11.5px;">{{ u.vendorUserMobile }}</td>
              <td style="font-size:11.5px;">{{ u.vendorUserEmail }}</td>
              <td><span class="badge" :class="statusBadge(u.vendorUserStatusCd)" style="font-size:10px;">{{ statusLabel(u.vendorUserStatusCd) }}</span></td>
              <td style="text-align:center;font-size:12px;">{{ u.isMain==='Y' ? '✅' : '-' }}</td>
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

      <!-- 인라인 폼 -->
      <div v-if="formMode" class="card" style="margin-top:16px;border:2px solid #e8587a;">
        <div class="toolbar">
          <span class="list-title">
            <span style="color:#e8587a;">{{ formMode==='new' ? '+ 신규 업체사용자' : '✏ 업체사용자 수정' }}</span>
            <span v-if="formMode==='edit'" style="margin-left:8px;font-size:11px;color:#888;">#{{ formData.vendorUserId }}</span>
          </span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-blue btn-sm" @click="sendJoinMail">✉ 회원가입메일</button>
            <button class="btn btn-blue btn-sm" @click="sendPwResetMail">🔑 비밀번호초기화</button>
            <button class="btn btn-secondary btn-sm" @click="closeForm">취소</button>
            <button class="btn btn-primary btn-sm" @click="saveForm">저장</button>
          </div>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
          <div class="form-group"><label class="form-label">업체</label>
            <input class="form-control" :value="vendorSummary(formData.vendorId)" readonly disabled style="background:#f3f4f6;" />
          </div>
          <div class="form-group"><label class="form-label">이름 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.memberNm" />
          </div>
          <div class="form-group"><label class="form-label">직위</label>
            <input class="form-control" v-model="formData.positionCd" />
          </div>
          <div class="form-group"><label class="form-label">부서</label>
            <input class="form-control" v-model="formData.vendorUserDeptNm" />
          </div>
          <div class="form-group"><label class="form-label">사무실 전화</label>
            <input class="form-control" v-model="formData.vendorUserPhone" />
          </div>
          <div class="form-group"><label class="form-label">휴대전화 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.vendorUserMobile" />
          </div>
          <div class="form-group"><label class="form-label">이메일 <span class="req">*</span></label>
            <input class="form-control" v-model="formData.vendorUserEmail" />
          </div>
          <div class="form-group"><label class="form-label">생년월일</label>
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
          <div class="form-group"><label class="form-label">상태</label>
            <select class="form-control" v-model="formData.vendorUserStatusCd">
              <option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">등록일</label>
            <input class="form-control" type="date" v-model="formData.joinDate" />
          </div>
          <div class="form-group"><label class="form-label">퇴직일</label>
            <input class="form-control" type="date" v-model="formData.leaveDate" />
          </div>
          <div class="form-group" style="grid-column:span 2;"><label class="form-label">비고</label>
            <input class="form-control" v-model="formData.vendorUserRemark" />
          </div>
        </div>

        <!-- 역할 목록 (수정 모드에서만) -->
        <div v-if="formMode==='edit'" style="padding:0 16px 16px;">
          <div class="toolbar" style="margin-bottom:8px;">
            <span class="list-title" style="font-size:13px;">🎭 부여된 역할 <span class="list-count">{{ userRoles.length }}개</span></span>
            <button class="btn btn-blue btn-sm" @click="openRoleModal">+ 역할 추가</button>
          </div>
          <div v-if="roleLoading" style="text-align:center;padding:12px;color:#9ca3af;font-size:12px;">로딩 중...</div>
          <div v-else-if="userRoles.length===0" style="padding:12px;color:#9ca3af;font-size:12px;text-align:center;">부여된 역할이 없습니다.</div>
          <table v-else class="bo-table" style="font-size:12px;">
            <thead><tr><th>역할명</th><th>부여일시</th><th>유효기간</th><th style="text-align:right;">관리</th></tr></thead>
            <tbody>
              <tr v-for="r in userRoles" :key="r.vendorUserRoleId">
                <td style="font-weight:600;">{{ r.roleNm || roleNmByCode(r.roleId) }}</td>
                <td style="color:#6b7280;">{{ r.grantDate ? String(r.grantDate).slice(0,16) : '-' }}</td>
                <td style="color:#6b7280;">
                  <span v-if="r.validFrom || r.validTo">{{ r.validFrom||'∞' }} ~ {{ r.validTo||'∞' }}</span>
                  <span v-else style="color:#d1d5db;">제한없음</span>
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-danger btn-xs" @click="deleteRole(r)">삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- 역할 선택 모달 -->
  <div v-if="roleModalOpen" class="modal-overlay" @click.self="closeRoleModal">
    <div style="background:#fff;border-radius:16px;width:min(1000px,95vw);height:min(720px,90vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25);">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 22px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 60%,#bfdbfe 100%);border-bottom:1px solid #bfdbfe;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-weight:800;font-size:16px;color:#1f2937;">🎭 역할 선택</span>
          <span v-if="formAllowedRootCode"
            :style="{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:'10px',background:'#fff',border:'1px solid #93c5fd',fontWeight:700,fontSize:'11px',color:formAllowedRootCode==='SITE_MGR_ROOT'?'#16a34a':'#d97706'}">
            {{ formAllowedRootCode==='SITE_MGR_ROOT' ? '판매업체역할' : '배송업체역할' }}
          </span>
        </div>
        <span @click="closeRoleModal"
          style="cursor:pointer;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-size:16px;color:#6b7280;"
          @mouseover="$event.currentTarget.style.background='#dbeafe';$event.currentTarget.style.color='#2563eb'"
          @mouseout="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='#6b7280'">✕</span>
      </div>
      <div style="display:grid;grid-template-columns:300px 1fr;flex:1;overflow:hidden;background:#fafbfc;">
        <!-- 좌: 역할 트리 -->
        <div style="border-right:1px solid #eef0f3;background:#fff;overflow:auto;">
          <div style="position:sticky;top:0;background:#fff;padding:12px 14px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;font-weight:700;color:#374151;">📂 역할 트리</div>
          <div style="padding:6px 8px;">
            <div v-if="!formAllowedRootCode" style="padding:10px;font-size:11px;color:#dc2626;background:#fef2f2;border-radius:6px;">선택한 업체의 업체유형이 없어 역할을 선택할 수 없습니다.</div>
            <template v-for="root in formRoleTree" :key="root.roleId">
              <div :style="{padding:'7px 8px',fontWeight:700,fontSize:'12.5px',display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',borderRadius:'6px',marginBottom:'2px',
                color:root.roleCode===formAllowedRootCode?'#1e40af':'#cbd5e1'}"
                @click="toggleRoleNode(root.roleId)"
                @mouseover="root.roleCode===formAllowedRootCode&&($event.currentTarget.style.background='#eff6ff')"
                @mouseout="$event.currentTarget.style.background='transparent'">
                <span style="width:12px;font-size:10px;color:#9ca3af;">{{ roleTreeExpanded.has(root.roleId)?'▾':'▸' }}</span>
                <span>📁 {{ root.roleNm }}</span>
              </div>
              <div v-if="roleTreeExpanded.has(root.roleId)" style="padding-left:14px;margin-bottom:6px;">
                <div v-for="ch in root.children" :key="ch.roleId"
                  @click="pickRoleInModal(ch)"
                  :style="{padding:'7px 10px',fontSize:'12.5px',cursor:ch.allowed?'pointer':'not-allowed',
                    color:ch.allowed?(roleModalTemp===ch.roleCode?'#fff':'#374151'):'#d1d5db',
                    background:roleModalTemp===ch.roleCode?'linear-gradient(135deg,#3b82f6,#2563eb)':'transparent',
                    borderRadius:'6px',fontWeight:roleModalTemp===ch.roleCode?700:500,marginBottom:'2px',
                    display:'flex',alignItems:'center',gap:'6px',transition:'all .1s'}"
                  @mouseover="ch.allowed&&roleModalTemp!==ch.roleCode&&($event.currentTarget.style.background='#eff6ff')"
                  @mouseout="roleModalTemp!==ch.roleCode&&($event.currentTarget.style.background='transparent')">
                  <span style="font-size:9px;">●</span>
                  <span>{{ ch.roleNm }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
        <!-- 우: 메뉴 접근권한 -->
        <div style="overflow:auto;background:#fff;">
          <div style="position:sticky;top:0;background:#fff;padding:12px 16px 8px;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:12px;font-weight:700;color:#374151;">🔐 메뉴 접근권한
              <span v-if="selectedModalRole" style="color:#2563eb;margin-left:8px;">— {{ selectedModalRole.roleNm }}</span>
            </div>
          </div>
          <div v-if="!selectedModalRole" style="padding:60px 20px;text-align:center;font-size:13px;color:#9ca3af;">
            <div style="font-size:28px;margin-bottom:8px;">👈</div>좌측에서 역할을 선택하세요
          </div>
          <table v-else style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f9fafb;">
              <th style="text-align:left;padding:8px 12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;">메뉴</th>
              <th style="text-align:center;padding:8px 12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;width:80px;">권한</th>
            </tr></thead>
            <tbody>
              <tr v-for="(m,i) in modalMenuList" :key="m.menuId" :style="{background:i%2===0?'#fff':'#fafbfc'}">
                <td :style="{padding:'6px 12px 6px '+(12+m._depth*16)+'px',fontWeight:m.menuType==='폴더'?700:400,borderBottom:'1px solid #f3f4f6'}">
                  <span v-if="m.menuType==='폴더'" style="color:#f59e0b;margin-right:4px;">📁</span>
                  <span v-else style="color:#9ca3af;margin-right:4px;font-size:10px;">·</span>{{ m.menuNm }}
                </td>
                <td style="text-align:center;padding:6px 12px;border-bottom:1px solid #f3f4f6;">
                  <span v-if="m._perm!=='없음'" :style="{background:permBadgeColor(m._perm),color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'9px',fontWeight:700}">{{ m._perm }}</span>
                  <span v-else style="color:#d1d5db;font-size:11px;">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 22px;border-top:1px solid #eef0f3;background:#fafbfc;">
        <div style="font-size:11px;color:#6b7280;">
          <span v-if="roleModalTemp">선택: <b style="color:#2563eb;">{{ roleNmByCode(roleModalTemp) }}</b></span>
          <span v-else style="color:#9ca3af;">역할을 선택해주세요</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" @click="closeRoleModal">취소</button>
          <button class="btn btn-primary btn-sm" @click="confirmRoleModal" :disabled="!roleModalTemp">✔ 역할 부여</button>
        </div>
      </div>
    </div>
  </div>
</div>
`,
};
