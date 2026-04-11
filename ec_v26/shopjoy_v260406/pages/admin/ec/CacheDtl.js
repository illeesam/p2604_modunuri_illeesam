/* ShopJoy Admin - 캐쉬관리 상세/등록 */
window.CacheDtl = {
  name: 'CacheDtl',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'editId', 'showConfirm', 'setApiRes', 'viewMode'],
  setup(props) {
    const { reactive, computed, ref, onMounted } = Vue;
    const isNew = computed(() => !props.editId);
    const tab = ref('info');

    const form = reactive({
      userId: '', userName: '', date: '', type: '충전', amount: 0, balance: 0, desc: '',
    });
    const errors = reactive({});

    const schema = yup.object({
      userId: yup.string().required('회원ID를 입력해주세요.'),
      desc: yup.string().required('내용을 입력해주세요.'),
    });

    onMounted(() => {
      if (!isNew.value) {
        const c = props.adminData.cacheList.find(x => x.cacheId === props.editId);
        if (c) Object.assign(form, { ...c });
      }
    });

    /* 같은 회원의 캐쉬 내역 */
    const memberCacheHistory = computed(() =>
      props.adminData.cacheList.filter(c => String(c.userId) === String(form.userId) && c.cacheId !== props.editId)
        .slice(0, 20)
    );

    const totalBalance = computed(() => {
      const list = props.adminData.cacheList.filter(c => String(c.userId) === String(form.userId));
      if (!list.length) return 0;
      return list.sort((a, b) => b.date.localeCompare(a.date))[0]?.balance || 0;
    });

    const save = async () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      try {
        await schema.validate(form, { abortEarly: false });
      } catch (err) {
        err.inner.forEach(e => { errors[e.path] = e.message; });
        props.showToast('입력 내용을 확인해주세요.', 'error');
        return;
      }
      await window.adminApiCall({
        method: isNew.value ? 'post' : 'put',
        path: `cache/${form.cacheId}`,
        data: { ...form },
        confirmTitle: isNew.value ? '등록' : '저장',
        confirmMsg: isNew.value ? '등록하시겠습니까?' : '저장하시겠습니까?',
        showConfirm: props.showConfirm,
        showToast: props.showToast,
        setApiRes: props.setApiRes,
        successMsg: isNew.value ? '등록되었습니다.' : '저장되었습니다.',
        onLocal: () => {
          if (isNew.value) {
            props.adminData.cacheList.unshift({
              ...form,
              cacheId: props.adminData.nextId(props.adminData.cacheList, 'cacheId'),
              amount: Number(form.amount), balance: Number(form.balance),
              userId: Number(form.userId),
              date: form.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
            });
          } else {
            const idx = props.adminData.cacheList.findIndex(x => x.cacheId === props.editId);
            if (idx !== -1) Object.assign(props.adminData.cacheList[idx], { ...form, amount: Number(form.amount), balance: Number(form.balance) });
          }
        },
        navigate: props.navigate,
        navigateTo: 'ecCacheMng',
      });
    };

    const onUserIdChange = () => {
      const m = props.adminData.getMember(Number(form.userId));
      if (m) form.userName = m.member_nm;
    };

    const typeBadge = t => ({ '충전': 'badge-green', '사용': 'badge-orange', '환불': 'badge-blue', '소멸': 'badge-red' }[t] || 'badge-gray');

    return { isNew, tab, form, errors, memberCacheHistory, totalBalance, save, onUserIdChange, typeBadge };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '캐쉬 등록' : (viewMode ? '캐쉬 상세' : '캐쉬 수정') }}</div>
  <div class="card">
    <div class="tab-nav">
      <button class="tab-btn" :class="{active:tab==='info'}" @click="tab='info'">기본정보</button>
      <button v-if="form.userId" class="tab-btn" :class="{active:tab==='history'}" @click="tab='history'">
        회원 캐쉬 내역 <span class="tab-count">{{ memberCacheHistory.length }}</span>
      </button>
    </div>

    <!-- 기본정보 -->
    <div v-show="tab==='info'">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">회원ID <span v-if="!viewMode" class="req">*</span></label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input class="form-control" v-model="form.userId" placeholder="회원 ID" @change="onUserIdChange" :readonly="viewMode" :class="errors.userId ? 'is-invalid' : ''" />
            <span v-if="form.userId" class="ref-link" @click="showRefModal('member', Number(form.userId))">보기</span>
          </div>
          <span v-if="errors.userId" class="field-error">{{ errors.userId }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">회원명</label>
          <div class="readonly-field">{{ form.userName || '-' }}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">유형</label>
          <select class="form-control" v-model="form.type" :disabled="viewMode">
            <option>충전</option><option>사용</option><option>환불</option><option>소멸</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">일시</label>
          <input class="form-control" v-model="form.date" placeholder="2026-04-08 10:00" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">금액 <span v-if="!viewMode" class="req">*</span> <span style="font-size:11px;color:#888;">(사용/소멸은 음수)</span></label>
          <input class="form-control" type="number" v-model.number="form.amount" :readonly="viewMode" />
        </div>
        <div class="form-group">
          <label class="form-label">처리 후 잔액</label>
          <input class="form-control" type="number" v-model.number="form.balance" :readonly="viewMode" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">내용 <span v-if="!viewMode" class="req">*</span></label>
        <input class="form-control" v-model="form.desc" placeholder="내용 입력" :readonly="viewMode" :class="errors.desc ? 'is-invalid' : ''" />
        <span v-if="errors.desc" class="field-error">{{ errors.desc }}</span>
      </div>
      <div class="form-actions">
        <template v-if="viewMode">
          <button class="btn btn-primary" @click="navigate('__switchToEdit__')">수정</button>
          <button class="btn btn-secondary" @click="navigate('ecCacheMng')">닫기</button>
        </template>
        <template v-else>
          <button class="btn btn-primary" @click="save">저장</button>
          <button class="btn btn-secondary" @click="navigate('ecCacheMng')">취소</button>
        </template>
      </div>
    </div>

    <!-- 회원 캐쉬 내역 -->
    <div v-show="tab==='history'">
      <div style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:#555;">
          <span class="ref-link" @click="showRefModal('member', Number(form.userId))">{{ form.userName }}</span> 현재 잔액
        </span>
        <span style="font-size:20px;font-weight:700;color:#e8587a;">{{ totalBalance.toLocaleString() }}원</span>
      </div>
      <table class="admin-table" v-if="memberCacheHistory.length">
        <thead><tr><th>일시</th><th>유형</th><th>금액</th><th>잔액</th><th>내용</th></tr></thead>
        <tbody>
          <tr v-for="c in memberCacheHistory" :key="c.cacheId">
            <td>{{ c.date }}</td>
            <td><span class="badge" :class="typeBadge(c.type)">{{ c.type }}</span></td>
            <td :style="c.amount>0?'color:#389e0d;font-weight:600':'color:#cf1322;font-weight:600'">
              {{ c.amount > 0 ? '+' : '' }}{{ c.amount.toLocaleString() }}원
            </td>
            <td>{{ c.balance.toLocaleString() }}원</td>
            <td>{{ c.desc }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else style="text-align:center;color:#aaa;padding:30px;font-size:13px;">캐쉬 내역이 없습니다.</div>
    </div>
  </div>
</div>
`
};
