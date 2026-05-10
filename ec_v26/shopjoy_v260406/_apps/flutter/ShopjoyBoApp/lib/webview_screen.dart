// ShopJoy BO WebView 화면 (관리자용).
//
// FO 와의 차이점:
// - 외부 결제 앱 위임 분기 단순화 (BO 는 결제 안 함)
// - 자체 딥링크 scheme `shopjoy-bo://`
// - 다크 배경 (#1F2937)
//
// @see ShopjoyFoApp/lib/webview_screen.dart  FO 의 같은 파일 — 자세한 주석은 거기 참조

import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'env.dart';
import 'sj_log.dart';

/// WebView 화면 위젯 (StatefulWidget — controller 보유).
class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

/// [WebViewScreen] State.
class _WebViewScreenState extends State<WebViewScreen> {
  /// WebView 컨트롤러.
  late final WebViewController _controller;

  /// 페이지 로딩 중 spinner 표시 플래그.
  bool _loading = true;

  /// 딥링크 stream subscription (dispose 에서 cancel).
  StreamSubscription<Uri>? _linkSub;

  /// State 초기화.
  @override
  void initState() {
    SjLog.fn('_WebViewScreenState.initState');
    SjLog.lifecycle('WebViewScreen.initState');
    super.initState();

    /// BO BASE_URL — 보통 `/bo.html` 포함.
    final baseUrl = AppEnv.baseUrl;
    SjLog.d('baseUrl resolved', vars: {'baseUrl': baseUrl});

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      // BO 다크 배경.
      ..setBackgroundColor(const Color(0xFF1F2937))
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (url) {
          SjLog.fn('NavigationDelegate.onPageStarted', vars: {'url': url});
          SjLog.webview('onPageStarted', url);
        },
        onPageFinished: (url) {
          SjLog.fn('NavigationDelegate.onPageFinished', vars: {'url': url});
          SjLog.webview('onPageFinished', url);
          if (mounted) setState(() => _loading = false);
        },
        onWebResourceError: (err) {
          SjLog.e('WebView error', error: err, vars: {
            'errorCode': err.errorCode,
            'description': err.description,
            'errorType': err.errorType?.name,
          });
        },
        /// URL 진입 분기 — BO 는 자체 딥링크 + intent: 만 외부 위임.
        onNavigationRequest: (req) async {
          SjLog.fn('NavigationDelegate.onNavigationRequest',
                   vars: {'url': req.url, 'isMainFrame': req.isMainFrame});
          final url = req.url;
          SjLog.webview('onNavigationRequest', url);

          if (url.startsWith('shopjoy-bo:')) {
            SjLog.webview('→ deepLink (prevent)', url);
            await _injectDeepLink(Uri.parse(url));
            return NavigationDecision.prevent;
          }
          if (url.startsWith('intent:')) {
            SjLog.webview('→ externalApp (prevent)', url);
            try {
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

    SjLog.webview('loadRequest (initial)', baseUrl);
    _controller.loadRequest(Uri.parse(baseUrl));

    _setupAppLinks();
  }

  /// app_links 로 cold start + 실행 중 딥링크 모두 처리.
  Future<void> _setupAppLinks() async {
    SjLog.fn('_setupAppLinks');
    final appLinks = AppLinks();
    try {
      final initial = await appLinks.getInitialLink();
      SjLog.d('initial link', vars: {'initial': initial?.toString()});
      if (initial != null) await _injectDeepLink(initial);
    } catch (err, st) {
      SjLog.e('getInitialLink failed', error: err, stackTrace: st);
    }
    _linkSub = appLinks.uriLinkStream.listen((uri) async {
      SjLog.fn('uriLinkStream.listen', vars: {'uri': uri.toString()});
      await _injectDeepLink(uri);
    });
    SjLog.d('uriLinkStream subscribed');
  }

  /// 딥링크 URL 을 WebView JS 에 전달 — `window.onAppDeepLink(url)` 호출.
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

  /// State 폐기 — subscription 정리.
  @override
  void dispose() {
    SjLog.fn('_WebViewScreenState.dispose');
    SjLog.lifecycle('WebViewScreen.dispose');
    _linkSub?.cancel();
    super.dispose();
  }

  /// 위젯 트리 빌드.
  @override
  Widget build(BuildContext context) {
    SjLog.fn('_WebViewScreenState.build', vars: {'_loading': _loading});

    /// PopScope — 시스템 뒤로가기 가로채기 → WebView history 우선.
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        SjLog.fn('PopScope.onPopInvoked', vars: {'didPop': didPop});
        if (didPop) return;
        final canGoBack = await _controller.canGoBack();
        SjLog.d('canGoBack', vars: {'canGoBack': canGoBack});
        if (canGoBack) {
          SjLog.d('controller.goBack()');
          await _controller.goBack();
        } else if (mounted) {
          SjLog.d('Navigator.pop()');
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              // 로딩 spinner — BO 는 흰색 (다크 배경 대비).
              if (_loading)
                const Center(child: CircularProgressIndicator(color: Color(0xFFF3F4F6))),
            ],
          ),
        ),
      ),
    );
  }
}
