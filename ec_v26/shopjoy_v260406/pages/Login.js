/* ShopJoy - Login / Signup Modal */
window.Login = {
  name: 'Login',
  props: ['showToast'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, reactive, watch } = Vue;

    // login | terms | signup | sns-signup
    const step       = ref('login');
    const snsProvider = ref(null); // sns 회원가입 시 provider 저장

    /* ── 로그인 ── */
    const form     = reactive({ email: 'user1@demo.com', password: 'demo1234' });
    const loginErr = ref('');

    const doLogin = async () => {
      loginErr.value = '';
      if (!form.email || !form.password) { loginErr.value = '이메일과 비밀번호를 입력하세요.'; return; }
      const r = await window.frontAuth.login(form.email, form.password);
      if (r.ok) {
        props.showToast(window.frontAuth.state.user.memberNm + '님, 환영합니다!', 'success');
        emit('close');
      } else { loginErr.value = r.msg; }
    };

    /* 소셜 로그인 (기존 회원) vs 소셜 회원가입 분기 */
    const doSocial = provider => {
      // 로그인 탭에서 클릭 → 바로 로그인
      window.frontAuth.loginSocial(provider);
      props.showToast(window.frontAuth.state.user.memberNm + '님, 환영합니다!', 'success');
      emit('close');
    };

    /* 소셜 회원가입 버튼 → 약관 → sns-signup 폼 */
    const startSnsSignup = provider => {
      snsProvider.value = provider;
      step.value = 'terms';
    };

    /* ── 약관 ── */
    const terms = reactive({ all: false, t1: false, t2: false, t3: false, t4: false });
    const toggleAll = () => { terms.t1 = terms.t2 = terms.t3 = terms.t4 = terms.all; };
    watch(() => [terms.t1, terms.t2, terms.t3, terms.t4], () => {
      terms.all = terms.t1 && terms.t2 && terms.t3 && terms.t4;
    });
    const goNextFromTerms = () => {
      step.value = snsProvider.value ? 'sns-signup' : 'signup';
    };

    /* ── 공통 회원가입 필드 ── */
    const _initSf = () => reactive({
      memberNm: '', email: '', emailCode: '', emailSent: false, emailVerified: false,
      phone: '', phoneCode: '', phoneSent: false, phoneVerified: false,
      password: '', password2: '',
      // 선택 정보
      postcode: '', address: '', addressDetail: '',
      birthdate: '', gender: '',
    });
    const sf       = _initSf();
    const signupErr = ref('');
    const _ec = ref(''); const _pc = ref('');

    /* 이메일 인증 */
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

    /* 휴대폰 인증 */
    const sendPhoneCode = () => {
      if (!/^010[-]?\d{4}[-]?\d{4}$/.test(sf.phone.replace(/\s/g, ''))) { signupErr.value = '올바른 휴대폰 번호를 입력하세요. (010-0000-0000)'; return; }
      _pc.value = String(Math.floor(100000 + Math.random() * 900000));
      sf.phoneSent = true; sf.phoneVerified = false; signupErr.value = '';
      props.showToast('인증코드: ' + _pc.value + '  (데모용)', 'info');
    };
    const verifyPhone = () => {
      if (sf.phoneCode === _pc.value) { sf.phoneVerified = true; signupErr.value = ''; props.showToast('휴대폰 인증 완료!', 'success'); }
      else signupErr.value = '인증코드가 올바르지 않습니다.';
    };

    /* 카카오 주소 검색 */
    const openKakaoAddr = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) { props.showToast('주소 검색 서비스를 불러오는 중입니다.', 'info'); return; }
      new daum.Postcode({
        oncomplete(data) { sf.postcode = data.zonecode; sf.address = data.roadAddress || data.jibunAddress; }
      }).open();
    };

    /* ── 일반 회원가입 제출 ── */
    const doSignup = () => {
      signupErr.value = '';
      if (!sf.memberNm.trim())      { signupErr.value = '이름을 입력하세요.'; return; }
      if (!sf.emailVerified)    { signupErr.value = '이메일 인증이 필요합니다.'; return; }
      if (!sf.phoneVerified)    { signupErr.value = '휴대폰 인증이 필요합니다.'; return; }
      if (sf.password.length < 6){ signupErr.value = '비밀번호는 6자 이상이어야 합니다.'; return; }
      if (sf.password !== sf.password2){ signupErr.value = '비밀번호가 일치하지 않습니다.'; return; }
      window.frontAuth.signup(sf.memberNm, sf.email, sf.phone, {
        postcode: sf.postcode, address: sf.address, addressDetail: sf.addressDetail,
        birthdate: sf.birthdate, gender: sf.gender,
      });
      props.showToast('회원가입이 완료되었습니다!', 'success');
      emit('close');
    };

    /* ── SNS 회원가입 제출 ── */
    const snsNickname = ref('');
    const snsPhone    = ref('');
    const snsPhoneCode = ref(''); const snsPhoneCodeSent = ref(false); const snsPhoneVerified = ref(false);
    const _spc = ref('');
    const snsErr = ref('');

    const providerLabel = p => ({ google: 'Google', kakao: '카카오', naver: '네이버' }[p] || p);
    const providerColor = p => ({ google: '#fff', kakao: '#FEE500', naver: '#03C75A' }[p] || '#fff');
    const providerTextColor = p => ({ google: '#333', kakao: '#3C1E1E', naver: '#fff' }[p] || '#333');

    const sendSnsPhoneCode = () => {
      if (!/^010[-]?\d{4}[-]?\d{4}$/.test(snsPhone.value.replace(/\s/g, ''))) { snsErr.value = '올바른 휴대폰 번호를 입력하세요.'; return; }
      _spc.value = String(Math.floor(100000 + Math.random() * 900000));
      snsPhoneCodeSent.value = true; snsPhoneVerified.value = false; snsErr.value = '';
      props.showToast('인증코드: ' + _spc.value + '  (데모용)', 'info');
    };
    const verifySnsPhone = () => {
      if (snsPhoneCode.value === _spc.value) { snsPhoneVerified.value = true; snsErr.value = ''; props.showToast('휴대폰 인증 완료!', 'success'); }
      else snsErr.value = '인증코드가 올바르지 않습니다.';
    };

    /* SNS 선택 정보 */
    const snsSf = reactive({ postcode: '', address: '', addressDetail: '', birthdate: '', gender: '' });
    const openKakaoAddrSns = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) { props.showToast('주소 검색 서비스를 불러오는 중입니다.', 'info'); return; }
      new daum.Postcode({
        oncomplete(data) { snsSf.postcode = data.zonecode; snsSf.address = data.roadAddress || data.jibunAddress; }
      }).open();
    };

    const doSnsSignup = () => {
      snsErr.value = '';
      if (!snsNickname.value.trim()) { snsErr.value = '이름/닉네임을 입력하세요.'; return; }
      if (!snsPhoneVerified.value)   { snsErr.value = '휴대폰 인증이 필요합니다.'; return; }
      const demos = { google: 'google.sns@gmail.com', kakao: 'kakao.sns@kakao.com', naver: 'naver.sns@naver.com' };
      window.frontAuth.signup(snsNickname.value, demos[snsProvider.value] || 'sns@demo.com', snsPhone.value, {
        provider: snsProvider.value,
        postcode: snsSf.postcode, address: snsSf.address, addressDetail: snsSf.addressDetail,
        birthdate: snsSf.birthdate, gender: snsSf.gender,
      });
      props.showToast(snsNickname.value + '님, 환영합니다!', 'success');
      emit('close');
    };

    /* ── 공통 인풋 스타일 ── */
    const IS = 'width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;';

    return {
      step, snsProvider, form, loginErr, doLogin, doSocial, startSnsSignup,
      terms, toggleAll, goNextFromTerms,
      sf, signupErr, sendEmailCode, verifyEmail, sendPhoneCode, verifyPhone, doSignup, openKakaoAddr,
      snsNickname, snsPhone, snsPhoneCode, snsPhoneCodeSent, snsPhoneVerified, snsErr,
      sendSnsPhoneCode, verifySnsPhone, doSnsSignup, snsSf, openKakaoAddrSns,
      providerLabel, providerColor, providerTextColor, IS,
    };
  },
  computed: { frontAuth() { return window.frontAuth; } },
  template: /* html */ `
<div class="modal-overlay" @click.self="$emit('close')" style="z-index:200;">
  <div class="modal-box" style="max-width:460px;width:92%;padding:clamp(16px,4vw,32px) clamp(14px,3vw,28px);position:relative;max-height:92vh;overflow-y:auto;">
    <button @click="$emit('close')" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">✕</button>

    <!-- ════ 로그인 ════ -->
    <template v-if="step==='login'">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2rem;">👗</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-top:6px;">로그인</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">기본 계정: user1@demo.com / demo1234</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input v-model="form.email" type="email" placeholder="이메일" @keyup.enter="doLogin" :style="IS">
        <input v-model="form.password" type="password" placeholder="비밀번호" @keyup.enter="doLogin" :style="IS">
        <div v-if="loginErr" style="color:#e8587a;font-size:0.82rem;text-align:center;">{{ loginErr }}</div>
        <button @click="doLogin" :disabled="frontAuth.state.loading" class="btn-blue" style="width:100%;padding:12px;">
          {{ frontAuth.state.loading ? '로그인 중...' : '로그인' }}
        </button>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin:20px 0;color:var(--text-muted);font-size:0.8rem;">
        <div style="flex:1;height:1px;background:var(--border);"></div>소셜 로그인<div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;">
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
          <span style="font-size:1.1rem;font-weight:900;">N</span> 네이버로 로그인
        </button>
      </div>

      <div style="text-align:center;margin-top:22px;">
        <span style="font-size:0.85rem;color:var(--text-muted);">아직 회원이 아니신가요?</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
        <button @click="snsProvider=null; step='terms'" class="btn-outline" style="width:100%;padding:10px;font-size:0.85rem;font-weight:700;">
          📧 이메일로 회원가입
        </button>
        <div style="display:flex;gap:8px;">
          <button @click="startSnsSignup('google')"
            style="flex:1;padding:9px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;font-size:0.8rem;font-weight:600;color:var(--text-secondary);">
            🌐 Google
          </button>
          <button @click="startSnsSignup('kakao')"
            style="flex:1;padding:9px;border:none;border-radius:8px;background:#FEE500;cursor:pointer;font-size:0.8rem;font-weight:700;color:#3C1E1E;">
            💬 카카오
          </button>
          <button @click="startSnsSignup('naver')"
            style="flex:1;padding:9px;border:none;border-radius:8px;background:#03C75A;cursor:pointer;font-size:0.8rem;font-weight:700;color:#fff;">
            N 네이버
          </button>
        </div>
      </div>
    </template>

    <!-- ════ 약관 ════ -->
    <template v-else-if="step==='terms'">
      <div style="text-align:center;margin-bottom:20px;">
        <div v-if="snsProvider" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;margin-bottom:10px;"
          :style="'background:'+providerColor(snsProvider)+';color:'+providerTextColor(snsProvider)+';font-size:0.82rem;font-weight:700;'">
          {{ providerLabel(snsProvider) }}로 가입
        </div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">이용약관 동의</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">서비스 이용을 위해 약관에 동의해 주세요</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0;">
        <label style="display:flex;align-items:center;gap:10px;padding:14px;background:var(--blue-dim);border-radius:8px;cursor:pointer;margin-bottom:10px;">
          <input type="checkbox" v-model="terms.all" @change="toggleAll" style="width:16px;height:16px;accent-color:var(--blue);">
          <span style="font-weight:700;color:var(--text-primary);">전체 동의</span>
        </label>
        <label v-for="(t,i) in [
          {key:'t1',req:true, text:'서비스 이용약관'},
          {key:'t2',req:true, text:'개인정보 수집·이용 동의'},
          {key:'t3',req:true, text:'만 14세 이상 확인'},
          {key:'t4',req:false,text:'마케팅 정보 수신 동의 (선택)'},
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
        <button @click="snsProvider=null; step='login'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="goNextFromTerms" :disabled="!(terms.t1&&terms.t2&&terms.t3)"
          class="btn-blue" style="flex:2;padding:12px;"
          :style="!(terms.t1&&terms.t2&&terms.t3)?'opacity:0.5;cursor:not-allowed;':''">다음</button>
      </div>
    </template>

    <!-- ════ 이메일 회원가입 ════ -->
    <template v-else-if="step==='signup'">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">회원가입</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">정보를 입력하고 인증을 완료해 주세요</div>
      </div>

      <!-- 필수 -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--blue);margin-bottom:8px;padding:6px 10px;background:var(--blue-dim);border-radius:6px;">필수 정보</div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <input v-model="sf.memberNm" type="text" placeholder="이름 *" :style="IS">

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
            <button @click="verifyEmail" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">확인</button>
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
            <button @click="verifyPhone" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">확인</button>
          </div>
          <div v-if="sf.phoneVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 휴대폰 인증 완료</div>
        </div>

        <input v-model="sf.password"  type="password" placeholder="비밀번호 (6자 이상) *" :style="IS">
        <input v-model="sf.password2" type="password" placeholder="비밀번호 확인 *" :style="IS">
      </div>

      <!-- 선택 -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;padding:6px 10px;background:var(--bg-base);border-radius:6px;">선택 정보 (입력하면 주문 시 자동 완성)</div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">

        <!-- 주소 -->
        <div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            <input v-model="sf.postcode" placeholder="우편번호" readonly
              style="width:100px;flex-shrink:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.88rem;cursor:default;outline:none;">
            <button @click="openKakaoAddr" type="button"
              style="padding:0 14px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">
              📮 주소 검색
            </button>
          </div>
          <input v-model="sf.address" placeholder="도로명 주소" readonly
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.88rem;cursor:default;outline:none;margin-bottom:6px;">
          <input v-model="sf.addressDetail" placeholder="상세 주소 (동/호수 등)" :style="IS.replace('0.9rem','0.88rem')">
        </div>

        <!-- 생년월일 + 성별 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">생년월일</div>
            <input v-model="sf.birthdate" type="date"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;outline:none;">
          </div>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">성별</div>
            <div style="display:flex;gap:6px;">
              <button v-for="g in [{v:'M',l:'남성'},{v:'F',l:'여성'},{v:'',l:'선택안함'}]" :key="g.v"
                @click="sf.gender=g.v" type="button"
                style="flex:1;padding:9px 4px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.15s;"
                :style="sf.gender===g.v ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);' : 'background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);'">
                {{ g.l }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="signupErr" style="color:#e8587a;font-size:0.82rem;text-align:center;margin-bottom:10px;">{{ signupErr }}</div>
      <div style="display:flex;gap:10px;">
        <button @click="step='terms'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="doSignup" class="btn-blue" style="flex:2;padding:12px;">가입 완료</button>
      </div>
    </template>

    <!-- ════ SNS 회원가입 추가 정보 ════ -->
    <template v-else-if="step==='sns-signup'">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;margin-bottom:10px;"
          :style="'background:'+providerColor(snsProvider)+';color:'+providerTextColor(snsProvider)+';font-size:0.85rem;font-weight:700;'">
          {{ providerLabel(snsProvider) }}로 가입
        </div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">추가 정보 입력</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">가입 완료를 위해 추가 정보를 입력하세요</div>
      </div>

      <!-- 필수 -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--blue);margin-bottom:8px;padding:6px 10px;background:var(--blue-dim);border-radius:6px;">필수 정보</div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <input v-model="snsNickname" type="text" placeholder="이름 / 닉네임 *" :style="IS">
        <!-- 휴대폰 인증 -->
        <div>
          <div style="display:flex;gap:8px;">
            <input v-model="snsPhone" type="tel" placeholder="휴대폰 번호 (010-0000-0000) *" :disabled="snsPhoneVerified"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="sendSnsPhoneCode" :disabled="snsPhoneVerified"
              style="padding:11px 14px;border:1.5px solid var(--blue);border-radius:8px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:600;white-space:nowrap;"
              :style="snsPhoneVerified?'opacity:0.4;cursor:not-allowed;':''">
              {{ snsPhoneVerified ? '✓ 인증됨' : '코드 발송' }}
            </button>
          </div>
          <div v-if="snsPhoneCodeSent && !snsPhoneVerified" style="display:flex;gap:8px;margin-top:8px;">
            <input v-model="snsPhoneCode" type="text" placeholder="인증코드 6자리"
              style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="verifySnsPhone" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">확인</button>
          </div>
          <div v-if="snsPhoneVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 휴대폰 인증 완료</div>
        </div>
      </div>

      <!-- 선택 -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;padding:6px 10px;background:var(--bg-base);border-radius:6px;">선택 정보</div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <!-- 주소 -->
        <div>
          <div style="display:flex;gap:8px;margin-bottom:6px;">
            <input v-model="snsSf.postcode" placeholder="우편번호" readonly
              style="width:100px;flex-shrink:0;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.88rem;cursor:default;outline:none;">
            <button @click="openKakaoAddrSns" type="button"
              style="padding:0 14px;border:1.5px solid var(--blue);border-radius:8px;background:var(--blue-dim);color:var(--blue);font-size:0.82rem;font-weight:700;cursor:pointer;white-space:nowrap;">
              📮 주소 검색
            </button>
          </div>
          <input v-model="snsSf.address" placeholder="도로명 주소" readonly
            style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-base);color:var(--text-primary);font-size:0.88rem;cursor:default;outline:none;margin-bottom:6px;">
          <input v-model="snsSf.addressDetail" placeholder="상세 주소 (동/호수 등)" :style="IS.replace('0.9rem','0.88rem')">
        </div>
        <!-- 생년월일 + 성별 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;">
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">생년월일</div>
            <input v-model="snsSf.birthdate" type="date"
              style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.85rem;outline:none;">
          </div>
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">성별</div>
            <div style="display:flex;gap:6px;">
              <button v-for="g in [{v:'M',l:'남성'},{v:'F',l:'여성'},{v:'',l:'선택안함'}]" :key="g.v"
                @click="snsSf.gender=g.v" type="button"
                style="flex:1;padding:9px 4px;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.15s;"
                :style="snsSf.gender===g.v ? 'background:var(--blue);color:#fff;border:1.5px solid var(--blue);' : 'background:var(--bg-card);color:var(--text-secondary);border:1.5px solid var(--border);'">
                {{ g.l }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="snsErr" style="color:#e8587a;font-size:0.82rem;text-align:center;margin-bottom:10px;">{{ snsErr }}</div>
      <div style="display:flex;gap:10px;">
        <button @click="step='terms'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="doSnsSignup" class="btn-blue" style="flex:2;padding:12px;">가입 완료</button>
      </div>
    </template>

  </div>
</div>
  `
};
