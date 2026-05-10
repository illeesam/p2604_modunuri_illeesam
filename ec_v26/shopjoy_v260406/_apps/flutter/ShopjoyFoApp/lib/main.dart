// ShopJoy FO Flutter App.
//
// 환경 분기는 빌드 시 `--dart-define=APP_ENV=local` 로 [AppEnv._appEnv] 결정.
// 그 값에 따라 .env.{local|dev|prod} 파일이 [dotenv] 로 로드됨.
//
// 모든 함수에 SjLog 진입 로그 + 주요 변수 출력.

import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'env.dart';
import 'sj_log.dart';
import 'webview_screen.dart';

/// 앱 진입점.
///
/// 호출 순서:
/// 1. [WidgetsFlutterBinding.ensureInitialized] — Flutter 엔진 준비 (async 작업 시 필수).
/// 2. [dotenv.load] — `.env.{env}` 파일 로드 (실패해도 앱은 시작).
/// 3. [SjLog.appStart] — 빌드/환경 정보 명시 출력.
/// 4. [FlutterError.onError] / [PlatformDispatcher.onError] 등록 — 전역 에러 캐치.
/// 5. [runApp] — UI 트리 마운트.
Future<void> main() async {
  SjLog.fn('main');

  // Flutter 엔진과 binding 준비 — runApp 이전에 비동기 작업 수행 시 필수.
  WidgetsFlutterBinding.ensureInitialized();
  SjLog.d('WidgetsFlutterBinding.ensureInitialized done');

  // .env 파일 로드 — pubspec.yaml 의 assets 에 등록된 .env.local/.env.dev/.env.prod.
  try {
    await dotenv.load(fileName: AppEnv.envFile);
    SjLog.d('dotenv loaded', vars: {'envFile': AppEnv.envFile});
  } catch (err, st) {
    SjLog.e('dotenv load failed', error: err, stackTrace: st,
            vars: {'envFile': AppEnv.envFile});
  }

  // 빌드/환경 정보 명시 출력 — 운영 로그 분석 시 빌드 추적용.
  SjLog.appStart(extra: {
    'envFile': AppEnv.envFile,
    'appName': AppEnv.appName,
    'baseUrl': AppEnv.baseUrl,
  });

  // ───── 전역 에러 캐치 ─────

  /// Flutter framework 내부에서 발생한 위젯 트리 에러.
  /// (build/layout/paint 단계 등)
  FlutterError.onError = (FlutterErrorDetails details) {
    SjLog.e('FlutterError.onError',
            error: details.exception, stackTrace: details.stack,
            vars: {'library': details.library, 'context': details.context?.toString()});
  };

  /// Dart Zone 외부 / 비동기 / 플랫폼 채널 에러.
  /// 본 콜백이 `true` 반환 → 에러 처리 완료 (앱 크래시 방지).
  PlatformDispatcher.instance.onError = (error, stack) {
    SjLog.e('PlatformDispatcher.onError', error: error, stackTrace: stack);
    return true;
  };

  SjLog.lifecycle('main.runApp');
  runApp(const ShopjoyFoApp());
}

/// 앱의 root MaterialApp — 단일 [WebViewScreen] 만 표시.
class ShopjoyFoApp extends StatelessWidget {
  /// const 생성자 — 매 build 마다 새 객체 안 만들도록 (성능).
  const ShopjoyFoApp({super.key});

  /// MaterialApp 위젯 트리 구성.
  @override
  Widget build(BuildContext context) {
    SjLog.fn('ShopjoyFoApp.build');
    final title = AppEnv.appName;
    SjLog.d('MaterialApp constructed', vars: {'title': title});
    return MaterialApp(
      title: title,
      theme: ThemeData(
        // 브랜드 핑크 색상 기준 자동 색상 생성.
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFC9356B)),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
      debugShowCheckedModeBanner: false,    // debug 빌드의 우상단 'DEBUG' 배너 제거.
    );
  }
}
