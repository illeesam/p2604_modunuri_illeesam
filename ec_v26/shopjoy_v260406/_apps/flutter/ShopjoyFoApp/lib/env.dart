// ShopjoyFoApp 환경 설정 접근자.
//
// `.env.{local|dev|prod}` 파일의 키-값을 [AppEnv] static getter 로 노출.
// 빌드 시점에 `--dart-define=APP_ENV=local` 등으로 환경 선택 → [envFile] 분기.
//
// **순환 참조 주의**: SjLog 가 [appEnv] 를 읽으므로 본 클래스는 SjLog 사용 X.

import 'package:flutter_dotenv/flutter_dotenv.dart';

/// 환경 설정 접근자 — `.env.{env}` 파일의 값을 노출.
class AppEnv {

  /// 컴파일 시점에 결정되는 환경 이름.
  ///
  /// 빌드 시 `--dart-define=APP_ENV=prod` 로 주입.
  /// 미주입 시 'local' 기본.
  static const String _appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'local');

  /// `dotenv.load()` 가 읽을 .env 파일명.
  ///
  /// pubspec.yaml 의 `assets:` 에 .env.local / .env.dev / .env.prod 모두 등록되어 있어야 함.
  static String get envFile {
    switch (_appEnv) {
      case 'prod':
        return '.env.prod';
      case 'dev':
        return '.env.dev';
      case 'local':
      default:
        return '.env.local';
    }
  }

  /// 앱 표시 이름 (예: "ShopJoy FO Local"). dotenv 미로드 시 'ShopJoy' 기본.
  static String get appName  => dotenv.maybeGet('APP_NAME')  ?? 'ShopJoy';

  /// WebView 가 로드할 URL. 안드로이드 에뮬레이터 호스트 PC 접근용 `10.0.2.2` 기본.
  static String get baseUrl  => dotenv.maybeGet('BASE_URL')  ?? 'http://10.0.2.2:5501';

  /// 환경 이름 — dotenv 의 `APP_ENV` 우선, 없으면 dart-define 의 `_appEnv`.
  static String get appEnv   => dotenv.maybeGet('APP_ENV')   ?? _appEnv;
}
