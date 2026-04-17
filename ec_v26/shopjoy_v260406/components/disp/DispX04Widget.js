/* ShopJoy - 전시 위젯 렌더러 컴포넌트 */
window.DispX04Widget = {
  name: 'DispX04Widget',
  props: {
    params:      { type: Object, required: true },
    dispDataset: { type: Object, default: () => ({ displays: [], codes: [] }) },
    dispOpt:     { type: Object, default: () => ({ showBadges: true }) },
    widgetItem:  { type: Object, required: true },
  },
  emits: ['click-action'],
  setup(props, { emit }) {
    const { computed } = Vue;

    /* 노출 여부 판단 */
    const visible = computed(() => {
      const w = props.widgetItem;
      const pm = props.params;

      if (!w) return false;

      // 상태 체크
      if (w.status !== '활성') return false;

      // ━━━ 위젯 라이브러리 참조 (dp_widget_lib) ━━━
      // 라이브러리는 마스터 템플릿이므로 useYn만 확인
      if (w.widgetLibRefYn === 'Y') {
        // ✓ 사용여부 체크 (widget lib 마스터)
        if (w.useYn !== 'Y') return false;
      }
      // ━━━ 직접 생성 (dp_widget + dp_panel_item) ━━━
      else {
        // ✓ 사용여부 체크 (widget 마스터)
        if (w.useYn !== 'Y') return false;
        // ✓ 전시여부 체크 (panel item 레벨)
        if (w.dispYn !== 'Y') return false;

        // ✓ 사용기간 체크 (widget 마스터)
        if (pm.date) {
          const t  = pm.time || '00:00';
          const dt = `${pm.date} ${t}`;
          if (w.useStartDate && dt < `${w.useStartDate} 00:00`) return false;
          if (w.useEndDate   && dt > `${w.useEndDate}   23:59`) return false;
        }

        // ✓ 전시기간 체크 (panel item 레벨)
        if (pm.date) {
          const t  = pm.time || '00:00';
          const dt = `${pm.date} ${t}`;
          if (w.dispStartDate && dt < `${w.dispStartDate} ${w.dispStartTime || '00:00'}`) return false;
          if (w.dispEndDate   && dt > `${w.dispEndDate}   ${w.dispEndTime   || '23:59'}`) return false;
        }

        // ✓ 전시환경 체크 (panel item 레벨)
        if (w.dispEnv && pm.dispEnv && !w.dispEnv.includes('^' + pm.dispEnv + '^')) return false;
      }

      const cond = w.condition;
      if (cond === '항상 표시') return true;
      const isLoggedIn = pm?.isLoggedIn || false;
      const userGrade = pm?.userGrade || '';
      if (cond === '로그인 필요')  return isLoggedIn;
      if (cond === '비로그인')     return !isLoggedIn;
      if (cond === '로그인+VIP')   return isLoggedIn && userGrade === 'VIP';
      if (cond === '로그인+우수')  return isLoggedIn && (userGrade === '우수' || userGrade === 'VIP');
      return true;
    });

    const handleClick = () => {
      const w = props.widgetItem;
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
      const w = props.widgetItem;
      if (!w.chartValues) return [];
      const vals   = w.chartValues.split(',').map(v => Number(v.trim()) || 0);
      const labels = w.chartLabels ? w.chartLabels.split(',').map(l => l.trim()) : vals.map((_, i) => i + 1);
      const max    = Math.max(...vals, 1);
      return vals.map((v, i) => ({ value: v, label: labels[i] || '', pct: Math.round((v / max) * 100), color: chartColors[i % chartColors.length] }));
    });

    const parseMarkdown = (md) => (window.marked ? window.marked.parse(md || '') : (md || ''));

    /* 동영상 embed URL 생성 */
    const getVideoEmbed = (w) => {
      const url = (w.videoUrl || '').trim();
      if (!url) return null;
      if (w.videoType === 'youtube' || url.includes('youtube') || url.includes('youtu.be')) {
        const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\?\/\s]+)/);
        if (!m) return null;
        const params = `controls=${w.videoControls !== false ? 1 : 0}&mute=1`;
        return `https://www.youtube.com/embed/${m[1]}?${params}`;
      }
      if (w.videoType === 'vimeo' || url.includes('vimeo')) {
        const m = url.match(/vimeo\.com\/(\d+)/);
        if (!m) return null;
        return `https://player.vimeo.com/video/${m[1]}`;
      }
      return url;
    };

    /* 지도 embed URL 생성 */
    const getMapEmbed = (w) => {
      if (!w.mapAddress && !w.mapLat) return null;
      const q = (w.mapLat && w.mapLng)
        ? `${w.mapLat},${w.mapLng}`
        : encodeURIComponent(w.mapAddress || '');
      return `https://maps.google.com/maps?q=${q}&z=${w.mapZoom || 14}&output=embed&hl=ko`;
    };

    /* 결재선 JSON 파싱 */
    const parseApprovalLine = (json) => {
      try { return JSON.parse(json || '[]'); }
      catch { return [{ role: '담당자', name: '' }, { role: '팀장', name: '' }, { role: '부서장', name: '' }]; }
    };

    return { widget: props.widgetItem, visible, handleClick, nameGrad, chartBars, chartColors, parseMarkdown, getVideoEmbed, getMapEmbed, parseApprovalLine };
  },
  template: /* html */`
<div v-if="visible" class="disp-widget" :style="{ cursor: widget.clickAction && widget.clickAction !== 'none' ? 'pointer' : 'default' }" @click="handleClick">

  <!-- ─── 위젯 타이틀 ─── -->
  <div v-if="widget.titleYn==='Y' && widget.title"
    style="font-size:14px;font-weight:700;color:var(--text-primary,#222);margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid var(--blue,#1677ff);">
    {{ widget.title }}
  </div>

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
    <div style="border-radius:10px;overflow:hidden;border:1px solid #e8e8e8;">
      <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
        <span style="font-size:11px;color:#888;">📄 {{ widget.name }}</span>
      </div>
      <div v-if="widget.htmlContent" style="padding:14px 16px;font-size:13px;line-height:1.7;min-height:40px;" v-html="widget.htmlContent"></div>
      <div v-else style="padding:14px 16px;font-size:12px;color:#bbb;text-align:center;">HTML 내용 없음</div>
    </div>
  </template>

  <!-- ─── 텍스트 영역 ─── -->
  <template v-else-if="widget.widgetType==='textarea'">
    <div style="border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
        <span style="font-size:11px;color:#888;">📋 {{ widget.name }}</span>
      </div>
      <pre v-if="widget.textareaContent" style="margin:0;padding:14px 16px;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word;font-family:inherit;background:#fff;">{{ widget.textareaContent }}</pre>
      <div v-else style="padding:14px 16px;font-size:12px;color:#bbb;text-align:center;">내용 없음</div>
    </div>
  </template>

  <!-- ─── Markdown ─── -->
  <template v-else-if="widget.widgetType==='markdown'">
    <div style="border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f5f5f5;border-bottom:1px solid #e8e8e8;">
        <span style="font-size:11px;color:#888;">📑 {{ widget.name }}</span>
      </div>
      <div v-if="widget.markdownContent" style="padding:14px 16px;font-size:13px;line-height:1.7;" v-html="parseMarkdown(widget.markdownContent)"></div>
      <div v-else style="padding:14px 16px;font-size:12px;color:#bbb;text-align:center;">Markdown 내용 없음</div>
    </div>
  </template>

  <!-- ─── 바코드 / QR코드 ─── -->
  <template v-else-if="widget.widgetType==='barcode'||widget.widgetType==='qrcode'||widget.widgetType==='barcode_qrcode'">
    <barcode-widget :widget="widget" />
  </template>

  <!-- ─── 동영상 플레이어 ─── -->
  <template v-else-if="widget.widgetType==='video_player'">
    <div style="border-radius:10px;overflow:hidden;border:1px solid #e8e8e8;">
      <div v-if="getVideoEmbed(widget)" style="position:relative;padding-top:56.25%;background:#000;">
        <iframe :src="getVideoEmbed(widget)"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
          allowfullscreen allow="accelerometer;clipboard-write;encrypted-media;gyroscope;picture-in-picture">
        </iframe>
      </div>
      <div v-else style="background:#1a1a2e;padding:40px 20px;text-align:center;color:#fff;">
        <div style="font-size:40px;margin-bottom:8px;">▶</div>
        <div style="font-size:12px;opacity:.6;">동영상 URL을 입력하세요</div>
      </div>
    </div>
  </template>

  <!-- ─── 카운트다운 타이머 ─── -->
  <template v-else-if="widget.widgetType==='countdown'">
    <countdown-widget :widget="widget" />
  </template>

  <!-- ─── 결제위젯 ─── -->
  <template v-else-if="widget.widgetType==='payment_widget'">
    <div style="background:#fff;border-radius:10px;border:1px solid #e8e8e8;padding:20px;">
      <div style="font-size:22px;font-weight:900;color:#1a1a2e;margin-bottom:4px;letter-spacing:-.5px;">
        {{ Number(widget.payAmount||0).toLocaleString() }}<span style="font-size:14px;font-weight:600;margin-left:2px;">{{ widget.payCurrency==='USD' ? 'USD' : '원' }}</span>
      </div>
      <div style="font-size:11px;color:#aaa;margin-bottom:14px;">{{ widget.name }}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
        <div v-for="m in (widget.payMethods||'card').split(',')" :key="m"
          style="padding:5px 10px;border:1px solid #e8e8e8;border-radius:16px;font-size:11px;background:#fafafa;color:#555;">
          {{ {'card':'💳 카드','kakao':'💛 카카오페이','naver':'🟢 네이버페이','toss':'🔵 토스','bank':'🏦 계좌이체'}[m.trim()] || m.trim() }}
        </div>
      </div>
      <button :style="'width:100%;padding:11px;background:'+(widget.payButtonColor||'#1677ff')+';color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;'">
        {{ widget.payButtonLabel || '결제하기' }}
      </button>
    </div>
  </template>

  <!-- ─── 전자결재 ─── -->
  <template v-else-if="widget.widgetType==='approval_widget'">
    <div style="background:#fff;border-radius:10px;border:1px solid #e8e8e8;overflow:hidden;">
      <div style="background:#1a237e;color:#fff;padding:10px 16px;font-size:13px;font-weight:700;">
        ✅ {{ widget.approvalDocType || '전자결재' }}<span v-if="widget.approvalTitle"> – {{ widget.approvalTitle }}</span>
      </div>
      <div style="display:flex;border-bottom:1px solid #e8e8e8;overflow-x:auto;">
        <div v-for="(ap, i) in parseApprovalLine(widget.approvalLine)" :key="i"
          style="flex:1;min-width:72px;text-align:center;padding:10px 6px;border-right:1px solid #f0f0f0;">
          <div style="font-size:10px;color:#aaa;margin-bottom:6px;">{{ ap.role }}</div>
          <div style="width:36px;height:36px;border-radius:50%;background:#f5f5f5;border:1px solid #e0e0e0;margin:0 auto 5px;display:flex;align-items:center;justify-content:center;font-size:16px;">
            {{ ap.status==='approved'?'✅':ap.status==='rejected'?'❌':'👤' }}
          </div>
          <div style="font-size:11px;color:#333;font-weight:600;">{{ ap.name || '(미정)' }}</div>
        </div>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:#888;">결재를 진행합니다.</div>
    </div>
  </template>

  <!-- ─── 지도맵 ─── -->
  <template v-else-if="widget.widgetType==='map_widget'">
    <div style="border-radius:10px;overflow:hidden;border:1px solid #e8e8e8;">
      <iframe v-if="getMapEmbed(widget)" :src="getMapEmbed(widget)"
        style="width:100%;height:220px;border:none;display:block;"
        allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
      </iframe>
      <div v-else style="height:120px;background:#f5f5f5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;">
        <span style="font-size:28px;">🗺</span>
        <span style="font-size:12px;color:#aaa;">주소 또는 위도/경도를 입력하세요</span>
      </div>
      <div v-if="widget.mapAddress||widget.mapMarkerLabel"
        style="padding:8px 12px;font-size:12px;color:#555;border-top:1px solid #f0f0f0;background:#fafafa;">
        📍 {{ widget.mapMarkerLabel || widget.mapAddress }}
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
