#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - JAR Upload to NAS (SCP)
# ============================================================
#
#  Role   : Upload the built JAR file to NAS via SCP.
#           The Docker container mounts and runs this JAR.
#
#  Method : SCP (Secure Copy over SSH)
#  Local  : build/libs/EcAdminApi-*.jar  (auto-detected)
#  Remote : /volume1/docker/ecadminapi/app/EcAdminApi.jar
#           (always saved as EcAdminApi.jar on NAS)
#
#  Password: song5xxxxx
#

PROJECT_DIR="C:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi"
NAS_HOST="illeesam.synology.me"
NAS_PORT="10022"
NAS_USER="illeesam"
NAS_REMOTE_PATH="/volume1/docker/ecadminapi/app/EcAdminApi.jar"

echo "============================================================"
echo " ShopJoy EcAdminApi - JAR Upload to NAS (SCP)"
echo "============================================================"
echo ""

cd "$PROJECT_DIR"

# Find JAR file
JAR_FILE=$(find build/libs -name "EcAdminApi-*.jar" 2>/dev/null | head -1)

if [ -z "$JAR_FILE" ]; then
    echo "[ERROR] JAR file not found."
    echo "        Please run 01_build.sh first."
    exit 1
fi

echo "[INFO] JAR to upload : $JAR_FILE"
echo "[INFO] Remote target : $NAS_USER@$NAS_HOST:$NAS_REMOTE_PATH"
echo ""
echo "[STEP 1/1] Uploading via SCP ..."
echo "           Password: song5xxxxx"
echo "           May take 1~2 minutes depending on file size."
echo ""

scp -P "$NAS_PORT" "$JAR_FILE" "$NAS_USER@$NAS_HOST:$NAS_REMOTE_PATH"

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Upload failed!"
    echo " - Check NAS is reachable (illeesam.synology.me)"
    echo " - Password: song5xxxxx"
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Upload completed."
echo " $NAS_HOST:$NAS_REMOTE_PATH"
echo " Next: Run 03_restart.sh to restart the container."
echo "============================================================"
