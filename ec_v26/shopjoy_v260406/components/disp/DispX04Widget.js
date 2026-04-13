/* ShopJoy - 전시 위젯 렌더러 컴포넌트 */
window.DispX04Widget = {
  name: 'DispX04Widget',
  props: {
    widget:     { type: Object,  required: true },
    isLoggedIn: { type: Boolean, default: false },
    userGrade:  { type: String,  default: '' },
  },
  emits: ['click-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* 노출 여부 판단 */
    const visible = computed(() => {
      const w = props.widget;
      if (!w || w.status !== '활성') return false;
      const cond = w.condition;
      if (cond === '항상 표시') return true;
      if (cond === '로그인 필요')  return props.isLoggedIn;
      if (cond === '비로그인')     return !props.isLoggedIn;
      if (cond === '로그인+VIP')   return props.isLoggedIn && props.userGrade === 'VIP';
      if (cond === '로그인+우수')  return props.isLoggedIn && (props.userGrade === '우수' || props.userGrade === 'VIP');
      return true;
    });

    const handleClick = () => {
      const w = props.widget;
      if (!w.clickAction || w.clickAction === 'none') return;
      emit('click-action', { action: w.clickAction, target: w.clickTarget, widget: w });
    };

    /* 이름 기반 그라디언트 (일관성 있게 같은 이름 → 같은 색) */
    const GRADIENTS = [
      'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
      'linear-gradient(135deg,#1a237e 0%,#3949ab 100%)',
      'linear-gradient(135deg,#00acc1 0%,#0097a7 100%)',
      'linear-gradient(135deg,#43a047 0%,#2e7d32 100%)',
      'linear-gradient(135deg,#f57c00 0%,#e65100 100%)',
      'linear-gradient(135deg,#5e35b1 0%,#4527a0 100%)',
      'linear-gradient(135deg,#1565c0 0%,#0d47a1 100%)',
    ];
    const nameGrad = (name) => {
      const h = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return GRADIENTS[h % GRADIENTS.length];
    };

    /* 차트 데이터 */
    const chartColors = ['#e8587a','#ff8c69','#9c5fa3','#1677ff','#52c41a','#fa8c16','#36cfc9'];
    const chartBars = computed(() => {
      const w = props.widget;
      if (!w.chartValues) return [];
      const vals   = w.chartValues.split(',').map(v => Number(v.trim()) || 0);
      const labels = w.chartLabels ? w.chartLabels.split(',').map(l => l.trim()) : vals.map((_, i) => i + 1);
      const max    = Math.max(...vals, 1);
      return vals.map((v, i) => ({ value: v, label: labels[i] || '', pct: Math.round((v / max) * 100), color: chartColors[i % chartColors.length] }));
    });

    return { visible, handleClick, nameGrad, chartBars, chartColors };
  },
  template: /* html */`
<div v-if="visible" class="disp-widget" :style="{ cursor: widget.clickAction && widget.clickAction !== 'none' ? 'pointer' : 'default' }" @click="handleClick">

  <!-- ─── 이미지 배너 ─── -->
  <template v-if="widget.widgetType==='image_banner'">
    <div v-if="widget.imageUrl" style="border-radius:10px;overflow:hidden;">
      <img :src="widget.imageUrl" :alt="widget.altText||'배너'" style="width:100%;display:block;max-height:220px;object-fit:cover;" />
    </div>
    <div v-else :style="'border-radius:10px;overflow:hidden;background:'+nameGrad(widget.name)+';padding:36px 20px;text-align:center;color:#fff;'"  >
      <div style="font-size:32px;margin-bottom:10px;">📦</div>
      <div style="font-size:17px;font-weight:700;letter-spacing:.3px;text-shadow:0 1px 4px rgba(0,0,0,.3);">{{ widget.name }}</div>
      <div v-if="widget.linkUrl" style="font-size:12px;opacity:.7;margin-top:6px;">→ {{ widget.linkUrl }}</div>
      <div v-else-if="widget.altText" style="font-size:12px;opacity:.7;margin-top:6px;">{{ widget.altText }}</div>
    </div>
  </template>

  <!-- ─── 상품 슬라이더 ─── -->
  <template v-else-if="widget.widgetType==='product_slider'">
    <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:12px;">🛒 {{ widget.name }}</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;">
        <div v-for="n in 4" :key="n" style="flex-shrink:0;width:110px;text-align:center;">
          <div style="height:90px;background:linear-gradient(135deg,#f5f5f5,#ebebeb);border-radius:8px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;font-size:24px;">👗</div>
          <div style="font-size:11px;color:#555;font-weight:600;">상품 {{ n }}</div>
          <div style="font-size:11px;color:#e8587a;font-weight:700;margin-top:2px;">₩0,000</div>
        </div>
      </div>
    </div>
  </template>

  <!-- ─── 상품 ─── -->
  <template v-else-if="widget.widgetType==='product'">
    <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:10px;">📦 {{ widget.name }}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <div v-for="n in 3" :key="n" style="width:90px;text-align:center;border:1px solid #f0f0f0;border-radius:8px;padding:8px;">
          <div style="height:64px;background:#f9f9f9;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:4px;">📦</div>
          <div style="font-size:10px;color:#888;">상품 {{ n }}</div>
        </div>
      </div>
    </div>
  </template>

  <!-- ─── 조건 상품 ─── -->
  <template v-else-if="widget.widgetType==='cond_product'">
    <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e8e8e8;">
      <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:8px;">🔍 {{ widget.name }}</div>
      <div style="font-size:11px;color:#888;background:#f9f9f9;border-radius:6px;padding:8px;">
        <span v-if="widget.condSort">정렬: {{ widget.condSort }}</span>
        <span v-if="widget.condLimit">  수량: {{ widget.condLimit }}</span>
        <span v-if="widget.condCategory">  카테: {{ widget.condCategory }}</span>
        <span v-if="widget.condBrand">  브랜드: {{ widget.condBrand }}</span>
        <span v-if="!widget.condSort&&!widget.condLimit">조건상품 렌더링</span>
      </div>
    </div>
  </template>

  <!-- ─── 차트 ─── -->
  <template v-else-if="widget.widgetType&&widget.widgetType.startsWith('chart_')">
    <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #e8e8e8;">
      <div style="font-size:14px;font-weight:700;color:#222;margin-bottom:14px;">
        {{ widget.widgetType==='chart_bar'?'📊':widget.widgetType==='chart_line'?'📈':'🥧' }} {{ widget.chartTitle || widget.name }}
      </div>
      <div v-if="chartBars.length" style="display:flex;align-items:flex-end;gap:5px;height:90px;">
        <div v-for="(bar, i) in chartBars" :key="i" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <div :style="{ height: bar.pct+'%', background: bar.color, borderRadius:'4px 4px 0 0', width:'100%', minHeight:'4px', transition:'height .3s' }"></div>
          <div style="font-size:10px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">{{ bar.label }}</div>
        </div>
      </div>
      <div v-else style="height:60px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;">차트 데이터 없음</div>
    </div>
  </template>

  <!-- ─── 텍스트 배너 ─── -->
  <template v-else-if="widget.widgetType==='text_banner'">
    <div :style="{ background: widget.bgColor||'#f5f5f5', color: widget.textColor||'#333', borderRadius:'10px', padding:'18px 20px', fontSize: (widget.fontSize||'14')+'px', lineHeight:'1.7' }">
      <span v-if="widget.textContent" v-html="widget.textContent"></span>
      <span v-else style="opacity:.6;">{{ widget.name }}</span>
    </div>
  </template>

  <!-- ─── 정보 카드 ─── -->
  <template v-else-if="widget.widgetType==='info_card'">
    <div style="background:#fff;border-radius:10px;padding:18px 20px;border:1px solid #e8e8e8;box-shadow:0 1px 6px rgba(0,0,0,.06);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span v-if="widget.infoIcon" style="font-size:20px;">{{ widget.infoIcon }}</span>
        <span style="font-size:15px;font-weight:700;color:#222;">{{ widget.infoTitle || widget.name }}</span>
      </div>
      <div style="font-size:13px;color:#555;white-space:pre-line;line-height:1.6;">{{ widget.infoBody || '내용 없음' }}</div>
    </div>
  </template>

  <!-- ─── 팝업 ─── -->
  <template v-else-if="widget.widgetType==='popup'">
    <div style="background:#fff;border-radius:10px;padding:16px 20px;border:2px dashed #e8587a;text-align:center;">
      <div style="font-size:22px;margin-bottom:6px;">💬</div>
      <div style="font-size:13px;font-weight:700;color:#e8587a;margin-bottom:4px;">팝업</div>
      <div style="font-size:12px;color:#555;">{{ widget.name }}</div>
      <div v-if="widget.popupWidth" style="font-size:11px;color:#aaa;margin-top:4px;">{{ widget.popupWidth }}×{{ widget.popupHeight }}</div>
    </div>
  </template>

  <!-- ─── 파일 ─── -->
  <template v-else-if="widget.widgetType==='file'">
    <div style="display:flex;align-items:center;gap:12px;background:#f8f9ff;border-radius:10px;padding:14px 18px;border:1px solid #dce3f8;">
      <span style="font-size:24px;flex-shrink:0;">📎</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:#1565c0;">{{ widget.fileLabel || widget.name }}</div>
        <div v-if="widget.fileSize" style="font-size:11px;color:#aaa;margin-top:2px;">{{ widget.fileSize }}</div>
      </div>
    </div>
  </template>

  <!-- ─── 파일 목록 ─── -->
  <template v-else-if="widget.widgetType==='file_list'">
    <div style="background:#fff;border-radius:10px;padding:14px;border:1px solid #e8e8e8;">
      <div style="font-size:13px;font-weight:700;color:#222;margin-bottom:8px;">📁 {{ widget.name }}</div>
      <div v-for="n in 3" :key="n" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;">
        <span style="font-size:16px;">📄</span>
        <span style="font-size:12px;color:#555;">파일 {{ n }}.pdf</span>
        <span style="margin-left:auto;font-size:11px;color:#1565c0;text-decoration:underline;cursor:pointer;">다운로드</span>
      </div>
    </div>
  </template>

  <!-- ─── 쿠폰 ─── -->
  <template v-else-if="widget.widgetType==='coupon'">
    <div style="border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#f06292,#e91e63);color:#fff;display:flex;align-items:center;padding:20px 24px;gap:18px;position:relative;">
      <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">✏️</div>
      <div style="flex:1;">
        <div v-if="widget.couponCode" style="font-size:11px;opacity:.75;letter-spacing:.5px;margin-bottom:3px;">{{ widget.couponCode }}</div>
        <div style="font-size:16px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.2);">{{ widget.couponDesc || widget.name }}</div>
        <div v-if="widget.discountRate" style="font-size:12px;opacity:.8;margin-top:3px;">할인율: {{ widget.discountRate }}%</div>
      </div>
      <!-- 점선 경계 -->
      <div style="position:absolute;top:0;bottom:0;right:70px;width:1px;border-left:2px dashed rgba(255,255,255,.4);"></div>
      <div style="font-size:13px;font-weight:700;width:60px;text-align:center;flex-shrink:0;">받기</div>
    </div>
  </template>

  <!-- ─── HTML 에디터 ─── -->
  <template v-else-if="widget.widgetType==='html_editor'">
    <div style="background:#1e1e2e;border-radius:10px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;background:#2d2d3f;border-bottom:1px solid #444;">
        <span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block;"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span>
        <span style="width:10px;height:10px;border-radius:50%;background:#28c940;display:inline-block;"></span>
        <span style="font-size:11px;color:#888;margin-left:6px;">HTML 에디터 · {{ widget.name }}</span>
      </div>
      <div style="padding:14px 18px;font-family:'Consolas','D2Coding',monospace;font-size:12px;line-height:1.7;color:#cdd9e5;min-height:60px;white-space:pre-wrap;">
        <span v-if="widget.htmlContent">{{ widget.htmlContent.slice(0,200) }}<span v-if="widget.htmlContent.length>200" style="color:#555;">...</span></span>
        <span v-else style="color:#555;"><!-- HTML 내용 없음 --></span>
      </div>
    </div>
  </template>

  <!-- ─── 이벤트 배너 ─── -->
  <template v-else-if="widget.widgetType==='event_banner'">
    <div style="border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#f50057,#c51162);padding:28px 24px;text-align:center;color:#fff;">
      <div style="font-size:28px;margin-bottom:10px;">🎉</div>
      <div style="font-size:17px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.3);">{{ widget.eventTitle || widget.name }}</div>
      <div v-if="widget.eventUrl" style="font-size:12px;opacity:.7;margin-top:6px;">→ {{ widget.eventUrl }}</div>
    </div>
  </template>

  <!-- ─── 캐시 배너 ─── -->
  <template v-else-if="widget.widgetType==='cache_banner'">
    <div style="border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#ff8f00,#f57f17);padding:22px 24px;color:#fff;display:flex;align-items:center;gap:18px;">
      <div style="width:52px;height:52px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">💰</div>
      <div>
        <div style="font-size:22px;font-weight:900;letter-spacing:.5px;text-shadow:0 1px 4px rgba(0,0,0,.3);">
          +{{ widget.cacheAmount ? widget.cacheAmount.toLocaleString() : '0' }}P
        </div>
        <div v-if="widget.cacheDesc" style="font-size:12px;opacity:.8;margin-top:3px;">{{ widget.cacheDesc }}</div>
        <div v-if="widget.cacheExpire" style="font-size:11px;opacity:.6;margin-top:2px;">만료: {{ widget.cacheExpire }}</div>
      </div>
    </div>
  </template>

  <!-- ─── 위젯 임베드 ─── -->
  <template v-else-if="widget.widgetType==='widget_embed'">
    <div style="background:#f8f8f8;border-radius:10px;padding:16px;border:1px dashed #ccc;text-align:center;">
      <div style="font-size:20px;margin-bottom:6px;">🧩</div>
      <div style="font-size:12px;color:#888;">위젯 임베드: {{ widget.name }}</div>
    </div>
  </template>

  <!-- ─── 기타 ─── -->
  <template v-else>
    <div :style="'border-radius:10px;overflow:hidden;background:'+nameGrad(widget.name)+';padding:24px 20px;text-align:center;color:#fff;'">
      <div style="font-size:24px;margin-bottom:8px;">▪</div>
      <div style="font-size:14px;font-weight:600;">{{ widget.name }}</div>
      <div style="font-size:11px;opacity:.6;margin-top:4px;">{{ widget.widgetType }}</div>
    </div>
  </template>

</div>
`,
};
