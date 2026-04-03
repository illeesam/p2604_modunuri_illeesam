/* HOME - AppFooter */
window.AppFooter = {
  name: 'AppFooter',
  emits: ['navigate'],
  template: /* html */ `
    <footer class="glass" style="border-top:1px solid var(--border);margin-top:auto">
      <div class="max-w-6xl mx-auto px-6 py-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center"
                   style="background:linear-gradient(135deg,#10b981,#f59e0b);color:#111827">S</div>
              <span class="font-black gradient-text">STUDIO</span>
            </div>
            <p class="text-xs leading-relaxed mb-3" style="color:var(--text-muted)">창의적 솔루션으로 비즈니스의 디지털 전환을 이끕니다.</p>
          </div>
          <div>
            <h4 class="font-bold text-sm mb-3" style="color:var(--text-primary)">서비스</h4>
            <ul class="space-y-2 text-xs" style="color:var(--text-muted)">
              <li><a @click="$emit('navigate','services')" class="cursor-pointer hover:text-emerald-400 transition-colors">웹 개발</a></li>
              <li><a @click="$emit('navigate','services')" class="cursor-pointer hover:text-emerald-400 transition-colors">모바일 앱</a></li>
              <li><a @click="$emit('navigate','services')" class="cursor-pointer hover:text-emerald-400 transition-colors">UI/UX 디자인</a></li>
              <li><a @click="$emit('navigate','portfolio')" class="cursor-pointer hover:text-emerald-400 transition-colors">포트폴리오</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-sm mb-3" style="color:var(--text-primary)">연락처</h4>
            <div class="space-y-2 text-xs" style="color:var(--text-muted)">
              <div>📞 02-0000-0000</div>
              <div>📧 hello@studio.kr</div>
              <div>📍 서울시 마포구 합정동</div>
            </div>
          </div>
        </div>
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.2),transparent)" class="mb-6"></div>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p class="text-xs" style="color:var(--text-muted)">© 2026 STUDIO. All rights reserved.</p>
          <div class="flex gap-4 text-xs" style="color:var(--text-muted)">
            <a href="#" class="hover:text-emerald-400 transition-colors">개인정보처리방침</a>
            <a href="#" class="hover:text-emerald-400 transition-colors">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  setup() { return {}; }
};
