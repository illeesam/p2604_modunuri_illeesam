/* ShopJoy - 바코드 / QR코드 렌더러 컴포넌트 */
window.BarcodeWidget = {
  name: 'BarcodeWidget',
  props: {
    widget: { type: Object, required: true },
  },
  setup(props) {
    const { ref, onMounted, watch, nextTick, computed } = Vue;

    const barcodeEl = ref(null);
    const qrcodeEl  = ref(null);
    let qrInst = null;

    const showBarcode = computed(() => ['barcode', 'barcode_qrcode'].includes(props.widget.widgetType));
    const showQr      = computed(() => ['qrcode',  'barcode_qrcode'].includes(props.widget.widgetType));

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

    const render = async () => {
      await nextTick();
      if (showBarcode.value) renderBarcode();
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

    return { barcodeEl, qrcodeEl, showBarcode, showQr };
  },
  template: /* html */`
<div style="background:#fff;border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;">
  <!-- 헤더 -->
  <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
    <span style="font-size:11px;color:#888;">
      {{ showBarcode && showQr ? '🔖 바코드+QR' : showBarcode ? '🔖 바코드' : '📱 QR코드' }}
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
      <div v-if="showBarcode" style="width:100%;display:flex;justify-content:center;overflow:hidden;">
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
