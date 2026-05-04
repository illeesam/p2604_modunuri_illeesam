#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Live Log Stream
# ============================================================
#
#  Role : Stream real-time container logs from NAS.
#         Use this to monitor Spring Boot startup, API calls,
#         and error messages in real time.
#
#  [--tail 100] Shows the last 100 lines from current time.
#  [-f]         Follows new log output as it appears.
#               Press Ctrl+C to stop streaming.
#
#  Startup complete message:
#    "Started EcAdminApiApplication in X.XXX seconds"
#
#  NAS      : illeesam.synology.me:10022
#  Container: 210-ecadminApi
#  Password : song5xxxxx
#

echo "============================================================"
echo " ShopJoy EcAdminApi - Live Log Stream"
echo "============================================================"
echo ""
echo "[STEP 1/1] Starting live log stream ... (Ctrl+C to stop)"
echo "           Password: song5xxxxx"
echo ""

ssh -p 10022 illeesam@illeesam.synology.me \
    "docker logs -f --tail 100 210-ecadminApi"

echo ""
echo "[INFO] Log stream ended (Ctrl+C or SSH connection closed)."
