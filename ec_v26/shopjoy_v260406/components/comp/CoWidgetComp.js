/**
 * CoWidgetComp.js — FO·BO 공통 전시 위젯 컴포넌트
 *
 * ※ 모든 컴포넌트는 'Co' prefix / 'co-' 태그를 사용한다.
 *   FO(index.html) · BO(bo.html) 양쪽에서 로드되며 DispX04Widget 이 소비한다.
 *
 * CoBarcodeWidget   — 바코드 / QR코드 렌더러 (JsBarcode + QRCode 라이브러리)
 *                     사용: <co-barcode-widget :widget="widget" />
 *
 * CoCountdownWidget — 카운트다운 타이머 (목표 일시까지 D:H:M:S)
 *                     사용: <co-countdown-widget :widget="widget" />
 */

/* ── CoBarcodeWidget — 바코드 / QR코드 렌더러 ──────────────────────────── */
window.CoBarcodeWidget = {
  name: 'CoBarcodeWidget',
  props: {
    widget: { type: Object, required: true },
  },
  setup(props) {
    const { ref, onMounted, watch, nextTick, computed } = Vue;

    const barcodeEl = ref(null);
    const qrcodeEl  = ref(null);
    let qrInst = null;

    const cfShowBarcode = computed(() => ['barcode', 'barcode_qrcode'].includes(props.widget.widgetType));
    const showQr      = computed(() => ['qrcode',  'barcode_qrcode'].includes(props.widget.widgetType));

    /* renderBarcode */
    const renderBarcode = () => {
      if (!barcodeEl.value || !window.JsBarcode) return;
      const w = props.widget;
      const val = (w.codeValue || '').trim();
      if (!val) return;
      try {
        JsBarcode(barcodeEl.value, val, {
          format:       w.codeFormat    || 'CODE128',
          width:        Number(w.codeWidth)  || 2,
          height:       Number(w.codeHeight) || 60,
          displayValue: w.showCodeLabel !== false && w.showCodeLabel !== 'false',
          fontSize:     12,
          margin:       10,
          lineColor:    '#000000',
          background:   '#ffffff',
        });
      } catch (e) {
        /* 잘못된 값/형식 무시 */
        try {
          JsBarcode(barcodeEl.value, '000000000000', {
            format: 'CODE128', width: 2, height: 40,
            displayValue: true, fontSize: 11, margin: 8,
          });
        } catch (_) { /* ignored */ }
      }
    };

    /* renderQrcode */
    const renderQrcode = () => {
      if (!qrcodeEl.value || !window.QRCode) return;
      const w = props.widget;
      const val = (w.codeValue || '').trim() || '000000';
      const size = Number(w.qrSize) || 120;
      const level = (w.qrErrorLevel || 'M').toUpperCase();
      const correctLevel = QRCode.CorrectLevel[level] ?? QRCode.CorrectLevel.M;

      if (qrInst) {
        qrInst.clear();
        qrInst.makeCode(val);
      } else {
        qrcodeEl.value.innerHTML = '';
        qrInst = new QRCode(qrcodeEl.value, {
          text: val,
          width:  size,
          height: size,
          colorDark:  '#000000',
          colorLight: '#ffffff',
          correctLevel,
        });
      }
    };

    /* render */
    const render = async () => {
      await nextTick();
      if (cfShowBarcode.value) renderBarcode();
      if (showQr.value)      renderQrcode();
    };

    onMounted(render);

    /* 파라미터 변경 시 재렌더 */
    const watchKeys = ['codeValue', 'codeFormat', 'codeWidth', 'codeHeight', 'qrSize', 'qrErrorLevel', 'showCodeLabel'];
    watchKeys.forEach(k => {
      watch(() => props.widget[k], () => {
        if (['qrSize', 'qrErrorLevel'].includes(k) && qrInst) {
          qrInst = null; /* 재생성 트리거 */
        }
        render();
      });
    });

    return { barcodeEl, qrcodeEl, cfShowBarcode, showQr };
  },
  template: /* html */`
<div style="background:#fff;border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;">
  <!-- 헤더 -->
  <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
    <span style="font-size:11px;color:#888;">
      {{ cfShowBarcode && showQr ? '🔖 바코드+QR' : cfShowBarcode ? '🔖 바코드' : '📱 QR코드' }}
      {{ widget.name }}
    </span>
  </div>

  <!-- 본문 -->
  <div style="padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:14px;">

    <template v-if="!widget.codeValue || !widget.codeValue.trim()">
      <div style="font-size:12px;color:#bbb;padding:16px 0;">코드 값을 입력하세요</div>
    </template>

    <template v-else>
      <!-- 바코드 -->
      <div v-if="cfShowBarcode" style="width:100%;display:flex;justify-content:center;overflow:hidden;">
        <svg ref="barcodeEl" style="max-width:100%;"></svg>
      </div>

      <!-- QR코드 -->
      <div v-if="showQr" style="display:flex;justify-content:center;">
        <div ref="qrcodeEl"></div>
      </div>

      <!-- 코드값 표시 -->
      <div style="font-size:11px;color:#888;letter-spacing:.5px;font-family:monospace;">
        {{ widget.codeValue }}
      </div>
    </template>

  </div>
</div>
`,
};

/* ── CoCountdownWidget — 카운트다운 타이머 ─────────────────────────────── */
window.CoCountdownWidget = {
  name: 'CoCountdownWidget',
  props: {
    widget: { type: Object, required: true },
  },
  setup(props) {
    const { reactive, computed, onMounted, onUnmounted, watch } = Vue;

    const remaining = reactive({ d: 0, h: 0, m: 0, s: 0, expired: false, invalid: false });
    let timer = null;

    /* pad */
    const pad = (n) => String(n).padStart(2, '0');

    /* calc */
    const calc = () => {
      const raw = (props.widget.countdownTarget || '').trim();
      if (!raw) { Object.assign(remaining, { d: 0, h: 0, m: 0, s: 0, expired: false, invalid: true }); return; }
      const target = new Date(raw.replace(' ', 'T'));
      if (isNaN(target.getTime())) { Object.assign(remaining, { d: 0, h: 0, m: 0, s: 0, expired: false, invalid: true }); return; }
      const diff = target - Date.now();
      if (diff <= 0) { Object.assign(remaining, { d: 0, h: 0, m: 0, s: 0, expired: true, invalid: false }); return; }
      const total = Math.floor(diff / 1000);
      Object.assign(remaining, {
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
        expired: false,
        invalid: false,
      });
    };

    /* start */
    const start = () => {
      if (timer) clearInterval(timer);
      calc();
      timer = setInterval(calc, 1000);
    };

    onMounted(start);
    onUnmounted(() => { if (timer) clearInterval(timer); });
    watch(() => props.widget.countdownTarget, start);

    const bgColor   = computed(() => props.widget.countdownBgColor   || '#1a237e');
    const cfTextColor = computed(() => props.widget.countdownTextColor  || '#ffffff');

    return { remaining, pad, bgColor, cfTextColor };
  },
  template: /* html */`
<div :style="{ background: bgColor, borderRadius: '10px', overflow: 'hidden', padding: '20px 16px', textAlign: 'center', color: cfTextColor }">

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
