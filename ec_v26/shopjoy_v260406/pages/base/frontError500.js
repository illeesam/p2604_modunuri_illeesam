/* Front - 500 Server Error */
window.frontError500 = {
  name: 'FrontError500',
  props: ['navigate', 'message'],
  template: /* html */`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
  <div style="font-size:80px;margin-bottom:16px;">💥</div>
  <div style="font-size:48px;font-weight:800;color:#222;letter-spacing:-1px;">500</div>
  <div style="font-size:18px;font-weight:600;color:#666;margin-top:8px;">서버 오류가 발생했습니다</div>
  <div style="font-size:13px;color:#aaa;margin-top:12px;max-width:520px;">
    잠시 후 다시 시도해 주세요. 문제가 지속되면 고객센터로 문의 바랍니다.
  </div>
  <div v-if="message" style="font-size:12px;color:#e53935;margin-top:12px;font-family:monospace;background:#fff5f5;padding:8px 14px;border-radius:6px;max-width:600px;word-break:break-all;">{{ message }}</div>
  <div style="display:flex;gap:10px;margin-top:28px;">
    <button @click="$event => location.reload()"
      style="padding:12px 28px;font-size:14px;font-weight:600;background:#e8587a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      새로고침
    </button>
    <button @click="navigate('home')"
      style="padding:12px 28px;font-size:14px;font-weight:600;background:#fff;color:#444;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
      홈으로
    </button>
  </div>
</div>
`,
};
