package com.shopjoy.fo

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import com.shopjoy.fo.databinding.ActivityMainBinding
import com.shopjoy.fo.util.SjLog

/**
 * ShopjoyFoApp 의 단일 [Activity] — WebView 1개로 ShopJoy 웹사이트 전체를 호스팅.
 *
 * **역할**:
 * 1. WebView 초기 설정 (JavaScript / DOM Storage / UA 등)
 * 2. WebView 가 로드한 페이지의 URL 진입을 가로채서 외부 앱(카카오/토스) / 자체 딥링크 분기
 * 3. Android 13+ 푸시 권한 (POST_NOTIFICATIONS) 요청
 * 4. 하드웨어 뒤로가기 버튼 처리 (WebView 히스토리 우선)
 * 5. 딥링크 (`shopjoy-fo://...`) 수신 시 WebView 에 JavaScript 로 전달
 *
 * 환경별 BASE_URL 은 [BuildConfig.BASE_URL] 로 빌드 시점에 주입됨 (Gradle Flavor).
 */
class MainActivity : AppCompatActivity() {

    /** ViewBinding — `activity_main.xml` 의 모든 view 에 type-safe 접근. */
    private lateinit var binding: ActivityMainBinding

    /**
     * Android 13 (API 33) 이상에서 POST_NOTIFICATIONS 런타임 권한 요청용 launcher.
     *
     * [registerForActivityResult] 는 Activity 생성 단계에서만 호출 가능 (LifecycleOwner 의존).
     * 콜백은 사용자가 권한 다이얼로그에서 응답한 시점에 호출됨.
     */
    private val pushPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        SjLog.fn("pushPermissionLauncher.callback", "granted" to granted)
        SjLog.i("POST_NOTIFICATIONS permission result", "granted" to granted)
    }

    /**
     * Activity 생성 시 호출 — WebView 초기화 + 초기 URL 로드 + 권한 요청.
     *
     * @param savedInstanceState  rotation 등으로 재생성된 경우 이전 상태 (현재 코드는 미사용).
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        SjLog.fn("onCreate", "savedInstanceState" to (savedInstanceState != null))
        SjLog.lifecycle("Activity.onCreate")
        super.onCreate(savedInstanceState)

        // 시스템바 (status bar / navigation bar) 영역까지 컨텐츠 확장 — 노치/펀치홀 디자인.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        SjLog.d("layout inflated and set")

        setupWebView()
        loadInitialUrl(intent)
        requestPushPermissionIfNeeded()
        registerBackPressed()
        SjLog.lifecycle("Activity.onCreate.end")
    }

    /** Activity 가 사용자에게 보이기 시작 — WebView 일시정지 해제 등. */
    override fun onStart() {
        SjLog.fn("onStart")
        SjLog.lifecycle("Activity.onStart")
        super.onStart()
    }

    /** Activity 가 포커스를 얻어 사용자 입력을 받기 시작 — 카메라/센서 등 자원 획득 시점. */
    override fun onResume() {
        SjLog.fn("onResume")
        SjLog.lifecycle("Activity.onResume")
        super.onResume()
    }

    /** Activity 가 포커스를 잃음 — 카메라/센서 등 자원 해제 시점. */
    override fun onPause() {
        SjLog.fn("onPause")
        SjLog.lifecycle("Activity.onPause")
        super.onPause()
    }

    /** Activity 가 더 이상 사용자에게 보이지 않음. */
    override fun onStop() {
        SjLog.fn("onStop")
        SjLog.lifecycle("Activity.onStop")
        super.onStop()
    }

    /** Activity 종료 — WebView 해제 등 마무리 (현재는 별도 해제 없음). */
    override fun onDestroy() {
        SjLog.fn("onDestroy")
        SjLog.lifecycle("Activity.onDestroy")
        super.onDestroy()
    }

    /**
     * 이미 실행 중인 Activity 에 새 [Intent] 가 들어왔을 때 호출.
     *
     * **호출 시점**: 앱이 백그라운드에 있을 때 딥링크 (`shopjoy-fo://pay/success?...`) 가
     * 실행되어 같은 Activity 가 재포커스되는 경우.
     */
    override fun onNewIntent(intent: Intent) {
        SjLog.fn("onNewIntent", "action" to intent.action, "data" to intent.dataString)
        super.onNewIntent(intent)
        handleDeepLink(intent)
    }

    /**
     * WebView 초기 설정 — JavaScript 활성화, 외부 URL 처리, 페이지 진입 추적.
     *
     * `@SuppressLint("SetJavaScriptEnabled")`: ShopJoy 의 모든 페이지가 자체 JS 를 사용하므로
     * 의도적으로 활성화. 외부 URL (광고/iframe 등) 도 JS 가 동작하므로
     * `WebChromeClient` / `shouldOverrideUrlLoading` 으로 차단 정책 관리 필요.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        SjLog.fn("setupWebView")

        // ── WebView 기본 설정 ──
        with(binding.webview.settings) {
            javaScriptEnabled = true                // JS 실행 (필수)
            domStorageEnabled = true                // localStorage / sessionStorage
            databaseEnabled = true                  // WebSQL (deprecated 지만 일부 라이브러리 의존)
            loadWithOverviewMode = true             // 페이지가 viewport 보다 클 때 자동 축소
            useWideViewPort = true                  // viewport 메타 태그 적용
            mediaPlaybackRequiresUserGesture = false // 비디오/오디오 자동재생 허용 (이벤트 페이지)
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE  // HTTPS 안에 HTTP 리소스 허용
            cacheMode = WebSettings.LOAD_DEFAULT    // 표준 HTTP 캐시 정책
            // User-Agent 에 앱 식별자 추가 — 백엔드에서 모바일 앱 트래픽 구분용.
            userAgentString = userAgentString + " ShopjoyFoApp/${BuildConfig.VERSION_NAME}"
            SjLog.d("webview settings configured",
                "javaScriptEnabled" to javaScriptEnabled,
                "domStorageEnabled" to domStorageEnabled,
                "userAgent" to userAgentString)
        }

        // Chrome DevTools 에서 chrome://inspect 로 디버깅 가능하게 함 (디버그 빌드만).
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        // ── WebViewClient — URL 진입 / 페이지 로드 단계 추적 ──
        binding.webview.webViewClient = object : WebViewClient() {

            /**
             * URL 진입 시점에 호출 — true 반환 시 WebView 가 로드를 중단하고 앱이 직접 처리.
             *
             * **분기 정책**:
             * 1. `intent:` / `kakao*:` / `kakaopay:` / `supertoss:` / `ispmobile:` → 외부 앱 위임
             * 2. `shopjoy-fo:` → 자체 딥링크 (WebView JS 로 전달)
             * 3. 그 외 (http/https) → WebView 가 직접 로드 (false)
             */
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                SjLog.webview("shouldOverrideUrlLoading", url, "method" to request.method)

                // 카카오 / 토스 / 결제 SDK 가 띄우는 외부 앱 scheme.
                if (url.startsWith("intent:") || url.startsWith("kakaolink:") ||
                    url.startsWith("kakaotalk:") || url.startsWith("kakaopay:") ||
                    url.startsWith("supertoss:") || url.startsWith("ispmobile:")) {
                    SjLog.webview("→ externalScheme", url)
                    return openExternalScheme(url)
                }
                // 자체 딥링크 (결제 콜백 등) — WebView 내부 JS 로 전달하여 SPA 라우팅 처리.
                if (url.startsWith("shopjoy-fo:")) {
                    SjLog.webview("→ deepLink", url)
                    handleDeepLink(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
                SjLog.webview("→ allow webview load", url)
                return false
            }

            /** 페이지 로딩 시작 — progress 표시. */
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                SjLog.webview("onPageStarted", url)
                binding.progress.visibility = View.VISIBLE
            }

            /** 페이지 로딩 완료 — progress 숨김. */
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                SjLog.webview("onPageFinished", url)
                binding.progress.visibility = View.GONE
            }

            /** 네트워크 에러 / 4xx/5xx 응답 시 호출 (Lollipop 23+). */
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                SjLog.e("WebView error", null,
                    "url" to request?.url?.toString(),
                    "errorCode" to error?.errorCode,
                    "description" to error?.description?.toString())
            }
        }

        // WebChromeClient — JS confirm/alert, console.log, 진행률 등 처리.
        binding.webview.webChromeClient = WebChromeClient()
        SjLog.d("webview clients set")
    }

    /**
     * 카카오톡 / 토스 / 결제 앱 등 외부 앱 scheme URL 을 OS 에 위임.
     *
     * `intent:` scheme 은 Android 의 표준 intent URI 로, 패키지 / 액션 / fallback URL 등 정보 포함.
     *
     * @return  외부 앱 실행 성공 여부. 실패 시 (해당 앱 미설치 등) WebView 내부 처리 fallback.
     */
    private fun openExternalScheme(url: String): Boolean {
        SjLog.fn("openExternalScheme", "url" to url)
        return try {
            val intent = if (url.startsWith("intent:")) {
                Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
            } else {
                Intent(Intent.ACTION_VIEW, Uri.parse(url))
            }
            startActivity(intent)
            SjLog.d("externalScheme launched", "url" to url)
            true
        } catch (e: Exception) {
            SjLog.e("openExternalScheme failed", e, "url" to url)
            false
        }
    }

    /**
     * Activity 시작 시 초기 URL 로드.
     *
     * 딥링크 (`shopjoy-fo://...`) 로 시작된 경우에도 일단 BASE_URL 을 로드한 뒤
     * WebView 의 JS 에 딥링크 정보를 전달하여 SPA 라우팅에 맡김.
     */
    private fun loadInitialUrl(intent: Intent?) {
        SjLog.fn("loadInitialUrl", "intent.data" to intent?.dataString)
        val url = intent?.dataString?.takeIf { it.startsWith("shopjoy-fo:") }
            ?.let {
                SjLog.d("incoming via deepLink — load BASE_URL then forward")
                handleDeepLink(intent)
                BuildConfig.BASE_URL
            }
            ?: BuildConfig.BASE_URL
        SjLog.webview("loadUrl (initial)", url)
        binding.webview.loadUrl(url)
    }

    /**
     * 딥링크 URL 을 WebView JS 로 전달.
     *
     * WebView 안의 JS 에 `window.onAppDeepLink` 함수가 정의되어 있어야 동작 (웹 코드 책임).
     * 결제 콜백 등에서 사용.
     */
    private fun handleDeepLink(intent: Intent) {
        SjLog.fn("handleDeepLink", "data" to intent.data?.toString())
        val data = intent.data ?: return
        val js = "if (window.onAppDeepLink) window.onAppDeepLink('${data}');"
        SjLog.webview("evaluateJavascript (deepLink)", data.toString(), "js" to js)
        binding.webview.evaluateJavascript(js, null)
    }

    /**
     * Android 13 (API 33, TIRAMISU) 이상에서 POST_NOTIFICATIONS 런타임 권한 요청.
     *
     * 12 (API 32) 이하는 권한 자동 부여 — 별도 요청 불필요.
     */
    private fun requestPushPermissionIfNeeded() {
        SjLog.fn("requestPushPermissionIfNeeded", "sdkInt" to android.os.Build.VERSION.SDK_INT)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            SjLog.d("requesting POST_NOTIFICATIONS permission")
            pushPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        } else {
            SjLog.d("permission auto-granted (SDK < TIRAMISU)")
        }
    }

    /**
     * 하드웨어 뒤로가기 버튼 처리 등록.
     *
     * **정책**: WebView 의 history.back() 이 가능하면 WebView 가 우선 처리.
     * history 의 첫 페이지면 Activity 종료 (앱 종료 X — 사용자 선택).
     */
    private fun registerBackPressed() {
        SjLog.fn("registerBackPressed")
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val canGoBack = binding.webview.canGoBack()
                SjLog.fn("OnBackPressedCallback.handleOnBackPressed", "canGoBack" to canGoBack)
                if (canGoBack) {
                    SjLog.d("webview.goBack()")
                    binding.webview.goBack()
                } else {
                    SjLog.d("finish activity (no back history)")
                    finish()
                }
            }
        })
    }
}
