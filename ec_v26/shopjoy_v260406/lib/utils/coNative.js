/**
 * coNative.js — Capacitor 네이티브 환경 공통 유틸 (FO/BO 공유)
 *
 * 역할:
 *  1) 네이티브 환경 감지 (window.coNative.isNative)
 *  2) FCM 푸시 토큰 수신 + 백엔드 등록 (window.coNative.initPush)
 *  3) Hardware Back 버튼 처리 (Android, window.coNative.bindBackButton)
 *  4) 앱 라이프사이클 이벤트 (window.coNative.bindAppState)
 *  5) Safe Area inset 자동 적용 (iOS notch)
 *
 * 의존: utils/coUtil.js (apiHdr) — 먼저 로드되어야 함
 *
 * 로드 순서 (index.html / bo.html):
 *   <script src="utils/coUtil.js"></script>
 *   <script src="utils/coNative.js"></script>
 */
(function (global) {
  'use strict';

  const Cap = global.Capacitor;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  const platform = Cap && typeof Cap.getPlatform === 'function' ? Cap.getPlatform() : 'web';

  function plugin(name) {
    return Cap && Cap.Plugins ? Cap.Plugins[name] : null;
  }

  /**
   * 푸시 알림 초기화
   * @param {Object} opts
   * @param {Object} opts.apiClient   - foApi | boApi
   * @param {String} opts.apiPath     - 토큰 등록 API 경로 (예: /fo/my/device-token)
   * @param {String} opts.uiNm        - X-UI-Nm 헤더값
   * @param {String} opts.cmdNm       - X-Cmd-Nm 헤더값
   * @param {Function} [opts.onTap]   - 푸시 탭 시 동작 (data 인자)
   * @param {Function} [opts.onShow]  - 포그라운드 수신 (notification 인자)
   */
  async function initPush(opts) {
    if (!isNative) {
      console.log('[coNative] 웹 환경 — 푸시 초기화 스킵');
      return false;
    }
    const PushNotifications = plugin('PushNotifications');
    const Device = plugin('Device');
    if (!PushNotifications) {
      console.warn('[coNative] PushNotifications 플러그인 없음');
      return false;
    }

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      console.warn('[coNative] 푸시 권한 거부됨');
      return false;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      try {
        const info = Device ? await Device.getInfo() : { platform };
        const body = {
          pushToken: token.value,
          deviceType: info.platform,
          deviceModel: info.model || '',
          deviceOs: `${info.platform} ${info.osVersion || ''}`.trim(),
          appVersion: global.__APP_VERSION__ || '1.0.0',
        };
        const hdr = global.coUtil && typeof global.coUtil.cofApiHdr === 'function'
          ? global.coUtil.cofApiHdr(opts.uiNm, opts.cmdNm)
          : {};
        await opts.apiClient.post(opts.apiPath, body, hdr);
        console.log('[coNative] 푸시 토큰 등록 완료');
      } catch (err) {
        console.error('[coNative] 푸시 토큰 등록 실패', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[coNative] FCM/APNs 등록 에러', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (noti) => {
      console.log('[coNative] 포그라운드 푸시', noti);
      if (typeof opts.onShow === 'function') {
        try { opts.onShow(noti); } catch (e) { console.error(e); }
      } else if (typeof global.showToast === 'function') {
        global.showToast(`${noti.title || ''} ${noti.body || ''}`.trim(), 'success');
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = (action.notification && action.notification.data) || {};
      console.log('[coNative] 푸시 탭', data);
      if (typeof opts.onTap === 'function') {
        try { opts.onTap(data); } catch (e) { console.error(e); }
      } else if (data.pageId && typeof global.navigate === 'function') {
        global.navigate(data.pageId, { dtlId: data.dtlId });
      }
    });

    return true;
  }

  /**
   * Android 뒤로가기 버튼 처리
   * @param {Function} handler ({ canGoBack }) => void  — 반환 false 시 기본 동작(앱 종료/뒤로) 수행
   */
  function bindBackButton(handler) {
    if (!isNative) return () => {};
    const App = plugin('App');
    if (!App) return () => {};
    const sub = App.addListener('backButton', (state) => {
      try {
        const handled = handler && handler(state);
        if (!handled && App.exitApp && state && state.canGoBack === false) {
          App.exitApp();
        }
      } catch (e) {
        console.error('[coNative] backButton handler error', e);
      }
    });
    return () => sub && sub.remove && sub.remove();
  }

  /**
   * 앱 포그라운드/백그라운드 전환 이벤트 바인딩
   */
  function bindAppState(handler) {
    if (!isNative) return () => {};
    const App = plugin('App');
    if (!App) return () => {};
    const sub = App.addListener('appStateChange', (state) => {
      try { handler && handler(state); } catch (e) { console.error(e); }
    });
    return () => sub && sub.remove && sub.remove();
  }

  /**
   * iOS notch / Android 상단 status bar 영역 보호 CSS 자동 주입
   */
  function applySafeArea() {
    if (!isNative) return;
    if (document.getElementById('co-native-safe-area')) return;
    const style = document.createElement('style');
    style.id = 'co-native-safe-area';
    style.textContent = `
      :root {
        --co-safe-top: env(safe-area-inset-top, 0px);
        --co-safe-bottom: env(safe-area-inset-bottom, 0px);
        --co-safe-left: env(safe-area-inset-left, 0px);
        --co-safe-right: env(safe-area-inset-right, 0px);
      }
      body {
        padding-top: var(--co-safe-top);
        padding-bottom: var(--co-safe-bottom);
        padding-left: var(--co-safe-left);
        padding-right: var(--co-safe-right);
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  }

  global.coNative = {
    isNative,
    platform,
    plugin,
    initPush,
    bindBackButton,
    bindAppState,
    applySafeArea,
  };

  // 자동 Safe Area 적용 (네이티브 진입 시)
  if (isNative && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applySafeArea);
    } else {
      applySafeArea();
    }
  }

  console.log(`[coNative] 초기화 — platform=${platform}, isNative=${isNative}`);
})(typeof window !== 'undefined' ? window : this);
