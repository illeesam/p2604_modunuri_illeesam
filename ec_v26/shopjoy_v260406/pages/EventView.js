/* ShopJoy - EventView (이벤트 상세) */
window.EventView = {
  name: 'EventView',
  props: ['navigate', 'config', 'editId'],
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const events = [
      { id: 1, title: '봄 베스트 상품 달력이벤트 70% 혜택', status: 'ongoing', startDate: '2026.04.01', endDate: '2026.04.30', tag: '할인', tagColor: '#e8587a',
        heroText: 'ONLY FOR THE PLUS+',
        heroSub: '장바구니 한번 더 추가 혜택을 드려요\n2026. 4. 01(화) ~ 4. 30(수)',
        sections: [
          { type: 'benefit', title: '봄 쇼핑 추가 혜택', desc: '구매금액 별 최대 3만원 쿠폰으로\n장바구니 추가 할인을 받아 보세요',
            items: [
              { label: '4월 1일부터 | 20만원 이상', value: '10,000원', btn: '다운받기 >' },
              { label: '4월 1일부터 | 50만원 이상', value: '30,000원', btn: '다운받기 >' },
            ]
          },
          { type: 'notice', title: '유의사항', lines: [
            '본 이벤트는 ShopJoy 온라인 한정 이벤트입니다.',
            '쿠폰은 기간 내 1회 다운로드 가능하며, 사용 기한은 다운로드 후 7일입니다.',
            '일부 브랜드 및 상품은 할인 적용이 제외될 수 있습니다.',
            '본 이벤트는 사전 공지 없이 조기 종료될 수 있습니다.',
          ]},
        ]
      },
      { id: 2, title: '4월 신한카드 특시할인', status: 'ongoing', startDate: '2026.04.08', endDate: '2026.04.30', tag: '카드혜택', tagColor: '#3b82f6',
        heroText: '신한카드 즉시할인',
        heroSub: '신한카드 결제 시 즉시 10% 할인\n2026. 4. 08(수) ~ 4. 30(수)',
        sections: [
          { type: 'benefit', title: '할인 혜택', desc: '신한카드로 결제 시 즉시 할인',
            items: [
              { label: '10만원 이상 결제 시', value: '10% 할인', btn: '자세히 >' },
            ]
          },
          { type: 'notice', title: '유의사항', lines: ['신한카드 결제 시에만 적용됩니다.', '다른 할인과 중복 적용 불가합니다.'] },
        ]
      },
      { id: 3, title: '4월 더플러스 : 봄 쇼핑 3만원 추가 혜택', status: 'ongoing', startDate: '2026.04.06', endDate: '2026.04.12', tag: '적립', tagColor: '#8b5cf6',
        heroText: 'ONLY FOR THE PLUS+',
        heroSub: '장바구니 한번 더 추가 혜택을 드려요\n2026. 4. 06(일) ~ 4. 12(토)',
        sections: [
          { type: 'benefit', title: '봄 쇼핑 추가 혜택', desc: '구매금액 별 최대 3만원 쿠폰으로\n장바구니 추가 할인을 받아 보세요',
            items: [
              { label: '4월 6일부터 | 20만원 이상', value: '10,000원', btn: '다운받기 >' },
              { label: '4월 6일부터 | 50만원 이상', value: '30,000원', btn: '다운받기 >' },
            ]
          },
          { type: 'notice', title: '유의사항', lines: ['THE PLUS+ 회원 전용 이벤트입니다.', '쿠폰은 기간 내 1회 다운로드 가능합니다.'] },
        ]
      },
    ];

    const eventId = computed(() => Number(props.editId) || 1);
    const event = computed(() => events.find(e => e.id === eventId.value) || events[0]);

    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    ];
    const heroBg = computed(() => gradients[(eventId.value - 1) % gradients.length]);

    return { event, heroBg };
  },
  template: /* html */ `
<div>

  <!-- 히어로 배너 -->
  <div :style="{
    background: heroBg, minHeight:'340px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    textAlign:'center', padding:'60px 24px', color:'#fff', position:'relative',
  }">
    <div style="font-size:0.82rem;font-weight:600;letter-spacing:3px;opacity:0.85;margin-bottom:16px;">{{ event.heroText || 'SHOPJOY EVENT' }}</div>
    <h1 style="font-size:2.2rem;font-weight:900;line-height:1.3;margin-bottom:16px;text-shadow:0 2px 12px rgba(0,0,0,0.15);">{{ event.title }}</h1>
    <div style="font-size:0.88rem;opacity:0.85;white-space:pre-line;line-height:1.7;">{{ event.heroSub || (event.startDate + ' ~ ' + event.endDate) }}</div>
  </div>

  <!-- 본문 -->
  <div class="page-wrap" style="max-width:760px;">

    <!-- 뒤로 -->
    <button @click="navigate('event')"
      style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:0.825rem;margin-bottom:28px;padding:0;transition:color .2s;"
      @mouseenter="$event.currentTarget.style.color='var(--blue)'"
      @mouseleave="$event.currentTarget.style.color='var(--text-muted)'">
      ← 이벤트 목록으로
    </button>

    <!-- 섹션 -->
    <template v-for="(sec, si) in event.sections" :key="si">

      <!-- 혜택 섹션 -->
      <div v-if="sec.type==='benefit'" class="card" style="padding:36px 32px;margin-bottom:24px;text-align:center;">
        <div style="font-size:0.78rem;font-weight:600;color:var(--blue);letter-spacing:2px;margin-bottom:10px;">ONLY THE PLUS+</div>
        <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;">{{ sec.title }}</h2>
        <p style="font-size:0.88rem;color:var(--text-secondary);white-space:pre-line;line-height:1.7;margin-bottom:28px;">{{ sec.desc }}</p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;">
          <div v-for="(item, ii) in sec.items" :key="ii"
            style="border:1px solid var(--border);border-radius:12px;padding:24px 20px;text-align:center;">
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;">{{ item.label }}</div>
            <div style="font-size:1.6rem;font-weight:900;color:var(--text-primary);margin-bottom:16px;">{{ item.value }}</div>
            <button class="btn-blue" style="padding:10px 32px;font-size:0.85rem;">{{ item.btn }}</button>
          </div>
        </div>
      </div>

      <!-- 유의사항 -->
      <div v-else-if="sec.type==='notice'" style="margin-bottom:32px;padding:24px 28px;background:var(--bg-base);border-radius:12px;border:1px solid var(--border);">
        <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px;">{{ sec.title }}</h3>
        <ul style="list-style:none;padding:0;margin:0;">
          <li v-for="(line, li) in sec.lines" :key="li"
            style="font-size:0.8rem;color:var(--text-muted);line-height:1.8;padding-left:14px;position:relative;">
            <span style="position:absolute;left:0;">·</span>{{ line }}
          </li>
        </ul>
      </div>
    </template>

  </div>
</div>
  `
};
