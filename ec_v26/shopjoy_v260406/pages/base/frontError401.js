/* Front - 401 Unauthorized */
window.frontError401 = {
  name: 'FrontError401',
  props: ['navigate'],
  methods: {
    openLogin() {
      if (typeof this.navigate === 'function') this.navigate('login');
      else location.hash = '#page=login';
    },
  },
  template: /* html */`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;min-height:60vh;">
  <div style="font-size:80px;margin-bottom:16px;">🔒</div>
  <div style="font-size:48px;font-weight:800;color:#222;letter-spacing:-1px;">401</div>
  <div style="font-size:18px;font-weight:600;color:#666;margin-top:8px;">로그인이 필요합니다</div>
  <div style="font-size:13px;color:#aaa;margin-top:12px;">
    세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.
  </div>
  <div style="display:flex;gap:10px;margin-top:28px;">
    <button @click="openLogin"
      style="padding:12px 28px;font-size:14px;font-weight:600;background:#e8587a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
      로그인
    </button>
    <button @click="navigate('home')"
      style="padding:12px 28px;font-size:14px;font-weight:600;background:#fff;color:#444;border:1px solid #ddd;border-radius:8px;cursor:pointer;">
      홈으로
    </button>
  </div>
</div>
`,
};
