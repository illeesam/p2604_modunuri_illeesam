/* ============================================
   PARTYROOM - PageBooking Component
   예약하기 페이지
   ============================================ */
window.PageBooking = {
  name: 'PageBooking',
  template: /* html */ `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="section-title gradient-gold mb-2">예약하기</h1>
        <p class="section-subtitle">원하는 공간을 간편하게 예약하세요</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 예약 폼 -->
        <div class="lg:col-span-2">
          <div class="card p-6 rounded-2xl" style="border-color:rgba(201,168,76,0.2)">
            <h2 class="font-black text-base mb-5" style="color:var(--gold)">📋 예약 신청서</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="form-label">예약자 이름</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="홍길동">
              </div>
              <div>
                <label class="form-label">연락처</label>
                <input v-model="form.tel" type="text" class="form-input" placeholder="010-9998-0857">
              </div>
              <div>
                <label class="form-label">이메일</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="email@example.com">
              </div>
              <div>
                <label class="form-label">공간 선택</label>
                <select v-model="form.room" class="form-input">
                  <option value="">공간을 선택하세요</option>
                  <option v-for="r in rooms" :key="r.id" :value="r.name">{{ r.name }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">이용 시작일</label>
                <input v-model="form.startDate" type="date" class="form-input">
              </div>
              <div>
                <label class="form-label">이용 종료일</label>
                <input v-model="form.endDate" type="date" class="form-input">
              </div>
              <div>
                <label class="form-label">시작 시간</label>
                <select v-model="form.startTime" class="form-input">
                  <option value="">선택</option>
                  <option v-for="t in times" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">종료 시간</label>
                <select v-model="form.endTime" class="form-input">
                  <option value="">선택</option>
                  <option v-for="t in times" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">이용 목적</label>
                <input v-model="form.purpose" type="text" class="form-input" placeholder="파티, 스터디, 회의 등">
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">인원 수</label>
                <input v-model="form.headcount" type="number" class="form-input" placeholder="예: 10" min="1">
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">요청 사항</label>
                <textarea v-model="form.memo" rows="3" class="form-input resize-none" placeholder="추가 요청 사항이 있으면 입력해주세요"></textarea>
              </div>
            </div>
            <button @click="submit" class="btn-gold w-full mt-5 py-3 rounded-lg font-bold">
              📅 예약 신청하기
            </button>
          </div>
        </div>

        <!-- 결제 안내 -->
        <div class="space-y-4">
          <div class="card p-5" style="border-color:rgba(201,168,76,0.25)">
            <h3 class="font-bold text-sm mb-4" style="color:var(--gold)">💳 결제 방법</h3>
            <div class="text-sm space-y-3" style="color:var(--text-secondary)">
              <div class="p-3 rounded-xl" style="background:var(--gold-dim)">
                <div class="font-bold mb-1" style="color:var(--gold)">계좌이체만 가능</div>
                <div class="font-mono text-xs" style="color:var(--text-primary)">기업은행<br>123-456789-01-234</div>
                <div class="text-xs mt-1" style="color:var(--text-muted)">(주)파티룸스페이스</div>
              </div>
              <div class="text-xs" style="color:var(--text-muted)">
                예약 확정 메일 수신 후 24시간 이내 입금해주세요.
                미입금 시 예약이 자동 취소됩니다.
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="font-bold text-sm mb-3" style="color:var(--text-primary)">📌 예약 안내</h3>
            <ul class="text-xs space-y-2" style="color:var(--text-secondary)">
              <li>• 예약 신청 후 담당자 확인 후 확정 연락</li>
              <li>• 최소 예약 단위: 1시간</li>
              <li>• 3일 이상 장기 할인 자동 적용</li>
              <li>• 취소: 7일 전 100% / 3일 전 50%</li>
            </ul>
          </div>

          <div class="card p-5">
            <h3 class="font-bold text-sm mb-3" style="color:var(--text-primary)">📞 문의</h3>
            <div class="text-xl font-black" style="color:var(--gold)">010-9998-0857</div>
            <div class="text-xs mt-1" style="color:var(--text-muted)">평일 09:00~20:00</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref } = Vue;
    const rooms = window.SITE_CONFIG.rooms;
    const times = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
    const form = ref({ name:'', tel:'', email:'', room:'', startDate:'', endDate:'', startTime:'', endTime:'', purpose:'', headcount:'', memo:'' });
    const submit = () => {
      if (!form.value.name || !form.value.room || !form.value.startDate) {
        return alert('예약자명, 공간, 이용 시작일은 필수 입력 항목입니다.');
      }
      alert('예약 신청이 완료되었습니다!\n담당자가 확인 후 연락드리겠습니다.\n기업은행 123-456789-01-234로 입금해주세요.');
    };
    return { rooms, times, form, submit };
  }
};
