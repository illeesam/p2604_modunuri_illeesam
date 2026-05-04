#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Gradle Clean Build
# ============================================================
#
#  Role   : Compile source code and generate executable JAR file.
#  Output : build/libs/EcAdminApi-*.jar
#
#  [clean] Deletes previous build cache.
#          Without clean, old Mapper XML may remain in the JAR.
#  [-x test] Skips unit tests to speed up build time.
#

PROJECT_DIR="C:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi"

echo "============================================================"
echo " ShopJoy EcAdminApi - Gradle Clean Build"
echo "============================================================"
echo ""

if [ ! -d "$PROJECT_DIR" ]; then
    echo "[ERROR] Project directory not found:"
    echo "        $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "[INFO] Build directory: $(pwd)"
echo ""

echo "[STEP 1/1] Running: ./gradlew clean build -x test ..."
echo "           This may take 1~3 minutes. Please wait."
echo ""

./gradlew clean build -x test

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Build failed!"
    echo "        Check the BUILD FAILED message above."
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Build completed."
echo " JAR : build/libs/EcAdminApi-*.jar"
echo " Next: Run 02_upload.sh to upload JAR to NAS."
echo "============================================================"
