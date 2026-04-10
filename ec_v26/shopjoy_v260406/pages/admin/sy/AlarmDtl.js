/* ShopJoy Admin - 알림관리 상세/등록 */
window.AlarmDtl = {
  name: 'AlarmDtl',
  props: ['navigate', 'adminData', 'showToast', 'editId'],
  setup(props) {
    const { reactive, computed, onMounted } = Vue;
    const isNew = computed(() => props.editId === null || props.editId === undefined);
    const siteName = computed(() => window.adminCommonFilter?.site?.siteName || 'ShopJoy');
    const form = reactive({
      title: '', alarmType: '푸시', targetType: '전체', targetId: '',
      message: '', sendDate: '', status: '임시',
    });

    onMounted(() => {
      if (!isNew.value) {
        const a = props.adminData.alarms.find(x => x.alarmId === props.editId);
        if (a) Object.assign(form, { ...a });
      }
    });

    const save = () => {
      if (!form.title.trim()) { props.showToast('제목을 입력해주세요.', 'error'); return; }
      if (!form.message.trim()) { props.showToast('메시지를 입력해주세요.', 'error'); return; }
      if (isNew.value) {
        props.adminData.alarms.unshift({
          ...form,
          alarmId: props.adminData.nextId(props.adminData.alarms, 'alarmId'),
          regDate: new Date().toISOString().slice(0, 10),
        });
        props.showToast('알림이 등록되었습니다.');
      } else {
        const idx = props.adminData.alarms.findIndex(x => x.alarmId === props.editId);
        if (idx !== -1) Object.assign(props.adminData.alarms[idx], form);
        props.showToast('저장되었습니다.');
      }
      props.navigate('syAlarmMng');
    };

    return { isNew, form, save, siteName };
  },
  template: /* html */`
<div>
  <div class="page-title">{{ isNew ? '알림 등록' : '알림 수정' }}</div>
  <div class="card">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">사이트명</label>
        <div class="readonly-field">{{ siteName }}</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" style="flex:2">
        <label class="form-label">제목 <span class="req">*</span></label>
        <input class="form-control" v-model="form.title" placeholder="알림 제목" />
      </div>
      <div class="form-group">
        <label class="form-label">유형</label>
        <select class="form-control" v-model="form.alarmType">
          <option>푸시</option><option>이메일</option><option>SMS</option><option>인앱</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-control" v-model="form.status">
          <option>임시</option><option>예약</option><option>발송완료</option><option>실패</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">대상 유형</label>
        <select class="form-control" v-model="form.targetType">
          <option>전체</option><option>VIP</option><option>우수</option><option>일반</option><option>특정회원</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">대상 ID</label>
        <input class="form-control" v-model="form.targetId" placeholder="특정회원 ID (선택)" />
      </div>
      <div class="form-group">
        <label class="form-label">발송일시</label>
        <input class="form-control" type="datetime-local" v-model="form.sendDate" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메시지 <span class="req">*</span></label>
      <textarea class="form-control" v-model="form.message" rows="4" placeholder="알림 메시지 내용"></textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary" @click="save">저장</button>
      <button class="btn btn-secondary" @click="navigate('syAlarmMng')">취소</button>
    </div>
  </div>
</div>
`
};
