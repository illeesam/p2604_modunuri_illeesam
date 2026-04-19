/* ShopJoy Admin - 정산기준관리 */
window.StConfigMng = {
  name: 'StConfigMng',
  props: ['navigate', 'adminData', 'showRefModal', 'showToast', 'showConfirm', 'setApiRes'],
  setup(props) {
    const { ref, reactive, computed } = Vue;
    const descOpen = ref(false);

    const configs = reactive([
      { configId: 1, siteId: 1, siteNm: 'ShopJoy 01', vendorType: '판매업체', commRate: 10, settleCycle: '월정산', settleDay: 10, minSettleAmt: 10000, taxYn: 'Y', autoCloseYn: 'Y', useYn: 'Y', remark: '기본 판매업체 정산 기준' },
      { configId: 2, siteId: 1, siteNm: 'ShopJoy 01', vendorType: '배송업체', commRate: 0,  settleCycle: '월정산', settleDay: 15, minSettleAmt: 50000, taxYn: 'Y', autoCloseYn: 'N', useYn: 'Y', remark: '배송비 정산 기준' },
      { configId: 3, siteId: 1, siteNm: 'ShopJoy 01', vendorType: 'MD입점',   commRate: 12, settleCycle: '주정산', settleDay: 5,  minSettleAmt: 5000,  taxYn: 'Y', autoCloseYn: 'Y', useYn: 'Y', remark: 'MD 특별 입점 기준' },
      { configId: 4, siteId: 1, siteNm: 'ShopJoy 01', vendorType: '위탁업체', commRate: 8,  settleCycle: '월정산', settleDay: 10, minSettleAmt: 10000, taxYn: 'N', autoCloseYn: 'Y', useYn: 'N', remark: '위탁 판매 기준 (미사용)' },
    ]);

    const selectedId = ref(null);
    const form = reactive({});
    const errors = reactive({});
    const isNew = ref(false);

    const openEdit = (c) => {
      Object.assign(form, { ...c });
      selectedId.value = c.configId;
      isNew.value = false;
      Object.keys(errors).forEach(k => delete errors[k]);
    };
    const openNew = () => {
      Object.assign(form, { configId: null, siteNm: 'ShopJoy 01', vendorType: '', commRate: 10, settleCycle: '월정산', settleDay: 10, minSettleAmt: 10000, taxYn: 'Y', autoCloseYn: 'Y', useYn: 'Y', remark: '' });
      selectedId.value = '__new__';
      isNew.value = true;
      Object.keys(errors).forEach(k => delete errors[k]);
    };
    const closeForm = () => { selectedId.value = null; };

    const validate = () => {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!form.vendorType) errors.vendorType = '업체유형을 입력하세요.';
      if (form.commRate === '' || form.commRate === null) errors.commRate = '수수료율을 입력하세요.';
      if (!form.settleDay) errors.settleDay = '정산일을 입력하세요.';
      return Object.keys(errors).length === 0;
    };

    const doSave = async () => {
      if (!validate()) { props.showToast('입력 내용을 확인해주세요.', 'error'); return; }
      const ok = await props.showConfirm('저장', '정산기준을 저장하시겠습니까?');
      if (!ok) return;
      if (isNew.value) { form.configId = Date.now(); configs.push({ ...form }); }
      else { const idx = configs.findIndex(c => c.configId === form.configId); if (idx !== -1) Object.assign(configs[idx], { ...form }); }
      closeForm();
      try {
        const res = await (isNew.value ? window.adminApi.post('st/config', { ...form }) : window.adminApi.put(`st/config/${form.configId}`, { ...form }));
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('저장되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const doDelete = async (c) => {
      const ok = await props.showConfirm('삭제', `[${c.vendorType}] 정산기준을 삭제하시겠습니까?`);
      if (!ok) return;
      const idx = configs.findIndex(x => x.configId === c.configId); if (idx !== -1) configs.splice(idx, 1); if (selectedId.value === c.configId) closeForm();
      try {
        const res = await window.adminApi.delete(`st/config/${c.configId}`);
        if (props.setApiRes) props.setApiRes({ ok: true, status: res.status, data: res.data });
        if (props.showToast) props.showToast('삭제되었습니다.', 'success');
      } catch (err) {
        const errMsg = (err.response?.data?.message) || err.message || '오류가 발생했습니다.';
        if (props.setApiRes) props.setApiRes({ ok: false, status: err.response?.status, data: err.response?.data, message: err.message });
        if (props.showToast) props.showToast(errMsg, 'error', 0);
      }
    };

    const cycleBadge = s => ({ '월정산': 'badge-blue', '주정산': 'badge-green', '일정산': 'badge-orange' }[s] || 'badge-gray');

    return { descOpen, configs, selectedId, form, errors, isNew, openEdit, openNew, closeForm, doSave, doDelete, cycleBadge };
  },
  template: /* html */`
<div>
  <div class="page-title">정산기준관리</div>
  <div class="page-desc-bar">
    <span class="page-desc-summary">사이트·업체 유형별 정산 수수료율, 지급 주기, 최소 정산금액 등 정산 기준을 설정합니다.</span>
    <button class="page-desc-toggle" @click="descOpen=!descOpen">{{ descOpen ? '▲ 접기' : '▼ 더보기' }}</button>
    <div v-if="descOpen" class="page-desc-detail">• 정산 주기: 월정산 / 주정산 / 건별정산
• 수수료율(%)은 매출 기준으로 적용되며, 클레임 환불 시 차감됩니다.
• 자동마감(autoCloseYn=Y) 설정 시 지급일에 자동으로 정산이 마감됩니다.
• 설정 변경은 변경 이후 수집분부터 적용됩니다.</div>
  </div>
  <div class="card">
    <div class="toolbar">
      <span class="list-title">정산기준 목록</span>
      <span class="list-count">총 {{ configs.length }}건</span>
      <div style="margin-left:auto"><button class="btn btn-primary" @click="openNew">+ 기준 추가</button></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>사이트</th><th>업체유형</th><th>수수료율</th><th>정산주기</th><th>정산일</th><th>최소정산금</th><th>세금계산서</th><th>자동마감</th><th>사용여부</th><th>비고</th><th>액션</th></tr></thead>
      <tbody>
        <tr v-for="c in configs" :key="c.configId" :class="{selected: selectedId===c.configId}">
          <td>{{ c.siteNm }}</td>
          <td><strong>{{ c.vendorType }}</strong></td>
          <td><strong>{{ c.commRate }}%</strong></td>
          <td><span class="badge" :class="cycleBadge(c.settleCycle)">{{ c.settleCycle }}</span></td>
          <td>매월 {{ c.settleDay }}일</td>
          <td>{{ Number(c.minSettleAmt).toLocaleString() }}원</td>
          <td><span class="badge" :class="c.taxYn==='Y'?'badge-green':'badge-gray'">{{ c.taxYn==='Y'?'발행':'미발행' }}</span></td>
          <td><span class="badge" :class="c.autoCloseYn==='Y'?'badge-blue':'badge-gray'">{{ c.autoCloseYn==='Y'?'자동':'수동' }}</span></td>
          <td><span class="badge" :class="c.useYn==='Y'?'badge-green':'badge-gray'">{{ c.useYn==='Y'?'사용':'미사용' }}</span></td>
          <td style="color:#888;font-size:12px">{{ c.remark }}</td>
          <td class="actions">
            <button class="btn btn-sm btn-primary" @click="openEdit(c)">수정</button>
            <button class="btn btn-sm btn-danger"  @click="doDelete(c)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 편집 폼 -->
  <div v-if="selectedId" class="card" style="margin-top:12px">
    <div class="card-title" style="font-weight:700;margin-bottom:16px">{{ isNew ? '정산기준 추가' : '정산기준 수정' }}</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">업체유형 <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.vendorType}" v-model="form.vendorType" placeholder="예: 판매업체" />
        <div v-if="errors.vendorType" class="field-error">{{ errors.vendorType }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">수수료율(%) <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.commRate}" v-model.number="form.commRate" type="number" min="0" max="100" />
        <div v-if="errors.commRate" class="field-error">{{ errors.commRate }}</div>
      </div>
      <div class="form-group">
        <label class="form-label">정산주기</label>
        <select class="form-control" v-model="form.settleCycle">
          <option>일정산</option><option>주정산</option><option>월정산</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">정산일 <span style="color:red">*</span></label>
        <input class="form-control" :class="{'is-invalid':errors.settleDay}" v-model.number="form.settleDay" type="number" min="1" max="31" />
        <div v-if="errors.settleDay" class="field-error">{{ errors.settleDay }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">최소정산금(원)</label>
        <input class="form-control" v-model.number="form.minSettleAmt" type="number" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">세금계산서</label>
        <select class="form-control" v-model="form.taxYn"><option value="Y">발행</option><option value="N">미발행</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">자동마감</label>
        <select class="form-control" v-model="form.autoCloseYn"><option value="Y">자동</option><option value="N">수동</option></select>
      </div>
      <div class="form-group">
        <label class="form-label">사용여부</label>
        <select class="form-control" v-model="form.useYn"><option value="Y">사용</option><option value="N">미사용</option></select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">비고</label>
      <input class="form-control" v-model="form.remark" placeholder="비고 입력" />
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="doSave">저장</button>
      <button class="btn btn-secondary" @click="closeForm">취소</button>
    </div>
  </div>
</div>
`,
};
