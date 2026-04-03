/* ============================================
   PARTYROOM - PageDetail Component
   상품상세 페이지
   ============================================ */
window.PageDetail = {
  name: 'PageDetail',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <button @click="$emit('navigate','products')"
              class="flex items-center gap-2 text-xs mb-6 hover:opacity-80 transition-opacity"
              style="color:var(--text-secondary)">
        ← 상품 목록으로
      </button>

      <!-- Room Selector -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button v-for="room in rooms" :key="room.roomId"
                @click="selected = room"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                :style="selected.roomId===room.roomId
                  ? 'background:var(--gold);color:#0f1119'
                  : 'background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border)'">
          {{ room.roomName }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 썸네일 -->
        <div>
          <div class="room-thumb rounded-2xl mb-4" style="height:240px;font-size:6rem">
            {{ selected.emoji }}
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div v-for="i in 3" :key="i" class="room-thumb rounded-xl" style="height:80px;font-size:2rem">
              {{ selected.emoji }}
            </div>
          </div>
        </div>

        <!-- 상세 정보 -->
        <div>
          <div class="flex items-start justify-between mb-3">
            <h1 class="text-2xl font-black" style="color:var(--text-primary)">{{ selected.roomName }}</h1>
            <span class="badge badge-purple">{{ selected.area }}</span>
          </div>

          <div class="flex flex-wrap gap-1 mb-4">
            <span v-for="tag in selected.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <!-- 기본 정보 -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="card p-3 text-center">
              <div class="text-xs mb-1" style="color:var(--text-muted)">수용 인원</div>
              <div class="font-bold text-sm" style="color:var(--text-primary)">{{ selected.capacity }}</div>
            </div>
            <div class="card p-3 text-center">
              <div class="text-xs mb-1" style="color:var(--text-muted)">면적</div>
              <div class="font-bold text-sm" style="color:var(--text-primary)">{{ selected.area }}</div>
            </div>
          </div>

          <!-- 편의시설 -->
          <div class="mb-6">
            <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">편의 시설</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="f in selected.features" :key="f"
                    class="tag">✓ {{ f }}</span>
            </div>
          </div>

          <!-- 가격표 -->
          <div class="card p-5 mb-5" style="border-color:rgba(201,168,76,0.2)">
            <h3 class="font-bold text-sm mb-4" style="color:var(--gold)">💰 이용 요금</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center text-sm">
                <span style="color:var(--text-secondary)">시간당 (1시간)</span>
                <span class="font-bold" style="color:var(--gold)">{{ selected.hourly.toLocaleString() }}원</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span style="color:var(--text-secondary)">1일 (8시간)</span>
                <span class="font-bold" style="color:var(--gold)">{{ selected.daily.toLocaleString() }}원</span>
              </div>
              <div class="gold-divider"></div>
              <div v-for="d in discounts" :key="d.days" class="flex justify-between items-center text-sm">
                <span style="color:var(--text-secondary)">{{ d.days }} 이용</span>
                <span class="badge badge-gold">{{ d.rate }}</span>
              </div>
            </div>
          </div>

          <!-- 결제 안내 -->
          <div class="p-4 rounded-xl mb-5 text-xs"
               style="background:var(--gold-dim);border:1px solid rgba(201,168,76,0.2);color:var(--text-secondary)">
            💳 결제 방법: 계좌이체<br>
            기업은행 123-456789-01-234 (주)파티룸스페이스<br>
            <span style="color:var(--text-muted)">예약 확정 후 24시간 이내 입금</span>
          </div>

          <button @click="$emit('navigate','booking')" class="btn-gold w-full py-3 rounded-lg text-sm font-bold">
            📅 이 공간 예약하기
          </button>
          <button @click="shareRoom(selected)" title="공유하기"
            class="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2"
            style="background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);cursor:pointer;transition:all 0.2s;"
            @mouseenter="$event.currentTarget.style.borderColor='var(--gold)'"
            @mouseleave="$event.currentTarget.style.borderColor='var(--border)'">
            📤 공유하기
          </button>
          <div v-if="shareToast" class="text-xs text-center mt-2 font-semibold" style="color:var(--gold)">✅ 링크가 클립보드에 복사되었습니다.</div>
        </div>
      </div>
    </div>

    <!-- Share Modal (bottom sheet) -->
    <div v-if="shareModal" @click.self="shareModal=false"
      style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;justify-content:center;">
      <div style="background:var(--bg-card);border-radius:20px 20px 0 0;padding:28px 24px 44px;width:100%;max-width:480px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <span style="font-weight:700;font-size:1rem;color:var(--text-primary);">공유하기</span>
          <button @click="shareModal=false" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);padding:0;line-height:1;">✕</button>
        </div>
        <div style="display:flex;gap:24px;justify-content:center;">
          <button @click="shareViaKakao" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">
            <div style="width:60px;height:60px;border-radius:16px;background:#FEE500;display:flex;align-items:center;justify-content:center;font-size:2rem;">💬</div>
            <span style="font-size:0.78rem;color:var(--text-secondary);font-weight:500;">카카오톡</span>
          </button>
          <button @click="copyLink" style="display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;">
            <div style="width:60px;height:60px;border-radius:16px;background:var(--bg-card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:2rem;">🔗</div>
            <span style="font-size:0.78rem;color:var(--text-secondary);font-weight:500;">링크 복사</span>
          </button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { ref, reactive } = Vue;
    const rooms = window.SITE_CONFIG.rooms;
    const discounts = window.SITE_CONFIG.discounts;
    const selected = ref(rooms[0]);
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    function shareRoom(room) {
      const siteName = window.SITE_CONFIG?.name || '파티룸 스페이스';
      shareData.title = `${siteName} - ${room.roomName}`;
      shareData.text = `[${siteName}] ${room.roomName}\n💰 시간당 ${room.hourly.toLocaleString()}원 / 1일 ${room.daily.toLocaleString()}원\n👥 수용 인원: ${room.capacity} · 면적: ${room.area}`;
      shareData.url = window.location.href;

      if (window.isSecureContext && navigator.share) {
        navigator.share({ title: shareData.title, text: shareData.text, url: shareData.url })
          .catch(() => { shareModal.value = true; });
      } else {
        shareModal.value = true;
      }
    }

    function shareViaKakao() {
      const fullText = shareData.text + '\n🔗 ' + shareData.url;
      window.location.href = 'kakaotalk://msg/send?text=' + encodeURIComponent(fullText);
      setTimeout(() => { shareModal.value = false; }, 300);
    }

    function copyLink() {
      const fullText = shareData.text + '\n🔗 ' + shareData.url;
      navigator.clipboard.writeText(fullText).then(() => {
        shareModal.value = false;
        shareToast.value = true;
        setTimeout(() => { shareToast.value = false; }, 3000);
      }).catch(() => {
        prompt('아래 내용을 복사하세요:', fullText);
        shareModal.value = false;
      });
    }

    return { rooms, discounts, selected, shareToast, shareModal, shareRoom, shareViaKakao, copyLink };
  }
};
