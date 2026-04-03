/* ANYNURI - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  emits: ['navigate'],
  template: /* html */ `
    <footer class="glass border-t text-center py-5 px-6 flex-shrink-0" style="border-color:var(--border)">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🎬</span>
            <span class="font-black gradient-text text-base">AnyNuri</span>
          </div>
          <div class="flex flex-wrap gap-4 text-xs" style="color:var(--text-muted)">
            <button @click="$emit('navigate', 'about')" class="hover:text-sakura transition-colors" style="--sakura:var(--sakura)">회사소개</button>
            <button @click="$emit('navigate', 'works')" class="hover:text-sakura transition-colors">작품소개</button>
            <button @click="$emit('navigate', 'contact')" class="hover:text-sakura transition-colors">의뢰하기</button>
            <button @click="$emit('navigate', 'faq')" class="hover:text-sakura transition-colors">FAQ</button>
          </div>
        </div>
        <p class="text-xs" style="color:var(--text-muted)">
          © 2026 AnyNuri Animation Studio. All rights reserved. | hello@anynuri.kr
        </p>
      </div>
    </footer>
  `
};
