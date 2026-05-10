plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    // FCM 적용 시 활성화: id("com.google.gms.google-services")
}

android {
    namespace = "com.shopjoy.bo"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.shopjoy.bo"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    flavorDimensions += "env"
    productFlavors {
        create("local") {
            dimension = "env"
            applicationIdSuffix = ".local"
            versionNameSuffix = "-local"
            buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:5501/bo.html\"")
            resValue("string", "app_name", "ShopJoy BO Local")
        }
        create("dev") {
            dimension = "env"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "BASE_URL", "\"https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html\"")
            resValue("string", "app_name", "ShopJoy BO Dev")
        }
        create("prod") {
            dimension = "env"
            buildConfigField("String", "BASE_URL", "\"https://illeesam.netlify.app/ec_v26/shopjoy_v260406/bo.html\"")
            resValue("string", "app_name", "ShopJoy BO")
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
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

    // 생체인증 (관리자 빠른 로그인)
    implementation("androidx.biometric:biometric:1.1.0")

    // FCM 푸시 — 설정 후 활성화
    // implementation(platform("com.google.firebase:firebase-bom:33.4.0"))
    // implementation("com.google.firebase:firebase-messaging-ktx")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
