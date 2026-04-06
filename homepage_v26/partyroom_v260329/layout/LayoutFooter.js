/* ============================================
   PARTYROOM - LayoutFooter Component
   ============================================ */
window.LayoutFooter = {
  name: 'LayoutFooter',
  emits: ['navigate'],
  template: /* html */ `
    <footer class="glass" style="border-top:1px solid var(--border);margin-top:auto">
      <div class="max-w-6xl mx-auto px-6 py-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                   style="background:linear-gradient(135deg,var(--gold),var(--gold-light));color:#0f1119">P</div>
              <span class="font-black text-sm" style="color:var(--gold)">파티룸 스페이스</span>
            </div>
            <p class="text-xs leading-relaxed" style="color:var(--text-muted)">
              프리미엄 공간 대여 서비스<br>파티 · 스터디 · 회의실
            </p>
            <div class="mt-3 text-xs" style="color:var(--text-muted)">
              <div>📞 010-9998-0857</div>
              <div class="mt-1">📧 korea98781@gmail.com</div>
            </div>
          </div>
          <!-- 공간 -->
          <div>
            <h4 class="font-bold text-sm mb-3" style="color:var(--text-primary)">공간</h4>
            <ul class="space-y-2 text-xs" style="color:var(--text-muted)">
              <li><a @click="$emit('navigate','products')" class="hover-gold cursor-pointer" style="transition:color 0.2s" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">상품 목록</a></li>
              <li><a @click="$emit('navigate','space')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">공간 안내</a></li>
              <li><a @click="$emit('navigate','about')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">상품 안내</a></li>
              <li><a @click="$emit('navigate','booking')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">예약하기</a></li>
            </ul>
          </div>
          <!-- 정보 -->
          <div>
            <h4 class="font-bold text-sm mb-3" style="color:var(--text-primary)">정보</h4>
            <ul class="space-y-2 text-xs" style="color:var(--text-muted)">
              <li><a @click="$emit('navigate','blog')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">블로그</a></li>
              <li><a @click="$emit('navigate','location')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">위치 안내</a></li>
              <li><a @click="$emit('navigate','contact')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">고객센터</a></li>
              <li><a @click="$emit('navigate','faq')" class="cursor-pointer" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">FAQ</a></li>
            </ul>
          </div>
          <!-- 계좌 -->
          <div>
            <h4 class="font-bold text-sm mb-3" style="color:var(--text-primary)">결제 안내</h4>
            <div class="p-3 rounded-xl text-xs" style="background:var(--gold-dim);border:1px solid rgba(201,168,76,0.2)">
              <div class="font-bold mb-1" style="color:var(--gold)">💳 계좌이체</div>
              <div style="color:var(--text-secondary)">{{ bank.name }}</div>
              <div class="font-mono font-bold mt-1" style="color:var(--text-primary)">{{ bank.account }}</div>
              <div style="color:var(--text-muted)">예금주: {{ bank.holder }}</div>
            </div>
          </div>
        </div>
        <div class="gold-divider mb-6"></div>
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p class="text-xs" style="color:var(--text-muted)">© 2026 파티룸 스페이스. All rights reserved.</p>
          <div class="flex gap-4 text-xs" style="color:var(--text-muted)">
            <a href="#" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">개인정보처리방침</a>
            <a href="#" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color=''">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  setup() {
    const bank = window.SITE_CONFIG.bank;
    return { bank };
  }
};
