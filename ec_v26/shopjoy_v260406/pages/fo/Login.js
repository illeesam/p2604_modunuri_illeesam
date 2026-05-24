/* ShopJoy - Login / Signup Modal */
window.Login = {
  name: 'Login',
  props: {
    showToast: { type: Function, default: () => {} }, // 토스트 알림
  },
  emits: ['close'],
  setup(props, { emit }) {
    // ===== 초기 변수 정의 =====================================================

    const { ref, reactive, watch, onMounted } = Vue;

    /* -- UI 상태 -- */
    const uiState = reactive({ snsPhoneVerified: false, loading: false, error: null, isPageCodeLoad: false, step: 'login', snsProvider: null, loginErr: '', signupErr: '', _ec: '', _pc: '', snsNickname: '', snsPhoneCode: '', snsPhoneCodeSent: false, _spc: '', snsErr: ''});;
    const codes = reactive({});

    // ===== 초기 함수 (마운트 / 코드 로드 / watch) =============================

    /* fnLoadCodes — 공통코드 로드 */
    const fnLoadCodes = () => {
      try {
        uiState.isPageCodeLoad = true;
      } catch (err) {
        console.error('[fnLoadCodes]', err);
      }
    };
    const isAppReady = coUtil.cofUseAppCodeReady(uiState, fnLoadCodes);

    // ★ onMounted — 진입 시 코드 로드 + 목록 초기 조회
    onMounted(() => { if (isAppReady.value) fnLoadCodes(); });

    // login | terms | signup | sns-signup  → uiState.step 사용

    /* -- 로그인 -- */
    const form     = reactive({ email: 'user1@demo.com', password: 'demo1234' });

    // ===== 내장 사용 함수 (이벤트 핸들러 on* / handle*) =======================

    /* doLogin — 실행 */
    const doLogin = async () => {
      uiState.loginErr = '';
      if (!form.email || !form.password) { uiState.loginErr = '이메일과 비밀번호를 입력하세요.'; return; }
      const r = await window.foAuth.login(form.email, form.password);
      if (r.ok) {
        const userNm = window.foAuth.state.user?.authNm || window.foAuth.state.user?.memberNm || '사용자';
        props.showToast(userNm + '님, 환영합니다!', 'success');

        /* 로그인 후 초기화 데이터 조회 */
        try {
          const initStore = window.useFoAppInitStore?.();
          if (initStore) {
            await initStore.saFetchFoAppInitData();
          }
        } catch (e) {
          console.warn('[Login] fetchFoAppInitData error:', e);
        }

        emit('close');
      } else { uiState.loginErr = r.msg; }
    };

    /* -- 회원선택 모달 (개발용) -- */
    const memberPick = reactive({ show: false, searchType: '', searchValue: '', loading: false, rows: [], total: 0, pageNo: 1, pageSize: 20, totalPage: 1 });
    const PICK_SIZE = 20;
    // ===== 사용자 함수 (헬퍼 / 카운트 / 렌더 / 컬럼정의) ======================

    /* fo-grid 컬럼 — 특수 셀(이름/등급/상태/선택)은 #cell 슬롯으로 override */
    // --- [컬럼 정의] ---
    const memberPickGridColumns = [
      { key: 'memberNm', label: '이름',
        fmt: (v, row) => `${(row.memberNm || '?').charAt(0)} ${row.memberNm || '-'}`,
        cellInnerStyle: 'font-weight:700;color:var(--text-primary);white-space:nowrap;' },
      { key: 'loginId',  label: '로그인ID', mono: true, fmt: v => v || '-' },
      { key: 'siteNm',   label: '사이트', fmt: v => v || '-' },
      { key: 'gradeCdNm', label: '등급',
        fmt: v => v || '—',
        cellInnerStyle: (v) => v
          ? 'display:inline-block;padding:1px 7px;border-radius:9px;background:#ede9fe;color:#7c3aed;font-size:10px;font-weight:700;white-space:nowrap;'
          : 'color:var(--text-muted);' },
      { key: 'memberStatusCd', label: '상태', align: 'center',
        fmt: (v, row) => v === 'ACTIVE' ? '활성' : (row.memberStatusCdNm || '비활성'),
        cellInnerStyle: (v) => v === 'ACTIVE'
          ? 'display:inline-block;padding:1px 8px;border-radius:9px;background:#dcfce7;color:#16a34a;font-size:10px;font-weight:700;'
          : 'display:inline-block;padding:1px 8px;border-radius:9px;background:#fee2e2;color:#dc2626;font-size:10px;font-weight:700;' },
      { key: 'memberPhone', label: '연락처', fmt: v => v || '-' },
      { key: 'joinDate', label: '가입일', fmt: v => (v ? v.substring(0, 10) : '-') },
    ];

    /* _loadMemberPick — 로드 */
    const _loadMemberPick = async () => {
      memberPick.loading = true;
      try {
        const params = { searchValue: memberPick.searchValue, searchType: memberPick.searchType, pageNo: memberPick.pageNo, pageSize: PICK_SIZE };
        // searchValue 가 있는데 searchType 가 비어있으면 전체 필드로 검색
        if (params.searchValue && !params.searchType) {
          params.searchType = 'memberNm,loginId,memberPhone';
        }
        const res = await coApiSvc.mbMember.getPage(
          params,
          '로그인', '회원선택',
        );
        const d = res.data?.data || {};
        memberPick.rows = d.pageList || [];
        memberPick.total = d.pageTotalCount || 0;
        memberPick.totalPage = d.pageTotalPage || 1;
      } catch (e) {
        memberPick.rows = [];
      } finally {
        memberPick.loading = false;
      }
    };

    /* onOpenMemberPick — 이벤트 */
    const onOpenMemberPick = () => { memberPick.show = true; memberPick.searchType = ''; memberPick.searchValue = ''; memberPick.pageNo = 1; _loadMemberPick(); };

    /* onMemberPickSearch — 이벤트 */
    const onMemberPickSearch = () => { memberPick.pageNo = 1; _loadMemberPick(); };

    /* onMemberPickPage — 이벤트 */
    const onMemberPickPage = (p) => { memberPick.pageNo = p; _loadMemberPick(); };

    /* onPickMember — 이벤트 */
    const onPickMember = async (m) => {
      memberPick.show = false;
      form.email = m.loginId || m.memberEmail || '';
      form.password = '1111';
      await doLogin();
    };

    /* _callSocialSdk — 호출 소셜 SDK */
    const _callSocialSdk = async (provider) => {
      if (!window.coExtSdk) { throw new Error('coExtSdk 헬퍼가 로드되지 않았습니다.'); }
      if (provider === 'google') { return await window.coExtSdk.loginGoogle(); }
      if (provider === 'kakao') { return await window.coExtSdk.loginKakao(); }
      if (provider === 'naver') { return await window.coExtSdk.loginNaver(); }
      throw new Error('알 수 없는 provider: ' + provider);
    };

    /* doSocial — 실행 */
    const doSocial = async (provider) => {
      uiState.loginErr = '';
      try {
        const res = await _callSocialSdk(provider);
        console.log('[doSocial] SDK 응답:', res);
        // 추후: 서버에 res.accessToken / res.profile 전달하여 회원 매칭/세션 발급
        // 지금은 데모 흐름 유지 (foAuth.loginSocial 호출)
        window.foAuth.loginSocial(provider);
        const userNm = window.foAuth.state.user?.memberNm || (res.profile?.nickname || res.profile?.name || provider);
        props.showToast(userNm + '님, 환영합니다!', 'success');
        emit('close');
      } catch (e) {
        console.error('[doSocial] error:', e);
        uiState.loginErr = e.message || (provider + ' 로그인 실패');
        props.showToast(uiState.loginErr, 'error');
      }
    };

    /* startSnsSignup — 시작 SNS 회원가입 */
    const startSnsSignup = async (provider) => {
      uiState.snsErr = '';
      try {
        const res = await _callSocialSdk(provider);
        console.log('[startSnsSignup] SDK 응답:', res);
        uiState.snsProvider = provider;
        // 프로필이 있으면 닉네임 미리 채움
        const p = res.profile || {};
        // Kakao: p.kakao_account?.profile?.nickname / p.properties?.nickname
        // Naver: p.name / p.nickname
        // Google: p.name / p.given_name
        const nm = p.name || p.nickname
          || p.kakao_account?.profile?.nickname
          || p.properties?.nickname
          || '';
        if (nm) { uiState.snsNickname = nm; }
        uiState.step = 'terms';
      } catch (e) {
        console.error('[startSnsSignup] error:', e);
        uiState.snsErr = e.message || (provider + ' 인증 실패');
        props.showToast(uiState.snsErr, 'error');
      }
    };

    /* -- 약관 -- */
    const terms = reactive({ all: false, t1: false, t2: false, t3: false, t4: false });

    /* toggleAll — 전체 토글 */
    const toggleAll = () => { terms.t1 = terms.t2 = terms.t3 = terms.t4 = terms.all; };

    watch(() => [terms.t1, terms.t2, terms.t3, terms.t4], () => {
      terms.all = terms.t1 && terms.t2 && terms.t3 && terms.t4;
    });

    /* goNextFromTerms — 이동 */
    const goNextFromTerms = () => {
      uiState.step = uiState.snsProvider ? 'sns-signup' : 'signup';
    };

    /* _initSf — 초기화 */
    const _initSf = () => reactive({
      memberNm: '', email: '', emailCode: '', emailSent: false, emailVerified: false,
      phone: '', phoneCode: '', phoneSent: false, phoneVerified: false,
      password: '', password2: '',
      // 선택 정보
      postcode: '', address: '', addressDetail: '',
      birthdate: '', gender: '',
    });
    const sf       = _initSf();

    /* sendEmailCode — 전송 이메일 코드 */
    const sendEmailCode = () => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sf.email)) { uiState.signupErr = '올바른 이메일을 입력하세요.'; return; }
      uiState._ec = String(Math.floor(100000 + Math.random() * 900000));
      sf.emailSent = true; sf.emailVerified = false; uiState.signupErr = '';
      props.showToast('인증코드: ' + uiState._ec + '  (데모용)', 'info');
    };

    /* verifyEmail — 검증 이메일 */
    const verifyEmail = () => {
      if (sf.emailCode === uiState._ec) { sf.emailVerified = true; uiState.signupErr = ''; props.showToast('이메일 인증 완료!', 'success'); }
      else { uiState.signupErr = '인증코드가 올바르지 않습니다.'; }
    };

    /* sendPhoneCode — 전송 전화 코드 */
    const sendPhoneCode = () => {
      if (!/^010[-]?\d{4}[-]?\d{4}$/.test(sf.phone.replace(/\s/g, ''))) { uiState.signupErr = '올바른 휴대폰 번호를 입력하세요. (010-0000-0000)'; return; }
      uiState._pc = String(Math.floor(100000 + Math.random() * 900000));
      sf.phoneSent = true; sf.phoneVerified = false; uiState.signupErr = '';
      props.showToast('인증코드: ' + uiState._pc + '  (데모용)', 'info');
    };

    /* verifyPhone — 검증 전화 */
    const verifyPhone = () => {
      if (sf.phoneCode === uiState._pc) { sf.phoneVerified = true; uiState.signupErr = ''; props.showToast('휴대폰 인증 완료!', 'success'); }
      else { uiState.signupErr = '인증코드가 올바르지 않습니다.'; }
    };

    /* openKakaoAddr — 열기 */
    const openKakaoAddr = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) { props.showToast('주소 검색 서비스를 불러오는 중입니다.', 'info'); return; }
      new daum.Postcode({
        oncomplete(data) { sf.postcode = data.zonecode; sf.address = data.roadAddress || data.jibunAddress; }
      }).open();
    };

    /* doSignup — 실행 */
    const doSignup = async () => {
      uiState.signupErr = '';
      if (!sf.memberNm.trim())      { uiState.signupErr = '이름을 입력하세요.'; return; }
      if (!sf.emailVerified)    { uiState.signupErr = '이메일 인증이 필요합니다.'; return; }
      if (!sf.phoneVerified)    { uiState.signupErr = '휴대폰 인증이 필요합니다.'; return; }
      if (sf.password.length < 6){ uiState.signupErr = '비밀번호는 6자 이상이어야 합니다.'; return; }
      if (sf.password !== sf.password2){ uiState.signupErr = '비밀번호가 일치하지 않습니다.'; return; }
      const passwordHash = window.CryptoJS ? CryptoJS.SHA256(sf.password).toString() : sf.password;
      const r = await window.foAuth.signup(sf.memberNm, sf.email, sf.phone, {
        password: passwordHash,
        postcode: sf.postcode, address: sf.address, addressDetail: sf.addressDetail,
        birthdate: sf.birthdate, gender: sf.gender,
      });
      if (r.ok) {
        props.showToast('회원가입이 완료되었습니다!', 'success');
        emit('close');
      } else {
        uiState.signupErr = r.msg || '회원가입 실패';
      }
    };

    /* -- SNS 회원가입 제출 -- */
        const snsPhone    = ref('');

    /* providerLabel — 공급자 라벨 */
    const providerLabel = p => ({ google: 'Google', kakao: '카카오', naver: '네이버' }[p] || p);

    /* providerColor — 공급자 색상 */
    const providerColor = p => ({ google: '#fff', kakao: '#FEE500', naver: '#03C75A' }[p] || '#fff');

    /* providerTextColor — 공급자 Text 색상 */
    const providerTextColor = p => ({ google: '#333', kakao: '#3C1E1E', naver: '#fff' }[p] || '#333');

    /* sendSnsPhoneCode — 전송 SNS 전화 코드 */
    const sendSnsPhoneCode = () => {
      if (!/^010[-]?\d{4}[-]?\d{4}$/.test(snsPhone.value.replace(/\s/g, ''))) { uiState.snsErr = '올바른 휴대폰 번호를 입력하세요.'; return; }
      uiState._spc = String(Math.floor(100000 + Math.random() * 900000));
      uiState.snsPhoneCodeSent = true; uiState.snsPhoneVerified = false; uiState.snsErr = '';
      props.showToast('인증코드: ' + uiState._spc + '  (데모용)', 'info');
    };

    /* verifySnsPhone — 검증 SNS 전화 */
    const verifySnsPhone = () => {
      if (uiState.snsPhoneCode === uiState._spc) { uiState.snsPhoneVerified = true; uiState.snsErr = ''; props.showToast('휴대폰 인증 완료!', 'success'); }
      else { uiState.snsErr = '인증코드가 올바르지 않습니다.'; }
    };

    /* SNS 선택 정보 */
    const snsSf = reactive({ postcode: '', address: '', addressDetail: '', birthdate: '', gender: '' });

    /* openKakaoAddrSns — 열기 */
    const openKakaoAddrSns = () => {
      if (typeof daum === 'undefined' || !daum.Postcode) { props.showToast('주소 검색 서비스를 불러오는 중입니다.', 'info'); return; }
      new daum.Postcode({
        oncomplete(data) { snsSf.postcode = data.zonecode; snsSf.address = data.roadAddress || data.jibunAddress; }
      }).open();
    };

    /* doSnsSignup — 실행 */
    const doSnsSignup = async () => {
      uiState.snsErr = '';
      if (!uiState.snsNickname.trim()) { uiState.snsErr = '이름/닉네임을 입력하세요.'; return; }
      if (!uiState.snsPhoneVerified)   { uiState.snsErr = '휴대폰 인증이 필요합니다.'; return; }
      const demos = { google: 'google.sns@gmail.com', kakao: 'kakao.sns@kakao.com', naver: 'naver.sns@naver.com' };
      const r = await window.foAuth.signup(uiState.snsNickname, demos[uiState.snsProvider] || 'sns@demo.com', uiState.snsPhone, {
        provider: uiState.snsProvider,
        postcode: snsSf.postcode, address: snsSf.address, addressDetail: snsSf.addressDetail,
        birthdate: snsSf.birthdate, gender: snsSf.gender,
      });
      if (r.ok) {
        props.showToast(uiState.snsNickname + '님, 환영합니다!', 'success');
        emit('close');
      } else {
        uiState.snsErr = r.msg || '회원가입 실패';
      }
    };

    /* -- 공통 인풋 스타일 -- */
    const IS = 'width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;';

    // ===== return (템플릿 노출) ===============================================


    return {
      uiState, form, doLogin, doSocial, startSnsSignup,
      terms, toggleAll, goNextFromTerms,
      sf, sendEmailCode, verifyEmail, sendPhoneCode, verifyPhone, doSignup, openKakaoAddr,
      snsPhone,
      sendSnsPhoneCode, verifySnsPhone, doSnsSignup, snsSf, openKakaoAddrSns,
      providerLabel, providerColor, providerTextColor, IS, codes,
      foAuth: window.foAuth,
      memberPick, memberPickGridColumns, onOpenMemberPick, onMemberPickSearch, onMemberPickPage, onPickMember,
    };
  },
  template: /* html */ `
<div class="modal-overlay" @click.self="$emit('close')" style="z-index:200;">
  <!-- ===== ■. 로그인 화면 ================================================== -->
  <div class="modal-box" style="max-width:460px;width:92%;padding:clamp(16px,4vw,32px) clamp(14px,3vw,28px);position:relative;max-height:92vh;overflow-y:auto;">
    <button @click="$emit('close')" style="position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--text-muted);">
      ✕
    </button>
    <!-- ===== ■.■. ════ 로그인 ════ ========================================= -->
    <template v-if="uiState.step==='login'">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:2rem;">👗</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin-top:6px;">로그인</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">기본 계정: user1@demo.com / demo1234</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input v-model="form.email" type="email" placeholder="이메일" @keyup.enter="doLogin" :style="IS">
        <input v-model="form.password" type="password" placeholder="비밀번호" @keyup.enter="doLogin" :style="IS">
        <div v-if="uiState.loginErr" style="color:#e8587a;font-size:0.82rem;text-align:center;">{{ uiState.loginErr }}</div>
        <button @click="doLogin" :disabled="foAuth.state.loading" class="btn-blue" style="width:100%;padding:12px;">
          {{ foAuth.state.loading ? '로그인 중...' : '로그인' }}
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin:20px 0;color:var(--text-muted);font-size:0.8rem;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        소셜 로그인
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;">
        <button @click="doSocial('google')"
          style="width:100%;padding:11px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text-primary);font-weight:600;">
          <span style="font-size:1.1rem;">🌐</span>
          Google로 로그인
        </button>
        <button @click="doSocial('kakao')"
          style="width:100%;padding:11px;border:none;border-radius:8px;background:#FEE500;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:#3C1E1E;font-weight:700;">
          <span style="font-size:1.1rem;">💬</span>
          카카오로 로그인
        </button>
        <!-- ===== ■.■.■.■. 버튼 영역 ============================================= -->
        <button @click="doSocial('naver')"
          style="width:100%;padding:11px;border:none;border-radius:8px;background:#03C75A;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.88rem;color:#fff;font-weight:700;">
          <span style="font-size:1.1rem;font-weight:900;">N</span>
          네이버로 로그인
        </button>
      </div>
      <div style="text-align:center;margin-top:22px;"><span style="font-size:0.85rem;color:var(--text-muted);">아직 회원이 아니신가요?</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
        <button @click="uiState.snsProvider=null; uiState.step='terms'" class="btn-outline" style="width:100%;padding:10px;font-size:0.85rem;font-weight:700;">
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
      <!-- ===== ■.■.■. 회원선택 바로 로그인 (개발용) =================================== -->
      <!-- ===== ■.■.■. 영역 ================================================== -->
      <div style="text-align:center;margin-top:18px;">
        <button @click="onOpenMemberPick"
          style="background:none;border:none;cursor:pointer;font-size:0.72rem;color:var(--text-muted);text-decoration:underline;padding:0;">
          회원 선택하여 로그인 (개발)
        </button>
      </div>
    </template>
    <!-- ===== □.□. ════ 로그인 ════ ========================================= -->
    <!-- ===== ■.■. ════ 회원선택 모달 ════ ===================================== -->
    <div v-if="memberPick.show" class="modal-overlay" @click.self="memberPick.show=false" style="z-index:300;">
      <div style="background:#fff;border-radius:16px;overflow:hidden;max-width:820px;width:96%;display:flex;flex-direction:column;max-height:90vh;box-shadow:0 20px 60px rgba(0,0,0,.18);">
        <!-- ===== ■.■.■.■. 헤더 ================================================ -->
        <div style="background:linear-gradient(135deg,#fff0f4,#ffe4ec,#ffd5e1);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffc8d6;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">👥</span>
            <div>
              <div style="font-size:14px;font-weight:800;color:#1a1a2e;">회원 선택</div>
              <div style="font-size:10px;color:#e8587a;margin-top:1px;">선택 시 마스터 패스워드(1111)로 자동 로그인</div>
            </div>
          </div>
          <button @click="memberPick.show=false" style="background:none;border:none;cursor:pointer;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;color:#e8587a;" onmouseover="this.style.background='#ffd5e1'" onmouseout="this.style.background='none'">
            ✕
          </button>
        </div>
        <!-- ===== ■.■.■.■. 본문 (스크롤) ========================================== -->
        <div style="padding:14px 18px;overflow-y:auto;flex:1;">
          <!-- ===== ■.■.■.■.■. 검색바 ============================================= -->
          <div style="display:flex;gap:6px;margin-bottom:10px;">
            <div style="position:relative;flex:1;">
              <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#ccc;font-size:13px;">🔍</span>
              <bo-multi-check-select
                v-model="memberPick.searchType"
                :options="[
                { value: 'memberNm',    label: '이름' },
                { value: 'loginId',     label: '로그인ID' },
                { value: 'memberPhone', label: '연락처' },
                ]"
                placeholder="검색대상 전체"
                all-label="전체 선택"
                min-width="140px" />
              <input v-model="memberPick.searchValue" type="text" placeholder="검색어 입력..."
                @keyup.enter="onMemberPickSearch"
                style="width:100%;padding:7px 10px 7px 32px;border:1.5px solid #f0c8d8;border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;">
            </div>
            <!-- ===== ■.■.■.■.■.■. 버튼 영역 ========================================= -->
            <button @click="onMemberPickSearch"
              style="padding:0 16px;border:none;border-radius:8px;background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;cursor:pointer;font-size:12px;font-weight:700;">
              조회
            </button>
          </div>
          <!-- ===== ■.■.■.■.■. 건수 ============================================== -->
          <div style="font-size:11px;color:#aaa;margin-bottom:8px;text-align:left;">
            총
            <b style="color:#e8587a;">{{ memberPick.total }}</b>
            명
          </div>
          <!-- ===== ■.■.■.■.■. 테이블 ============================================= -->
          <div style="border-radius:8px;border:1px solid #f0e0e8;overflow:hidden;">
            <!-- ===== ■.■.■.■.■.■. 목록 영역 ========================================= -->
            <fo-grid bare :columns="memberPickGridColumns" :rows="memberPick.rows" :pager="memberPick"
              row-key="memberId" row-actions
              :empty-text="memberPick.loading ? '⏳ 조회 중...' : '🔍 조회 결과 없음'"
              :row-click="onPickMember">
              <template #row-actions="{ row }">
                <button @click.stop="onPickMember(row)" style="background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;border-radius:6px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;">
                  선택
                </button>
              </template>
            </fo-grid>
          </div>
        </div>
        <!-- ===== ■.■.■.■. 페이지네이션 (고정) ======================================= -->
        <div v-if="memberPick.totalPage > 1" style="display:flex;justify-content:center;align-items:center;gap:4px;padding:10px 18px;border-top:1px solid #f5eef2;flex-shrink:0;flex-wrap:wrap;">
          <button @click="onMemberPickPage(1)" :disabled="memberPick.pageNo===1"
            style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="memberPick.pageNo===1?'opacity:.35;cursor:default;':''">
            «
          </button>
          <button @click="onMemberPickPage(memberPick.pageNo-1)" :disabled="memberPick.pageNo===1"
            style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="memberPick.pageNo===1?'opacity:.35;cursor:default;':''">
            ‹
          </button>
          <template v-for="p in memberPick.totalPage" :key="p">
            <button v-if="Math.abs(p-memberPick.pageNo)<=2||p===1||p===memberPick.totalPage"
              @click="onMemberPickPage(p)"
              :style="memberPick.pageNo===p
              ? 'background:linear-gradient(135deg,#f9a8c9,#e8587a);color:#fff;border:none;font-weight:700;'
              : 'background:#fff;color:#888;border:1px solid #eee;'"
              style="min-width:28px;height:28px;border-radius:6px;font-size:11px;cursor:pointer;">
              {{ p }}
            </button>
          </template>
          <button @click="onMemberPickPage(memberPick.pageNo+1)" :disabled="memberPick.pageNo===memberPick.totalPage"
            style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="memberPick.pageNo===memberPick.totalPage?'opacity:.35;cursor:default;':''">
            ›
          </button>
          <button @click="onMemberPickPage(memberPick.totalPage)" :disabled="memberPick.pageNo===memberPick.totalPage"
            style="border:1px solid #f0c0d0;background:#fff;color:#e8587a;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;" :style="memberPick.pageNo===memberPick.totalPage?'opacity:.35;cursor:default;':''">
            »
          </button>
        </div>
      </div>
    </div>
    <!-- ===== □.□. ════ 회원선택 모달 ════ ===================================== -->
    <!-- ===== ■.■. ════ 약관 ════ ========================================== -->
    <template v-else-if="uiState.step==='terms'">
      <div style="text-align:center;margin-bottom:20px;">
        <div v-if="uiState.snsProvider" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;margin-bottom:10px;"
          :style="'background:'+providerColor(uiState.snsProvider)+';color:'+providerTextColor(uiState.snsProvider)+';font-size:0.82rem;font-weight:700;'">
          {{ providerLabel(uiState.snsProvider) }}로 가입
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
        <button @click="uiState.snsProvider=null; uiState.step='login'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="goNextFromTerms" :disabled="!(terms.t1&&terms.t2&&terms.t3)"
          class="btn-blue" style="flex:2;padding:12px;"
          :style="!(terms.t1&&terms.t2&&terms.t3)?'opacity:0.5;cursor:not-allowed;':''">
          다음
        </button>
      </div>
    </template>
    <!-- ===== □.□. ════ 약관 ════ ========================================== -->
    <!-- ===== ■.■. ════ 이메일 회원가입 ════ ==================================== -->
    <template v-else-if="uiState.step==='signup'">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:1.3rem;font-weight:800;color:var(--text-primary);">회원가입</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">정보를 입력하고 인증을 완료해 주세요</div>
      </div>
      <!-- ===== ■.■.■. 필수 ================================================== -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--blue);margin-bottom:8px;padding:6px 10px;background:var(--blue-dim);border-radius:6px;">
        필수 정보
      </div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <input v-model="sf.memberNm" type="text" placeholder="이름 *" :style="IS">
        <!-- ===== ■.■.■.■. 이메일 인증 ============================================ -->
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
            <button @click="verifyEmail" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">
              확인
            </button>
          </div>
          <div v-if="sf.emailVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 이메일 인증 완료</div>
        </div>
        <!-- ===== ■.■.■.■. 휴대폰 인증 ============================================ -->
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
            <button @click="verifyPhone" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">
              확인
            </button>
          </div>
          <div v-if="sf.phoneVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 휴대폰 인증 완료</div>
        </div>
        <input v-model="sf.password"  type="password" placeholder="비밀번호 (6자 이상) *" :style="IS">
        <input v-model="sf.password2" type="password" placeholder="비밀번호 확인 *" :style="IS">
      </div>
      <!-- ===== ■.■.■. 선택 ================================================== -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;padding:6px 10px;background:var(--bg-base);border-radius:6px;">
        선택 정보 (입력하면 주문 시 자동 완성)
      </div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <!-- ===== ■.■.■.■. 주소 ================================================ -->
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
        <!-- ===== ■.■.■.■. 생년월일 + 성별 ========================================= -->
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
      <div v-if="uiState.signupErr" style="color:#e8587a;font-size:0.82rem;text-align:center;margin-bottom:10px;">
        {{ uiState.signupErr }}
      </div>
      <div style="display:flex;gap:10px;">
        <button @click="uiState.step='terms'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="doSignup" class="btn-blue" style="flex:2;padding:12px;">가입 완료</button>
      </div>
    </template>
    <!-- ===== □.□. ════ 이메일 회원가입 ════ ==================================== -->
    <!-- ===== ■.■. ════ SNS 회원가입 추가 정보 ════ ============================== -->
    <template v-else-if="uiState.step==='sns-signup'">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;margin-bottom:10px;"
          :style="'background:'+providerColor(uiState.snsProvider)+';color:'+providerTextColor(uiState.snsProvider)+';font-size:0.85rem;font-weight:700;'">
          {{ providerLabel(uiState.snsProvider) }}로 가입
        </div>
        <div style="font-size:1.2rem;font-weight:800;color:var(--text-primary);">추가 정보 입력</div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">가입 완료를 위해 추가 정보를 입력하세요</div>
      </div>
      <!-- ===== ■.■.■. 필수 ================================================== -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--blue);margin-bottom:8px;padding:6px 10px;background:var(--blue-dim);border-radius:6px;">
        필수 정보
      </div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <input v-model="uiState.snsNickname" type="text" placeholder="이름 / 닉네임 *" :style="IS">
        <!-- ===== ■.■.■.■. 휴대폰 인증 ============================================ -->
        <div>
          <div style="display:flex;gap:8px;">
            <input v-model="snsPhone" type="tel" placeholder="휴대폰 번호 (010-0000-0000) *" :disabled="uiState.snsPhoneVerified"
              style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="sendSnsPhoneCode" :disabled="uiState.snsPhoneVerified"
              style="padding:11px 14px;border:1.5px solid var(--blue);border-radius:8px;background:transparent;color:var(--blue);cursor:pointer;font-size:0.82rem;font-weight:600;white-space:nowrap;"
              :style="uiState.snsPhoneVerified?'opacity:0.4;cursor:not-allowed;':''">
              {{ uiState.snsPhoneVerified ? '✓ 인증됨' : '코드 발송' }}
            </button>
          </div>
          <div v-if="uiState.snsPhoneCodeSent && !uiState.snsPhoneVerified" style="display:flex;gap:8px;margin-top:8px;">
            <input v-model="uiState.snsPhoneCode" type="text" placeholder="인증코드 6자리"
              style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-size:0.9rem;outline:none;">
            <button @click="verifySnsPhone" style="padding:10px 14px;border:none;border-radius:8px;background:var(--blue);color:#fff;cursor:pointer;font-size:0.82rem;font-weight:600;">
              확인
            </button>
          </div>
          <div v-if="uiState.snsPhoneVerified" style="font-size:0.8rem;color:#22c55e;margin-top:4px;">✓ 휴대폰 인증 완료</div>
        </div>
      </div>
      <!-- ===== ■.■.■. 선택 ================================================== -->
      <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;padding:6px 10px;background:var(--bg-base);border-radius:6px;">
        선택 정보
      </div>
      <div style="display:flex;flex-direction:column;gap:11px;margin-bottom:16px;">
        <!-- ===== ■.■.■.■. 주소 ================================================ -->
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
        <!-- ===== ■.■.■.■. 생년월일 + 성별 ========================================= -->
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
      <div v-if="uiState.snsErr" style="color:#e8587a;font-size:0.82rem;text-align:center;margin-bottom:10px;">{{ uiState.snsErr }}</div>
      <div style="display:flex;gap:10px;">
        <button @click="uiState.step='terms'" class="btn-outline" style="flex:1;padding:12px;">이전</button>
        <button @click="doSnsSignup" class="btn-blue" style="flex:2;padding:12px;">가입 완료</button>
      </div>
    </template>
  </div>
</div>

    <!-- ===== □.□. ════ SNS 회원가입 추가 정보 ════ ============================== -->
  <!-- ===== □. 로그인 화면 ================================================== -->`
};
