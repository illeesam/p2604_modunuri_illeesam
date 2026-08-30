#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Full Redeploy (One-Click)
# ============================================================
#
#  Role : Automates all 3 steps after source code changes.
#         Stops immediately if any step fails.
#
#  Steps:
#    [1] ./gradlew clean build -x test  (source code to JAR)
#    [2] SCP upload                     (JAR to NAS)
#    [3] docker restart                 (reload new JAR on NAS)
#
#  Password: song5xxxxx  (prompted once each at steps [2] and [3])
#

PROJECT_DIR="C:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi"
NAS_HOST="illeesam.synology.me"
NAS_PORT="10022"
NAS_USER="illeesam"
NAS_REMOTE_PATH="/volume1/docker/ecadminapi/app/EcAdminApi.jar"
CONTAINER="210-ecadminApi"

echo "============================================================"
echo " ShopJoy EcAdminApi - Full Redeploy (One-Click)"
echo "============================================================"
echo ""

# ═══════════════════════════════════════
#  STEP 1: Gradle Clean Build
#  clean  : remove previous build cache
#           (prevents old Mapper XML from staying in JAR)
#  build  : compile all sources and generate JAR
#  -x test: skip unit tests to save time
# ═══════════════════════════════════════
echo "[STEP 1/3] Gradle clean build -x test ..."
echo "           This may take 1~3 minutes. Please wait."
echo ""

cd "$PROJECT_DIR"
./gradlew clean build -x test

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Build failed. Redeploy aborted."
    echo "        Check the BUILD FAILED message above."
    exit 1
fi
echo "[STEP 1/3] Build complete."
echo ""

# ═══════════════════════════════════════
#  STEP 2: SCP Upload
#  Auto-detects EcAdminApi-*.jar under build/libs/
#  Overwrites /volume1/.../EcAdminApi.jar on NAS.
# ═══════════════════════════════════════
JAR_FILE=$(find build/libs -name "EcAdminApi-*.jar" 2>/dev/null | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "[ERROR] JAR file not found. Check build output."
    exit 1
fi

echo "[STEP 2/3] SCP upload: $JAR_FILE"
echo "           Password: song5xxxxx"
echo ""

scp -P "$NAS_PORT" "$JAR_FILE" "$NAS_USER@$NAS_HOST:$NAS_REMOTE_PATH"

if [ $? -ne 0 ]; then
    echo "[ERROR] Upload failed. Redeploy aborted."
    echo "        Check NAS connectivity."
    exit 1
fi
echo "[STEP 2/3] Upload complete."
echo ""

# ═══════════════════════════════════════
#  STEP 3: Container Restart
#  docker restart: stops then starts the container.
#  On restart, the container reads the new EcAdminApi.jar
#  and Spring Boot re-launches. Takes about 20~40 seconds.
# ═══════════════════════════════════════
echo "[STEP 3/3] Restarting container: $CONTAINER"
echo "           Password: song5xxxxx"
echo ""

ssh -p "$NAS_PORT" "$NAS_USER@$NAS_HOST" \
    "docker restart $CONTAINER && docker ps --filter name=$CONTAINER --format 'STATUS: {{.Status}}'"

if [ $? -ne 0 ]; then
    echo "[ERROR] Container restart failed."
    echo "        Check NAS SSH and container status with 08_status.sh."
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Full redeploy complete."
echo " Spring Boot takes about 20~40 seconds to fully start."
echo " Health : http://$NAS_HOST:21080/actuator/health"
echo " Swagger: http://$NAS_HOST:21080/swagger-ui.html"
echo " Logs   : run 04_logs.sh"
echo "============================================================"
