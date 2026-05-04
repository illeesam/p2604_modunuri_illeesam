#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Container Stop
# ============================================================
#
#  Role : Stop the running container on NAS.
#         The container is NOT deleted. Settings are preserved.
#         You can restart anytime with 06_start.sh.
#
#  [docker stop vs docker rm]
#    docker stop : Stops the container only.  (this script)
#    docker rm   : DELETES the container.
#                  After rm, you must re-run docker run to recreate.
#                  Do NOT run docker rm in production.
#
#  Container: 210-ecadminApi
#  Password : song5xxxxx
#

echo "============================================================"
echo " ShopJoy EcAdminApi - Container Stop"
echo "============================================================"
echo ""

read -p "Are you sure you want to stop the server? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "[INFO] Cancelled."
    exit 0
fi

echo ""
echo "[STEP 1/1] Running docker stop via SSH ..."
echo "           Password: song5xxxxx"
echo "           Waits up to 10 seconds for in-progress requests to finish."
echo ""

ssh -p 10022 illeesam@illeesam.synology.me \
    "docker stop 210-ecadminApi && echo '[OK] Stop complete'"

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Stop failed."
    echo " - Check NAS is reachable (illeesam.synology.me:10022)"
    echo " - Check container status: run 08_status.sh"
    exit 1
fi

echo ""
echo "============================================================"
echo " [SUCCESS] Container stopped."
echo " The container is NOT deleted. Settings are preserved."
echo " To restart: run 06_start.sh"
echo "============================================================"
