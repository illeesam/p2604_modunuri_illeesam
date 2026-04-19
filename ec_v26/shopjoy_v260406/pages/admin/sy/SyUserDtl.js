/* ShopJoy Admin - 사용자관리(관리자) 상세/등록 */
window.SyUserDtl = {
  name: 'SyUserDtl',
  props: ['navigate', 'adminData', 'showToast', 'showConfirm', 'setApiRes', 'editId', 'viewMode'],
  setup(props) {
    const { reactive, computed, onMounted, ref } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteNm = computed(() => window.adminUtil.getSiteNm());

    const form = reactive({
      adminUserId: null, loginId: '', name: '', email: '', phone: '',
      role: '운영자', dept: '', deptId: null,
      zipcode: '', address: '', addressDetail: '',
      statusCd: '활성', password: '',
    });
    const errors = reactive({});
    const addrDetailRef = ref(null);

    const schema = yup.object({
      loginId: yup.string().required('로그인ID를 입력해주세요.'),
      name:    yup.string().required('이름을 입력해주세요.'),
      email:   yup.string().required('이메일을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const u = props.adminData.adminUsers.find(x => x.adminUserId === props.editId);
        if (u) Object.assign(form, { ...u, password: '' });
      }
    });

    /* ── 카카오 주소 검색 ── */
    const openKakaoPostcode = () => {
      const run = () => {
        new window.daum.Postcode({
          oncomplete(data) {
            form.zipcode = data.zonecode;
            form.address = data.roadAddress || data.jibunAddress;
            if (addrDetailRef.value) addrDetailRef.value.focus();
          },
        }).open();
      };
      if (window.daum && window.daum.Postcode) { run(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = run;
      document.head.appendChild(s);
    };

    /* ── 부서 선택 팝업 ── */
    const deptModal = reactive({ show: false });
    const openDeptModal = () => { deptModal.show = true; };
    const onDeptSelect = (dept) => {
      form.deptId   = dept.deptId;
      form.dept     = dept.deptNm;
      deptModal.show = false;
    };
    const clearDept = () => { form.deptId = null; form.dept = ''; };

    /* ── 현재 적용 역할 목록 ── */
    const userRoles = computed(() => {
      if (isNew.value) return [];
      return props.adminData.roleUsers
        .filter(ru => ru.adminUserId === props.editId)
        .map(ru => props.adminData.roles.find(r => r.roleId === ru.roleId))
        .filter(Boolean);
    });

    const roleTypeBadge = (t) => ({
      '시스템': 'badge-purple', '업무': 'badge-blue', '기타': 'badge-gray',
    }[t] || 'badge-gray');

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      if (isNew.value && !form.password) { props.showToast('신규 등록 시 비밀번호는 필수입니다.', 'error'); return; }
      const ok = await props.showConfirm(isNew.value ? '등록' : '저장', isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) {
        const { password, ...rest } = form;
        props.adminData.adminUsers.push({ ...rest, adminUserId: props.adminData.nextId(props.adminData.adminUsers, 'adminUserId'), lastLogin: '-', regDate: new Date().toISOString().slice(0, 10) });
      } else {
        const idx = props.adminData.adminUsers.findIndex(x => x.adminUserId === props.editId);
        if (idx !== -1) {
          const { password, ...rest } = form;
          Object.assign(props.adminData.adminUsers[idx], rest);
        }
      }
      try {
        const res = await (isNew.value ? window.adminApi.post(`admin-users/${form.adminUserId}`, { ...form }) : window.adminApi.put(`admin-users/${form.adminUserId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast(isNew.value ? '등록되었습니다.' : '저장되었습니다.', 'success');
        if (props.navigate) props.navigate('syUserMng');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    return { isNew, form, errors, save, siteNm,
             addrDetailRef, openKakaoPostcode,
             deptModal, openDeptModal, onDeptSelect, clearDept,
             userRoles, roleTypeBadge };
  },
  template: /* html */`
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><div class="page-title">{{ isNew ? '사용자 등록' : (viewMode ? '사용자 상세' : '사용자 수정') }}</div><span v-if="!isNew" style="font-size:12px;color:#999;">#{{ form.adminUserId }}</span></div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteNm }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">로그인ID <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.loginId" placeholder="로그인 아이디"
          :readonly="!isNew || viewMode" :style="(!isNew || viewMode)?'background:#f5f5f5;':''"
          :class="errors.loginId ? 'is-invalid' : ''" />
        <span v-if="errors.loginId" class="field-error">{{ errors.loginId }}</span>
      </div>
      <div v-if="!viewMode" class="form-group">
        <label class="form-label">비밀번호{{ isNew ? '' : ' (변경 시 입력)' }} <span v-if="isNew" class="req">*</span></label>
        <input class="form-control" type="password" v-model="form.password" placeholder="비밀번호" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.name" placeholder="이름" :readonly="viewMode" :class="errors.name ? 'is-invalid' : ''" />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
      <div class="form-group">
        <label class="form-label">이메일 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.email" placeholder="이메일" :readonly="viewMode" :class="errors.email ? 'is-invalid' : ''" />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">연락처</label>
        <input class="form-control" v-model="form.phone" placeholder="010-0000-0000" :readonly="viewMode" />
      </div>
      <div class="form-group">
        <label class="form-label">부서</label>
        <div v-if="viewMode" class="readonly-field">{{ form.dept || '-' }}</div>
        <div v-else style="display:flex;gap:8px;align-items:center;">
          <div class="form-control" style="flex:1;cursor:pointer;background:#fafafa;display:flex;align-items:center;min-height:36px;"
            @click="openDeptModal">
            <span v-if="form.dept" style="color:#1a1a2e;">{{ form.dept }}</span>
            <span v-else style="color:#bbb;font-size:12px;">부서를 선택하세요</span>
          </div>
          <button type="button" class="btn btn-blue btn-sm" @click="openDeptModal" style="white-space:nowrap;">🏢 선택</button>
          <button v-if="form.deptId" type="button" class="btn btn-secondary btn-sm" @click="clearDept">✕</button>
        </div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">역할</label>
        <select class="form-control" v-model="form.role" :disabled="viewMode">
          <option>슈퍼관리자</option><option>운영자</option><option>MD</option><option>CS</option><option>배송관리</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.statusCd" :disabled="viewMode">
          <option>활성</option><option>비활성</option>
        </select>
      </div>
    </div>

    <!-- 주소 영역 -->
    <div class="form-group">
      <label class="form-label">주소</label>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
        <input class="form-control" v-model="form.zipcode" placeholder="우편번호"
          style="width:110px;flex-shrink:0;" readonly />
        <button v-if="!viewMode" type="button" class="btn btn-blue btn-sm" @click="openKakaoPostcode"
          style="white-space:nowrap;">🔍 주소 검색</button>
      </div>
      <input class="form-control" v-model="form.address"
        placeholder="기본주소 (주소 검색 후 자동 입력)" style="margin-bottom:6px;" readonly />
      <input class="form-control" v-model="form.addressDetail" ref="addrDetailRef"
        placeholder="상세주소 (동/호수 등)" :readonly="viewMode" />
    </div>

    <div class="form-actions">
      <template v-if="viewMode">
        <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
        <button class="btn btn-secondary" @click="navigate('syUserMng')">닫기</button>
      </template>
      <template v-else>
        <button class="btn btn-primary" @click="save">저장</button>
        <button class="btn btn-secondary" @click="navigate('syUserMng')">취소</button>
      </template>
    </div>
  </div>

  <!-- 적용 역할 목록 -->
  <div v-if="!isNew" class="card">
    <div class="toolbar" style="margin-bottom:12px;">
      <span class="list-title">
        <span style="color:#e8587a;font-size:8px;margin-right:5px;vertical-align:middle;">●</span>
        적용 역할 목록
        <span class="list-count">{{ userRoles.length }}건</span>
      </span>
    </div>
    <div v-if="userRoles.length === 0"
      style="text-align:center;color:#bbb;padding:24px;font-size:13px;">
      배정된 역할이 없습니다.
    </div>
    <table v-else class="admin-table">
      <thead>
        <tr>
          <th style="width:50px;">ID</th>
          <th style="width:130px;">역할코드</th>
          <th>역할명</th>
          <th style="width:80px;">유형</th>
          <th style="width:80px;">제한</th>
          <th style="width:60px;">사용</th>
          <th>비고</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in userRoles" :key="r.roleId">
          <td style="text-align:center;color:#888;">{{ r.roleId }}</td>
          <td><span style="font-family:monospace;font-size:11px;color:#2563eb;">{{ r.roleCode }}</span></td>
          <td style="font-weight:600;">{{ r.roleNm }}</td>
          <td style="text-align:center;">
            <span class="badge" :class="roleTypeBadge(r.roleType)">{{ r.roleType }}</span>
          </td>
          <td style="text-align:center;">
            <span class="badge" :class="r.restrictPerm==='없음'?'badge-green':r.restrictPerm==='읽기'?'badge-orange':'badge-red'">
              {{ r.restrictPerm }}
            </span>
          </td>
          <td style="text-align:center;">
            <span class="badge" :class="r.useYn==='Y'?'badge-green':'badge-red'">{{ r.useYn }}</span>
          </td>
          <td style="font-size:12px;color:#666;">{{ r.remark }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 부서 선택 팝업 -->
  <dept-tree-modal
    v-if="deptModal && deptModal.show"
    :disp-dataset="adminData"
    :exclude-id="null"
    @select="onDeptSelect"
    @close="deptModal.show=false" />
</div>
`
};
