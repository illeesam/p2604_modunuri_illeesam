package com.shopjoy.bo

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
import com.shopjoy.bo.databinding.ActivityMainBinding
import com.shopjoy.bo.util.SjLog

/**
 * ShopjoyBoApp 의 단일 [Activity] (관리자용 WebView 호스트).
 *
 * **FO 와의 차이점**:
 * - 외부 결제 앱 (카카오/토스) 위임 분기 단순화 (관리자는 결제 안 함)
 * - 자체 딥링크 scheme 이 `shopjoy-bo://` (FO 는 `shopjoy-fo://`)
 *
 * @see com.shopjoy.fo.MainActivity  FO 앱의 같은 클래스 — 자세한 주석은 거기 참조
 */
class MainActivity : AppCompatActivity() {

    /** ViewBinding — `activity_main.xml` 의 view 들 type-safe 접근. */
    private lateinit var binding: ActivityMainBinding

    /** Android 13+ POST_NOTIFICATIONS 권한 요청 launcher. */
    private val pushPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        SjLog.fn("pushPermissionLauncher.callback", "granted" to granted)
        SjLog.i("POST_NOTIFICATIONS permission result", "granted" to granted)
    }

    /** Activity 생성 + WebView 초기화 + 초기 URL 로드. */
    override fun onCreate(savedInstanceState: Bundle?) {
        SjLog.fn("onCreate", "savedInstanceState" to (savedInstanceState != null))
        SjLog.lifecycle("Activity.onCreate")
        super.onCreate(savedInstanceState)

        // 시스템바 영역까지 콘텐츠 확장.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        SjLog.d("layout inflated and set")

        setupWebView()
        // BO 는 FO 처럼 딥링크 처리 단계 없이 바로 BASE_URL 로드.
        SjLog.webview("loadUrl (initial)", BuildConfig.BASE_URL)
        binding.webview.loadUrl(BuildConfig.BASE_URL)
        requestPushPermissionIfNeeded()
        registerBackPressed()
        SjLog.lifecycle("Activity.onCreate.end")
    }

    // ── 라이프사이클 메서드 (디버깅용 로그만) ──
    override fun onStart()   { SjLog.fn("onStart");   SjLog.lifecycle("Activity.onStart");   super.onStart() }
    override fun onResume()  { SjLog.fn("onResume");  SjLog.lifecycle("Activity.onResume");  super.onResume() }
    override fun onPause()   { SjLog.fn("onPause");   SjLog.lifecycle("Activity.onPause");   super.onPause() }
    override fun onStop()    { SjLog.fn("onStop");    SjLog.lifecycle("Activity.onStop");    super.onStop() }
    override fun onDestroy() { SjLog.fn("onDestroy"); SjLog.lifecycle("Activity.onDestroy"); super.onDestroy() }

    /**
     * 이미 실행 중인 Activity 에 새 Intent — 딥링크 / 푸시 탭 시 호출.
     */
    override fun onNewIntent(intent: Intent) {
        SjLog.fn("onNewIntent", "action" to intent.action, "data" to intent.dataString)
        super.onNewIntent(intent)
        handleDeepLink(intent)
    }

    /**
     * WebView 초기 설정 + WebViewClient (URL 처리) + WebChromeClient.
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        SjLog.fn("setupWebView")

        // WebView 기본 설정 — 관리자 페이지 (bo.html) 가 동작하도록 JS / DOM Storage 활성화.
        with(binding.webview.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
            // User-Agent 에 BO 앱 식별자 추가 — 백엔드에서 BO 트래픽 구분용.
            userAgentString = userAgentString + " ShopjoyBoApp/${BuildConfig.VERSION_NAME}"
            SjLog.d("webview settings configured",
                "javaScriptEnabled" to javaScriptEnabled,
                "domStorageEnabled" to domStorageEnabled,
                "userAgent" to userAgentString)
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        binding.webview.webViewClient = object : WebViewClient() {

            /**
             * URL 진입 분기 — BO 는 자체 딥링크 + intent: 만 처리 (외부 결제 앱 무관).
             */
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url.toString()
                SjLog.webview("shouldOverrideUrlLoading", url, "method" to request.method)
                if (url.startsWith("shopjoy-bo:")) {
                    // 자체 딥링크 — WebView JS 로 전달.
                    SjLog.webview("→ deepLink", url)
                    handleDeepLink(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
                if (url.startsWith("intent:")) {
                    // Android intent URI — 외부 앱 실행 시도.
                    SjLog.webview("→ externalIntent", url)
                    return runCatching {
                        val i = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        startActivity(i)
                        SjLog.d("externalIntent launched", "url" to url)
                        true
                    }.onFailure { SjLog.e("externalIntent failed", it, "url" to url) }
                     .getOrDefault(false)
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

            /** 네트워크 / HTTP 에러. */
            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                SjLog.e("WebView error", null,
                    "url" to request?.url?.toString(),
                    "errorCode" to error?.errorCode,
                    "description" to error?.description?.toString())
            }
        }
        binding.webview.webChromeClient = WebChromeClient()
        SjLog.d("webview clients set")
    }

    /**
     * 딥링크 URL 을 WebView JS 로 전달 — `window.onAppDeepLink(url)` 호출.
     */
    private fun handleDeepLink(intent: Intent) {
        SjLog.fn("handleDeepLink", "data" to intent.data?.toString())
        val data = intent.data ?: return
        val js = "if (window.onAppDeepLink) window.onAppDeepLink('${data}');"
        SjLog.webview("evaluateJavascript (deepLink)", data.toString(), "js" to js)
        binding.webview.evaluateJavascript(js, null)
    }

    /** Android 13+ POST_NOTIFICATIONS 권한 요청 (12 이하는 자동 부여). */
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
     * 하드웨어 뒤로가기 — WebView history 우선, history 첫 페이지면 Activity 종료.
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
