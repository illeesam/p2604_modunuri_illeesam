/* CareMate - PageBooking */
window.PageBooking = {
  name: 'PageBooking',
  props: ['navigate', 'config', 'showAlert'],
  emits: [],
  template: /* html */ `
<div class="page-wrap">
  <div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:4px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);font-size:0.75rem;font-weight:700;margin-bottom:12px;">병원동행 예약</div>
    <h1 class="section-title" style="font-size:2rem;margin-bottom:8px;">병원동행 예약하기</h1>
    <p class="section-subtitle">아래 정보를 입력하시면 매니저가 배정됩니다</p>
  </div>

  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:start;" class="order-grid">
    <!-- 왼쪽: 예약 폼 -->
    <div style="display:flex;flex-direction:column;gap:16px;">

      <!-- 1. 신청자 정보 -->
      <div class="order-section">
        <div class="order-section-title"><span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">1</span> 신청자 정보</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div>
            <label class="form-label">이름 <span class="form-required">*</span></label>
            <input v-model="booking.name" @input="clearBookingError('name')" type="text" placeholder="홍길동" class="form-input">
            <div v-if="bookingErrors.name" class="form-error">{{ bookingErrors.name }}</div>
          </div>
          <div>
            <label class="form-label">연락처 <span class="form-required">*</span></label>
            <input v-model="booking.tel" @input="clearBookingError('tel')" type="tel" placeholder="010-9998-0857" class="form-input">
            <div v-if="bookingErrors.tel" class="form-error">{{ bookingErrors.tel }}</div>
          </div>
          <div style="grid-column:span 2;">
            <label class="form-label">이메일</label>
            <input v-model="booking.email" type="email" placeholder="example@email.com" class="form-input">
          </div>
        </div>
      </div>

      <!-- 2. 병원 정보 -->
      <div class="order-section">
        <div class="order-section-title"><span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">2</span> 병원 정보</div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <label class="form-label">병원 선택 <span class="form-required">*</span></label>
            <select v-model="booking.hospital" @change="clearBookingError('hospital')" class="form-input">
              <option value="">병원을 선택하세요</option>
              <option v-for="c in hospitalCodes" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <div v-if="bookingErrors.hospital" class="form-error">{{ bookingErrors.hospital }}</div>
          </div>
          <div v-if="booking.hospital==='동네 의원 (직접입력)'">
            <label class="form-label">병원명 직접 입력</label>
            <input v-model="booking.hospitalDirect" type="text" placeholder="○○병원 / ○○의원" class="form-input">
          </div>
          <div>
            <label class="form-label">진료과목 <span class="form-required">*</span></label>
            <select v-model="booking.department" @change="clearBookingError('department')" class="form-input">
              <option value="">진료과목을 선택하세요</option>
              <option v-for="c in departmentCodes" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
            <div v-if="bookingErrors.department" class="form-error">{{ bookingErrors.department }}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label class="form-label">예약 날짜 <span class="form-required">*</span></label>
              <input v-model="booking.appointmentDate" @input="clearBookingError('appointmentDate')" type="date" class="form-input">
              <div v-if="bookingErrors.appointmentDate" class="form-error">{{ bookingErrors.appointmentDate }}</div>
            </div>
            <div>
              <label class="form-label">예약 시간 <span class="form-required">*</span></label>
              <input v-model="booking.appointmentTime" @input="clearBookingError('appointmentTime')" type="time" class="form-input">
              <div v-if="bookingErrors.appointmentTime" class="form-error">{{ bookingErrors.appointmentTime }}</div>
            </div>
          </div>
          <div>
            <label class="form-label">진료 예상 시간</label>
            <select v-model="booking.expectedDuration" class="form-input">
              <option v-for="c in durationCodes" :key="c.codeId + '-' + c.codeValue" :value="c.codeValue">{{ c.codeLabel }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 3. 환자 상태 -->
      <div class="order-section">
        <div class="order-section-title"><span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">3</span> 환자 상태 <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted);">(해당 항목 모두 선택)</span></div>
        <div class="patient-status-grid">
          <label class="status-check-card" :class="{checked:booking.patientSelfWalk}">
            <input type="checkbox" v-model="booking.patientSelfWalk"><span style="font-size:1.2rem;">🚶</span>
            <div><div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">자가보행 가능</div><div style="font-size:0.72rem;color:var(--text-muted);">혼자 걸을 수 있음</div></div>
          </label>
          <label class="status-check-card" :class="{checked:booking.patientBed}">
            <input type="checkbox" v-model="booking.patientBed"><span style="font-size:1.2rem;">🛏️</span>
            <div><div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">침대 이동 필요</div><div style="font-size:0.72rem;color:var(--text-muted);">들것/침대로 이동</div></div>
          </label>
          <label class="status-check-card" :class="{checked:booking.patientWheelchair}">
            <input type="checkbox" v-model="booking.patientWheelchair"><span style="font-size:1.2rem;">🦽</span>
            <div><div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">휠체어 사용</div><div style="font-size:0.72rem;color:var(--text-muted);">휠체어 이동 보조 필요</div></div>
          </label>
          <label class="status-check-card" :class="{checked:booking.patientDevice}">
            <input type="checkbox" v-model="booking.patientDevice"><span style="font-size:1.2rem;">🩺</span>
            <div><div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">기타 의료기기</div><div style="font-size:0.72rem;color:var(--text-muted);">산소통·IV 등 사용</div></div>
          </label>
        </div>
        <div v-if="booking.patientDevice" style="margin-top:12px;">
          <label class="form-label">의료기기 상세</label>
          <input v-model="booking.patientDeviceNote" type="text" placeholder="예: 산소통 2L, 휴대용 혈당기 등" class="form-input">
        </div>
      </div>

      <!-- 4. 옵션 -->
      <div class="order-section">
        <div class="order-section-title"><span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">4</span> 서비스 옵션</div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-check" style="align-items:flex-start;gap:10px;padding:14px;border:1.5px solid var(--border);border-radius:10px;" :style="booking.needManager?'border-color:var(--blue);background:var(--blue-dim);':''">
              <input type="checkbox" v-model="booking.needManager" style="margin-top:2px;accent-color:var(--blue);width:16px;height:16px;">
              <div>
                <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary);">🧑‍⚕️ 매니저 역할 수행</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">의료진 소통 보조, 처방전·약 수령, 진료 내용 메모 등</div>
              </div>
            </label>
            <div v-if="booking.needManager" style="margin-top:10px;">
              <label class="form-label">매니저 역할 요청 사항</label>
              <input v-model="booking.managerNote" type="text" placeholder="예: 처방전 수령 후 약국 동행 부탁드립니다" class="form-input">
            </div>
          </div>
          <div>
            <label class="form-check" style="align-items:flex-start;gap:10px;padding:14px;border:1.5px solid var(--border);border-radius:10px;" :style="booking.useVehicle?'border-color:var(--teal);background:var(--teal-dim);':''">
              <input type="checkbox" v-model="booking.useVehicle" style="margin-top:2px;accent-color:var(--teal);width:16px;height:16px;">
              <div>
                <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary);">🚗 차량 이용 (별도 요금)</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:3px;">리프트 차량 포함 픽업·드롭 서비스 (PREMIUM 이상)</div>
              </div>
            </label>
            <div v-if="booking.useVehicle" style="margin-top:10px;">
              <label class="form-label">픽업 주소</label>
              <input v-model="booking.vehicleNote" type="text" placeholder="픽업 주소를 입력해주세요" class="form-input">
            </div>
          </div>
        </div>
      </div>

      <!-- 5. 서비스 선택 -->
      <div class="order-section">
        <div class="order-section-title">
          <span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">5</span> 서비스 선택
          <span style="font-size:0.72rem;font-weight:400;color:var(--teal);">환자 상태에 따라 자동 추천됩니다</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="p in hospitalProducts" :key="p.productId"
            @click="booking.productId=p.productId"
            style="padding:14px 16px;border-radius:12px;cursor:pointer;transition:all 0.2s;"
            :style="booking.productId===p.productId?'border:2px solid var(--blue);background:var(--blue-dim);':'border:1.5px solid var(--border);background:var(--bg-card);'">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span style="font-size:1.4rem;">{{ p.emoji }}</span>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:0.875rem;font-weight:700;color:var(--text-primary);">{{ p.productName }}</span>
                  <span v-if="p.productId===recommendedProductId" class="badge badge-teal" style="font-size:0.62rem;">자동 추천</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">{{ p.price }} · {{ p.priceNote }}</div>
              </div>
              <div style="width:18px;height:18px;border-radius:50%;border:2px solid var(--blue);display:flex;align-items:center;justify-content:center;">
                <div v-if="booking.productId===p.productId" style="width:10px;height:10px;border-radius:50%;background:var(--blue);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. 기타 요청 -->
      <div class="order-section">
        <div class="order-section-title"><span style="background:var(--blue);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">6</span> 기타 요청사항</div>
        <textarea v-model="booking.note" rows="3" placeholder="추가 요청 사항이 있으시면 자유롭게 입력해주세요." class="form-input" style="resize:vertical;"></textarea>
      </div>

      <button @click="submitBooking" class="btn-blue" style="padding:15px;font-size:0.95rem;width:100%;">🏥 병원동행 예약 신청하기</button>
    </div>

    <!-- 오른쪽: 안내 -->
    <div style="display:flex;flex-direction:column;gap:16px;position:sticky;top:80px;">
      <!-- 선택된 서비스 요약 -->
      <div class="booking-highlight">
        <div style="font-size:0.75rem;font-weight:700;color:var(--blue);margin-bottom:10px;">📋 선택 서비스 요약</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">
          {{ hospitalProducts.find(p=>p.productId===booking.productId)?.productName || '선택 안됨' }}
        </div>
        <div style="font-size:0.9rem;font-weight:700;color:var(--blue);margin-top:4px;">
          {{ hospitalProducts.find(p=>p.productId===booking.productId)?.price }}
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
          {{ hospitalProducts.find(p=>p.productId===booking.productId)?.priceNote }}
        </div>
        <div v-if="booking.hospital" style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(26,115,232,0.15);font-size:0.8rem;color:var(--text-secondary);">
          🏥 {{ selectedHospital || booking.hospital }}<br>
          <span v-if="booking.department">🩺 {{ booking.department }}</span><br>
          <span v-if="booking.appointmentDate">📅 {{ booking.appointmentDate }} {{ booking.appointmentTime }}</span>
        </div>
      </div>

      <!-- 계좌이체 안내 -->
      <div class="account-box">
        <div style="font-size:0.75rem;font-weight:700;color:var(--blue);margin-bottom:10px;">💳 결제 안내 (계좌이체)</div>
        <div style="font-size:0.85rem;color:var(--text-primary);line-height:2;">
          <div><strong>은행:</strong> {{ config.bankName }}</div>
          <div><strong>계좌:</strong> {{ config.bankAccount }}</div>
          <div><strong>예금주:</strong> {{ config.bankHolder }}</div>
        </div>
        <div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(26,115,232,0.08);font-size:0.75rem;color:var(--text-secondary);line-height:1.7;">
          📌 예약 확정 연락 후 서비스 1일 전까지 입금 바랍니다.<br>입금 확인 후 매니저가 배정됩니다.
        </div>
      </div>

      <!-- 안내 -->
      <div class="card" style="padding:20px;">
        <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);margin-bottom:12px;">📞 즉시 상담</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--blue);margin-bottom:6px;">{{ config.tel }}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.7;">평일 09:00 ~ 18:00<br>긴급 상황은 24시간 연락 가능</div>
        <button @click="navigate('contact')" class="btn-outline btn-sm" style="width:100%;margin-top:12px;">문의하기</button>
      </div>
    </div>
  </div>
</div>
`,
  setup(props) {
    const { reactive, computed, watch } = Vue;

    const products = window.SITE_CONFIG.products;

    const booking = reactive({
      name: '', tel: '', email: '',
      hospital: '', hospitalDirect: '', department: '',
      appointmentDate: '', appointmentTime: '',
      expectedDuration: '1',
      useVehicle: false, vehicleNote: '',
      patientSelfWalk: false, patientBed: false, patientWheelchair: false, patientDevice: false, patientDeviceNote: '',
      needManager: false, managerNote: '',
      productId: 1, note: '',
    });
    const bookingErrors = reactive({});
    const clearBookingError = k => { if (bookingErrors[k] !== undefined) delete bookingErrors[k]; };

    const selectedHospital = computed(() => booking.hospital === '동네 의원 (직접입력)' ? booking.hospitalDirect : booking.hospital);

    const recommendedProductId = computed(() => {
      if (booking.patientBed || booking.patientDevice) return 4;
      if (booking.patientWheelchair) return 3;
      if (booking.needManager) return 2;
      return 1;
    });
    watch(recommendedProductId, id => { booking.productId = id; });

    const hospitalProducts = computed(() => products.filter(p => p.categoryId === 'hospital'));

    const hospitalCodes = computed(() =>
      window.cmUtil.codesByGroupOrStringList(props.config, 'caremate_hospital', props.config.hospitals)
    );
    const departmentCodes = computed(() =>
      window.cmUtil.codesByGroupOrStringList(props.config, 'caremate_department', props.config.departments)
    );
    const durationCodes = computed(() =>
      window.cmUtil.codesByGroupOrRows(props.config, 'caremate_visit_duration', [
        { codeId: 1, codeValue: '0.5', codeLabel: '30분 이내' },
        { codeId: 2, codeValue: '1', codeLabel: '1시간 내외' },
        { codeId: 3, codeValue: '2', codeLabel: '2시간 내외' },
        { codeId: 4, codeValue: '3', codeLabel: '3시간 이상' },
        { codeId: 5, codeValue: 'unknown', codeLabel: '예측 불가' },
      ])
    );

    let bookingSchemaPromise = null;
    const getBookingSchema = () => {
      if (!bookingSchemaPromise) {
        bookingSchemaPromise = import('https://cdn.jsdelivr.net/npm/yup@1.4.0/+esm').then(yup =>
          yup.object({
            name:            yup.string().required('이름을 입력해주세요').min(2, '최소 2자 이상'),
            tel:             yup.string().required('연락처를 입력해주세요'),
            hospital:        yup.string().required('병원을 선택해주세요'),
            department:      yup.string().required('진료과목을 선택해주세요'),
            appointmentDate: yup.string().required('예약 날짜를 선택해주세요'),
            appointmentTime: yup.string().required('예약 시간을 입력해주세요'),
          })
        );
      }
      return bookingSchemaPromise;
    };

    const submitBooking = async () => {
      Object.keys(bookingErrors).forEach(k => delete bookingErrors[k]);
      try {
        const schema = await getBookingSchema();
        const payload = { name: booking.name, tel: booking.tel, hospital: booking.hospital || booking.hospitalDirect, department: booking.department, appointmentDate: booking.appointmentDate, appointmentTime: booking.appointmentTime };
        await schema.validate(payload, { abortEarly: false });
        if (window.axiosApi) {
          await window.axiosApi.post('booking-intake.json', { source: 'caremate', kind: 'hospital-booking', ...booking, hospital: selectedHospital.value }).catch(() => {});
        }
        await props.showAlert(
          '예약 신청 완료 🏥',
          `병원동행 예약이 접수되었습니다.\n\n담당 매니저가 1~2시간 내 연락드립니다.\n연락처: ${booking.tel}\n\n✅ 계좌이체 안내는 확인 연락 후 전달드립니다.`,
          'success'
        );
        Object.assign(booking, { name: '', tel: '', email: '', hospital: '', hospitalDirect: '', department: '', appointmentDate: '', appointmentTime: '', expectedDuration: '1', useVehicle: false, vehicleNote: '', patientSelfWalk: false, patientBed: false, patientWheelchair: false, patientDevice: false, patientDeviceNote: '', needManager: false, managerNote: '', productId: 1, note: '' });
      } catch (e) {
        if (e.inner && e.inner.length) e.inner.forEach(err => { if (err.path) bookingErrors[err.path] = err.message; });
        else if (e.path) bookingErrors[e.path] = e.message;
      }
    };

    return {
      booking, bookingErrors, clearBookingError, submitBooking,
      selectedHospital, recommendedProductId, hospitalProducts,
      hospitalCodes, departmentCodes, durationCodes,
    };
  }
};
