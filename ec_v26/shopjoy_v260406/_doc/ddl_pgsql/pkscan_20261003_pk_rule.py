# -*- coding: utf-8 -*-
"""shopjoy_2604 전체 테이블 PK 규칙 점검 — 규칙: 접두어(대문자 2~5) + yyMMddHHmmss(12자리) + 난수 4자리 (CmUtil.generateId).
   DB_PASSWORD 는 환경변수로만 받는다(파일 기록 금지). 사용: python pkscan.py [tableFilter]"""
import os, re, sys, json
import psycopg2
conn = psycopg2.connect(host="illeesam.synology.me", port=17632, dbname="postgres", user="postgres", password=os.environ["DB_PASSWORD"], connect_timeout=10)
conn.set_client_encoding("UTF8")
cur = conn.cursor()
cur.execute("""
SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position)
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
JOIN information_schema.columns c ON c.table_schema = kcu.table_schema AND c.table_name = kcu.table_name AND c.column_name = kcu.column_name
WHERE tc.table_schema = 'shopjoy_2604' AND tc.constraint_type = 'PRIMARY KEY' AND c.data_type IN ('character varying','character','text')
GROUP BY tc.table_name ORDER BY tc.table_name""")
pks = cur.fetchall()
RULE = r'^[A-Z]{2,5}[0-9]{16}$'
flt = sys.argv[1] if len(sys.argv) > 1 else ""
total_bad = 0
print(f"{'table':32} {'pk':28} {'rows':>7} {'bad':>6}  samples")
for tbl, cols in pks:
    if flt and flt not in tbl: continue
    col = cols.split(",")[0]
    if "," in cols:  # 복합키는 첫 컬럼만 본다
        pass
    try:
        cur.execute(f'SELECT count(*), count(*) FILTER (WHERE "{col}" !~ %s) FROM shopjoy_2604."{tbl}"', (RULE,))
        n, bad = cur.fetchone()
        samples = []
        if bad:
            cur.execute(f'SELECT "{col}" FROM shopjoy_2604."{tbl}" WHERE "{col}" !~ %s ORDER BY 1 LIMIT 4', (RULE,))
            samples = [r[0] for r in cur.fetchall()]
        total_bad += bad
        if bad or flt:
            print(f"{tbl:32} {cols[:28]:28} {n:7} {bad:6}  {samples}")
    except Exception as e:
        conn.rollback()
        print(f"{tbl:32} {cols[:28]:28} ERR {str(e).splitlines()[0][:80]}")
print(f"\n위반 합계: {total_bad} (테이블 {len(pks)}개 점검)")
