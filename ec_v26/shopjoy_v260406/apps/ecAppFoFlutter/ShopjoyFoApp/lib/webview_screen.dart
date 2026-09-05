// ShopJoy FO WebView 화면.
//
// 단일 webview_flutter 인스턴스로 ShopJoy 웹사이트 호스팅.
// - 환경별 BASE_URL ([AppEnv.baseUrl]) 로드
// - 외부 앱 (카카오/토스) URL → url_launcher 위임
// - 자체 딥링크 (`shopjoy-fo://`) → WebView JS (`window.onAppDeepLink`) 전달
// - app_links 패키지로 cold start / 실행 중 딥링크 모두 수신

import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'env.dart';
import 'sj_log.dart';

/// WebView 화면 위젯 (StatefulWidget — controller / subscription 보유 필요).
class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

/// [WebViewScreen] 의 State.
///
/// **소유 자원**:
/// - [_controller]: WebView native instance.
/// - [_loading]: 페이지 로딩 중 spinner 표시 플래그.
/// - [_linkSub]: 딥링크 stream subscription (dispose 에서 cancel).
class _WebViewScreenState extends State<WebViewScreen> {
  /// WebView 컨트롤러 — `late final` 로 [initState] 에서 1회 초기화.
  late final WebViewController _controller;

  /// 페이지 로딩 중 spinner 표시 여부.
  bool _loading = true;

  /// app_links 의 uriLinkStream subscription — 메모리 누수 방지를 위해 [dispose] 에서 cancel.
  StreamSubscription<Uri>? _linkSub;

  /// State 초기화 — WebView 컨트롤러 생성 + 초기 URL 로드 + 딥링크 리스너 등록.
  ///
  /// `initState` 는 build 보다 먼저 1회 호출. context 는 사용 가능하지만
  /// [InheritedWidget] 의존 작업은 [didChangeDependencies] 에서 권장.
  @override
  void initState() {
    SjLog.fn('_WebViewScreenState.initState');
    SjLog.lifecycle('WebViewScreen.initState');
    super.initState();

    /// 환경별 BASE_URL — `.env.{env}` 의 `BASE_URL`.
    final baseUrl = AppEnv.baseUrl;
    SjLog.d('baseUrl resolved', vars: {'baseUrl': baseUrl});

    // ── WebView 컨트롤러 생성 (cascade 로 chain 설정) ──
    _controller = WebViewController()
      // JS 실행 허용 (ShopJoy 페이지가 자체 JS 사용).
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      // FO 브랜드 핑크 배경.
      ..setBackgroundColor(const Color(0xFFFFF0F4))
      ..setNavigationDelegate(NavigationDelegate(
        // 페이지 로드 시작 — 새 URL 진입.
        onPageStarted: (url) {
          SjLog.fn('NavigationDelegate.onPageStarted', vars: {'url': url});
          SjLog.webview('onPageStarted', url);
        },
        // 페이지 로드 완료 — spinner 숨김.
        onPageFinished: (url) {
          SjLog.fn('NavigationDelegate.onPageFinished', vars: {'url': url});
          SjLog.webview('onPageFinished', url);
          if (mounted) setState(() => _loading = false);
        },
        // 네트워크 / 응답 에러.
        onWebResourceError: (err) {
          SjLog.e('WebView error',
                  error: err, vars: {
                    'errorCode': err.errorCode,
                    'description': err.description,
                    'errorType': err.errorType?.name,
                  });
        },
        /// URL 진입 결정 콜백 — `prevent` 또는 `navigate` 반환.
        ///
        /// **분기**:
        /// - `shopjoy-fo:` → 자체 딥링크 (prevent + JS 전달)
        /// - `kakao*:` / `supertoss:` / `intent:` → 외부 앱 (prevent + url_launcher)
        /// - 그 외 → WebView 가 직접 로드 (navigate)
        onNavigationRequest: (req) async {
          SjLog.fn('NavigationDelegate.onNavigationRequest',
                   vars: {'url': req.url, 'isMainFrame': req.isMainFrame});
          final url = req.url;
          SjLog.webview('onNavigationRequest', url);

          if (url.startsWith('shopjoy-fo:')) {
            SjLog.webview('→ deepLink (prevent)', url);
            await _injectDeepLink(Uri.parse(url));
            return NavigationDecision.prevent;
          }
          if (url.startsWith('kakaotalk:') ||
              url.startsWith('kakaopay:') ||
              url.startsWith('kakaolink:') ||
              url.startsWith('supertoss:') ||
              url.startsWith('intent:')) {
            SjLog.webview('→ externalApp (prevent)', url);
            try {
              // 외부 앱으로 위임 — Android 는 intent: 도 처리.
              final ok = await launchUrl(Uri.parse(url),
                                         mode: LaunchMode.externalApplication);
              SjLog.i('launchUrl result', vars: {'ok': ok, 'url': url});
            } catch (err, st) {
              SjLog.e('launchUrl failed', error: err, stackTrace: st,
                      vars: {'url': url});
            }
            return NavigationDecision.prevent;
          }
          SjLog.webview('→ navigate (allow)', url);
          return NavigationDecision.navigate;
        },
      ));

    // 초기 URL 로드.
    SjLog.webview('loadRequest (initial)', baseUrl);
    _controller.loadRequest(Uri.parse(baseUrl));

    _setupAppLinks();
  }

  /// app_links 라이브러리로 cold start + 실행 중 딥링크 모두 처리.
  ///
  /// - cold start: [AppLinks.getInitialLink] — 앱이 deeplink 로 시작된 경우.
  /// - 실행 중:    [AppLinks.uriLinkStream] — 앱이 백그라운드에 있을 때 deeplink 수신.
  Future<void> _setupAppLinks() async {
    SjLog.fn('_setupAppLinks');
    final appLinks = AppLinks();
    try {
      final initial = await appLinks.getInitialLink();
      SjLog.d('initial link', vars: {'initial': initial?.toString()});
      if (initial != null) {
        await _injectDeepLink(initial);
      }
    } catch (err, st) {
      SjLog.e('getInitialLink failed', error: err, stackTrace: st);
    }
    _linkSub = appLinks.uriLinkStream.listen((uri) async {
      SjLog.fn('uriLinkStream.listen', vars: {'uri': uri.toString()});
      await _injectDeepLink(uri);
    });
    SjLog.d('uriLinkStream subscribed');
  }

  /// 딥링크 URL 을 WebView JS 에 전달.
  ///
  /// `window.onAppDeepLink(url)` JS 함수가 SPA 라우팅 처리 책임.
  Future<void> _injectDeepLink(Uri uri) async {
    SjLog.fn('_injectDeepLink', vars: {'uri': uri.toString()});
    final js = "if (window.onAppDeepLink) window.onAppDeepLink('${uri.toString()}');";
    SjLog.webview('runJavaScript (deepLink)', uri.toString(), vars: {'js': js});
    try {
      await _controller.runJavaScript(js);
      SjLog.d('runJavaScript ok');
    } catch (err, st) {
      SjLog.e('runJavaScript failed', error: err, stackTrace: st);
    }
  }

  /// State 폐기 — subscription 정리 (메모리 누수 방지).
  @override
  void dispose() {
    SjLog.fn('_WebViewScreenState.dispose');
    SjLog.lifecycle('WebViewScreen.dispose');
    _linkSub?.cancel();
    super.dispose();
  }

  /// 위젯 트리 빌드 — 매 setState / 부모 rebuild 마다 호출.
  @override
  Widget build(BuildContext context) {
    SjLog.fn('_WebViewScreenState.build', vars: {'_loading': _loading});

    /// PopScope 로 시스템 뒤로가기 가로채기 — WebView history 우선.
    return PopScope(
      canPop: false,    // false = 시스템에 위임 X, onPopInvoked 가 처리.
      onPopInvoked: (didPop) async {
        SjLog.fn('PopScope.onPopInvoked', vars: {'didPop': didPop});
        if (didPop) return;
        final canGoBack = await _controller.canGoBack();
        SjLog.d('canGoBack', vars: {'canGoBack': canGoBack});
        if (canGoBack) {
          SjLog.d('controller.goBack()');
          await _controller.goBack();
        } else if (mounted) {
          // WebView history 의 첫 페이지 — 화면 닫기 (또는 앱 종료).
          SjLog.d('Navigator.pop()');
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        body: SafeArea(
          // SafeArea — 노치 / 시스템바 영역 회피.
          child: Stack(
            children: [
              // WebView 본체.
              WebViewWidget(controller: _controller),
              // 페이지 로딩 중 spinner 오버레이.
              if (_loading)
                const Center(child: CircularProgressIndicator(color: Color(0xFFC9356B))),
            ],
          ),
        ),
      ),
    );
  }
}
