/**
 * ShopJoy FO React Native App.
 *
 * **역할**:
 * - WebView 1개로 ShopJoy FO 웹사이트 호스팅
 * - 환경별 BASE_URL (`.env.local|dev|prod`) 을 react-native-config 로 주입
 * - 하드웨어 뒤로가기 (Android) → WebView history 우선
 * - 딥링크 (`shopjoy-fo://`) → WebView JS 에 전달 (`window.onAppDeepLink`)
 * - 외부 앱 (카카오/토스) URL → Linking.openURL 로 OS 위임
 *
 * 모든 함수에 sjLog 진입 로그 + 주요 변수 출력 + WebView URL 추적.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  WebView,
  WebViewNavigation,
  type WebViewMessageEvent,
} from 'react-native-webview';
import Config from 'react-native-config';

import { sjLog } from './src/sjLog';

/**
 * 환경별 BASE_URL — `.env.{env}` 의 `BASE_URL`.
 * 기본값: 안드로이드 에뮬레이터에서 호스트 PC localhost 접근용 (`10.0.2.2`).
 */
const BASE_URL: string = Config.BASE_URL || 'http://10.0.2.2:5501';

/**
 * 메인 App 컴포넌트 — 단일 WebView 호스트.
 *
 * 함수 컴포넌트 — useEffect 로 라이프사이클 처리.
 */
export default function App() {
  // 매 render 마다 호출 — 디버깅용 (운영에서는 노이즈 가능, 필요 시 제거).
  sjLog.fn('App.render', { BASE_URL });

  /**
   * WebView 인스턴스 ref — goBack / injectJavaScript 호출용.
   * `useRef` 사용으로 render 사이 인스턴스 유지.
   */
  const webRef = useRef<WebView>(null);

  /**
   * WebView history 의 뒤로가기 가능 여부 — 하드웨어 back 버튼 처리에 사용.
   * `useRef` 사용 이유: 콜백 closure 안에서 최신 값 참조 (state 면 stale 가능).
   */
  const canGoBackRef = useRef(false);

  /**
   * mount 시 1회 — 하드웨어 back 핸들러 + 딥링크 리스너 등록.
   * unmount 시 정리.
   */
  useEffect(() => {
    sjLog.fn('App.useEffect:setup');
    sjLog.appStart({ baseUrl: BASE_URL });    // Metro Console 에 빌드 정보 명시.
    sjLog.lifecycle('App.mount');

    // ── Android 하드웨어 뒤로가기 핸들러 ──
    // true 반환 시 시스템 기본 동작(앱 종료) 차단.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sjLog.fn('hardwareBackPress', { canGoBack: canGoBackRef.current });
      if (canGoBackRef.current) {
        sjLog.d('webview.goBack()');
        webRef.current?.goBack();
        return true;     // 시스템 처리 차단.
      }
      sjLog.d('let system handle back press');
      return false;      // 시스템에 위임 (앱 종료).
    });

    // ── 딥링크 리스너 (앱 실행 중에 deeplink 수신) ──
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      sjLog.fn('Linking.url', { url });
      // WebView JS 의 onAppDeepLink 함수에 URL 전달 — SPA 라우팅 위임.
      const js = `if (window.onAppDeepLink) window.onAppDeepLink('${url}');`;
      sjLog.webview('injectJavaScript (deepLink)', url, { js });
      webRef.current?.injectJavaScript(js);
    });

    // ── cold start 딥링크 (앱이 deeplink 로 시작된 경우) ──
    Linking.getInitialURL().then(url => {
      if (url) {
        sjLog.d('initial deepLink', { url });
        sjLog.webview('initialDeepLink', url);
      }
    }).catch(err => sjLog.e('getInitialURL failed', err));

    // cleanup — unmount 또는 hot reload 시.
    return () => {
      sjLog.fn('App.useEffect:cleanup');
      sjLog.lifecycle('App.unmount');
      sub.remove();
      linkingSub.remove();
    };
  }, []);

  /**
   * WebView 의 navigation 상태 변경 시 호출.
   * canGoBack 정보를 ref 에 저장 (하드웨어 back 처리에 사용).
   */
  const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    sjLog.fn('onNavigationStateChange', {
      url: nav.url,
      title: nav.title,
      loading: nav.loading,
      canGoBack: nav.canGoBack,
      canGoForward: nav.canGoForward,
    });
    sjLog.webview('navigationStateChange', nav.url, {
      title: nav.title, loading: nav.loading,
    });
    canGoBackRef.current = nav.canGoBack;
  }, []);

  /**
   * 새 URL 로드 시작 직전 호출 — true 반환 시 WebView 가 로드, false 면 차단.
   *
   * **분기 정책**:
   * - `shopjoy-fo:` / `kakao*:` / `supertoss:` / `intent:` → Linking.openURL (외부 앱 위임)
   * - 그 외 → WebView 가 직접 로드
   */
  const onShouldStartLoadWithRequest = useCallback((req: any) => {
    sjLog.fn('onShouldStartLoadWithRequest', { url: req.url });
    const url: string = req.url || '';
    sjLog.webview('shouldStartLoad', url);

    if (
      url.startsWith('shopjoy-fo:') ||
      url.startsWith('kakaotalk:') ||
      url.startsWith('kakaopay:') ||
      url.startsWith('kakaolink:') ||
      url.startsWith('supertoss:') ||
      url.startsWith('intent:')
    ) {
      sjLog.webview('→ openExternalScheme', url);
      Linking.openURL(url).then(() => {
        sjLog.d('Linking.openURL ok', { url });
      }).catch(err => sjLog.e('Linking.openURL failed', err, { url }));
      return false;
    }
    sjLog.webview('→ allow', url);
    return true;
  }, []);

  /** 페이지 로드 시작 콜백. */
  const onLoadStart = useCallback((event: any) => {
    sjLog.webview('onLoadStart', event?.nativeEvent?.url);
  }, []);

  /** 페이지 로드 완료 콜백. */
  const onLoadEnd = useCallback((event: any) => {
    sjLog.webview('onLoadEnd', event?.nativeEvent?.url);
  }, []);

  /** WebView 에러 콜백 (네트워크 / 응답 처리 실패). */
  const onError = useCallback((event: any) => {
    sjLog.e('WebView error', event?.nativeEvent, {
      url: event?.nativeEvent?.url,
      code: event?.nativeEvent?.code,
      description: event?.nativeEvent?.description,
    });
  }, []);

  /**
   * WebView JS → RN 메시지 수신.
   * WebView 내부 JS 에서 `window.ReactNativeWebView.postMessage('...')` 호출 시.
   */
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    sjLog.fn('onMessage', { data: event.nativeEvent.data });
  }, []);

  /** 페이지 로딩 중 표시될 spinner. */
  const renderLoading = () => {
    sjLog.fn('renderLoading');
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#c9356b" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff0f4" />
      <WebView
        ref={webRef}
        source={{ uri: BASE_URL }}
        style={styles.flex}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        // Android 는 HTTPS 안 HTTP 리소스 허용 (운영은 차단 권장).
        mixedContentMode={Platform.OS === 'android' ? 'always' : 'never'}
        // 백엔드 트래픽 분석용 — 모바일 앱 식별자.
        userAgent={`ShopjoyFoApp-RN/${Platform.OS}`}
        startInLoadingState
        renderLoading={renderLoading}
      />
    </SafeAreaView>
  );
}

/** 화면 전체 + 로딩 스타일. */
const styles = StyleSheet.create({
  /** 모든 컨테이너의 flex: 1 + 브랜드 배경색. */
  flex: { flex: 1, backgroundColor: '#fff0f4' },
  /** 페이지 로딩 중 spinner 가운데 정렬. */
  loading: {
    flex: 1,
    backgroundColor: '#fff0f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
