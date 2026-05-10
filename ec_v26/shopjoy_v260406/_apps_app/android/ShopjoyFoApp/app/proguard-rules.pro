# ShopjoyFoApp ProGuard rules

# WebView JS 인터페이스 보호
-keepattributes *Annotation*
-keepattributes JavascriptInterface

-keep class com.shopjoy.fo.** { *; }

# OkHttp / Retrofit (필요시)
# -dontwarn okhttp3.**
# -dontwarn okio.**

# ===== SjLog Release 빌드에서도 유지 =====
# 사용자 요구사항: 모든 로그는 빌드 환경 관계없이 항상 콘솔 출력
-keep class com.shopjoy.fo.util.SjLog { *; }
-keep class com.shopjoy.fo.util.SjLog$Companion { *; }
