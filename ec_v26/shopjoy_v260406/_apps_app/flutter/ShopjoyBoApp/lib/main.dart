// ShopJoy BO Flutter App (관리자용).
//
// 환경 분기는 빌드 시 `--dart-define=APP_ENV=local` 로 선택.
// 모든 함수에 SjLog 진입 로그 + 주요 변수 출력.
//
// @see ShopjoyFoApp/lib/main.dart  FO 의 같은 파일 — 자세한 주석은 거기 참조

import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'env.dart';
import 'sj_log.dart';
import 'webview_screen.dart';

/// 앱 진입점 (BO).
Future<void> main() async {
  SjLog.fn('main');

  // Flutter 엔진 binding 초기화.
  WidgetsFlutterBinding.ensureInitialized();
  SjLog.d('WidgetsFlutterBinding.ensureInitialized done');

  // .env 파일 로드 — pubspec.yaml assets 에 등록 필수.
  try {
    await dotenv.load(fileName: AppEnv.envFile);
    SjLog.d('dotenv loaded', vars: {'envFile': AppEnv.envFile});
  } catch (err, st) {
    SjLog.e('dotenv load failed', error: err, stackTrace: st,
            vars: {'envFile': AppEnv.envFile});
  }

  // 빌드/환경 정보 명시 출력.
  SjLog.appStart(extra: {
    'envFile': AppEnv.envFile,
    'appName': AppEnv.appName,
    'baseUrl': AppEnv.baseUrl,
  });

  // 위젯 트리 에러 캐치.
  FlutterError.onError = (FlutterErrorDetails details) {
    SjLog.e('FlutterError.onError',
            error: details.exception, stackTrace: details.stack);
  };
  // 비동기 / 플랫폼 채널 에러 캐치.
  PlatformDispatcher.instance.onError = (error, stack) {
    SjLog.e('PlatformDispatcher.onError', error: error, stackTrace: stack);
    return true;     // 에러 처리 완료 표시 (앱 크래시 방지).
  };

  SjLog.lifecycle('main.runApp');
  runApp(const ShopjoyBoApp());
}

/// 앱의 root MaterialApp (BO 다크 테마).
class ShopjoyBoApp extends StatelessWidget {
  const ShopjoyBoApp({super.key});

  @override
  Widget build(BuildContext context) {
    SjLog.fn('ShopjoyBoApp.build');
    final title = AppEnv.appName;
    SjLog.d('MaterialApp constructed', vars: {'title': title});
    return MaterialApp(
      title: title,
      theme: ThemeData(
        // BO 는 다크 테마 — 관리자 식별 + 장시간 사용 눈 피로 감소.
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1F2937),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
