/**
 * ShopJoy BO React Native App (관리자용).
 *
 * **FO 와의 차이점**:
 * - 외부 결제 앱 (카카오/토스) 위임 분기 단순화 (관리자는 결제 안 함)
 * - 자체 딥링크 scheme 이 `shopjoy-bo://` (FO 는 `shopjoy-fo://`)
 * - 스타일/색상이 다크 테마 (#1f2937)
 *
 * @see ShopjoyFoApp/App.tsx  FO 의 같은 컴포넌트 — 자세한 주석은 거기 참조
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

/** 환경별 BASE_URL — `.env.{env}` 의 `BASE_URL`. BO 는 보통 `/bo.html` 포함. */
const BASE_URL: string = Config.BASE_URL || 'http://10.0.2.2:5501/bo.html';

/**
 * 메인 App 컴포넌트 — 단일 WebView 호스트.
 */
export default function App() {
  sjLog.fn('App.render', { BASE_URL });

  /** WebView 인스턴스 ref — goBack / injectJavaScript 호출용. */
  const webRef = useRef<WebView>(null);

  /** WebView history back 가능 여부 — 하드웨어 back 처리용 ref. */
  const canGoBackRef = useRef(false);

  /** mount 시 1회 — back 핸들러 + 딥링크 리스너 등록. */
  useEffect(() => {
    sjLog.fn('App.useEffect:setup');
    sjLog.appStart({ baseUrl: BASE_URL });
    sjLog.lifecycle('App.mount');

    // Android 하드웨어 뒤로가기 — WebView history 우선.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sjLog.fn('hardwareBackPress', { canGoBack: canGoBackRef.current });
      if (canGoBackRef.current) {
        sjLog.d('webview.goBack()');
        webRef.current?.goBack();
        return true;
      }
      return false;
    });

    // 앱 실행 중 딥링크 수신.
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      sjLog.fn('Linking.url', { url });
      const js = `if (window.onAppDeepLink) window.onAppDeepLink('${url}');`;
      sjLog.webview('injectJavaScript (deepLink)', url, { js });
      webRef.current?.injectJavaScript(js);
    });

    // cold start 딥링크.
    Linking.getInitialURL().then(url => {
      if (url) sjLog.webview('initialDeepLink', url);
    }).catch(err => sjLog.e('getInitialURL failed', err));

    return () => {
      sjLog.fn('App.useEffect:cleanup');
      sjLog.lifecycle('App.unmount');
      sub.remove();
      linkingSub.remove();
    };
  }, []);

  /** WebView navigation 상태 변경 — canGoBack 갱신. */
  const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    sjLog.fn('onNavigationStateChange', {
      url: nav.url, title: nav.title, loading: nav.loading,
      canGoBack: nav.canGoBack, canGoForward: nav.canGoForward,
    });
    sjLog.webview('navigationStateChange', nav.url, { title: nav.title });
    canGoBackRef.current = nav.canGoBack;
  }, []);

  /**
   * 새 URL 로드 시작 직전 — 자체 딥링크 / intent: 만 외부 위임, 그 외 WebView 처리.
   */
  const onShouldStartLoadWithRequest = useCallback((req: any) => {
    sjLog.fn('onShouldStartLoadWithRequest', { url: req.url });
    const url: string = req.url || '';
    sjLog.webview('shouldStartLoad', url);

    // BO 는 결제 안 하므로 카카오/토스 scheme 분기 없음.
    if (url.startsWith('shopjoy-bo:') || url.startsWith('intent:')) {
      sjLog.webview('→ openExternalScheme', url);
      Linking.openURL(url).then(() => {
        sjLog.d('Linking.openURL ok', { url });
      }).catch(err => sjLog.e('Linking.openURL failed', err, { url }));
      return false;
    }
    sjLog.webview('→ allow', url);
    return true;
  }, []);

  /** 페이지 로드 시작. */
  const onLoadStart = useCallback((event: any) => {
    sjLog.webview('onLoadStart', event?.nativeEvent?.url);
  }, []);

  /** 페이지 로드 완료. */
  const onLoadEnd = useCallback((event: any) => {
    sjLog.webview('onLoadEnd', event?.nativeEvent?.url);
  }, []);

  /** WebView 에러. */
  const onError = useCallback((event: any) => {
    sjLog.e('WebView error', event?.nativeEvent, {
      url: event?.nativeEvent?.url,
      code: event?.nativeEvent?.code,
      description: event?.nativeEvent?.description,
    });
  }, []);

  /** WebView JS → RN 메시지 (postMessage). */
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    sjLog.fn('onMessage', { data: event.nativeEvent.data });
  }, []);

  /** 페이지 로딩 spinner. */
  const renderLoading = () => {
    sjLog.fn('renderLoading');
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f3f4f6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
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
        mixedContentMode={Platform.OS === 'android' ? 'always' : 'never'}
        userAgent={`ShopjoyBoApp-RN/${Platform.OS}`}
        startInLoadingState
        renderLoading={renderLoading}
      />
    </SafeAreaView>
  );
}

/** BO 다크 테마 스타일. */
const styles = StyleSheet.create({
  /** 다크 배경 + flex: 1. */
  flex: { flex: 1, backgroundColor: '#1f2937' },
  /** 로딩 spinner 가운데 정렬 + 다크 배경. */
  loading: {
    flex: 1,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
