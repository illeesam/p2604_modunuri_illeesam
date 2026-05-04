#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Container Restart
# ============================================================
#
#  Role : Restart the Docker container on NAS.
#         JVM stops, then Spring Boot re-launches with the new JAR.
#         Run this after 02_upload.sh completes.
#
#  [Note] Spring Boot takes about 20~40 seconds to fully start.
#         After restart, check logs with 04_logs.sh.
#
#  NAS      : illeesam.synology.me:10022
#  Container: 210-ecadminApi
#  Password : song5xxxxx
#

echo "============================================================"
echo " ShopJoy EcAdminApi - Container Restart"
echo "============================================================"
echo ""
echo "[STEP 1/1] SSH into NAS and running docker restart ..."
echo "           Password: song5xxxxx"
echo ""

ssh -p 10022 illeesam@illeesam.synology.me \
    "docker restart 210-ecadminApi && echo '[OK] Restart complete' && docker ps --filter name=210-ecadminApi --format 'STATUS: {{.Status}}'"

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] SSH command failed."
    echo " - Check NAS is reachable (illeesam.synology.me:10022)"
    echo " - Password: song5xxxxx"
    echo " - Check container exists: run 08_status.sh"
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Container restart complete."
echo " Check startup logs : 04_logs.sh"
echo " Health check URL   : http://illeesam.synology.me:21080/actuator/health"
echo "============================================================"
