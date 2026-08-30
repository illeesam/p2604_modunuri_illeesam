#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Container Start
# ============================================================
#
#  Role : Start a stopped container on NAS.
#         All settings (ports, volumes, env vars) are preserved.
#         No need to run docker run again.
#
#  [Note] Spring Boot takes about 20~40 seconds to fully start.
#         Health check: http://illeesam.synology.me:21080/actuator/health
#
#  Container: 210-ecadminApi
#  Password : song5xxxxx
#

echo "============================================================"
echo " ShopJoy EcAdminApi - Container Start"
echo "============================================================"
echo ""
echo "[STEP 1/1] Running docker start via SSH ..."
echo "           Password: song5xxxxx"
echo ""

ssh -p 10022 illeesam@illeesam.synology.me \
    "docker start 210-ecadminApi && echo '[OK] Start complete' && docker ps --filter name=210-ecadminApi --format 'STATUS: {{.Status}}'"

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Start failed."
    echo " - Check NAS is reachable (illeesam.synology.me:10022)"
    echo " - Check container exists: run 08_status.sh"
    echo " - If container is missing, see README [6] docker run command."
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Container started."
echo " Spring Boot takes about 20~40 seconds to fully start."
echo " Health : http://illeesam.synology.me:21080/actuator/health"
echo " Logs   : run 04_logs.sh"
echo "============================================================"
