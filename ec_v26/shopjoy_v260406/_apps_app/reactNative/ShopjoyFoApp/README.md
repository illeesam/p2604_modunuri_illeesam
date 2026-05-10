# ShopJoy FO App (React Native)

ShopJoy 사용자(고객)용 **React Native** 앱 (TypeScript + react-native-webview).

## 환경 파일

| 파일 | URL | 용도 |
|---|---|---|
| `.env.local` | `http://10.0.2.2:5501` | 안드로이드 에뮬레이터 → 호스트 PC |
| `.env.dev` | `https://illeesam.netlify.app/mainframe#sj_index` | Netlify 개발 |
| `.env.prod` | `https://illeesam.netlify.app/mainframe#sj_index` | Netlify 운영 |

`react-native-config` 가 `Config.BASE_URL` 로 자동 주입.

## 초기 설치 (1회)

```bash
cd _apps/reactNative/ShopjoyFoApp
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
```

## 실행

```bash
# Metro 번들러 (별도 터미널)
npm start

# Android (환경별)
npm run android:local
npm run android:dev
npm run android:prod

# iOS (macOS, 환경별)
npm run ios:local
npm run ios:dev
npm run ios:prod
```

## 네이티브 디렉토리

`android/` 와 `ios/` 디렉토리는 RN init 으로 자동 생성됩니다. 만약 누락되면:

```bash
npx @react-native-community/cli init ShopjoyFoApp --version 0.75.4 --skip-install
# 생성된 ios/ android/ 폴더만 현재 위치로 이동, 나머지 source 는 유지
```

또는 `npx react-native-rename` 으로 패키지명 변경:

```bash
npx react-native-rename "ShopjoyFoApp" -b com.shopjoy.fo
```

## 주의

- `android/app/build.gradle` 의 `productFlavors` 를 `local/dev/prod` 로 분기 필요
- iOS 는 Xcode 에서 Scheme `ShopjoyFoApp-Local/Dev/Prod` 추가 필요
- `react-native-config` Android: `apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"` 추가 필요
