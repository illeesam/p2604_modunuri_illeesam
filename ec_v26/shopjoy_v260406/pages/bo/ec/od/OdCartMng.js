/* ShopJoy Admin - 장바구니관리 목록 */
window.OdCartMng = {
  name: 'OdCartMng',
  props: {
    navigate:     { type: Function, required: true },                       // 페이지 이동
    showToast:    { type: Function, default: () => {} },                    // 토스트 알림
    showConfirm:  { type: Function, default: () => Promise.resolve(true) }, // 확인 모달
  },
  setup(props) {
    const { ref, reactive, onMounted } = Vue;
    const showToast   = window.boApp?.showToast   || props.showToast;
    const showConfirm = window.boApp?.showConfirm || props.showConfirm;

    /* ── 목록 상태 ── */
    const rows   = reactive([]);
    const pager  = reactive({ pageNo: 1, pageSize: 20, totalCount: 0, totalPage: 1 });
    const search = reactive({ siteId: '', memberId: '', memberNm: '', searchType: '', searchValue: '', dateType: 'reg_date', dateStart: '', dateEnd: '' });
    const uiState = reactive({ loading: false, selectedIds: [] });
    const codes = reactive({ sites: [], cart_date_types: [] });

    /* ── 회원 선택 팝업 ── */
    const PICK_SIZE = 20;
    const memberPick = reactive({
      open: false,
      searchType: '',
      searchValue: '',
      rows: [],
      pageNo: 1,
      total: 0,
      totalPage: 1,
      loading: false,
    });

    /* 장바구니 openMemberPick */
    const openMemberPick = () => {
      memberPick.open = true;
      memberPick.searchType = '';
      memberPick.searchValue = '';
      memberPick.rows = [];
      memberPick.pageNo = 1;
      memberPick.total = 0;
      memberPick.totalPage = 1;
      handlePickSearch();
    };

    /* 장바구니 closeMemberPick */
    const closeMemberPick = () => { memberPick.open = false; };

    /* 장바구니 handlePickSearch */
    const handlePickSearch = async () => {
      memberPick.loading = true;
      try {
        const params = { pageNo: memberPick.pageNo, pageSize: PICK_SIZE, searchValue: memberPick.searchValue || undefined, searchType: memberPick.searchType || undefined };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,loginId';
        }
        const res = await boApiSvc.mbMember.getPage(
          params,
          '장바구니관리', '회원검색'
        );
        const d = res.data?.data || {};
        memberPick.rows      = d.pageList       || [];
        memberPick.total     = d.pageTotalCount || 0;
        memberPick.totalPage = d.pageTotalPage  || 1;
      } catch (err) {
        showToast('회원 조회 중 오류가 발생했습니다.', 'error');
      } finally {
        memberPick.loading = false;
      }
    };

    /* 장바구니 onPickSearch */
    const onPickSearch = () => { memberPick.pageNo = 1; handlePickSearch(); };

    /* 장바구니 onPickPage */
    const onPickPage   = (n) => { memberPick.pageNo = n; handlePickSearch(); };

    /* 장바구니 onSelectMember */
    const onSelectMember = (m) => {
      search.memberId = m.memberId;
      search.memberNm = m.memberNm || m.loginId || m.memberId;
      closeMemberPick();
    };

    /* 장바구니 onClearMember */
    const onClearMember = () => { search.memberId = ''; search.memberNm = ''; };

    /* ── 표시 함수 ── */
    const fnCheckedBadge = (v) => v === 'Y' ? 'badge badge-green' : 'badge badge-gray';

    /* 장바구니 fnCheckedNm */
    const fnCheckedNm    = (v) => v === 'Y' ? '선택' : '미선택';

    /* 장바구니 fnPrice */
    const fnPrice        = (v) => v != null ? Number(v).toLocaleString() + '원' : '-';

    /* 장바구니 fnDate */
    const fnDate         = (v) => v ? String(v).substring(0, 16).replace('T', ' ') : '-';

    /* 장바구니 fnAvatar */
    const fnAvatar       = (nm) => nm ? nm.charAt(0) : '?';

    /* ── 목록 조회 ── */
    const handleSearchList = async () => {
      uiState.loading = true;
      try {
        const params = {
          pageNo: pager.pageNo, pageSize: pager.pageSize,
          ...(search.siteId    && { siteId:    search.siteId }),
          ...(search.memberId  && { memberId:  search.memberId }),
          ...(search.searchType && { searchType: search.searchType }),
          ...(search.searchValue && { searchValue: search.searchValue }),
          ...(search.dateType    && { dateType:    search.dateType }),
          ...(search.dateStart   && { dateStart:   search.dateStart }),
          ...(search.dateEnd     && { dateEnd:     search.dateEnd }),
        };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,memberId,prodNm';
        }
        const res = await boApiSvc.odCart.getPage(params, '장바구니관리', '조회');
        const d = res.data?.data || {};
        rows.splice(0, rows.length, ...(d.pageList || []));
        pager.totalCount = d.pageTotalCount || 0;
        pager.totalPage  = d.pageTotalPage  || 1;
      } catch (err) {
        showToast(err.response?.data?.message || '조회 중 오류가 발생했습니다.', 'error', 0);
      } finally {
        uiState.loading = false;
      }
    };

    /* 장바구니 목록조회 */
    const onSearch    = () => {
      if ((search.dateStart || search.dateEnd) && !search.dateType) {
        showToast('기간 검색 시 기간유형을 선택해주세요.', 'error');
        return;
      }
      pager.pageNo = 1; handleSearchList();
    };

    /* 장바구니 onReset */
    const onReset     = () => {
      search.siteId = ''; search.memberId = ''; search.memberNm = '';
      search.searchType = ''; search.searchValue = '';
      search.dateType = 'reg_date'; search.dateStart = ''; search.dateEnd = '';
      onSearch();
    };

    /* 장바구니 onPageChange */
    const onPageChange = (no) => { pager.pageNo = no; handleSearchList(); };

    /* ── 체크박스 ── */
    const onToggleAll = (e) => {
      uiState.selectedIds = e.target.checked ? rows.map(r => r.cartId) : [];
    };

    /* 장바구니 onToggleRow */
    const onToggleRow = (id) => {
      const idx = uiState.selectedIds.indexOf(id);
      if (idx >= 0) uiState.selectedIds.splice(idx, 1);
      else uiState.selectedIds.push(id);
    };

    /* ── 삭제 ── */
    const handleDelete = async (cartId) => {
      const ok = await showConfirm('삭제', '장바구니 항목을 삭제하시겠습니까?');
      if (!ok) return;
      try {
        await window.boApi.delete(`/bo/ec/od/cart/${cartId}`, coUtil.apiHdr('장바구니관리', '삭제'));
        showToast('삭제되었습니다.', 'success');
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* 장바구니 handleBulkDelete */
    const handleBulkDelete = async () => {
      if (!uiState.selectedIds.length) { showToast('삭제할 항목을 선택해주세요.', 'error'); return; }
      const ok = await showConfirm('일괄삭제', `선택한 ${uiState.selectedIds.length}건을 삭제하시겠습니까?`);
      if (!ok) return;
      try {
        await Promise.all(uiState.selectedIds.map(id =>
          window.boApi.delete(`/bo/ec/od/cart/${id}`, coUtil.apiHdr('장바구니관리', '일괄삭제'))
        ));
        showToast(`${uiState.selectedIds.length}건 삭제되었습니다.`, 'success');
        uiState.selectedIds = [];
        handleSearchList();
      } catch (err) {
        showToast(err.response?.data?.message || '삭제 중 오류가 발생했습니다.', 'error', 0);
      }
    };

    /* ── 초기 로드 ── */
    const loadCodes = async () => {
      try {
        const res = await coApiSvc.sySite.getList({}, '장바구니관리', '사이트목록');
        codes.sites = res.data?.data || [];
      } catch (_) {}
      try {
        const codeStore = window.sfGetBoCodeStore();
        codes.cart_date_types = codeStore.sgGetGrpCodes('CART_DATE_TYPE');
      } catch (_) {}
    };

    onMounted(() => { loadCodes(); handleSearchList(); });

    return {
      rows, pager, search, uiState, codes,
      memberPick, openMemberPick, closeMemberPick,
      handlePickSearch, onPickSearch, onPickPage, onSelectMember, onClearMember,
      fnCheckedBadge, fnCheckedNm, fnPrice, fnDate, fnAvatar,
      onSearch, onReset, onPageChange,
      onToggleAll, onToggleRow,
      handleDelete, handleBulkDelete,
    };
  },
  template: `
<div>
  <div class="page-title">장바구니관리</div>

  <!-- 검색 -->
  <div class="card" style="margin-bottom:14px;">
    <div class="search-bar" style="flex-wrap:wrap;gap:8px 16px;">

      <label class="search-label">사이트</label>
      <select v-model="search.siteId" class="form-control" style="width:150px;">
        <option value="">전체</option>
        <option v-for="s in codes.sites" :key="s.siteId" :value="s.siteId">{{ s.siteNm }}</option>
      </select>

      <label class="search-label">회원</label>
      <div style="display:flex;align-items:center;gap:4px;">
        <input :value="search.memberNm || search.memberId" readonly placeholder="회원 선택"
               class="form-control" style="width:160px;background:#f9f9f9;cursor:pointer;"
               @click="openMemberPick" />
        <button class="btn btn-secondary btn-sm" @click="openMemberPick">검색</button>
        <button v-if="search.memberId" class="btn btn-sm" style="padding:2px 6px;font-size:11px;color:#999;background:none;border:1px solid #ddd;" @click="onClearMember">✕</button>
      </div>

      <label class="search-label">검색</label>
      <bo-multi-check-select v-model="search.searchType" :options="[
          { value: 'memberNm', label: '회원명' },
          { value: 'memberId', label: '회원ID' },
          { value: 'prodId',   label: '상품ID' },
          { value: 'prodNm',   label: '상품명' },
        ]" placeholder="검색대상 전체" all-label="전체 선택" min-width="160px" />
      <input v-model="search.searchValue" class="form-control" style="width:180px;" placeholder="검색어 입력"
             @keyup.enter="onSearch" />

      <label class="search-label">기간</label>
      <select v-model="search.dateType" class="form-control" style="width:110px;">
        <option v-for="c in codes.cart_date_types" :key="c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
      </select>
      <input v-model="search.dateStart" type="date" class="form-control" style="width:136px;" />
      <span style="margin:0 2px;color:#999;">~</span>
      <input v-model="search.dateEnd" type="date" class="form-control" style="width:136px;" />

      <div class="search-actions">
        <button class="btn btn-primary" @click="onSearch">조회</button>
        <button class="btn btn-secondary" @click="onReset">초기화</button>
      </div>
    </div>
  </div>

  <!-- 목록 -->
  <div class="card">
    <div class="toolbar">
      <span class="list-title">장바구니 목록</span>
      <span class="list-count">총 {{ pager.totalCount.toLocaleString() }}건</span>
      <div style="margin-left:auto;">
        <button v-if="uiState.selectedIds.length" class="btn btn-danger btn-sm" @click="handleBulkDelete">
          🗑 선택삭제 ({{ uiState.selectedIds.length }})
        </button>
      </div>
    </div>

    <div v-if="uiState.loading" style="text-align:center;padding:48px;color:#bbb;">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>조회 중...
    </div>
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th style="width:36px;text-align:center;">
            <input type="checkbox" @change="onToggleAll"
                   :checked="rows.length > 0 && uiState.selectedIds.length === rows.length" />
          </th>
          <th style="width:36px;text-align:center;">번호</th>
          <th style="min-width:130px;">회원</th>
          <th style="min-width:180px;">상품</th>
          <th style="min-width:120px;">옵션</th>
          <th style="width:90px;text-align:right;">단가</th>
          <th style="width:50px;text-align:center;">수량</th>
          <th style="width:100px;text-align:right;">합계금액</th>
          <th style="width:66px;text-align:center;">선택</th>
          <th style="width:130px;">등록일시</th>
          <th style="width:60px;text-align:center;">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="11" style="text-align:center;padding:40px;color:#bbb;">
            <div style="font-size:28px;margin-bottom:6px;">🛒</div>
            조회 결과가 없습니다.
          </td>
        </tr>
        <tr v-for="(r, idx) in rows" :key="r.cartId"
            :style="uiState.selectedIds.includes(r.cartId) ? 'background:#fff5f8;' : (idx%2===1?'background:#fafafa;':'')">
          <td style="text-align:center;">
            <input type="checkbox" :checked="uiState.selectedIds.includes(r.cartId)"
                   @change="onToggleRow(r.cartId)" />
          </td>
          <td style="text-align:center;color:#999;font-size:12px;">{{ (pager.pageNo - 1) * pager.pageSize + idx + 1 }}</td>
          <!-- 회원 -->
          <td>
            <div style="display:flex;align-items:center;gap:7px;">
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f472b6,#e11d48);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">
                {{ fnAvatar(r.memberNm) }}
              </div>
              <div>
                <div style="font-weight:600;font-size:13px;">{{ r.memberNm || '-' }}</div>
                <div style="font-size:11px;color:#aaa;font-family:monospace;">{{ r.memberId || r.sessionKey || '-' }}</div>
              </div>
            </div>
          </td>
          <!-- 상품 -->
          <td>
            <div style="font-size:13px;font-weight:500;line-height:1.4;">{{ r.prodNm || '-' }}</div>
            <div style="font-size:11px;color:#aaa;font-family:monospace;">{{ r.prodId }}</div>
          </td>
          <!-- 옵션 -->
          <td>
            <div v-if="r.optNm1 || r.optNm2" style="display:flex;flex-direction:column;gap:3px;">
              <span v-if="r.optNm1" style="display:inline-block;background:#fdf2f8;color:#9d174d;border:1px solid #fbcfe8;border-radius:4px;padding:1px 7px;font-size:11px;">{{ r.optNm1 }}</span>
              <span v-if="r.optNm2" style="display:inline-block;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:1px 7px;font-size:11px;">{{ r.optNm2 }}</span>
            </div>
            <span v-else style="color:#ccc;font-size:12px;">-</span>
          </td>
          <td style="text-align:right;font-size:13px;">{{ fnPrice(r.unitPrice) }}</td>
          <td style="text-align:center;font-weight:600;">{{ r.orderQty }}</td>
          <td style="text-align:right;font-weight:700;color:#111;">{{ fnPrice(r.itemPrice) }}</td>
          <td style="text-align:center;">
            <span :class="fnCheckedBadge(r.isChecked)">{{ fnCheckedNm(r.isChecked) }}</span>
          </td>
          <td style="font-size:11px;color:#888;">{{ fnDate(r.regDate) }}</td>
          <td style="text-align:center;">
            <button class="btn btn-danger btn-xs" @click="handleDelete(r.cartId)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 페이지네이션 -->
    <div v-if="pager.totalPage > 1" class="pagination">
      <div class="pager">
        <button class="btn btn-secondary btn-sm" :disabled="pager.pageNo <= 1" @click="onPageChange(pager.pageNo - 1)">이전</button>
        <template v-for="n in pager.totalPage" :key="n">
          <button v-if="Math.abs(n - pager.pageNo) <= 4"
                  :class="['btn btn-sm', n === pager.pageNo ? 'btn-primary' : 'btn-secondary']"
                  @click="onPageChange(n)">{{ n }}</button>
        </template>
        <button class="btn btn-secondary btn-sm" :disabled="pager.pageNo >= pager.totalPage" @click="onPageChange(pager.pageNo + 1)">다음</button>
      </div>
    </div>
  </div>

  <!-- 회원 선택 팝업 -->
  <div v-if="memberPick.open"
       style="position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;"
       @click.self="closeMemberPick">
    <div style="background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.22),0 4px 16px rgba(0,0,0,0.10);width:820px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">

      <!-- 헤더 -->
      <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:18px 24px 14px;border-bottom:1px solid #fce7f3;flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:700;color:#1e293b;">회원 선택</div>
            <div style="font-size:12px;color:#9ca3af;margin-top:2px;">장바구니를 조회할 회원을 선택해주세요</div>
          </div>
          <button @click="closeMemberPick"
                  style="width:32px;height:32px;border-radius:50%;border:none;background:#fff;cursor:pointer;font-size:16px;color:#6b7280;display:flex;align-items:center;justify-content:center;transition:all .15s;"
                  onmouseover="this.style.background='#fce7f3';this.style.color='#e11d48'"
                  onmouseout="this.style.background='#fff';this.style.color='#6b7280'">✕</button>
        </div>
        <!-- 검색바 -->
        <div style="display:flex;gap:8px;margin-top:12px;">
          <div style="position:relative;flex:1;">
            <bo-multi-check-select
              v-model="memberPick.searchType"
              :options="[
                { value: 'memberNm', label: '이름' },
                { value: 'loginId',  label: '아이디' },
                { value: 'loginId',  label: '이메일' },
              ]"
              placeholder="검색대상 전체"
              all-label="전체 선택"
              min-width="140px" />
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:14px;">🔍</span>
            <input v-model="memberPick.searchValue" @keyup.enter="onPickSearch"
                   class="form-control" placeholder="검색어 입력"
                   style="padding-left:32px;border-radius:8px;" />
          </div>
          <button class="btn btn-primary" @click="onPickSearch" style="border-radius:8px;">검색</button>
        </div>
      </div>

      <!-- 총 건수 -->
      <div style="padding:8px 24px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;flex-shrink:0;">
        총 <strong style="color:#e11d48;">{{ memberPick.total.toLocaleString() }}</strong>명
      </div>

      <!-- 목록 -->
      <div style="flex:1;overflow-y:auto;">
        <div v-if="memberPick.loading" style="text-align:center;padding:40px;color:#aaa;">조회 중...</div>
        <table v-else class="admin-table" style="margin:0;">
          <thead>
            <tr>
              <th style="width:40px;text-align:center;">번호</th>
              <th style="min-width:130px;">이름</th>
              <th style="min-width:110px;">로그인ID</th>
              <th style="width:80px;text-align:center;">등급</th>
              <th style="width:80px;text-align:center;">상태</th>
              <th style="width:110px;">연락처</th>
              <th style="width:70px;text-align:center;">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!memberPick.rows.length">
              <td colspan="7" style="text-align:center;padding:32px;color:#bbb;">조회 결과가 없습니다.</td>
            </tr>
            <tr v-for="(m, idx) in memberPick.rows" :key="m.memberId"
                style="cursor:pointer;transition:background .1s;"
                @click="onSelectMember(m)"
                onmouseover="this.style.background='#fff5f8'"
                onmouseout="this.style.background=''">
              <td style="text-align:center;color:#999;font-size:12px;">{{ (memberPick.pageNo - 1) * 20 + idx + 1 }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f472b6,#e11d48);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">
                    {{ m.memberNm ? m.memberNm.charAt(0) : '?' }}
                  </div>
                  <span style="font-weight:600;font-size:13px;">{{ m.memberNm || '-' }}</span>
                </div>
              </td>
              <td><span style="font-family:monospace;font-size:12px;color:#374151;">{{ m.loginId }}</span></td>
              <td style="text-align:center;">
                <span style="background:#f3e8ff;color:#7c3aed;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;">{{ m.gradeCdNm || '-' }}</span>
              </td>
              <td style="text-align:center;">
                <span :style="m.memberStatusCd==='ACTIVE' ? 'background:#d1fae5;color:#065f46;' : 'background:#fee2e2;color:#991b1b;'"
                      style="border-radius:10px;padding:2px 8px;font-size:11px;font-weight:600;">
                  {{ m.memberStatusCdNm || m.memberStatusCd || '-' }}
                </span>
              </td>
              <td style="font-size:12px;color:#6b7280;">{{ m.memberPhone || '-' }}</td>
              <td style="text-align:center;">
                <button class="btn btn-primary btn-xs" @click.stop="onSelectMember(m)"
                        style="border-radius:6px;font-size:11px;">선택</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 팝업 페이지네이션 -->
      <div style="padding:10px 24px;border-top:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;display:flex;justify-content:center;">
        <div class="pager" v-if="memberPick.totalPage > 1">
          <button class="btn btn-secondary btn-sm" :disabled="memberPick.pageNo <= 1" @click="onPickPage(memberPick.pageNo - 1)">이전</button>
          <template v-for="n in memberPick.totalPage" :key="n">
            <button v-if="Math.abs(n - memberPick.pageNo) <= 3"
                    :class="['btn btn-sm', n === memberPick.pageNo ? 'btn-primary' : 'btn-secondary']"
                    @click="onPickPage(n)">{{ n }}</button>
          </template>
          <button class="btn btn-secondary btn-sm" :disabled="memberPick.pageNo >= memberPick.totalPage" @click="onPickPage(memberPick.pageNo + 1)">다음</button>
        </div>
        <span v-else style="font-size:12px;color:#aaa;line-height:32px;">총 {{ memberPick.total }}명</span>
      </div>
    </div>
  </div>
</div>`
};
