/* PARTYROOM — booking (index.html 분리) */
(function (g) {
  g.PartyroomPages = g.PartyroomPages || {};
  g.PartyroomPages.Booking = {
    name: 'Booking',
    inject: ['partyroom'],
    template: `
<div class="fade-up" style="padding:2rem 1.5rem;max-width:800px;margin:0 auto;">
        <div style="margin-bottom:2rem;">
          <h1 class="section-title">예약하기</h1>
          <p class="section-subtitle">원하시는 공간과 날짜를 선택하고 예약을 신청하세요.</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 280px;gap:1.5rem;align-items:start;" class="booking-layout">
          <!-- Main form -->
          <div class="card" style="padding:1.75rem;">
            <div style="display:flex;flex-direction:column;gap:16px;">

              <!-- Room select -->
              <div>
                <label class="form-label">공간 선택<span class="form-required">*</span></label>
                <select class="form-input" v-model="partyroom.booking.room" @change="partyroom.clearBookingError('room')">
                  <option value="">-- 공간을 선택해주세요 --</option>
                  <option v-for="room in partyroom.rooms" :key="room.roomId" :value="room.roomId">
                    {{ room.emoji }} {{ room.roomName }} ({{ room.capacity }} · {{ room.area }})
                  </option>
                </select>
                <div class="form-error" v-if="partyroom.bookingErrors.room">{{ partyroom.bookingErrors.room }}</div>
              </div>

              <!-- Rental type -->
              <div>
                <label class="form-label">대여 유형<span class="form-required">*</span></label>
                <div style="display:flex;gap:10px;">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.875rem;color:var(--text-secondary);">
                    <input type="radio" v-model="partyroom.booking.rentalType" value="hourly" style="accent-color:var(--gold);" />
                    시간 단위
                  </label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.875rem;color:var(--text-secondary);">
                    <input type="radio" v-model="partyroom.booking.rentalType" value="daily" style="accent-color:var(--gold);" />
                    일 단위
                  </label>
                </div>
              </div>

              <!-- Date -->
              <div>
                <label class="form-label">이용 날짜<span class="form-required">*</span></label>
                <input class="form-input" type="date" v-model="partyroom.booking.date" @input="partyroom.clearBookingError('date')" />
                <div class="form-error" v-if="partyroom.bookingErrors.date">{{ partyroom.bookingErrors.date }}</div>
              </div>

              <!-- Time (hourly) -->
              <div v-if="partyroom.booking.rentalType === 'hourly'">
                <label class="form-label">시작 시간</label>
                <input class="form-input" type="time" v-model="partyroom.booking.startTime" />
              </div>

              <!-- Duration -->
              <div>
                <label class="form-label">
                  {{ partyroom.booking.rentalType === 'hourly' ? '이용 시간 (시간)' : '이용 기간 (일)' }}<span class="form-required">*</span>
                </label>
                <div style="display:flex;align-items:center;gap:10px;">
                  <button
                    class="btn-outline"
                    style="padding:6px 14px;font-size:1rem;"
                    @click="partyroom.booking.rentalType === 'hourly' ? (partyroom.booking.hours = Math.max(1, partyroom.booking.hours-1)) : (partyroom.booking.days = Math.max(1, partyroom.booking.days-1))"
                  >−</button>
                  <span style="font-size:1.1rem;font-weight:700;color:var(--text-primary);min-width:32px;text-align:center;">
                    {{ partyroom.booking.rentalType === 'hourly' ? partyroom.booking.hours : partyroom.booking.days }}
                  </span>
                  <button
                    class="btn-outline"
                    style="padding:6px 14px;font-size:1rem;"
                    @click="partyroom.booking.rentalType === 'hourly' ? partyroom.booking.hours++ : partyroom.booking.days++"
                  >+</button>
                  <span style="font-size:0.82rem;color:var(--text-muted);">
                    {{ partyroom.booking.rentalType === 'hourly' ? '시간' : '일' }}
                  </span>
                </div>
              </div>

              <div class="divider"></div>

              <!-- Name -->
              <div>
                <label class="form-label">예약자명<span class="form-required">*</span></label>
                <input class="form-input" v-model="partyroom.booking.name" placeholder="홍길동" @input="partyroom.clearBookingError('name')" />
                <div class="form-error" v-if="partyroom.bookingErrors.name">{{ partyroom.bookingErrors.name }}</div>
              </div>

              <!-- Tel -->
              <div>
                <label class="form-label">연락처<span class="form-required">*</span></label>
                <input class="form-input" v-model="partyroom.booking.tel" placeholder="010-9998-0857" @input="partyroom.clearBookingError('tel')" />
                <div class="form-error" v-if="partyroom.bookingErrors.tel">{{ partyroom.bookingErrors.tel }}</div>
              </div>

              <!-- Email -->
              <div>
                <label class="form-label">이메일<span class="form-required">*</span></label>
                <input class="form-input" type="email" v-model="partyroom.booking.email" placeholder="example@email.com" @input="partyroom.clearBookingError('email')" />
                <div class="form-error" v-if="partyroom.bookingErrors.email">{{ partyroom.bookingErrors.email }}</div>
              </div>

              <!-- Note -->
              <div>
                <label class="form-label">요청 사항</label>
                <textarea
                  class="form-input"
                  v-model="partyroom.booking.note"
                  rows="3"
                  placeholder="특별 요청사항이 있으시면 적어주세요."
                  style="resize:vertical;"
                ></textarea>
              </div>

              <button class="btn-gold" style="width:100%;justify-content:center;padding:13px;font-size:0.95rem;" @click="partyroom.submitBooking">
                예약 신청하기
              </button>
            </div>
          </div>

          <!-- Summary sidebar -->
          <div style="display:flex;flex-direction:column;gap:1rem;position:sticky;top:calc(var(--header-h) + 16px);">
            <!-- Selected room info -->
            <div class="card" style="padding:1.25rem;">
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:10px;font-size:0.88rem;">선택된 공간</div>
              <div v-if="partyroom.booking.room">
                <div v-for="room in partyroom.rooms.filter(r => r.roomId === Number(partyroom.booking.room))" :key="room.roomId">
                  <div style="font-size:2rem;margin-bottom:6px;">{{ room.emoji }}</div>
                  <div style="font-weight:700;color:var(--text-primary);">{{ room.roomName }}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">{{ room.capacity }} · {{ room.area }}</div>
                </div>
              </div>
              <div v-else style="font-size:0.82rem;color:var(--text-muted);">공간을 선택해주세요</div>
            </div>

            <!-- Price summary -->
            <div class="card" style="padding:1.25rem;background:var(--gold-dim);border-color:rgba(201,168,76,0.3);">
              <div style="font-weight:700;color:var(--gold);margin-bottom:12px;font-size:0.88rem;">예상 금액</div>
              <div v-if="partyroom.bookingTotal > 0">
                <div style="font-size:1.6rem;font-weight:900;color:var(--text-primary);">
                  {{ partyroom.bookingTotal.toLocaleString() }}<span style="font-size:0.9rem;font-weight:500;color:var(--text-muted);">원</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;">
                  <span v-if="partyroom.booking.rentalType === 'hourly'">{{ partyroom.booking.hours }}시간 기준</span>
                  <span v-else>{{ partyroom.booking.days }}일 기준
                    <span v-if="partyroom.booking.days >= 3" class="discount-badge" style="margin-left:4px;font-size:0.68rem;">
                      {{ partyroom.booking.days >= 14 ? '30%' : partyroom.booking.days >= 7 ? '20%' : '10%' }} 할인 적용
                    </span>
                  </span>
                </div>
              </div>
              <div v-else style="font-size:0.82rem;color:var(--text-muted);">공간 및 기간 선택 후 표시됩니다.</div>
            </div>

            <!-- Payment notice -->
            <div class="card" style="padding:1.25rem;">
              <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:0.85rem;">💳 결제 안내</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.7;">
                계좌이체만 가능합니다.<br>
                예약 확정 후 24시간 이내 입금<br><br>
                <strong style="color:var(--text-primary);">{{ partyroom.config.bank.name }}</strong><br>
                {{ partyroom.config.bank.account }}<br>
                {{ partyroom.config.bank.holder }}
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})(window);
