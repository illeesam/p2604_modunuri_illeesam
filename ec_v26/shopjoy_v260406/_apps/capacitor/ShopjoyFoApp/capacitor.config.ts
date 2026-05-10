import { CapacitorConfig } from '@capacitor/cli';

/**
 * ShopJoy FO 앱 (사용자/고객용) Capacitor 설정
 *
 * server.url 은 scripts/set-env.js 가 npm run config:local | config:prod 실행 시
 * 자동으로 갱신한다. 직접 편집하지 말 것.
 *
 * - local: http://127.0.0.1:5501              (Live Server, FO index.html)
 * - prod : https://illeesam.netlify.app/mainframe#sj_index
 */
const config: CapacitorConfig = {
  appId: 'com.shopjoy.fo',
  appName: 'ShopJoy',
  webDir: 'www',
  server: {
    // !!! AUTO-GENERATED — do not edit by hand !!!
    url: 'http://10.0.2.2:5501',
    cleartext: true,
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#fff0f4',
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
