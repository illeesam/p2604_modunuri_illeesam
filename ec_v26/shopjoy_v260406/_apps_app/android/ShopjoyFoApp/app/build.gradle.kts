plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    // FCM 적용 시 활성화: id("com.google.gms.google-services")
}

android {
    namespace = "com.shopjoy.fo"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.shopjoy.fo"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    // 환경별 build flavor — local / dev / prod
    flavorDimensions += "env"
    productFlavors {
        create("local") {
            dimension = "env"
            applicationIdSuffix = ".local"
            versionNameSuffix = "-local"
            buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:5501\"")
            // ↑ 안드로이드 에뮬레이터에서 호스트 PC localhost:5501 접근
            //   실기기에서는 PC LAN IP (예: http://192.168.0.x:5501) 로 변경
            resValue("string", "app_name", "ShopJoy FO Local")
        }
        create("dev") {
            dimension = "env"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "BASE_URL", "\"https://illeesam.netlify.app/mainframe#sj_index\"")
            resValue("string", "app_name", "ShopJoy FO Dev")
        }
        create("prod") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://illeesam.netlify.app/mainframe#sj_index\"")
            resValue("string", "app_name", "ShopJoy")
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    // FCM 푸시 알림 — 설정 후 활성화
    // implementation(platform("com.google.firebase:firebase-bom:33.4.0"))
    // implementation("com.google.firebase:firebase-messaging-ktx")

    // 카카오 SDK — 결제 연동 시 활성화 (필요한 모듈만)
    // implementation("com.kakao.sdk:v2-user:2.20.6")
    // implementation("com.kakao.sdk:v2-talk:2.20.6")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
