/* ShopJoy - Login / Signup Modal */
window.Login = {
  name: 'Login',
  props: ['showToast'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, watch } = Vue;

    const step = ref('login'); // login | terms | signup

    /* ── 로그인 ── */
    const form = reactive({ email: 'user1@demo.com', password: '' });
    const loginErr = ref('');

    const doLogin = async () => {
      loginErr.value = '';
      if (!form.email || !form.password) { loginErr.value = '이메일과 비밀번호를 입력하세요.'; return; }
      const r = await window.shopjoyAuth.login(form.email, form.password);
      if (r.ok) {
        props.showToast(window.shopjoyAuth.state.user.name + '님, 환영합니다!', 'success');
        emit('close');
      } else {
        loginErr.value = r.msg;
      }
    };

    const doSocial = provider => {
      window.shopjoyAuth.loginSocial(provider);
      props.showToast(window.shopjoyAuth.state.user.name + '님, 환영합니다!', 'success');
      emit('close');
    };

    /* ── 약관 ── */
    const terms = reactive({ all: false, t1: false, t2: false, t3: false, t4: false });
    const toggleAll = () => { terms.t1 = terms.t2 = terms.t3 = terms.t4 = terms.all; };
    watch(() => [terms.t1, terms.t2, terms.t3, terms.t4], () => {
      terms.all = terms.t1 && terms.t2 && terms.t3 && terms.t4;
    });

    /* ── 회원가입 ── */
    const sf = reactive({
      name: '', email: '', emailCode: '', emailSent: false, emailVerified: false,
      phone: '', phoneCode: '', phoneSent: false, phoneVerified: false,
      password: '', password2: ''
    });
    const signupErr = ref('');
    const _ec = ref('');
    const _pc = ref('');

    const sendEmailCode = () => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sf.email)) { signupErr.value = '올바른 이메일을 입력하세요.'; return; }
      _ec.value = String(Math.floor(100000 + Math.random() * 900000));
      sf.emailSent = true; sf.emailVerified = false; signupErr.value = '';
      props.showToast('인증코드: ' + _ec.value + '  (데모용)', 'info');
    };
    const verifyEmail = () => {
      if (sf.emailCode === _ec.value) { sf.emailVerified = true; signupErr.value = ''; props.showToast('이메일 인증 완료!', 'success'); }
      else signupErr.value = '인증코드가 올바르지 않습니다.';
    };

    const sendPhoneCode = () => {
      if (!/^010[-]?\d{4}[-]?\d{4}$/.test(sf.phone.replace(/\s/g,''))) { signupErr.value = '올바른 휴대폰 번호를 입력하세요. (010-0000-0000)'; return; }
      _pc.value = String(Math.floor(100000 + Math.random() * 900000));
      sf.phoneSent = true; sf.phoneVerified = false; signupErr.value = '';
      props.showToast('인증코드: ' + _pc.value + '  (데모용)', 'info');
    };
    const verifyPhone = () => {
      if (sf.phoneCode === _pc.value) { sf.phoneVerified = true; signupErr.value = ''; props.showToast('휴대폰 인증 완료!', 'success'); }
      else signupErr.value = '인증코드가 올바르지 않습니다.';
    };

    const doSignup = () => {
      signupErr.value = '';
      if (!sf.name.trim()) { signupErr.value = '이름을 입력하세요.'; return; }
      if (!sf.emailVerified) { signupErr.value = '이메일 인증이 필요합니다.'; return; }
      if (!sf.phoneVerified) { signupErr.value = '휴대폰 인증이 필요합니다.'; return; }
      if (sf.password.length < 6) { signupErr.value = '비밀번호는 6자 이상이어야 합니다.'; return; }
      if (sf.password !== sf.password2) { signupErr.value = '비밀번호가 일치하지 않습니다.'; return; }
      window.shopjoyAuth.signup(sf.name, sf.email, sf.phone);
      props.showToast('회원가입이 완료되었습니다!', 'success');
      emit('close');
    };

    return { step, form, loginErr, doLogin, doSocial, terms, toggleAll, sf, signupErr, sendEmailCode, verifyEmail, sendPhoneCode, verifyPhone, doSignup };
  },
  template: /* html */ `
<div class="modal-overlay" @click.self="$emit('close')" style="z-index:200;">
  <div class="modal-box" style="max-width:440px;width:90%;padding:32px 28px;position:relative;max-height:90vh;overflow-y:auto;">
    <button @click="$emit('close')" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

    <!-- ── 로그인 ── -->
    <template v-if="step==='login'">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2rem;">👗</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-top:6px;">로그인</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">기본 계정: user1@demo.com / demo1234</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <input v-model="form.email" type="email" placeholder="이메일" @keyup.enter="doLogin"
          style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
        <input v-model="form.password" type="password" placeholder="비밀번호" @keyup.enter="doLogin"
          style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
        <div v-if="loginErr" style="color:#e8587a;font-size:0.82rem;text-align:center;">{{ loginErr }}</div>
        <button @click="doLogin" :disabled="shopjoyAuth.state.loading" class="btn-blue" style="width:100%;padding:12px;">
          {{ shopjoyAuth.state.loading ? '로그인 중...' : '로그인' }}
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin:20px 0;color:var(--text-muted);font-size:0.8rem;">
        <div style="flex:1;height:1px;background:var(--border);"></div> 소셜 로그인 <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <button @click="doSocial('google')"
          style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text-primary);font-weight:600;">
          <span style="font-size:1.1rem;">🌐</span> Google로 로그인
        </button>
        <button @click="doSocial('kakao')"
          style="width:100%;padding:11px;border:none;border-radius:8px;background:#FEE500;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:#3C1E1E;font-weight:700;">
          <span style="font-size:1.1rem;">💬</span> 카카오로 로그인
        </button>
        <button @click="doSocial('naver')"
          style="width:100%;padding:11px;border:none;border-radius:8px;background:#03C75A;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:#fff;font-weight:700;">
          <span style="font-size:1.1rem;">N</span> 네이버로 로그인
        </button>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:0.85rem;color:var(--text-muted);">
        아직 회원이 아니신가요?
        <button @click="step='terms'" style="background:none;border:none;cursor:pointer;color:var(--blue);font-weight:700;font-size:0.85rem;">회원가입</button>
      </div>
    </template>

    <!-- ── 약관 ── -->
    <template v-else-if="step==='terms'">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">이용약관 동의</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">서비스 이용을 위해 약관에 동의해 주세요</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:0;">
        <label style="display:flex;align-items:center;gap:10px;padding:14px;background:var(--blue-dim);border-radius:8px;cursor:pointer;margin-bottom:10px;">
          <input type="checkbox" v-model="terms.all" @change="toggleAll" style="width:16px;height:16px;accent-color:var(--blue);">
          <span style="font-weight:700;color:var(--text-primary);">전체 동의</span>
        </label>
        <label v-for="(t, i) in [
          {key:'t1', req:true,  text:'서비스 이용약관'},
          {key:'t2', req:true,  text:'개인정보 수집·이용 동의'},
          {key:'t3', req:true,  text:'만 14세 이상 확인'},
          {key:'t4', req:false, text:'마케팅 정보 수신 동의 (선택)'},
        ]" :key="i" style="display:flex;align-items:center;gap:10px;padding:12px 4px;border-bottom:1px solid var(--border);cursor:pointer;">
          <input type="checkbox" v-model="terms[t.key]" style="width:15px;height:15px;accent-color:var(--blue);">
          <span style="font-size:0.88rem;color:var(--text-secondary);">
            <span v-if="t.req" style="color:var(--blue);font-weight:700;">[필수]</span>
            <span v-else style="color:var(--text-muted);">[선택]</span>
            {{ t.text }}
          </span>
        </label>
      </div>

      <div style="display:flex;gap:10px;margin-top:24px;">
        <button @click="step='login'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="step='signup'" :disabled="!(terms.t1&&terms.t2&&terms.t3)"
          class="btn-blue" style="flex:2;padding:12px;"
          :style="!(terms.t1&&terms.t2&&terms.t3)?'opacity:0.5;cursor:not-allowed;':''">다음</button>
      </div>
    </template>

    <!-- ── 회원가입 ── -->
    <template v-else-if="step==='signup'">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">회원가입</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">정보를 입력하고 인증을 완료해 주세요</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <!-- 이름 -->
        <input v-model="sf.name" type="text" placeholder="이름 *"
          style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">

        <!-- 이메일 인증 -->
        <div>
          <div style="display:flex;gap:8px;">
            <input v-model="sf.email" type="email" placeholder="이메일 *" :disabled="sf.emailVerified"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="sendEmailCode" :disabled="sf.emailVerified"
              style="padding:11px 14px;border:1.5px solid var(--blue);border-radius:8px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:600;white-space:nowrap;"
              :style="sf.emailVerified?'opacity:0.4;cursor:not-allowed;':''">
              {{ sf.emailVerified ? '✓ 인증됨' : '코드 발송' }}
            </button>
          </div>
          <div v-if="sf.emailSent && !sf.emailVerified" style="display:flex;gap:8px;margin-top:8px;">
            <input v-model="sf.emailCode" type="text" placeholder="인증코드 6자리"
              style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="verifyEmail"
              style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">확인</button>
          </div>
          <div v-if="sf.emailVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 이메일 인증 완료</div>
        </div>

        <!-- 휴대폰 인증 -->
        <div>
          <div style="display:flex;gap:8px;">
            <input v-model="sf.phone" type="tel" placeholder="휴대폰 번호 (010-0000-0000) *" :disabled="sf.phoneVerified"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="sendPhoneCode" :disabled="sf.phoneVerified"
              style="padding:11px 14px;border:1.5px solid var(--blue);border-radius:8px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:600;white-space:nowrap;"
              :style="sf.phoneVerified?'opacity:0.4;cursor:not-allowed;':''">
              {{ sf.phoneVerified ? '✓ 인증됨' : '코드 발송' }}
            </button>
          </div>
          <div v-if="sf.phoneSent && !sf.phoneVerified" style="display:flex;gap:8px;margin-top:8px;">
            <input v-model="sf.phoneCode" type="text" placeholder="인증코드 6자리"
              style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="verifyPhone"
              style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">확인</button>
          </div>
          <div v-if="sf.phoneVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 휴대폰 인증 완료</div>
        </div>

        <!-- 비밀번호 -->
        <input v-model="sf.password" type="password" placeholder="비밀번호 (6자 이상) *"
          style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
        <input v-model="sf.password2" type="password" placeholder="비밀번호 확인 *"
          style="width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">

        <div v-if="signupErr" style="color:#e8587a;font-size:0.82rem;text-align:center;">{{ signupErr }}</div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;">
        <button @click="step='terms'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="doSignup" class="btn-blue" style="flex:2;padding:12px;">가입 완료</button>
      </div>
    </template>
  </div>
</div>
  `,
  computed: {
    shopjoyAuth() { return window.shopjoyAuth; }
  }
};
