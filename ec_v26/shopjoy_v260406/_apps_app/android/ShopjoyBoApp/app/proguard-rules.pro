# ShopjoyBoApp ProGuard rules

-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keep class com.shopjoy.bo.** { *; }

# ===== SjLog Release 빌드에서도 유지 =====
# 사용자 요구사항: 모든 로그는 빌드 환경 관계없이 항상 콘솔 출력
-keep class com.shopjoy.bo.util.SjLog { *; }
-keep class com.shopjoy.bo.util.SjLog$Companion { *; }
