/* ShopJoy - 카운트다운 타이머 위젯 컴포넌트 */
window.CountdownWidget = {
  name: 'CountdownWidget',
  props: {
    widget: { type: Object, required: true },
  },
  setup(props) {
    const { ref, computed, onMounted, onUnmounted, watch } = Vue;

    const remaining = ref({ d: 0, h: 0, m: 0, s: 0, expired: false, invalid: false });
    let timer = null;

    const pad = (n) => String(n).padStart(2, '0');

    const calc = () => {
      const raw = (props.widget.countdownTarget || '').trim();
      if (!raw) { remaining.value = { d: 0, h: 0, m: 0, s: 0, expired: false, invalid: true }; return; }
      const target = new Date(raw.replace(' ', 'T'));
      if (isNaN(target.getTime())) { remaining.value = { d: 0, h: 0, m: 0, s: 0, expired: false, invalid: true }; return; }
      const diff = target - Date.now();
      if (diff <= 0) { remaining.value = { d: 0, h: 0, m: 0, s: 0, expired: true, invalid: false }; return; }
      const total = Math.floor(diff / 1000);
      remaining.value = {
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
        expired: false,
        invalid: false,
      };
    };

    const start = () => {
      if (timer) clearInterval(timer);
      calc();
      timer = setInterval(calc, 1000);
    };

    onMounted(start);
    onUnmounted(() => { if (timer) clearInterval(timer); });
    watch(() => props.widget.countdownTarget, start);

    const bgColor   = computed(() => props.widget.countdownBgColor   || '#1a237e');
    const textColor = computed(() => props.widget.countdownTextColor  || '#ffffff');

    return { remaining, pad, bgColor, textColor };
  },
  template: /* html */`
<div :style="{ background: bgColor, borderRadius: '10px', overflow: 'hidden', padding: '20px 16px', textAlign: 'center', color: textColor }">

  <!-- 타이틀 -->
  <div style="font-size:13px;opacity:.8;margin-bottom:14px;letter-spacing:.3px;">
    ⏱ {{ widget.countdownTitle || '이벤트 종료까지' }}
  </div>

  <!-- 종료 상태 -->
  <div v-if="remaining.expired" style="font-size:15px;font-weight:700;opacity:.9;">
    {{ widget.countdownExpiredMsg || '이벤트가 종료되었습니다.' }}
  </div>

  <!-- 미입력 상태 -->
  <div v-else-if="remaining.invalid" style="font-size:12px;opacity:.5;">
    목표 일시를 입력하세요<br/>
    <span style="font-size:10px;">예) 2026-12-31 23:59:59</span>
  </div>

  <!-- 카운트다운 -->
  <div v-else style="display:flex;justify-content:center;gap:8px;align-items:flex-start;">
    <div v-if="remaining.d > 0" style="display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:28px;font-weight:900;line-height:1;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;min-width:48px;">
        {{ remaining.d }}
      </div>
      <div style="font-size:10px;opacity:.7;margin-top:4px;">일</div>
    </div>
    <div v-if="remaining.d > 0" style="font-size:24px;font-weight:700;padding-top:4px;opacity:.6;">:</div>

    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:28px;font-weight:900;line-height:1;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;min-width:48px;">
        {{ pad(remaining.h) }}
      </div>
      <div style="font-size:10px;opacity:.7;margin-top:4px;">시</div>
    </div>
    <div style="font-size:24px;font-weight:700;padding-top:4px;opacity:.6;">:</div>
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:28px;font-weight:900;line-height:1;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;min-width:48px;">
        {{ pad(remaining.m) }}
      </div>
      <div style="font-size:10px;opacity:.7;margin-top:4px;">분</div>
    </div>
    <div style="font-size:24px;font-weight:700;padding-top:4px;opacity:.6;">:</div>
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:28px;font-weight:900;line-height:1;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 12px;min-width:48px;">
        {{ pad(remaining.s) }}
      </div>
      <div style="font-size:10px;opacity:.7;margin-top:4px;">초</div>
    </div>
  </div>

</div>
`,
};
