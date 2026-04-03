/* ANYNURI - PageDetail (작품상세 + 데모 연결) */
window.PageDetail = {
  name: 'PageDetail',
  emits: ['navigate'],
  template: /* html */ `
    <div class="p-6 max-w-5xl mx-auto">
      <button @click="$emit('navigate', 'works')" class="flex items-center gap-2 text-xs mb-6 transition-colors"
              style="color:var(--text-muted)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        작품목록으로
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2">
          <!-- Hero image -->
          <div class="rounded-2xl overflow-hidden mb-6 relative"
               :style="'height:280px;background:'+work.bg+';display:flex;align-items:center;justify-content:center'">
            <span class="text-8xl">{{ work.emoji }}</span>
            <div class="absolute top-4 right-4 flex gap-2">
              <span class="tag-pill">{{ work.genre }}</span>
              <span v-if="work.awards.length" class="text-xs px-2 py-0.5 rounded-full font-bold"
                    style="background:var(--gold-dim);color:var(--gold);border:1px solid rgba(255,217,61,0.3)">🏆 수상작</span>
            </div>
          </div>

          <h1 class="text-3xl font-black gradient-text mb-2">{{ work.title }}</h1>
          <div class="flex flex-wrap gap-1 mb-4">
            <span v-for="t in work.tags" :key="t" class="tag-pill">{{ t }}</span>
          </div>
          <p class="text-sm leading-relaxed mb-6" style="color:var(--text-secondary)">{{ work.desc }}</p>

          <!-- Share button -->
          <button @click="shareWork(work)" title="공유하기"
            class="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 mb-3"
            style="background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);cursor:pointer;transition:all 0.2s;"
            @mouseenter="$event.currentTarget.style.borderColor='var(--sakura,#ff6b9d)'"
            @mouseleave="$event.currentTarget.style.borderColor='var(--border)'">
            📤 공유하기
          </button>
          <div v-if="shareToast" class="text-xs font-semibold mb-3" style="color:var(--sakura,#ff6b9d)">✅ 링크가 클립보드에 복사되었습니다.</div>

          <!-- Demo button -->
          <button @click="openDemo" class="btn-sakura px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 mb-6">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            미리보기 / 데모 보기
          </button>

          <!-- Awards -->
          <div v-if="work.awards.length" class="card p-5 rounded-2xl mb-4" style="border-color:rgba(255,217,61,0.2)">
            <h3 class="font-bold text-sm mb-3" style="color:var(--gold)">🏆 수상 내역</h3>
            <ul class="space-y-1.5">
              <li v-for="a in work.awards" :key="a" class="text-xs flex items-center gap-2" style="color:var(--text-secondary)">
                <span style="color:var(--gold)">✦</span>{{ a }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar info -->
        <div class="space-y-4">
          <div class="card p-5 rounded-2xl">
            <h3 class="font-bold text-sm mb-4 gradient-text">작품 정보</h3>
            <dl class="space-y-3 text-xs">
              <div class="flex justify-between">
                <dt style="color:var(--text-muted)">장르</dt><dd style="color:var(--text-primary)">{{ work.genre }}</dd>
              </div>
              <div class="flex justify-between">
                <dt style="color:var(--text-muted)">분량</dt><dd style="color:var(--text-primary)">{{ work.duration }}</dd>
              </div>
              <div class="flex justify-between">
                <dt style="color:var(--text-muted)">제작연도</dt><dd style="color:var(--text-primary)">{{ work.year }}</dd>
              </div>
            </dl>
          </div>

          <div class="card p-5 rounded-2xl" style="border-color:rgba(255,107,157,0.2)">
            <div class="text-3xl mb-3">✉️</div>
            <h3 class="font-bold text-sm mb-2" style="color:var(--text-primary)">비슷한 작품 의뢰</h3>
            <p class="text-xs mb-3" style="color:var(--text-secondary)">이런 스타일의 애니메이션을 원하신다면 지금 문의해 보세요.</p>
            <button @click="$emit('navigate', 'contact')" class="btn-outline w-full py-2 rounded-xl text-xs font-bold">의뢰 문의하기</button>
          </div>
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
  setup(props, { emit }) {
    const { ref, reactive } = Vue;
    const work = window.SITE_CONFIG.works[0];
    const shareToast = ref(false);
    const shareModal = ref(false);
    const shareData = reactive({ title: '', text: '', url: '' });

    const openDemo = () => {
      alert('데모 / 미리보기 페이지로 이동합니다.\n실제 서비스에서는 해당 작품 페이지로 연결됩니다.');
    };

    function shareWork(w) {
      const siteName = window.SITE_CONFIG?.site?.name || 'AnyNuri';
      shareData.title = `${siteName} - ${w.title}`;
      shareData.text = `[${siteName}] ${w.title}\n🎬 ${w.genre} · ${w.duration}\n${w.desc}`;
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

    return { work, openDemo, shareToast, shareModal, shareWork, shareViaKakao, copyLink };
  }
};
