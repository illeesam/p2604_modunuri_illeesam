#!/bin/bash
# ============================================================
#  ShopJoy EcAdminApi - Server Status Check
# ============================================================
#
#  Role : Check container status and API health at once.
#         Run this first when something seems wrong.
#
#  Checks:
#    [1] 210-ecadminApi container status (Running / Exited / etc.)
#    [2] 176-postgres-17.2 DB container status
#    [3] API Health Check  (expects: {"status":"UP"})
#
#  Password: song5xxxxx
#

echo "============================================================"
echo " ShopJoy EcAdminApi - Server Status Check"
echo "============================================================"
echo ""

# ── STEP 1: ecadminApi container ─────────────────────────────
echo "[STEP 1/3] Checking ecadminApi container ..."
echo "           Running : OK, server is up"
echo "           Exited  : Server is stopped. Run 06_start.sh to restart."
echo ""
ssh -p 10022 illeesam@illeesam.synology.me \
    "docker ps -a --filter name=210-ecadminApi --format 'NAME: {{.Names}}  STATUS: {{.Status}}  PORTS: {{.Ports}}'"
echo ""

# ── STEP 2: PostgreSQL container ─────────────────────────────
echo "[STEP 2/3] Checking PostgreSQL container ..."
echo "           If DB container is Exited, the API will also fail to connect."
echo ""
ssh -p 10022 illeesam@illeesam.synology.me \
    "docker ps -a --filter name=176-postgres-17.2 --format 'NAME: {{.Names}}  STATUS: {{.Status}}'"
echo ""

# ── STEP 3: API Health Check ──────────────────────────────────
echo "[STEP 3/3] API Health Check ..."
echo "           Expected response: {\"status\":\"UP\"}"
echo ""
curl -s --connect-timeout 5 http://illeesam.synology.me:21080/actuator/health

if [ $? -ne 0 ]; then
    echo ""
    echo "[WARN] API Health Check failed."
    echo "       - Container may still be starting (takes 20~40 sec)"
    echo "       - If container is Exited, run 06_start.sh"
    echo "       - Check startup logs: run 04_logs.sh"
fi
echo ""

echo "============================================================"
echo " Swagger: http://illeesam.synology.me:21080/swagger-ui.html"
echo " Health : http://illeesam.synology.me:21080/actuator/health"
echo "============================================================"
