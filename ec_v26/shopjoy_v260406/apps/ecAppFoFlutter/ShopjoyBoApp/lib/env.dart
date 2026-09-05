// ShopjoyBoApp 환경 설정 접근자.
//
// `.env.{local|dev|prod}` 의 키-값을 [AppEnv] 로 노출.
// 빌드 시 `--dart-define=APP_ENV=...` 로 환경 선택 → [envFile] 분기.
//
// **순환 참조 주의**: SjLog 가 [appEnv] 사용 → 본 클래스는 SjLog 호출 X.

import 'package:flutter_dotenv/flutter_dotenv.dart';

/// 환경 설정 접근자 (BO).
class AppEnv {

  /// 컴파일 시점에 결정되는 환경 이름.
  /// `--dart-define=APP_ENV=prod` 로 주입. 미주입 시 'local'.
  static const String _appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'local');

  /// `dotenv.load()` 가 읽을 .env 파일명.
  /// pubspec.yaml 의 `assets:` 에 모두 등록되어야 함.
  static String get envFile {
    switch (_appEnv) {
      case 'prod': return '.env.prod';
      case 'dev':  return '.env.dev';
      case 'local':
      default:     return '.env.local';
    }
  }

  /// 앱 표시 이름 (예: "ShopJoy BO Local").
  static String get appName  => dotenv.maybeGet('APP_NAME')  ?? 'ShopJoy BO';

  /// WebView 가 로드할 BO URL — 보통 `/bo.html` 포함.
  static String get baseUrl  => dotenv.maybeGet('BASE_URL')  ?? 'http://10.0.2.2:5501/bo.html';

  /// 환경 이름 — dotenv 의 `APP_ENV` 우선, 없으면 dart-define 의 `_appEnv`.
  static String get appEnv   => dotenv.maybeGet('APP_ENV')   ?? _appEnv;
}
